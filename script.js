console.log("Le fichier script.js est bien chargé !");
const apiKey = '056f09891fba36b31cdfe5dc41fc5376';

const cityInput = document.getElementById('city-input');
const searchForm = document.getElementById('search-form');
const cityNameEl = document.getElementById('city-name');
const tempEl = document.getElementById('temperature');
const descEl = document.getElementById('description');
const iconEl = document.getElementById('weather-icon');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind-speed');
const pressureEl = document.getElementById('pressure');
const hourlyContainer = document.getElementById('hourly-forecast');
const dailyContainer = document.getElementById('daily-forecast');
const alertsContainer = document.getElementById('weather-alerts');
const toggleUnitBtn = document.getElementById('toggle-unit');
const toggleThemeBtn = document.getElementById('toggle-theme');

// Ajout d'une référence au canvas du graphique
const chartContainer = document.getElementById('chart-container');
const temperatureChartCanvas = document.getElementById('temperatureChart');
let myChart; // Variable pour stocker l'instance du graphique

let currentUnit = 'metric';

function getWeatherIconClass(weatherCode) {
    const icons = {
        '01d': 'wi-day-sunny',       // Ciel dégagé (jour)
        '01n': 'wi-night-clear',     // Ciel dégagé (nuit)
        '02d': 'wi-day-cloudy',      // Quelques nuages (jour)
        '02n': 'wi-night-alt-cloudy',// Quelques nuages (nuit)
        '03d': 'wi-cloud',           // Nuages épars
        '03n': 'wi-cloud',           // Nuages épars
        '04d': 'wi-cloudy',          // Nuageux
        '04n': 'wi-cloudy',          // Nuageux
        '09d': 'wi-showers',         // Averses (pluie)
        '09n': 'wi-showers',         // Averses (pluie)
        '10d': 'wi-day-rain',        // Pluie (jour)
        '10n': 'wi-night-alt-rain',  // Pluie (nuit)
        '11d': 'wi-thunderstorm',    // Orage
        '11n': 'wi-thunderstorm',    // Orage
        '13d': 'wi-day-snow',        // Neige (jour)
        '13n': 'wi-night-alt-snow',  // Neige (nuit)
        '50d': 'wi-fog',             // Brouillard (jour)
        '50n': 'wi-fog',             // Brouillard (nuit)
    };
    return icons[weatherCode] || 'wi-cloud-refresh';
}

async function fetchWeather(city) {
    try {
        const [currentRes, forecastRes] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${currentUnit}&lang=fr`),
            fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${currentUnit}&lang=fr`)
        ]);

        if (!currentRes.ok) throw new Error('Ville non trouvée');
        if (!forecastRes.ok) throw new Error('Prévisions non trouvées');

        const [currentData, forecastData] = await Promise.all([
            currentRes.json(),
            forecastRes.json()
        ]);

        displayCurrentWeather(currentData);
        displayHourlyForecast(forecastData);
        displayDailyForecast(forecastData);
        
        const alerts = (currentData.name.toLowerCase() === 'tanger') ? 
            [{ event: 'Vent fort', description: 'Des vents violents sont attendus dans les prochaines heures.' }] : [];
        displayWeatherAlerts(alerts);

    } catch (error) {
        displayError(error.message);
        console.error('Erreur:', error);
    }
}

async function fetchWeatherByCoords(lat, lon) {
    try {
        const [currentRes, forecastRes] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${currentUnit}&lang=fr`),
            fetch(`https://api.openweathermap.com/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${currentUnit}&lang=fr`)
        ]);

        if (!currentRes.ok || !forecastRes.ok) throw new Error('Données non trouvées');

        const [currentData, forecastData] = await Promise.all([
            currentRes.json(),
            forecastRes.json()
        ]);
        
        displayCurrentWeather(currentData);
        displayHourlyForecast(forecastData);
        displayDailyForecast(forecastData);
        displayWeatherAlerts([]);

    } catch (error) {
        displayError("Impossible de trouver la météo pour votre position.");
        console.error('Erreur:', error);
    }
}

function displayCurrentWeather(data) {
    cityNameEl.textContent = `${data.name}, ${data.sys.country}`;
    tempEl.textContent = `${Math.round(data.main.temp)}°${currentUnit === 'metric' ? 'C' : 'F'}`;
    descEl.textContent = data.weather[0].description;
    
    const iconClass = getWeatherIconClass(data.weather[0].icon);
    iconEl.className = 'wi ' + iconClass;
    iconEl.alt = data.weather[0].description;

    humidityEl.innerHTML = `<i class="wi wi-humidity"></i> Humidité : <span>${data.main.humidity}%</span>`;
    windEl.innerHTML = `<i class="wi wi-strong-wind"></i> Vent : <span>${Math.round(data.wind.speed)} m/s</span>`;
    pressureEl.innerHTML = `<i class="wi wi-barometer"></i> Pression : <span>${data.main.pressure} hPa</span>`;
    
    updateBackgroundByWeather(data.weather[0].main);
}

function displayHourlyForecast(data) {
    hourlyContainer.innerHTML = ''; 
    for (let i = 0; i < 8; i++) {
        const item = data.list[i];
        const date = new Date(item.dt * 1000);
        const hour = date.getHours();
        const hourStr = `${hour}h`;
        const temp = Math.round(item.main.temp);
        
        const windSpeed = item.wind.speed;
        const pressure = item.main.pressure;
        const humidity = item.main.humidity;
        
        const iconClass = getWeatherIconClass(item.weather[0].icon);

        const card = document.createElement('div');
        card.classList.add('forecast-card');

        card.innerHTML = `
            <div class="main-info">
                <p>${hourStr}</p>
                <i class="wi ${iconClass}"></i>
                <p>${temp}°${currentUnit === 'metric' ? 'C' : 'F'}</p>
            </div>
            <div class="details-info">
                <p><i class="wi wi-strong-wind"></i> <span>${Math.round(windSpeed)} m/s</span></p>
                <p><i class="wi wi-barometer"></i> <span>${pressure} hPa</span></p>
                <p><i class="wi wi-humidity"></i> <span>${humidity}%</span></p>
            </div>
        `;
        hourlyContainer.appendChild(card);
    }
}

function displayDailyForecast(data) {
    dailyContainer.innerHTML = '';
    const daysMap = new Map();

    data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayStr = date.toLocaleDateString('fr-FR', { weekday: 'long' });
        if (!daysMap.has(dayStr)) {
            daysMap.set(dayStr, {
                temps: [],
                winds: [],
                pressures: [],
                humidities: [],
                icon: item.weather[0].icon,
                description: item.weather[0].description
            });
        }
        daysMap.get(dayStr).temps.push(item.main.temp);
        daysMap.get(dayStr).winds.push(item.wind.speed);
        daysMap.get(dayStr).pressures.push(item.main.pressure);
        daysMap.get(dayStr).humidities.push(item.main.humidity);
    });

    const chartLabels = [];
    const chartTemperatures = [];

    Array.from(daysMap.entries()).slice(0, 5).forEach(([day, dayData]) => {
        const avgTemp = Math.round(dayData.temps.reduce((a, b) => a + b, 0) / dayData.temps.length);
        const minTemp = Math.round(Math.min(...dayData.temps));
        const maxTemp = Math.round(Math.max(...dayData.temps));
        const avgWind = Math.round(dayData.winds.reduce((a, b) => a + b, 0) / dayData.winds.length);
        const avgPressure = Math.round(dayData.pressures.reduce((a, b) => a + b, 0) / dayData.pressures.length);
        const avgHumidity = Math.round(dayData.humidities.reduce((a, b) => a + b, 0) / dayData.humidities.length);

        const iconClass = getWeatherIconClass(dayData.icon);

        const card = document.createElement('div');
        card.classList.add('forecast-card');

        card.innerHTML = `
            <div class="main-info">
                <p>${day.charAt(0).toUpperCase() + day.slice(1)}</p>
                <i class="wi ${iconClass}"></i>
                <p>${avgTemp}°${currentUnit === 'metric' ? 'C' : 'F'}</p>
            </div>
            <div class="details-info">
                <p>Min: <span>${minTemp}°${currentUnit === 'metric' ? 'C' : 'F'}</span></p>
                <p>Max: <span>${maxTemp}°${currentUnit === 'metric' ? 'C' : 'F'}</span></p>
                <p><i class="wi wi-strong-wind"></i> <span>${avgWind} m/s</span></p>
                <p><i class="wi wi-humidity"></i> <span>${avgHumidity}%</span></p>
            </div>
        `;

        dailyContainer.appendChild(card);
        chartLabels.push(day.charAt(0).toUpperCase() + day.slice(1));
        chartTemperatures.push(maxTemp);
    });
    
    // Appel de la fonction pour créer le graphique après avoir récupéré les données
    createTemperatureChart(chartLabels, chartTemperatures);
}

// --- Nouvelle fonction pour créer le graphique ---
// Fonction pour créer le graphique de température
function createTemperatureChart(labels, temperatures) {
    if (myChart) {
        myChart.destroy(); // Détruit le graphique précédent s'il existe
    }

    if (chartContainer) {
      chartContainer.style.display = 'block';
    }

    const ctx = temperatureChartCanvas.getContext('2d');
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Température Max (°${currentUnit === 'metric' ? 'C' : 'F'})`,
                data: temperatures,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true, // Rendre le graphique responsive
            maintainAspectRatio: false, // Permet au graphique de ne pas maintenir son ratio d'aspect, ce qui est crucial pour la responsivité
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}
// --- Fin de la nouvelle fonction ---

function displayWeatherAlerts(alerts) {
    if (!alertsContainer) return;
    const alertSound = document.getElementById('alert-sound');
    alertsContainer.innerHTML = '';
    alertsContainer.style.display = 'none';

    if (alerts.length === 0) {
        return;
    }

    alerts.forEach(alert => {
        alertsContainer.innerHTML = `<h4>⚠️ ${alert.event}</h4><p>${alert.description}</p>`;
    });
    
    alertsContainer.style.display = 'block';

    if (alertSound) {
        alertSound.currentTime = 0;
        alertSound.play().catch(err => {
            console.warn("Le son n'a pas pu être joué automatiquement :", err);
        });
    }
}

function displayError(message) {
    alertsContainer.innerHTML = `<h4>Erreur</h4><p>${message}</p>`;
    alertsContainer.style.display = 'block';
    alertsContainer.classList.add('alert-active');
    const alertSound = document.getElementById('alert-sound');
    if (alertSound) {
        alertSound.currentTime = 0;
        alertSound.play().catch(err => console.warn("Erreur de lecture du son:", err));
    }
}

function updateBackgroundByWeather(mainWeather) {
    const body = document.body;
    body.removeAttribute('data-weather');

    if (/rain|drizzle|thunderstorm/i.test(mainWeather)) {
        body.setAttribute('data-weather', 'rain');
    } else if (/clear/i.test(mainWeather)) {
        body.setAttribute('data-weather', 'clear');
    } else if (/clouds/i.test(mainWeather)) {
        body.setAttribute('data-weather', 'clouds');
    } else if (/snow/i.test(mainWeather)) {
        body.setAttribute('data-weather', 'snow');
    } else {
        body.setAttribute('data-weather', 'default');
    }
}

searchForm.addEventListener('submit', e => {
    e.preventDefault();
    const city = cityInput.value.trim();
    if (city) {
        fetchWeather(city);
    }
});

if (toggleUnitBtn) {
    toggleUnitBtn.addEventListener('click', () => {
        currentUnit = currentUnit === 'metric' ? 'imperial' : 'metric';
        const city = cityNameEl.textContent.split(',')[0];
        if (city) {
            fetchWeather(city);
        }
    });
}

if (toggleThemeBtn) {
    toggleThemeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const themeIcon = toggleThemeBtn.querySelector('i');
        if (document.body.classList.contains('dark-mode')) {
            themeIcon.className = 'bx bxs-sun';
        } else {
            themeIcon.className = 'bx bxs-moon';
        }
    });
}

window.addEventListener('load', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
        }, () => {
            fetchWeather('Casablanca');
        });
    } else {
        fetchWeather('Casablanca');
    }
});

// 056f09891fba36b31cdfe5dc41fc5376 
//api.openweathermap.org/data/2.5/weather?q=Casablanca&appid=056f09891fba36b31cdfe5dc41fc5376&units=metric&lang=fr
//api.openweathermap.org/data/2.5/forecast?q=Casablanca&appid=056f09891fba36b31cdfe5dc41fc5376&units=metric&lang=fr 

