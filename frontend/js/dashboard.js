document.addEventListener('DOMContentLoaded', () => {
    const userEmail = localStorage.getItem('ecoUser');
    if (!userEmail) {
        window.location.href = '/login';
        return;
    }

    fetch(`${API_BASE_URL}/api/user/${userEmail}`)
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                alert('User not found');
                localStorage.removeItem('ecoUser');
                window.location.href = '/login';
            } else {
                document.getElementById('user-name').textContent = data.name;
                document.getElementById('user-role').textContent = data.role;
            }
        })
        .catch(() => {
            alert('Error fetching user data.');
            localStorage.removeItem('ecoUser');
            window.location.href = '/login';
        });

    document.getElementById('logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('ecoUser');
        window.location.href = '/login';
    });

    window.addEventListener('load', () => {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('dashboard-content').style.display = 'flex';
    });
});
