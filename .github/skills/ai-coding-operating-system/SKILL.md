---
name: ai-coding-operating-system
description: "Use when: establishing the default AI-assisted engineering operating model for a repository, including scope control, spec-first work, validation, and reporting discipline."
---

# AI Coding Operating System

This skill defines the default engineering operating model for AI-assisted work.

## Default process
1. Define goal and scope.
2. Update specification before or together with implementation.
3. Make the smallest working change.
4. Run targeted validation.
5. Report changed files, risks, and rollback path.

## Prompt minimum
Always provide:
- Goal
- Constraints
- Acceptance criteria
- Context files

## Merge gate
Before merge, confirm:
- scope is understood
- fix is coherent
- validation was run
- security and maintainability were considered
- documentation was updated when behavior changed

## Modes
- Default: Safe mode
- Fast mode: only for explicitly approved exceptions
