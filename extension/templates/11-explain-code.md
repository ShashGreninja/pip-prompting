---
id: explain-code
name: Explain this code
trigger: ;explain
category: understand
context: [page.url, page.content]
ask:
  - key: level
    label: Your familiarity
    options: [new to this codebase, new to this language, new to programming]
  - key: why
    label: What do you need to do with it?
---
Explain the code below. I'm {{ask.level}}, and I need to understand it so I can {{ask.why}}.

{{#if page.url}}Source: {{page.url}}{{/if}}

```
{{page.content}}
```

Structure the explanation as:
1. One paragraph: what this code is for and where it fits.
2. The flow: what happens step by step when it runs.
3. The non-obvious parts: tricky lines, hidden assumptions, side effects.
4. What I should know before changing it for my goal, and where the change would most likely go.

Use plain language. Define any term I might not know the first time you use it. Don't restate the code line by line.
