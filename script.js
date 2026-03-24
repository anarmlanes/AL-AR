const badWords = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "cunt",
  "motherfucker",
  "puta",
  "caralho",
  "foda",
  "foder",
  "merda",
  "cabrao",
  "cabrão",
  "filho da puta",
  "fdp",
  "otario",
  "otário"
];

const MAX_CHARS = 280;
const MAX_WORDS = 40;

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function containsBadWords(text) {
  const normalized = normalizeText(text);
  return badWords.some((word) => normalized.includes(normalizeText(word)));
}

function getWordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function getStoredMessages() {
  const data = localStorage.getItem("alcarMessages");
  return data ? JSON.parse(data) : [];
}

function setStoredMessages(messages) {
  localStorage.setItem("alcarMessages", JSON.stringify(messages));
}

function setupMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const mobileNav = document.getElementById("mobileNav");

  if (!menuToggle || !mobileNav) return;

  menuToggle.addEventListener("click", () => {
    mobileNav.classList.toggle("show");
  });
}

function placeCaretAtEnd(el) {
  el.focus();
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function getPlainTextFromEditor(editor) {
  return editor.innerText.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
}

function getSelectionInsideEditor(editor) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return false;
  const range = selection.getRangeAt(0);
  return editor.contains(range.commonAncestorContainer);
}

function updateCounter(editor, charCounter) {
  const text = getPlainTextFromEditor(editor);
  charCounter.textContent = `${text.length} / ${MAX_CHARS}`;
}

function trimEditorToLimits(editor) {
  let text = getPlainTextFromEditor(editor);

  if (text.length > MAX_CHARS) {
    text = text.slice(0, MAX_CHARS).trim();
  }

  const words = text ? text.split(/\s+/) : [];
  if (words.length > MAX_WORDS) {
    text = words.slice(0, MAX_WORDS).join(" ");
  }

  editor.innerText = text;
  placeCaretAtEnd(editor);
}

function enforceLimits(editor, warningMessage, charCounter) {
  const text = getPlainTextFromEditor(editor);
  const wordCount = getWordCount(text);

  if (text.length > MAX_CHARS || wordCount > MAX_WORDS) {
    trimEditorToLimits(editor);
    warningMessage.textContent = `Maximum ${MAX_WORDS} words and ${MAX_CHARS} characters.`;
  } else {
    warningMessage.textContent = "";
  }

  updateCounter(editor, charCounter);
}

function applyFontToSelection(fontValue, editor) {
  editor.focus();

  if (!getSelectionInsideEditor(editor)) {
    placeCaretAtEnd(editor);
  }

  document.execCommand("fontName", false, fontValue);

  editor.querySelectorAll("font").forEach((fontTag) => {
    const span = document.createElement("span");
    span.style.fontFamily = fontValue;
    span.innerHTML = fontTag.innerHTML;
    fontTag.replaceWith(span);
  });
}

function setupEditorPage() {
  const editor = document.getElementById("editor");
  const sendBtn = document.getElementById("sendBtn");
  const warningMessage = document.getElementById("warningMessage");
  const fontSelect = document.getElementById("fontSelect");
  const boldBtn = document.getElementById("boldBtn");
  const colorPicker = document.getElementById("colorPicker");
  const charCounter = document.getElementById("charCounter");

  if (!editor || !sendBtn) return;

  editor.style.fontFamily = "FuturaCyrillicMedium, Futura, Arial, sans-serif";
  updateCounter(editor, charCounter);

  fontSelect.addEventListener("change", () => {
    applyFontToSelection(fontSelect.value, editor);
  });

  boldBtn.addEventListener("click", () => {
    editor.focus();

    if (!getSelectionInsideEditor(editor)) {
      placeCaretAtEnd(editor);
    }

    document.execCommand("bold", false, null);
    editor.focus();
  });

  colorPicker.addEventListener("input", () => {
    editor.focus();

    if (!getSelectionInsideEditor(editor)) {
      placeCaretAtEnd(editor);
    }

    document.execCommand("foreColor", false, colorPicker.value);
    editor.focus();
  });

  editor.addEventListener("input", () => {
    enforceLimits(editor, warningMessage, charCounter);
  });

  editor.addEventListener("paste", (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text");
    document.execCommand("insertText", false, text);
    enforceLimits(editor, warningMessage, charCounter);
  });

  sendBtn.addEventListener("click", () => {
    const plainText = getPlainTextFromEditor(editor);
    const htmlText = editor.innerHTML.trim();

    warningMessage.textContent = "";

    if (!plainText) {
      warningMessage.textContent = "Please write a message first.";
      return;
    }

    if (plainText.length > MAX_CHARS || getWordCount(plainText) > MAX_WORDS) {
      warningMessage.textContent = `Maximum ${MAX_WORDS} words and ${MAX_CHARS} characters.`;
      return;
    }

    if (containsBadWords(plainText)) {
      warningMessage.textContent =
        "This message cannot be sent because it contains inappropriate language.";
      return;
    }

    localStorage.setItem("alcarPendingMessage", htmlText);
    window.location.href = "submit.html";
  });
}

function setupSubmitPage() {
  const confirmBtn = document.getElementById("confirmSubmit");
  if (!confirmBtn) return;

  confirmBtn.addEventListener("click", () => {
    const pending = localStorage.getItem("alcarPendingMessage");

    if (pending) {
      const messages = getStoredMessages();
      messages.unshift(pending);
      setStoredMessages(messages);
      localStorage.removeItem("alcarPendingMessage");
    }

    window.location.href = "look.html";
  });
}

function renderArchive() {
  const archiveStream = document.getElementById("archiveStream");
  if (!archiveStream) return;

  const messages = getStoredMessages();

  const defaultMessages = [
    "my voice matters",
    "stop the violence",
    "we are still here",
    "listen to women",
    "silence is not peace"
  ];

  const merged = messages.length ? messages : defaultMessages;

  archiveStream.innerHTML = "";

  merged.forEach((message) => {
    const item = document.createElement("div");
    item.className = "archive-message";
    item.innerHTML = message;
    archiveStream.appendChild(item);
  });
}

setupMenu();
setupEditorPage();
setupSubmitPage();
renderArchive();