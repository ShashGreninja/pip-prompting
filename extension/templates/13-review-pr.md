---
id: review-pr
name: Review this pull request
trigger: ;review
category: review
context: [page.url, page.title, page.diff]
ask:
  - key: lens
    label: What should the review focus on?
    options: [correctness, security, performance, readability, everything]
---
Review this pull request: "{{page.title}}" ({{page.url}}). Focus on {{ask.lens}}.

```diff
{{page.diff}}
```

For each issue:
- file and line
- severity: blocker, should fix, or nit
- what's wrong and the concrete scenario where it breaks
- a suggested fix

Rules:
- Prioritise real bugs over style. Put nits last, and keep them to five at most.
- Only report problems you can tie to specific lines. If something depends on code not shown, say what you'd need to see.
- End with a one-line verdict: approve, approve with changes, or request changes.
