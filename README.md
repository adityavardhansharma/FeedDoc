# FeedDoc

A Chrome extension that lets you slice pages from documents and feed them directly into AI chats.

Upload a PDF, PowerPoint, or Word file, pick a page range, and FeedDoc creates a new file with just those pages. Then feed it straight into ChatGPT, Claude, Grok, or T3 Chat — no copy-pasting, no manual uploads. Everything happens locally in your browser.

## Supported AI Platforms

- ChatGPT
- Claude
- Grok
- T3 Chat

## How to Install

1. Download this repository (click the green **Code** button above, then **Download ZIP**, and unzip it)
2. Open Chrome and go to `chrome://extensions`
3. Turn on **Developer mode** using the toggle in the top-right corner
4. Click **Load unpacked**
5. Select the **`dist`** folder from the downloaded project
6. Done — you'll see the FeedDoc icon in your Chrome toolbar

## How to Use

1. Go to any supported AI chat (ChatGPT, Claude, Grok, or T3 Chat)
2. Click the FeedDoc icon in your toolbar to open the side panel
3. Drop in a PDF, PPTX, or DOCX file
4. Choose which pages you want
5. Hit **Slice**
6. Click **Feed to [Platform]** to send it into the chat, or **Download** to save it

## Updating

When you download a newer version:

1. Replace the old folder with the new one
2. Go to `chrome://extensions`
3. Click the reload icon on the FeedDoc card
4. Refresh any open AI chat tabs

## Building from Source

Only needed if you want to modify the code yourself.

```bash
pnpm install
pnpm build
```

Then load the `dist/` folder as described above.

## License

MIT
