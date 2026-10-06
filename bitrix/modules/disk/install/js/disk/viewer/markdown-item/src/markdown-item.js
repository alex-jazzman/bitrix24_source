import { ajax as Ajax, Dom, Runtime, Tag } from 'main.core';

/**
 * Markdown viewer item: shows server-sanitized HTML in a sandboxed iframe.
 * Used only when a formatted-render url is available; otherwise the file is
 * served by the generic viewer (see Disk\Ui\FileAttributes).
 *
 * Follows the standard viewer flow: loadData() fetches the rendered html through
 * the engine action, so a failure rejects into the controller's processError
 * (standard error block + download fallback). The html is injected via the
 * iframe srcdoc to keep the sandbox isolation of untrusted user content.
 *
 * Mermaid can't run in the no-scripts iframe, so the server returns diagram sources apart
 * from the html; we render them to SVG here (parent frame) and swap them into placeholders.
 */

// Must match MarkdownRenderService::MERMAID_PLACEHOLDER_PREFIX/SUFFIX on the server.
const MERMAID_PLACEHOLDER_PREFIX = '[[DISK_MERMAID_PLACEHOLDER::';
const MERMAID_PLACEHOLDER_SUFFIX = ']]';

export default class MarkdownItem extends BX.UI.Viewer.Item
{
	constructor(options)
	{
		options = options || {};
		super(options);

		this.markdownUrl = options.markdownUrl || null;
		this.html = null;
	}

	setPropertiesByNode(node)
	{
		super.setPropertiesByNode(node);

		this.markdownUrl = node.dataset.markdownUrl || null;
	}

	listContainerModifiers()
	{
		return [
			'ui-viewer-document',
			'ui-viewer-document-markdown',
		];
	}

	loadData()
	{
		const promise = new BX.Promise();

		if (!this.markdownUrl)
		{
			promise.reject({ item: this, type: 'error' });

			return promise;
		}

		this.fetchAndRender()
			.then((html) => {
				this.html = html;
				promise.fulfill(this);
			})
			.catch(() => {
				promise.reject({ item: this, type: 'error' });
			});

		return promise;
	}

	// Rejects only when the document can't be fetched; diagram failures degrade in renderDiagrams().
	async fetchAndRender()
	{
		const response = await Ajax.promise({
			url: this.markdownUrl,
			method: 'GET',
			dataType: 'json',
		});

		if (!response || !response.data || !response.data.html)
		{
			throw new Error('Empty markdown render response');
		}

		const diagrams = Array.isArray(response.data.diagrams) ? response.data.diagrams : [];

		return this.renderDiagrams(response.data.html, diagrams);
	}

	// ui.mermaid (~4MB) is loaded lazily, only when the document actually contains diagrams.
	async renderDiagrams(html, diagrams)
	{
		if (diagrams.length === 0)
		{
			return html;
		}

		let mermaid = null;
		try
		{
			({ mermaid } = await Runtime.loadExtension('ui.mermaid'));
			mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'default' });
		}
		catch
		{
			// Extension unavailable: degrade to showing each diagram's source instead of a raw token.
			return diagrams.reduce((acc, source, index) => substitute(acc, index, errorBlock(source)), html);
		}

		let result = html;
		for (const [index, source] of diagrams.entries())
		{
			let replacement = errorBlock(source);
			try
			{
				// Sequential: mermaid keeps global render state, so diagrams render one at a time.
				// eslint-disable-next-line no-await-in-loop
				const { svg } = await mermaid.render(`disk-md-diagram-${index}`, source);
				replacement = `<div class="disk-markdown-diagram">${svg}</div>`;
			}
			catch
			{
				// keep the source fallback assigned above
			}

			result = substitute(result, index, replacement);
		}

		return result;
	}

	render()
	{
		this.contentNode = Tag.render`<div class="ui-viewer-item-document-content --markdown"></div>`;

		if (this.html)
		{
			Dom.append(this.renderFormatted(), this.contentNode);
		}

		return this.contentNode;
	}

	renderFormatted()
	{
		const iframe = Tag.render`
			<iframe
				class="disk-viewer-markdown-frame"
				sandbox="allow-popups allow-popups-to-escape-sandbox"
				referrerpolicy="no-referrer"
			></iframe>
		`;
		iframe.srcdoc = this.html;

		return iframe;
	}
}

// Function replacement (not a string) so `$&`, `$$` etc. in the svg/source aren't treated as
// special replacement patterns and reinjected into the html.
function substitute(html, index, replacement)
{
	const token = `${MERMAID_PLACEHOLDER_PREFIX}${index}${MERMAID_PLACEHOLDER_SUFFIX}`;

	return html.replaceAll(token, () => replacement);
}

function errorBlock(source)
{
	return `<pre class="disk-markdown-diagram--error">${escapeHtml(source)}</pre>`;
}

function escapeHtml(text)
{
	return String(text)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;');
}
