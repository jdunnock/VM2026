# AI Team

This project uses a curated AI agent team. Mention agents by name to invoke them.

## Team

- **@orchestrator**: coordinating multi-step work, decomposing a large task into specialist subtasks, enforcing checkpoints, or synthesizing results from multiple agents. Invoke for planning, delegation, and quality gates.
- **@implementer**: implementing a concrete code change, fixing a bug, adding a feature, or updating documentation. Specialist for writing and editing code with spec-first discipline and targeted validation.
- **@qa-tester**: writing tests, running smoke checks, validating invariants, verifying lifecycle behavior, or confirming a fix did not introduce regressions. Specialist for test execution and quality verification.
- **@reviewer**: reviewing code for security vulnerabilities, quality issues, regressions, or correctness. Read-only specialist — never modifies files. Use before merge or after implementation.

Start with **@orchestrator** to plan and delegate work to the right specialist.
