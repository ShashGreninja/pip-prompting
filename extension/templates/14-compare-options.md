---
id: compare-options
name: Compare the options in my open tabs
trigger: ;compare
category: plan
context: [page.tabs]
ask:
  - key: need
    label: What do you need it for?
  - key: criteria
    label: What matters most?
    options: [ease of use, performance, bundle size, pricing, community and maintenance, docs quality]
---
I'm choosing a tool for: {{ask.need}}.

Options I'm considering (from my open tabs):
{{page.tabs}}

My stack: {{profile.stack}}
What matters most: {{ask.criteria}}

Please:
1. Compare them in a table: one row per option, one column per criterion, plus "best for" and "dealbreakers".
2. Recommend one for my situation and say why in three sentences or fewer. Name the runner-up and when I'd pick it instead.
3. List anything you're unsure is still current (versions, pricing, maintenance status) so I can check it.

If an option clearly doesn't fit my stack or need, say so early and drop it from the table.
