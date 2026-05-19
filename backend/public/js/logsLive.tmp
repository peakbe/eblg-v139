// ======================================================
// LOGS LIVE — VERSION PRO+ v150
// ======================================================

import { ENDPOINTS } from "./config.js";

const IS_DEV = location.hostname.includes("localhost");
const log = (...a) => IS_DEV && console.log("[LIVE]", ...a);
const logErr = (...a) => console.error("[LIVE ERROR]", ...a);

let liveLogs = [];
let panel = null;

export function startLiveLogs() {
    panel = document.getElementById("logs-live");
    if (!panel) {
        logErr("Panel #logs-live introuvable");
        return;
    }

    probeAll();
    setInterval(probeAll, 5000);
}

function probeAll() {
    probe("METAR", ENDPOINTS.metar);
    probe("TAF", ENDPOINTS.taf);
    probe("FIDS", ENDPOINTS.fids);
    probe("SONO", ENDPOINTS.sonometers);
}

async function probe(name, url) {
    const t0 = performance.now();

    try {
        const res = await fetch(url);
        const dt = Math.round(performance.now() - t0);

        if (!res.ok) {
            addLiveLog("error", `${name} → ERR (${dt} ms)`);
            return;
        }

        const json = await res.json();

        if (json.fallback) {
            addLiveLog("warn", `${name} → fallback (${dt} ms)`);
        } else {
            addLiveLog("ok", `${name} → OK (${dt} ms)`);
        }

    } catch (err) {
        addLiveLog("error", `${name} → erreur`);
    }
}

function addLiveLog(status, message) {
    liveLogs.unshift({
        status,
        message,
        time: new Date().toLocaleTimeString()
    });

    if (liveLogs.length > 40) liveLogs.pop();
    renderLiveLogs();
}

function renderLiveLogs() {
    if (!panel) return;

    panel.innerHTML = liveLogs.map(log => `
        <div class="log-live-entry log-live-${log.status}">
            <span class="log-live-time">${log.time}</span>
            ${log.message}
        </div>
    `).join("");

    panel.scrollTop = 0;
}
