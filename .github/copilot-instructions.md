# Copilot Instructions

Use this repository as a project bootstrap template.

Always:
- update specification before or together with behavior changes — NEVER defer spec updates to a later step
- prefer one source of truth over duplicate workflow files
- keep changes minimal and explicit
- validate before commit when code or behavior changes
- report changed files, validation result, risks, and rollback path

Documentation model:
- `.github/skills/` = reusable workflow skills
- `docs/specification.md` = project-specific product and architecture truth
- `.github/pull_request_template.md` = reporting format for changes

Do not:
- create duplicate workflow guidance in `docs/` and `.github/skills/`
- mix project-specific product decisions into reusable template skills
- expand scope without explicit approval
