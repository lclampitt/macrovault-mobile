// Base URL for the FastAPI service that holds the Anthropic key and gates
// AI / usage. Mobile calls this directly per the Phase 10c decision; the
// backend already accepts arbitrary origins so no CORS work is needed.
export const API_BASE = 'https://gainlytics-1.onrender.com';
