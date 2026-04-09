---
name: code-style
description: Defines TypeScript/TSX code style rules for this repository. Apply when writing, reviewing, or refactoring any source file — covers import grouping and control flow formatting.
license: MIT
metadata:
  author: explooosion
  version: "1.0.0"
---

# Code Style Rules

Mandatory code style for all TypeScript and TSX source files in this repository.

## When to Apply

Apply **before every code edit or review**, including:

- Writing new components, hooks, utils, or stores
- Refactoring existing code
- Code review or automated fix passes

---

## Rule 1 — Import Grouping

Separate `node_modules` imports and relative path imports with **one blank line**.

### Format

```ts
// 1. External (node_modules) imports
import { useState } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

// 2. Relative imports (one blank line above)
import { MyComponent } from "./my_component";
import { useMyStore } from "../stores/my_store";
```

### Rules

| Rule                   | Requirement                                        |
| ---------------------- | -------------------------------------------------- |
| Order                  | External imports first, relative imports second    |
| Separator              | Exactly one blank line between the two groups      |
| No mixing              | Do not interleave external and relative imports    |
| Module-level constants | Place after all imports, not between import groups |

### Anti-patterns (Forbidden)

```ts
// WRONG — no blank line between groups
import { useState } from "react";
import { MyComponent } from "./my_component";

// WRONG — interleaved
import { useState } from "react";
import { MyComponent } from "./my_component";
import clsx from "clsx";

// WRONG — const between imports
import { useState } from "react";
const BASE = "...";
import clsx from "clsx";
```

---

## Rule 2 — `if` Statement Braces

All `if`, `else if`, and `else` blocks **must** use curly braces `{}`, even when the body is a single statement or `return`.

### Format

```ts
// correct
if (condition) {
  return;
}

if (condition) {
  doSomething();
} else {
  doOther();
}
```

### Rules

| Rule             | Requirement                                                     |
| ---------------- | --------------------------------------------------------------- |
| Braces           | Always required — no exceptions                                 |
| Single-line body | Must expand to multi-line with braces                           |
| `return` only    | Must still use braces                                           |
| Ternary          | Allowed only for simple value assignments, not for control flow |

### Anti-patterns (Forbidden)

```ts
// WRONG — no braces
if (condition) return;

// WRONG — single-line without braces
if (condition) doSomething();

// WRONG — else without braces
if (a) {
  doA();
} else doB();
```
