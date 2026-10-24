---
id: inspire-from-site
name: Take inspiration from this site
trigger: ;inspire
category: build
context: [page.url, page.screenshot, page.design_tokens]
ask:
  - key: what
    label: What are you building?
  - key: borrow
    label: What do you like about this site?
    options: [layout, colors, typography, animations, overall vibe]
---
I'm building {{ask.what}} and want to take inspiration from {{page.url}} (screenshot attached).

What I like about it: {{ask.borrow}}.

{{#if page.design_tokens}}
Design details pulled from the page:
{{page.design_tokens}}
{{/if}}

My stack: {{profile.stack}}

Please:
1. In a few bullets, describe the design language behind what I like: spacing, type scale, color use, motion.
2. Build {{ask.what}} using that language, adapted to my content. Don't copy their text, logo, images or brand. It should feel related, not cloned.
3. Keep colors, fonts and spacing as variables or tokens so I can tweak them.

If anything about my content or pages is unclear, ask me before building.
