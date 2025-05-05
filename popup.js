document.addEventListener('DOMContentLoaded', function() {
  // Load saved settings
  chrome.storage.sync.get([
    'apiKey',
    'useServerProxy',
    'defaultTone',
    'captionLength',
    'hashtagCount'
  ], function(data) {
    // Populate the form with saved settings
    document.getElementById('api-key').value = data.apiKey || '';
    document.getElementById('use-proxy').checked = data.useServerProxy !== false;
    
    if (data.defaultTone) {
      document.getElementById('default-tone').value = data.defaultTone;
    }
    
    if (data.captionLength) {
      document.getElementById('caption-length').value = data.captionLength;
    }
    
    if (data.hashtagCount) {
      document.getElementById('hashtag-count').value = data.hashtagCount;
    }
  });
  
  // Save settings when the save button is clicked
  document.getElementById('save-settings').addEventListener('click', function() {
    const settings = {
      apiKey: document.getElementById('api-key').value,
      useServerProxy: document.getElementById('use-proxy').checked,
      defaultTone: document.getElementById('default-tone').value,
      captionLength: document.getElementById('caption-length').value,
      hashtagCount: parseInt(document.getElementById('hashtag-count').value, 10)
    };
    
    chrome.storage.sync.set(settings, function() {
      // Show a saved confirmation
      const saveButton = document.getElementById('save-settings');
      const originalText = saveButton.textContent;
      
      saveButton.textContent = 'Settings Saved!';
      saveButton.disabled = true;
      
      setTimeout(function() {
        saveButton.textContent = originalText;
        saveButton.disabled = false;
      }, 1500);
    });
  });
  
  // Handle privacy policy button
  document.getElementById('view-privacy').addEventListener('click', function() {
    chrome.tabs.create({ url: 'https://your-privacy-policy-url.com' });
  });
});