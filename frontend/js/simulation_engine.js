document.addEventListener('DOMContentLoaded', () => {
    // Game State
    let config = null;
    let resources = {};
    let gridState = []; // 2D array storing placed entities
    let gameDay = 1;

    // UI Elements
    const titleEl = document.getElementById('sim-title');
    const descEl = document.getElementById('sim-desc');
    const gridEl = document.getElementById('game-grid');
    const entityListEl = document.getElementById('entity-list');
    const resourcesDisplayEl = document.getElementById('resources-display');
    const dayEl = document.getElementById('game-day');
    const infoEl = document.getElementById('entity-info');

    // Load Simulation
    const urlParams = new URLSearchParams(window.location.search);
    const useLocal = urlParams.get('source') === 'local';

    if (useLocal) {
        try {
            const localData = localStorage.getItem('currentSimulation');
            if (localData) {
                config = JSON.parse(localData);
                initGame();
            } else {
                throw new Error("No local simulation found");
            }
        } catch (e) {
            console.error(e);
            titleEl.textContent = "Error loading local simulation.";
        }
    } else {
        fetch(`${API_BASE_URL}/api/simulation/template`)
            .then(res => res.json())
            .then(data => {
                config = data;
                initGame();
            })
            .catch(err => {
                console.error(err);
                titleEl.textContent = "Error loading simulation.";
            });
    }

    function initGame() {
        // 1. Set Meta Info
        titleEl.textContent = config.title;
        descEl.textContent = config.description;

        // 2. Init Resources
        resources = { ...config.global_resources };
        updateResourceUI();

        // 3. Init Grid
        const width = config.grid.width;
        const height = config.grid.height;
        gridEl.style.gridTemplateColumns = `repeat(${width}, 60px)`;
        gridEl.style.gridTemplateRows = `repeat(${height}, 60px)`;
        gridEl.style.backgroundColor = config.grid.background_color;

        gridState = Array(height).fill().map(() => Array(width).fill(null));

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cell = document.createElement('div');
                cell.classList.add('grid-cell');
                cell.dataset.x = x;
                cell.dataset.y = y;

                // Drag & Drop Events
                cell.addEventListener('dragover', (e) => {
                    e.preventDefault(); // Allow dropping
                    cell.style.borderColor = '#2ecc71';
                    cell.style.borderStyle = 'dashed';
                    cell.style.borderWidth = '2px';
                });

                cell.addEventListener('dragleave', () => {
                    cell.style.border = ''; // Reset border
                });

                cell.addEventListener('drop', (e) => handleDrop(e, x, y, cell));

                // Right-Click to Remove
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    handleRemove(x, y, cell);
                });

                gridEl.appendChild(cell);
            }
        }

        // 4. Init Build Menu (Draggable)
        config.entities.forEach(entity => {
            const btn = document.createElement('div');
            btn.classList.add('entity-btn');
            btn.draggable = true; // Enable Drag
            const costStr = Object.entries(entity.cost)
                .map(([key, val]) => `${val} ${key.charAt(0).toUpperCase() + key.slice(1)}`)
                .join(', ');

            btn.innerHTML = `
                <span style="font-size: 24px;">${entity.icon}</span>
                <div>
                    <strong>${entity.name}</strong><br>
                    <small style="color: #666;">${costStr}</small>
                </div>
            `;

            btn.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', entity.id);
                e.dataTransfer.effectAllowed = 'copy';
                btn.style.opacity = '0.5';
            });

            btn.addEventListener('dragend', () => {
                btn.style.opacity = '1';
            });

            // Hover for Description
            btn.addEventListener('mouseenter', () => {
                if (infoEl) infoEl.textContent = entity.description || "No description available.";
            });
            btn.addEventListener('mouseleave', () => {
                if (infoEl) infoEl.textContent = "Hover over an item to see details.";
            });

            entityListEl.appendChild(btn);
        });

        // 5. Start Game Loop
        setInterval(gameLoop, 1000);
    }

    function updateResourceUI() {
        resourcesDisplayEl.innerHTML = '';
        for (const [key, val] of Object.entries(resources)) {
            const div = document.createElement('div');
            div.classList.add('resource-item');
            const label = key.charAt(0).toUpperCase() + key.slice(1);
            div.innerHTML = `${label}: <span id="res-${key}">${Math.floor(val)}</span>`;

            // Visual feedback for low/negative resources
            if (val < 0) div.style.color = 'red';
            else div.style.color = 'black';

            resourcesDisplayEl.appendChild(div);
        }
    }

    function handleDrop(e, x, y, cellElement) {
        e.preventDefault();
        cellElement.style.border = '';

        const entityId = e.dataTransfer.getData('text/plain');
        if (!entityId) return;

        // Check if occupied
        if (gridState[y][x]) {
            alert("This spot is already engaged!");
            return;
        }

        const entity = config.entities.find(e => e.id === entityId);

        // Check Cost
        for (const [res, amount] of Object.entries(entity.cost)) {
            if ((resources[res] || 0) < amount) {
                alert(`Not enough ${res}! Need ${amount}.`);
                return;
            }
        }

        // Deduct Cost
        for (const [res, amount] of Object.entries(entity.cost)) {
            resources[res] -= amount;
        }

        // Place Entity
        gridState[y][x] = entity;
        cellElement.textContent = entity.icon;

        updateResourceUI();
    }

    function handleRemove(x, y, cellElement) {
        const entity = gridState[y][x];
        if (!entity) return;

        // Remove from state
        gridState[y][x] = null;
        cellElement.textContent = "";

        // Optional: Refund mechanism? 
        // For now, simpler is better. You lose the money if you demolish.

        updateResourceUI();
    }

    function gameLoop() {
        gameDay++;
        dayEl.textContent = gameDay;

        // Iterate through grid and apply effects
        for (let y = 0; y < config.grid.height; y++) {
            for (let x = 0; x < config.grid.width; x++) {
                const entity = gridState[y][x];
                if (entity && entity.effects) {
                    for (const [res, change] of Object.entries(entity.effects)) {
                        if (resources[res] !== undefined) {
                            resources[res] += change;
                        }
                    }
                }
            }
        }
        updateResourceUI();
    }
});
