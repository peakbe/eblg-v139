// ======================================================
// FIDS — PRO+++
// - Chargement sécurisé
// - Séparation Arrivées / Départs
// - Tri automatique ETA / ETD
// - Couleurs ATC cockpit
// - UI harmonisée IFR
// ======================================================

import { ENDPOINTS } from "./config.js";
import { fetchJSON, updateStatusPanel } from "./helpers.js";

const IS_DEV = location.hostname.includes("localhost");
const log = (...a) => IS_DEV && console.log("[FIDS]", ...a);
const logErr = (...a) => console.error("[FIDS ERROR]", ...a);

// ------------------------------------------------------
// API PUBLIC — appelée par app.js
// ------------------------------------------------------
export async function safeLoadFids() {
    try {
        const data = await fetchJSON(ENDPOINTS.fids);

        if (!data || (!data.arrivals && !data.departures)) {
            updateStatusPanel("FIDS", { error: true });
            renderFids([], []);
            return;
        }

        const arr = normalizeFlights(data.arrivals || []);
        const dep = normalizeFlights(data.departures || []);

        renderFids(arr, dep);

        updateStatusPanel("FIDS", { ok: true });
        log("FIDS chargé :", arr.length, "arrivées,", dep.length, "départs");

    } catch (err) {
        logErr("Erreur FIDS", err);
        updateStatusPanel("FIDS", { error: true });
        renderFids([], []);
    }
}

// ------------------------------------------------------
// Normalisation PRO+++
// ------------------------------------------------------
function normalizeFlights(list) {
    return list.map(f => ({
        flight: f.flight || "N/A",
        from: f.from || null,
        to: f.to || null,
        eta: f.eta ? new Date(f.eta) : null,
        etd: f.etd ? new Date(f.etd) : null,
        status: f.status || "UNKNOWN"
    }));
}

// ------------------------------------------------------
// Tri PRO+++
// ------------------------------------------------------
function sortArrivals(list) {
    return list.sort((a, b) => {
        const ta = a.eta ? a.eta.getTime() : Infinity;
        const tb = b.eta ? b.eta.getTime() : Infinity;
        return ta - tb;
    });
}

function sortDepartures(list) {
    return list.sort((a, b) => {
        const ta = a.etd ? a.etd.getTime() : Infinity;
        const tb = b.etd ? b.etd.getTime() : Infinity;
        return ta - tb;
    });
}

// ------------------------------------------------------
// Couleurs ATC PRO+++
// ------------------------------------------------------
function getStatusColor(status) {
    status = status.toUpperCase();

    if (status.includes("BOARD")) return "dodgerblue";
    if (status.includes("DELAY")) return "orange";
    if (status.includes("CANCEL")) return "red";
    if (status.includes("LAND")) return "limegreen";
    if (status.includes("TIME")) return "white";

    return "gray";
}

// ------------------------------------------------------
// Formatage heure cockpit
// ------------------------------------------------------
function fmt(t) {
    if (!t) return "--:--";
    return t.toISOString().substring(11, 16); // HH:MM
}

// ------------------------------------------------------
// Rendu principal
// ------------------------------------------------------
function renderFids(arrivals, departures) {
    const arrBox = document.getElementById("fids-arrivals");
    const depBox = document.getElementById("fids-departures");

    if (!arrBox || !depBox) return;

    // tri
    arrivals = sortArrivals(arrivals);
    departures = sortDepartures(departures);

    // rendu
    arrBox.innerHTML = `
        <h3>Arrivées</h3>
        ${arrivals.length ? arrivals.map(renderArrival).join("") : `<div class="fids-empty">Aucun vol</div>`}
    `;

    depBox.innerHTML = `
        <h3>Départs</h3>
        ${departures.length ? departures.map(renderDeparture).join("") : `<div class="fids-empty">Aucun vol</div>`}
    `;
}

// ------------------------------------------------------
// Rendu Arrivée
// ------------------------------------------------------
function renderArrival(f) {
    return `
        <div class="fids-row">
            <span class="fids-flight">${f.flight}</span>
            <span class="fids-city">${f.from || "--"}</span>
            <span class="fids-time">${fmt(f.eta)}</span>
            <span class="fids-status" style="color:${getStatusColor(f.status)}">${f.status}</span>
        </div>
    `;
}

// ------------------------------------------------------
// Rendu Départ
// ------------------------------------------------------
function renderDeparture(f) {
    return `
        <div class="fids-row">
            <span class="fids-flight">${f.flight}</span>
            <span class="fids-city">${f.to || "--"}</span>
            <span class="fids-time">${fmt(f.etd)}</span>
            <span class="fids-status" style="color:${getStatusColor(f.status)}">${f.status}</span>
        </div>
    `;
}
