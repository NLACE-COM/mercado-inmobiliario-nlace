---
name: spec-kit
description: Spec-driven development workflow for projects using GitHub Spec Kit and Specify CLI. Use when asked to initialize Spec Kit in a repository, run `specify` commands (`init`, `check`), execute or guide `/speckit.*` slash-command phases (`constitution`, `specify`, `plan`, `tasks`, `implement`), troubleshoot Spec Kit setup, or adapt feature requests into a spec-first implementation flow.
---

# Spec Kit Workflow

## Overview

Use this skill to drive feature delivery with Spec Kit from setup to implementation.
Prioritize a spec-first sequence: principles -> product spec -> technical plan -> tasks -> implementation.

## Quick Setup

1. Verify prerequisites:
   - `git --version`
   - `uv --version` (recommended install path for Specify CLI)
2. Install Specify CLI (persistent install):
   - `uv tool install specify-cli --from git+https://github.com/github/spec-kit.git`
3. Initialize repository for Codex:
   - New directory: `specify init <project-name> --ai codex`
   - Existing directory: `specify init . --ai codex` or `specify init --here --ai codex`
4. Validate environment:
   - `specify check`

If `uv` is unavailable, explain the blocker and provide the one-time execution option:
- `uvx --from git+https://github.com/github/spec-kit.git specify init <project-name> --ai codex`

## Execution Flow

Follow these phases in order unless the user explicitly requests a partial flow.

1. Constitution
   - Run `/speckit.constitution` to define quality, testing, UX, and performance principles.
   - Keep principles testable and non-generic.
2. Product specification
   - Run `/speckit.specify` with user intent focused on what and why.
   - Avoid locking implementation details too early.
3. Technical planning
   - Run `/speckit.plan` with concrete stack, architecture, and constraints.
   - Confirm data model, dependencies, and deployment assumptions.
4. Task decomposition
   - Run `/speckit.tasks` to generate actionable work items.
   - Ensure each task is verifiable.
5. Implementation
   - Run `/speckit.implement` and execute tasks in small, testable increments.

## Request Triage

Use this decision logic:

1. "Instala/activa Spec Kit" requests:
   - Perform CLI install + `specify init` + `specify check`.
2. "Haz una feature con Spec Kit" requests:
   - Run full flow from constitution to implement.
3. "Ya tengo spec/tasks" requests:
   - Resume at the next missing phase only.
4. "No funciona Spec Kit" requests:
   - Run `specify check`, confirm toolchain (`git`, agent CLI), and inspect initialization files.

## Output Expectations

For each phase, report:

- Exact command executed
- Files created or updated
- Validation result (checks/tests)
- Next immediate action

If a phase is skipped, state why it was skipped and what assumptions were made.

## Troubleshooting Checklist

1. `specify` not found:
   - Confirm `uv tool install` completed and PATH includes uv tools.
2. Agent mismatch:
   - Re-run init with `--ai codex` when Codex-specific scaffolding is required.
3. Existing repo conflicts:
   - Use `specify init --here` and only use `--force` when user confirms overwrite intent.
4. Tool checks fail:
   - Run `specify check` and list missing dependencies explicitly.

Keep this skill lightweight; no extra resources are required unless recurring automation scripts are later needed.
