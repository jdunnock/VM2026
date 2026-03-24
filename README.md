# AI Project Template

This repository is a reusable bootstrap template for new software projects.

Purpose:
- provide one clean starting structure for documentation, prompts, and workflow skills
- avoid duplicate workflow content inside individual product repositories
- speed up initialization of new projects with a repeatable AI-assisted workflow

Principles:
- `.github/skills/` is the canonical source for reusable workflow skills
- `docs/` contains project documentation templates and human-readable bootstrap guides
- new projects should copy or adapt only what they need
- avoid maintaining the same workflow guidance in multiple places

Suggested usage:
1. Create a new repository from this template.
2. Run the init prompt in `.github/prompts/init-project.prompt.md`.
3. Fill `docs/specification.md` from `docs/specification.template.md`.
4. Keep project-specific decisions in the new repo, not here.

Template contents:
- `.github/copilot-instructions.md`
- `.github/prompts/init-project.prompt.md`
- `.github/skills/*/SKILL.md`
- `.github/pull_request_template.md`
- `docs/specification.template.md`
- `docs/NEW_PROJECT_CHECKLIST.md`
