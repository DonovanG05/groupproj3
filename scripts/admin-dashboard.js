// Admin Dashboard functionality
(function () {
  'use strict';

  // API configuration
  const apiUrl = 'http://localhost:5000/api';
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');
  const username = localStorage.getItem('username') || 'Admin';

  // Check if user is admin
  if (userRole !== 'admin') {
    alert('Access denied. This page is for admins only.');
    window.location.href = 'home.html';
    return;
  }

  // Set username display
  document.getElementById('displayUsername').textContent = username;

  // Elements
  const buildingsList = document.getElementById('buildingsList');
  const currentBuildingName = document.getElementById('currentBuildingName');
  const memberCount = document.getElementById('memberCount');
  const messageCount = document.getElementById('messageCount');
  const noBuildingAlert = document.getElementById('noBuildingAlert');
  const messagesSection = document.getElementById('messagesSection');
  const messagesContainer = document.getElementById('messagesContainer');
  const pinnedMessagesContainer = document.getElementById('pinnedMessagesContainer');
  const pinnedMessagesCard = document.getElementById('pinnedMessagesCard');
  const messageForm = document.getElementById('messageForm');
  const messageInput = document.getElementById('messageInput');
  const anonymousToggle = document.getElementById('anonymousToggle');
  const pinMessageBtn = document.getElementById('pinMessageBtn');
  const pinMessageModal = new bootstrap.Modal(document.getElementById('pinMessageModal'));
  const pinMessageForm = document.getElementById('pinMessageForm');
  const pinMessageInput = document.getElementById('pinMessageInput');
  const confirmPinBtn = document.getElementById('confirmPinBtn');
  const createBuildingBtn = document.getElementById('createBuildingBtn');
  const createBuildingModal = new bootstrap.Modal(document.getElementById('createBuildingModal'));
  const createBuildingForm = document.getElementById('createBuildingForm');
  const confirmCreateBuildingBtn = document.getElementById('confirmCreateBuildingBtn');
  const createBuildingError = document.getElementById('createBuildingError');
  const createBuildingErrorMessage = document.getElementById('createBuildingErrorMessage');
  const generateBuildingPasswordBtn = document.getElementById('generateBuildingPasswordBtn');
  const buildingPasswordInput = document.getElementById('buildingPassword');
  const createRABtn = document.getElementById('createRABtn');
  const createRAModal = new bootstrap.Modal(document.getElementById('createRAModal'));
  const createRAForm = document.getElementById('createRAForm');
  const confirmCreateRABtn = document.getElementById('confirmCreateRABtn');
  const raBuildingIdSelect = document.getElementById('raBuildingId');
  const createRAError = document.getElementById('createRAError');
  const createRAErrorMessage = document.getElementById('createRAErrorMessage');
  const generatePasswordBtn = document.getElementById('generatePasswordBtn');
  const raPasswordInput = document.getElementById('raPassword');

  // Data
  let buildings = [];
  let currentBuildingId = null;
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

  // Escape HTML helper
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Load buildings
  async function loadBuildings() {
    try {
      const response = await fetch(`${apiUrl}/buildings`, {
        headers: {
          'user-id': userId,
          'user-role': userRole
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load buildings');
      }

      const data = await response.json();
      buildings = data;

      renderBuildingsList();
    } catch (error) {
      console.error('Error loading buildings:', error);
      buildingsList.innerHTML = `
        <div class="alert alert-danger m-3">
          <i class="bi bi-exclamation-triangle"></i> Failed to load buildings. Please refresh the page.
        </div>
      `;
    }
  }

  // Render buildings list
  function renderBuildingsList() {
    buildingsList.innerHTML = '';

    if (buildings.length === 0) {
      buildingsList.innerHTML = `
        <div class="alert alert-info m-3">
          <i class="bi bi-info-circle"></i> No buildings found.
        </div>
      `;
      return;
    }

    buildings.forEach(building => {
      const isActive = currentBuildingId === building.building_id;
      const listItem = document.createElement('a');
      listItem.href = '#';
      listItem.className = `list-group-item list-group-item-action ${isActive ? 'active' : ''}`;
      listItem.innerHTML = `
        <div class="d-flex w-100 justify-content-between">
          <h6 class="mb-1">
            <i class="bi bi-building"></i> ${escapeHtml(building.building_name)}
          </h6>
        </div>
        <small class="text-muted">ID: ${building.building_id}</small>
      `;
      listItem.addEventListener('click', (e) => {
        e.preventDefault();
        selectBuilding(building.building_id);
      });
      buildingsList.appendChild(listItem);
    });
  }

  // Select building
  async function selectBuilding(buildingId) {
    currentBuildingId = buildingId;
    const building = buildings.find(b => b.building_id === buildingId);
    
    if (building) {
      currentBuildingName.textContent = building.building_name;
      noBuildingAlert.style.display = 'none';
      messagesSection.style.display = 'block';
    }

    renderBuildingsList();
    await loadBuildingMessages();
    await loadBuildingStats();
  }

  // Load building messages
  async function loadBuildingMessages() {
    if (!currentBuildingId) return;

    try {
      const [messagesResponse, pinnedResponse] = await Promise.all([
        fetch(`${apiUrl}/messages?buildingId=${currentBuildingId}`),
        fetch(`${apiUrl}/messages/pinned?buildingId=${currentBuildingId}`)
      ]);

      if (!messagesResponse.ok || !pinnedResponse.ok) {
        throw new Error('Failed to load messages');
      }

      const messagesData = await messagesResponse.json();
      const pinnedData = await pinnedResponse.json();

      messages = messagesData.map(msg => ({
        id: msg.message_id,
        author: msg.is_anonymous ? 'Anonymous' : msg.author,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        anonymous: msg.is_anonymous,
        pinned: false,
        isAdmin: msg.author_role === 'admin' || msg.author_role === 'RA'
      }));

      pinnedMessages = pinnedData.map(msg => ({
        id: msg.pinned_message_id,
        author: msg.author,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        anonymous: false,
        pinned: true,
        isAdmin: true
      }));

      renderPinnedMessages();
      renderMessages();
    } catch (error) {
      console.error('Error loading messages:', error);
      messages = [];
      pinnedMessages = [];
      renderPinnedMessages();
      renderMessages();
    }
  }

  // Load building stats
  async function loadBuildingStats() {
    if (!currentBuildingId) return;

    try {
      // Get member count
      const membersResponse = await fetch(`${apiUrl}/buildings/${currentBuildingId}/stats`, {
        headers: {
          'user-id': userId,
          'user-role': userRole
        }
      });

      if (membersResponse.ok) {
        const stats = await membersResponse.json();
        memberCount.textContent = stats.memberCount || '-';
        messageCount.textContent = stats.messageCount || messages.length;
      } else {
        memberCount.textContent = '-';
        messageCount.textContent = messages.length;
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      memberCount.textContent = '-';
      messageCount.textContent = messages.length;
    }
  }

  // Render pinned messages
  function renderPinnedMessages() {
    pinnedMessagesContainer.innerHTML = '';

    if (pinnedMessages.length === 0) {
      pinnedMessagesCard.style.display = 'none';
      return;
    }

    pinnedMessagesCard.style.display = 'block';

    pinnedMessages.forEach(msg => {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'pinned-message-item border-bottom p-3';
      messageDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div>
            <span class="badge bg-warning text-dark me-2">
              <i class="bi bi-pin-angle-fill"></i> PINNED
            </span>
            <strong>${escapeHtml(msg.author)}</strong>
            ${msg.isAdmin ? '<span class="badge bg-primary ms-2">Admin</span>' : ''}
          </div>
          <small class="text-muted">${formatTimestamp(msg.timestamp)}</small>
        </div>
        <div class="message-content">${escapeHtml(msg.content)}</div>
      `;
      pinnedMessagesContainer.appendChild(messageDiv);
    });
  }

  // Render messages
  function renderMessages() {
    messagesContainer.innerHTML = '';

    if (messages.length === 0) {
      messagesContainer.innerHTML = `
        <div class="alert alert-info m-3">
          <i class="bi bi-info-circle"></i> No messages yet. Be the first to post!
        </div>
      `;
      return;
    }

    messages.forEach(msg => {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message-item border-bottom p-3';
      messageDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div>
            <strong>${escapeHtml(msg.author)}</strong>
            ${msg.isAdmin ? '<span class="badge bg-primary ms-2">Admin</span>' : ''}
            ${msg.anonymous ? '<span class="badge bg-secondary ms-2">Anonymous</span>' : ''}
          </div>
          <small class="text-muted">${formatTimestamp(msg.timestamp)}</small>
        </div>
        <div class="message-content">${escapeHtml(msg.content)}</div>
      `;
      messagesContainer.appendChild(messageDiv);
    });
  }

  // Submit message
  messageForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!currentBuildingId) {
      alert('Please select a building first');
      return;
    }

    const content = messageInput.value.trim();
    if (!content) {
      alert('Please enter a message');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId,
          'user-role': userRole
        },
        body: JSON.stringify({
          buildingId: currentBuildingId,
          content: content,
          isAnonymous: anonymousToggle.checked,
          userId: userId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to post message');
      }

      messageInput.value = '';
      anonymousToggle.checked = false;
      await loadBuildingMessages();
      await loadBuildingStats();
    } catch (error) {
      console.error('Error posting message:', error);
      alert(`Failed to post message: ${error.message}`);
    }
  });

  // Pin message button
  pinMessageBtn.addEventListener('click', function() {
    if (!currentBuildingId) {
      alert('Please select a building first');
      return;
    }
    pinMessageInput.value = '';
    pinMessageModal.show();
  });

  // Confirm pin message
  confirmPinBtn.addEventListener('click', async function() {
    const content = pinMessageInput.value.trim();
    if (!content) {
      alert('Please enter a message to pin');
      return;
    }

    if (!currentBuildingId) {
      alert('Please select a building first');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/messages/pinned`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId,
          'user-role': userRole
        },
        body: JSON.stringify({
          buildingId: currentBuildingId,
          content: content,
          userId: userId,
          userRole: userRole
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to pin message');
      }

      pinMessageModal.hide();
      pinMessageForm.reset();
      await loadBuildingMessages();
    } catch (error) {
      console.error('Error pinning message:', error);
      alert(`Failed to pin message: ${error.message}`);
    }
  });

  // Create RA account button
  createRABtn.addEventListener('click', function() {
    // Populate building dropdown
    raBuildingIdSelect.innerHTML = '<option value="">Select a building...</option>';
    buildings.forEach(building => {
      const option = document.createElement('option');
      option.value = building.building_id;
      option.textContent = building.building_name;
      raBuildingIdSelect.appendChild(option);
    });
    
    createRAForm.reset();
    createRAForm.classList.remove('was-validated');
    createRAError.classList.add('d-none');
    raPasswordInput.type = 'text'; // Show password field as text so generated passwords are visible
    // Reset password field helper text
    const formText = raPasswordInput.parentElement.nextElementSibling;
    if (formText) {
      formText.innerHTML = `
        <i class="bi bi-info-circle"></i> Password must be at least 8 characters. Click "Generate" for a secure random password.
      `;
    }
    createRAModal.show();
  });

  // Create Building button
  createBuildingBtn.addEventListener('click', function() {
    createBuildingForm.reset();
    createBuildingForm.classList.remove('was-validated');
    createBuildingError.classList.add('d-none');
    buildingPasswordInput.type = 'text'; // Show password field as text
    // Reset password field helper text
    const formText = buildingPasswordInput.parentElement.nextElementSibling;
    if (formText) {
      formText.innerHTML = `
        <i class="bi bi-info-circle"></i> This password will be used by students to join the building. Click "Generate" for a secure random password.
      `;
    }
    createBuildingModal.show();
  });

  // Generate building password button
  generateBuildingPasswordBtn.addEventListener('click', function() {
    const generatedPassword = generateRandomPassword(10); // Shorter password for building
    buildingPasswordInput.value = generatedPassword;
    buildingPasswordInput.type = 'text';
    buildingPasswordInput.classList.remove('is-invalid');
    
    // Show success message
    const formText = buildingPasswordInput.parentElement.nextElementSibling;
    if (formText) {
      formText.innerHTML = `
        <i class="bi bi-check-circle text-success"></i> 
        <strong>Password generated!</strong> Make sure to copy this password to share with students.
        <button class="btn btn-sm btn-outline-primary ms-2" type="button" id="copyBuildingPasswordBtn">
          <i class="bi bi-clipboard"></i> Copy
        </button>
      `;
      
      // Add copy button functionality
      const copyBtn = document.getElementById('copyBuildingPasswordBtn');
      if (copyBtn) {
        copyBtn.addEventListener('click', function() {
          navigator.clipboard.writeText(generatedPassword).then(() => {
            copyBtn.innerHTML = '<i class="bi bi-check"></i> Copied!';
            setTimeout(() => {
              copyBtn.innerHTML = '<i class="bi bi-clipboard"></i> Copy';
            }, 2000);
          }).catch(err => {
            console.error('Failed to copy:', err);
            alert('Failed to copy password. Please copy manually: ' + generatedPassword);
          });
        });
      }
    }
  });

  // Create building form submission
  confirmCreateBuildingBtn.addEventListener('click', async function() {
    const buildingName = document.getElementById('buildingName').value.trim();
    const buildingPassword = buildingPasswordInput.value;
    const buildingDescription = document.getElementById('buildingDescription').value.trim();

    // Validate form
    let isValid = true;

    if (buildingName.length < 2) {
      document.getElementById('buildingName').classList.add('is-invalid');
      isValid = false;
    } else {
      document.getElementById('buildingName').classList.remove('is-invalid');
    }

    if (buildingPassword.length < 6) {
      buildingPasswordInput.classList.add('is-invalid');
      isValid = false;
    } else {
      buildingPasswordInput.classList.remove('is-invalid');
    }

    createBuildingForm.classList.add('was-validated');

    if (!isValid) {
      return;
    }

    // Disable button and show loading
    confirmCreateBuildingBtn.disabled = true;
    confirmCreateBuildingBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating...';

    try {
      const response = await fetch(`${apiUrl}/buildings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId,
          'user-role': userRole
        },
        body: JSON.stringify({
          buildingName: buildingName,
          buildingPassword: buildingPassword,
          description: buildingDescription || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create building');
      }

      alert('Building created successfully!');
      createBuildingModal.hide();
      createBuildingForm.reset();
      createBuildingForm.classList.remove('was-validated');
      
      // Reload buildings list
      await loadBuildings();
    } catch (error) {
      console.error('Create building error:', error);
      createBuildingErrorMessage.textContent = error.message || 'Failed to create building. Please try again.';
      createBuildingError.classList.remove('d-none');
    } finally {
      confirmCreateBuildingBtn.disabled = false;
      confirmCreateBuildingBtn.innerHTML = '<i class="bi bi-building-add"></i> Create Building';
    }
  });

  // Generate random password
  function generateRandomPassword(length = 12) {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluding I and O
    const lowercase = 'abcdefghijkmnopqrstuvwxyz'; // Excluding l
    const numbers = '23456789'; // Excluding 0 and 1
    const symbols = '!@#$%&*';
    
    // Ensure at least one of each type
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  // Generate password button
  generatePasswordBtn.addEventListener('click', function() {
    const generatedPassword = generateRandomPassword(12);
    raPasswordInput.value = generatedPassword;
    raPasswordInput.type = 'text'; // Show the password so admin can copy it
    raPasswordInput.classList.remove('is-invalid');
    
    // Show a success message
    const formText = raPasswordInput.parentElement.nextElementSibling;
    if (formText) {
      formText.innerHTML = `
        <i class="bi bi-check-circle text-success"></i> 
        <strong>Password generated!</strong> Make sure to copy this password to share with the RA.
        <button class="btn btn-sm btn-outline-primary ms-2" type="button" id="copyPasswordBtn">
          <i class="bi bi-clipboard"></i> Copy
        </button>
      `;
      
      // Add copy button functionality
      const copyBtn = document.getElementById('copyPasswordBtn');
      if (copyBtn) {
        copyBtn.addEventListener('click', function() {
          navigator.clipboard.writeText(generatedPassword).then(() => {
            copyBtn.innerHTML = '<i class="bi bi-check"></i> Copied!';
            setTimeout(() => {
              copyBtn.innerHTML = '<i class="bi bi-clipboard"></i> Copy';
            }, 2000);
          }).catch(err => {
            console.error('Failed to copy:', err);
            alert('Failed to copy password. Please copy manually: ' + generatedPassword);
          });
        });
      }
    }
  });

  // Validate email format
  const raEmailInput = document.getElementById('raEmail');
  raEmailInput.addEventListener('blur', function() {
    if (this.value && !this.value.endsWith('.edu')) {
      this.setCustomValidity('Email must end with .edu');
      this.classList.add('is-invalid');
    } else {
      this.setCustomValidity('');
      this.classList.remove('is-invalid');
    }
  });

  // Create RA account form submission
  confirmCreateRABtn.addEventListener('click', async function() {
    const raUsername = document.getElementById('raUsername').value.trim();
    const raEmail = document.getElementById('raEmail').value.trim();
    const raPassword = document.getElementById('raPassword').value;
    const raBuildingId = raBuildingIdSelect.value;
    const raPhoneNumber = document.getElementById('raPhoneNumber').value.trim();
    const raOfficeLocation = document.getElementById('raOfficeLocation').value.trim();

    // Validate form
    let isValid = true;

    if (raUsername.length < 3) {
      document.getElementById('raUsername').classList.add('is-invalid');
      isValid = false;
    } else {
      document.getElementById('raUsername').classList.remove('is-invalid');
    }

    if (!raEmail || !raEmail.endsWith('.edu')) {
      document.getElementById('raEmail').classList.add('is-invalid');
      isValid = false;
    } else {
      document.getElementById('raEmail').classList.remove('is-invalid');
    }

    if (raPassword.length < 8) {
      document.getElementById('raPassword').classList.add('is-invalid');
      isValid = false;
    } else {
      document.getElementById('raPassword').classList.remove('is-invalid');
    }

    if (!raBuildingId) {
      raBuildingIdSelect.classList.add('is-invalid');
      isValid = false;
    } else {
      raBuildingIdSelect.classList.remove('is-invalid');
    }

    createRAForm.classList.add('was-validated');

    if (!isValid) {
      return;
    }

    // Disable button and show loading
    confirmCreateRABtn.disabled = true;
    confirmCreateRABtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating...';

    try {
      const response = await fetch(`${apiUrl}/admin/create-ra`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId,
          'user-role': userRole
        },
        body: JSON.stringify({
          username: raUsername,
          studentEmail: raEmail,
          password: raPassword,
          buildingId: parseInt(raBuildingId),
          phoneNumber: raPhoneNumber || null,
          officeLocation: raOfficeLocation || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create RA account');
      }

      alert('RA account created successfully!');
      createRAModal.hide();
      createRAForm.reset();
      createRAForm.classList.remove('was-validated');
    } catch (error) {
      console.error('Create RA error:', error);
      createRAErrorMessage.textContent = error.message || 'Failed to create RA account. Please try again.';
      createRAError.classList.remove('d-none');
    } finally {
      confirmCreateRABtn.disabled = false;
      confirmCreateRABtn.innerHTML = '<i class="bi bi-person-plus"></i> Create RA Account';
    }
  });

  // Load buildings on page load
  loadBuildings();
})();
