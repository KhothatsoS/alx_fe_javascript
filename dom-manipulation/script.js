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
   POST NEW QUOTE TO SERVER (MOCK)
===================================================== */
async function postQuoteToServer(quote) {
  try {
    const response = await fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: quote.text,
        body: quote.category
      })
    });
    const data = await response.json();
    console.log("Server posted:", data);
    return data;
  } catch (error) {
    console.error("Failed to post quote:", error);
    return null;
  }
}

/* =====================================================
   SYNC QUOTES FUNCTION
===================================================== */
async function syncQuotes() {
  try {
    // 1️⃣ Fetch server quotes
    const response = await fetch(SERVER_URL);
    const serverData = await response.json();
    const serverQuotes = serverData.slice(0, 5).map(post => ({
      text: post.title,
      category: "Server"
    }));

    // 2️⃣ Merge server + local quotes (server wins)
    const localQuotes = JSON.parse(localStorage.getItem("quotes")) || [];
    const mergedQuotes = [...serverQuotes];

    localQuotes.forEach(localQuote => {
      const existsOnServer = serverQuotes.some(
        serverQuote => serverQuote.text === localQuote.text
      );
      if (!existsOnServer) mergedQuotes.push(localQuote);
    });

    // 3️⃣ Save merged quotes locally
    quotes = mergedQuotes;
    saveQuotesToLocalStorage();
    populateCategories();
    filterQuotes();

    // 4️⃣ Post local-only quotes to server
    for (const localQuote of localQuotes) {
      const existsOnServer = serverQuotes.some(
        serverQuote => serverQuote.text === localQuote.text
      );
      if (!existsOnServer) {
        await postQuoteToServer(localQuote);
      }
    }

    // 5️⃣ Notify user
    showSyncNotification("Quotes synced with server successfully!");
  } catch (error) {
    console.error("Sync failed:", error);
    showSyncNotification("Error syncing quotes with server.");
  }
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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newQuote = { text: textInput.value, category: categoryInput.value };

    // Add locally
    quotes.push(newQuote);
    saveQuotesToLocalStorage();
    populateCategories();
    filterQuotes();

    // Post to server
    await postQuoteToServer(newQuote);

    textInput.value = "";
    categoryInput.value = "";
  });

  container.appendChild(form);
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

  setInterval(syncQuotes, SYNC_INTERVAL);

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
