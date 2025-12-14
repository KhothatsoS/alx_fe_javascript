const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";
const SYNC_INTERVAL = 15000; // 15 seconds

{
  text: post.title,
  category: "Server"
}

async function fetchServerQuotes() {
  const response = await fetch(SERVER_URL);
  const data = await response.json();

  return data.slice(0, 5).map(post => ({
    text: post.title,
    category: "Server"
  }));
}

/* ================================
   DATA & STORAGE HELPERS
================================ */

// Load quotes from Local Storage or use defaults
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" }
];

// Save quotes to Local Storage
function saveQuotesToLocalStorage() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

async function syncWithServer() {
  const serverQuotes = await fetchServerQuotes();
  const localQuotes = JSON.parse(localStorage.getItem("quotes")) || [];

  const mergedQuotes = mergeQuotes(serverQuotes, localQuotes);

  localStorage.setItem("quotes", JSON.stringify(mergedQuotes));
  quotes = mergedQuotes;

  showSyncNotification("Quotes synced with server");
}

function mergeQuotes(serverQuotes, localQuotes) {
  const combined = [...serverQuotes];

  localQuotes.forEach(localQuote => {
    const existsOnServer = serverQuotes.some(
      serverQuote => serverQuote.text === localQuote.text
    );

    if (!existsOnServer) {
      combined.push(localQuote);
    }
  });

  return combined;
}

function showSyncNotification(message) {
  const notification = document.getElementById("sync-notification");
  notification.textContent = message;
  notification.style.display = "block";

  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
}
function manualSync() {
  syncWithServer();
  alert("Manual sync completed. Server data took precedence.");
}
setInterval(syncWithServer, SYNC_INTERVAL);
document.addEventListener("DOMContentLoaded", () => {
  setInterval(syncWithServer, SYNC_INTERVAL);
});

/* ================================
   DISPLAY RANDOM QUOTE
================================ */

function showRandomQuote() {
  const quoteDisplay = document.getElementById("quote-display");
  quoteDisplay.innerHTML = "";

  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];

  const textEl = document.createElement("p");
  textEl.textContent = `"${quote.text}"`;

  const categoryEl = document.createElement("small");
  categoryEl.textContent = `Category: ${quote.category}`;

  quoteDisplay.appendChild(textEl);
  quoteDisplay.appendChild(categoryEl);

  // Save last viewed quote in Session Storage
  sessionStorage.setItem("lastQuote", JSON.stringify(quote));
}

/* ================================
   ADD QUOTE FORM
================================ */

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

    quotes.push({
      text: textInput.value,
      category: categoryInput.value
    });

    saveQuotesToLocalStorage();

    textInput.value = "";
    categoryInput.value = "";

    alert("Quote added and saved!");
  });

  container.appendChild(form);
}

function populateCategories() {
  const select = document.getElementById("categoryFilter");

  // Reset dropdown
  select.innerHTML = '<option value="all">All Categories</option>';

  const categories = [...new Set(quotes.map(q => q.category))];

  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });

  // Restore last selected filter
  const savedFilter = localStorage.getItem("selectedCategory");
  if (savedFilter) {
    select.value = savedFilter;
  }
}
populateCategories();

document.getElementById("categoryFilter").addEventListener("change", (e) => {
  const selectedCategory = e.target.value;
  localStorage.setItem("selectedCategory", selectedCategory);
});

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

  // Save filter preference
  localStorage.setItem("selectedCategory", selectedCategory);
}
document.getElementById("filter-btn").addEventListener("click", filterQuotes);

/* ================================
   JSON EXPORT
================================ */

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

/* ================================
   JSON IMPORT
================================ */

function importQuotes(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);

      if (Array.isArray(importedQuotes)) {
        quotes = importedQuotes;
        saveQuotesToLocalStorage();
        alert("Quotes imported successfully!");
      } else {
        alert("Invalid JSON format.");
      }
    } catch {
      alert("Error reading JSON file.");
    }
  };

  reader.readAsText(file);
}

/* ================================
   INITIALIZATION
================================ */

document.addEventListener("DOMContentLoaded", () => {
  createAddQuoteForm();

  document
    .getElementById("random-quote-btn")
    .addEventListener("click", showRandomQuote);

  document
    .getElementById("export-btn")
    .addEventListener("click", exportQuotes);

  document
    .getElementById("import-input")
    .addEventListener("change", importQuotes);

  // Restore last viewed quote (session storage)
  const lastQuote = sessionStorage.getItem("lastQuote");
  if (lastQuote) {
    const quoteDisplay = document.getElementById("quote-display");
    const quote = JSON.parse(lastQuote);

    quoteDisplay.innerHTML = `
      <p>"${quote.text}"</p>
      <small>Category: ${quote.category}</small>
    `;
  }
});
