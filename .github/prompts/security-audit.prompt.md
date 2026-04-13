---
mode: agent
description: Audit code for security vulnerabilities, focusing on OWASP Top 10 and project-specific risk areas.
---

Perform a security audit on the following scope:

**Scope:** $SCOPE_DESCRIPTION

**Focus areas:**
- Input validation and sanitization
- Authentication and authorization
- Injection risks (SQL, command, path traversal)
- Sensitive data exposure
- Insecure defaults or configurations
- $PROJECT_SPECIFIC_FOCUS

**Expected output format:**
- Findings grouped as: BLOCKER / WARNING / SUGGESTION
- Each finding: location, description, recommended fix
- Final verdict: pass / fail with summary

**Constraints:**
- Read-only — do not modify files
- Flag only real vulnerabilities, not style preferences
- Reference OWASP Top 10 where applicable

**Context files:**
- $CONTEXT_FILE_1
