# Store submission: Pip – prompt helper

Ready-to-paste listing text for publishing Pip later. The same text works for:

- **Microsoft Edge Add-ons** ([Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview)): registering as an Edge extension developer has had no fee. Users of any Chromium browser can install from there.
- **Chrome Web Store** ([developer dashboard](https://chrome.google.com/webstore/devconsole)): one-time $5 registration fee.

## Package

- Zip the *contents* of the `extension/` folder (so `manifest.json` is at the top level of the zip) and upload that.
- Bump `version` in both `extension/manifest.json` and `package.json` for every new upload. `npm test` checks they match.

## Store listing tab

**Name** (from the manifest): Pip – prompt helper

**Summary** (from the manifest description, max 132 characters):
A sleepy little helper that turns what's on your page into a great prompt. Pip writes prompts; you send them.

**Category:** Developer Tools

**Language:** English

**Description:**

```
Stop writing prompts from scratch. Pip is a small, sleepy helper that lives in the corner of your browser and turns what's on your page into a clear, complete prompt for any AI chat.

HOW IT WORKS
• Pip sleeps in the bottom-right corner and stays out of your way.
• Click Pip (or press Alt+Shift+P) to wake it.
• Pip suggests prompt templates that fit the page you're on: an error in the console, a GitHub pull request, API docs, a migration guide, a ticket, or code you've selected.
• Answer up to three quick questions. Pip fills in the context from the page for you.
• Review the prompt, then insert it into the chat box, copy it, or open it in a new ChatGPT or Claude chat. You always press Enter yourself.

15 TEMPLATES FOR DEVELOPERS
Take inspiration from a site · Check writing for AI-sounding text · Mine a page for ideas · Integrate an API · Upgrade a library · Fix a console error · Describe a bug · Turn a design into a component · Write tests · Refactor safely · Explain code · Turn a ticket into a plan · Review a pull request · Compare your open tabs · Write a system prompt

CHECK MY DRAFT
Already typed a rough prompt? Pip checks it for a goal, context, constraints and an output format, flags vague words, and adds labelled blanks for whatever's missing.

YOUR PROFILE
Save your stack, working style and test framework once, and Pip adds them to every prompt.

PLAY WITH PIP
Three quick high-score games: Spark catch, Vague pop and Pip pairs.

PRIVATE BY DESIGN
• No account, no API key, no servers.
• Pip only reads a page when you ask it to, and everything stays in your browser.
• Pip never sends a prompt or does the task for you. It only writes the prompt.
• Hide Pip on any site, or everywhere, with one click.

ChatGPT is a trademark of OpenAI. Claude is a trademark of Anthropic. Pip is not affiliated with either.
```

**Graphic assets:**
- Store icon: `extension/icons/icon128.png`
- Screenshots (1280×800, at least one): render them from the dev harness, e.g. `http://localhost:5179/dev/harness.html?demo=result` (see the main README).
- Small promo tile (440×280): still to be made.

**Official URL / Homepage URL:** your site or GitHub repo (optional)

**Support URL:** a GitHub issues page or support email (optional)

## Privacy tab

**Single purpose:**
Helps users write better prompts for AI chat tools by turning context from the page they're on into a prompt that they review and send themselves.

**Permission justifications:**

| Permission | Justification |
|---|---|
| `storage` | Saves the user's settings (whether Pip is shown, hidden sites, sleep delay), their optional profile (stack, preferences, test framework), game high scores, and, for up to 15 minutes, a prompt the user chose to open in a new ChatGPT or Claude tab. |
| Host permission `<all_urls>` | Pip appears on any page the user visits so they can turn that page into a prompt. When the user asks, it reads the page's text, selection, console errors or styles to fill the prompt; captures a screenshot of the visible tab (captureVisibleTab) to attach to it; lists the titles and URLs of other open tabs for the "compare options" template; and fetches a GitHub pull request's .diff for the "review this PR" template. Nothing is sent anywhere except the user's own chat box or clipboard. |
| Content script in the page's main world (`errors-main.js`) | Records the last 10 console errors on the page so the "Fix this console error" template can include them. They stay in memory on that page and are only read when the user opens that template. |

**Remote code:** No, I am not using remote code. All JavaScript is included in the package.

**Data usage:** Leave every data type unchecked. Pip does not collect or transmit user data. Then tick all three certifications:
- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** host `docs/publishing/privacy-policy.html` publicly (e.g. GitHub Pages) and paste its URL here.

## Distribution tab

- Visibility: start with **Unlisted** to test the store build with a few people, then switch to **Public**.
- Regions: all regions.

## Review notes

- Broad host permissions (`<all_urls>`) usually trigger an in-depth review, which can take a few days to a few weeks. The justifications above explain why each one is needed.
- Before submitting, fill in the contact email placeholder in `docs/publishing/privacy-policy.html`.
