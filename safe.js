const fs = require('fs');
const os = require('os');
const path = require('path');

// md-to-pdf serves `basedir` to the headless browser that renders the PDF. By default that is the app's own
// folder, so markdown like <iframe src="/server.js"> would print our source into the PDF. Serve an empty folder.
const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'md2pdf-'));

// Raw HTML in markdown is allowed for formatting, but nothing that embeds or loads other content.
const BLOCKED_TAGS = ['iframe', 'frame', 'frameset', 'object', 'embed', 'script', 'link', 'meta', 'base', 'style', 'form'];
const tags = BLOCKED_TAGS.join('|');
const blockedBlock = new RegExp(`<\\s*(${tags})\\b[^>]*>[\\s\\S]*?<\\s*/\\s*\\1\\s*>`, 'gi');
const blockedTag = new RegExp(`<\\s*/?\\s*(${tags})\\b[^>]*>`, 'gi');

function sanitizeHtml(html) {
    return html
        .replace(blockedBlock, '')
        .replace(blockedTag, '')
        // event handlers such as onerror="..."
        .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        // links and sources may point to the web or be inline data, not to local paths or javascript:
        .replace(/\s+(src|href|srcset|data|action|formaction)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, (attr, name, value) => {
            const url = value.replace(/^["']|["']$/g, '').trim().toLowerCase();
            return /^(https?:|data:image\/|#|mailto:)/.test(url) ? attr : '';
        });
}

const safeOptions = {
    basedir: emptyDir,
    // front matter would otherwise be read as md-to-pdf configuration
    gray_matter_options: { delimiters: '\u0000md2pdf-no-front-matter\u0000' },
    marked_extensions: [{ renderer: { html: (html) => sanitizeHtml(typeof html === 'string' ? html : html.text) } }],
};

module.exports = { sanitizeHtml, safeOptions };
