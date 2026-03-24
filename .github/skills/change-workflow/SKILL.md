---
name: change-workflow
description: "Use when: implementing a requested change end-to-end, updating specification, validating, and completing git/reporting steps in a controlled workflow."
---

# Change Workflow

Use this skill when a user asks for a concrete change and expects the task to be completed end-to-end.

## Default mode
- Default: Safe mode (branch + PR)
- Fast mode: only with explicit approval or exceptional urgency

## Required sequence
1. Update `docs/specification.md` first or in the same change set.
2. Implement the requested change with minimal scope.
3. For visible UI changes, provide a local review link and wait for `ok` / `ei ok` when practical.
4. Run targeted validation.
5. Complete git actions according to the chosen mode.
6. Report: what changed, files, validation, risks, rollback, commit SHA, deploy status if applicable.

## Definition of done
- Spec updated
- Change implemented
- Validation completed
- Git actions completed for selected mode
- User received concise report
