// ======================================================
// RUNWAYS PRO+++ — EBLG Cockpit IFR
// - Géométrie précise RWY 04/22
// - Heading calculé automatiquement
// - Vecteurs piste + normales pré-calculés
// - Helpers pour corridor bruit & affichage
// ======================================================

// Coordonnées seuils (lat, lon) — EBLG
const THR_22 = [50.63302, 5.46163]; // seuil 22 (SE)
const THR_04 = [50.64594, 5.44321]; // seuil 04 (NW)

// ------------------------------------------------------
// Utils géométrie
// ------------------------------------------------------
function toRad(d) {
    return d * Math.PI / 180;
}

function toDeg(r) {
    return r * 180 / Math.PI;
}

// Heading géométrique (0–360) entre deux points lat/lon
function computeHeading(from, to) {
    const [lat1, lon1] = from.map(toRad);
    const [lat2, lon2] = to.map(toRad);

    const dLon = lon2 - lon1;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    let brng = toDeg(Math.atan2(y, x));
    brng = (brng + 360) % 360;
    return brng;
}

// Vecteur piste normalisé (plan approximatif lat/lon)
function computeUnitVector(from, to) {
    const dx = to[1] - from[1]; // lon
    const dy = to[0] - from[0]; // lat
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { ux: dx / len, uy: dy / len };
}

// Vecteur normal (gauche/droite) à la piste
function computeNormals(ux, uy) {
    return {
        left:  { nx: -uy, ny: ux },
        right: { nx:  uy, ny: -ux }
    };
}

// ------------------------------------------------------
// Export principal
// ------------------------------------------------------
const heading_22 = computeHeading(THR_22, THR_04); // ~040°
const heading_04 = (heading_22 + 180) % 360;       // ~220°

const vec_22 = computeUnitVector(THR_22, THR_04);
const normals_22 = computeNormals(vec_22.ux, vec_22.uy);

export const RUNWAYS = {
    "22": {
        id: "22",
        start: THR_22,          // seuil 22
        end: THR_04,            // seuil 04
        heading: heading_22,    // ~40°
        length_m: 3690,
        unit: vec_22,           // vecteur piste (22→04)
        normals: normals_22
    },
    "04": {
        id: "04",
        start: THR_04,          // seuil 04
        end: THR_22,            // seuil 22
        heading: heading_04,    // ~220°
        length_m: 3690,
        unit: { ux: -vec_22.ux, uy: -vec_22.uy }, // inverse
        normals: normals_22
    }
};

// ------------------------------------------------------
// Helpers pour la carte / corridor
// ------------------------------------------------------
export function getRunway(runwayId) {
    return RUNWAYS[runwayId] || null;
}

export function getRunwayFromWind(windDir) {
    if (windDir == null) return null;
    const diff = (a, b) => {
        let d = Math.abs(a - b);
        if (d > 180) d = 360 - d;
        return d;
    };

    const d22 = diff(windDir, RUNWAYS["22"].heading);
    const d04 = diff(windDir, RUNWAYS["04"].heading);

    return d22 <= d04 ? RUNWAYS["22"] : RUNWAYS["04"];
}

export function computeCrosswind(windDir, windSpeed, rwyHeading) {
    if (windDir == null || windSpeed == null || rwyHeading == null) {
        return { crosswind: 0, headwind: 0 };
    }

    const angle = toRad(windDir - rwyHeading);
    const headwind = Math.round(windSpeed * Math.cos(angle));
    const crosswind = Math.round(windSpeed * Math.sin(angle));

    return { crosswind, headwind };
}
// ======================================================
// WIND COMPONENTS — PRO+++
// ======================================================
export function computeWindComponents(windDir, windSpeed, runwayHeading) {
    if (windDir == null || windSpeed == null) {
        return { headwind: 0, crosswind: 0 };
    }

    // Angle entre vent et axe piste
    const angle = ((windDir - runwayHeading + 360) % 360);
    const rad = angle * Math.PI / 180;

    const headwind = Math.round(windSpeed * Math.cos(rad));
    const crosswind = Math.round(windSpeed * Math.sin(rad));

    return { headwind, crosswind };
}
