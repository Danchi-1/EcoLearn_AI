// Wait for the full page to load
window.addEventListener('load', function () {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.classList.add('fade-out');

        // Remove the element completely after the fade-out
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 1000); // match fade duration
    }
});

window.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('ecoUser'); // Later correct logged in state function
    const dashboardSection = document.getElementById('dashboard');

    if (isLoggedIn && dashboardSection) {
        dashboardSection.style.display = 'block';
    }
});

// Signup handler
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    const res = await fetch('/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();
    if (res.ok) {
        alert(data.message);
        localStorage.setItem('ecoUser', email);
        // Redirect to dashboard
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

    const res = await fetch('/login', {
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

window.addEventListener('DOMContentLoaded', () => {
    let loginBtn = document.getElementById('login-btn');
    let signupBtn = document.getElementById('signup-btn');

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = '/login';
        });
    }
    if (signupBtn) {
        signupBtn.addEventListener('click', () => {
            window.location.href = '/signup';
        });
    }
    document.addEventListener('DOMContentLoaded', () => {
        const user = localStorage.getItem('ecoUser');
        if (user) {
        const authBtns = document.getElementById('nav-auth');
        if (authBtns) authBtns.style.display = 'none';
        }
    });
    document.addEventListener('DOMContentLoaded', () => {
        const user = localStorage.getItem('ecoUser');
        if (user) {
            document.getElementById('nav-auth')?.remove();
            const logoutBtn = document.getElementById('user-logout');
            if (logoutBtn) logoutBtn.style.display = 'block';

            document.getElementById('logout-btn')?.addEventListener('click', () => {
            localStorage.removeItem('ecoUser');
            location.reload(); // refresh to show login/signup again
            });
        }
    });

});

document.addEventListener('DOMContentLoaded', () => {
    const dashboardLink = document.getElementById('dashboard-link');
    if (dashboardLink) {
      dashboardLink.addEventListener('click', (e) => {
        e.preventDefault();
        const user = localStorage.getItem('ecoUser');

        if (user) {
          window.location.href = '/dashboard';
        } else {
          window.location.href = '/login';
        }
      });
    }
});
