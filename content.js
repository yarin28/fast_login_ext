// Configuration
const SETTINGS = {
  TABLE_URLS: {
    qas: "https://www.w3schools.com/html/html_tables.asp",
    preprod: "https://www.w3schools.com/html/html_tables.asp"
  },
  TABLE_ID: "customers",
  TITLE_COLORS: {
    qas: "#00FF00",
    preprod: "#bd24eb"
  },
  STORAGE_KEY: 'loginCredentials'
};

// utils/user-manager.js
class UserManager {
  constructor(storageKey) {
    this.storageKey = storageKey;
  }

  // Get all users from local storage
  getUsers() {
    const storedUsers = localStorage.getItem(this.storageKey);
    return storedUsers ? JSON.parse(storedUsers) : [];
  }

  // Add new users to local storage
  addUsers(newUsers) {
    const existingUsers = this.getUsers();
    const uniqueUsers = [
      ...existingUsers,
      ...newUsers.filter(newUser =>
        !existingUsers.some(existingUser =>
          existingUser.username === newUser.username
        )
      )
    ];

    localStorage.setItem(this.storageKey, JSON.stringify(uniqueUsers));
    return uniqueUsers;
  }

  // Remove a user by username
  removeUser(username) {
    const users = this.getUsers();
    const updatedUsers = users.filter(user => user.username !== username);
    localStorage.setItem(this.storageKey, JSON.stringify(updatedUsers));
    return updatedUsers;
  }

  // Update an existing user
  updateUser(username, updatedUser) {
    const users = this.getUsers();
    const userIndex = users.findIndex(user => user.username === username);

    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updatedUser };
      localStorage.setItem(this.storageKey, JSON.stringify(users));
    }

    return users;
  }

  // Clear all users
  clearUsers() {
    localStorage.removeItem(this.storageKey);
  }
}
// utils/snackbar.js
function createSnackbar(message, type = 'info') {
  // Remove any existing snackbars
  const existingSnackbar = document.getElementById('snackbar');
  if (existingSnackbar) {
    existingSnackbar.remove();
  }

  // Create snackbar element
  const snackbar = document.createElement('div');
  snackbar.id = 'snackbar';
  snackbar.className = `
     fixed bottom-4 left-1/2 transform -translate-x-1/2 
    px-4 py-2 rounded-md text-white z-[100]
    ${getSnackbarStyle(type)}
    animate-in slide-in-from-bottom duration-300
  `;
  snackbar.textContent = message;

  // Append to body
  document.body.appendChild(snackbar);

  // Remove snackbar after 3 seconds
  setTimeout(() => {
    if (snackbar.parentNode) {
      snackbar.classList.add('animate-out', 'slide-out-to-bottom');
      setTimeout(() => snackbar.remove(), 300);
    }
  }, 3000);
}

function getSnackbarStyle(type) {
  switch (type) {
    case 'success': return 'bg-green-500';
    case 'error': return 'bg-red-500';
    case 'warning': return 'bg-yellow-500';
    default: return 'bg-blue-500';
  }
}



// components/credentials-table.js
function createCredentialsTable(users, { usernameField, passwordField }) {
  const table = document.createElement('table');
  table.id = 'credentials-table';
  table.className = 'w-full text-sm text-left';

  // Table Header
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr class="bg-gray-100 border-b">
      <th class="p-3">Username</th>
      <th class="p-3">Password</th>
      <th class="p-3">Description</th>
      <th class="p-3">Actions</th>
    </tr>
  `;
  table.appendChild(thead);

  // Table Body
  const tbody = document.createElement('tbody');
  users.forEach(user => {
    const row = document.createElement('tr');
    row.className = 'border-b hover:bg-gray-50 cursor-pointer';
    row.innerHTML = `
      <td class="p-3">${user.username}</td>
      <td class="p-3">${user.password}</td>
      <td class="p-3">${user.description || ''}</td>
      <td class="p-3">
        <button class="text-red-500 hover:text-red-700 select-credential">Select</button>
      </td>
    `;

    // Add click event to select credential
    row.querySelector('.select-credential').addEventListener('click', () => {
      usernameField.value = user.username;
      passwordField.value = user.password;

      // Optional: Close overlay
      const overlay = document.getElementById('credential-overlay');
      if (overlay) overlay.remove();
    });

    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  const closePopupButton = document.createElement('button');
  closePopupButton.id = 'close-popup';
  closePopupButton.textContent = 'Close';
  table.appendChild(closePopupButton);

  return table;
}


class CredentialInjector {
  constructor() {
    this.userManager = new UserManager(SETTINGS.STORAGE_KEY);
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    this.waitForFormFields()
      .then(this.createPopupTable.bind(this))
      .catch(error => {
        createSnackbar('Failed to load form fields', 'error');
        console.error(error);
      });
    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
      // to insert the credentials info into the form
      const usernameField = document.getElementById("username");
      const passwordField = document.getElementById("password");
      const overlay = document.getElementById("credential-overlay");
      // sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      const response = message;
      const parser = new DOMParser();
      const doc = parser.parseFromString(response.html, 'text/html');
      const targetTable = doc.getElementById(SETTINGS.TABLE_ID);
      if (!targetTable) {
        console.error('Table not found');
        return;
      }
      const tableClone = targetTable.cloneNode(true);
      tableClone.classList.add('dt-table');
      tableClone.id = 'credentials-table';
      const table_data = create_table_data();
      const table_head = create_table_head();


      waitForElm('.table-container').then((elm) => {
        // const table = create_table();
        // elm.appendChild(table);
        let dataTable = new DataTable('#credentials-table', {
          paging: false, layout: {
            top1: 'searchPanes'
          },
          searchPanes: true,
          searchPanes: {
            show: true,
            initCollapsed: true,
          },
          responsive: true,
          columnDefs: [
            {
              searchPanes: {
                show: true
              },
              targets: [0]
            },
            // {
            //   searchPanes: {
            //     show: false
            //   },
            //   targets: [2]
            // }
          ]
        });
        add_functionality_to_dataTable();
        add_users_to_users_object_from_table();
        dataTable.searchPanes.rebuildPane();
        dataTable.searchPanes.threshold = 0.9;
        function add_users_to_users_object_from_table() {
          const userManager = new UserManager(SETTINGS.STORAGE_KEY)
          const users = [];
          doc.querySelectorAll('#customers tbody tr').forEach(row => {
            const cells = row.cells;
            const user = {
              username: cells[0].innerText,
              password: cells[1].innerText,
              description: cells[2].innerText
            };
            users.push(user);
            console.log(user);
          });
          userManager.addUsers(users);
        };

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
  }

  // Wait for form fields to be available
  waitForFormFields() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const MAX_ATTEMPTS = 200;

      const checkFields = () => {
        const loginForm = document.getElementById("login-form");
        const usernameField = document.getElementById("username");
        const passwordField = document.getElementById("password");

        if (loginForm && usernameField && passwordField) {
          clearInterval(interval);
          resolve({ loginForm, usernameField, passwordField });
        }

        attempts++;
        if (attempts >= MAX_ATTEMPTS) {
          clearInterval(interval);
          reject(new Error('Form fields not found'));
        }
      };

      const interval = setInterval(checkFields, 100);
    });
  }

  // Determine target URL based on current path
  determineTargetUrl() {
    const url = window.location.pathname;
    return url.includes("qas")
      ? SETTINGS.TABLE_URLS.qas
      : url.includes("preprod")
        ? SETTINGS.TABLE_URLS.preprod
        : null;
  }

  // Get title color based on environment
  getTitleColor() {
    const url = window.location.pathname;
    if (url.includes("qas")) return SETTINGS.TITLE_COLORS.qas;
    if (url.includes("preprod")) return SETTINGS.TITLE_COLORS.preprod;
    return "#FF0000"; // Default color
  }

  // Create popup table for credentials
  async createPopupTable({ usernameField, passwordField }) {
    try {
      // Create overlay
      const overlay = this.createOverlay();
      const tableContainer = overlay.querySelector('.table-container');

      // Add title
      const title = this.createTitle();
      tableContainer.prepend(title);

      // Create user management controls
      const userControls = this.createUserControls();
      tableContainer.appendChild(userControls);

      // Fetch and create table
      await this.fetchAndInjectTable(tableContainer, { usernameField, passwordField });

      document.body.appendChild(overlay);
    } catch (error) {
      createSnackbar('Failed to create credentials popup', 'error');
      console.error(error);
    }
  }

  createOverlay() {
    const overlay = document.createElement("div");
    overlay.id = "credential-overlay";
    overlay.className = "fixed inset-0 bg-black/50 z-50 flex justify-center items-center";
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.5); display: flex; justify - content: center;
  align - items: center; z - index: 1000;
  `;

    const tableContainer = document.createElement("div");
    tableContainer.className = "table-container bg-white p-6 rounded-lg max-w-4xl max-h-[80vh] w-full overflow-auto relative";
    tableContainer.style.cssText = `
  background: white; padding: 20px; border-radius: 8px; max-width: 80vw;
  max - height: 80vh; overflow: auto;
  `;

    overlay.appendChild(tableContainer);
    return overlay;
  }

  createTitle() {
    const title = document.createElement("h2");
    title.textContent = "Select Login Credentials";
    title.className = "text-center text-white p-3 mb-4 rounded";
    title.style.backgroundColor = this.getTitleColor();
    return title;
  }

  createUserControls() {
    const controlsContainer = document.createElement("div");
    controlsContainer.className = "flex space-x-4 mb-4";

    // Paste from Clipboard Button
    const pasteButton = document.createElement("button");
    pasteButton.textContent = "Paste Credentials";
    pasteButton.className = "btn btn-primary";
    pasteButton.addEventListener('click', this.handlePasteCredentials.bind(this));

    // Manage Users Button
    const manageButton = document.createElement("button");
    manageButton.textContent = "Manage Users";
    manageButton.className = "btn btn-secondary";
    manageButton.addEventListener('click', this.openUserManagementModal.bind(this));

    controlsContainer.append(pasteButton, manageButton);
    return controlsContainer;
  }

  async handlePasteCredentials() {
    try {
      const clipboardText = await navigator.clipboard.readText();
      const parsedCredentials = this.parseCredentialsFromClipboard(clipboardText);

      if (parsedCredentials.length > 0) {
        this.userManager.addUsers(parsedCredentials);
        createSnackbar(`Added ${parsedCredentials.length} credentials`, 'success');
        this.refreshCredentialsTable();
      } else {
        createSnackbar('No valid credentials found', 'warning');
      }
    } catch (error) {
      createSnackbar('Failed to paste credentials', 'error');
      console.error(error);
    }
  }

  parseCredentialsFromClipboard(text) {
    // Parse tab or comma-separated credentials
    const lines = text.trim().split('\n');
    return lines.map(line => {
      const [username, password, description] = line.split(/[\t,]/);
      return username && password
        ? { username, password, description: description || '' }
        : null;
    }).filter(Boolean);
  }

  openUserManagementModal() {
    // TODO: Implement full user management modal
    const users = this.userManager.getUsers();
    console.log('Current Users:', users);
    createSnackbar('User Management Modal (TODO)', 'info');
  }

  async fetchAndInjectTable(tableContainer, { usernameField, passwordField }) {
    try {
      const targetUrl = this.determineTargetUrl();
      if (!targetUrl) {
        throw new Error('Invalid target URL');
      }

      this.sendMessageToFetchTable(targetUrl).then(response => {
        // console.log('Response:', response)
      });
      const table = createCredentialsTable(
        this.userManager.getUsers(),
        { usernameField, passwordField }
      );

      tableContainer.appendChild(table);
    } catch (error) {
      createSnackbar('Failed to fetch credentials', 'error');
      console.error(error);
    }
  }

  async sendMessageToFetchTable(targetUrl) {
    try {
      return await chrome.runtime.sendMessage({
        action: 'fetchTable',
        url: targetUrl
      });
    } catch (error) {
      throw new Error('Failed to fetch table: ' + error.message);
    }
  }
}

// Initialize the extension
const credentials_injector = new CredentialInjector();

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
