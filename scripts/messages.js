// Messages page functionality
(function () {
  'use strict';

  const messageForm = document.getElementById('messageForm');
  const messageInput = document.getElementById('messageInput');
  const anonymousToggle = document.getElementById('anonymousToggle');
  const emergencyBtn = document.getElementById('emergencyBtn');
  const emergencyModal = new bootstrap.Modal(document.getElementById('emergencyModal'));
  const emergencyForm = document.getElementById('emergencyForm');
  const submitEmergencyBtn = document.getElementById('submitEmergency');
  const messagesContainer = document.getElementById('messagesContainer');
  const pinnedMessagesContainer = document.getElementById('pinnedMessagesContainer');
  const pinnedMessagesCard = document.getElementById('pinnedMessagesCard');

  // Get username from localStorage or default
  const currentUsername = localStorage.getItem('username') || 'User';
  document.getElementById('displayUsername').textContent = currentUsername;

  // Sample messages data (will be replaced with API calls)
  let messages = [
    {
      id: 1,
      author: 'JohnDoe',
      content: 'Welcome to the building message board! Feel free to share updates and connect with neighbors.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      anonymous: false,
      emergency: false,
      pinned: false,
      isAdmin: false,
    },
  ];

  // Sample pinned messages from admins (will be replaced with API calls)
  let pinnedMessages = [
    {
      id: 100,
      author: 'Admin',
      content: 'Important: Building maintenance scheduled for this Saturday from 9 AM to 12 PM. Please plan accordingly.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      anonymous: false,
      emergency: false,
      pinned: true,
      isAdmin: true,
    },
    {
      id: 101,
      author: 'Admin',
      content: 'Welcome to the community message board! This is a space for residents to share updates, ask questions, and stay connected. Please be respectful and follow community guidelines.',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      anonymous: false,
      emergency: false,
      pinned: true,
      isAdmin: true,
    },
  ];

  // Format timestamp
  function formatTimestamp(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }

  // Render pinned messages
  function renderPinnedMessages() {
    pinnedMessagesContainer.innerHTML = '';

    if (pinnedMessages.length === 0) {
      pinnedMessagesCard.style.display = 'none';
      return;
    }

    pinnedMessagesCard.style.display = 'block';

    pinnedMessages.forEach((message) => {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message-item pinned';

      const authorDisplay = message.anonymous ? 'Anonymous' : message.author;
      const adminBadge = message.isAdmin ? '<span class="admin-badge">ADMIN</span>' : '';

      messageDiv.innerHTML = `
        <div class="message-header">
          <span class="message-author">
            <i class="bi bi-pin-angle-fill text-warning"></i>
            ${escapeHtml(authorDisplay)}
            ${adminBadge}
          </span>
          <span class="message-time">${formatTimestamp(message.timestamp)}</span>
        </div>
        <div class="message-content">${escapeHtml(message.content)}</div>
      `;

      pinnedMessagesContainer.appendChild(messageDiv);
    });
  }

  // Render regular messages
  function renderMessages() {
    messagesContainer.innerHTML = '';

    // Filter out pinned messages from regular messages
    const regularMessages = messages.filter((msg) => !msg.pinned);

    regularMessages.forEach((message) => {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message-item ${message.emergency ? 'emergency' : ''}`;

      const authorDisplay = message.anonymous ? 'Anonymous' : message.author;
      const authorClass = message.anonymous ? 'anonymous' : '';

      messageDiv.innerHTML = `
        <div class="message-header">
          <span class="message-author ${authorClass}">
            ${escapeHtml(authorDisplay)}
            ${message.emergency ? '<span class="emergency-badge">EMERGENCY</span>' : ''}
          </span>
          <span class="message-time">${formatTimestamp(message.timestamp)}</span>
        </div>
        <div class="message-content">${escapeHtml(message.content)}</div>
      `;

      messagesContainer.appendChild(messageDiv);
    });

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Add new message
  function addMessage(content, anonymous = false, emergency = false) {
    const newMessage = {
      id: messages.length + 1,
      author: currentUsername,
      content: content.trim(),
      timestamp: new Date(),
      anonymous: anonymous,
      emergency: emergency,
      pinned: false,
      isAdmin: false,
    };

    messages.unshift(newMessage); // Add to beginning
    renderMessages();

    // TODO: Replace with API call to save message to database
    console.log('Message to be saved:', {
      id: newMessage.id,
      author: newMessage.author,
      content: newMessage.content,
      anonymous: newMessage.anonymous,
      emergency: newMessage.emergency,
      timestamp: newMessage.timestamp,
    });

    // Example API call:
    // fetch('/api/messages', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(newMessage)
    // })
    //   .then(response => response.json())
    //   .then(data => {
    //     // Handle success
    //   })
    //   .catch(error => {
    //     // Handle error
    //   });
  }

  // Handle message form submission
  messageForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const content = messageInput.value.trim();
    if (!content) {
      messageInput.focus();
      return;
    }

    const isAnonymous = anonymousToggle.checked;

    addMessage(content, isAnonymous, false);

    // Reset form
    messageInput.value = '';
    anonymousToggle.checked = false;
  });

  // Handle emergency button click
  emergencyBtn.addEventListener('click', function () {
    emergencyModal.show();
  });

  // Handle emergency form submission
  submitEmergencyBtn.addEventListener('click', function () {
    if (!emergencyForm.checkValidity()) {
      emergencyForm.reportValidity();
      return;
    }

    const emergencyType = document.getElementById('emergencyType').value;
    const location = document.getElementById('emergencyLocation').value;
    const description = document.getElementById('emergencyDescription').value;

    const emergencyMessage = `[EMERGENCY: ${emergencyType.toUpperCase()}] Location: ${location}\n\n${description}`;

    // Add as emergency message (not anonymous for emergencies)
    addMessage(emergencyMessage, false, true);

    // TODO: Replace with API call to notify administrators
    console.log('Emergency reported:', {
      type: emergencyType,
      location: location,
      description: description,
      timestamp: new Date(),
    });

    // Example API call:
    // fetch('/api/emergency', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     type: emergencyType,
    //     location: location,
    //     description: description,
    //     timestamp: new Date()
    //   })
    // })
    //   .then(response => response.json())
    //   .then(data => {
    //     // Handle success
    //   })
    //   .catch(error => {
    //     // Handle error
    //   });

    // Close modal and reset form
    emergencyModal.hide();
    emergencyForm.reset();

    // Show alert
    alert('Emergency reported! Building administrators have been notified.');
  });

  // Load messages on page load
  // TODO: Replace with API call to fetch messages
  // fetch('/api/messages')
  //   .then(response => response.json())
  //   .then(data => {
  //     // Separate pinned and regular messages
  //     pinnedMessages = data.filter(msg => msg.pinned);
  //     messages = data.filter(msg => !msg.pinned);
  //     renderPinnedMessages();
  //     renderMessages();
  //   })
  //   .catch(error => {
  //     console.error('Error loading messages:', error);
  //   });

  // Initial render
  renderPinnedMessages();
  renderMessages();
})();

