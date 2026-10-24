---
id: upgrade-library
name: Upgrade a library using this migration guide
trigger: ;upgrade
category: plan
context: [page.url, page.content]
ask:
  - key: library
    label: Which library?
  - key: from
    label: Current version
  - key: to
    label: Target version
---
I'm upgrading {{ask.library}} from {{ask.from}} to {{ask.to}}. Here's the official migration guide / changelog ({{page.url}}):

"""
{{page.content}}
"""

My stack: {{profile.stack}}

Please:
1. List the breaking changes from this guide that are likely to affect a project like mine, most impactful first.
2. For each one, tell me what to search for in my codebase to find affected code (exact function names, imports, config keys).
3. Once I've shared what I find, give step-by-step changes.

Rules:
- Behaviour must stay the same. No unrelated refactors or style changes.
- Flag anything you're unsure about or that needs manual testing.
- Don't rely on knowledge of {{ask.to}} beyond this guide without telling me.
