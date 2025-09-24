// DOM element references.
const markdownInput = document.getElementById("markdown-input");
const previewOutput = document.getElementById("preview-output");
const previewContainer = document.getElementById("preview-container");
const themeSelector = document.getElementById("theme-selector");
const downloadButton = document.getElementById("download-pdf-btn");
const pageBreakToggle = document.getElementById("page-break-toggle");
const compactToggle = document.getElementById("compact-toggle");
const errorBox = document.getElementById("error-box");
const errorMessage = document.getElementById("error-message");

let debounceTimer;

/**
 * Renders Markdown and recalculates page breaks.
 */
function updateAndRender() {
  const htmlContent = marked.parse(markdownInput.value, {
    gfm: true,
    breaks: true,
  });
  previewOutput.innerHTML = htmlContent;
  recalculatePageBreaks();
}

/**
 * Applies the selected theme and re-renders.
 */
function applyPreviewTheme() {
  const theme = themeSelector.value;
  const compact = compactToggle.checked ? ' compact-mode' : '';
  previewOutput.className = `px-8 preview-pane theme-${theme}-preview${compact}`;
  recalculatePageBreaks();
}

/**
 * Defines page content heights for each theme.
 */
const THEME_CONFIG = {
  light: 1180,
  academic: 1180,
  swiss: 1180,
  blueprint: 1180,
  forest: 1180,
  plum: 1180,
  resume: 1180,
};

/**
 * Draws page break overlays based on content height.
 */
function recalculatePageBreaks() {
  previewContainer.style.position = "relative";
  previewContainer
    .querySelectorAll(".page-separator-line")
    .forEach((line) => line.remove());

  if (!pageBreakToggle.checked) {
    previewContainer.classList.remove("page-break-mode");
    return;
  }

  previewContainer.classList.add("page-break-mode");

  const theme = themeSelector.value;
  const pageContentHeight = THEME_CONFIG[theme] - 72 * 2;
  if (pageContentHeight <= 0) return;

  // Use a timeout to ensure rendering before measurement.
  setTimeout(() => {
    const totalContentHeight = previewOutput.offsetHeight;
    const pageCount = Math.ceil(totalContentHeight / pageContentHeight);

    for (let i = 1; i < pageCount; i++) {
      const breakPosition = pageContentHeight * i;
      const separatorLine = document.createElement("div");
      separatorLine.className = "page-separator-line";
      separatorLine.innerHTML = `<span>Page ${i + 1}</span>`;

      Object.assign(separatorLine.style, {
        position: "absolute",
        top: `${breakPosition}px`,
        left: "0",
        right: "0",
        borderTop: "2px dashed #9ca3af",
        textAlign: "center",
        pointerEvents: "none",
        zIndex: 10,
      });

      const span = separatorLine.querySelector("span");
      Object.assign(span.style, {
        position: "relative",
        top: "-0.7em",
        backgroundColor: "#374151",
        color: "#9ca3af",
        padding: "0 1em",
        fontSize: "0.75rem",
        fontFamily: "monospace",
      });

      previewContainer.appendChild(separatorLine);
    }
  }, 0);
}

/**
 * Toggles the page break view.
 */
function togglePageBreakView() {
  recalculatePageBreaks();
}

/**
 * Posts Markdown content to the backend for PDF generation.
 */
async function downloadPDF() {
  const markdown = markdownInput.value;
  const theme = themeSelector.value;
  const compact = compactToggle.checked;

  const originalButtonText = downloadButton.textContent;
  downloadButton.innerHTML = "Generating...";
  downloadButton.disabled = true;
  errorBox.classList.add("hidden");

  try {
    const response = await fetch("/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown, theme, compact }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `Server responded with status ${response.status}`,
      }));
      throw new Error(errorData.error);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "document.pdf";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (err) {
    console.error("Failed to download PDF:", err);
    errorMessage.textContent = err.message;
    errorBox.classList.remove("hidden");
  } finally {
    downloadButton.textContent = originalButtonText;
    downloadButton.disabled = false;
  }
}

// --- Event Listeners ---
markdownInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(updateAndRender, 300);
});
downloadButton.addEventListener("click", downloadPDF);
themeSelector.addEventListener("change", applyPreviewTheme);
pageBreakToggle.addEventListener("change", togglePageBreakView);
compactToggle.addEventListener("change", applyPreviewTheme);
new ResizeObserver(recalculatePageBreaks).observe(previewContainer);

// --- Initial Load ---
window.onload = () => {
  markdownInput.value = `# Document Title

Lorem ipsum dolor sit amet, consectetur adipiscing elit. **Praesent commodo** cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Duis mollis, est non commodo luctus, nisi erat porttitor ligula, eget lacinia odio sem nec elit.

> Cras mattis consectetur purus sit amet fermentum. Curabitur blandit tempus porttitor. Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum. Etiam porta sem malesuada magna mollis euismod.

Maecenas sed diam eget risus varius blandit sit amet non magna. *Nullam id dolor id nibh ultricies vehicula ut id elit*. Donec id elit non mi porta gravida at eget metus. Visit [Google](https://www.google.com) for more info.

---

## Lists and Details

In this section, we will explore different types of lists. Aenean lacinia bibendum nulla sed consectetur.

### Ordered List of Tasks
1.  Gather requirements and specifications.
2.  Create initial design mockups.
3.  Develop the front-end interface.
4.  Implement the back-end logic and database.
5.  Integrate front-end with the back-end services.
6.  Perform unit and integration testing.
7.  Deploy the application to a staging environment.
8.  Conduct user acceptance testing (UAT).
9.  Address feedback and fix bugs.
10. Final deployment to production.
11. Monitor application performance and stability.

### Unordered List of Features
* User Authentication
    * Standard login with email and password.
    * OAuth 2.0 with Google and GitHub.
* Dashboard
    * Display key metrics and analytics.
    * Customizable widgets.
* Content Management
    * Create, edit, and delete articles.
    * Support for rich text and Markdown.
* Settings
    * User profile management.
    * Notification preferences.
* API Integration

---

## Code and Data Representation

This section demonstrates how to display technical information like code blocks and data tables. A paragraph with \`inline code\` can be used to reference a function like \`calculateTotal()\`.

\`\`\`javascript
// A more detailed JavaScript example
class DataFetcher {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  async fetchData() {
    try {
      const response = await fetch(this.endpoint);
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch data:", error);
      return null;
    }
  }
}

const api = new DataFetcher('https://api.example.com/data');
api.fetchData().then(data => {
  console.log('Data received:', data);
});
\`\`\`

### Quarterly Performance Data

| Quarter | Revenue      | Expenses     | Profit       | Growth (%) |
|:--------|:------------:|:------------:|:------------:|-----------:|
| Q1 2024 | $150,000     | $110,000     | $40,000      | 5.0%       |
| Q2 2024 | $185,000     | $125,000     | $60,000      | 7.5%       |
| Q3 2024 | $210,000     | $140,000     | $70,000      | 8.2%       |
| Q4 2024 | $250,000     | $160,000     | $90,000      | 10.1%      |
| Q1 2025 | $275,000     | $170,000     | $105,000     | 9.8%       |

Donec ullamcorper nulla non metus auctor fringilla. Cras justo odio, dapibus ac facilisis in, egestas eget quam.
`;
  updateAndRender();
  applyPreviewTheme();
};
