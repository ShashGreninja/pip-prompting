---
id: fix-console-error
name: Fix this console error
trigger: ;err
category: debug
context: [page.console_errors, page.url]
ask:
  - key: doing
    label: What were you doing when it happened?
  - key: expected
    label: What should have happened?
---
I'm getting this error in the browser on {{page.url}}:

```
{{page.console_errors}}
```

What I was doing: {{ask.doing}}
What should have happened: {{ask.expected}}
My stack: {{profile.stack}}

Please find the root cause before suggesting a fix:
1. Explain in plain words what the error means.
2. List the most likely causes, ranked, and what in my code would confirm or rule out each one. Ask me for the specific files you need.
3. Once the cause is clear, give the smallest fix that addresses it.

Don't silence the error (try/catch that swallows it, optional chaining everywhere, disabling the check) unless you explain why that's actually correct here.
