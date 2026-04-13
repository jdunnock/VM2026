# AI Team Retro Log

<!-- retro-entry -->
date: 2026-04-13
agent: GitHub Copilot
task: Diagnosed and fixed browser login failures by resolving CORS origin mismatch when Vite ran on localhost:5175.
gaps: Initial diagnosis over-weighted proxy/API health checks before validating browser Origin-specific CORS behavior.
role-confusion: none
improvement: Add a mandatory early check in bug triage: if curl works but browser fails, immediately test with the real Origin header and inspect CORS middleware logs.
reviewed: false
reviewed: true
<!-- /retro-entry -->

<!-- retro-entry -->
date: 2026-04-13
agent: GitHub Copilot
task: Assessed team-level server configuration readiness after the CORS/port mismatch incident and defined concrete capability upgrades.
gaps: Team troubleshooting playbook did not explicitly cover dynamic dev ports, Origin-aware CORS testing, and proxy-vs-API failure separation.
role-confusion: none
improvement: Add a shared "Server Config Readiness" checklist to onboarding and PR validation (CORS origins, proxy target, localhost/loopback variants, non-default Vite ports, browser-origin smoke test).
reviewed: false
reviewed: true
<!-- /retro-entry -->

<!-- retro-entry -->
date: 2026-04-13
agent: GitHub Copilot
task: Enabled reliable mobile-on-LAN testing by fixing dev CORS for private network origins and validating LAN-hosted frontend access.
gaps: Earlier workflow assumed localhost testing paths and did not enforce LAN-origin verification during setup.
role-confusion: none
improvement: Include a mandatory mobile/LAN smoke step in dev startup docs: verify network URL, then test one API request with the exact phone origin.
reviewed: false
reviewed: true
<!-- /retro-entry -->

<!-- retro-entry -->
date: 2026-04-13
agent: GitHub Copilot
task: Enabled admin-only access to Alla tips in Phase B so invited tester submission status can be monitored before tracking phase.
gaps: none
role-confusion: none
improvement: Add one UI acceptance test for phase-gated nav that explicitly covers admin-session overrides in Phase B.
reviewed: false
<!-- /retro-entry -->

<!-- retro-entry -->
date: 2026-04-13
agent: GitHub Copilot
task: Hid the Phase B/C dev toggle when latest simulation command is S-B* to prevent accidental lifecycle overrides during script-driven Phase B QA.
gaps: none
role-confusion: none
improvement: Add a tiny helper in UI state (`isPhaseScriptLocked`) to centralize future script-state-driven visibility rules.
reviewed: false
<!-- /retro-entry -->
