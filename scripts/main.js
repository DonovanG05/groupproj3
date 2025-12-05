// Form validation and submission handling
(function () {
  'use strict';

  const form = document.getElementById('signupForm');
  const studentEmailInput = document.getElementById('studentEmail');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const inviteCodeInput = document.getElementById('inviteCode');

  // Validate student email format (must be an email ending in .edu)
  function validateStudentEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.edu$/i;
    return emailRegex.test(email);
  }

  // Custom validation for student email
  studentEmailInput.addEventListener('blur', function () {
    if (this.value && !validateStudentEmail(this.value)) {
      this.setCustomValidity('Please enter a valid student email ending in .edu');
      this.classList.add('is-invalid');
    } else {
      this.setCustomValidity('');
      this.classList.remove('is-invalid');
    }
  });

  studentEmailInput.addEventListener('input', function () {
    if (this.classList.contains('is-invalid')) {
      if (validateStudentEmail(this.value)) {
        this.setCustomValidity('');
        this.classList.remove('is-invalid');
      }
    }
  });

  // Form submission handler
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    event.stopPropagation();

    // Validate all fields
    let isValid = true;

    // Check student email
    if (!validateStudentEmail(studentEmailInput.value)) {
      studentEmailInput.setCustomValidity('Please enter a valid student email ending in .edu');
      studentEmailInput.classList.add('is-invalid');
      isValid = false;
    } else {
      studentEmailInput.setCustomValidity('');
      studentEmailInput.classList.remove('is-invalid');
    }

    // Check username
    if (usernameInput.value.length < 3) {
      usernameInput.classList.add('is-invalid');
      isValid = false;
    } else {
      usernameInput.classList.remove('is-invalid');
    }

    // Check password
    if (passwordInput.value.length < 8) {
      passwordInput.classList.add('is-invalid');
      isValid = false;
    } else {
      passwordInput.classList.remove('is-invalid');
    }

    // Check invite code
    if (!inviteCodeInput.value.trim()) {
      inviteCodeInput.classList.add('is-invalid');
      isValid = false;
    } else {
      inviteCodeInput.classList.remove('is-invalid');
    }

    form.classList.add('was-validated');

    if (isValid) {
      // Collect form data
      const formData = {
        studentEmail: studentEmailInput.value,
        username: usernameInput.value,
        password: passwordInput.value,
        inviteCode: inviteCodeInput.value.trim(),
      };

      // Log to console (will be replaced with API call later)
      console.log('Form data ready for submission:', {
        studentEmail: formData.studentEmail,
        username: formData.username,
        password: '***hidden***',
        inviteCode: formData.inviteCode,
      });

      // API call to save to database
      const apiUrl = 'http://localhost:5000/api/auth/signup'; // Update with your API URL
      
      fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
        .then(response => {
          if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
          }
          return response.json();
        })
        .then(data => {
          // Handle success
          alert('Account created successfully!');
          // Store user info if returned
          if (data.userId) {
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('username', data.username);
            localStorage.setItem('userRole', data.role);
            // Store buildingId from invite code
            if (data.buildingId) {
              localStorage.setItem('buildingId', data.buildingId);
            }
          }
          // Redirect to messages page
          window.location.href = 'messages.html';
        })
        .catch(error => {
          // Handle error
          console.error('Signup error:', error);
          const errorMessage = error.error || error.message || 'Failed to create account. Please try again.';
          alert(errorMessage);
        });
      
      // Reset form
      form.reset();
      form.classList.remove('was-validated');
    }
  });

  // Real-time validation feedback
  [usernameInput, passwordInput, inviteCodeInput].forEach((input) => {
    input.addEventListener('input', function () {
      if (this.classList.contains('is-invalid') && this.checkValidity()) {
        this.classList.remove('is-invalid');
      }
    });
  });
})();

