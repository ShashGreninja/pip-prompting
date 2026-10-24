---
id: mine-ideas
name: Mine this page for ideas and references
trigger: ;ideas
category: understand
context: [page.url, page.title, page.content]
ask:
  - key: project
    label: What are you working on?
---
I'm working on {{ask.project}}. Read the content below (from "{{page.title}}", {{page.url}}) and pull out what's useful for my project.

Give me:
1. **Ideas**: a table with columns: idea, where it comes from in the source (short quote or section), how it applies to my project, effort (low/med/high).
2. **References**: every link, paper, tool, library or person the source mentions that's worth following up, with one line on why.
3. **What I'd skip**: anything that looks relevant but doesn't fit my project, and why.

Keep what the source says separate from your own suggestions. Label your suggestions clearly.

Content:
"""
{{page.content}}
"""
