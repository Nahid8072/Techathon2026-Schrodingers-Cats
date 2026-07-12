# Kernel — Functional Nav, Auth & Fan Fix

## 1. Fan rotation bug (FloorMap)

Currently blades use `transformBox: fill-box` on nested `<g>`s, so each blade rotates around its own bounding-box center instead of the fan hub. In SVG, `transform-origin` on a `<g>` doesn't compute reliably against `fill-box` for path shapes.

**Fix:** Since each fan is already translated to its hub via `transform="translate(x,y)"`, the blade group's local origin `(0,0)` IS the hub. Rotate a single `<g>` containing all three blades around `0 0` using SMIL `<animateTransform>` (frame-perfect, no CSS origin quirks), and keep the motor housing circles OUTSIDE the rotating group so the hub stays still.

```tsx
<g> {/* stationary hub */}
  <circle r={9} fill="#3a2a20" />
  <circle r={4} fill="#1a1310" />
</g>
<g> {/* rotating blades — origin is 0,0 = hub */}
  {on && (
    <animateTransform attributeName="transform" type="rotate"
      from="0 0 0" to="360 0 0" dur="1.6s" repeatCount="indefinite" />
  )}
  <path d="M0,-8 C 14,-24 40,-16 46,-4 C 34,-4 18,-2 6,-2 Z" ... />
  <path ... transform="rotate(120)" />
  <path ... transform="rotate(240)" />
</g>
```

No visual/size/position change. Removes the broken `animate-fan-spin` CSS usage on this component (keyframes stay in `styles.css` for other uses).

## 2. Functional routes

Add real pages under `src/routes/` so the sidebar links stop 404'ing. All read from the shared simulation via a new `SimulationProvider` context (lifted from `useSimulation`) so state stays consistent across routes.

- **`/devices`** — Sortable/filterable table of all 15 devices (room filter, type filter, status filter, search). Each row: name, room, type, status pill, power, runtime, last changed, toggle switch (wired to `toggle`). Bulk actions: "Turn off all in room", "Turn off all".
- **`/analytics`** — Larger charts: 24h energy trend (reuses `EnergyTrendChart` full-width), room comparison bar, device-type breakdown (donut), top consumers list, KPI strip (peak, avg, saved).
- **`/alerts`** — Full alerts list (extends `AlertsPanel`) with severity filter tabs (All / High / Medium / Low), acknowledge & dismiss buttons (local state), empty state.
- **`/settings`** — Sections: Profile (name/email inputs, save to localStorage), Preferences (theme toggle light/dark wired to `.dark` class, temperature unit, 24h clock), Office Hours (start/end sliders that feed the alerts rule), Notifications (toggles), Danger zone (reset simulation).

Each route file gets its own `head()` with unique title/description/og tags.

## 3. Login / Logout (local mock)

Since the app has no backend and everything else is client-simulated, use a lightweight local auth mock (no Lovable Cloud). If real accounts are needed later we can swap in Cloud.

- New `AuthContext` (`src/lib/auth.tsx`) — `{ user, login, logout }`, persisted to `localStorage`.
- Any non-empty email + password ≥ 4 chars logs in as `{ email, name }`. Purely demo.
- New `/login` route — centered card, email + password, "Sign in" button, subtle branding. Redirects to `/` on success (or `?redirect=` target).
- Root route wraps children with `AuthProvider`; a small `<RequireAuth>` in `__root.tsx` redirects to `/login` when no user (login route itself excluded).
- Sidebar `Logout` button becomes functional: clears user + navigates to `/login`.
- TopBar profile chip shows the logged-in name/initials.

## 4. Out of scope

- No backend, no real OAuth, no persisted device state across users.
- No changes to FloorMap layout, colors, sizes, positions, or any other existing UI element beyond the fan-blade grouping described above.

## Files

**Edit:** `src/components/kernel/FloorMap.tsx` (fan fix only), `src/components/kernel/Sidebar.tsx` (logout wired), `src/components/kernel/TopBar.tsx` (user chip), `src/routes/__root.tsx` (AuthProvider + SimulationProvider + guard), `src/routes/index.tsx` (consume context instead of local hook).

**Create:** `src/lib/auth.tsx`, `src/lib/simulation-context.tsx`, `src/routes/login.tsx`, `src/routes/devices.tsx`, `src/routes/analytics.tsx`, `src/routes/alerts.tsx`, `src/routes/settings.tsx`.
