// RA Dashboard functionality
(function () {
  'use strict';

  // API configuration
  const apiUrl = 'http://localhost:5000/api';
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');
  const username = localStorage.getItem('username') || 'RA';

  // Check if user is RA
  if (userRole !== 'RA') {
    alert('Access denied. This page is for RAs only.');
    window.location.href = 'home.html';
    return;
  }

  // Set username display
  document.getElementById('displayUsername').textContent = username;

  // Elements
  const refreshBtn = document.getElementById('refreshBtn');
  const unverifiedContainer = document.getElementById('unverifiedEmergenciesContainer');
  const verifiedContainer = document.getElementById('verifiedEmergenciesContainer');
  const allContainer = document.getElementById('allEmergenciesContainer');
  const unverifiedCount = document.getElementById('unverifiedCount');
  const verifiedCount = document.getElementById('verifiedCount');
  const allCount = document.getElementById('allCount');
  const unverifiedCountBadge = document.getElementById('unverifiedCountBadge');
  const raBuildingName = document.getElementById('raBuildingName');
  const verifyModal = new bootstrap.Modal(document.getElementById('verifyModal'));
  const detailsModal = new bootstrap.Modal(document.getElementById('detailsModal'));
  const verifyForm = document.getElementById('verifyForm');
  const confirmVerifyBtn = document.getElementById('confirmVerifyBtn');
  const verifyFromDetailsBtn = document.getElementById('verifyFromDetailsBtn');

  // Data
  let emergencies = [];
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
      if (emergencies.length > 0 && emergencies[0].building_name) {
        currentBuildingName = emergencies[0].building_name;
        raBuildingName.textContent = currentBuildingName;
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
            }
          }
        } catch (err) {
          console.error('Error fetching building info:', err);
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

  // Load emergencies on page load
  loadEmergencies();

  // Auto-refresh every 30 seconds
  setInterval(() => {
    loadEmergencies();
  }, 30000);
})();

