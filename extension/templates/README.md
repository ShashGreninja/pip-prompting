# Prompt templates

Each template is one Markdown file: YAML frontmatter describing what to collect, then the prompt body.

**The one rule:** a template only ever produces text. The extension reads context, fills the template, and places the finished prompt in the user's chat box (or clipboard). It never sends it and never does the task.

## Frontmatter

| Field      | Meaning |
|------------|---------|
| `id`       | Stable identifier, kebab-case. |
| `name`     | What the user sees in the avatar's menu. |
| `trigger`  | Text-expansion shortcut (used later by the desktop app). |
| `category` | `build`, `debug`, `understand`, `review`, `plan` or `write`. |
| `context`  | Page context the extension gathers automatically (see below). |
| `ask`      | Up to 3 quick questions the avatar asks. `options` turns one into chips; `default` pre-fills it. |

## Slots

Use `{{slot}}` in the body. A line or `{{#if slot}}…{{/if}}` block whose `page.*` or `profile.*` slot is empty is removed, so templates degrade gracefully when context is missing. An empty `ask.*` slot instead becomes a visible `[Question label]` placeholder, so the user sees what to fill in before sending.

To add a template, drop a new `.md` file here and list it in `index.json`.

| Slot                  | Filled by |
|-----------------------|-----------|
| `page.url`, `page.title` | Current tab. |
| `page.content`        | Selected text if any, otherwise the page's main readable text (trimmed to a budget). |
| `page.screenshot`     | Visible-area or selected-element capture, attached as an image (the body just refers to it). |
| `page.design_tokens`  | Computed fonts, colors, radii and spacing pulled from the page's CSS. |
| `page.console_errors` | Recent errors and stack traces captured from the tab. |
| `page.diff`           | Diff of a GitHub/GitLab PR page. |
| `page.tabs`           | Titles and URLs of the other tabs in this window. |
| `profile.stack`       | User's saved stack, e.g. "Next.js 15, Tailwind, Postgres". |
| `profile.preferences` | User's saved working style, e.g. "small diffs, explain briefly". |
| `profile.test_framework` | User's usual test framework, e.g. "Vitest". |
| `ask.<key>`           | Answers to the template's quick questions. |

## Writing style for templates

- State the goal, the context, the constraints and the output format. Every template has all four.
- Tell the model what *not* to do where people commonly get burned (guessing APIs, suppressing errors, unrelated refactors).
- Invite one round of clarifying questions instead of guessing.
- Keep it short. A template is a strong default the user can edit, not an essay.
