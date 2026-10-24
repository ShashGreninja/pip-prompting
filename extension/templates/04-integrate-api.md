---
id: integrate-api
name: Integrate this API
trigger: ;api
category: build
context: [page.url, page.content]
ask:
  - key: feature
    label: What should the integration do?
---
I want to integrate the API documented at {{page.url}} so that {{ask.feature}}.

My stack: {{profile.stack}}
{{#if profile.preferences}}How I like to work: {{profile.preferences}}{{/if}}

Relevant docs:
"""
{{page.content}}
"""

Requirements:
- Use only endpoints, parameters and response fields that appear in these docs. If the docs don't cover something I need, say so instead of guessing.
- Keep credentials in environment variables, never in code.
- Handle errors, and handle rate limits and pagination if the docs describe them.
- Put the API calls behind a small client module so the rest of my code doesn't depend on the raw HTTP details.

Output:
1. Files to add or change, with the code.
2. Environment variables I need to set.
3. How to test it manually with one real request.
