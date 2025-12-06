// Dashboard view functions (admin and RA)
console.log('Dashboards.js loaded');

const Dashboards = {
  // Admin Dashboard
  async adminDashboard() {
    if (!Views.isAuthenticated() || localStorage.getItem('userRole') !== 'admin') {
      alert('Access denied. This page is for admins only.');
      router.goTo('/login');
      return;
    }

    // Ensure dark mode is applied
    Views.initDarkMode();

    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    const username = localStorage.getItem('username') || 'Admin';

    const app = document.getElementById('app');
    app.innerHTML = `
      ${Views.renderNavbar(userRole, username)}
      <div class="container-fluid py-4">
        <div class="row">
          <div class="col-lg-3 col-md-4 mb-4">
            <div class="card shadow-sm">
              <div class="card-header bg-primary text-white">
                <h5 class="mb-0"><i class="bi bi-building"></i> Select Building</h5>
              </div>
              <div class="card-body p-0">
                <div id="buildingsList" class="list-group list-group-flush">
                  <div class="text-center p-3">
                    <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">Loading...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="card shadow-sm mt-3">
              <div class="card-header">
                <h6 class="mb-0"><i class="bi bi-info-circle"></i> Building Info</h6>
              </div>
              <div class="card-body">
                <p class="small mb-2">
                  <strong>Current:</strong> <span id="currentBuildingName">None selected</span>
                </p>
                <p class="small mb-2">
                  <strong>Members:</strong> <span id="memberCount">-</span>
                </p>
                <p class="small mb-0">
                  <strong>Messages:</strong> <span id="messageCount">-</span>
                </p>
              </div>
            </div>
            <div class="card shadow-sm mt-3">
              <div class="card-header bg-primary bg-opacity-10">
                <h6 class="mb-0"><i class="bi bi-building-add"></i> Create Building</h6>
              </div>
              <div class="card-body">
                <button class="btn btn-primary btn-sm w-100" id="createBuildingBtn">
                  <i class="bi bi-building-add"></i> Create New Building
                </button>
              </div>
            </div>
            <div class="card shadow-sm mt-3">
              <div class="card-header bg-success bg-opacity-10">
                <h6 class="mb-0"><i class="bi bi-person-plus"></i> Create RA Account</h6>
              </div>
              <div class="card-body">
                <button class="btn btn-success btn-sm w-100" id="createRABtn">
                  <i class="bi bi-person-plus"></i> Create New RA
                </button>
              </div>
            </div>
          </div>
          <div class="col-lg-9 col-md-8">
            <div id="noBuildingAlert" class="alert alert-info">
              <i class="bi bi-info-circle"></i>
              <strong>Select a building</strong> from the sidebar to view its message board.
            </div>
            <div id="messagesSection" style="display: none;">
              <div class="card shadow-sm mb-4" id="pinnedMessagesCard" style="display: none;">
                <div class="card-header bg-warning bg-opacity-10 border-bottom">
                  <h5 class="mb-0"><i class="bi bi-pin-angle-fill text-warning"></i> Pinned Messages</h5>
                </div>
                <div class="card-body p-0">
                  <div id="pinnedMessagesContainer" style="max-height: 300px; overflow-y: auto;"></div>
                </div>
              </div>
              <div class="card shadow-sm mb-4">
                <div class="card-header bg-white border-bottom">
                  <h5 class="mb-0"><i class="bi bi-chat-left-text"></i> Building Messages</h5>
                </div>
                <div class="card-body p-0">
                  <div id="messagesContainer" style="max-height: 400px; overflow-y: auto; padding: 1rem;"></div>
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
                        <button type="button" class="btn btn-outline-warning me-2" id="pinMessageBtn">
                          <i class="bi bi-pin-angle"></i> Pin Message
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
          </div>
        </div>
      </div>
      ${this.renderAdminModals()}
    `;

    // Initialize admin dashboard functionality
    await this.initAdminDashboard(userId, userRole);
  },

  renderAdminModals() {
    return `
      <!-- Pin Message Modal -->
      <div class="modal fade" id="pinMessageModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-warning">
              <h5 class="modal-title"><i class="bi bi-pin-angle"></i> Pin Message</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="pinMessageForm">
                <div class="mb-3">
                  <label for="pinMessageInput" class="form-label">Pinned Message Content</label>
                  <textarea class="form-control" id="pinMessageInput" rows="4" placeholder="Enter the message to pin..." required></textarea>
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
      <!-- Create Building Modal -->
      <div class="modal fade" id="createBuildingModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title"><i class="bi bi-building-add"></i> Create New Building</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="createBuildingForm" novalidate>
                <div id="createBuildingError" class="alert alert-danger d-none"></div>
                <div class="mb-3">
                  <label for="buildingName" class="form-label">Building Name</label>
                  <input type="text" class="form-control" id="buildingName" placeholder="Main Hall" required minlength="2" />
                  <div class="invalid-feedback">Building name must be at least 2 characters.</div>
                </div>
                <div class="mb-3">
                  <label for="buildingDescription" class="form-label">Description (Optional)</label>
                  <textarea class="form-control" id="buildingDescription" rows="3" placeholder="Description of the building..."></textarea>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" id="confirmCreateBuildingBtn">
                <i class="bi bi-building-add"></i> Create Building
              </button>
            </div>
          </div>
        </div>
      </div>
      <!-- Create RA Modal -->
      <div class="modal fade" id="createRAModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-success text-white">
              <h5 class="modal-title"><i class="bi bi-person-plus"></i> Create RA Account</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="createRAForm" novalidate>
                <div id="createRAError" class="alert alert-danger d-none"></div>
                <div class="mb-3">
                  <label for="raUsername" class="form-label">Username</label>
                  <input type="text" class="form-control" id="raUsername" placeholder="Enter username" required minlength="3" />
                </div>
                <div class="mb-3">
                  <label for="raEmail" class="form-label">Email</label>
                  <input type="email" class="form-control" id="raEmail" placeholder="ra@school.edu" required />
                  <div class="form-text">Must be a .edu email address.</div>
                </div>
                <div class="mb-3">
                  <label for="raPassword" class="form-label">Password</label>
                  <div class="input-group">
                    <input type="text" class="form-control" id="raPassword" placeholder="Enter password or generate one" required minlength="8" />
                    <button class="btn btn-outline-secondary" type="button" id="generatePasswordBtn">
                      <i class="bi bi-shuffle"></i> Generate
                    </button>
                  </div>
                </div>
                <div class="mb-3">
                  <label for="raBuildingId" class="form-label">Building</label>
                  <select class="form-select" id="raBuildingId" required>
                    <option value="">Select a building...</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label for="raPhoneNumber" class="form-label">Phone Number (Optional)</label>
                  <input type="tel" class="form-control" id="raPhoneNumber" placeholder="555-1234" />
                </div>
                <div class="mb-3">
                  <label for="raOfficeLocation" class="form-label">Office Location (Optional)</label>
                  <input type="text" class="form-control" id="raOfficeLocation" placeholder="Building Name - Room 101" />
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-success" id="confirmCreateRABtn">
                <i class="bi bi-person-plus"></i> Create RA Account
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async initAdminDashboard(userId, userRole) {
    let buildings = [];
    let currentBuildingId = null;

    // Password generation function
    function generateRandomPassword(length = 12) {
      const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
      const lowercase = 'abcdefghijkmnopqrstuvwxyz';
      const numbers = '23456789';
      const symbols = '!@#$%&*';
      
      let password = '';
      password += uppercase[Math.floor(Math.random() * uppercase.length)];
      password += lowercase[Math.floor(Math.random() * lowercase.length)];
      password += numbers[Math.floor(Math.random() * numbers.length)];
      password += symbols[Math.floor(Math.random() * symbols.length)];
      
      const allChars = uppercase + lowercase + numbers + symbols;
      for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
      }
      
      return password.split('').sort(() => Math.random() - 0.5).join('');
    }

    // Load buildings
    const loadBuildings = async () => {
      try {
        const res = await fetch(`${Views.apiUrl}/buildings`, { headers: Views.getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to load buildings');
        buildings = await res.json();
        renderBuildingsList();
      } catch (error) {
        document.getElementById('buildingsList').innerHTML = `
          <div class="alert alert-danger m-3">
            <i class="bi bi-exclamation-triangle"></i> Failed to load buildings.
          </div>
        `;
      }
    };

    const renderBuildingsList = () => {
      const list = document.getElementById('buildingsList');
      if (buildings.length === 0) {
        list.innerHTML = '<div class="alert alert-info m-3"><i class="bi bi-info-circle"></i> No buildings found.</div>';
        return;
      }
      list.innerHTML = buildings.map(b => `
        <a href="#" class="list-group-item list-group-item-action ${currentBuildingId === b.building_id ? 'active' : ''}" 
           onclick="Dashboards.selectBuilding(${b.building_id}); return false;">
          <div class="d-flex w-100 justify-content-between">
            <h6 class="mb-1"><i class="bi bi-building"></i> ${Views.escapeHtml(b.building_name)}</h6>
          </div>
          <small class="text-muted">ID: ${b.building_id}</small>
        </a>
      `).join('');
    };

    const selectBuilding = async (buildingId) => {
      currentBuildingId = buildingId;
      const building = buildings.find(b => b.building_id === buildingId);
      if (building) {
        document.getElementById('currentBuildingName').textContent = building.building_name;
        document.getElementById('noBuildingAlert').style.display = 'none';
        document.getElementById('messagesSection').style.display = 'block';
      }
      renderBuildingsList();
      await loadBuildingMessages();
      await loadBuildingStats();
    };

    const loadBuildingMessages = async () => {
      if (!currentBuildingId) return;
      try {
        const headers = Views.getAuthHeaders();
        const [messagesRes, pinnedRes] = await Promise.all([
          fetch(`${Views.apiUrl}/messages?buildingId=${currentBuildingId}`, { headers }),
          fetch(`${Views.apiUrl}/messages/pinned?buildingId=${currentBuildingId}`, { headers })
        ]);
        const messages = await messagesRes.json();
        const pinned = await pinnedRes.json();

        // Render pinned
        const pinnedContainer = document.getElementById('pinnedMessagesContainer');
        const pinnedCard = document.getElementById('pinnedMessagesCard');
        if (pinned.length > 0) {
          pinnedCard.style.display = 'block';
          pinnedContainer.innerHTML = pinned.map(msg => `
            <div class="border-bottom p-3">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <span class="badge bg-warning text-dark me-2"><i class="bi bi-pin-angle-fill"></i> PINNED</span>
                  <strong>${Views.escapeHtml(msg.author)}</strong>
                  ${msg.author_role === 'admin' || msg.author_role === 'RA' ? '<span class="badge bg-primary ms-2">Admin</span>' : ''}
                  ${msg.author_role === 'student' ? '<span class="badge bg-info ms-2">Student</span>' : ''}
                </div>
                <div class="d-flex align-items-center gap-2">
                  <button class="btn btn-sm btn-outline-danger" onclick="Dashboards.unpinMessage(${msg.pinned_message_id})" title="Unpin message">
                    <i class="bi bi-pin-angle"></i> Unpin
                  </button>
                  <small class="text-muted">${Views.formatTimestamp(msg.created_at)}</small>
                </div>
              </div>
              <div>${Views.escapeHtml(msg.content)}</div>
            </div>
          `).join('');
        } else {
          pinnedCard.style.display = 'none';
        }

        // Render messages
        const messagesContainer = document.getElementById('messagesContainer');
        if (messages.length === 0) {
          messagesContainer.innerHTML = '<div class="alert alert-info m-3">No messages yet.</div>';
        } else {
          messagesContainer.innerHTML = messages.map(msg => `
            <div class="border-bottom p-3">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <strong>${Views.escapeHtml(msg.is_anonymous ? 'Anonymous' : msg.author)}</strong>
                  ${msg.author_role === 'admin' || msg.author_role === 'RA' ? '<span class="badge bg-primary ms-2">Admin</span>' : ''}
                  ${!msg.is_anonymous && msg.author_role === 'student' ? '<span class="badge bg-info ms-2">Student</span>' : ''}
                  ${msg.is_anonymous ? '<span class="badge bg-secondary ms-2">Anonymous</span>' : ''}
                </div>
                <small class="text-muted">${Views.formatTimestamp(msg.created_at)}</small>
              </div>
              <div>${Views.escapeHtml(msg.content)}</div>
            </div>
          `).join('');
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    const loadBuildingStats = async () => {
      if (!currentBuildingId) return;
      try {
        const res = await fetch(`${Views.apiUrl}/buildings/${currentBuildingId}/stats`, { headers: Views.getAuthHeaders() });
        if (res.ok) {
          const stats = await res.json();
          document.getElementById('memberCount').textContent = stats.memberCount || '-';
          document.getElementById('messageCount').textContent = stats.messageCount || '-';
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    // Helper function to safely show modal
    const showModal = (modalId) => {
      const modal = document.getElementById(modalId);
      if (!modal) {
        console.error(`Modal ${modalId} not found`);
        return;
      }
      if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
      } else {
        // Fallback: show modal manually
        modal.style.display = 'block';
        modal.classList.add('show');
        document.body.classList.add('modal-open');
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        backdrop.id = 'modalBackdrop';
        document.body.appendChild(backdrop);
      }
    };

    // Attach button handlers using onclick for immediate binding
    const createBuildingBtn = document.getElementById('createBuildingBtn');
    if (createBuildingBtn) {
      createBuildingBtn.onclick = (e) => {
        e.preventDefault();
        showModal('createBuildingModal');
      };
    }

    const createRABtn = document.getElementById('createRABtn');
    if (createRABtn) {
      createRABtn.onclick = async (e) => {
        e.preventDefault();
        const select = document.getElementById('raBuildingId');
        if (!select) {
          console.error('raBuildingId select not found');
          return;
        }
        // Load buildings for dropdown
        try {
          const res = await fetch(`${Views.apiUrl}/buildings`, { headers: Views.getAuthHeaders() });
          const buildingsList = await res.json();
          select.innerHTML = '<option value="">Select a building...</option>';
          buildingsList.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b.building_id;
            opt.textContent = b.building_name;
            select.appendChild(opt);
          });
        } catch (error) {
          console.error('Failed to load buildings:', error);
        }
        // Reset form
        const form = document.getElementById('createRAForm');
        if (form) {
          form.reset();
          form.classList.remove('was-validated');
        }
        const errorDiv = document.getElementById('createRAError');
        if (errorDiv) errorDiv.classList.add('d-none');
        const passwordInput = document.getElementById('raPassword');
        if (passwordInput) passwordInput.type = 'text';
        showModal('createRAModal');
      };
    }

    // Attach event handlers for modals and forms
    const confirmCreateBuildingBtn = document.getElementById('confirmCreateBuildingBtn');
    if (confirmCreateBuildingBtn) {
      confirmCreateBuildingBtn.addEventListener('click', async () => {
        const name = document.getElementById('buildingName').value.trim();
        const desc = document.getElementById('buildingDescription').value.trim();
        if (name.length < 2) {
          document.getElementById('buildingName').classList.add('is-invalid');
          return;
        }
        try {
          const res = await fetch(`${Views.apiUrl}/buildings`, {
            method: 'POST',
            headers: { ...Views.getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ buildingName: name, description: desc || null })
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to create building');
          }
          const modalEl = document.getElementById('createBuildingModal');
          if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
          } else {
            // Fallback: hide modal manually
            if (modalEl) {
              modalEl.style.display = 'none';
              modalEl.classList.remove('show');
              document.body.classList.remove('modal-open');
              const backdrop = document.getElementById('modalBackdrop');
              if (backdrop) backdrop.remove();
            }
          }
          document.getElementById('createBuildingForm').reset();
          await loadBuildings();
          alert('Building created successfully!');
        } catch (error) {
          alert('Failed to create building: ' + error.message);
        }
      });
    }

    // Message form
    document.getElementById('messageForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentBuildingId) {
        alert('Please select a building first');
        return;
      }
      const content = document.getElementById('messageInput').value.trim();
      if (!content) return;
      try {
        const res = await fetch(`${Views.apiUrl}/messages`, {
          method: 'POST',
          headers: { ...Views.getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            buildingId: currentBuildingId,
            content,
            isAnonymous: document.getElementById('anonymousToggle').checked,
            userId
          })
        });
        if (!res.ok) throw new Error('Failed to post message');
        document.getElementById('messageInput').value = '';
        document.getElementById('anonymousToggle').checked = false;
        await loadBuildingMessages();
        await loadBuildingStats();
      } catch (error) {
        alert('Failed to post message');
      }
    });

    // Pin message
    document.getElementById('pinMessageBtn').addEventListener('click', () => {
      if (!currentBuildingId) {
        alert('Please select a building first');
        return;
      }
      showModal('pinMessageModal');
    });

    document.getElementById('confirmPinBtn').addEventListener('click', async () => {
      const content = document.getElementById('pinMessageInput').value.trim();
      if (!content || !currentBuildingId) return;
      try {
        const res = await fetch(`${Views.apiUrl}/messages/pinned`, {
          method: 'POST',
          headers: { ...Views.getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ buildingId: currentBuildingId, content, userId, userRole })
        });
        if (!res.ok) throw new Error('Failed to pin message');
        const pinModalEl = document.getElementById('pinMessageModal');
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
          const modal = bootstrap.Modal.getInstance(pinModalEl);
          if (modal) modal.hide();
        } else {
          if (pinModalEl) {
            pinModalEl.style.display = 'none';
            pinModalEl.classList.remove('show');
            document.body.classList.remove('modal-open');
            const backdrop = document.getElementById('modalBackdrop');
            if (backdrop) backdrop.remove();
          }
        }
        document.getElementById('pinMessageForm').reset();
        await loadBuildingMessages();
      } catch (error) {
        alert('Failed to pin message');
      }
    });

    // Generate password button
    const generatePasswordBtn = document.getElementById('generatePasswordBtn');
    if (generatePasswordBtn) {
      generatePasswordBtn.addEventListener('click', () => {
        const password = generateRandomPassword(12);
        const passwordInput = document.getElementById('raPassword');
        if (passwordInput) {
          passwordInput.value = password;
          passwordInput.type = 'text';
          passwordInput.classList.remove('is-invalid');
        }
      });
    }

    // Create RA form submission
    const confirmCreateRABtn = document.getElementById('confirmCreateRABtn');
    if (confirmCreateRABtn) {
      confirmCreateRABtn.addEventListener('click', async () => {
        const raUsername = document.getElementById('raUsername').value.trim();
        const raEmail = document.getElementById('raEmail').value.trim();
        const raPassword = document.getElementById('raPassword').value;
        const raBuildingId = document.getElementById('raBuildingId').value;
        const raPhoneNumber = document.getElementById('raPhoneNumber').value.trim();
        const raOfficeLocation = document.getElementById('raOfficeLocation').value.trim();

        // Validate
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
          document.getElementById('raBuildingId').classList.add('is-invalid');
          isValid = false;
        } else {
          document.getElementById('raBuildingId').classList.remove('is-invalid');
        }

        document.getElementById('createRAForm').classList.add('was-validated');
        if (!isValid) return;

        // Disable button
        const btn = document.getElementById('confirmCreateRABtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating...';

        try {
          const res = await fetch(`${Views.apiUrl}/admin/create-ra`, {
            method: 'POST',
            headers: { ...Views.getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: raUsername,
              studentEmail: raEmail,
              password: raPassword,
              buildingId: parseInt(raBuildingId),
              phoneNumber: raPhoneNumber || null,
              officeLocation: raOfficeLocation || null
            })
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to create RA account');

          alert('RA account created successfully!');
          const raModalEl = document.getElementById('createRAModal');
          if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modal = bootstrap.Modal.getInstance(raModalEl);
            if (modal) modal.hide();
          } else {
            if (raModalEl) {
              raModalEl.style.display = 'none';
              raModalEl.classList.remove('show');
              document.body.classList.remove('modal-open');
              const backdrop = document.getElementById('modalBackdrop');
              if (backdrop) backdrop.remove();
            }
          }
          const form = document.getElementById('createRAForm');
          if (form) {
            form.reset();
            form.classList.remove('was-validated');
          }
        } catch (error) {
          const errorDiv = document.getElementById('createRAError');
          if (errorDiv) {
            errorDiv.textContent = error.message || 'Failed to create RA account. Please try again.';
            errorDiv.classList.remove('d-none');
          }
        } finally {
          btn.disabled = false;
          btn.innerHTML = '<i class="bi bi-person-plus"></i> Create RA Account';
        }
      });
    }

    // Store selectBuilding globally for onclick
    Dashboards.selectBuilding = selectBuilding;

    await loadBuildings();
  },

  // RA Dashboard - Emergency Management
  async raDashboard() {
    if (!Views.isAuthenticated()) {
      router.goTo('/login');
      return;
    }

    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'RA' && userRole !== 'admin') {
      alert('Access denied. This page is for RAs and admins only.');
      router.goTo('/login');
      return;
    }

    // Ensure dark mode is applied
    Views.initDarkMode();

    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username') || 'RA';

    const app = document.getElementById('app');
    app.innerHTML = `
      ${Views.renderNavbar(userRole, username)}
      <div class="container-fluid py-4">
        <div class="row">
          <div class="col-12">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 class="mb-1">
                  <i class="bi bi-exclamation-triangle-fill text-danger"></i> Emergency Management
                </h2>
                <p class="text-muted mb-0">Monitor and verify emergency reports for your building</p>
              </div>
              <button class="btn btn-outline-primary" id="refreshBtn">
                <i class="bi bi-arrow-clockwise"></i> Refresh
              </button>
            </div>

            <!-- Building Info Card -->
            <div class="card shadow-sm mb-4">
              <div class="card-body">
                <div class="row">
                  <div class="col-md-4">
                    <h6 class="text-muted mb-1">Your Building</h6>
                    <p class="mb-0">
                      <i class="bi bi-building"></i> <strong id="raBuildingName">Loading...</strong>
                    </p>
                  </div>
                  <div class="col-md-4">
                    <h6 class="text-muted mb-1">Unverified Emergencies</h6>
                    <p class="mb-0">
                      <span class="badge bg-danger fs-6" id="unverifiedCountBadge">0</span>
                    </p>
                  </div>
                  <div class="col-md-4">
                    <h6 class="text-muted mb-1">Active Invite Codes</h6>
                    <p class="mb-0">
                      <span class="badge bg-info fs-6" id="activeInviteCodesBadge">0</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Invite Codes Section -->
            <div class="card shadow-sm mb-4">
              <div class="card-header bg-info bg-opacity-10">
                <div class="d-flex justify-content-between align-items-center">
                  <h5 class="mb-0">
                    <i class="bi bi-ticket-perforated"></i> Invite Codes
                  </h5>
                  <button class="btn btn-sm btn-primary" id="generateInviteCodeBtn">
                    <i class="bi bi-plus-circle"></i> Generate New Code
                  </button>
                </div>
              </div>
              <div class="card-body">
                <p class="text-muted small mb-3">
                  Generate invite codes to share with students. Students can use these codes during signup to join your building.
                </p>
                <div id="inviteCodesContainer">
                  <div class="text-center p-3">
                    <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">Loading...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Filter Tabs -->
            <ul class="nav nav-tabs mb-4" id="filterTabs" role="tablist">
              <li class="nav-item" role="presentation">
                <button class="nav-link active" id="unverified-tab" data-bs-toggle="tab" data-bs-target="#unverified" type="button" role="tab">
                  <i class="bi bi-exclamation-circle"></i> Unverified
                  <span class="badge bg-danger ms-2" id="unverifiedCount">0</span>
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" id="verified-tab" data-bs-toggle="tab" data-bs-target="#verified" type="button" role="tab">
                  <i class="bi bi-check-circle"></i> Verified
                  <span class="badge bg-success ms-2" id="verifiedCount">0</span>
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" id="all-tab" data-bs-toggle="tab" data-bs-target="#all" type="button" role="tab">
                  <i class="bi bi-list-ul"></i> All
                  <span class="badge bg-secondary ms-2" id="allCount">0</span>
                </button>
              </li>
            </ul>

            <!-- Tab Content -->
            <div class="tab-content" id="filterTabContent">
              <div class="tab-pane fade show active" id="unverified" role="tabpanel">
                <div class="alert alert-warning">
                  <i class="bi bi-info-circle"></i>
                  <strong>Action Required:</strong> Review and verify these emergency reports for your building.
                </div>
                <div id="unverifiedEmergenciesContainer"></div>
              </div>
              <div class="tab-pane fade" id="verified" role="tabpanel">
                <div id="verifiedEmergenciesContainer"></div>
              </div>
              <div class="tab-pane fade" id="all" role="tabpanel">
                <div id="allEmergenciesContainer"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      ${this.renderRAModals()}
    `;

    // Initialize RA dashboard functionality
    await this.initRADashboard(userId, userRole);
  },

  renderRAModals() {
    return `
      <!-- Verify Emergency Modal -->
      <div class="modal fade" id="verifyModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-success text-white">
              <h5 class="modal-title"><i class="bi bi-check-circle"></i> Verify Emergency</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="verifyForm">
                <input type="hidden" id="verifyEmergencyId" />
                <div class="alert alert-info mb-3">
                  <i class="bi bi-info-circle"></i>
                  <strong>Emergency Details:</strong>
                  <div id="verifyEmergencyDetails" class="mt-2"></div>
                </div>
                <div class="mb-3">
                  <label for="verificationNotes" class="form-label">Verification Notes (Optional)</label>
                  <textarea class="form-control" id="verificationNotes" rows="3" placeholder="Add any notes about the verification..."></textarea>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-success" id="confirmVerifyBtn">
                <i class="bi bi-check-circle"></i> Verify Emergency
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Emergency Details Modal -->
      <div class="modal fade" id="detailsModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title"><i class="bi bi-info-circle"></i> Emergency Details</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" id="detailsModalBody"></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" class="btn btn-success" id="verifyFromDetailsBtn" style="display: none;">
                <i class="bi bi-check-circle"></i> Verify Emergency
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Generate Invite Code Modal -->
      <div class="modal fade" id="generateInviteCodeModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title"><i class="bi bi-ticket-perforated"></i> Generate Invite Code</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="generateInviteCodeForm">
                <div class="mb-3">
                  <label for="expiresInDays" class="form-label">Expires In (Days)</label>
                  <input type="number" class="form-control" id="expiresInDays" min="1" placeholder="Leave empty for no expiration" />
                  <div class="form-text">Optional: Set number of days until the code expires. Leave empty for no expiration.</div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" id="confirmGenerateInviteCodeBtn">
                <i class="bi bi-ticket-perforated"></i> Generate Code
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Invite Code Success Modal -->
      <div class="modal fade" id="inviteCodeSuccessModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-success text-white">
              <h5 class="modal-title"><i class="bi bi-check-circle"></i> Invite Code Generated</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="alert alert-info">
                <strong>Your invite code:</strong>
                <div class="mt-2">
                  <code class="fs-4" id="newInviteCodeDisplay" style="background: #f8f9fa; padding: 10px; border-radius: 5px; display: block; text-align: center;"></code>
                </div>
                <p class="mt-3 mb-0">Share this code with students. They can use it during signup to join your building.</p>
              </div>
              <button class="btn btn-outline-primary w-100" id="copyInviteCodeBtn">
                <i class="bi bi-clipboard"></i> Copy Code
              </button>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-success" data-bs-dismiss="modal">Done</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async initRADashboard(userId, userRole) {
    let emergencies = [];
    let inviteCodes = [];
    let currentBuildingId = null;
    let currentBuildingName = null;

    // Helper functions
    function formatTimestamp(date) {
      const now = new Date();
      const d = new Date(date);
      const diff = now - d;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
      return d.toLocaleDateString();
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    function getEmergencyTypeBadge(type) {
      const badges = {
        medical: 'bg-danger',
        fire: 'bg-danger',
        security: 'bg-warning',
        other: 'bg-secondary'
      };
      return badges[type] || 'bg-secondary';
    }

    function renderEmergencyCard(emergency) {
      const isVerified = emergency.is_verified === 1 || emergency.is_verified === true;
      const createdAt = new Date(emergency.created_at);
      return `
        <div class="card shadow-sm mb-3 ${isVerified ? 'border-success' : 'border-danger'}">
          <div class="card-header ${isVerified ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'}">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <span class="badge ${getEmergencyTypeBadge(emergency.emergency_type)} me-2">
                  ${emergency.emergency_type.toUpperCase()}
                </span>
                ${isVerified ? '<span class="badge bg-success">Verified</span>' : '<span class="badge bg-danger">Unverified</span>'}
              </div>
              <small class="text-muted">${formatTimestamp(createdAt)}</small>
            </div>
          </div>
          <div class="card-body">
            <div class="mb-2">
              <strong><i class="bi bi-geo-alt"></i> Location:</strong>
              <span>${escapeHtml(emergency.location)}</span>
            </div>
            <div class="mb-3">
              <strong><i class="bi bi-info-circle"></i> Description:</strong>
              <p class="mb-0">${escapeHtml(emergency.description)}</p>
            </div>
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div class="small text-muted">
                <i class="bi bi-person"></i> Reported by: ${escapeHtml(emergency.reported_by || 'Unknown')}
              </div>
              <div>
                <button class="btn btn-sm btn-outline-primary" onclick="Dashboards.viewEmergencyDetails(${emergency.emergency_id})">
                  <i class="bi bi-eye"></i> View Details
                </button>
                ${!isVerified ? `
                  <button class="btn btn-sm btn-success" onclick="Dashboards.openVerifyModal(${emergency.emergency_id})">
                    <i class="bi bi-check-circle"></i> Verify
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    function renderEmergencies(container, emergencyList) {
      container.innerHTML = '';
      if (emergencyList.length === 0) {
        container.innerHTML = '<div class="alert alert-info"><i class="bi bi-info-circle"></i> No emergencies found.</div>';
        return;
      }
      emergencyList.forEach(emergency => {
        container.innerHTML += renderEmergencyCard(emergency);
      });
    }

    function updateAllViews() {
      const unverified = emergencies.filter(e => !e.is_verified || e.is_verified === 0);
      const verified = emergencies.filter(e => e.is_verified === 1 || e.is_verified === true);
      document.getElementById('unverifiedCount').textContent = unverified.length;
      document.getElementById('verifiedCount').textContent = verified.length;
      document.getElementById('allCount').textContent = emergencies.length;
      document.getElementById('unverifiedCountBadge').textContent = unverified.length;
      renderEmergencies(document.getElementById('unverifiedEmergenciesContainer'), unverified);
      renderEmergencies(document.getElementById('verifiedEmergenciesContainer'), verified);
      renderEmergencies(document.getElementById('allEmergenciesContainer'), emergencies);
    }

    // Load building info for RA
    async function loadBuildingInfo() {
      try {
        const res = await fetch(`${Views.apiUrl}/buildings/ra`, {
          headers: Views.getAuthHeaders()
        });
        if (res.ok) {
          const buildingData = await res.json();
          if (buildingData.building_name) {
            currentBuildingName = buildingData.building_name;
            document.getElementById('raBuildingName').textContent = currentBuildingName;
            if (buildingData.building_id) {
              currentBuildingId = buildingData.building_id;
              localStorage.setItem('buildingId', currentBuildingId);
            }
          }
        }
      } catch (error) {
        console.error('Error loading building info:', error);
      }
    }

    // Load emergencies
    async function loadEmergencies() {
      try {
        const res = await fetch(`${Views.apiUrl}/emergencies`, {
          headers: Views.getAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to load emergencies');
        const data = await res.json();
        emergencies = data.map(em => ({
          ...em,
          created_at: new Date(em.created_at)
        }));
        // If we don't have building info yet, try to get it from emergencies
        if (!currentBuildingName && emergencies.length > 0 && emergencies[0].building_name) {
          currentBuildingName = emergencies[0].building_name;
          document.getElementById('raBuildingName').textContent = currentBuildingName;
          if (emergencies[0].building_id) {
            currentBuildingId = emergencies[0].building_id;
            localStorage.setItem('buildingId', currentBuildingId);
          }
        }
        updateAllViews();
      } catch (error) {
        console.error('Error loading emergencies:', error);
        emergencies = [];
        updateAllViews();
      }
    }

    // Load invite codes
    async function loadInviteCodes() {
      try {
        const res = await fetch(`${Views.apiUrl}/invite-codes`, {
          headers: Views.getAuthHeaders()
        });
        if (!res.ok) throw new Error('Failed to load invite codes');
        inviteCodes = await res.json();
        renderInviteCodes();
        updateInviteCodeBadge();
      } catch (error) {
        console.error('Error loading invite codes:', error);
        document.getElementById('inviteCodesContainer').innerHTML = `
          <div class="alert alert-danger">
            <i class="bi bi-exclamation-triangle"></i> Failed to load invite codes.
          </div>
        `;
      }
    }

    function renderInviteCodes() {
      const container = document.getElementById('inviteCodesContainer');
      container.innerHTML = '';
      if (inviteCodes.length === 0) {
        container.innerHTML = '<div class="alert alert-info"><i class="bi bi-info-circle"></i> No invite codes generated yet.</div>';
        return;
      }
      inviteCodes.forEach(code => {
        const isUsed = code.used_by !== null;
        const isExpired = code.expires_at && new Date(code.expires_at) < new Date();
        const isActive = code.is_active === 1 && !isUsed && !isExpired;
        const codeDiv = document.createElement('div');
        codeDiv.className = `card mb-3 ${isActive ? 'border-primary' : 'border-secondary'}`;
        codeDiv.innerHTML = `
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div>
                <code class="fs-5">${escapeHtml(code.code)}</code>
                ${isActive ? '<span class="badge bg-success ms-2">Active</span>' : ''}
                ${isUsed ? '<span class="badge bg-secondary ms-2">Used</span>' : ''}
                ${isExpired ? '<span class="badge bg-warning ms-2">Expired</span>' : ''}
              </div>
              <small class="text-muted">${formatTimestamp(new Date(code.created_at))}</small>
            </div>
            <div class="small text-muted">
              ${code.expires_at ? `<div><i class="bi bi-calendar-x"></i> Expires: ${new Date(code.expires_at).toLocaleDateString()}</div>` : '<div><i class="bi bi-infinity"></i> No expiration</div>'}
              <div><i class="bi bi-building"></i> Building: ${escapeHtml(code.building_name)}</div>
            </div>
            ${isActive ? `
              <div class="mt-2">
                <button class="btn btn-sm btn-outline-primary" onclick="Dashboards.copyInviteCode('${escapeHtml(code.code)}')">
                  <i class="bi bi-clipboard"></i> Copy Code
                </button>
              </div>
            ` : ''}
          </div>
        `;
        container.appendChild(codeDiv);
      });
    }

    function updateInviteCodeBadge() {
      const activeCount = inviteCodes.filter(code => {
        const isUsed = code.used_by !== null;
        const isExpired = code.expires_at && new Date(code.expires_at) < new Date();
        return code.is_active === 1 && !isUsed && !isExpired;
      }).length;
      document.getElementById('activeInviteCodesBadge').textContent = activeCount;
    }

    // Event handlers
    document.getElementById('refreshBtn').addEventListener('click', () => {
      loadEmergencies();
      loadInviteCodes();
    });

    document.getElementById('generateInviteCodeBtn').addEventListener('click', () => {
      document.getElementById('expiresInDays').value = '';
      showModal('generateInviteCodeModal');
    });

    document.getElementById('confirmGenerateInviteCodeBtn').addEventListener('click', async () => {
      const expiresInDays = document.getElementById('expiresInDays').value;
      const expiresInDaysNum = expiresInDays ? parseInt(expiresInDays) : null;
      try {
        const res = await fetch(`${Views.apiUrl}/invite-codes`, {
          method: 'POST',
          headers: { ...Views.getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ expiresInDays: expiresInDaysNum })
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to generate invite code');
        }
        const data = await res.json();
        const modal = bootstrap.Modal.getInstance(document.getElementById('generateInviteCodeModal'));
        if (modal) modal.hide();
        document.getElementById('newInviteCodeDisplay').textContent = data.code;
        showModal('inviteCodeSuccessModal');
        await loadInviteCodes();
      } catch (error) {
        alert(`Failed to generate invite code: ${error.message}`);
      }
    });

    document.getElementById('copyInviteCodeBtn').addEventListener('click', () => {
      const code = document.getElementById('newInviteCodeDisplay').textContent;
      navigator.clipboard.writeText(code).then(() => {
        alert('Invite code copied to clipboard!');
      }).catch(() => {
        alert('Failed to copy code. Please copy manually: ' + code);
      });
    });

    document.getElementById('confirmVerifyBtn').addEventListener('click', async () => {
      const emergencyId = document.getElementById('verifyEmergencyId').value;
      const verificationNotes = document.getElementById('verificationNotes').value;
      if (!emergencyId) {
        alert('Invalid emergency ID');
        return;
      }
      try {
        const res = await fetch(`${Views.apiUrl}/emergencies/${emergencyId}/verify`, {
          method: 'POST',
          headers: { ...Views.getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ verificationNotes })
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to verify emergency');
        }
        alert('Emergency verified successfully!');
        const modal = bootstrap.Modal.getInstance(document.getElementById('verifyModal'));
        if (modal) modal.hide();
        document.getElementById('verifyForm').reset();
        await loadEmergencies();
      } catch (error) {
        alert(`Failed to verify emergency: ${error.message}`);
      }
    });

    // Global functions for onclick handlers
    Dashboards.openVerifyModal = function(emergencyId) {
      const emergency = emergencies.find(e => e.emergency_id === emergencyId);
      if (!emergency) return;
      document.getElementById('verifyEmergencyId').value = emergencyId;
      document.getElementById('verifyEmergencyDetails').innerHTML = `
        <div><strong>Type:</strong> ${emergency.emergency_type.toUpperCase()}</div>
        <div><strong>Location:</strong> ${escapeHtml(emergency.location)}</div>
        <div><strong>Description:</strong> ${escapeHtml(emergency.description)}</div>
        <div><strong>Reported by:</strong> ${escapeHtml(emergency.reported_by || 'Unknown')}</div>
      `;
      document.getElementById('verificationNotes').value = '';
      showModal('verifyModal');
    };

    Dashboards.viewEmergencyDetails = function(emergencyId) {
      const emergency = emergencies.find(e => e.emergency_id === emergencyId);
      if (!emergency) return;
      const isVerified = emergency.is_verified === 1 || emergency.is_verified === true;
      document.getElementById('detailsModalBody').innerHTML = `
        <div class="mb-3">
          <h6>Emergency Type</h6>
          <span class="badge ${getEmergencyTypeBadge(emergency.emergency_type)} fs-6">${emergency.emergency_type.toUpperCase()}</span>
        </div>
        <div class="mb-3">
          <h6>Location</h6>
          <p>${escapeHtml(emergency.location)}</p>
        </div>
        <div class="mb-3">
          <h6>Description</h6>
          <p>${escapeHtml(emergency.description)}</p>
        </div>
        <div class="mb-3">
          <h6>Status</h6>
          ${isVerified ? '<span class="badge bg-success fs-6">Verified</span>' : '<span class="badge bg-danger fs-6">Unverified</span>'}
        </div>
        <div class="mb-3">
          <h6>Reported By</h6>
          <p>${escapeHtml(emergency.reported_by || 'Unknown')}</p>
        </div>
        <div class="mb-3">
          <h6>Reported At</h6>
          <p>${formatTimestamp(emergency.created_at)}</p>
        </div>
      `;
      const verifyBtn = document.getElementById('verifyFromDetailsBtn');
      verifyBtn.style.display = isVerified ? 'none' : 'inline-block';
      verifyBtn.onclick = () => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('detailsModal'));
        if (modal) modal.hide();
        Dashboards.openVerifyModal(emergencyId);
      };
      showModal('detailsModal');
    };

    Dashboards.copyInviteCode = function(code) {
      navigator.clipboard.writeText(code).then(() => {
        alert('Invite code copied to clipboard!');
      }).catch(() => {
        alert('Failed to copy code. Please copy manually: ' + code);
      });
    };

    // Unpin message function
    Dashboards.unpinMessage = async function(pinnedMessageId) {
      if (!confirm('Are you sure you want to unpin this message?')) {
        return;
      }

      try {
        const headers = Views.getAuthHeaders();
        const res = await fetch(`${Views.apiUrl}/messages/pinned/${pinnedMessageId}`, {
          method: 'DELETE',
          headers
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to unpin message');
        }

        // Reload messages
        await loadBuildingMessages();
      } catch (error) {
        alert(`Failed to unpin message: ${error.message}`);
      }
    };

    // Helper function to show modals
    function showModal(modalId) {
      const modal = document.getElementById(modalId);
      if (!modal) return;
      if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
      } else {
        modal.style.display = 'block';
        modal.classList.add('show');
        document.body.classList.add('modal-open');
      }
    }

    // Initial load - load building info first
    await loadBuildingInfo();
    await loadEmergencies();
    await loadInviteCodes();

    // Auto-refresh every 30 seconds
    setInterval(() => {
      loadEmergencies();
      loadInviteCodes();
    }, 30000);
  }
};

// Make Dashboards globally accessible
window.Dashboards = Dashboards;

