// RA Dashboard functionality
(function () {
  'use strict';

  // API configuration
  const apiUrl = 'http://localhost:5000/api';
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');
  const username = localStorage.getItem('username') || 'RA';

  // Check if user is RA or admin
  if (userRole !== 'RA' && userRole !== 'admin') {
    alert('Access denied. This page is for RAs and admins only.');
    window.location.href = 'home.html';
    return;
  }

  // Set username display
  document.getElementById('displayUsername').textContent = username;
  
  // Update dashboard title and navigation for admins
  if (userRole === 'admin') {
    const dashboardTitle = document.getElementById('dashboardTitle');
    if (dashboardTitle) {
      dashboardTitle.textContent = 'Building Manager';
    }
    
    // Hide messages link for admins (they have their own dashboard)
    const messagesNavItem = document.getElementById('messagesNavItem');
    if (messagesNavItem) {
      messagesNavItem.style.display = 'none';
    }
    
    // Show admin dashboard link
    const adminDashboardNavItem = document.getElementById('adminDashboardNavItem');
    if (adminDashboardNavItem) {
      adminDashboardNavItem.style.display = 'block';
    }
  } else {
    // RAs see messages link
    const messagesNavItem = document.getElementById('messagesNavItem');
    if (messagesNavItem) {
      messagesNavItem.style.display = 'block';
    }
    
    // Hide admin dashboard link for RAs
    const adminDashboardNavItem = document.getElementById('adminDashboardNavItem');
    if (adminDashboardNavItem) {
      adminDashboardNavItem.style.display = 'none';
    }
  }

  // Elements
  const refreshBtn = document.getElementById('refreshBtn');
  const unverifiedContainer = document.getElementById('unverifiedEmergenciesContainer');
  const verifiedContainer = document.getElementById('verifiedEmergenciesContainer');
  const allContainer = document.getElementById('allEmergenciesContainer');
  const unverifiedCount = document.getElementById('unverifiedCount');
  const verifiedCount = document.getElementById('verifiedCount');
  const allCount = document.getElementById('allCount');
  const unverifiedCountBadge = document.getElementById('unverifiedCountBadge');
  const activeInviteCodesBadge = document.getElementById('activeInviteCodesBadge');
  const raBuildingName = document.getElementById('raBuildingName');
  const verifyModal = new bootstrap.Modal(document.getElementById('verifyModal'));
  const detailsModal = new bootstrap.Modal(document.getElementById('detailsModal'));
  const verifyForm = document.getElementById('verifyForm');
  const confirmVerifyBtn = document.getElementById('confirmVerifyBtn');
  const verifyFromDetailsBtn = document.getElementById('verifyFromDetailsBtn');
  const generateInviteCodeBtn = document.getElementById('generateInviteCodeBtn');
  const inviteCodesContainer = document.getElementById('inviteCodesContainer');
  const generateInviteCodeModal = new bootstrap.Modal(document.getElementById('generateInviteCodeModal'));
  const inviteCodeSuccessModal = new bootstrap.Modal(document.getElementById('inviteCodeSuccessModal'));
  const inviteCodeDetailsModal = new bootstrap.Modal(document.getElementById('inviteCodeDetailsModal'));
  const confirmGenerateInviteCodeBtn = document.getElementById('confirmGenerateInviteCodeBtn');
  const copyInviteCodeBtn = document.getElementById('copyInviteCodeBtn');
  const inviteCodeBuildingSelectContainer = document.getElementById('inviteCodeBuildingSelectContainer');
  const inviteCodeBuildingIdSelect = document.getElementById('inviteCodeBuildingId');
  const messagesLink = document.getElementById('messagesLink');
  let allBuildings = [];

  // Data
  let emergencies = [];
  let inviteCodes = [];
  let currentBuildingId = null;
  let currentBuildingName = null;

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
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  // Get emergency type badge class
  function getEmergencyTypeBadge(type) {
    const badges = {
      medical: 'bg-danger',
      fire: 'bg-danger',
      security: 'bg-warning',
      other: 'bg-secondary'
    };
    return badges[type] || 'bg-secondary';
  }

  // Render emergency card
  function renderEmergencyCard(emergency) {
    const isVerified = emergency.is_verified === 1 || emergency.is_verified === true;
    const verifiedAt = emergency.verified_at ? new Date(emergency.verified_at) : null;
    const createdAt = new Date(emergency.created_at);

    return `
      <div class="card shadow-sm mb-3 emergency-card ${isVerified ? 'border-success' : 'border-danger'}">
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
              ${isVerified && emergency.verified_by_username ? `<br><i class="bi bi-check-circle"></i> Verified by: ${escapeHtml(emergency.verified_by_username)}` : ''}
              ${isVerified && verifiedAt ? `<br><i class="bi bi-clock"></i> Verified: ${formatTimestamp(verifiedAt)}` : ''}
            </div>
            <div>
              <button class="btn btn-sm btn-outline-primary" onclick="viewEmergencyDetails(${emergency.emergency_id})">
                <i class="bi bi-eye"></i> View Details
              </button>
              ${!isVerified ? `
                <button class="btn btn-sm btn-success" onclick="openVerifyModal(${emergency.emergency_id})">
                  <i class="bi bi-check-circle"></i> Verify
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Render emergencies in container
  function renderEmergencies(container, emergencyList) {
    container.innerHTML = '';

    if (emergencyList.length === 0) {
      container.innerHTML = `
        <div class="alert alert-info">
          <i class="bi bi-info-circle"></i> No emergencies found.
        </div>
      `;
      return;
    }

    emergencyList.forEach(emergency => {
      container.innerHTML += renderEmergencyCard(emergency);
    });
  }

  // Update all views
  function updateAllViews() {
    const unverified = emergencies.filter(e => !e.is_verified || e.is_verified === 0);
    const verified = emergencies.filter(e => e.is_verified === 1 || e.is_verified === true);

    unverifiedCount.textContent = unverified.length;
    verifiedCount.textContent = verified.length;
    allCount.textContent = emergencies.length;
    unverifiedCountBadge.textContent = unverified.length;

    renderEmergencies(unverifiedContainer, unverified);
    renderEmergencies(verifiedContainer, verified);
    renderEmergencies(allContainer, emergencies);
  }

  // Load emergencies
  async function loadEmergencies() {
    try {
      // For admins, don't filter by buildingId (they see all)
      // For RAs, the API will filter by their building automatically
      const response = await fetch(`${apiUrl}/emergencies`, {
        headers: {
          'user-id': userId,
          'user-role': userRole
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load emergencies');
      }

      const data = await response.json();
      
      emergencies = data.map(em => ({
        emergency_id: em.emergency_id,
        emergency_type: em.emergency_type,
        location: em.location,
        description: em.description,
        is_verified: em.is_verified,
        verified_at: em.verified_at ? new Date(em.verified_at) : null,
        verified_by: em.verified_by,
        created_at: new Date(em.created_at),
        building_name: em.building_name,
        reported_by: em.reported_by,
        verified_by_username: em.verified_by_username
      }));

      // Get building name from first emergency or fetch separately
      if (userRole === 'admin') {
        // Admins see all buildings, so show "All Buildings" or first building name
        if (emergencies.length > 0 && emergencies[0].building_name) {
          raBuildingName.textContent = 'All Buildings';
        } else {
          raBuildingName.textContent = 'All Buildings';
        }
      } else {
        // RAs see their specific building
        if (emergencies.length > 0 && emergencies[0].building_name) {
          currentBuildingName = emergencies[0].building_name;
          raBuildingName.textContent = currentBuildingName;
          // Store building ID for messages page
          if (emergencies[0].building_id) {
            currentBuildingId = emergencies[0].building_id;
            localStorage.setItem('buildingId', currentBuildingId);
          }
        } else {
          // Fetch building info separately
          try {
            const buildingResponse = await fetch(`${apiUrl}/buildings/ra`, {
              headers: {
                'user-id': userId,
                'user-role': userRole
              }
            });
            if (buildingResponse.ok) {
              const buildingData = await buildingResponse.json();
              if (buildingData.building_name) {
                currentBuildingName = buildingData.building_name;
                raBuildingName.textContent = currentBuildingName;
                // Store building ID for messages page
                if (buildingData.building_id) {
                  currentBuildingId = buildingData.building_id;
                  localStorage.setItem('buildingId', currentBuildingId);
                }
              }
            }
          } catch (err) {
            console.error('Error fetching building info:', err);
          }
        }
      }

      updateAllViews();
    } catch (error) {
      console.error('Error loading emergencies:', error);
      alert('Failed to load emergencies. Please refresh the page.');
      emergencies = [];
      updateAllViews();
    }
  }

  // Open verify modal
  window.openVerifyModal = function(emergencyId) {
    const emergency = emergencies.find(e => e.emergency_id === emergencyId);
    if (!emergency) return;

    document.getElementById('verifyEmergencyId').value = emergencyId;
    
    const detailsHtml = `
      <div><strong>Type:</strong> ${emergency.emergency_type.toUpperCase()}</div>
      <div><strong>Location:</strong> ${escapeHtml(emergency.location)}</div>
      <div><strong>Description:</strong> ${escapeHtml(emergency.description)}</div>
      <div><strong>Reported by:</strong> ${escapeHtml(emergency.reported_by || 'Unknown')}</div>
      <div><strong>Reported at:</strong> ${formatTimestamp(new Date(emergency.created_at))}</div>
    `;
    document.getElementById('verifyEmergencyDetails').innerHTML = detailsHtml;
    document.getElementById('verificationNotes').value = '';

    verifyModal.show();
  };

  // View emergency details
  window.viewEmergencyDetails = function(emergencyId) {
    const emergency = emergencies.find(e => e.emergency_id === emergencyId);
    if (!emergency) return;

    const isVerified = emergency.is_verified === 1 || emergency.is_verified === true;
    const verifiedAt = emergency.verified_at ? new Date(emergency.verified_at) : null;

    const detailsHtml = `
      <div class="mb-3">
        <h6>Emergency Type</h6>
        <span class="badge ${getEmergencyTypeBadge(emergency.emergency_type)} fs-6">
          ${emergency.emergency_type.toUpperCase()}
        </span>
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
        ${isVerified ? 
          `<span class="badge bg-success fs-6">Verified</span>` : 
          `<span class="badge bg-danger fs-6">Unverified</span>`
        }
      </div>
      <div class="mb-3">
        <h6>Reported By</h6>
        <p>${escapeHtml(emergency.reported_by || 'Unknown')}</p>
      </div>
      <div class="mb-3">
        <h6>Reported At</h6>
        <p>${formatTimestamp(new Date(emergency.created_at))}</p>
      </div>
      ${isVerified ? `
        <div class="mb-3">
          <h6>Verified By</h6>
          <p>${escapeHtml(emergency.verified_by_username || 'Unknown')}</p>
        </div>
        <div class="mb-3">
          <h6>Verified At</h6>
          <p>${verifiedAt ? formatTimestamp(verifiedAt) : 'N/A'}</p>
        </div>
      ` : ''}
      <div class="mb-3">
        <h6>Building</h6>
        <p>${escapeHtml(emergency.building_name || 'Unknown')}</p>
      </div>
    `;

    document.getElementById('detailsModalBody').innerHTML = detailsHtml;
    verifyFromDetailsBtn.style.display = isVerified ? 'none' : 'inline-block';
    verifyFromDetailsBtn.onclick = () => {
      detailsModal.hide();
      openVerifyModal(emergencyId);
    };

    detailsModal.show();
  };

  // Verify emergency
  confirmVerifyBtn.addEventListener('click', async function() {
    const emergencyId = document.getElementById('verifyEmergencyId').value;
    const verificationNotes = document.getElementById('verificationNotes').value;

    if (!emergencyId) {
      alert('Invalid emergency ID');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/emergencies/${emergencyId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId,
          'user-role': userRole
        },
        body: JSON.stringify({
          verificationNotes: verificationNotes
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to verify emergency');
      }

      const data = await response.json();
      alert('Emergency verified successfully!');
      verifyModal.hide();
      verifyForm.reset();
      
      // Reload emergencies
      await loadEmergencies();
    } catch (error) {
      console.error('Error verifying emergency:', error);
      alert(`Failed to verify emergency: ${error.message}`);
    }
  });

  // Refresh button
  refreshBtn.addEventListener('click', function() {
    loadEmergencies();
  });

  // Escape HTML helper
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Load invite codes (RAs see their building's codes, admins see all codes)
  async function loadInviteCodes() {
    try {
      // Admins can see all invite codes, RAs see only their building's codes
      const response = await fetch(`${apiUrl}/invite-codes`, {
        headers: {
          'user-id': userId,
          'user-role': userRole
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load invite codes');
      }

      const data = await response.json();
      inviteCodes = data;

      renderInviteCodes();
      updateInviteCodeBadge();
    } catch (error) {
      console.error('Error loading invite codes:', error);
      inviteCodesContainer.innerHTML = `
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle"></i> Failed to load invite codes: ${error.message || 'Unknown error'}
        </div>
      `;
    }
  }

  // Render invite codes
  function renderInviteCodes() {
    inviteCodesContainer.innerHTML = '';

    if (inviteCodes.length === 0) {
      inviteCodesContainer.innerHTML = `
        <div class="alert alert-info">
          <i class="bi bi-info-circle"></i> No invite codes generated yet. Click "Generate New Code" to create one.
        </div>
      `;
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
              ${!code.is_active ? '<span class="badge bg-danger ms-2">Deactivated</span>' : ''}
            </div>
            <small class="text-muted">${formatTimestamp(new Date(code.created_at))}</small>
          </div>
          <div class="small text-muted">
            ${code.used_by_username ? `<div><i class="bi bi-person-check"></i> Used by: ${escapeHtml(code.used_by_username)}</div>` : ''}
            ${code.used_at ? `<div><i class="bi bi-clock"></i> Used at: ${formatTimestamp(new Date(code.used_at))}</div>` : ''}
            ${code.expires_at ? `<div><i class="bi bi-calendar-x"></i> Expires: ${new Date(code.expires_at).toLocaleDateString()}</div>` : '<div><i class="bi bi-infinity"></i> No expiration</div>'}
            <div><i class="bi bi-building"></i> Building: ${escapeHtml(code.building_name)}</div>
          </div>
          ${isActive ? `
            <div class="mt-2">
              ${(userRole === 'admin' || code.created_by == userId) ? `
                <button class="btn btn-sm btn-outline-danger" onclick="deactivateInviteCode(${code.invite_code_id})">
                  <i class="bi bi-x-circle"></i> Deactivate
                </button>
              ` : ''}
              <button class="btn btn-sm btn-outline-primary" onclick="copyInviteCode('${escapeHtml(code.code)}')">
                <i class="bi bi-clipboard"></i> Copy Code
              </button>
              ${userRole === 'admin' ? `
                <button class="btn btn-sm btn-outline-info" onclick="viewInviteCodeDetails(${code.invite_code_id})">
                  <i class="bi bi-info-circle"></i> View Details
                </button>
              ` : ''}
            </div>
          ` : ''}
          ${!isActive && userRole === 'admin' ? `
            <div class="mt-2">
              <button class="btn btn-sm btn-outline-primary" onclick="copyInviteCode('${escapeHtml(code.code)}')">
                <i class="bi bi-clipboard"></i> Copy Code
              </button>
              <button class="btn btn-sm btn-outline-info" onclick="viewInviteCodeDetails(${code.invite_code_id})">
                <i class="bi bi-info-circle"></i> View Details
              </button>
            </div>
          ` : ''}
        </div>
      `;
      inviteCodesContainer.appendChild(codeDiv);
    });
  }

  // Update invite code badge
  function updateInviteCodeBadge() {
    const activeCount = inviteCodes.filter(code => {
      const isUsed = code.used_by !== null;
      const isExpired = code.expires_at && new Date(code.expires_at) < new Date();
      return code.is_active === 1 && !isUsed && !isExpired;
    }).length;
    activeInviteCodesBadge.textContent = activeCount;
  }

  // Load buildings for admin (for building selector)
  async function loadBuildingsForAdmin() {
    if (userRole === 'admin') {
      try {
        const response = await fetch(`${apiUrl}/buildings`, {
          headers: {
            'user-id': userId,
            'user-role': userRole
          }
        });

        if (response.ok) {
          allBuildings = await response.json();
        }
      } catch (error) {
        console.error('Error loading buildings:', error);
      }
    }
  }

  // Generate invite code
  generateInviteCodeBtn.addEventListener('click', async function() {
    document.getElementById('expiresInDays').value = '';
    
    // Show building selector ONLY for admins
    // RAs can only generate codes for their assigned building (no selector shown)
    if (userRole === 'admin') {
      await loadBuildingsForAdmin();
      inviteCodeBuildingSelectContainer.style.display = 'block';
      inviteCodeBuildingIdSelect.innerHTML = '<option value="">Select a building...</option>';
      allBuildings.forEach(building => {
        const option = document.createElement('option');
        option.value = building.building_id;
        option.textContent = building.building_name;
        inviteCodeBuildingIdSelect.appendChild(option);
      });
      inviteCodeBuildingIdSelect.required = true;
    } else {
      // RAs: Hide building selector - they can only generate for their assigned building
      inviteCodeBuildingSelectContainer.style.display = 'none';
      inviteCodeBuildingIdSelect.required = false;
      inviteCodeBuildingIdSelect.value = ''; // Clear any value
    }
    
    generateInviteCodeModal.show();
  });

  confirmGenerateInviteCodeBtn.addEventListener('click', async function() {
    const expiresInDays = document.getElementById('expiresInDays').value;
    const expiresInDaysNum = expiresInDays ? parseInt(expiresInDays) : null;
    
    // Get building ID (required for admins only)
    // RAs cannot specify building - API will use their assigned building
    let buildingId = null;
    if (userRole === 'admin') {
      buildingId = inviteCodeBuildingIdSelect.value;
      if (!buildingId) {
        inviteCodeBuildingIdSelect.classList.add('is-invalid');
        return;
      }
      inviteCodeBuildingIdSelect.classList.remove('is-invalid');
    }
    // For RAs: buildingId remains null - API will automatically use their assigned building

    try {
      const response = await fetch(`${apiUrl}/invite-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId,
          'user-role': userRole
        },
        body: JSON.stringify({
          expiresInDays: expiresInDaysNum,
          ...(buildingId && { buildingId: parseInt(buildingId) }) // Only include buildingId if it exists (for admins)
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate invite code');
      }

      const data = await response.json();
      
      generateInviteCodeModal.hide();
      document.getElementById('newInviteCodeDisplay').textContent = data.code;
      inviteCodeSuccessModal.show();
      
      // Reload invite codes
      await loadInviteCodes();
    } catch (error) {
      console.error('Error generating invite code:', error);
      alert(`Failed to generate invite code: ${error.message}`);
    }
  });

  // Copy invite code
  window.copyInviteCode = function(code) {
    navigator.clipboard.writeText(code).then(() => {
      alert('Invite code copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy code. Please copy manually: ' + code);
    });
  };

  copyInviteCodeBtn.addEventListener('click', function() {
    const code = document.getElementById('newInviteCodeDisplay').textContent;
    copyInviteCode(code);
  });

  // View invite code details (Admin only)
  window.viewInviteCodeDetails = function(inviteCodeId) {
    const code = inviteCodes.find(c => c.invite_code_id === inviteCodeId);
    if (!code) {
      alert('Invite code not found');
      return;
    }

    const isUsed = code.used_by !== null;
    const isExpired = code.expires_at && new Date(code.expires_at) < new Date();
    const isActive = code.is_active === 1 && !isUsed && !isExpired;
    const useCount = isUsed ? 1 : 0; // Each code can only be used once

    const detailsHtml = `
      <div class="mb-3">
        <h6>Invite Code</h6>
        <code class="fs-5">${escapeHtml(code.code)}</code>
        ${isActive ? '<span class="badge bg-success ms-2">Active</span>' : ''}
        ${isUsed ? '<span class="badge bg-secondary ms-2">Used</span>' : ''}
        ${isExpired ? '<span class="badge bg-warning ms-2">Expired</span>' : ''}
        ${!code.is_active ? '<span class="badge bg-danger ms-2">Deactivated</span>' : ''}
      </div>

      <div class="mb-3">
        <h6>Building</h6>
        <p class="mb-0">
          <i class="bi bi-building"></i> ${escapeHtml(code.building_name)}
        </p>
      </div>

      <div class="mb-3">
        <h6>Created By</h6>
        <p class="mb-0">
          <i class="bi bi-person-plus"></i> <strong>${escapeHtml(code.created_by_username || 'Unknown')}</strong>
        </p>
        <small class="text-muted">
          <i class="bi bi-clock"></i> Created: ${formatTimestamp(new Date(code.created_at))}
        </small>
      </div>

      <div class="mb-3">
        <h6>Usage Information</h6>
        <p class="mb-2">
          <i class="bi bi-123"></i> <strong>Times Used:</strong> ${useCount}
        </p>
        ${isUsed ? `
          <p class="mb-1">
            <i class="bi bi-person-check"></i> <strong>Used By:</strong> ${escapeHtml(code.used_by_username || 'Unknown')}
          </p>
          <small class="text-muted">
            <i class="bi bi-clock"></i> Used at: ${formatTimestamp(new Date(code.used_at))}
          </small>
        ` : `
          <p class="text-muted mb-0">
            <i class="bi bi-dash-circle"></i> This code has not been used yet.
          </p>
        `}
      </div>

      <div class="mb-3">
        <h6>Expiration</h6>
        ${code.expires_at ? `
          <p class="mb-0">
            <i class="bi bi-calendar-x"></i> Expires: ${new Date(code.expires_at).toLocaleString()}
            ${isExpired ? '<span class="badge bg-warning ms-2">Expired</span>' : ''}
          </p>
        ` : `
          <p class="mb-0 text-muted">
            <i class="bi bi-infinity"></i> No expiration date
          </p>
        `}
      </div>

      <div class="mb-0">
        <h6>Status</h6>
        <p class="mb-0">
          ${isActive ? '<span class="badge bg-success">Active and Available</span>' : ''}
          ${isUsed ? '<span class="badge bg-secondary">Used</span>' : ''}
          ${isExpired ? '<span class="badge bg-warning">Expired</span>' : ''}
          ${!code.is_active ? '<span class="badge bg-danger">Deactivated</span>' : ''}
        </p>
      </div>
    `;

    document.getElementById('inviteCodeDetailsBody').innerHTML = detailsHtml;
    inviteCodeDetailsModal.show();
  };

  // Deactivate invite code
  window.deactivateInviteCode = async function(inviteCodeId) {
    if (!confirm('Are you sure you want to deactivate this invite code?')) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/invite-codes/${inviteCodeId}/deactivate`, {
        method: 'POST',
        headers: {
          'user-id': userId,
          'user-role': userRole
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to deactivate invite code');
      }

      await loadInviteCodes();
    } catch (error) {
      console.error('Error deactivating invite code:', error);
      alert(`Failed to deactivate invite code: ${error.message}`);
    }
  };

  // Set up messages link to ensure buildingId is set for RAs
  if (messagesLink && userRole === 'RA') {
    messagesLink.addEventListener('click', function(e) {
      // If buildingId is not set, fetch it first
      if (!localStorage.getItem('buildingId') || !currentBuildingId) {
        e.preventDefault();
        fetch(`${apiUrl}/buildings/ra`, {
          headers: {
            'user-id': userId,
            'user-role': userRole
          }
        })
          .then(response => response.json())
          .then(buildingData => {
            if (buildingData.building_id) {
              localStorage.setItem('buildingId', buildingData.building_id);
              window.location.href = 'messages.html';
            } else {
              alert('Unable to determine your building. Please contact an administrator.');
            }
          })
          .catch(error => {
            console.error('Error fetching building:', error);
            alert('Error loading building information. Please try again.');
          });
      }
      // If buildingId is already set, allow normal navigation
    });
  }

  // Load emergencies and buildings on page load
  loadEmergencies();
  loadInviteCodes();
  if (userRole === 'admin') {
    loadBuildingsForAdmin();
  }

  // Auto-refresh every 30 seconds
  setInterval(() => {
    loadEmergencies();
    loadInviteCodes();
  }, 30000);
})();


