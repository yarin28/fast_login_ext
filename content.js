// content.js
function waitForElm(selector) {
  return new Promise(resolve => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(mutations => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  console.log(message)
  const response = message;
  const parser = new DOMParser();
  const doc = parser.parseFromString(response.html, 'text/html');
  const targetTable = doc.getElementById('customers');
  if (!targetTable) {
    console.error('Table not found');
    return;
  }
  const tableClone = targetTable.cloneNode(true);
  const newTable = tableClone.classList.add('dt-table');
  // await sleep(1000);
  waitForElm('.block').then((elm) => {
    console.log('Injecting table:', elm, newTable);
    elm.appendChild(tableClone);
  });
  return true;


});
async function scrapeAndInjectTable() {
  try {
    const tagetUrl = 'https://www.w3schools.com/html/html_tables.asp';
    const response = await chrome.runtime.sendMessage({ action: 'fetchTable', url: tagetUrl });

  }
  catch (e) {
    console.error('Failed to scrape and inject table:', e);
  }
}
scrapeAndInjectTable();

// Wait until the form fields are available
function waitForFormFields() {
  return new Promise((resolve) => {
    let count = 0
    const interval = setInterval(() => {
      const loginForm = document.getElementById("login-form");
      const usernameField = document.getElementById("username");
      const passwordField = document.getElementById("password");
      if (loginForm && usernameField && passwordField) {
        clearInterval(interval);
        resolve({ loginForm, usernameField, passwordField });
      }
      count++
      if (count == 200) {
        clearInterval(interval)
      }
    }, 100); // check every 100ms
  });
}

// Credentials array with descriptions
const credentials = [
  { username: "user1", password: "pass1", description: "Admin Account" },
  { username: "user2", password: "pass2", description: "Guest Account" },
  { username: "user3", password: "pass3", description: "User Account" }
];

// Dynamically load Simple-DataTables library

// Create and insert the table popup
function createPopupTable({ usernameField, passwordField }) {
  // Create overlay
  const overlay = document.createElement("div");
  overlay.id = "credential-overlay";
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center;
    align-items: center; z-index: 1000;
  `;

  // Create table container
  const tableContainer = document.createElement("div");
  tableContainer.style.cssText = `
    // background: white; padding: 20px; border-radius: 8px; max-width: 80vw;
    max-height: 80vh; overflow: auto;
  `;
  tableContainer.className = "block block2";
  const title = document.createElement("h2");
  title.id = "table-title";
  title.textContent = "Select Login Credentials";
  title.style.cssText = `
    text-align: center; color: white; padding: 10px; margin-bottom: 10px;
    background-color: ${getTitleColor()}; /* Set dynamic color */
  `;


  // Insert table HTML
  tableContainer.innerHTML = `
    <table id="credentials-table">
      <thead>
        <tr>
          <th>Username</th>
          <th>Password</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        ${credentials.map(cred => `
          <tr>
            <td>${cred.username}</td>
            <td>${cred.password}</td>
            <td>${cred.description}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <button id="close-popup" style="margin-top: 10px;">Close</button>
  `;

  tableContainer.prepend(title);
  // Append elements to the DOM
  overlay.appendChild(tableContainer);
  document.body.appendChild(overlay);

  // Initialize Simple-DataTables
  const dataTable = new DataTable("#credentials-table");

  // Handle row click to populate form fields
  document.querySelectorAll("#credentials-table tbody tr").forEach(row => {
    row.addEventListener("click", () => {
      const cells = row.getElementsByTagName("td");
      usernameField.value = cells[0].innerText;
      passwordField.value = cells[1].innerText;
      document.body.removeChild(overlay);
    });
  });

  document.getElementById("dt-search-0").focus();
  // Close button handler
  document.getElementById("close-popup").addEventListener("click", () => {
    document.body.removeChild(overlay);
  });
  function selectFirstRow() {
    const rows = dataTable.rows({ search: 'applied' }).nodes(); // Get the filtered rows
    if (rows.length == 1) {
      rows[0].click(); // Simulate a click on the first row
    }
  }

  // Listen for search events
  dataTable.on('search.dt', function () {
    setTimeout(selectFirstRow, 0); // Call the function to select the first row after the search
  });
}

function getTitleColor() {
  url = window.location.pathname;
  console.log(url);
  if (url.includes("qas")) {
    return "#00FF00"
  }
  if (url.includes("preprod")) {
    return "#FF0000"
  }
  return color;
}
// Load the DataTables library and run the script when form fields are ready
waitForFormFields().then(createPopupTable);
