---
mode: agent
description: Prepare and execute a production release with preflight validation, deploy, smoke checks, and rollback planning.
---

Prepare a release for the following:

**Version / tag:** $VERSION

**Scope of changes:**
- $CHANGE_1
- $CHANGE_2

**Acceptance criteria:**
- $CRITERION_1

**Preflight checklist:**
- [ ] Tests pass
- [ ] Build succeeds
- [ ] Spec / changelog updated
- [ ] No known critical regressions

**Deploy target:** $DEPLOY_TARGET

**Smoke check steps:**
1. $SMOKE_STEP_1
2. $SMOKE_STEP_2

**Rollback plan:** $ROLLBACK_DESCRIPTION

Follow the release-workflow skill. Freeze scope first. Validate, deploy, run smoke checks, confirm rollback path. Report: what changed, user impact, validation result, deploy result, rollback plan.
