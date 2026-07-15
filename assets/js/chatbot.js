/**
 * AI Resume Chatbot — JavaScript
 * Clean, modular, vanilla JS using Fetch API.
 * No jQuery dependency.
 */

(function () {
  "use strict";

  /* =============================================================
     Configuration
  ============================================================= */
  const API_URL = "https://myeyeacademy.com/resume-ai/ask.php";

  const SUGGESTED_QUESTIONS = [
    "What Laravel experience does Sarmad have?",
    "Tell me about Sarmad's AI projects.",
    "What technologies does Sarmad specialize in?",
    "Describe Sarmad's RAG project.",
    "What CRM systems has Sarmad built?",
    "Tell me about MangoFit.",
    "What programming languages does Sarmad know?",
    "What are Sarmad's strongest backend skills?",
    "What AI tools has Sarmad worked with?",
    "Tell me about Sarmad's recent experience.",
  ];

  const WELCOME_MESSAGE =
    "Hi! I'm AI Resume Assistant.\n\nI'm here to help recruiters and hiring managers quickly explore Sarmad's professional background.";

  /* =============================================================
     State
  ============================================================= */
  let isLoading = false; // Prevents duplicate requests
  let isOpen = false;

  /* =============================================================
     DOM References (cached after DOMContentLoaded)
  ============================================================= */
  let fabBtn,
    chatWindow,
    messagesContainer,
    inputArea,
    textarea,
    sendBtn,
    clearBtn,
    closeBtn;

  /* =============================================================
     Initialization
  ============================================================= */
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    fabBtn = document.getElementById("chatbot-fab");
    chatWindow = document.getElementById("chatbot-window");
    messagesContainer = chatWindow.querySelector(".chatbot-messages");
    inputArea = chatWindow.querySelector(".chatbot-input-area");
    textarea = inputArea.querySelector("textarea");
    sendBtn = inputArea.querySelector(".chatbot-send-btn");
    clearBtn = chatWindow.querySelector(".chatbot-clear-btn");
    closeBtn = chatWindow.querySelector(".chatbot-close-btn");

    // Event listeners
    fabBtn.addEventListener("click", toggleChat);
    sendBtn.addEventListener("click", handleSend);
    clearBtn.addEventListener("click", clearChat);
    closeBtn.addEventListener("click", toggleChat);

    textarea.addEventListener("keydown", handleKeyDown);
    textarea.addEventListener("input", autoResizeTextarea);

    // Render initial state
    renderEmptyState();
  }

  /* =============================================================
     Toggle Chat Open / Close
  ============================================================= */
  function toggleChat() {
    isOpen = !isOpen;
    chatWindow.classList.toggle("open", isOpen);
    fabBtn.classList.toggle("open", isOpen);

    if (isOpen) {
      // Focus the input when chat opens
      setTimeout(() => textarea.focus(), 400);
    }
  }

  /* =============================================================
     Render the Empty / Welcome State
  ============================================================= */
  function renderEmptyState() {
    messagesContainer.innerHTML = "";

    // Welcome block
    const welcome = document.createElement("div");
    welcome.className = "chatbot-welcome";
    welcome.innerHTML = `
      <div class="welcome-icon">
        <i class="bi bi-robot"></i>
      </div>
      <h3>AI Resume Assistant</h3>
      <p>${WELCOME_MESSAGE.replace(/\n/g, "<br>")}</p>
    `;
    messagesContainer.appendChild(welcome);

    // Suggestions
    const suggestionsWrapper = document.createElement("div");
    suggestionsWrapper.className = "chatbot-suggestions";
    suggestionsWrapper.innerHTML = `<h5>Suggested Questions</h5>`;

    const grid = document.createElement("div");
    grid.className = "chatbot-suggestions-grid";

    SUGGESTED_QUESTIONS.forEach((q) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chatbot-suggestion-chip";
      chip.textContent = q;
      chip.addEventListener("click", () => handleSuggestionClick(q));
      grid.appendChild(chip);
    });

    suggestionsWrapper.appendChild(grid);
    messagesContainer.appendChild(suggestionsWrapper);
  }

  /* =============================================================
     Handle Suggestion Chip Click
  ============================================================= */
  function handleSuggestionClick(question) {
    if (isLoading) return;
    sendMessage(question);
  }

  /* =============================================================
     Handle Send Button / Enter Key
  ============================================================= */
  function handleSend() {
    const text = textarea.value.trim();
    if (!text || isLoading) return;
    textarea.value = "";
    autoResizeTextarea();
    sendMessage(text);
  }

  function handleKeyDown(e) {
    // Enter without Shift → send
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Shift+Enter → newline (default behaviour)
  }

  /* =============================================================
     Core: Send Message Flow
  ============================================================= */
  function sendMessage(question) {
    if (isLoading) return;

    // Remove welcome/suggestions if still showing
    clearWelcomeState();

    // Append user bubble
    appendUserMessage(question);

    // Show typing indicator
    showTyping();

    // Disable input
    setLoading(true);

    // Call API
    fetchAnswer(question)
      .then((answer) => {
        hideTyping();
        appendBotMessage(answer);
      })
      .catch((err) => {
        hideTyping();
        appendBotMessage(err.message, true);
      })
      .finally(() => {
        setLoading(false);
        textarea.focus();
      });
  }

  /* =============================================================
     API Call
  ============================================================= */
  async function fetchAnswer(question) {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ question }),
      });

      // Handle specific HTTP error codes
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Authentication failed.");
        }
        if (res.status === 500) {
          throw new Error("Something went wrong on the server.");
        }
        throw new Error("Sorry, I couldn't generate a response. Please try again.");
      }

      const data = await res.json();

      if (data && data.answer) {
        return data.answer;
      }

      // Empty or missing answer
      throw new Error("No answer was returned.");
    } catch (err) {
      // Network / connection errors
      if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        throw new Error("Unable to connect to the AI service.");
      }
      throw err;
    }
  }

  /* =============================================================
     DOM Helpers — Append Messages
  ============================================================= */
  function appendUserMessage(text) {
    const msg = document.createElement("div");
    msg.className = "chatbot-msg user";
    msg.innerHTML = `
      <div class="msg-avatar"><i class="bi bi-person-fill"></i></div>
      <div class="msg-bubble">${escapeHtml(text)}</div>
    `;
    messagesContainer.appendChild(msg);
    scrollToBottom();
  }

  function appendBotMessage(text, isError = false) {
    const msg = document.createElement("div");
    msg.className = "chatbot-msg bot";
    msg.innerHTML = `
      <div class="msg-avatar"><i class="bi bi-robot"></i></div>
      <div class="msg-bubble${isError ? " error" : ""}">${formatBotText(text)}</div>
    `;
    messagesContainer.appendChild(msg);
    scrollToBottom();
  }

  /* =============================================================
     Typing Indicator
  ============================================================= */
  function showTyping() {
    // Make sure we don't duplicate
    if (messagesContainer.querySelector(".chatbot-typing")) return;

    const typing = document.createElement("div");
    typing.className = "chatbot-typing";
    typing.innerHTML = `
      <div class="msg-avatar"><i class="bi bi-robot"></i></div>
      <div class="typing-bubble">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    `;
    messagesContainer.appendChild(typing);
    scrollToBottom();
  }

  function hideTyping() {
    const typing = messagesContainer.querySelector(".chatbot-typing");
    if (typing) typing.remove();
  }

  /* =============================================================
     Loading State
  ============================================================= */
  function setLoading(state) {
    isLoading = state;
    sendBtn.disabled = state;
    textarea.disabled = state;

    if (state) {
      sendBtn.innerHTML = '<i class="bi bi-arrow-repeat chatbot-spin"></i>';
    } else {
      sendBtn.innerHTML = '<i class="bi bi-send-fill"></i>';
    }
  }

  /* =============================================================
     Clear Chat (Reset)
  ============================================================= */
  function clearChat() {
    hideTyping();
    setLoading(false);
    textarea.value = "";
    autoResizeTextarea();
    renderEmptyState();
  }

  /* =============================================================
     Utility Functions
  ============================================================= */

  /** Remove welcome & suggestions on first message */
  function clearWelcomeState() {
    const welcome = messagesContainer.querySelector(".chatbot-welcome");
    const suggestions = messagesContainer.querySelector(".chatbot-suggestions");
    if (welcome) welcome.remove();
    if (suggestions) suggestions.remove();
  }

  /** Auto-scroll to latest message */
  function scrollToBottom() {
    requestAnimationFrame(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
  }

  /** Auto-resize textarea based on content */
  function autoResizeTextarea() {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  }

  /** Basic HTML escaping to prevent XSS */
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /** Format bot response — convert newlines to <br> and basic markdown bold */
  function formatBotText(text) {
    let escaped = escapeHtml(text);
    // Convert newlines
    escaped = escaped.replace(/\n/g, "<br>");
    // Bold: **text**
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    return escaped;
  }
})();
