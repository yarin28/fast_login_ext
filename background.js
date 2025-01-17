// create a background.js file to get url from my content.js and return the table from it.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchTable') {
    // console.log('Fetching table from:', request.url);
    fetch(request.url).then(html => html.text()).then(html => {
      // console.log("Html:", html);
      // sendResponse({ success: true, html: html });
      // console.log('Sending response to:', sender.tab);
      sender.tab ? chrome.tabs.sendMessage(sender.tab.id, { success: true, html: html }) : null;
      sendResponse({ success: true, html: html });
    }).catch(e => { sendResponse({ success: false, error: e }); });
  }

});
async function checkForUpdates() {
  console.log('Starting update check...');

  // Log current version
  console.log('Current version:', chrome.runtime.getManifest().version);

  // Log update URL from manifest
  const manifestUrl = chrome.runtime.getManifest().update_url;
  console.log('Update URL:', manifestUrl);

  try {
    // Attempt to fetch updates.xml directly to verify it's accessible
    const response = await fetch(manifestUrl);
    const text = await response.text();
    console.log('Update manifest content:', text);

    // Request update check
    chrome.runtime.requestUpdateCheck((status, details) => {
      console.log('Update check status:', status);
      console.log('Update details:', details);

      switch (status) {
        case 'no_update':
          console.log('No update available');
          break;
        case 'throttled':
          console.log('Update check throttled. Try again later.');
          break;
        case 'update_available':
          console.log('Update found! New version:', details.version);
          break;
        default:
          console.log('Unknown update status:', status);
      }
    });
  } catch (error) {
    console.error('Update check failed:', error);
    console.log('Error details:', {
      message: error.message,
      stack: error.stack
    });
  }
}

// Listen for update installation
chrome.runtime.onUpdateAvailable.addListener((details) => {
  console.log('Update is available:', details);
  // Automatically reload to apply update
  chrome.runtime.reload();
});

// Log when update is installed
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed/updated:', details);
  console.log('Current version:', chrome.runtime.getManifest().version);
});

// Check for updates every hour
const CHECK_INTERVAL = 60 * 60 * 1000;
setInterval(checkForUpdates, CHECK_INTERVAL);

// Initial check
checkForUpdates();

