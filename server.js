const express = require('express');
const { mdToPdf } = require('md-to-pdf');
const path = require('path');

const app = express();
// Use the PORT environment variable provided by Render, with a fallback for local development
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.static('public'));

app.post('/generate-pdf', async (req, res) => {
    const { markdown, theme } = req.body;

    if (!markdown) {
        return res.status(400).send({ error: 'Markdown content is required.' });
    }

    // Validate the theme and construct the path to the CSS file
    const allowedThemes = ['light', 'academic', 'blueprint', 'forest', 'plum', 'swiss'];
    const safeTheme = allowedThemes.includes(theme) ? theme : 'light'; // Default to 'light'
    const cssPath = path.resolve(__dirname, 'public', 'themes', `${safeTheme}.css`);

    try {
        // Use md-to-pdf to generate the PDF buffer
        const pdf = await mdToPdf(
            { content: markdown },
            {
                // Stylesheet for the PDF
                stylesheet: [cssPath],

                // PDF layout options
                pdf_options: {
                    format: 'A4',
                    margin: {
                        top: '0.25in',
                        right: '0.5in',
                        bottom: '0.25in',
                        left: '0.5in',
                    },
                    printBackground: true,
                },

                // --- CRUCIAL RENDER DEPLOYMENT OPTIONS ---
                // Tell Puppeteer where to find the Chromium binary installed by the Dockerfile.
                executablePath: '/usr/bin/chromium',
                
                // Add required arguments for running in a sandboxed, containerized environment.
                launch_options: {
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage'
                    ],
                },
            }
        );

        if (pdf && pdf.content) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=document.pdf');
            res.setHeader('Content-Length', pdf.content.length);
            res.end(pdf.content);
        } else {
            throw new Error('PDF generation returned empty content.');
        }

    } catch (err) {
        console.error('Error generating PDF:', err);
        res.status(500).send({ error: 'Failed to generate PDF. Check server logs for details.' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    // The 0.0.0.0 is important for Render to bind correctly
    console.log(`Markdown to PDF server listening on port ${port}`);
});