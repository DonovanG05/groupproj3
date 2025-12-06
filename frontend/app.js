// Main application entry point
console.log('App.js loaded');

(function() {
  'use strict';

  // Initialize application when DOM and all scripts are ready
  function initApp() {
    // Check if app element exists
    const app = document.getElementById('app');
    if (!app) {
      console.error('App element not found! Make sure index.html has <div id="app"></div>');
      return;
    }

    // Check if required modules are loaded
    if (typeof router === 'undefined') {
      console.error('Router not defined. Check router.js is loaded.');
      app.innerHTML = '<div class="container py-5"><div class="alert alert-danger">Error: Router module not loaded. Check browser console.</div></div>';
      return;
    }

    if (typeof Views === 'undefined') {
      console.error('Views not defined. Check views.js is loaded.');
      app.innerHTML = '<div class="container py-5"><div class="alert alert-danger">Error: Views module not loaded. Check browser console.</div></div>';
      return;
    }

    // Make router and Views globally accessible for onclick handlers
    window.router = router;
    window.Views = Views;
    if (typeof Dashboards !== 'undefined') {
      window.Dashboards = Dashboards;
    }

    // Initialize dark mode
    if (typeof Views !== 'undefined' && Views.initDarkMode) {
      Views.initDarkMode();
    }

    // Initialize router now that Views is available
    try {
      router.init();
      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Error initializing router:', error);
      app.innerHTML = `
        <div class="container py-5">
          <div class="alert alert-danger">
            <h4>Error Initializing Application</h4>
            <p>${error.message}</p>
            <p>Check the browser console for more details.</p>
          </div>
        </div>
      `;
    }
  }

  // Wait for DOM and all scripts to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Small delay to ensure all scripts are loaded
      setTimeout(initApp, 50);
    });
  } else {
    // DOM already loaded, but scripts might still be loading
    setTimeout(initApp, 50);
  }
})();

