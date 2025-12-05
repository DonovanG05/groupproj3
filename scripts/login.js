// Login form handling
(function () {
  'use strict';

  const form = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const errorAlert = document.getElementById('loginError');
  const errorMessage = document.getElementById('errorMessage');
  const submitBtn = form.querySelector('button[type="submit"]');

  // Hide error alert
  function hideError() {
    errorAlert.classList.add('d-none');
  }

  // Show error alert
  function showError(message) {
    errorMessage.textContent = message;
    errorAlert.classList.remove('d-none');
  }

  // Form submission handler
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    event.stopPropagation();

    // Hide previous errors
    hideError();

    // Validate fields
    let isValid = true;

    if (!usernameInput.value.trim()) {
      usernameInput.classList.add('is-invalid');
      isValid = false;
    } else {
      usernameInput.classList.remove('is-invalid');
    }

    if (!passwordInput.value) {
      passwordInput.classList.add('is-invalid');
      isValid = false;
    } else {
      passwordInput.classList.remove('is-invalid');
    }

    form.classList.add('was-validated');

    if (!isValid) {
      return;
    }

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing in...';

    try {
      const apiUrl = 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: usernameInput.value.trim(),
          password: passwordInput.value
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      // Store user info
      if (data.userId) {
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('username', data.username);
        localStorage.setItem('userRole', data.role);
        if (data.buildingId) {
          localStorage.setItem('buildingId', data.buildingId);
        }
      }

      // Redirect based on role
      if (data.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
      } else if (data.role === 'RA') {
        window.location.href = 'ra-dashboard.html';
      } else {
        // Student - redirect to messages
        if (data.buildingId) {
          localStorage.setItem('buildingId', data.buildingId);
          window.location.href = 'messages.html';
        } else {
          // Student without building - should not happen, but handle it
          showError('No building assigned. Please contact your administrator.');
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Sign In';
          return;
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      showError(error.message || 'Failed to sign in. Please try again.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Sign In';
    }
  });

  // Clear error on input
  [usernameInput, passwordInput].forEach((input) => {
    input.addEventListener('input', function () {
      if (this.classList.contains('is-invalid')) {
        this.classList.remove('is-invalid');
      }
      hideError();
    });
  });
})();

