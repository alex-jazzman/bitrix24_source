import { Dom, Loc, Tag } from 'main.core';

export function renderLayout(options = {}): {
	root: HTMLElement,
	header: HTMLElement,
	body: HTMLElement,
	footer: HTMLElement,
	preview: HTMLElement | null,
}
{
	const { id, isReadOnly, canUsePreview } = options;

	const { root, header, body, footer } = Tag.render`
		<div id="${id}" class="messageservice-template-editor messageservice-template-editor-scope">
			<div ref="header" class="messageservice-template-editor-header"></div>
			<div ref="body" class="messageservice-template-editor-body"></div>
			<div ref="footer" class="messageservice-template-editor-footer"></div>
		</div>
	`;

	if (isReadOnly)
	{
		Dom.addClass(root, '--read-only');
	}

	let preview = null;
	if (canUsePreview)
	{
		preview = Tag.render`
			<div class="messageservice-template-editor-preview-link" href="#" >
				${Loc.getMessage('MESSAGESERVICE_TEMPLATE_EDITOR_PREVIEW_LINK_TITLE')}
			</div>
		`;

		Dom.append(preview, root);
	}

	return { root, header, body, footer, preview };
}
