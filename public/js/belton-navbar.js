/**
 * BELTON AI - Global Unified Navigation Controller
 */
(function() {
  function initBeltonNavbar() {
    const currentPath = window.location.pathname.toLowerCase();
    
    // Determine active key
    let activeKey = 'home';
    if (currentPath.includes('explorer')) {
      activeKey = 'explorer';
    } else if (currentPath.includes('product')) {
      activeKey = 'product';
    } else if (currentPath.includes('manufacturing')) {
      activeKey = 'manufacturing';
    } else if (currentPath.includes('factory')) {
      activeKey = 'factory';
    } else if (currentPath.includes('copilot')) {
      activeKey = 'copilot';
    } else if (currentPath === '/' || currentPath.endsWith('index.html')) {
      activeKey = 'home';
    }

    // Set active link for any nav item with data-nav
    const links = document.querySelectorAll('[data-nav]');
    links.forEach(link => {
      const navKey = link.getAttribute('data-nav');
      if (navKey === activeKey) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Bind logout buttons
    const logoutBtns = document.querySelectorAll('.btn-belton-logout, #factoryLogoutBtn');
    logoutBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (!document.getElementById('logoutConfirmModal')) {
          e.preventDefault();
          sessionStorage.removeItem('belton_logged_in');
          window.location.href = '/';
        }
      });
    });

    // Check login state for home page
    const loginBtn = document.getElementById('beltonHomeAuthBtn');
    if (loginBtn) {
      const isLoggedIn = sessionStorage.getItem('belton_logged_in') === 'true';
      if (isLoggedIn) {
        loginBtn.textContent = 'LOGOUT';
        loginBtn.classList.remove('btn-login');
        loginBtn.classList.add('btn-logout');
        loginBtn.onclick = (e) => {
          e.preventDefault();
          sessionStorage.removeItem('belton_logged_in');
          window.location.reload();
        };
      } else {
        loginBtn.textContent = 'LOGIN';
        loginBtn.classList.remove('btn-logout');
        loginBtn.classList.add('btn-login');
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBeltonNavbar);
  } else {
    initBeltonNavbar();
  }

  window.initBeltonNavbar = initBeltonNavbar;
})();
