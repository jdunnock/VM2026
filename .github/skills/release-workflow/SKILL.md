---
name: release-workflow
description: "Use when: preparing a release, production push, deployment verification, post-deploy smoke checks, and rollback planning."
---

# Release Workflow

## Steps
1. Freeze release scope.
2. Validate critical paths.
3. Prepare release notes / tag / deployment inputs.
4. Deploy and observe status to completion.
5. Run post-deploy smoke checks.
6. Confirm rollback path.

## Minimum report
- What changed
- User impact
- Validation result
- Deploy result
- Rollback plan
