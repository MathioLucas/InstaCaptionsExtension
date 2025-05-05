// lib/instagram-dom.js
// Handles all Instagram DOM interactions and manipulations

/**
 * Instagram DOM Handler for the Caption Generator extension
 * This file manages all interactions with Instagram's DOM elements
 */

class InstagramDOMHandler {
  constructor() {
    // Selectors for Instagram's DOM elements
    this.selectors = {
      // Post creation page
      postCreationPage: 'div[role="dialog"] form',
      captionTextarea: 'div[role="dialog"] textarea[aria-label="Write a caption..."]',
      textareaContainer: 'div[role="dialog"] form div[data-focus-lock-disabled="false"]',
      
      // Image upload area
      imagePreviewContainer: 'div[role="dialog"] div[style*="transform-origin: right bottom"]',
      imagePreview: 'div[role="dialog"] img[style*="object-fit: cover"]',
      
      // Navigation elements
      nextButton: 'div[role="dialog"] button:contains("Next")',
      shareButton: 'div[role="dialog"] button:contains("Share")',
      
      // Accessibility
      accessibilitySection: 'div[role="dialog"] div:contains("Accessibility")',
      altTextArea: 'div[role="dialog"] textarea[aria-label="Write alt text..."]',
    };
    
    // Mutation observer to detect changes in the DOM
    this.observer = null;
  }

  /**
   * Initialize the DOM observer
   * @param {Function} callback - Callback to run when Instagram post UI is detected
   */
  initObserver(callback) {
    // Disconnect any existing observer
    if (this.observer) {
      this.observer.disconnect();
    }
    
    // Create a new mutation observer
    this.observer = new MutationObserver((mutations) => {
      if (this.isPostCreationPage()) {
        callback();
      }
    });
    
    // Start observing the document with the configured parameters
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });
  }
  
  /**
   * Checks if the current page is Instagram's post creation page
   * @returns {boolean} - True if post creation page is detected
   */
  isPostCreationPage() {
    return !!this.getElement(this.selectors.postCreationPage);
  }
  
  /**
   * Checks if an image has been uploaded and is previewed
   * @returns {boolean} - True if an image preview is found
   */
  hasImagePreview() {
    return !!this.getElement(this.selectors.imagePreview);
  }
  
  /**
   * Get a DOM element based on a selector
   * @param {string} selector - CSS selector or custom selector
   * @returns {Element|null} - The found element or null
   */
  getElement(selector) {
    // Handle special selectors like :contains()
    if (selector.includes(':contains(')) {
      const parts = selector.match(/(.*):contains\("(.*)"\)(.*)/);
      if (parts) {
        const [_, baseSelector, textContent, trailingSelector] = parts;
        const combinedSelector = baseSelector + trailingSelector;
        
        // Find all elements matching the base selector
        const elements = Array.from(document.querySelectorAll(combinedSelector));
        
        // Filter for elements containing the specified text
        return elements.find(el => el.textContent.includes(textContent)) || null;
      }
    }
    
    // Default to standard querySelector
    try {
      return document.querySelector(selector);
    } catch (e) {
      console.error(`Invalid selector: ${selector}`, e);
      return null;
    }
  }
  
  /**
   * Get all DOM elements based on a selector
   * @param {string} selector - CSS selector
   * @returns {Element[]} - Array of found elements
   */
  getAllElements(selector) {
    try {
      return Array.from(document.querySelectorAll(selector));
    } catch (e) {
      console.error(`Invalid selector: ${selector}`, e);
      return [];
    }
  }
  
  /**
   * Insert the caption generator UI into Instagram's post page
   * @param {HTMLElement} uiElement - The UI element to insert
   * @returns {boolean} - True if inserted successfully
   */
  insertCaptionGeneratorUI(uiElement) {
    const container = this.getElement(this.selectors.textareaContainer);
    if (!container) return false;
    
    // Insert before the textarea
    container.parentNode.insertBefore(uiElement, container);
    return true;
  }
  
  /**
   * Set text in the caption textarea
   * @param {string} text - The caption text to set
   * @returns {boolean} - True if set successfully
   */
  setCaptionText(text) {
    const textarea = this.getElement(this.selectors.captionTextarea);
    if (!textarea) return false;
    
    // Focus the textarea
    textarea.focus();
    
    // Set the value
    textarea.value = text;
    
    // Dispatch input event to trigger Instagram's internal handlers
    const event = new Event('input', { bubbles: true });
    textarea.dispatchEvent(event);
    
    return true;
  }
  
  /**
   * Append hashtags to the existing caption
   * @param {string[]} hashtags - Array of hashtags (without # symbol)
   * @returns {boolean} - True if appended successfully
   */
  appendHashtags(hashtags) {
    const textarea = this.getElement(this.selectors.captionTextarea);
    if (!textarea) return false;
    
    // Format hashtags with # symbol
    const hashtagString = hashtags.map(tag => `#${tag}`).join(' ');
    
    // Append to existing text with newlines
    let currentText = textarea.value;
    if (currentText && !currentText.endsWith('\n\n')) {
      currentText += '\n\n';
    }
    
    textarea.value = currentText + hashtagString;
    
    // Dispatch input event
    const event = new Event('input', { bubbles: true });
    textarea.dispatchEvent(event);
    
    return true;
  }
  
  /**
   * Set alt text for the uploaded image
   * @param {string} altText - The alt text to set
   * @returns {boolean} - True if set successfully
   */
  setAltText(altText) {
    // First need to open the accessibility section if it exists
    const accessSection = this.getElement(this.selectors.accessibilitySection);
    if (accessSection) {
      accessSection.click();
      
      // Wait for alt text area to appear
      setTimeout(() => {
        const altTextArea = this.getElement(this.selectors.altTextArea);
        if (!altTextArea) return false;
        
        // Set the alt text
        altTextArea.value = altText;
        
        // Dispatch input event
        const event = new Event('input', { bubbles: true });
        altTextArea.dispatchEvent(event);
        
        // Close the accessibility dialog by clicking outside
        document.body.click();
      }, 500);
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Capture the currently uploaded image for analysis
   * @returns {Promise<string|null>} - Base64 encoded image data or null
   */
  async captureUploadedImage() {
    const imgElement = this.getElement(this.selectors.imagePreview);
    if (!imgElement) return null;
    
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas dimensions to match the image
      canvas.width = imgElement.naturalWidth || imgElement.width;
      canvas.height = imgElement.naturalHeight || imgElement.height;
      
      // Draw the image onto the canvas
      ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64 data URL (JPEG format with 70% quality to reduce size)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      
      return dataUrl;
    } catch (e) {
      console.error('Error capturing uploaded image:', e);
      return null;
    }
  }
  
  /**
   * Clean up any resources or observers
   */
  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Export the handler
export default InstagramDOMHandler;