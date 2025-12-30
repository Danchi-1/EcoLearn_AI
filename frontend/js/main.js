const Backend_URL = 'http://localhost:5000'; // Relative path for local development

// Wait for full page load (fade out loading screen)
window.addEventListener('load', () => {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.classList.add('fade-out');
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 1000);
    }
});

window.addEventListener('DOMContentLoaded', () => {
    const user = localStorage.getItem('ecoUser');

    // Show dashboard section on home page if user is logged in
    const dashboardSection = document.getElementById('dashboard');
    if (user && dashboardSection) {
        dashboardSection.style.display = 'block';
    }

    // Select buttons directly
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutDiv = document.getElementById('user-logout');
    const logoutBtn = document.getElementById('logout-btn');

    if (user) {
        // User is logged in: Hide Login/Signup, Show Logout
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';
        if (logoutDiv) logoutDiv.style.display = 'inline-block';

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('ecoUser');
                window.location.href = '/'; // Redirect to home on logout
            });
        }
    } else {
        // User is logged out: Show Login/Signup, Hide Logout
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (signupBtn) signupBtn.style.display = 'inline-block';
        if (logoutDiv) logoutDiv.style.display = 'none';
    }

    // Handle navigation to login/signup

    if (loginBtn) {
        loginBtn.addEventListener('click', () => window.location.href = '/login');
    }

    if (signupBtn) {
        signupBtn.addEventListener('click', () => window.location.href = '/signup');
    }

    // Redirect dashboard link to dashboard.html only if logged in
    const dashboardLink = document.getElementById('dashboard-link');
    if (dashboardLink) {
        dashboardLink.addEventListener('click', (e) => {
            e.preventDefault();
            const user = localStorage.getItem('ecoUser');
            window.location.href = user ? '/dashboard' : '/login';
        });
    }

    // Signup handler
    document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password')?.value;

        if (!name || !email || !password || !confirmPassword) {
            alert('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        try {
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
                alert(data.error || 'Signup failed');
            }
        } catch (err) {
            alert('Network error');
            console.error(err);
        }
    });

    // Login handler
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            alert('Please enter email and password');
            return;
        }

        try {
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
        } catch (err) {
            alert('Network error');
            console.error(err);
        }
    });

    // Check if user is logged in
    function isLoggedIn() {
        return !!localStorage.getItem('ecoUser');
    }

    const startLearning = document.getElementById('start-learning');
    if (startLearning !== null) {
        startLearning.addEventListener('mouseover', () => {
            startLearning.style.backgroundColor = '#4CAF50'; // Darker green on hover
            startLearning.style.cursor = 'pointer';
        })
        startLearning.addEventListener('click', () => {
            if (isLoggedIn()) {
                window.location.href = '/dashboard';
            } else {
                window.location.href = '/login';
            }
        })
    }
    const testBtn = document.getElementById('test-btn');
    if (testBtn) {
        testBtn.addEventListener('click', () => {
            alert('Test button clicked!');
        });
    }
});
