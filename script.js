// City configurations
const cityConfig = {
    la_fresh: {
        name: "Los Angeles (Freshwater)",
        thresholds: { low: 0.6, medium: 0.85 },
        colors: { green: '#4CAF50', yellow: '#FFC107', red: '#F44336' },
        flowRate: 8 // liters per minute
    },
    cape_town_recycled: {
        name: "Cape Town (Recycled)",
        thresholds: { low: 0.5, medium: 0.7 },
        colors: { green: '#87CEEB', yellow: '#FFA07A', red: '#DC143C' },
        flowRate: 6
    },
    dubai_desalinated: {
        name: "Dubai (Desalinated)",
        thresholds: { low: 0.7, medium: 0.9 },
        colors: { green: '#90EE90', yellow: '#FFD700', red: '#B22222' },
        flowRate: 7
    },
    singapore_newater: {
        name: "Singapore (NEWater)",
        thresholds: { low: 0.65, medium: 0.8 },
        colors: { green: '#7FFFD4', yellow: '#FFD700', red: '#FF6347' },
        flowRate: 5
    },
    barcelona: {
        name: "Barcelona (Tap Water)",
        thresholds: { low: 0.55, medium: 0.75 },
        colors: { green: '#4CAF50', yellow: '#FFC107', red: '#F44336' },
        flowRate: 6
    },
    mataro: {
        name: "Mataró (Recycled)",
        thresholds: { low: 0.5, medium: 0.7 },
        colors: { green: '#87CEEB', yellow: '#FFA07A', red: '#DC143C' },
        flowRate: 5
    },
    custom: {
        name: "Custom Configuration",
        thresholds: { low: 0.6, medium: 0.85 },
        colors: { green: '#4CAF50', yellow: '#FFC107', red: '#F44336' },
        flowRate: 7
    }
};

// Default settings if none exist
const defaultSettings = {
    dailyWaterLimit: 50, // liters
    dailyTimeLimit: 10, // minutes
    waterCost: 0.003, // $ per liter
    alertSound: true,
    theme: 'light',
    aiEnabled: true,
    aiSensitivity: 'normal',
    cityConfigKey: 'la_fresh'
};

// Initialize settings from localStorage or use defaults
let settings = JSON.parse(localStorage.getItem('settings')) || {
    ...defaultSettings,
    waterMedian: 50 // Add default water median value
};

// Shower session variables
let isRunning = false;
let startTime;
let timerInterval;
let currentWaterUsage = 0;
let waterFlowRate = cityConfig[settings.cityConfigKey || 'la_fresh'].flowRate;

// DOM Elements
const showerLight = document.querySelector('.shower-light');
const timeDisplay = document.getElementById('timeDisplay');
const waterDisplay = document.getElementById('waterDisplay');
const costDisplay = document.getElementById('costDisplay');
const limitBar = document.getElementById('limitBar');
const limitText = document.getElementById('limitText');
const alertBox = document.getElementById('alertBox');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const dailyChartCtx = document.getElementById('dailyChart').getContext('2d');

// Initialize daily usage data
let dailyUsage;
const storedUsage = JSON.parse(localStorage.getItem('dailyUsage'));
const today = new Date().toDateString();

if (!storedUsage || storedUsage.date !== today) {
    dailyUsage = {
        date: today,
        sessions: [],
        totalWater: 0,
        totalTime: 0,
        predictions: [],
        anomalies: []
    };
    localStorage.setItem('dailyUsage', JSON.stringify(dailyUsage));
} else {
    dailyUsage = storedUsage;
}

// Initialize chart
let dailyChart = new Chart(dailyChartCtx, {
    type: 'line',
    data: {
        labels: Array(24).fill().map((_, i) => `${i}:00`),
        datasets: [{
            label: 'Water Usage (L)',
            data: Array(24).fill(0),
            borderColor: '#009688',
            tension: 0.1,
            fill: true
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                suggestedMax: 100 // Set reasonable max for both actual and predicted values
            }
        },
        interaction: {
            intersect: false,
            mode: 'index'
        },
        plugins: {
            tooltip: {
                enabled: true
            }
        }
    }
});

// Update chart with today's data
function updateChart() {
    const hourlyUsage = Array(24).fill(0);
    dailyUsage.sessions.forEach(session => {
        const hour = new Date(session.startTime).getHours();
        hourlyUsage[hour] += session.waterUsed;
    });
    dailyChart.data.datasets[0].data = hourlyUsage;
    
    // Add prediction line if AI enabled
    if (settings.aiEnabled && dailyUsage.predictions.length) {
        if (!dailyChart.data.datasets[1]) {
            dailyChart.data.datasets.push({
                label: 'Predicted Usage',
                data: dailyUsage.predictions,
                borderColor: '#FF9800',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false
            });
        } else {
            dailyChart.data.datasets[1].data = dailyUsage.predictions;
        }
    }
    
    dailyChart.update();
}

// AI Prediction Functions
function calculatePredictions() {
    if (!settings.aiEnabled) return;
    
    // Simple linear regression based on last 7 days
    const history = getWeeklyHistory();
    if (history.length < 3) return; // Not enough data
    
    const sumX = history.reduce((a, b, i) => a + i, 0);
    const sumY = history.reduce((a, b) => a + b, 0);
    const sumXY = history.reduce((a, b, i) => a + (i * b), 0);
    const sumXX = history.reduce((a, b, i) => a + (i * i), 0);
    const n = history.length;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Predict next 3 days
    const predictions = [];
    for (let i = 0; i < 3; i++) {
        predictions.push(Math.max(5, Math.min(100, 
            intercept + slope * (n + i))).toFixed(1));
    }
    
    dailyUsage.predictions = predictions;
    localStorage.setItem('dailyUsage', JSON.stringify(dailyUsage));
    updateAIDisplay();
}

function detectAnomalies() {
    if (!settings.aiEnabled) return;
    
    const history = getWeeklyHistory();
    if (history.length < 3) return;
    
    const avg = history.reduce((a, b) => a + b, 0) / history.length;
    const stdDev = Math.sqrt(
        history.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / history.length
    );
    
    const sensitivityMap = {
        conservative: 3,
        normal: 2,
        aggressive: 1.5
    };
    const threshold = avg + (sensitivityMap[settings.aiSensitivity] * stdDev);
    
    const currentUsage = dailyUsage.totalWater;
    if (currentUsage > threshold) {
        dailyUsage.anomalies.push({
            date: new Date(),
            usage: currentUsage,
            threshold: threshold
        });
        showAnomalyAlert();
    }
}

function getWeeklyHistory() {
    const history = [];
    const today = new Date();
    
    for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toDateString();
        
        const dayData = JSON.parse(localStorage.getItem(`usage_${dateStr}`));
        if (dayData) {
            history.push(dayData.totalWater);
        }
    }
    
    return history;
}

function updateAIDisplay() {
    if (!settings.aiEnabled) return;
    
    // Update prediction display
    if (dailyUsage.predictions.length) {
        document.getElementById('predictionDisplay').textContent = 
            `${dailyUsage.predictions[0]} L`;
        document.getElementById('recommendationText').textContent = 
            generateRecommendation();
    }
    
    // Update anomaly alert
    if (dailyUsage.anomalies.length) {
        document.getElementById('anomalyAlert').classList.remove('hidden');
    }
}

function generateRecommendation() {
    const avg = getWeeklyHistory().reduce((a, b) => a + b, 0) / 7;
    const current = dailyUsage.totalWater;
    const diff = current - avg;
    
    if (diff > 5) {
        const reduction = (diff * 0.7).toFixed(1);
        const savings = (diff * settings.waterCost * 30).toFixed(2);
        return `Try reducing usage by ${reduction}L/day to save $${savings}/month`;
    }
    return "Your usage is within optimal range!";
}

function showAnomalyAlert() {
    const alert = document.getElementById('anomalyAlert');
    if (!alert) return;
    
    alert.classList.remove('hidden');
    if (settings.alertSound) {
        new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3').play();
    }
    
    setTimeout(() => {
        alert.classList.add('hidden');
    }, 10000);
}

// Start shower session
function startShower() {
    if (isRunning) return;
    
    isRunning = true;
    startTime = new Date();
    currentWaterUsage = 0;
    
    timerInterval = setInterval(updateDisplay, 1000);
    showerLight.classList.remove('bg-red-500', 'bg-yellow-500');
    showerLight.classList.add('bg-green-500');
    
    startBtn.disabled = true;
    stopBtn.disabled = false;
}

// Stop shower session
function stopShower() {
    if (!isRunning) return;
    
    clearInterval(timerInterval);
    isRunning = false;
    
    // Save session data
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000 / 60; // in minutes
    const waterUsed = duration * waterFlowRate;
    
    dailyUsage.sessions.push({
        startTime: startTime,
        endTime: endTime,
        duration: duration,
        waterUsed: waterUsed
    });
    
    dailyUsage.totalTime += duration;
    dailyUsage.totalWater += waterUsed;
    localStorage.setItem('dailyUsage', JSON.stringify(dailyUsage));
    
    updateChart();
    updateLimitDisplay();
    showerLight.classList.remove('bg-green-500');
    
    // Update AI insights after new session data
    if (settings.aiEnabled) {
        calculatePredictions();
        detectAnomalies();
        updateAIDisplay();
    }
    
    startBtn.disabled = false;
    stopBtn.disabled = true;
}

// Update the display every second
function updateDisplay() {
    const currentTime = new Date();
    const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    
    currentWaterUsage = minutes * waterFlowRate + (seconds / 60) * waterFlowRate;
    
    // Update displays
    timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    waterDisplay.textContent = `${currentWaterUsage.toFixed(1)} L`;
    costDisplay.textContent = `$${(currentWaterUsage * settings.waterCost).toFixed(2)}`;
    
    // Update shower light color based on usage
    const medianRatio = currentWaterUsage / settings.waterMedian;
    const config = cityConfig[settings.cityConfigKey || 'la_fresh'];
    if (medianRatio > 1.2) {  // 20% above median -> red
        showerLight.style.backgroundColor = config.colors.red;
        if (!alertBox.classList.contains('alert-pulse')) {
            alertBox.classList.remove('hidden');
            alertBox.classList.add('alert-pulse');
            if (settings.alertSound) {
                new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3').play();
            }
        }
    } else if (medianRatio > 1) {  // Above median -> yellow
        showerLight.style.backgroundColor = config.colors.yellow;
        alertBox.classList.add('hidden');
        alertBox.classList.remove('alert-pulse');
    } else {
        showerLight.style.backgroundColor = config.colors.green;
        alertBox.classList.add('hidden');
        alertBox.classList.remove('alert-pulse');
    }
    
    updateLimitDisplay();
}

// Update the daily limit display
function updateLimitDisplay() {
    const percentage = Math.min((dailyUsage.totalWater / settings.dailyWaterLimit) * 100, 100);
    limitBar.style.width = `${percentage}%`;
    limitText.textContent = `${percentage.toFixed(1)}% of daily limit used`;
}

// Event Listeners
// Reset daily usage data
document.getElementById('resetDaily')?.addEventListener('click', () => {
    if (confirm('Reset today\'s water usage tracking?')) {
        dailyUsage = {
            date: new Date().toDateString(),
            sessions: [],
            totalWater: 0,
            totalTime: 0,
            predictions: [],
            anomalies: []
        };
        updateDisplay();
        updateChart();
        updateLimitDisplay();
        if (settings.aiEnabled) {
            calculatePredictions();
            detectAnomalies();
            updateAIDisplay();
        }
        localStorage.setItem('dailyUsage', JSON.stringify(dailyUsage));
    }
});

startBtn.addEventListener('click', startShower);
stopBtn.addEventListener('click', stopShower);

// Initialize display
updateLimitDisplay();
updateChart();

// Initialize AI features
if (settings.aiEnabled) {
    calculatePredictions();
    detectAnomalies();
    updateAIDisplay();
}
