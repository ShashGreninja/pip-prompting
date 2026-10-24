---
id: refactor
name: Refactor this code safely
trigger: ;refactor
category: build
context: [page.content]
ask:
  - key: goal
    label: What should improve?
    options: [readability, performance, split into smaller pieces, remove duplication, types]
  - key: keep
    label: What must not change?
    default: public API and behaviour
---
Refactor the code below to improve {{ask.goal}}.

```
{{page.content}}
```

Must not change: {{ask.keep}}.
{{#if profile.preferences}}How I like to work: {{profile.preferences}}{{/if}}

Rules:
- No new dependencies.
- Don't rename things or reformat code that isn't part of this change.
- If a change would alter behaviour, even subtly (ordering, error types, timing), call it out instead of doing it silently.

Output:
1. A short plan of the changes and why each helps.
2. The refactored code.
3. What I should test to confirm nothing broke.
