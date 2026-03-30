/*----------------------------------
1. Globaler State
----------------------------------*/
let currentToolId = 'dashboard'; // Start-Tool (entspricht deiner index.html active)


/*----------------------------------
2. Data-Layer
----------------------------------*/


/*----------------------------------
3. Navigation (Optimiert für alle Tools)
----------------------------------*/
function showTool(toolId) {
    console.log("Wechsle zu:", toolId);
    
    // 1. Alle Container (Iframes & Native Views) deaktivieren
    document.querySelectorAll('.tool-iframe').forEach(iframe => {
        iframe.classList.remove('active');
    });
    document.querySelectorAll('.tool-view').forEach(view => {
        view.classList.remove('active');
    });

    // --- NEU: Navigation Optik umschalten ---
    // Entferne die 'active-link' Klasse von allen Nav-Links
    document.querySelectorAll('#main-nav a').forEach(link => {
        link.classList.remove('active-link');
    });

    // Suche den Link, der das Attribut data-tool="toolId" hat und markiere ihn
    const activeLink = document.querySelector(`#main-nav a[data-tool="${toolId}"]`);
    if (activeLink) {
        activeLink.classList.add('active-link');
    }
    // ----------------------------------------

    // 2. Spezialfall: Natives Cockpit UI
    if (toolId === 'cockpit') {
        const cockpitUI = document.getElementById('cockpit-ui');
        if (cockpitUI) cockpitUI.classList.add('active');
        currentToolId = toolId;
        return;
    }

    // 3. Standardfall: Iframes
    const targetIframe = document.getElementById(`iframe-${toolId}`);
    if (targetIframe) {
        targetIframe.classList.add('active');
        currentToolId = toolId;
    } else {
        console.warn(`Kein Container für Tool-ID "${toolId}" gefunden (ID: iframe-${toolId})`);
    }
}

/*----------------------------------
4. UI-Layer (Rendering)
----------------------------------*/

/*----------------------------------
5. Controller
----------------------------------*/


/*----------------------------------
6. Event-Handler
----------------------------------*/


/*----------------------------------
7. Initialisierung
----------------------------------*/
document.addEventListener("DOMContentLoaded", () => {
    console.log("Cockpit Initialisierung gestartet...");

    // Navigation – EventListener für alle Menüpunkte
    document.querySelectorAll('#main-nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tool = link.getAttribute('data-tool'); // Holt z.B. "new-dashboard"
            if (tool) showTool(tool);
        });
    });

    // Daten für das native Cockpit-UI laden
    syncUI();
});