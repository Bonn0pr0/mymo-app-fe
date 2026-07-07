/**
 * MapScreen.tsx — TypeScript resolution shim.
 * At runtime, Metro/Webpack will pick the platform-specific file:
 *   - MapScreen.native.tsx  → iOS / Android (real Mapbox GL)
 *   - MapScreen.web.tsx     → Web (animated fake map, no native deps)
 *
 * This file is never executed; it only exists so TypeScript can
 * resolve the import in App.tsx without error.
 */
export { default } from './MapScreen.web';
