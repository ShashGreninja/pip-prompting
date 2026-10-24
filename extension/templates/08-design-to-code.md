---
id: design-to-code
name: Turn this design into a component
trigger: ;design
category: build
context: [page.screenshot, page.design_tokens]
ask:
  - key: component
    label: What is this component?
  - key: states
    label: Which states does it need?
    options: [hover, focus, disabled, loading, empty, error]
---
Build the component in the attached screenshot: {{ask.component}}.

My stack: {{profile.stack}}

{{#if page.design_tokens}}
Exact values from the source page:
{{page.design_tokens}}
{{/if}}

Requirements:
- Match the layout, spacing, type and colors as closely as the screenshot allows. Before coding, list any values you had to estimate.
- Responsive: it should work from 360px wide up to desktop.
- Accessible: semantic HTML, keyboard reachable, visible focus, sufficient contrast, labels for icon-only buttons.
- States: {{ask.states}}.
- Use placeholder content passed in as props, not hard-coded text.

Output the component code, then a short example of using it.
