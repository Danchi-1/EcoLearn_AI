document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('impactChart').getContext('2d');
    const form = document.getElementById('tracker-form');
    const totalEl = document.getElementById('total-co2');
    const aiBox = document.getElementById('ai-feedback');
    const aiText = document.getElementById('ai-text');
    const statusBadge = document.getElementById('status-badge');

    // Init Chart
    let chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Transport', 'Food', 'Energy', 'Recycling Savings'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Get Values
        const transport = parseFloat(document.getElementById('transport').value) || 0;
        const meat = parseFloat(document.getElementById('meat').value) || 0;
        const energy = parseFloat(document.getElementById('energy').value) || 0;
        const recycling = parseFloat(document.getElementById('recycling').value) || 0;

        // Validation
        if (energy > 24) {
            alert("There are only 24 hours in a day! Please enter a valid number.");
            return;
        }
        if (transport < 0 || meat < 0 || energy < 0 || recycling < 0) {
            alert("Values cannot be negative.");
            return;
        }

        // 2. Calculate CO2 (Rough Estimates)
        // Transport: ~0.15 kg / km
        // Meat: ~3.0 kg / serving
        // Energy: ~0.4 kg / kWh
        // Recycling: -0.5 kg / kg (Credit)

        const co2Transport = transport * 0.15;
        const co2Meat = meat * 3.0;
        const co2Energy = energy * 0.4;
        const co2Recycling = recycling * 0.5; // This is a "saving"

        const totalEmission = (co2Transport + co2Meat + co2Energy) - co2Recycling;

        // 3. Update Chart
        chart.data.datasets[0].data = [co2Transport, co2Meat, co2Energy, co2Recycling];
        chart.update();

        // 4. Update Total Score
        totalEl.textContent = totalEmission.toFixed(1);

        updateStatus(totalEmission);

        // 5. Get AI Feedback
        aiBox.style.display = 'block';
        aiText.textContent = "Analyzing your footprint...";

        try {
            const response = await fetch('/api/tracker/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transport, meat, energy, recycling, total: totalEmission
                })
            });
            const data = await response.json();
            aiText.textContent = data.message;
        } catch (err) {
            console.error(err);
            aiText.textContent = "AI Analysis failed to load.";
        }
    });

    function updateStatus(score) {
        statusBadge.className = '';
        if (score < 5) {
            statusBadge.style.backgroundColor = '#d4edda';
            statusBadge.style.color = '#155724';
            statusBadge.textContent = "Status: Eco Hero 🌱";
        } else if (score < 15) {
            statusBadge.style.backgroundColor = '#fff3cd';
            statusBadge.style.color = '#856404';
            statusBadge.textContent = "Status: Average Citizen 🚶";
        } else {
            statusBadge.style.backgroundColor = '#f8d7da';
            statusBadge.style.color = '#721c24';
            statusBadge.textContent = "Status: High Impact ⚠️";
        }
    }
});
