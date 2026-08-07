import { loadDatabase } from './dataService.js';

const CHAT_KEY = 'ace_chat_conversations';
const CHAT_FILES_DB = 'ace_chat_files';
const MAX_FILE_SIZE = 25 * 1024 * 1024;
let currentUser = null;
let users = [];
let conversations = {};
let activeUserId = null;
let selectedFile = null;
const attachmentUrls = new Set();

function openFilesDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CHAT_FILES_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('files');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storeFile(id, file) {
  const database = await openFilesDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('files', 'readwrite');
    transaction.objectStore('files').put(file, id);
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => { database.close(); reject(transaction.error); };
  });
}

async function getFile(id) {
  const database = await openFilesDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction('files').objectStore('files').get(id);
    request.onsuccess = () => { database.close(); resolve(request.result || null); };
    request.onerror = () => { database.close(); reject(request.error); };
  });
}

async function removeFile(id) {
  if (!id) return;
  const database = await openFilesDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('files', 'readwrite');
    transaction.objectStore('files').delete(id);
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => { database.close(); reject(transaction.error); };
  });
}

function readCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

function conversationKey(userId) {
  return String(userId);
}

function chatStorageKey() {
  return `${CHAT_KEY}_${currentUser?.email || currentUser?.sub || 'workspace'}`;
}

function loadConversations() {
  try {
    conversations = JSON.parse(localStorage.getItem(chatStorageKey()) || '{}');
  } catch {
    conversations = {};
  }

  if (Object.keys(conversations).length === 0 && users.length) {
    const now = Date.now();
    users.slice(0, 2).forEach((user, index) => {
      conversations[conversationKey(user.id)] = [{
        id: `welcome-${user.id}`,
        sender: user.id,
        text: index === 0
          ? 'Hi! Let me know if you want me to review any candidates today.'
          : 'The interview shortlist is ready whenever you want to take a look.',
        createdAt: new Date(now - ((index + 1) * 45 * 60000)).toISOString()
      }];
    });
    saveConversations();
  }
}

function saveConversations() {
  localStorage.setItem(chatStorageKey(), JSON.stringify(conversations));
}

function latestMessage(userId) {
  const messages = conversations[conversationKey(userId)] || [];
  return messages[messages.length - 1] || null;
}

function sortedRecentUsers() {
  return users
    .filter(user => (conversations[conversationKey(user.id)] || []).length)
    .sort((a, b) => {
      const aTime = new Date(latestMessage(a.id)?.createdAt || 0).getTime();
      const bTime = new Date(latestMessage(b.id)?.createdAt || 0).getTime();
      return bTime - aTime;
    });
}

function formatTime(value) {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function createAvatar(user, className = 'chat-avatar') {
  const avatar = document.createElement('span');
  avatar.className = className;
  avatar.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.9"/>
      <path d="M4.5 21C4.5 16.8579 7.85786 13.5 12 13.5C16.1421 13.5 19.5 16.8579 19.5 21" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>
    </svg>`;
  avatar.title = user.fullName;
  avatar.setAttribute('aria-hidden', 'true');
  return avatar;
}

function renderRecentChats() {
  const list = document.getElementById('chat-recent-list');
  if (!list) return;
  list.replaceChildren();
  const recentUsers = sortedRecentUsers();

  if (!recentUsers.length) {
    const empty = document.createElement('p');
    empty.className = 'chat-empty';
    empty.textContent = 'No conversations yet. Start a new chat with your team.';
    list.appendChild(empty);
    return;
  }

  recentUsers.forEach(user => {
    const last = latestMessage(user.id);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chat-person';
    button.dataset.chatUserId = user.id;
    button.appendChild(createAvatar(user));

    const copy = document.createElement('span');
    copy.className = 'chat-person-copy';
    const name = document.createElement('strong');
    name.textContent = user.fullName;
    const preview = document.createElement('small');
    preview.textContent = last?.text || (last?.attachment ? 'Sent an attachment' : 'Start a conversation');
    copy.append(name, preview);

    const time = document.createElement('time');
    time.textContent = last ? formatTime(last.createdAt) : '';
    button.append(copy, time);
    list.appendChild(button);
  });
}

function renderPeople(query = '') {
  const list = document.getElementById('chat-people-list');
  if (!list) return;
  list.replaceChildren();
  const normalized = query.trim().toLowerCase();
  const matches = users.filter(user =>
    !normalized ||
    user.fullName.toLowerCase().includes(normalized) ||
    user.role.toLowerCase().includes(normalized)
  );

  matches.forEach(user => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chat-person';
    button.dataset.chatUserId = user.id;
    button.appendChild(createAvatar(user));
    const copy = document.createElement('span');
    copy.className = 'chat-person-copy';
    const name = document.createElement('strong');
    name.textContent = user.fullName;
    const role = document.createElement('small');
    role.textContent = user.role;
    copy.append(name, role);
    button.appendChild(copy);
    list.appendChild(button);
  });
}

function clearAttachmentUrls() {
  attachmentUrls.forEach(url => URL.revokeObjectURL(url));
  attachmentUrls.clear();
}

async function createAttachment(message) {
  if (!message.attachment) return null;
  const wrapper = document.createElement('div');
  wrapper.className = 'chat-attachment';
  let file = null;
  try {
    file = await getFile(message.attachment.id);
  } catch {}
  if (!file) {
    wrapper.textContent = `${message.attachment.name} (unavailable)`;
    return wrapper;
  }

  const url = URL.createObjectURL(file);
  attachmentUrls.add(url);
  if (message.attachment.type.startsWith('image/')) {
    const image = document.createElement('img');
    image.src = url;
    image.alt = message.attachment.name;
    image.loading = 'lazy';
    wrapper.appendChild(image);
  }
  const link = document.createElement('a');
  link.href = url;
  link.download = message.attachment.name;
  link.textContent = message.attachment.type.startsWith('image/')
    ? message.attachment.name
    : `📎 ${message.attachment.name}`;
  wrapper.appendChild(link);
  return wrapper;
}

async function renderMessages() {
  const container = document.getElementById('chat-messages');
  if (!container || activeUserId === null) return;
  clearAttachmentUrls();
  container.replaceChildren();
  const messages = conversations[conversationKey(activeUserId)] || [];

  for (const message of messages) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${message.sender === 'me' ? 'sent' : 'received'}`;
    bubble.dataset.messageId = message.id;
    const menuButton = document.createElement('button');
    menuButton.type = 'button';
    menuButton.className = 'chat-message-menu-button';
    menuButton.dataset.messageMenu = message.id;
    menuButton.setAttribute('aria-label', 'Message options');
    menuButton.textContent = '⋮';
    const menu = document.createElement('div');
    menu.className = 'chat-message-menu';
    menu.hidden = true;
    if (message.sender === 'me' && message.text) {
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.dataset.messageAction = 'edit';
      edit.dataset.messageId = message.id;
      edit.textContent = 'Edit message';
      menu.appendChild(edit);
    }
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.dataset.messageAction = 'delete';
    remove.dataset.messageId = message.id;
    remove.textContent = 'Delete message';
    menu.appendChild(remove);
    bubble.append(menuButton, menu);

    const attachment = await createAttachment(message);
    if (attachment) bubble.appendChild(attachment);
    const text = document.createElement('p');
    text.textContent = message.text;
    if (!message.text) text.hidden = true;
    const time = document.createElement('time');
    time.textContent = `${formatTime(message.createdAt)}${message.editedAt ? ' · edited' : ''}`;
    bubble.append(text, time);
    container.appendChild(bubble);
  }
  container.scrollTop = container.scrollHeight;
}

function openConversation(userId) {
  const user = users.find(item => String(item.id) === String(userId));
  if (!user) return;
  activeUserId = user.id;
  document.getElementById('chat-list-view').hidden = true;
  document.getElementById('chat-people-view').hidden = true;
  document.getElementById('chat-conversation-view').hidden = false;
  document.getElementById('chat-conversation-name').textContent = user.fullName;
  document.getElementById('chat-conversation-role').textContent = user.role;
  const avatarSlot = document.getElementById('chat-conversation-avatar');
  avatarSlot.replaceChildren(createAvatar(user, 'chat-avatar'));
  renderMessages();
  document.getElementById('chat-message-input')?.focus();
}

function showListView() {
  activeUserId = null;
  document.getElementById('chat-list-view').hidden = false;
  document.getElementById('chat-people-view').hidden = true;
  document.getElementById('chat-conversation-view').hidden = true;
  renderRecentChats();
}

function showPeopleView() {
  document.getElementById('chat-list-view').hidden = true;
  document.getElementById('chat-people-view').hidden = false;
  document.getElementById('chat-conversation-view').hidden = true;
  const search = document.getElementById('chat-people-search');
  search.value = '';
  renderPeople();
  search.focus();
}

function renderSelectedFile() {
  const preview = document.getElementById('chat-selected-file');
  if (!preview) return;
  preview.hidden = !selectedFile;
  preview.querySelector('span').textContent = selectedFile
    ? `${selectedFile.name} · ${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
    : '';
}

async function sendMessage() {
  const input = document.getElementById('chat-message-input');
  const text = input?.value.trim();
  if ((!text && !selectedFile) || activeUserId === null) return;
  const key = conversationKey(activeUserId);
  if (!conversations[key]) conversations[key] = [];
  const id = `message-${Date.now()}`;
  const message = {
    id,
    sender: 'me',
    text,
    createdAt: new Date().toISOString()
  };
  if (selectedFile) {
    const attachmentId = `attachment-${id}`;
    try {
      await storeFile(attachmentId, selectedFile);
    } catch {
      window.alert('The attachment could not be saved in this browser.');
      return;
    }
    message.attachment = {
      id: attachmentId,
      name: selectedFile.name,
      type: selectedFile.type || 'application/octet-stream',
      size: selectedFile.size
    };
  }
  conversations[key].push(message);
  input.value = '';
  selectedFile = null;
  document.getElementById('chat-file-input').value = '';
  renderSelectedFile();
  saveConversations();
  await renderMessages();
}

function findMessage(messageId) {
  const messages = conversations[conversationKey(activeUserId)] || [];
  return messages.find(message => message.id === messageId);
}

function editMessage(messageId) {
  const message = findMessage(messageId);
  const bubble = document.querySelector(`.chat-bubble[data-message-id="${CSS.escape(messageId)}"]`);
  if (!message || !bubble || message.sender !== 'me') return;
  const text = bubble.querySelector('p');
  const editor = document.createElement('textarea');
  editor.className = 'chat-message-editor';
  editor.maxLength = 500;
  editor.value = message.text;
  const actions = document.createElement('div');
  actions.className = 'chat-edit-actions';
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.textContent = 'Cancel';
  const save = document.createElement('button');
  save.type = 'button';
  save.textContent = 'Save';
  actions.append(cancel, save);
  text.replaceWith(editor);
  editor.after(actions);
  editor.focus();
  cancel.addEventListener('click', renderMessages);
  save.addEventListener('click', () => {
    const value = editor.value.trim();
    if (!value) return;
    message.text = value;
    message.editedAt = new Date().toISOString();
    saveConversations();
    renderMessages();
  });
}

async function deleteMessage(messageId) {
  const key = conversationKey(activeUserId);
  const messages = conversations[key] || [];
  const index = messages.findIndex(message => message.id === messageId);
  if (index < 0) return;
  const [message] = messages.splice(index, 1);
  await removeFile(message.attachment?.id).catch(() => {});
  saveConversations();
  await renderMessages();
}

function createChatShell() {
  const shell = document.createElement('div');
  shell.id = 'crm-chat';
  shell.innerHTML = `
    <button type="button" class="chat-launcher" id="chat-launcher" aria-label="Open team messages" aria-expanded="false">
      <svg viewBox="0 0 24 24" fill="none"><path d="M21 15A4 4 0 0 1 17 19H8L3 22V7A4 4 0 0 1 7 3H17A4 4 0 0 1 21 7V15Z" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M8 9H16M8 13H13" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>
      <span>Messages</span>
    </button>
    <section class="chat-panel" id="chat-panel" aria-label="Team messages" hidden>
      <div id="chat-list-view">
        <header class="chat-header">
          <div><span class="chat-eyebrow">Team workspace</span><h2>Messages</h2></div>
          <div class="chat-header-actions">
            <button type="button" id="chat-new-message" aria-label="Start new chat">+</button>
            <button type="button" data-chat-close aria-label="Close messages">×</button>
          </div>
        </header>
        <div class="chat-section-label">Recent chats</div>
        <div class="chat-list" id="chat-recent-list"></div>
      </div>
      <div id="chat-people-view" hidden>
        <header class="chat-header">
          <button type="button" class="chat-back" data-chat-back aria-label="Back to recent chats">←</button>
          <div><span class="chat-eyebrow">New message</span><h2>Choose a teammate</h2></div>
          <button type="button" data-chat-close aria-label="Close messages">×</button>
        </header>
        <div class="chat-search"><input type="search" id="chat-people-search" placeholder="Search by name or role" /></div>
        <div class="chat-list" id="chat-people-list"></div>
      </div>
      <div id="chat-conversation-view" hidden>
        <header class="chat-header conversation-header">
          <button type="button" class="chat-back" data-chat-back aria-label="Back to recent chats">←</button>
          <span id="chat-conversation-avatar"></span>
          <div class="chat-contact-heading"><h2 id="chat-conversation-name"></h2><span id="chat-conversation-role"></span></div>
          <button type="button" data-chat-close aria-label="Close messages">×</button>
        </header>
        <div class="chat-messages" id="chat-messages"></div>
        <form class="chat-composer" id="chat-composer">
          <div class="chat-selected-file" id="chat-selected-file" hidden><span></span><button type="button" id="chat-remove-file" aria-label="Remove attachment">×</button></div>
          <label class="chat-attach-button" for="chat-file-input" aria-label="Attach a file or picture" title="Attach file (max 25 MB)">
            <svg viewBox="0 0 24 24" fill="none"><path d="M21.4 11.6L12 21A6 6 0 0 1 3.5 12.5L13 3A4 4 0 0 1 18.7 8.7L9.2 18.2A2 2 0 1 1 6.4 15.4L15.2 6.6" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </label>
          <input type="file" id="chat-file-input" accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.ppt,.pptx" hidden />
          <input id="chat-message-input" maxlength="500" autocomplete="off" placeholder="Write a message..." aria-label="Message" />
          <button type="submit" aria-label="Send message"><svg viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></button>
        </form>
      </div>
    </section>`;
  document.body.appendChild(shell);
}

function setupEvents() {
  const launcher = document.getElementById('chat-launcher');
  const panel = document.getElementById('chat-panel');
  launcher.addEventListener('click', () => {
    const willOpen = panel.hidden;
    panel.hidden = !willOpen;
    launcher.setAttribute('aria-expanded', String(willOpen));
    if (willOpen) showListView();
  });
  document.querySelectorAll('[data-chat-close]').forEach(button => button.addEventListener('click', () => {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
  }));
  document.querySelectorAll('[data-chat-back]').forEach(button => button.addEventListener('click', showListView));
  document.getElementById('chat-new-message').addEventListener('click', showPeopleView);
  document.getElementById('chat-people-search').addEventListener('input', event => renderPeople(event.target.value));
  document.getElementById('chat-composer').addEventListener('submit', event => {
    event.preventDefault();
    sendMessage();
  });
  document.getElementById('chat-file-input').addEventListener('change', event => {
    const file = event.target.files?.[0] || null;
    if (file && file.size > MAX_FILE_SIZE) {
      event.target.value = '';
      selectedFile = null;
      renderSelectedFile();
      window.alert('Files must be 25 MB or smaller.');
      return;
    }
    selectedFile = file;
    renderSelectedFile();
  });
  document.getElementById('chat-remove-file').addEventListener('click', () => {
    selectedFile = null;
    document.getElementById('chat-file-input').value = '';
    renderSelectedFile();
  });
  document.getElementById('crm-chat').addEventListener('click', event => {
    const person = event.target.closest('[data-chat-user-id]');
    if (person) openConversation(person.dataset.chatUserId);
    const menuButton = event.target.closest('[data-message-menu]');
    if (menuButton) {
      const menu = menuButton.nextElementSibling;
      document.querySelectorAll('.chat-message-menu').forEach(item => {
        if (item !== menu) item.hidden = true;
      });
      menu.hidden = !menu.hidden;
    }
    const action = event.target.closest('[data-message-action]');
    if (action?.dataset.messageAction === 'edit') editMessage(action.dataset.messageId);
    if (action?.dataset.messageAction === 'delete') deleteMessage(action.dataset.messageId);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.chat-message-menu, [data-message-menu]')) {
      document.querySelectorAll('.chat-message-menu').forEach(menu => { menu.hidden = true; });
    }
  });
}

export async function initChat() {
  if (document.getElementById('crm-chat')) return;
  currentUser = readCurrentUser();
  if (!currentUser) return;
  const db = await loadDatabase();
  users = (db.users || []).filter(user => user.email !== currentUser.email);
  if (!users.length) return;
  loadConversations();
  createChatShell();
  setupEvents();
  renderRecentChats();
}
