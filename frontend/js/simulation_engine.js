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

        // 3. Check Intro
        checkIntro();

        // 4. Init Grid
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
            const showInfo = () => {
                if (infoEl) infoEl.textContent = entity.description || "No description available.";
            };

            btn.addEventListener('mouseenter', showInfo);
            btn.addEventListener('touchstart', showInfo); // Mobile Support
            btn.addEventListener('click', showInfo); // Universal Support

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
        // 1. Smog (Level 1: > 50)
        if (resources['pollution'] > 50 && resources['pollution'] <= 100) {
            if (gameDay % 3 === 0) { // Every 3 days warning
                triggerCrisis("Smog Alert! Efficiency dropping.");
            }
            // Mechanic: Reduced Score Gain (simulated by small penalty)
            resources['score'] -= 1;
        }

        // 2. Health Crisis (Level 2: > 100)
        if (resources['pollution'] > 100) {
            triggerCrisis("⚠️ Health Crisis! Medical costs soaring!");
            resources['budget'] -= 100; // Massive Daily Fine
            resources['score'] -= 10;
        }

        // 3. Ecological Collapse (Level 3: > 200)
        if (resources['pollution'] > 200) {
            triggerCrisis("☠️ ECOLOGICAL COLLAPSE! STRUCTURES FAILING!");
            // 10% Chance to destroy a building
            if (Math.random() < 0.1) {
                destroyRandomBuilding();
            }
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

    function destroyRandomBuilding() {
        // Collect all occupied spots
        let occupied = [];
        for (let y = 0; y < config.grid.height; y++) {
            for (let x = 0; x < config.grid.width; x++) {
                if (gridState[y][x]) occupied.push({ x, y });
            }
        }

        if (occupied.length > 0) {
            const target = occupied[Math.floor(Math.random() * occupied.length)];
            const entity = gridState[target.y][target.x];

            // Remove it
            gridState[target.y][target.x] = null;

            // Visual Update in Grid
            const cell = gridEl.querySelector(`div[data-x="${target.x}"][data-y="${target.y}"]`);
            if (cell) {
                cell.textContent = "💥";
                setTimeout(() => { cell.textContent = ""; }, 1000);
            }

            triggerCrisis(`Disaster! ${entity.name} destroyed by pollution!`);
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

    // === INTRO LOGIC ===
    const introModal = document.getElementById('intro-modal');
    const startBtn = document.getElementById('start-game-btn');
    const closeIntro = document.getElementById('close-intro');
    const dontShowBox = document.getElementById('dont-show-again');
    const introTitle = document.getElementById('intro-title');

    function checkIntro() {
        if (!introModal) return;

        const seen = localStorage.getItem('intro_seen');
        if (!seen) {
            introTitle.textContent = config.title || "The Simulation";
            introModal.style.display = 'flex';
        }
    }

    if (startBtn) {
        startBtn.addEventListener('click', closeIntroModal);
    }
    if (closeIntro) {
        closeIntro.addEventListener('click', closeIntroModal);
    }

    function closeIntroModal() {
        if (dontShowBox && dontShowBox.checked) {
            localStorage.setItem('intro_seen', 'true');
        }
        introModal.style.display = 'none';
    }

    // === SAVE/LOAD LOGIC ===
    const saveBtn = document.getElementById('save-btn');
    const loadBtn = document.getElementById('load-btn');
    const loadModal = document.getElementById('load-modal');
    const closeLoad = document.getElementById('close-load');
    const saveList = document.getElementById('save-list');

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const user = localStorage.getItem('ecoUser'); // Is email?
            if (!user) return alert("Please login to save.");

            saveBtn.textContent = "Saving...";

            // Gather state
            const state = {
                grid: gridState, // Entities need to be serialized carefully? 
                // gridState contains objects from config.entities. 
                // JSON.stringify works fine if they are simple objects.
                resources: resources,
                gameDay: gameDay,
                history: [] // Future: Chat history
            };

            try {
                const res = await fetch(`${API_BASE_URL}/api/save`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: user,
                        title: config.title || "Untitled Simulation",
                        config: config,
                        state: state
                    })
                });

                if (res.ok) alert("Game Saved!");
                else alert("Save failed.");
            } catch (e) {
                console.error(e);
                alert("Error saving game.");
            } finally {
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Save';
            }
        });
    }

    if (loadBtn) {
        loadBtn.addEventListener('click', async () => {
            const user = localStorage.getItem('ecoUser');
            if (!user) return alert("Please login to load.");

            loadModal.style.display = 'flex';
            saveList.innerHTML = '<p>Loading saves...</p>';

            try {
                const res = await fetch(`${API_BASE_URL}/api/saves/${user}`);
                const saves = await res.json();

                saveList.innerHTML = '';
                if (saves.length === 0) {
                    saveList.innerHTML = '<p>No saved games found.</p>';
                    return;
                }

                saves.forEach(save => {
                    const div = document.createElement('div');
                    div.style.padding = "10px";
                    div.style.borderBottom = "1px solid #eee";
                    div.style.display = "flex";
                    div.style.justifyContent = "space-between";
                    div.style.alignItems = "center";

                    div.innerHTML = `
                        <div>
                            <strong>${save.title}</strong><br>
                            <small>${new Date(save.date).toLocaleString()}</small>
                        </div>
                        <button class="btn btn-sm btn-primary">Load</button>
                     `;

                    div.querySelector('button').addEventListener('click', () => loadGame(save.id));
                    saveList.appendChild(div);
                });
            } catch (e) {
                saveList.innerHTML = '<p>Error loading saves.</p>';
            }
        });
    }

    if (closeLoad) {
        closeLoad.addEventListener('click', () => {
            loadModal.style.display = 'none';
        });
    }

    async function loadGame(id) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/load/${id}`);
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            // Restore State
            config = data.config;
            const state = data.state;

            resources = state.resources;
            gameDay = state.gameDay || 1;

            // Grid Reconstruction
            // gridState is stored as pure JSON objects. We might need to relink them?
            // Actually, since logic depends on 'config.entities', we just need the IDs or data to match.
            // If we stored the full entity object, it works.
            gridState = state.grid;

            // Re-render
            titleEl.textContent = config.title;
            descEl.textContent = config.description;
            dayEl.textContent = gameDay;
            updateResourceUI();

            // Re-render Grid Visuals
            // Clear Grid first?
            gridEl.innerHTML = '';
            // We need to re-run the grid DOM creation part of initGame, 
            // or just update cells differently.
            // Simplest: Call initGame part again? But initGame creates empty gridState.

            // Custom Re-render:
            const width = config.grid.width;
            const height = config.grid.height;
            gridEl.style.gridTemplateColumns = `repeat(${width}, 60px)`;
            gridEl.style.gridTemplateRows = `repeat(${height}, 60px)`;
            gridEl.style.backgroundColor = config.grid.background_color;

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const cell = document.createElement('div');
                    cell.classList.add('grid-cell');
                    cell.dataset.x = x;
                    cell.dataset.y = y;

                    const entity = gridState[y][x];
                    if (entity) {
                        cell.textContent = entity.icon;
                    }

                    // Re-attach listeners (Duplicate code from initGame... refactor ideally)
                    // For speed, I'll copy the listeners for now or extract.
                    // Copying listeners:
                    cell.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        cell.style.borderColor = '#2ecc71';
                        cell.style.borderStyle = 'dashed'; // ... simplified
                    });
                    cell.addEventListener('drop', (e) => handleDrop(e, x, y, cell));
                    cell.addEventListener('contextmenu', (e) => { e.preventDefault(); handleRemove(x, y, cell); });

                    gridEl.appendChild(cell);
                }
            }

            loadModal.style.display = 'none';
            alert("Game Loaded!");

        } catch (e) {
            console.error(e);
            alert("Failed to load save.");
        }
    }

});

async function loadGame(id) {
    // ... (existing load logic) ...
    // (Just keeping context, this block appends to the end of file)
}

}); // End DOMContentLoaded (Wait, I need to insert BEFORE this closing brace usually, but let's just append handlers inside)

// Correct placement: I will rewrite the logic block to be separate or appended correctly.
// Since the file is long, I should append the new logic inside the main DOMContentLoaded callback or after it if global.
// The previous file view showed the file ends with `});` then Chat Logic.
// I will append the Learning Logic at the very end of the file.

// === LEARNING HUB LOGIC ===
document.addEventListener('DOMContentLoaded', () => {
    const learnBtn = document.getElementById('learn-btn');
    // === INTRO LOGIC ===
    const introModal = document.getElementById('intro-modal');
    const startBtn = document.getElementById('start-game-btn');
    const closeIntro = document.getElementById('close-intro');
    const dontShowBox = document.getElementById('dont-show-again');
    const introTitle = document.getElementById('intro-title');

    function checkIntro() {
        if (!introModal) return;

        const seen = localStorage.getItem('intro_seen');
        if (!seen) {
            introTitle.textContent = config.title || "The Simulation";
            introModal.style.display = 'flex';
        }
    }

    if (startBtn) {
        startBtn.addEventListener('click', closeIntroModal);
    }
    if (closeIntro) {
        closeIntro.addEventListener('click', closeIntroModal);
    }

    function closeIntroModal() {
        if (dontShowBox && dontShowBox.checked) {
            localStorage.setItem('intro_seen', 'true');
        }
        introModal.style.display = 'none';
    }

    // === SAVE/LOAD LOGIC ===
    const saveBtn = document.getElementById('save-btn');
    const loadBtn = document.getElementById('load-btn');
    const loadModal = document.getElementById('load-modal');
    const closeLoad = document.getElementById('close-load');
    const saveList = document.getElementById('save-list');

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const user = localStorage.getItem('ecoUser');
            if (!user) return alert("Please login to save.");
            saveBtn.textContent = "Saving...";
            const state = { grid: gridState, resources: resources, gameDay: gameDay, history: [] };
            try {
                const res = await fetch(`${API_BASE_URL}/api/save`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user, title: config.title || "Untitled Simulation", config: config, state: state })
                });
                if (res.ok) alert("Game Saved!");
                else alert("Save failed.");
            } catch (e) { console.error(e); alert("Error saving game."); }
            finally { saveBtn.innerHTML = '<i class="fas fa-save"></i> Save'; }
        });
    }

    if (loadBtn) {
        loadBtn.addEventListener('click', async () => {
            const user = localStorage.getItem('ecoUser');
            if (!user) return alert("Please login to load.");
            loadModal.style.display = 'flex';
            saveList.innerHTML = '<p>Loading saves...</p>';
            try {
                const res = await fetch(`${API_BASE_URL}/api/saves/${user}`);
                const saves = await res.json();
                saveList.innerHTML = '';
                if (saves.length === 0) { saveList.innerHTML = '<p>No saved games found.</p>'; return; }
                saves.forEach(save => {
                    const div = document.createElement('div');
                    div.style.padding = "10px"; div.style.borderBottom = "1px solid #eee"; div.style.display = "flex"; div.style.justifyContent = "space-between"; div.style.alignItems = "center";
                    div.innerHTML = `<div><strong>${save.title}</strong><br><small>${new Date(save.date).toLocaleString()}</small></div><button class="btn btn-sm btn-primary">Load</button>`;
                    div.querySelector('button').addEventListener('click', () => loadGame(save.id));
                    saveList.appendChild(div);
                });
            } catch (e) { saveList.innerHTML = '<p>Error loading saves.</p>'; }
        });
    }

    if (closeLoad) closeLoad.addEventListener('click', () => { loadModal.style.display = 'none'; });

    async function loadGame(id) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/load/${id}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            config = data.config;
            const state = data.state;
            resources = state.resources;
            gameDay = state.gameDay || 1;
            gridState = state.grid;
            titleEl.textContent = config.title;
            descEl.textContent = config.description;
            dayEl.textContent = gameDay;
            updateResourceUI();

            // Re-render Grid
            const width = config.grid.width;
            const height = config.grid.height;
            gridEl.innerHTML = '';
            gridEl.style.gridTemplateColumns = `repeat(${width}, 60px)`;
            gridEl.style.gridTemplateRows = `repeat(${height}, 60px)`;
            gridEl.style.backgroundColor = config.grid.background_color;
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const cell = document.createElement('div');
                    cell.classList.add('grid-cell');
                    cell.dataset.x = x; cell.dataset.y = y;
                    const entity = gridState[y][x];
                    if (entity) cell.textContent = entity.icon;
                    cell.addEventListener('dragover', (e) => { e.preventDefault(); cell.style.borderColor = '#2ecc71'; cell.style.borderStyle = 'dashed'; });
                    cell.addEventListener('dragleave', () => { cell.style.border = ''; });
                    cell.addEventListener('drop', (e) => handleDrop(e, x, y, cell));
                    cell.addEventListener('contextmenu', (e) => { e.preventDefault(); handleRemove(x, y, cell); });
                    gridEl.appendChild(cell);
                }
            }
            loadModal.style.display = 'none';
            alert("Game Loaded!");
        } catch (e) { console.error(e); alert("Failed to load save."); }
    }

    // === CHAT LOGIC ===
    const chatModal = document.getElementById('chat-modal');
    const chatBtn = document.getElementById('ai-chat-btn');
    const closeChat = document.getElementById('close-chat');
    const sendChat = document.getElementById('send-chat');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    if (chatBtn && chatModal) {
        chatBtn.addEventListener('click', () => chatModal.style.display = 'flex');
        closeChat.addEventListener('click', () => chatModal.style.display = 'none');
        window.addEventListener('click', (e) => { if (e.target === chatModal) chatModal.style.display = 'none'; });
        sendChat.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
    }

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        addMessage(text, 'user');
        chatInput.value = '';
        const loadingId = addMessage('Thinking...', 'ai');
        try {
            const res = await fetch(`${API_BASE_URL}/api/simulation/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, config: config })
            });
            const data = await res.json();
            document.getElementById(loadingId).remove();
            addMessage(data.reply || "I am silent.", 'ai');
        } catch (err) { console.error(err); document.getElementById(loadingId).textContent = "Error: " + err.message; }
    }

    function addMessage(text, type) {
        const div = document.createElement('div');
        div.id = 'msg-' + Date.now();
        div.className = `message ${type}`;
        div.textContent = text;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return div.id;
    }

    // === LEARNING HUB LOGIC ===
    const learnBtn = document.getElementById('learn-btn');
    const learnModal = document.getElementById('learning-modal');
    const closeLearn = document.getElementById('close-learn');
    const topicList = document.getElementById('topic-list');
    const learnMsgs = document.getElementById('learning-messages');
    const learnInput = document.getElementById('learn-input');
    const sendLearn = document.getElementById('send-learn');
    let activeTopic = null;

    if (learnBtn) learnBtn.addEventListener('click', () => { learnModal.style.display = 'flex'; generateTopics(); });
    if (closeLearn) closeLearn.addEventListener('click', () => learnModal.style.display = 'none');

    function generateTopics() {
        topicList.innerHTML = '';
        const topics = [];
        if (resources['pollution'] > 50) topics.push({ title: "Fighting Smog", icon: "🌫️", prompt: "Explain the dangers of smog and how to reduce it." });
        else topics.push({ title: "Preventing Pollution", icon: "🌱", prompt: "How can we grow without polluting?" });

        if (resources['budget'] < 100) topics.push({ title: "Economic Recovery", icon: "📉", prompt: "My budget is low. How do I make money sustainably?" });
        else topics.push({ title: "Green Investment", icon: "💰", prompt: "I have extra budget. What should I invest in?" });

        let factoryCount = 0, natureCount = 0;
        for (let row of gridState) for (let cell of row) if (cell) {
            if (cell.name.includes("Factory") || cell.name.includes("Plant")) factoryCount++;
            if (cell.name.includes("Tree") || cell.name.includes("Nature")) natureCount++;
        }
        if (factoryCount > 5) topics.push({ title: "Industrial Impact", icon: "🏭", prompt: "I have many factories. What is the long term cost?" });
        if (natureCount < 3) topics.push({ title: "Reforestation", icon: "🌲", prompt: "Why are trees important for the ecosystem?" });

        topics.forEach(t => {
            const btn = document.createElement('div');
            btn.className = 'entity-btn';
            btn.style.cursor = 'pointer';
            btn.innerHTML = `<strong>${t.icon} ${t.title}</strong>`;
            btn.addEventListener('click', () => startLesson(t));
            topicList.appendChild(btn);
        });
    }

    async function startLesson(topic) {
        activeTopic = topic.title;
        Array.from(topicList.children).forEach(c => c.style.background = 'white');
        learnMsgs.innerHTML = '';
        addLearnMessage(`topic-system`, `Let's discuss <strong>${topic.title}</strong>.`, 'system');
        await sendLearnMessage(topic.prompt, true);
    }

    async function sendLearnMessage(text, isAuto = false) {
        if (!text) text = learnInput.value.trim();
        if (!text) return;
        if (!isAuto) { addLearnMessage(`u-${Date.now()}`, text, 'user'); learnInput.value = ''; }
        const loadingId = addLearnMessage(`l-${Date.now()}`, "Professor Eco is thinking...", 'ai');
        try {
            const res = await fetch(`${API_BASE_URL}/api/simulation/chat`, { // Re-using chat endpoint for simplicity but ideally new one
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    config: config,
                    current_resources: resources,
                    topic: activeTopic,
                    persona: "Professor"
                })
            });
            const data = await res.json();
            document.getElementById(loadingId).remove();
            addLearnMessage(`ai-${Date.now()}`, data.reply, 'ai');
        } catch (e) { document.getElementById(loadingId).textContent = "Error: " + e.message; }
    }

    if (sendLearn) {
        sendLearn.addEventListener('click', () => sendLearnMessage());
        learnInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendLearnMessage(); });
    }

    function addLearnMessage(id, html, type) {
        const div = document.createElement('div');
        div.id = id; div.className = `message ${type}`; div.innerHTML = html;
        learnMsgs.appendChild(div); learnMsgs.scrollTop = learnMsgs.scrollHeight;
        return id;
    }

}); // END DOMContentLoaded
