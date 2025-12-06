// Router for single-page application
console.log('Router.js loaded');

class Router {
  constructor() {
    this.routes = {
      '/': 'home',
      '/login': 'login',
      '/signup': 'signup',
      '/messages': 'messages',
      '/ra-dashboard': 'raDashboard',
      '/admin-dashboard': 'adminDashboard'
    };
    this.currentView = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    
    // Wait for Views to be available
    if (typeof Views === 'undefined') {
      console.error('Views not defined. Make sure views.js is loaded before router initialization.');
      return;
    }

    this.initialized = true;

    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
      this.navigate(window.location.pathname, false);
    });

    // Handle initial route
    this.navigate(window.location.pathname || '/', false);
  }

  navigate(path, pushState = true) {
    // Normalize path - handle file:// protocol and index.html
    if (!path || path === '' || path === '/' || path === '/index.html' || path.endsWith('index.html')) {
      path = '/';
    }

    // Get view name from route
    const viewName = this.routes[path] || this.routes['/'];

    // Update URL without reload
    if (pushState) {
      window.history.pushState({}, '', path);
    }

    // Render view
    try {
      if (typeof Views !== 'undefined' && Views[viewName]) {
        this.currentView = viewName;
        Views[viewName]();
      } else {
        console.error(`View not found: ${viewName}`);
        if (typeof Views !== 'undefined' && Views.home) {
          Views.home();
        } else {
          console.error('Views object not available');
          const app = document.getElementById('app');
          if (app) {
            app.innerHTML = `
              <div class="container py-5">
                <div class="alert alert-danger">
                  <h4>Error Loading Application</h4>
                  <p>Views module not loaded. Please check the browser console for errors.</p>
                  <p>View name: ${viewName}</p>
                </div>
              </div>
            `;
          }
        }
      }
    } catch (error) {
      console.error('Error rendering view:', error);
      const app = document.getElementById('app');
      if (app) {
        app.innerHTML = `
          <div class="container py-5">
            <div class="alert alert-danger">
              <h4>Error Rendering View</h4>
              <p>${error.message}</p>
              <p>Check the browser console for more details.</p>
            </div>
          </div>
        `;
      }
    }
  }

  // Helper to navigate programmatically
  goTo(path) {
    this.navigate(path, true);
  }
}

// Create router instance (but don't initialize yet)
const router = new Router();

