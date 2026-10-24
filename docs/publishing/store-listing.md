# Publishing Pip

## Build the submission files

```bash
npm run dev
```

Leave that running, and in a second terminal:

```bash
powershell -ExecutionPolicy Bypass -File scripts/store-assets.ps1
```

This writes everything to `dist/store/` (git-ignored):

| File | Use |
|---|---|
| `pip-prompting-<version>.zip` | The extension package (`manifest.json` at the top level) |
| `logo.png` | Store logo, 300×300 |
| `promo.png` | Small promotional tile, 440×280 |
| `screenshot-1-result.png` … `screenshot-4-pairs.png` | Screenshots, 1280×800 |

For every new upload, bump `version` in both `extension/manifest.json` and `package.json`. `npm test` checks that they match.

## Microsoft Edge Add-ons (free)

1. **Register (once).** Go to [Partner Center → Microsoft Edge](https://partner.microsoft.com/dashboard/microsoftedge/overview), sign in with a Microsoft account and register as an **individual** developer. Registration for Edge extensions has had no fee. Microsoft may ask you to verify your email or identity.
2. **Create the extension.** Click **Create new extension**, then upload `dist/store/pip-prompting-<version>.zip` on the **Packages** page.
3. **Availability:** Visibility **Public** (or **Hidden** to test with a direct link first), Markets: all.
4. **Properties:**
   - Category: **Developer tools**
   - Privacy policy: **Yes**, URL: `https://shashgreninja.github.io/pip-prompting/publishing/privacy-policy.html`
   - Website: `https://github.com/ShashGreninja/pip-prompting`
   - Support contact: `https://github.com/ShashGreninja/pip-prompting/issues`
   - Mature content: No
5. **Store listings** (English):
   - Description: the long description below
   - Short description: the summary below
   - Store logo: `logo.png`; Small promotional tile: `promo.png`; Screenshots: the four `screenshot-*.png`
   - Search terms: `prompt`, `prompt engineering`, `ChatGPT`, `Claude`, `AI`, `developer`, `templates`
6. **Submit.** Paste the **Notes for certification** below, then click **Publish**. Microsoft's review usually takes a few business days, sometimes longer for extensions that run on all sites. Partner Center emails you the result.

**Notes for certification:**

```
Pip shows a small avatar on web pages. Clicking it opens a panel where the user picks a prompt template; Pip reads context from the current page only when a template is opened, shows the user what it will include, and writes a prompt into the page's chat box or the clipboard. It never submits anything. No account or login is needed to test: open any page (e.g. a GitHub pull request or API docs page), click the purple avatar in the bottom-right corner, pick a template and click "Write my prompt". All code is in the package; there is no remote code and no server.
```

## Chrome Web Store (one-time $5 fee)

Same files and text. Use the [developer dashboard](https://chrome.google.com/webstore/devconsole), and see the permission justifications and data-usage answers below.

---

## Listing text

**Name** (from the manifest): Pip – prompt helper

**Short description / summary** (from the manifest description, max 132 characters):
A sleepy little helper that turns what's on your page into a great prompt. Pip writes prompts; you send them.

**Category:** Developer tools

**Long description:**

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

Open source: https://github.com/ShashGreninja/pip-prompting

ChatGPT is a trademark of OpenAI. Claude is a trademark of Anthropic. Pip is not affiliated with either.
```

## Privacy answers

**Single purpose:**
Helps users write better prompts for AI chat tools by turning context from the page they're on into a prompt that they review and send themselves.

**Permission justifications:**

| Permission | Justification |
|---|---|
| `storage` | Saves the user's settings (whether Pip is shown, hidden sites, sleep delay), their optional profile (stack, preferences, test framework), game high scores, and, for up to 15 minutes, a prompt the user chose to open in a new ChatGPT or Claude tab. |
| Host permission `<all_urls>` | Pip appears on any page the user visits so they can turn that page into a prompt. When the user asks, it reads the page's text, selection, console errors or styles to fill the prompt; captures a screenshot of the visible tab (captureVisibleTab) to attach to it; lists the titles and URLs of other open tabs for the "compare options" template; and fetches a GitHub pull request's .diff for the "review this PR" template. Nothing is sent anywhere except the user's own chat box or clipboard. |
| Content script in the page's main world (`errors-main.js`) | Records the last 10 console errors on the page so the "Fix this console error" template can include them. They stay in memory on that page and are only read when the user opens that template. |

**Remote code:** None. All JavaScript is included in the package.

**Data usage:** Pip does not collect or transmit user data. Leave every data type unchecked, and confirm that data isn't sold, isn't used for unrelated purposes, and isn't used for creditworthiness.

**Privacy policy:** `https://shashgreninja.github.io/pip-prompting/publishing/privacy-policy.html` (source: `docs/publishing/privacy-policy.html`, served by GitHub Pages from `docs/`).
