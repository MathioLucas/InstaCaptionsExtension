// lib/openai.js
// Handles all OpenAI API interactions

/**
 * OpenAI API handler for the Instagram Caption Generator extension
 * This file manages all interactions with the OpenAI API or proxy server
 */

class OpenAIHandler {
  constructor(options = {}) {
    this.apiKey = options.apiKey || null;
    this.useProxy = options.useProxy !== undefined ? options.useProxy : true;
    this.proxyUrl = options.proxyUrl || 'https://your-deployed-proxy-url.com/api/generate';
    this.defaultModel = 'gpt-4-vision-preview';
    this.maxTokens = options.maxTokens || 800;
    this.temperature = options.temperature || 0.7;
  }

  /**
   * Updates configuration settings
   * @param {Object} options - Configuration options
   */
  updateConfig(options = {}) {
    if (options.apiKey) this.apiKey = options.apiKey;
    if (options.useProxy !== undefined) this.useProxy = options.useProxy;
    if (options.proxyUrl) this.proxyUrl = options.proxyUrl;
    if (options.maxTokens) this.maxTokens = options.maxTokens;
    if (options.temperature) this.temperature = options.temperature;
  }

  /**
   * Generate caption based on prompt and optional image
   * @param {Object} params - Generation parameters
   * @param {string} params.prompt - Text prompt for generation
   * @param {string} params.imageData - Base64 encoded image data (optional)
   * @param {string} params.tone - Desired tone for the caption
   * @param {number} params.hashtagCount - Number of hashtags to include
   * @returns {Promise<Object>} - Generated caption, hashtags, and alt text
   */
  async generateCaption({ prompt, imageData = null, tone = 'casual', hashtagCount = 5 }) {
    try {
      // Add tone to the prompt
      const enhancedPrompt = `Generate an Instagram caption with a ${tone} tone for this content: ${prompt}. Include ${hashtagCount} relevant hashtags and a descriptive alt text.`;
      
      if (this.useProxy) {
        // Use the proxy server approach
        return await this.generateViaProxy({ prompt: enhancedPrompt, imageData, hashtagCount });
      } else {
        // Direct API call approach (requires user's API key)
        return await this.generateDirect({ prompt: enhancedPrompt, imageData, hashtagCount });
      }
    } catch (error) {
      console.error('Error generating caption:', error);
      throw new Error(`Failed to generate caption: ${error.message}`);
    }
  }

  /**
   * Generate caption via proxy server
   * @private
   * @param {Object} params - Generation parameters
   * @returns {Promise<Object>} - Generated content
   */
  async generateViaProxy({ prompt, imageData, hashtagCount }) {
    const response = await fetch(this.proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, imageData, hashtagCount }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server responded with status ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Generate caption via direct API call
   * @private
   * @param {Object} params - Generation parameters
   * @returns {Promise<Object>} - Generated content
   */
  async generateDirect({ prompt, imageData, hashtagCount }) {
    if (!this.apiKey) {
      throw new Error('API key is required for direct API calls');
    }

    // Prepare messages for OpenAI API
    const messages = [
      { 
        role: 'system', 
        content: 'You are an expert Instagram caption writer who helps creators craft engaging, on-brand captions with relevant hashtags.' 
      },
      { 
        role: 'user', 
        content: []
      }
    ];
    
    // Add text prompt
    messages[1].content.push({
      type: 'text',
      text: prompt
    });
    
    // Add image if provided
    if (imageData) {
      messages[1].content.push({
        type: 'image_url',
        image_url: {
          url: imageData,
          detail: 'low' // Use low detail to save tokens
        }
      });
    }

    // Call OpenAI API directly
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.defaultModel,
        messages: messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `OpenAI API responded with status ${response.status}`);
    }

    const data = await response.json();
    const rawResponse = data.choices[0].message.content;
    
    // Process and format the response
    return this.parseResponse(rawResponse, hashtagCount);
  }

  /**
   * Parse and structure the raw API response
   * @private
   * @param {string} rawResponse - Raw response from OpenAI
   * @param {number} hashtagCount - Desired number of hashtags
   * @returns {Object} - Structured response with caption, hashtags, and alt text
   */
  parseResponse(rawResponse, hashtagCount) {
    try {
      // Try to parse as JSON first
      return JSON.parse(rawResponse);
    } catch (e) {
      // If not valid JSON, use text parsing
      const lines = rawResponse.split('\n');
      let caption = '';
      let hashtags = [];
      let altText = '';
      
      // Simple parsing - look for sections in the response
      let currentSection = 'caption';
      
      for (const line of lines) {
        if (line.toLowerCase().includes('caption:')) {
          currentSection = 'caption';
          caption = line.replace(/caption:/i, '').trim();
        } else if (line.toLowerCase().includes('hashtags:')) {
          currentSection = 'hashtags';
          const hashtagLine = line.replace(/hashtags:/i, '').trim();
          hashtags = hashtagLine.split(/\s+/).map(tag => tag.replace(/^#/, ''));
        } else if (line.toLowerCase().includes('alt text:') || line.toLowerCase().includes('alt-text:')) {
          currentSection = 'altText';
          altText = line.replace(/alt[- ]text:/i, '').trim();
        } else {
          // Add content to current section
          if (currentSection === 'caption') {
            caption += ' ' + line.trim();
          } else if (currentSection === 'hashtags') {
            const tags = line.trim().split(/\s+/).map(tag => tag.replace(/^#/, ''));
            hashtags = [...hashtags, ...tags];
          } else if (currentSection === 'altText') {
            altText += ' ' + line.trim();
          }
        }
      }
      
      // Clean up
      caption = caption.trim();
      hashtags = hashtags.filter(tag => tag);
      altText = altText.trim();
      
      return { caption, hashtags, altText };
    }
  }
}

// Export the handler
export default OpenAIHandler;