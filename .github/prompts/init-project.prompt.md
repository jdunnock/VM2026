---
mode: ask
description: Initialize a new project from this template using the existing workflow skills and documentation structure.
---

Initialize this repository as a new software project.

Rules:
- Use `.github/skills/` as the canonical workflow skill source.
- Do not duplicate skill content into `docs/`.
- Create `docs/specification.md` from `docs/specification.template.md`.
- Keep changes minimal and practical.
- Ask for missing product details before finalizing project-specific content.

First collect:
1. Project name
2. One-sentence goal
3. Main user/problem
4. In scope
5. Out of scope
6. Tech stack
7. Deploy target
8. Default workflow mode: Safe or Fast
9. Required quality gates
10. Any language/copy requirements

Then do this:
1. Create or update `docs/specification.md`
2. Review `.github/copilot-instructions.md` for project fit
3. Keep only relevant skills in `.github/skills/`
4. Remove or avoid duplicate workflow content
5. Summarize:
   - created/updated files
   - assumptions made
   - open questions
   - recommended next step

Constraints:
- Do not invent business requirements.
- Do not create duplicate workflow documents.
- Prefer one clear source of truth over multiple partial templates.
