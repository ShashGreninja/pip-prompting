---
id: write-tests
name: Write tests for this code
trigger: ;tests
category: build
context: [page.content]
ask:
  - key: framework
    label: Test framework
    default: "{{profile.test_framework}}"
  - key: focus
    label: Anything to focus on?
    options: [edge cases, error handling, regressions, happy path]
---
Write tests for the code below using {{ask.framework}}.

```
{{page.content}}
```

Focus: {{ask.focus}}

Approach:
1. First list the behaviours you'll test as one-line descriptions: normal cases, edge cases (empty, null, boundaries, large input), and error cases. Mark which you think matter most.
2. Then write the tests.

Rules:
- Test behaviour through the public interface, not private implementation details.
- Mock only external boundaries (network, filesystem, time, randomness).
- Name each test so a failure explains itself.
- If the code has a bug or untestable design, point it out instead of writing a test that locks in the wrong behaviour.
