// Messages page functionality
(function () {
  'use strict';

  // API configuration
  const apiUrl = 'http://localhost:5000/api'; // Update with your API URL
  const buildingId = localStorage.getItem('buildingId') || 1; // Default to building 1

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

  // Messages data - loaded from API
  let messages = [];
  let pinnedMessages = [];

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
      const isEmergency = message.emergency;
      messageDiv.className = `message-item pinned ${isEmergency ? 'emergency-pinned' : ''}`;

      const authorDisplay = message.anonymous ? 'Anonymous' : message.author;
      const adminBadge = message.isAdmin ? '<span class="admin-badge">ADMIN</span>' : '';
      
      // Emergency type badge
      let emergencyBadge = '';
      if (isEmergency && message.emergencyType) {
        const emergencyTypeLabels = {
          medical: 'MEDICAL EMERGENCY',
          fire: 'FIRE EMERGENCY',
          security: 'SECURITY EMERGENCY',
          other: 'EMERGENCY'
        };
        const emergencyLabel = emergencyTypeLabels[message.emergencyType] || 'EMERGENCY';
        emergencyBadge = `<span class="emergency-badge">${emergencyLabel}</span>`;
      }

      messageDiv.innerHTML = `
        <div class="message-header">
          <span class="message-author">
            <i class="bi bi-pin-angle-fill text-warning"></i>
            ${escapeHtml(authorDisplay)}
            ${adminBadge}
            ${emergencyBadge}
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
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('You must be logged in to post messages');
      return;
    }

    const buildingId = localStorage.getItem('buildingId') || 1;
    
    // API call to save message to database
    fetch(`${apiUrl}/messages`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'user-id': userId
      },
      body: JSON.stringify({
        buildingId: buildingId,
        content: content.trim(),
        isAnonymous: anonymous
      })
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => Promise.reject(err));
        }
        return response.json();
      })
      .then(data => {
        console.log('Message saved:', data);
        // Reload messages from server
        loadMessages();
      })
      .catch(error => {
        console.error('Error saving message:', error);
        alert('Failed to save message. Please try again.');
      });
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
    const userId = localStorage.getItem('userId');
    const buildingId = parseInt(localStorage.getItem('buildingId'), 10) || 1;

    if (!userId) {
      alert('You must be logged in to report emergencies');
      return;
    }

    if (!buildingId || buildingId < 1) {
      alert('Invalid building. Please ensure you are assigned to a building.');
      return;
    }

    console.log('Reporting emergency:', {
      buildingId: buildingId,
      emergencyType: emergencyType,
      location: location,
      userId: userId
    });

    // API call to report emergency
    fetch(`${apiUrl}/emergencies`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'user-id': userId
      },
      body: JSON.stringify({
        buildingId: buildingId,
        emergencyType: emergencyType,
        location: location,
        description: description,
        userId: userId
      })
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => Promise.reject(err));
        }
        return response.json();
      })
      .then(data => {
        console.log('Emergency reported:', data);
        alert('Emergency reported! Building administrators have been notified.');
      })
      .catch(error => {
        console.error('Error reporting emergency:', error);
        alert('Failed to report emergency. Please try again or call 911.');
      });

    // Close modal and reset form
    emergencyModal.hide();
    emergencyForm.reset();

    // Show alert
    alert('Emergency reported! Building administrators have been notified.');
  });

  // Load building info
  async function loadBuildingInfo() {
    try {
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');

      // Get building stats (includes building name and member count)
      const buildingResponse = await fetch(`${apiUrl}/buildings/${buildingId}/stats`, {
        headers: {
          'user-id': userId,
          'user-role': userRole
        }
      });

      if (buildingResponse.ok) {
        const stats = await buildingResponse.json();
        if (stats.building_name) {
          document.getElementById('buildingName').textContent = stats.building_name;
        }
        document.getElementById('memberCount').textContent = stats.memberCount || '0';
      } else {
        // If stats endpoint fails (e.g., student user), try to get building name from all buildings
        if (userRole === 'admin') {
          const buildingsResponse = await fetch(`${apiUrl}/buildings`, {
            headers: {
              'user-id': userId,
              'user-role': userRole
            }
          });

          if (buildingsResponse.ok) {
            const buildings = await buildingsResponse.json();
            const building = buildings.find(b => b.building_id === parseInt(buildingId));
            if (building) {
              document.getElementById('buildingName').textContent = building.building_name;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading building info:', error);
      document.getElementById('buildingName').textContent = 'Error';
      document.getElementById('memberCount').textContent = '-';
    }
  }

  // Load messages from API
  function loadMessages() {
    Promise.all([
      fetch(`${apiUrl}/messages?buildingId=${buildingId}`).then(r => {
        if (!r.ok) throw new Error('Failed to load messages');
        return r.json();
      }),
      fetch(`${apiUrl}/messages/pinned?buildingId=${buildingId}`).then(r => {
        if (!r.ok) throw new Error('Failed to load pinned messages');
        return r.json();
      })
    ])
      .then(([messagesData, pinnedData]) => {
        // Transform API response to match expected format
        messages = messagesData.map(msg => ({
          id: msg.message_id,
          author: msg.is_anonymous ? 'Anonymous' : msg.author,
          content: msg.content, // TODO: Decrypt if encrypted
          timestamp: new Date(msg.created_at),
          anonymous: msg.is_anonymous,
          emergency: false,
          pinned: false,
          isAdmin: msg.author_role === 'admin' || msg.author_role === 'RA'
        }));
        
        pinnedMessages = pinnedData.map(msg => ({
          id: msg.pinned_message_id,
          author: msg.author,
          content: msg.content, // TODO: Decrypt if encrypted
          timestamp: new Date(msg.created_at),
          anonymous: false,
          emergency: msg.emergency_id !== null && msg.emergency_id !== undefined,
          emergencyType: msg.emergency_type || null,
          pinned: true,
          isAdmin: msg.author_role === 'admin' || msg.author_role === 'RA'
        }));
        
        renderPinnedMessages();
        renderMessages();
      })
      .catch(error => {
        console.error('Error loading messages:', error);
        messages = [];
        pinnedMessages = [];
        renderPinnedMessages();
        renderMessages();
      });
  }

  // Load messages on page load
  // Load building info and messages on page load
  loadBuildingInfo();
  loadMessages();
})();

