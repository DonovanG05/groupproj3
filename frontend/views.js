// View rendering functions for SPA
console.log('Views.js loaded');

const Views = {
  // API configuration
  apiUrl: 'http://localhost:5000/api',

  // Utility functions
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  formatTimestamp(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return new Date(date).toLocaleDateString();
  },

  // Check authentication
  isAuthenticated() {
    return localStorage.getItem('userId') && localStorage.getItem('userRole');
  },

  // Get auth headers
  getAuthHeaders() {
    return {
      'user-id': localStorage.getItem('userId') || '',
      'user-role': localStorage.getItem('userRole') || ''
    };
  },

  // Dark mode functions
  initDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    this.setDarkMode(isDark);
  },

  setDarkMode(enabled) {
    if (enabled) {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
      document.body.classList.add('bg-dark', 'text-light');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.setAttribute('data-bs-theme', 'light');
      document.body.classList.remove('bg-dark', 'text-light');
      localStorage.setItem('darkMode', 'false');
    }
  },

  toggleDarkMode() {
    const checkbox = document.querySelector('.dark-mode-switch input[type="checkbox"]');
    const isDark = localStorage.getItem('darkMode') === 'true';
    const newState = !isDark;
    this.setDarkMode(newState);
    // Update checkbox if it exists
    if (checkbox) {
      checkbox.checked = newState;
    }
    // Re-render current view to update navbar
    if (router && router.currentView) {
      Views[router.currentView]();
    }
  },

  isDarkMode() {
    return localStorage.getItem('darkMode') === 'true';
  },

  // Render navigation bar
  renderNavbar(userRoleParam, usernameParam) {
    const isAuthenticated = this.isAuthenticated();
    const userRole = userRoleParam || localStorage.getItem('userRole');
    const username = usernameParam || localStorage.getItem('username');
    const navItems = [];

    if (isAuthenticated) {
      if (userRole === 'admin') {
        navItems.push({ href: '/admin-dashboard', icon: 'bi-gear-fill', text: 'Admin Dashboard' });
        navItems.push({ href: '/ra-dashboard', icon: 'bi-shield-exclamation', text: 'Building Manager' });
      } else if (userRole === 'RA') {
        navItems.push({ href: '/messages', icon: 'bi-chat-dots', text: 'Messages' });
        navItems.push({ href: '/ra-dashboard', icon: 'bi-shield-exclamation', text: 'Emergency Management' });
      } else {
        navItems.push({ href: '/messages', icon: 'bi-chat-dots', text: 'Messages' });
      }
    }

    return `
      <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container-fluid">
          <a class="navbar-brand" href="#" onclick="router.goTo('/'); return false;">
            <img src="./assets/logo.svg" alt="Project Tutwiler" class="logo-navbar" />
            Project Tutwiler
          </a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav me-auto">
              ${navItems.map(item => `
                <li class="nav-item">
                  <a class="nav-link" href="#" onclick="router.goTo('${item.href}'); return false;">
                    <i class="bi ${item.icon}"></i> ${item.text}
                  </a>
                </li>
              `).join('')}
            </ul>
            <ul class="navbar-nav ms-auto align-items-center">
              <li class="nav-item me-3">
                <div class="dark-mode-toggle">
                  <label class="dark-mode-switch mb-0" title="Toggle Dark Mode">
                    <input type="checkbox" ${this.isDarkMode() ? 'checked' : ''} onchange="Views.toggleDarkMode();" />
                    <span class="dark-mode-slider">
                      <i class="bi bi-moon-fill slider-icon moon"></i>
                      <i class="bi bi-sun-fill slider-icon sun"></i>
                    </span>
                  </label>
                </div>
              </li>
              ${isAuthenticated ? `
                <li class="nav-item me-3">
                  <span class="navbar-text text-white d-flex align-items-center">
                    <i class="bi bi-person-circle me-2"></i>
                    <span>${this.escapeHtml(username || 'User')}</span>
                    <span class="badge bg-${userRole === 'admin' ? 'warning' : userRole === 'RA' ? 'info' : 'secondary'} ms-2">
                      ${userRole?.toUpperCase() || 'USER'}
                    </span>
                  </span>
                </li>
                <li class="nav-item">
                  <a class="nav-link" href="#" onclick="Views.logout(); return false;">
                    <i class="bi bi-box-arrow-right"></i> Logout
                  </a>
                </li>
              ` : `
                <li class="nav-item me-2">
                  <a class="nav-link" href="#" onclick="router.goTo('/login'); return false;">
                    <i class="bi bi-box-arrow-in-right"></i> Sign In
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" href="#" onclick="router.goTo('/signup'); return false;">
                    <i class="bi bi-person-plus"></i> Sign Up
                  </a>
                </li>
              `}
            </ul>
          </div>
        </div>
      </nav>
    `;
  },

  // Home view (signup)
  home() {
    const app = document.getElementById('app');
    if (!app) {
      console.error('App element not found');
      return;
    }
    // Ensure dark mode is applied
    this.initDarkMode();
    app.innerHTML = `
      ${this.renderNavbar(null, null)}
      <div class="container py-5">
        <div class="row justify-content-center">
          <div class="col-md-6 col-lg-5">
            <div class="card shadow">
              <div class="card-body p-4">
                <div class="text-center mb-4">
                  <img src="./assets/logo.svg" alt="Project Tutwiler" class="logo-large" />
                  <h2 class="mt-3 mb-1">Project Tutwiler</h2>
                  <p class="text-muted">Create your account</p>
                </div>
                <form id="signupForm" novalidate>
                  <div class="mb-3">
                    <label for="studentEmail" class="form-label">
                      <i class="bi bi-envelope"></i> Student Email
                    </label>
                    <input type="email" class="form-control" id="studentEmail" placeholder="student@school.edu" required />
                    <div class="invalid-feedback">Please enter a valid student email address.</div>
                  </div>
                  <div class="mb-3">
                    <label for="username" class="form-label">
                      <i class="bi bi-person"></i> Username
                    </label>
                    <input type="text" class="form-control" id="username" placeholder="Choose a username" required minlength="3" />
                    <div class="invalid-feedback">Username must be at least 3 characters long.</div>
                  </div>
                  <div class="mb-3">
                    <label for="password" class="form-label">
                      <i class="bi bi-lock"></i> Password
                    </label>
                    <input type="password" class="form-control" id="password" placeholder="Create a password" required minlength="8" />
                    <div class="invalid-feedback">Password must be at least 8 characters long.</div>
                  </div>
                  <div class="mb-4">
                    <label for="inviteCode" class="form-label">
                      <i class="bi bi-ticket"></i> Invite Code
                    </label>
                    <input type="text" class="form-control" id="inviteCode" placeholder="Enter your invite code" required />
                    <div class="form-text">Enter the invite code provided by your RA or building administrator.</div>
                    <div class="invalid-feedback">Please enter a valid invite code.</div>
                  </div>
                  <button type="submit" class="btn btn-primary w-100 mb-3">
                    <i class="bi bi-person-plus"></i> Create Account
                  </button>
                  <div class="text-center">
                    <small class="text-muted">
                      Already have an account?
                      <a href="#" onclick="router.goTo('/login'); return false;" class="text-decoration-none">Sign in</a>
                    </small>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Attach form handler
    document.getElementById('signupForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const form = e.target;
      const email = document.getElementById('studentEmail').value;
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const inviteCode = document.getElementById('inviteCode').value.trim();

      // Validate
      if (!email.endsWith('.edu')) {
        document.getElementById('studentEmail').classList.add('is-invalid');
        return;
      }
      if (username.length < 3) {
        document.getElementById('username').classList.add('is-invalid');
        return;
      }
      if (password.length < 8) {
        document.getElementById('password').classList.add('is-invalid');
        return;
      }
      if (!inviteCode) {
        document.getElementById('inviteCode').classList.add('is-invalid');
        return;
      }

      form.classList.add('was-validated');

      try {
        const response = await fetch(`${this.apiUrl}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentEmail: email, username, password, inviteCode })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create account');
        }

        // Store user info
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('username', data.username);
        localStorage.setItem('userRole', data.role);
        if (data.buildingId) {
          localStorage.setItem('buildingId', data.buildingId);
        }

        alert('Account created successfully!');
        router.goTo('/messages');
      } catch (error) {
        alert(error.message || 'Failed to create account. Please try again.');
      }
    });
  },

  // Login view
  login() {
    const app = document.getElementById('app');
    if (!app) {
      console.error('App element not found');
      return;
    }
    // Ensure dark mode is applied
    this.initDarkMode();
    app.innerHTML = `
      ${this.renderNavbar(null, null)}
      <div class="container py-5">
        <div class="row justify-content-center">
          <div class="col-md-6 col-lg-5">
            <div class="card shadow">
              <div class="card-body p-4">
                <div class="text-center mb-4">
                  <img src="./assets/logo.svg" alt="Project Tutwiler" class="logo-large" />
                  <h2 class="mt-3 mb-1">Project Tutwiler</h2>
                  <p class="text-muted">Sign in to your account</p>
                </div>
                <form id="loginForm" novalidate>
                  <div id="loginError" class="alert alert-danger d-none" role="alert">
                    <i class="bi bi-exclamation-triangle"></i>
                    <span id="errorMessage"></span>
                  </div>
                  <div class="mb-3">
                    <label for="loginUsername" class="form-label">
                      <i class="bi bi-person"></i> Username or Email
                    </label>
                    <input type="text" class="form-control" id="loginUsername" placeholder="Enter your username or email" required />
                    <div class="invalid-feedback">Please enter your username or email.</div>
                  </div>
                  <div class="mb-4">
                    <label for="loginPassword" class="form-label">
                      <i class="bi bi-lock"></i> Password
                    </label>
                    <input type="password" class="form-control" id="loginPassword" placeholder="Enter your password" required />
                    <div class="invalid-feedback">Please enter your password.</div>
                  </div>
                  <button type="submit" class="btn btn-primary w-100 mb-3">
                    <i class="bi bi-box-arrow-in-right"></i> Sign In
                  </button>
                  <div class="text-center">
                    <small class="text-muted">
                      Don't have an account?
                      <a href="#" onclick="router.goTo('/signup'); return false;" class="text-decoration-none">Sign up</a>
                    </small>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Attach form handler
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const form = e.target;
      const username = document.getElementById('loginUsername').value.trim();
      const password = document.getElementById('loginPassword').value;
      const errorAlert = document.getElementById('loginError');
      const errorMessage = document.getElementById('errorMessage');

      if (!username || !password) {
        form.classList.add('was-validated');
        return;
      }

      errorAlert.classList.add('d-none');

      try {
        const response = await fetch(`${this.apiUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }

        // Store user info
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('username', data.username);
        localStorage.setItem('userRole', data.role);
        if (data.buildingId) {
          localStorage.setItem('buildingId', data.buildingId);
        }

        // Redirect based on role
        if (data.role === 'admin') {
          router.goTo('/admin-dashboard');
        } else if (data.role === 'RA') {
          router.goTo('/ra-dashboard');
        } else {
          router.goTo('/messages');
        }
      } catch (error) {
        errorMessage.textContent = error.message || 'Failed to sign in. Please try again.';
        errorAlert.classList.remove('d-none');
      }
    });
  },

  // Signup view (alias for home)
  signup() {
    this.home();
  },

  // Logout function
  logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('buildingId');
    router.goTo('/');
  },

  // Messages view
  async messages() {
    if (!this.isAuthenticated()) {
      router.goTo('/login');
      return;
    }

    // Ensure dark mode is applied
    this.initDarkMode();

    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    const username = localStorage.getItem('username');
    const buildingId = parseInt(localStorage.getItem('buildingId'), 10);

    if (!buildingId || buildingId < 1) {
      alert('You are not assigned to a building. Please contact an administrator.');
      router.goTo('/login');
      return;
    }

    const app = document.getElementById('app');
    app.innerHTML = `
      ${this.renderNavbar(userRole, username)}
      <div class="container-fluid py-4">
        <div class="row">
          <div class="col-lg-8 col-xl-9">
            <div class="card shadow-sm mb-4" id="pinnedMessagesCard" style="display: none;">
              <div class="card-header bg-warning bg-opacity-10 border-bottom">
                <h5 class="mb-0">
                  <i class="bi bi-pin-angle-fill text-warning"></i> Pinned Messages
                </h5>
              </div>
              <div class="card-body p-0">
                <div id="pinnedMessagesContainer" style="max-height: 400px; overflow-y: auto;"></div>
              </div>
            </div>
            <div class="card shadow-sm mb-4">
              <div class="card-header bg-white border-bottom">
                <h5 class="mb-0">
                  <i class="bi bi-chat-left-text"></i> Building Messages
                </h5>
              </div>
              <div class="card-body p-0">
                <div id="messagesContainer" style="max-height: 500px; overflow-y: auto; padding: 1rem;"></div>
              </div>
            </div>
            <div class="card shadow-sm">
              <div class="card-body">
                <form id="messageForm">
                  <div class="mb-3">
                    <label for="messageInput" class="form-label">Post a Message</label>
                    <textarea class="form-control" id="messageInput" rows="3" placeholder="Type your message here..." required></textarea>
                  </div>
                  <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div class="form-check form-switch">
                      <input class="form-check-input" type="checkbox" id="anonymousToggle" />
                      <label class="form-check-label" for="anonymousToggle">
                        <i class="bi bi-eye-slash"></i> Post Anonymously
                      </label>
                    </div>
                    <div>
                      ${userRole === 'RA' || userRole === 'admin' ? `
                        <button type="button" class="btn btn-outline-warning me-2" id="pinMessageBtn">
                          <i class="bi bi-pin-angle"></i> Pin Message
                        </button>
                      ` : ''}
                      <button type="button" class="btn btn-outline-danger me-2" id="emergencyBtn">
                        <i class="bi bi-exclamation-triangle-fill"></i> Report Emergency
                      </button>
                      <button type="submit" class="btn btn-primary">
                        <i class="bi bi-send"></i> Send Message
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div class="col-lg-4 col-xl-3 mt-4 mt-lg-0">
            <div class="card shadow-sm mb-3">
              <div class="card-header bg-white">
                <h6 class="mb-0"><i class="bi bi-info-circle"></i> Quick Info</h6>
              </div>
              <div class="card-body">
                <p class="small text-muted mb-2">
                  <strong>Building:</strong> <span id="buildingName">Loading...</span>
                </p>
                <p class="small text-muted mb-0">
                  <strong>Members:</strong> <span id="memberCount">-</span>
                </p>
              </div>
            </div>
            <div class="card shadow-sm">
              <div class="card-header bg-white">
                <h6 class="mb-0"><i class="bi bi-shield-exclamation"></i> Emergency Protocol</h6>
              </div>
              <div class="card-body">
                <p class="small text-muted">
                  In case of emergency, use the "Report Emergency" button. This will alert building administrators immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Pin Message Modal -->
      ${userRole === 'RA' || userRole === 'admin' ? `
      <div class="modal fade" id="pinMessageModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-warning">
              <h5 class="modal-title">
                <i class="bi bi-pin-angle"></i> Pin Message
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="pinMessageForm">
                <div class="mb-3">
                  <label for="pinMessageInput" class="form-label">Pinned Message Content</label>
                  <textarea class="form-control" id="pinMessageInput" rows="4" placeholder="Enter the message to pin at the top of the building's message board..." required></textarea>
                  <div class="form-text">
                    This message will appear at the top of the message board for all residents.
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-warning" id="confirmPinBtn">
                <i class="bi bi-pin-angle"></i> Pin Message
              </button>
            </div>
          </div>
        </div>
      </div>
      ` : ''}
      <!-- Emergency Modal -->
      <div class="modal fade" id="emergencyModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-danger text-white">
              <h5 class="modal-title">
                <i class="bi bi-exclamation-triangle-fill"></i> Report Emergency
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="emergencyForm">
                <div class="mb-3">
                  <label for="emergencyType" class="form-label">Emergency Type</label>
                  <select class="form-select" id="emergencyType" required>
                    <option value="">Select type...</option>
                    <option value="medical">Medical Emergency</option>
                    <option value="fire">Fire</option>
                    <option value="security">Security Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label for="emergencyLocation" class="form-label">Location</label>
                  <input type="text" class="form-control" id="emergencyLocation" placeholder="Room number, floor, or specific location" required />
                </div>
                <div class="mb-3">
                  <label for="emergencyDescription" class="form-label">Description</label>
                  <textarea class="form-control" id="emergencyDescription" rows="3" placeholder="Describe the emergency situation..." required></textarea>
                </div>
                <div class="alert alert-warning mb-0">
                  <i class="bi bi-info-circle"></i>
                  <strong>Note:</strong> This will immediately notify building administrators. For life-threatening emergencies, call 911 first.
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger" id="submitEmergency">
                <i class="bi bi-exclamation-triangle-fill"></i> Report Emergency
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Load and render messages
    const loadMessages = async () => {
      try {
        const headers = this.getAuthHeaders();
        const [messagesRes, pinnedRes] = await Promise.all([
          fetch(`${this.apiUrl}/messages?buildingId=${buildingId}`, { headers }),
          fetch(`${this.apiUrl}/messages/pinned?buildingId=${buildingId}`, { headers })
        ]);

        const messages = await messagesRes.json();
        const pinned = await pinnedRes.json();

        // Render pinned messages
        const pinnedContainer = document.getElementById('pinnedMessagesContainer');
        const pinnedCard = document.getElementById('pinnedMessagesCard');
        if (pinned.length > 0) {
          pinnedCard.style.display = 'block';
          pinnedContainer.innerHTML = pinned.map(msg => `
            <div class="border-bottom p-3">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <span class="badge bg-warning text-dark me-2"><i class="bi bi-pin-angle-fill"></i> PINNED</span>
                  <strong>${this.escapeHtml(msg.author)}</strong>
                  ${msg.author_role === 'admin' || msg.author_role === 'RA' ? '<span class="badge bg-primary ms-2">Admin</span>' : ''}
                  ${msg.author_role === 'student' ? '<span class="badge bg-info ms-2">Student</span>' : ''}
                </div>
                <div class="d-flex align-items-center gap-2">
                  ${(userRole === 'RA' || userRole === 'admin') ? `
                    <button class="btn btn-sm btn-outline-danger" onclick="Views.unpinMessage(${msg.pinned_message_id}); return false;" title="Unpin message">
                      <i class="bi bi-pin-angle"></i> Unpin
                    </button>
                  ` : ''}
                  <small class="text-muted">${this.formatTimestamp(msg.created_at)}</small>
                </div>
              </div>
              <div>${this.escapeHtml(msg.content)}</div>
            </div>
          `).join('');
        } else {
          pinnedCard.style.display = 'none';
        }

        // Render regular messages
        const messagesContainer = document.getElementById('messagesContainer');
        if (messages.length === 0) {
          messagesContainer.innerHTML = '<div class="alert alert-info m-3"><i class="bi bi-info-circle"></i> No messages yet. Be the first to post!</div>';
        } else {
          messagesContainer.innerHTML = messages.map(msg => `
            <div class="border-bottom p-3">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <strong>${this.escapeHtml(msg.is_anonymous ? 'Anonymous' : msg.author)}</strong>
                  ${msg.author_role === 'admin' || msg.author_role === 'RA' ? '<span class="badge bg-primary ms-2">Admin</span>' : ''}
                  ${!msg.is_anonymous && msg.author_role === 'student' ? '<span class="badge bg-info ms-2">Student</span>' : ''}
                  ${msg.is_anonymous ? '<span class="badge bg-secondary ms-2">Anonymous</span>' : ''}
                </div>
                <small class="text-muted">${this.formatTimestamp(msg.created_at)}</small>
              </div>
              <div>${this.escapeHtml(msg.content)}</div>
            </div>
          `).join('');
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    // Load building info
    const loadBuildingInfo = async () => {
      try {
        const headers = this.getAuthHeaders();
        const res = await fetch(`${this.apiUrl}/buildings/${buildingId}/stats`, { headers });
        if (res.ok) {
          const stats = await res.json();
          document.getElementById('buildingName').textContent = stats.building_name || 'Unknown';
          document.getElementById('memberCount').textContent = stats.memberCount || '0';
        }
      } catch (error) {
        console.error('Error loading building info:', error);
      }
    };

    // Message form handler
    document.getElementById('messageForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const content = document.getElementById('messageInput').value.trim();
      if (!content) return;

      try {
        const headers = { ...this.getAuthHeaders(), 'Content-Type': 'application/json' };
        const res = await fetch(`${this.apiUrl}/messages`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            buildingId,
            content,
            isAnonymous: document.getElementById('anonymousToggle').checked,
            userId
          })
        });

        if (!res.ok) throw new Error('Failed to post message');
        
        document.getElementById('messageInput').value = '';
        document.getElementById('anonymousToggle').checked = false;
        await loadMessages();
      } catch (error) {
        alert('Failed to post message. Please try again.');
      }
    });

    // Pin message button (for RAs and admins)
    if (userRole === 'RA' || userRole === 'admin') {
      const pinMessageBtn = document.getElementById('pinMessageBtn');
      if (pinMessageBtn) {
        pinMessageBtn.addEventListener('click', () => {
          const modal = document.getElementById('pinMessageModal');
          if (modal) {
            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
              const bsModal = new bootstrap.Modal(modal);
              bsModal.show();
            } else {
              modal.style.display = 'block';
              modal.classList.add('show');
              document.body.classList.add('modal-open');
            }
          }
        });
      }

      const confirmPinBtn = document.getElementById('confirmPinBtn');
      if (confirmPinBtn) {
        confirmPinBtn.addEventListener('click', async () => {
          const content = document.getElementById('pinMessageInput').value.trim();
          if (!content) {
            alert('Please enter a message to pin');
            return;
          }

          try {
            const headers = { ...this.getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${this.apiUrl}/messages/pinned`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                buildingId,
                content,
                userId,
                userRole
              })
            });

            if (!res.ok) {
              const error = await res.json();
              throw new Error(error.error || 'Failed to pin message');
            }

            const modal = document.getElementById('pinMessageModal');
            if (modal) {
              if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) bsModal.hide();
              } else {
                modal.style.display = 'none';
                modal.classList.remove('show');
                document.body.classList.remove('modal-open');
              }
            }
            document.getElementById('pinMessageForm').reset();
            await loadMessages();
          } catch (error) {
            alert(`Failed to pin message: ${error.message}`);
          }
        });
      }
    }

    // Emergency button
    document.getElementById('emergencyBtn').addEventListener('click', () => {
      const modal = document.getElementById('emergencyModal');
      if (modal) {
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
          const bsModal = new bootstrap.Modal(modal);
          bsModal.show();
        } else {
          modal.style.display = 'block';
          modal.classList.add('show');
          document.body.classList.add('modal-open');
        }
      }
    });

    // Emergency form handler
    document.getElementById('submitEmergency').addEventListener('click', async () => {
      const form = document.getElementById('emergencyForm');
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      try {
        const headers = { ...this.getAuthHeaders(), 'Content-Type': 'application/json' };
        const res = await fetch(`${this.apiUrl}/emergencies`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            buildingId,
            emergencyType: document.getElementById('emergencyType').value,
            location: document.getElementById('emergencyLocation').value,
            description: document.getElementById('emergencyDescription').value,
            userId
          })
        });

        if (!res.ok) throw new Error('Failed to report emergency');
        
        const modal = document.getElementById('emergencyModal');
        if (modal) {
          if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
          } else {
            modal.style.display = 'none';
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
          }
        }
        form.reset();
        alert('Emergency reported! Building administrators have been notified.');
      } catch (error) {
        alert('Failed to report emergency. Please try again or call 911.');
      }
    });

    await loadBuildingInfo();
    await loadMessages();
  },

  // Unpin message function
  async unpinMessage(pinnedMessageId) {
    if (!confirm('Are you sure you want to unpin this message?')) {
      return;
    }

    try {
      const headers = this.getAuthHeaders();
      const url = `${this.apiUrl}/messages/pinned/${pinnedMessageId}`;
      console.log('Unpinning message:', url, 'Headers:', headers);
      
      const res = await fetch(url, {
        method: 'DELETE',
        headers
      });

      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error(`Server returned HTML instead of JSON. Status: ${res.status}. The route may not be registered correctly.`);
      }

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to unpin message');
      }

      const data = await res.json();
      console.log('Unpin successful:', data);

      // Reload messages by navigating to messages page (triggers re-render)
      router.goTo('/messages');
    } catch (error) {
      console.error('Unpin error:', error);
      alert(`Failed to unpin message: ${error.message}`);
    }
  },

  // Admin Dashboard view
  adminDashboard() {
    if (typeof Dashboards !== 'undefined') {
      Dashboards.adminDashboard();
    } else {
      console.error('Dashboards module not loaded');
      router.goTo('/');
    }
  },

  // RA Dashboard view
  raDashboard() {
    if (typeof Dashboards !== 'undefined') {
      Dashboards.raDashboard();
    } else {
      console.error('Dashboards module not loaded');
      router.goTo('/');
    }
  }
};

