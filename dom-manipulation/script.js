/* Array of quote objects */
const quotes = [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "Success is not final, failure is not fatal: It is the courage to continue that counts.", category: "Success" }
];

/* Function to display a random quote */
function showRandomQuote() {
  const quoteDisplay = document.getElementById("quote-display");
  quoteDisplay.innerHTML = "";

  const randomIndex = Math.floor(Math.random() * quotes.length);
  const randomQuote = quotes[randomIndex];

  const quoteText = document.createElement("p");
  quoteText.textContent = `"${randomQuote.text}"`;

  const quoteCategory = document.createElement("small");
  quoteCategory.textContent = `Category: ${randomQuote.category}`;

  quoteDisplay.appendChild(quoteText);
  quoteDisplay.appendChild(quoteCategory);
}

/* Function to create and handle the Add Quote form */
function createAddQuoteForm() {
  const formContainer = document.getElementById("form-container");

  const form = document.createElement("form");

  const textInput = document.createElement("input");
  textInput.type = "text";
  textInput.placeholder = "Enter quote text";
  textInput.required = true;

  const categoryInput = document.createElement("input");
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";
  categoryInput.required = true;

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.textContent = "Add Quote";

  form.appendChild(textInput);
  form.appendChild(categoryInput);
  form.appendChild(submitButton);

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const newQuote = {
      text: textInput.value,
      category: categoryInput.value
    };

    quotes.push(newQuote);

    textInput.value = "";
    categoryInput.value = "";

    alert("Quote added successfully!");
  });

  formContainer.appendChild(form);
}

/* Initialize on page load */
document.addEventListener("DOMContentLoaded", function () {
  createAddQuoteForm();

  const randomQuoteBtn = document.getElementById("random-quote-btn");
  randomQuoteBtn.addEventListener("click", showRandomQuote);
});
