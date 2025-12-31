document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    const user = localStorage.getItem('ecoUser');
    if (!user) {
        window.location.href = '/login';
        return;
    }

    const grid = document.getElementById('sim-grid');

    function renderSims() {
        const savedSims = JSON.parse(localStorage.getItem('savedSimulations') || '[]');

        // Remove existing custom cards (keeping the official one which is static HTML)
        const existingCustom = grid.querySelectorAll('.sim-card[data-custom="true"]');
        existingCustom.forEach(el => el.remove());

        if (savedSims.length > 0) {
            savedSims.forEach((sim, index) => {
                const card = document.createElement('div');
                card.classList.add('sim-card');
                card.setAttribute('data-custom', 'true');

                // Random Icon based on title/type
                let icon = 'fas fa-gamepad';
                if (sim.title.toLowerCase().includes('mars')) icon = 'fas fa-rocket';
                if (sim.title.toLowerCase().includes('ocean')) icon = 'fas fa-water';
                if (sim.title.toLowerCase().includes('forest')) icon = 'fas fa-tree';

                card.innerHTML = `
                    <div class="sim-img-fallback"><i class="${icon}"></i></div>
                    <div class="sim-content">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <h3 class="sim-title">${sim.title}</h3>
                            <button class="btn btn-sm delete-btn" data-index="${index}" style="color: #e74c3c; background: transparent; border: none; padding: 0;"><i class="fas fa-trash"></i></button>
                        </div>
                        <p class="sim-desc">${sim.description}</p>
                        <div class="sim-meta">
                            <span class="badge badge-custom">Generated</span>
                            <div style="display: flex; gap: 5px;">
                                <button class="btn btn-outline btn-sm play-btn" data-index="${index}">Play Grid</button>
                                <button class="btn btn-primary btn-sm play-2d-btn" data-index="${index}">Play 2D</button>
                            </div>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        }
    }

    renderSims();

    // Event Delegation
    grid.addEventListener('click', (e) => {
        // Play Button
        if (e.target.classList.contains('play-btn')) {
            const index = e.target.dataset.index;
            const savedSims = JSON.parse(localStorage.getItem('savedSimulations') || '[]');
            const sim = savedSims[index];

            localStorage.setItem('currentSimulation', JSON.stringify(sim));
            window.location.href = '/simulation?source=local';
        }

        // Play 2D Button
        if (e.target.classList.contains('play-2d-btn')) {
            const index = e.target.dataset.index;
            const savedSims = JSON.parse(localStorage.getItem('savedSimulations') || '[]');
            const sim = savedSims[index];

            localStorage.setItem('currentSimulation', JSON.stringify(sim));
            window.location.href = '/simulation_2d';
        }

        // Delete Button (Handle both button and icon click)
        if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
            const btn = e.target.classList.contains('delete-btn') ? e.target : e.target.closest('.delete-btn');
            const index = btn.dataset.index;

            if (confirm("Are you sure you want to delete this simulation?")) {
                const savedSims = JSON.parse(localStorage.getItem('savedSimulations') || '[]');
                savedSims.splice(index, 1);
                localStorage.setItem('savedSimulations', JSON.stringify(savedSims));
                renderSims();
            }
        }
    });
});
