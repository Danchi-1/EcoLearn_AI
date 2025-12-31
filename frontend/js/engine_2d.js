const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const titleEl = document.getElementById('sim-title');
const resourcesEl = document.getElementById('resources-display');
const toolbarEl = document.getElementById('toolbar');

// Game State
let config = null;
let resources = {};
let gridState = []; // 2D array of entities
let mapData = []; // 2D array of terrain (optional, for now just bg color)
let activeTool = null; // ID of entity to build

// Viewport
let tileSize = 64;
let offsetX = 0;
let offsetY = 0;

// Init
function init() {
    // Auth Check
    if (!localStorage.getItem('ecoUser')) {
        window.location.href = '/login';
        return;
    }

    resize();
    window.addEventListener('resize', resize);

    // Load Data
    try {
        const localData = localStorage.getItem('currentSimulation');
        if (localData) {
            config = JSON.parse(localData);
            gameStart();
        } else {
            titleEl.textContent = "No simulation loaded. Go to Hub.";
        }
    } catch (e) {
        console.error(e);
    }
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();
}

function gameStart() {
    titleEl.textContent = config.title;
    resources = { ...config.global_resources };

    // Init Grid
    const w = config.grid.width;
    const h = config.grid.height;
    gridState = Array(h).fill().map(() => Array(w).fill(null));

    // Center the map
    offsetX = (canvas.width - w * tileSize) / 2;
    offsetY = (canvas.height - h * tileSize) / 2;

    createToolbar();
    updateUI();

    // Interaction
    canvas.addEventListener('mousedown', handleInput);

    // Game Loop
    requestAnimationFrame(loop);
}

function createToolbar() {
    toolbarEl.innerHTML = '';

    config.entities.forEach((ent, index) => {
        const btn = document.createElement('div');
        btn.classList.add('tool-btn');
        btn.innerHTML = ent.icon;
        btn.title = `${ent.name} (${ent.description})`;
        btn.onclick = () => {
            // Toggle selection
            if (activeTool === ent) {
                activeTool = null;
                btn.classList.remove('active');
            } else {
                // Clear others
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                activeTool = ent;
                btn.classList.add('active');
            }
        };
        toolbarEl.appendChild(btn);
    });
}

function handleInput(e) {
    if (!activeTool) return; // Only if building

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Convert to Grid Coords
    const gx = Math.floor((mx - offsetX) / tileSize);
    const gy = Math.floor((my - offsetY) / tileSize);

    // Check Bounds
    if (gx >= 0 && gx < config.grid.width && gy >= 0 && gy < config.grid.height) {
        placeEntity(gx, gy);
    }
}

function placeEntity(x, y) {
    if (gridState[y][x]) return; // Occupied

    // Check Cost
    for (const [key, val] of Object.entries(activeTool.cost)) {
        if ((resources[key] || 0) < val) {
            alert(`Not enough ${key}!`);
            return;
        }
    }

    // Pay Cost
    for (const [key, val] of Object.entries(activeTool.cost)) {
        resources[key] -= val;
    }

    // Place
    gridState[y][x] = activeTool;
    updateUI();
}

function updateUI() {
    resourcesEl.innerHTML = '';
    for (const [key, val] of Object.entries(resources)) {
        const span = document.createElement('div');
        span.textContent = `${key.charAt(0).toUpperCase() + key.slice(1)}: ${Math.floor(val)}`;
        span.style.color = '#333';
        span.style.background = '#eee';
        span.style.padding = '5px 10px';
        span.style.borderRadius = '15px';
        resourcesEl.appendChild(span);
    }
}

function loop() {
    draw();
    requestAnimationFrame(loop);
}

function draw() {
    if (!config) return;

    // 1. Clear Background
    ctx.fillStyle = '#1e1e1e'; // Dark outer void
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Map Background
    const w = config.grid.width;
    const h = config.grid.height;

    // Draw Map Base
    ctx.fillStyle = config.grid.background_color;
    ctx.fillRect(offsetX, offsetY, w * tileSize, h * tileSize);

    // 3. Grid Lines & Entities
    ctx.font = `${tileSize * 0.7}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const px = offsetX + x * tileSize;
            const py = offsetY + y * tileSize;

            // Grid Lines
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.strokeRect(px, py, tileSize, tileSize);

            // Entity
            const ent = gridState[y][x];
            if (ent) {
                // Animation: Bobbing effect
                const time = Date.now();
                const bobOffset = Math.sin(time / 200 + (x + y)) * 3; // Offset depends on pos for wave effect

                // Draw Icon
                ctx.fillText(ent.icon, px + tileSize / 2, py + tileSize / 2 + bobOffset);

                // Optional: Shadow
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.beginPath();
                ctx.ellipse(px + tileSize / 2, py + tileSize / 2 + 15, 10 + bobOffset, 4, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff'; // Reset for text (though text color is set by bg usually, default is black/white depending on ctx)
                ctx.fillStyle = 'white'; // Icon color
            }
        }
    }

    // 4. Hover effect (optional) but good for feedback
}

init();
