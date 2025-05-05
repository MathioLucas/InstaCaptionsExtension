// This is a separate content script file to help with debugging
// Add this file to your manifest.json content_scripts array

// Create a floating debug console
function createDebugOverlay() {
  // Check if it already exists
  if (document.getElementById('ig-caption-debug-overlay')) {
    return;
  }
  
  // Create the debug overlay
  const overlay = document.createElement('div');
  overlay.id = 'ig-caption-debug-overlay';
  overlay.style.position = 'fixed';
  overlay.style.bottom = '10px';
  overlay.style.right = '10px';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  overlay.style.color = 'white';
  overlay.style.padding = '15px';
  overlay.style.borderRadius = '8px';
  overlay.style.zIndex = '9999';
  overlay.style.fontSize = '14px';
  overlay.style.fontFamily = 'monospace';
  overlay.style.minWidth = '250px';
  overlay.style.maxWidth = '400px';
  overlay.style.maxHeight = '300px';
  overlay.style.overflow = 'auto';
  overlay.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
  
  // Create header
  const header = document.createElement('div');
  header.textContent = 'Instagram Caption Generator Debug';
  header.style.fontWeight = 'bold';
  header.style.marginBottom = '10px';
  header.style.borderBottom = '1px solid #666';
  header.style.paddingBottom = '5px';
  
  // Create content area
  const content = document.createElement('div');
  content.id = 'ig-caption-debug-content';
  content.style.marginBottom = '10px';
  content.style.fontSize = '12px';
  
  // Create buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '8px';
  
  const forceButton = document.createElement('button');
  forceButton.textContent = 'Force UI Insertion';
  forceButton.style.backgroundColor = '#0095f6';
  forceButton.style.color = 'white';
  forceButton.style.border = 'none';
  forceButton.style.borderRadius = '4px';
  forceButton.style.padding = '6px 12px';
  forceButton.style.cursor = 'pointer';
  forceButton.onclick = forceUIInsertion;
  
  const refreshButton = document.createElement('button');
  refreshButton.textContent = 'Refresh Status';
  refreshButton.style.backgroundColor = '#444';
  refreshButton.style.color = 'white';
  refreshButton.style.border = 'none';
  refreshButton.style.borderRadius = '4px';
  refreshButton.style.padding = '6px 12px';
  refreshButton.style.cursor = 'pointer';
  refreshButton.onclick = updateDebugInfo;
  
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.style.backgroundColor = '#e74c3c';
  closeButton.style.color = 'white';
  closeButton.style.border = 'none';
  closeButton.style.borderRadius = '4px';
  closeButton.style.padding = '6px 12px';
  closeButton.style.cursor = 'pointer';
  closeButton.onclick = () => overlay.remove();
  
  // Assemble the UI
  buttonContainer.appendChild(forceButton);
  buttonContainer.appendChild(refreshButton);
  buttonContainer.appendChild(closeButton);
  
  overlay.appendChild(header);
  overlay.appendChild(content);
  overlay.appendChild(buttonContainer);
  
  // Add to body
  document.body.appendChild(overlay);
  
  // Initial update
  updateDebugInfo();
}

// Force UI insertion
function forceUIInsertion() {
  const debugContent = document.getElementById('ig-caption-debug-content');
  if (!debugContent) return;
  
  debugContent.innerHTML = '<p>Attempting to force UI insertion...</p>';
  
  // Access the main script's functions if available
  if (window.instagramCaptionGenerator) {
    const result = window.instagramCaptionGenerator.insertCaptionGeneratorUI();
    debugContent.innerHTML += `<p>Insertion result: ${result ? 'Success' : 'Failed'}</p>`;
  } else {
    // Manual attempt
    try {
      // Simple detection of Instagram post creation page
      const dialog = document.querySelector('div[role="dialog"]');
      const captionArea = document.querySelector('textarea[aria-label="Write a caption..."], [contenteditable="true"][role="textbox"]');
      
      if (dialog && captionArea) {
        debugContent.innerHTML += '<p>Found dialog and caption area</p>';
        
        // Create a minimal version of the UI
        const container = document.createElement('div');
        container.id = 'caption-generator-ui';
        container.style.padding = '10px';
        container.style.margin = '10px 0';
        container.style.backgroundColor = '#f0f0f0';
        container.style.borderRadius = '8px';
        container.style.border = '1px solid #ccc';
        
        const button = document.createElement('button');
        button.textContent = '✨ Generate Caption';
        button.style.backgroundColor = '#0095f6';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.padding = '8px 16px';
        button.style.cursor = 'pointer';
        
        container.appendChild(button);
        
        // Try to insert after the caption area
        let insertionPoint = captionArea;
        for (let i = 0; i < 3; i++) {
          if (insertionPoint.parentNode) {
            insertionPoint = insertionPoint.parentNode;
          }
        }
        
        insertionPoint.appendChild(container);
        debugContent.innerHTML += '<p>Minimal UI inserted successfully</p>';
      } else {
        debugContent.innerHTML += '<p>Could not find necessary Instagram elements</p>';
      }
    } catch (error) {
      debugContent.innerHTML += `<p>Error: ${error.message}</p>`;
    }
  }
  
  updateDebugInfo();
}

// Update debug information
function updateDebugInfo() {
  const debugContent = document.getElementById('ig-caption-debug-content');
  if (!debugContent) return;
  
  let html = '';
  
  // Check if we're on Instagram
  const isInstagram = window.location.hostname.includes('instagram.com');
  html += `<p>On Instagram: ${isInstagram ? '✅' : '❌'}</p>`;
  
  // Check if we're in a dialog
  const hasDialog = !!document.querySelector('div[role="dialog"]');
  html += `<p>Dialog present: ${hasDialog ? '✅' : '❌'}</p>`;
  
  // Check for caption textarea
  const captionSelectors = [
    'textarea[aria-label="Write a caption..."]', 
    'textarea[placeholder="Write a caption..."]',
    '[contenteditable="true"][role="textbox"]'
  ];
  
  let captionFound = false;
  let captionSelector = '';
  
  for (const selector of captionSelectors) {
    if (document.querySelector(selector)) {
      captionFound = true;
      captionSelector = selector;
      break;
    }
  }
  
  html += `<p>Caption area found: ${captionFound ? '✅' : '❌'} ${captionSelector}</p>`;
  
  // Check if image is present
  const hasImage = !!document.querySelector('div[role="dialog"] img');
  html += `<p>Image present: ${hasImage ? '✅' : '❌'}</p>`;
  
  // Check if our UI is already inserted
  const uiInserted = !!document.getElementById('caption-generator-ui');
  html += `<p>UI inserted: ${uiInserted ? '✅' : '❌'}</p>`;
  
  // Check if instagramCaptionGenerator object is available
  const hasAPI = !!window.instagramCaptionGenerator;
  html += `<p>Script API available: ${hasAPI ? '✅' : '❌'}</p>`;
  
  // Add extension information
  html += '<p>Extension information:</p>';
  
  try {
    const manifest = chrome.runtime.getManifest();
    html += `<p>Name: ${manifest.name}</p>`;
    html += `<p>Version: ${manifest.version}</p>`;
  } catch (e) {
    html += `<p>Error accessing extension info: ${e.message}</p>`;
  }
  
  debugContent.innerHTML = html;
}

// Inject a keyboard shortcut listener
function setupKeyboardShortcut() {
  document.addEventListener('keydown', (event) => {
    // Alt+Shift+D to show debug overlay
    if (event.altKey && event.shiftKey && event.key === 'D') {
      createDebugOverlay();
    }
  });
}

// Monitor for DOM changes to detect Instagram's dynamic UI updates
function setupMutationObserver() {
  // Create an observer instance
  const observer = new MutationObserver((mutations) => {
    // Check if we're on Instagram and if the caption area has appeared
    if (window.location.hostname.includes('instagram.com')) {
      const dialog = document.querySelector('div[role="dialog"]');
      const captionArea = document.querySelector('textarea[aria-label="Write a caption..."], [contenteditable="true"][role="textbox"]');
      
      if (dialog && captionArea) {
        // Check if our UI is already inserted
        if (!document.getElementById('caption-generator-ui')) {
          // If the main script's API is available, use it
          if (window.instagramCaptionGenerator) {
            window.instagramCaptionGenerator.insertCaptionGeneratorUI();
          }
          
          // If debug overlay is visible, update it
          const debugContent = document.getElementById('ig-caption-debug-content');
          if (debugContent) {
            updateDebugInfo();
          }
        }
      }
    }
  });
  
  // Start observing the document with the configured parameters
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
  
  return observer;
}

// Initialize the debug script
function initialize() {
  console.log('Instagram Caption Generator Debug Script Initialized');
  
  // Set up keyboard shortcut
  setupKeyboardShortcut();
  
  // Set up mutation observer
  const observer = setupMutationObserver();
  
  // Expose debug functions to the global scope for console access
  window.igCaptionDebug = {
    showOverlay: createDebugOverlay,
    forceUIInsertion: forceUIInsertion,
    updateDebugInfo: updateDebugInfo,
    observer: observer
  };
  
  // Check if we're already on an Instagram page with a caption area
  if (window.location.hostname.includes('instagram.com')) {
    // Wait a moment for Instagram's JS to fully load
    setTimeout(() => {
      const captionArea = document.querySelector('textarea[aria-label="Write a caption..."], [contenteditable="true"][role="textbox"]');
      if (captionArea) {
        // Show debug info if it's a post creation dialog
        if (document.querySelector('div[role="dialog"]')) {
          createDebugOverlay();
        }
      }
    }, 1500);
  }
}

// Run initialization
initialize();

// Add event listener for page navigation (Instagram is a SPA)
window.addEventListener('popstate', () => {
  // Check if we should show debug overlay on navigation
  setTimeout(() => {
    if (window.location.hostname.includes('instagram.com') && 
        document.querySelector('div[role="dialog"]') && 
        document.querySelector('textarea[aria-label="Write a caption..."], [contenteditable="true"][role="textbox"]')) {
      createDebugOverlay();
    }
  }, 1000);
});

// Message listener for communication with background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'showDebugOverlay') {
    createDebugOverlay();
    sendResponse({success: true});
  } else if (message.action === 'checkStatus') {
    const status = {
      isInstagram: window.location.hostname.includes('instagram.com'),
      hasDialog: !!document.querySelector('div[role="dialog"]'),
      hasCaptionArea: !!document.querySelector('textarea[aria-label="Write a caption..."], [contenteditable="true"][role="textbox"]'),
      uiInserted: !!document.getElementById('caption-generator-ui')
    };
    sendResponse(status);
  }
  return true; // Keep the message channel open for async response
});