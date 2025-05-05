// Enhanced content.js script for Instagram Caption Generator
// This script improves DOM detection and UI injection for Instagram's interface

// More robust selectors for Instagram's dynamic UI
const instagramDOM = {
  // Enhanced selectors for Instagram's UI elements
  selectors: {
    captionTextarea: [
      'textarea[aria-label="Write a caption..."]', 
      'textarea[placeholder="Write a caption..."]',
      '[contenteditable="true"][role="textbox"]',
      '[data-lexical-editor="true"]'
    ],
    createPostPage: [
      'div[role="dialog"] form',
      'div[role="dialog"] div[role="presentation"]',
      'div[role="dialog"] div[contenteditable="true"]',
      'div[role="dialog"]'
    ],
    imageUploadArea: [
      '[role="button"][tabindex="0"]:has(svg)',
      'div[role="dialog"] img'
    ],
    altTextInputArea: [
      'textarea[aria-label="Write alt text..."]',
      'textarea[placeholder="Write alt text..."]',
      '[contenteditable="true"][aria-label*="alt"]'
    ],
    submitButton: 'button[type="submit"]'
  },
  
  // Improved method to find elements using multiple selectors
  findElement(selectorArray) {
    if (typeof selectorArray === 'string') {
      return document.querySelector(selectorArray);
    }
    
    for (const selector of selectorArray) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
    return null;
  },
  
  // Enhanced check for post creation page
  isOnCreatePostPage() {
    for (const selector of this.selectors.createPostPage) {
      if (document.querySelector(selector)) {
        // Extra validation: look for caption textarea or image
        if (this.getCaptionTextarea() || document.querySelector('div[role="dialog"] img')) {
          return true;
        }
      }
    }
    return false;
  },
  
  // Get the caption textarea with enhanced detection
  getCaptionTextarea() {
    return this.findElement(this.selectors.captionTextarea);
  },
  
  // Get the alt text input area
  getAltTextInput() {
    return this.findElement(this.selectors.altTextInputArea);
  },
  
  // Check if an image has been uploaded with better detection
  hasUploadedImage() {
    // Check for any image within the dialog
    const dialog = this.findElement(this.selectors.createPostPage);
    if (dialog && dialog.querySelector('img')) {
      return true;
    }
    return false;
  },
  
  // Get the closest valid insertion point
  getUIInsertionPoint() {
    // Try to get the caption textarea as primary insertion point
    const textarea = this.getCaptionTextarea();
    if (textarea) {
      // Look for the parent container - typically goes up a few levels
      let parent = textarea;
      for (let i = 0; i < 3; i++) {
        if (parent.parentNode) {
          parent = parent.parentNode;
        }
      }
      return parent;
    }
    
    // Fallback: find the dialog and look for a suitable insertion point
    const dialog = this.findElement(this.selectors.createPostPage);
    if (dialog) {
      // Look for common container elements
      const possibleContainers = dialog.querySelectorAll('div > div > div');
      for (const container of possibleContainers) {
        if (container.offsetHeight > 100) {  // Likely a content area
          return container;
        }
      }
      return dialog; // Last resort
    }
    
    return null;
  },
  
  // Insert caption text with support for multiple textarea types
  insertCaption(text) {
    const textarea = this.getCaptionTextarea();
    if (!textarea) return false;
    
    // Handle different types of inputs (standard textarea vs contenteditable)
    if (textarea.tagName === 'TEXTAREA') {
      textarea.value = text;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // For contenteditable elements
      textarea.innerHTML = text.replace(/\n/g, '<br>');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      // Also dispatch blur and focus to ensure Instagram recognizes the change
      textarea.dispatchEvent(new Event('blur', { bubbles: true }));
      textarea.dispatchEvent(new Event('focus', { bubbles: true }));
    }
    
    return true;
  },
  
  // Insert alt text with better support
  insertAltText(text) {
    const altTextArea = this.getAltTextInput();
    if (!altTextArea) return false;
    
    if (altTextArea.tagName === 'TEXTAREA') {
      altTextArea.value = text;
      altTextArea.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      altTextArea.innerHTML = text;
      altTextArea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    return true;
  },
  
  // Try to get the uploaded image data (as a data URL)
  async getUploadedImageData() {
    const img = document.querySelector('div[role="dialog"] img');
    if (!img || !img.src) return null;
    
    // If it's already a data URL, return it
    if (img.src.startsWith('data:')) return img.src;
    
    // Otherwise, try to convert it to a data URL
    try {
      const response = await fetch(img.src);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error('Failed to get image data:', e);
      return null;
    }
  }
};

// Function to create and insert UI elements with improved positioning
function insertCaptionGeneratorUI() {
  // Detect if we're on the right page first
  if (!instagramDOM.isOnCreatePostPage()) {
    return false;
  }
  
  // Don't insert if already present
  if (document.getElementById('caption-generator-ui')) {
    return true;
  }
  
  // Get insertion point with better detection
  const insertionPoint = instagramDOM.getUIInsertionPoint();
  if (!insertionPoint) {
    console.log('Instagram Caption Generator: Could not find insertion point');
    return false;
  }
  
  console.log('Instagram Caption Generator: Found insertion point');
  
  // Create our UI container
  const container = document.createElement('div');
  container.id = 'caption-generator-ui';
  container.className = 'caption-generator-container';
  
  // Add the main button
  const generateButton = document.createElement('button');
  generateButton.textContent = '✨ Generate Caption';
  generateButton.className = 'caption-generator-button';
  generateButton.onclick = handleGenerateButtonClick;
  
  // Add tone selector
  const toneSelector = document.createElement('select');
  toneSelector.id = 'caption-tone-selector';
  toneSelector.className = 'caption-generator-select';
  
  const tones = ['Professional', 'Casual', 'Funny', 'Inspirational', 'Promotional'];
  tones.forEach(tone => {
    const option = document.createElement('option');
    option.value = tone.toLowerCase();
    option.textContent = tone;
    toneSelector.appendChild(option);
  });
  
  // Add length selector
  const lengthSelector = document.createElement('select');
  lengthSelector.id = 'caption-length-selector';
  lengthSelector.className = 'caption-generator-select';
  
  const lengths = ['Short', 'Medium', 'Long'];
  lengths.forEach(length => {
    const option = document.createElement('option');
    option.value = length.toLowerCase();
    option.textContent = length;
    lengthSelector.appendChild(option);
  });
  
  // Add hashtag count input
  const hashtagInput = document.createElement('input');
  hashtagInput.type = 'number';
  hashtagInput.min = '0';
  hashtagInput.max = '30';
  hashtagInput.value = '5';
  hashtagInput.id = 'caption-hashtag-count';
  hashtagInput.className = 'caption-generator-input';
  
  // Add prompt input
  const promptInput = document.createElement('input');
  promptInput.type = 'text';
  promptInput.placeholder = 'Optional: Add context for better captions';
  promptInput.id = 'caption-prompt-input';
  promptInput.className = 'caption-generator-input caption-generator-prompt';
  
  // Add status message area
  const statusMessage = document.createElement('div');
  statusMessage.id = 'caption-generator-status';
  statusMessage.className = 'caption-generator-status';
  
  // Assemble the UI
  const controlsWrapper = document.createElement('div');
  controlsWrapper.className = 'caption-generator-controls';
  
  const row1 = document.createElement('div');
  row1.className = 'caption-generator-row';
  row1.appendChild(document.createTextNode('Tone:'));
  row1.appendChild(toneSelector);
  row1.appendChild(document.createTextNode('Length:'));
  row1.appendChild(lengthSelector);
  row1.appendChild(document.createTextNode('# Hashtags:'));
  row1.appendChild(hashtagInput);
  
  const row2 = document.createElement('div');
  row2.className = 'caption-generator-row';
  row2.appendChild(promptInput);
  row2.appendChild(generateButton);
  
  controlsWrapper.appendChild(row1);
  controlsWrapper.appendChild(row2);
  
  container.appendChild(controlsWrapper);
  container.appendChild(statusMessage);
  
  // Insert our UI element after the insertion point
  insertionPoint.insertAdjacentElement('afterend', container);
  
  // Add a visible indicator for debugging
  const indicator = document.createElement('div');
  indicator.textContent = 'Instagram Caption Generator Active';
  indicator.style.backgroundColor = 'rgba(0, 149, 246, 0.1)';
  indicator.style.color = '#0095f6';
  indicator.style.padding = '4px 8px';
  indicator.style.borderRadius = '4px';
  indicator.style.fontSize = '12px';
  indicator.style.fontWeight = 'bold';
  indicator.style.margin = '4px 0';
  container.insertAdjacentElement('beforebegin', indicator);
  
  // Load saved preferences
  chrome.storage.sync.get(['defaultTone', 'captionLength', 'hashtagCount'], (data) => {
    if (data.defaultTone) toneSelector.value = data.defaultTone;
    if (data.captionLength) lengthSelector.value = data.captionLength;
    if (data.hashtagCount) hashtagInput.value = data.hashtagCount;
  });
  
  console.log('Instagram Caption Generator: UI inserted');
  return true;
}

// Handle the generate button click
async function handleGenerateButtonClick() {
  const statusElement = document.getElementById('caption-generator-status');
  statusElement.textContent = 'Generating caption...';
  statusElement.className = 'caption-generator-status loading';
  
  try {
    // Get user selections
    const tone = document.getElementById('caption-tone-selector').value;
    const captionLength = document.getElementById('caption-length-selector').value;
    const hashtagCount = parseInt(document.getElementById('caption-hashtag-count').value, 10);
    const userPrompt = document.getElementById('caption-prompt-input').value;
    
    // Try to get the image data
    const imageData = await instagramDOM.getUploadedImageData();
    
    // Save preferences
    chrome.storage.sync.set({
      defaultTone: tone,
      captionLength: captionLength,
      hashtagCount: hashtagCount
    });
    
    // Request caption generation from the background script
    chrome.runtime.sendMessage({
      type: 'generateCaption',
      data: {
        tone,
        captionLength,
        hashtagCount,
        userPrompt,
        imageData,
        imageDescription: userPrompt || 'Instagram post image'
      }
    }, (response) => {
      if (response && response.success) {
        // Format the caption with hashtags
        const hashtagText = response.hashtags.map(tag => `#${tag.replace(/^#/, '')}`).join(' ');
        const fullCaption = `${response.caption}\n\n${hashtagText}`;
        
        // Insert the caption and alt text
        instagramDOM.insertCaption(fullCaption);
        
        // Try to insert alt text if that UI is visible
        if (instagramDOM.getAltTextInput()) {
          instagramDOM.insertAltText(response.altText);
        }
        
        // Update status
        statusElement.textContent = 'Caption generated successfully!';
        statusElement.className = 'caption-generator-status success';
        
        // Clear status after a few seconds
        setTimeout(() => {
          statusElement.textContent = '';
          statusElement.className = 'caption-generator-status';
        }, 3000);
      } else {
        // Handle error
        statusElement.textContent = `Error: ${response?.error || 'Failed to generate caption'}`;
        statusElement.className = 'caption-generator-status error';
      }
    });
  } catch (error) {
    // Handle any exceptions
    statusElement.textContent = `Error: ${error.message}`;
    statusElement.className = 'caption-generator-status error';
  }
}

// Improved detection function that runs frequently
function tryToInsertUI() {
  if (document.getElementById('caption-generator-ui')) {
    // UI already inserted, check if it's still valid
    if (!instagramDOM.isOnCreatePostPage()) {
      // We're no longer on the create post page, remove the UI
      const ui = document.getElementById('caption-generator-ui');
      if (ui) ui.remove();
      
      // Also remove the indicator if it exists
      const indicator = document.querySelector('div:contains("Instagram Caption Generator Active")');
      if (indicator) indicator.remove();
    }
    return;
  }
  
  // Try to insert the UI
  if (instagramDOM.isOnCreatePostPage()) {
    console.log('Instagram Caption Generator: Detected create post page');
    insertCaptionGeneratorUI();
  }
}

// Debug logging for Instagram's UI structure
function debugInstagramUI() {
  if (instagramDOM.isOnCreatePostPage()) {
    console.log('Instagram Caption Generator: On create post page');
    console.log('Caption textarea found:', !!instagramDOM.getCaptionTextarea());
    console.log('Image uploaded:', instagramDOM.hasUploadedImage());
    console.log('Insertion point found:', !!instagramDOM.getUIInsertionPoint());
  }
}
// Add these functions to your content script to improve error handling

// Display a more user-friendly error message
function showError(message) {
  const captionUI = document.getElementById('caption-generator-ui');
  if (!captionUI) return;
  
  // Create or update error container
  let errorContainer = document.querySelector('.caption-generator-error');
  
  if (!errorContainer) {
    errorContainer = document.createElement('div');
    errorContainer.className = 'caption-generator-error';
    errorContainer.style.backgroundColor = '#ffebee';
    errorContainer.style.border = '1px solid #f44336';
    errorContainer.style.borderRadius = '4px';
    errorContainer.style.padding = '10px';
    errorContainer.style.margin = '10px 0';
    errorContainer.style.color = '#d32f2f';
    errorContainer.style.fontSize = '14px';
  }
  
  // Create error content
  errorContainer.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 5px;">Error Generating Caption</div>
    <div>${message}</div>
    <div style="margin-top: 8px; font-size: 12px;">
      <button id="debug-connection-btn" style="background-color: #2196f3; color: white; border: none; 
      border-radius: 4px; padding: 5px 10px; cursor: pointer; margin-right: 8px;">
        Test Connection
      </button>
      <button id="show-debug-btn" style="background-color: #757575; color: white; border: none; 
      border-radius: 4px; padding: 5px 10px; cursor: pointer;">
        Debug Panel
      </button>
    </div>
    <ul style="margin-top: 8px; margin-bottom: 0; padding-left: 20px;">
      <li style="margin: 3px 0; font-size: 12px;">Check your API key in extension settings</li>
      <li style="margin: 3px 0; font-size: 12px;">Verify your internet connection</li>
      <li style="margin: 3px 0; font-size: 12px;">Make sure the API endpoint is correct</li>
    </ul>
  `;
  
  // Append to UI
  captionUI.appendChild(errorContainer);
  
  // Add event listeners for buttons
  document.getElementById('debug-connection-btn').addEventListener('click', testApiConnection);
  document.getElementById('show-debug-btn').addEventListener('click', showDebugPanel);
}

// Test API connection
function testApiConnection() {
  const statusText = document.createElement('div');
  statusText.textContent = 'Testing API connection...';
  statusText.style.fontStyle = 'italic';
  statusText.style.marginTop = '5px';
  
  const buttonContainer = document.querySelector('.caption-generator-error div:nth-child(3)');
  buttonContainer.appendChild(statusText);
  
  chrome.runtime.sendMessage({ type: 'testConnection' }, (response) => {
    if (response.success) {
      statusText.textContent = '✅ Connection successful';
      statusText.style.color = '#4caf50';
    } else {
      statusText.textContent = `❌ Connection failed: ${response.error}`;
      statusText.style.color = '#f44336';
    }
  });
}

// Show debug panel
function showDebugPanel() {
  // Use the Alt+Shift+D shortcut to trigger the debug panel
  const event = new KeyboardEvent('keydown', {
    key: 'D',
    code: 'KeyD',
    altKey: true,
    shiftKey: true,
    bubbles: true
  });
  
  document.dispatchEvent(event);
}

// Add this to your UI generation code - replacing your existing error handling
function handleGenerateCaption() {
  // Show loading state
  const button = document.getElementById('generate-caption-btn');
  const originalText = button.textContent;
  button.textContent = 'Generating...';
  button.disabled = true;
  
  // Clear any previous errors
  const previousError = document.querySelector('.caption-generator-error');
  if (previousError) {
    previousError.remove();
  }
  
  // Get caption input fields
  const imageDescription = document.getElementById('caption-image-description')?.value || '';
  const userPrompt = document.getElementById('caption-user-prompt')?.value || '';
  const tone = document.getElementById('caption-tone')?.value || 'casual';
  const captionLength = document.getElementById('caption-length')?.value || 'medium';
  const hashtagCount = parseInt(document.getElementById('caption-hashtag-count')?.value || '5');
  
  // Get image data if available
  const imgElement = document.querySelector('div[role="dialog"] img');
  let imageData = null;
  
  if (imgElement) {
    try {
      // Create a canvas to get the image data
      const canvas = document.createElement('canvas');
      canvas.width = imgElement.naturalWidth;
      canvas.height = imgElement.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgElement, 0, 0);
      imageData = canvas.toDataURL('image/jpeg', 0.7);
    } catch (error) {
      console.error('Failed to capture image data:', error);
    }
  }
  
  // Send message to background script
  chrome.runtime.sendMessage({
    type: 'generateCaption',
    data: {
      imageDescription,
      userPrompt,
      tone,
      captionLength,
      hashtagCount,
      imageData
    }
  }, (response) => {
    // Reset button
    button.textContent = originalText;
    button.disabled = false;
    
    if (response.success) {
      // Show the generated caption
      displayGeneratedCaption(response);
    } else {
      // Show error message
      showError(response.error || 'Failed to generate caption');
    }
  });
}

// Run detection immediately and set up a more frequent interval
tryToInsertUI();
setInterval(tryToInsertUI, 1000); // Check every second

// Log debug info
setTimeout(debugInstagramUI, 2000);
setTimeout(debugInstagramUI, 5000);

// Set up MutationObserver to detect when the dialog opens
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length) {
      // Something was added to the DOM, check if it's our target
      tryToInsertUI();
    }
  }
});

// Start observing with a more specific target
observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['role', 'aria-label']
});

// Load and apply styles with improved specificity
function injectStyles() {
  // Remove any existing styles to prevent duplication
  const existingStyle = document.getElementById('caption-generator-styles');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  const styleSheet = document.createElement('style');
  styleSheet.id = 'caption-generator-styles';
  styleSheet.textContent = `
    .caption-generator-container {
      margin: 10px 0;
      padding: 8px;
      border-radius: 8px;
      background: #f9f9f9;
      border: 1px solid #dbdbdb;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      z-index: 9999;
      position: relative;
    }
    
    .caption-generator-controls {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .caption-generator-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .caption-generator-button {
      background-color: #0095f6;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .caption-generator-button:hover {
      background-color: #1877f2;
    }
    
    .caption-generator-select, .caption-generator-input {
      border: 1px solid #dbdbdb;
      border-radius: 4px;
      padding: 6px;
      font-size: 14px;
    }
    
    .caption-generator-prompt {
      flex-grow: 1;
    }
    
    .caption-generator-status {
      margin-top: 8px;
      font-size: 14px;
      min-height: 20px;
    }
    
    .caption-generator-status.loading {
      color: #0095f6;
    }
    
    .caption-generator-status.success {
      color: #2ecc71;
    }
    
    .caption-generator-status.error {
      color: #e74c3c;
    }
  `;
  document.head.appendChild(styleSheet);
}

// Inject styles
injectStyles();

// Export for debugging
window.instagramCaptionGenerator = {
  instagramDOM,
  insertCaptionGeneratorUI,
  tryToInsertUI,
  debugInstagramUI
};

// Add a persistent debugging console
function addDebuggingConsole() {
  const debugConsole = document.createElement('div');
  debugConsole.id = 'ig-caption-debug';
  debugConsole.style.position = 'fixed';
  debugConsole.style.bottom = '10px';
  debugConsole.style.right = '10px';
  debugConsole.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  debugConsole.style.color = 'white';
  debugConsole.style.padding = '10px';
  debugConsole.style.borderRadius = '5px';
  debugConsole.style.zIndex = '10000';
  debugConsole.style.fontSize = '12px';
  debugConsole.style.maxWidth = '300px';
  debugConsole.style.maxHeight = '200px';
  debugConsole.style.overflow = 'auto';
  
  // Add manual trigger button
  const triggerButton = document.createElement('button');
  triggerButton.textContent = 'Force UI Insertion';
  triggerButton.style.backgroundColor = '#0095f6';
  triggerButton.style.color = 'white';
  triggerButton.style.border = 'none';
  triggerButton.style.borderRadius = '4px';
  triggerButton.style.padding = '5px 10px';
  triggerButton.style.marginTop = '5px';
  triggerButton.style.cursor = 'pointer';
  triggerButton.onclick = () => {
    debugConsole.innerHTML = 'Attempting forced insertion...';
    insertCaptionGeneratorUI();
    setTimeout(() => {
      debugConsole.innerHTML = 'Insertion attempt complete. UI present: ' + 
        !!document.getElementById('caption-generator-ui');
    }, 500);
  };
  
  debugConsole.appendChild(document.createTextNode('Instagram Caption Generator Debug Console'));
  debugConsole.appendChild(document.createElement('br'));
  debugConsole.appendChild(triggerButton);
  
  document.body.appendChild(debugConsole);
}

// Add debug console in development mode
// Uncomment this to enable visual debugging:
// setTimeout(addDebuggingConsole, 2000);