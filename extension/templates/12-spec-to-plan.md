---
id: spec-to-plan
name: Turn this ticket into a plan
trigger: ;plan
category: plan
context: [page.url, page.content]
ask:
  - key: size
    label: How much time do you have?
    options: [a few hours, a day, a week, longer]
---
Turn this spec/ticket into an implementation plan. Don't write code yet.

{{#if page.url}}Source: {{page.url}}{{/if}}

"""
{{page.content}}
"""

My stack: {{profile.stack}}
Time available: {{ask.size}}

Give me:
1. **Open questions**: ambiguities or missing details I should resolve first. List these before anything else.
2. **Tasks**: an ordered list. Each task has a one-line description, the parts of the codebase likely touched, and a "done when" check.
3. **Risks**: what's most likely to go wrong or take longer than expected.
4. **Out of scope**: things the spec might tempt me into that aren't required.

If the work doesn't fit the time available, suggest what to cut for a first version.
