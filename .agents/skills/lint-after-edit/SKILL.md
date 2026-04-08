---
name: lint-after-edit
description: Enforces running ESLint and TypeScript build after every code modification in this repository. Apply after any file edit — including single-line fixes, refactors, and new features — to catch errors before reporting completion.
license: MIT
metadata:
  author: explooosion
  version: "1.1.0"
---

# Lint & Build After Edit

Mandatory lint and build check workflow for the rtttl-hub repository. Ensures all code modifications pass ESLint **and** TypeScript compilation before being considered complete.

## When to Apply

Apply **after every code modification**, including:

- Single-line or multi-line edits
- New components or utilities
- Refactors and renames
- Dependency or import changes

No exceptions.

## Required Steps

### Step 1 — Run lint

```bash
npm run lint
```

Execute from workspace root: `/Users/robby/Desktop/repo/rtttl-player`

### Step 2 — Run build

```bash
npm run build
```

Execute from workspace root: `/Users/robby/Desktop/repo/rtttl-player`

### Step 3 — Handle results

| Step  | Result                    | Action                                                                 |
| ----- | ------------------------- | ---------------------------------------------------------------------- |
| lint  | Exit code `0` (pass)      | Proceed to build                                                       |
| lint  | Exit code non-zero (fail) | Fix all errors, re-run lint, confirm pass before proceeding            |
| build | Exit code `0` (pass)      | Report completion normally                                             |
| build | Exit code non-zero (fail) | Fix all TypeScript errors, re-run build, confirm pass before finishing |

## Fix Guidelines

| Error Type                     | Fix                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| Unused variable                | Prefix with `_` or remove                                                                  |
| Empty `catch` block            | Add `// ignore` comment                                                                    |
| `setState` in `useEffect` body | Add `// eslint-disable-next-line react-hooks/set-state-in-effect` with brief justification |
| TypeScript type error          | Fix the root cause; update types rather than casting to `unknown` or `any`                 |
| Missing import                 | Add the correct import; verify the export exists in the source module                      |
| Any other error                | Fix the root cause; do not silence with `eslint-disable` unless genuinely inapplicable     |

## Rules

- Never deliver code that has lint or build errors.
- Only use `// eslint-disable` comments as a last resort; always explain why in a comment.
- Re-run both lint and build after every fix to confirm the output is clean.
