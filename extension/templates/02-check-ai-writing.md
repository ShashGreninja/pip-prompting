---
id: check-ai-writing
name: Check this doc for AI-sounding writing
trigger: ;aicheck
category: review
context: [page.content, page.url]
ask:
  - key: audience
    label: Who reads this?
  - key: voice
    label: How should it sound?
    options: [plain and direct, friendly, formal, technical]
---
Review the text below for passages that read as AI-generated or generic. It's written for {{ask.audience}} and should sound {{ask.voice}}.

For each passage you flag, give:
- the exact quote
- why it reads as AI-written (the specific pattern: filler, hedging, empty transitions, list-of-three habit, vague claims, overused words)
- a rewrite in a natural human voice that keeps the meaning

Rules:
- Only flag what actually reads badly. Leave good sentences alone.
- Don't add facts, examples or claims that aren't in the original.
- End with a two-line overall verdict: how AI-sounding it is and the top habit to fix.

Text:
"""
{{page.content}}
"""
