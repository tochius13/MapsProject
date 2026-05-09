/* ==========================================
   locations.js — CSUN Campus Map Quiz
   Defines the 5 quiz locations.

   Each object contains:
     name   — display name shown in the sidebar
     center — lat/lng of the building center (used for map reference)
     bounds — rectangular hit-box (north/south/east/west)
              This box is both drawn on the map AND used to
              check whether the player's double-click was correct.
   ========================================== */

const locations = [
    {
        name: "BookStore",
        center: { lat: 34.2414, lng: -118.5291 },
        bounds: {
            north: 34.2421,
            south: 34.2407,
            east:  -118.5283,
            west:  -118.5299
        }
    },
    {
        name: "Bayramian Hall",
        center: { lat: 34.2434, lng: -118.5306 },
        bounds: {
            north: 34.2441,
            south: 34.2427,
            east:  -118.5297,
            west:  -118.5315
        }
    },
    {
        name: "Jacaranda Hall",
        center: { lat: 34.2399, lng: -118.5273 },
        bounds: {
            north: 34.2405,
            south: 34.2393,
            east:  -118.5265,
            west:  -118.5281
        }
    },
    {
        name: "Manzanita Hall",
        center: { lat: 34.2406, lng: -118.5319 },
        bounds: {
            north: 34.2413,
            south: 34.2399,
            east:  -118.5311,
            west:  -118.5327
        }
    },
    {
        /* Required location specified by instructor */
        name: "Art and Design Center (D6)",
        center: { lat: 34.2447, lng: -118.5267 },
        bounds: {
            north: 34.2454,
            south: 34.2440,
            east:  -118.5259,
            west:  -118.5275
        }
    }
];