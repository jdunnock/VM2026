---
name: Bugfix Workflow
description: "Use when: a bug, regression, or failing flow needs root-cause analysis, minimal correction, targeted validation, and rollback-aware reporting."
---

# Bugfix Workflow

## Steps
1. Reproduce or define the failing behavior clearly.
2. Confirm root cause before changing code.
3. Fix with the smallest defensible change.
4. Run targeted validation.
5. Update the project specification file changelog when behavior or operational understanding changes.
6. Report root cause, fix, validation, risks, and rollback.

## Done when
- Root cause identified
- Fix validated
- No known critical regression introduced
