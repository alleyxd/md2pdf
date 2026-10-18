const assert = require('node:assert');
const fs = require('fs');
const test = require('node:test');
const { mdToPdf } = require('md-to-pdf');
const { sanitizeHtml, safeOptions } = require('../safe');

test('blocks tags that embed or load content', () => {
    for (const html of [
        '<iframe src="/server.js"></iframe>',
        '<object data="/package.json"></object>',
        '<embed src="/server.js">',
        '<script>fetch("/server.js")</script>',
        '<link rel="stylesheet" href="/x.css">',
        '<base href="file:///">',
    ]) {
        assert.strictEqual(sanitizeHtml(html).trim(), '', html);
    }
});

test('keeps formatting HTML, web images and data images', () => {
    assert.strictEqual(sanitizeHtml('<div class="page-break"></div>'), '<div class="page-break"></div>');
    assert.strictEqual(sanitizeHtml('<img src="https://example.com/a.png">'), '<img src="https://example.com/a.png">');
    assert.ok(sanitizeHtml('<img src="data:image/png;base64,AAAA">').includes('data:image/png'));
    assert.strictEqual(sanitizeHtml('<b>bold</b><br>'), '<b>bold</b><br>');
});

test('drops local paths, javascript: links and event handlers', () => {
    assert.strictEqual(sanitizeHtml('<img src="/server.js">'), '<img>');
    assert.strictEqual(sanitizeHtml('<img src="file:///etc/passwd">'), '<img>');
    assert.strictEqual(sanitizeHtml('<a href="javascript:alert(1)">x</a>'), '<a>x</a>');
    assert.strictEqual(sanitizeHtml('<img src="https://e.com/a.png" onerror="alert(1)">'), '<img src="https://e.com/a.png">');
});

test('rendered HTML has no iframe, front matter is not config, basedir is empty', async () => {
    const md = '---\nscript:\n  - content: "document.title = 1"\n---\n# Hi\n\n<iframe src="/package.json"></iframe>\n';
    const out = await mdToPdf({ content: md }, { ...safeOptions, as_html: true });
    assert.ok(!out.content.includes('<iframe'));
    // the front matter is shown as text instead of being injected as a script
    assert.ok(!/<script[^>]*>\s*document\.title/.test(out.content));
    assert.deepStrictEqual(fs.readdirSync(safeOptions.basedir), []);
});
