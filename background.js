// Set default settings on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    apiKey: '',
    defaultTone: 'casual',
    useServerProxy: true,
    hashtagCount: 5,
    captionLength: 'medium'
  });
  console.log('Instagram Caption Generator installed with default settings');
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'generateCaption') {
    console.log("Received caption generation request:", message);
    generateCaption(message.data)
      .then(result => {
        console.log("Sending caption generation result:", result);
        sendResponse(result);
      })
      .catch(error => {
        console.error("Error in caption generation:", error);
        sendResponse({ 
          success: false, 
          error: error.message || 'Unknown error occurred' 
        });
      });
    return true; // Keep the message channel open for async response
  } else if (message.type === 'testConnection') {
    testApiConnection()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ 
        success: false, 
        error: error.message 
      }));
    return true;
  }
});

// Helper function to get settings with default values
async function getSettings() {
  return new Promise(resolve => {
    chrome.storage.sync.get({
      apiKey: '',
      useServerProxy: true,
      defaultTone: 'casual',
      hashtagCount: 5,
      captionLength: 'medium'
    }, settings => {
      resolve(settings);
    });
  });
}

// Enhanced function to call the AI API with better error handling
async function generateCaption(data) {
  try {
    // Log the request parameters for debugging
    console.log('Caption generation request parameters:', {
      imageDescription: data.imageDescription?.substring(0, 50) + '...',
      userPrompt: data.userPrompt?.substring(0, 50) + '...',
      tone: data.tone,
      captionLength: data.captionLength,
      hashtagCount: data.hashtagCount,
      hasImageData: !!data.imageData
    });

    // Get settings
    const settings = await getSettings();
    
    // Determine API endpoint with fallback
    const apiEndpoint = settings.useServerProxy 
      ? 'https://your-serverless-function.com/api/generate'
      : 'https://api.openai.com/v1/chat/completions';
    
    console.log('Using API endpoint:', apiEndpoint);
    console.log('Using proxy server:', settings.useServerProxy);
    
    // Set request parameters
    const tone = data.tone || settings.defaultTone;
    const hashtagCount = data.hashtagCount || settings.hashtagCount;
    const captionLength = data.captionLength || settings.captionLength;
    
    // Prepare the prompt for the AI
    const prompt = `
      Generate an Instagram caption for an image with the following description: "${data.imageDescription || 'No description provided'}".
      Additional context: "${data.userPrompt || ''}".
      Tone: ${tone}
      Caption length: ${captionLength} (short: 1-2 sentences, medium: 3-4 sentences, long: 5+ sentences)
      Include ${hashtagCount} relevant hashtags.
      Also generate accessibility-focused alt text for the image.
      Format the response as JSON with keys: caption, hashtags (as array), altText
    `;
    
    // Prepare request headers and body
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add authorization if using direct OpenAI API
    if (!settings.useServerProxy) {
      if (!settings.apiKey) {
        throw new Error('OpenAI API key is missing. Please add it in the extension settings.');
      }
      headers['Authorization'] = `Bearer ${settings.apiKey}`;
    }
    
    // Prepare request body based on API type
    const requestBody = settings.useServerProxy 
      ? {
          prompt,
          imageData: data.imageData
        }
      : {
          model: "gpt-4-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                ...(data.imageData ? [{ 
                  type: "image_url", 
                  image_url: { url: data.imageData }
                }] : [])
              ]
            }
          ],
          max_tokens: 500
        };
    
    // Set up request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      console.log('Making API request...');
      
      // Make the API request
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      console.log('API response status:', response.status);
      
      // Handle error responses
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details available');
        console.error('API error response:', errorText);
        throw new Error(`API error (${response.status}): ${errorText.substring(0, 100)}`);
      }
      
      // Parse the response
      const result = await response.json();
      console.log('API response received successfully');
      
      // Format the result based on API type
      let formattedResult;
      
      if (settings.useServerProxy) {
        // Server proxy already returns formatted result
        formattedResult = result;
      } else {
        // Parse OpenAI response
        try {
          const content = result.choices[0].message.content;
          console.log('Raw content from API:', content.substring(0, 100) + '...');
          
          // Try to parse the JSON response
          formattedResult = JSON.parse(content);
        } catch (parseError) {
          console.error('Failed to parse JSON from API response:', parseError);
          
          // Try to extract JSON from the text response using regex
          const content = result.choices[0].message.content;
          const jsonMatch = content.match(/(\{.*\})/s);
          
          if (jsonMatch) {
            try {
              formattedResult = JSON.parse(jsonMatch[0]);
            } catch (secondParseError) {
              console.error('Failed second JSON parse attempt:', secondParseError);
              
              // Last resort: manually extract parts from the text
              formattedResult = extractFormattedResult(content);
            }
          } else {
            // Manually extract parts from the text
            formattedResult = extractFormattedResult(content);
          }
        }
      }
      
      console.log('Formatted result:', formattedResult);
      
      return {
        success: true,
        caption: formattedResult.caption,
        hashtags: formattedResult.hashtags,
        altText: formattedResult.altText
      };
      
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        throw new Error('API request timed out after 30 seconds');
      }
      throw fetchError;
    }
    
  } catch (error) {
    console.error('Error generating caption:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

// Helper function to extract formatted result from text when JSON parsing fails
function extractFormattedResult(content) {
  console.log('Attempting to extract formatted result from text');
  
  // Extract caption
  const captionMatch = content.match(/caption:?\s*(.*?)(?=hashtags:|altText:|$)/is);
  const caption = captionMatch ? captionMatch[1].trim() : 'No caption generated';
  
  // Extract hashtags
  let hashtags = [];
  const hashtagsMatch = content.match(/hashtags:?\s*(.*?)(?=caption:|altText:|$)/is);
  
  if (hashtagsMatch) {
    // Try to extract hashtags from the hashtags section
    hashtags = hashtagsMatch[1].match(/#[a-zA-Z0-9_]+/g) || [];
  } else {
    // Fallback: extract all hashtags from the entire content
    hashtags = content.match(/#[a-zA-Z0-9_]+/g) || [];
  }
  
  // Extract alt text
  const altTextMatch = content.match(/altText:?\s*(.*?)(?=caption:|hashtags:|$)/is);
  const altText = altTextMatch ? altTextMatch[1].trim() : 'No alt text generated';
  
  return {
    caption,
    hashtags,
    altText
  };
}

// Function to test API connectivity
async function testApiConnection() {
  try {
    const settings = await getSettings();
    
    let testEndpoint;
    let testHeaders = { 'Content-Type': 'application/json' };
    let testBody;
    let method;
    
    if (settings.useServerProxy) {
      testEndpoint = 'https://your-serverless-function.com/api/test';
      method = 'POST';
      testBody = JSON.stringify({ test: true });
    } else {
      if (!settings.apiKey) {
        return { 
          success: false,
          error: 'OpenAI API key is missing. Please add it in the extension settings.'
        };
      }
      
      testEndpoint = 'https://api.openai.com/v1/models';
      testHeaders['Authorization'] = `Bearer ${settings.apiKey}`;
      method = 'GET';
    }
    
    console.log(`Testing API connection to ${testEndpoint}`);
    
    const response = await fetch(testEndpoint, {
      method,
      headers: testHeaders,
      body: method === 'POST' ? testBody : undefined
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details available');
      return {
        success: false,
        status: response.status,
        error: `API error (${response.status}): ${errorText.substring(0, 100)}`
      };
    }
    
    return {
      success: true,
      status: response.status,
      message: 'Connection successful'
    };
  } catch (error) {
    console.error('API connection test failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown connection error'
    };
  }
}

// Function to log errors to help with debugging
function logError(message, error) {
  console.error(`${message}:`, error);
  
  // Additional debug information
  console.debug('Browser:', navigator.userAgent);
  console.debug('Extension version:', chrome.runtime.getManifest().version);
  
  // Return formatted error for display
  return {
    message: error.message || 'Unknown error',
    stack: error.stack,
    time: new Date().toISOString()
  };
}