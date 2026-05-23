/*----------------------------------
1. Globaler State
----------------------------------*/
let currentToolId = 'cockpit'; // Start-Tool

// Globaler Cockpit-State
window.cockpitState = {
    stocks: [],
    sectors: [],
    industries: [],

    sector: null,
    industry: null,
    ticker: null,
    referenceStock: null,

    breadcrumbs: "Alle Sektoren"
};


/*----------------------------------
2. Imports
----------------------------------*/
import { renderCockpit } from "./js/renderCockpit.js";


/*----------------------------------
3. Navigation (Host-System)
----------------------------------*/
function showTool(toolId) {
    console.log("Wechsle zu:", toolId);

    // Alle Views deaktivieren
    document.querySelectorAll('.tool-iframe').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tool-view').forEach(el => el.classList.remove('active'));

    // Navigation Optik
    document.querySelectorAll('#main-nav a').forEach(link => link.classList.remove('active-link'));
    const activeLink = document.querySelector(`#main-nav a[data-tool="${toolId}"]`);
    if (activeLink) activeLink.classList.add('active-link');

    // Cockpit (native View)
    if (toolId === 'cockpit') {
        document.getElementById('cockpit-ui')?.classList.add('active');
        currentToolId = toolId;
        return;
    }

    // Iframes
    const targetIframe = document.getElementById(`iframe-${toolId}`);
    if (targetIframe) {
        targetIframe.classList.add('active');
        currentToolId = toolId;
    } else {
        console.warn(`Kein Container für Tool-ID "${toolId}" gefunden`);
    }
}


/*----------------------------------
4. UI-Layer
----------------------------------*/
function updateHeaderSystemBadge(badge, text) {
    const el = document.getElementById("header-system-badge");
    if (!el) return;

    el.className = "";
    el.classList.add(`header-badge-${badge}`);
    el.textContent = text;
}


/*----------------------------------
5. Event-Handler
----------------------------------*/
document.addEventListener("click", (e) => {
    if (e.target.id === "header-system-badge") {
        showTool("control");
    }
});


/*----------------------------------
6. Initialisierung
----------------------------------*/
document.addEventListener("DOMContentLoaded", () => {
    console.log("Cockpit Initialisierung gestartet...");

    // System-Status Listener
    window.addEventListener("message", (event) => {
        if (event.data?.type === "system-status-update") {
            updateHeaderSystemBadge(event.data.badge, event.data.text);
        }
    });

    // Geräteerkennung
    fetch('/api/device-info')
        .then(res => res.json())
        .then(data => {
            const logoDiv = document.querySelector('.logo');
            if (!logoDiv) return;

            const deviceInfo = document.createElement('div');
            deviceInfo.id = 'device-status-info';
            deviceInfo.style.color = 'white';
            deviceInfo.style.marginTop = '2px';
            deviceInfo.style.opacity = '0.7';
            deviceInfo.style.textTransform = 'uppercase';

            const mode = data.isLaptop ? 'Mobile Mode' : 'Stationary';
            deviceInfo.innerHTML = `${data.deviceName} | ${mode} <span id="header-system-badge"></span>`;

            logoDiv.appendChild(deviceInfo);
            logoDiv.style.display = 'flex';
            logoDiv.style.flexDirection = 'column';
        });

    // Navigation
    document.querySelectorAll('#main-nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tool = link.getAttribute('data-tool');
            if (tool) showTool(tool);
        });
    });

    // Stocks laden
    fetch('/api/stocks/won-db')
        .then(res => res.json())
        .then(stocks => {
            window.cockpitState = {
                ...window.cockpitState,
                stocks
            };

            // Cockpit initial rendern
            renderCockpit(window.cockpitState);

            // Cockpit als Startansicht aktivieren
            showTool("cockpit");
        });
});
