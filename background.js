// create a background.js file to get url from my content.js and return the table from it.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchTable') {
    console.log('Fetching table from:', request.url);
    fetch(request.url).then(html => html.text()).then(html => {
      console.log("Html:", html);
      // sendResponse({ success: true, html: html });
      console.log('Sending response to:', sender.tab);
      sender.tab ? chrome.tabs.sendMessage(sender.tab.id, { success: true, html: html }) : null;
      sendResponse({ success: true, html: html });
    }).catch(e => { sendResponse({ success: false, error: e }); });
  }

});


