// content.js
const settings = {
  "table_urls": {
    "qas": "https://www.w3schools.com/html/html_tables.asp",
    "preprod": "https://www.w3schools.com/html/html_tables.asp",
  },
  "table_id": "customers",
  "title_color": {
    "qas": "#00FF00",
    "preprod": "#800080"
  }


};
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
  // to insert the credentials info into the form
  const usernameField = document.getElementById("username");
  const passwordField = document.getElementById("password");
  const overlay = document.getElementById("credential-overlay");
  sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const response = message;
  const parser = new DOMParser();
  const doc = parser.parseFromString(response.html, 'text/html');
  const targetTable = doc.getElementById(settings.table_id);
  if (!targetTable) {
    console.error('Table not found');
    return;
  }
  const tableClone = targetTable.cloneNode(true);
  tableClone.classList.add('dt-table');
  tableClone.id = 'credentials-table';
  const table_data = create_table_data();
  const table_head = create_table_head();


  waitForElm('.block').then((elm) => {
    const table = create_table();
    elm.appendChild(table);
    let dataTable = new DataTable('#credentials-table');
    add_functionality_to_dataTable();


    function add_functionality_to_dataTable() {
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
    }

    function create_table() {
      const table = document.createElement('table');
      table.innerHTML = `<table id = credentials-table class = dt-table>
      <thead>
        <tr>
          <th>Username</th>
          <th>Password</th>
          <th>description</th>
        </tr> 
      </thead>
  <tbody>
        ${table_data.join('')}
      </tbody >
    </table >
    <button id = "close-popup" style="margin-top:10px;" > Close</button > `;
      table.id = 'credentials-table';
      return table;
    }

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
    // await sleep(1000);
    return true;

  });


  function create_table_data() {
    const table_data = [];
    doc.querySelectorAll('#customers tbody tr').forEach(row => {
      let row_data = document.createElement('tr');
      for (let cell of row.cells) {
        row_data.appendChild(cell.cloneNode(true));
      }
      table_data.push(row_data.outerHTML);
    });
    return table_data;
  }

  function create_table_head() {
    const table_head = document.createElement('thead');
    table_head.innerHTML = `TODO`;
  }
});
function determineTargetUrl() {
  url = window.location.pathname;
  if (url.includes("qas")) {
    return settings.table_urls.qas;
  }
  if (url.includes("preprod")) {
    return settings.table_urls.preprod;
  }
};

async function sendMessageToFetchTable(targetUrl = determineTargetUrl()) {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'fetchTable', url: targetUrl });

  }
  catch (e) {
    console.error('Failed to scrape and inject table:', e);
  }
}

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


// Create and insert the table popup
async function createPopupTable({ usernameField, passwordField }) {
  // Create all the elemets
  // Create overlay
  const overlay = document.createElement("div");
  overlay.id = "credential-overlay";
  overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.5); display: flex; justify - content: center;
  align - items: center; z - index: 1000;
  `;

  // Create table container
  const tableContainer = document.createElement("div");
  tableContainer.style.cssText = `
  // background: white; padding: 20px; border-radius: 8px; max-width: 80vw;
  max - height: 80vh; overflow: auto;
  `;
  tableContainer.className = "block block2 tableContaner";
  const title = document.createElement("h2");
  title.id = "table-title";
  title.textContent = "Select Login Credentials";
  title.style.cssText = ` text-align: center; color: white; padding: 10px; margin-bottom: 10px; background-color: ${getTitleColor()}; /* Set dynamic color */ `;


  tableContainer.prepend(title);
  // Append elements to the DOM
  overlay.appendChild(tableContainer);
  document.body.appendChild(overlay);
  await sendMessageToFetchTable();

}

function getTitleColor() {
  url = window.location.pathname;
  let color = "#FF0000";
  if (url.includes("qas")) {
    color = settings.title_color.qas
  }
  if (url.includes("preprod")) {
    //return purple color
    color = settings.title_color.preprod
  }
  return color;
}
// Load the DataTables library and run the script when form fields are ready
waitForFormFields().then(createPopupTable);
