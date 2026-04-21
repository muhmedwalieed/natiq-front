const BASE_URL = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

/**
 * Turn relative API paths (/uploads/...) into absolute URLs for <audio>, <img>, etc.
 */
export function resolveMediaUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    if (!BASE_URL) return path;
    return `${BASE_URL}${path}`;
}
