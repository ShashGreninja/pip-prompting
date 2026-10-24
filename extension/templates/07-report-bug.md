---
id: report-bug
name: Describe a bug (no error message)
trigger: ;bug
category: debug
context: [page.url, page.screenshot]
ask:
  - key: actual
    label: What happens?
  - key: expected
    label: What should happen?
  - key: steps
    label: How do you make it happen?
---
I have a bug with no error message.

- What happens: {{ask.actual}}
- What should happen: {{ask.expected}}
- Steps to reproduce: {{ask.steps}}
{{#if page.url}}- Where: {{page.url}} (screenshot attached){{/if}}
- Stack: {{profile.stack}}

Help me debug it methodically:
1. Ask me up to 3 questions that would narrow it down the most (e.g. does it always happen, when did it start, which browser/data).
2. Suggest where to add logging or breakpoints to confirm what's going on, and what each would tell us.
3. After I report back, explain the cause and give a minimal fix.

Don't guess a fix before we've confirmed the cause.
