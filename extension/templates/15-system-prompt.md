---
id: system-prompt
name: Write a system prompt for my AI feature
trigger: ;sysprompt
category: write
context: []
ask:
  - key: does
    label: What does your AI feature do?
  - key: users
    label: Who uses it?
  - key: never
    label: What must it never do?
---
Write a system prompt for an AI feature in my app.

- What it does: {{ask.does}}
- Who uses it: {{ask.users}}
- It must never: {{ask.never}}

Before writing, ask me up to 3 questions about anything that would change the prompt a lot (tone, output format, what data it can see, what to do when it can't help).

Then give me:
1. **The system prompt.** Clear sections for role, task, rules, output format and how to handle edge cases. Explain the reasoning behind rules instead of just using ALL CAPS.
2. **Why it's built this way.** Short notes on the key choices.
3. **Test inputs.** 8 inputs to try: 3 normal, 3 edge cases, 2 that try to make it break its rules. For each, what a good response looks like.
