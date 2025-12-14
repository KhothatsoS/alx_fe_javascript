/* =====================================================
   GLOBAL DATA & STORAGE HELPERS
===================================================== */

// Simulated server URL and sync interval
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";
const SYNC_INTERVAL = 15000; // 15 seconds

// Quotes array from Local Storage or default quotes
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" }
];

// Save quotes to Local Storage
function saveQuotesToLocalStorage() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

/* =====================================================
   FETCH QUOTES FROM SERVER
===================================================== */
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);

    if (!response.ok) {
      throw new Error("Failed to fetch quotes from server");
    }

    const data = await response.json();

    // Convert server posts to quote format
    return data.slice(0, 5).map(post => ({
      text: post.title,
      category: "Server"
    }));
  } catch (error) {
    console.error("Server fetch error:", error);
    return [];
  }
}

/* =====================================================
   MERGE QUOTES (CONFLICT RESOLUTION: SERVER WINS)
===================================================== */
function mergeQuotes(serverQuotes, localQuotes) {
  const merged = [...serverQuotes];

  localQuotes.forEach(localQuote => {
    const exists = serverQuotes.some(
      serverQuote => serverQuote.text === localQuote.text
    );

    if (!exists) merged.push(localQuote);
  });

  return merged;
}

/* =====================================================
   SERVER SYNC
===================================================== */
async function syncWithServer() {
  const serverQuotes = await fetchQuotesFromServer();
  const localQuotes = JSON.parse(localStorage.getItem("quotes")) || [];

  quotes = mergeQuotes(serverQuotes, localQuotes);
  saveQuotesToLocalStorage();
  populateCategories();
  filterQuotes();

  showSyncNotification("Quotes synced with server (server data took precedence)");
}

// Manual sync button
function manualSync() {
  syncWithServer();
}

/* =====================================================
   UI NOTIFICATIONS
===================================================== */
function showSyncNotification(message) {
  const notification = document.getElementById("sync-notification");
  if (!notification) return;

  notification.textContent = message;
  notification.style.display = "block";

  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
}

/* =====================================================
   DISPLAY RANDOM QUOTE
===================================================== */
function showRandomQuote() {
  if (quotes.length === 0) return;

  const quoteDisplay = document.getElementById("quote-display");
  quoteDisplay.innerHTML = "";

  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];

  quoteDisplay.innerHTML = `
    <p>"${quote.text}"</p>
    <small>Category: ${quote.category}</small>
  `;

  sessionStorage.setItem("lastQuote", JSON.stringify(quote));
}

/* =====================================================
   ADD QUOTE FORM
===================================================== */
function createAddQuoteForm() {
  const container = document.getElementById("form-container");
  const form = document.createElement("form");

  const textInput = document.createElement("input");
  textInput.placeholder = "Quote text";
  textInput.required = true;

  const categoryInput = document.createElement("input");
  categoryInput.placeholder = "Category";
  categoryInput.required = true;

  const submitBtn = document.createElement("button");
  submitBtn.textContent = "Add Quote";

  form.append(textInput, categoryInput, submitBtn);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    addQuote(textInput.value, categoryInput.value);
    textInput.value = "";
    categoryInput.value = "";
  });

  container.appendChild(form);
}

function addQuote(text, category) {
  quotes.push({ text, category });
  saveQuotesToLocalStorage();
  populateCategories();
  filterQuotes();
}

/* =====================================================
   CATEGORY FILTERING
===================================================== */
function populateCategories() {
  const select = document.getElementById("categoryFilter");
  select.innerHTML = '<option value="all">All Categories</option>';

  const categories = [...new Set(quotes.map(q => q.category))];

  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });

  const savedFilter = localStorage.getItem("selectedCategory");
  if (savedFilter) select.value = savedFilter;
}

function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  const quoteDisplay = document.getElementById("quote-display");

  quoteDisplay.innerHTML = "";

  const filteredQuotes =
    selectedCategory === "all"
      ? quotes
      : quotes.filter(q => q.category === selectedCategory);

  filteredQuotes.forEach(quote => {
    const p = document.createElement("p");
    p.textContent = `"${quote.text}" (${quote.category})`;
    quoteDisplay.appendChild(p);
  });

  localStorage.setItem("selectedCategory", selectedCategory);
}

/* =====================================================
   JSON EXPORT / IMPORT
===================================================== */
function exportQuotes() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "quotes.json";
  link.click();

  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();

  fileReader.onload = function (e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);

      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotesToLocalStorage();
        populateCategories();
        filterQuotes();
        alert("Quotes imported successfully!");
      } else {
        alert("Invalid JSON format.");
      }
    } catch {
      alert("Error reading JSON file.");
    }
  };

  fileReader.readAsText(event.target.files[0]);
}

/* =====================================================
   INITIALIZATION
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  createAddQuoteForm();
  populateCategories();
  filterQuotes();

  document.getElementById("random-quote-btn")
    ?.addEventListener("click", showRandomQuote);

  document.getElementById("export-btn")
    ?.addEventListener("click", exportQuotes);

  document.getElementById("importFile")
    ?.addEventListener("change", importFromJsonFile);

  setInterval(syncWithServer, SYNC_INTERVAL);

  // Restore last viewed quote from session
  const lastQuote = sessionStorage.getItem("lastQuote");
  if (lastQuote) {
    const quote = JSON.parse(lastQuote);
    document.getElementById("quote-display").innerHTML = `
      <p>"${quote.text}"</p>
      <small>Category: ${quote.category}</small>
    `;
  }
});
