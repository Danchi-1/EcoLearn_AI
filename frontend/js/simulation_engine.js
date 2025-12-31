document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    const user = localStorage.getItem('ecoUser');
    if (!user) {
        window.location.href = '/login';
        return;
    }

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
        // Crisis Check (Every 5 days)
        if (gameDay % 5 === 0) {
            checkCrisis();
        }
        updateResourceUI();
    }

    function checkCrisis() {
        // Pollution Crisis
        if (resources['pollution'] > 100) {
            triggerCrisis("Toxic Smog Alert! Pollution is too high!");
            resources['score'] -= 50; // Punishment
        }

        // Bankruptcy Crisis
        // Check for any currency < 0
        for (const [key, val] of Object.entries(resources)) {
            if (val < 0 && key !== 'score' && key !== 'pollution') {
                triggerCrisis(`Bankruptcy Warning! You are out of ${key}!`);
                resources['score'] -= 10;
            }
        }
    }

    function triggerCrisis(msg) {
        // Visual Feedback
        const originalBg = document.body.style.backgroundColor;
        document.body.style.backgroundColor = '#ffcccc'; // Flash Red
        setTimeout(() => {
            document.body.style.backgroundColor = originalBg;
        }, 500);

        // Alert text (maybe replace title temporarily)
        const oldTitle = titleEl.textContent;
        titleEl.textContent = "⚠️ " + msg;
        titleEl.style.color = "red";

        setTimeout(() => {
            titleEl.textContent = oldTitle;
            titleEl.style.color = "black";
        }, 3000);
    }
});

// === CHAT LOGIC ===
const chatModal = document.getElementById('chat-modal');
const chatBtn = document.getElementById('ai-chat-btn');
const closeChat = document.getElementById('close-chat');
const sendChat = document.getElementById('send-chat');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

if (chatBtn && chatModal) {
    chatBtn.addEventListener('click', () => {
        chatModal.style.display = 'flex';
    });

    closeChat.addEventListener('click', () => {
        chatModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === chatModal) {
            chatModal.style.display = 'none';
        }
    });

    sendChat.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Add User Message
    addMessage(text, 'user');
    chatInput.value = '';

    // Show loading
    const loadingId = addMessage('Thinking...', 'ai');

    try {
        const res = await fetch(`${API_BASE_URL}/api/simulation/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: text,
                config: config // 'config' is global in this file
            })
        });

        const data = await res.json();

        // Remove loading
        document.getElementById(loadingId).remove();

        // Add AI Response
        addMessage(data.reply || "I am silent.", 'ai');

    } catch (err) {
        console.error(err);
        document.getElementById(loadingId).textContent = "Error: " + err.message;
    }
}

function addMessage(text, type) {
    const div = document.createElement('div');
    const id = 'msg-' + Date.now();
    div.id = id;
    div.className = `message ${type}`;
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return id;
}
