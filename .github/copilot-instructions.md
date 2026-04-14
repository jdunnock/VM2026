# AI Team

This project uses a curated AI agent team. Mention agents by name to invoke them.

## Team

- **@orchestrator**: coordinating multi-step work, decomposing a large task into specialist subtasks, enforcing checkpoints, or synthesizing results from multiple agents. Invoke for planning, delegation, and quality gates.
- **@implementer**: implementing a concrete code change, fixing a bug, adding a feature, or updating documentation. Specialist for writing and editing code with spec-first discipline and targeted validation.
- **@qa-tester**: writing tests, running smoke checks, validating invariants, verifying lifecycle behavior, or confirming a fix did not introduce regressions. Specialist for test execution and quality verification.
- **@reviewer**: reviewing code for security vulnerabilities or quality issues. Read-only specialist — never modifies files. For regressions and correctness, use the qa-tester agent. Read-only specialist — never modifies files. Use before merge or after implementation.
- **@language-expert**: generating documentation in a specific language, ensuring linguistic consistency, or preventing errors due to language-related issues. Specialist for language expertise and quality assurance.
- **@commit-and-deploy-engineer**: ensuring smooth deployments, enforcing regular commits, and validating code quality before release.
- **@content-validator**: validating text, reviewing formatting, or sanitizing content.
- **@deployment-coordinator**: coordinating deployments, scheduling downtime, or managing rollbacks. Specialist for ensuring smooth and reliable deployment processes.
- **@deployment-engineer**: deploying applications to production, monitoring deployment status, or troubleshooting deployment issues. Specialist for ensuring smooth and reliable deployments.
- **@senior-ux-designer**: conducting user research, designing user interfaces, testing prototypes, or iterating on designs.

Start with **@orchestrator** to plan and delegate work to the right specialist.
