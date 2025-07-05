const Backend_URL = 'https://ecolearnai-production.up.railway.app';

// Wait for full page load
window.addEventListener('load', () => {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.classList.add('fade-out');
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 1000);
    }
});

// Show dashboard preview on homepage if logged in
window.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('ecoUser');
    const dashboardSection = document.getElementById('dashboard');

    if (isLoggedIn && dashboardSection) {
        dashboardSection.style.display = 'block';
    }

    // Hide nav-auth buttons if logged in
    const authBtns = document.getElementById('nav-auth');
    if (isLoggedIn && authBtns) {
        authBtns.style.display = 'none';
    }

    // Setup logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (isLoggedIn && logoutBtn) {
        logoutBtn.style.display = 'block';
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('ecoUser');
            location.reload(); // Reset UI after logout
        });
    }

    // Nav button redirects
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');

    loginBtn?.addEventListener('click', () => window.location.href = '/login');
    signupBtn?.addEventListener('click', () => window.location.href = '/signup');

    const dashboardLink = document.getElementById('dashboard-link');
    dashboardLink?.addEventListener('click', (e) => {
        e.preventDefault();
        const user = localStorage.getItem('ecoUser');
        window.location.href = user ? '/dashboard' : '/login';
    });
});

// Signup handler
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    const res = await fetch(`${Backend_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();
    if (res.ok) {
        alert(data.message);
        localStorage.setItem('ecoUser', email);
        window.location.href = '/dashboard';
    } else {
        alert(data.error);
    }
});

// Login handler
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const res = await fetch(`${Backend_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
        alert(data.message);
        localStorage.setItem('ecoUser', email);
        window.location.href = '/dashboard';
    } else {
        alert(data.error || 'Login failed');
    }
});
