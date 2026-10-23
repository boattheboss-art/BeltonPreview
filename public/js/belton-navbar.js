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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBeltonNavbar);
  } else {
    initBeltonNavbar();
  }

  window.initBeltonNavbar = initBeltonNavbar;
})();
