document.addEventListener('DOMContentLoaded', () => {
    const chatHistory = document.getElementById('chat-history');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    function appendMessage(text, type) {
        const div = document.createElement('div');
        div.classList.add('message', type);
        div.innerHTML = text; // Allow HTML for simplicity
        chatHistory.appendChild(div);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    async function handleSend() {
        const text = userInput.value.trim();
        if (!text) return;

        // Add User Message
        appendMessage(text, 'user');
        userInput.value = '';

        const useAI = document.getElementById('ai-toggle').checked;

        // Show Loading
        const loadingDiv = document.createElement('div');
        loadingDiv.classList.add('message', 'ai');
        loadingDiv.textContent = useAI ? "Contacting the Supercomputer..." : "Constructing Simulation...";
        chatHistory.appendChild(loadingDiv);

        try {
            const response = await fetch(`${API_BASE_URL}/api/builder/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: text, use_llm: useAI })
            });

            if (!response.ok) {
                throw new Error("AI Generation failed");
            }

            const simData = await response.json();

            // Success!
            loadingDiv.innerHTML = `
                I have created your simulation: <strong>${simData.title}</strong>!<br>
                Saving to your library...
            `;

            // 1. Save to List
            const savedSims = JSON.parse(localStorage.getItem('savedSimulations') || '[]');
            savedSims.push(simData);
            localStorage.setItem('savedSimulations', JSON.stringify(savedSims));

            // 2. Set Current (for immediate play if we wanted, but we go to hub now)
            localStorage.setItem('currentSimulation', JSON.stringify(simData));

            setTimeout(() => {
                // Redirect to Hub so user sees it in the list
                window.location.href = '/hub';
            }, 2000);

        } catch (err) {
            loadingDiv.textContent = "Sorry, I couldn't generate that simulation. Try 'ocean' or 'mars'.";
            console.error(err);
        }
    }

    sendBtn.addEventListener('click', handleSend);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault(); // Prevent newline
            handleSend();
        }
    });
});
