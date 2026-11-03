import { Loc, Tag, Text, Type } from 'main.core';

import { safeLink } from './safe-link';

import './locked-document-warning.css';

export type LockedDocumentWarning = {
	link: string,
	titleMessageId: string,
	textMessageId: string,
	actionMessageId: string,
};

// The window names itself by this heading, so the identifier is part of the contract of the block.
export const LOCKED_DOCUMENT_WARNING_TITLE_ID = 'disk-locked-document-warning-title';

export function renderLockedDocumentWarning(params: LockedDocumentWarning): HTMLElement
{
	const link = safeLink(params.link);

	// The phrase carries the markup of the link to the folder the copy was saved into, so it goes
	// into the node as markup. The value put into it is encoded to keep it inside the attribute it
	// is given to, and it is handed over by a function: as a replacement string `$&`, `$'` and
	// `` $` `` would stand for parts of the match.
	const text = (Loc.getMessage(params.textMessageId) ?? '')
		.replace('#LINK#', () => Text.encode(link));

	// The button is the one thing the window is opened for, and with no address there is nowhere for
	// it to lead. `tabindex` is spelled out on a control that carries one already, the way
	// `main.popup` spells it out on its own buttons: Safari walks the Tab path over form fields and
	// over whatever states a tab index, so without it this button is off the Tab path there.
	const action = Type.isStringFilled(link)
		? Tag.render`
			<button
				type="button"
				tabindex="0"
				class="webform-button webform-button-create disk-locked-document-popup-content-button"
				data-testid="disk-locked-document-warning-open"
				data-autofocus
			>${Loc.getMessage(params.actionMessageId) ?? ''}</button>
		`
		: '';

	const node = Tag.render`
		<div class="disk-locked-document-popup" data-testid="disk-locked-document-warning">
			<div class="disk-locked-document-popup-container">
				<div class="disk-locked-document-popup-img-container">
					<div class="disk-locked-document-popup-img"></div>
				</div>
				<div class="disk-locked-document-popup-content">
					<h3 class="disk-locked-document-popup-content-title" id="${LOCKED_DOCUMENT_WARNING_TITLE_ID}">
						${Loc.getMessage(params.titleMessageId) ?? ''}
					</h3>
					<div class="disk-locked-document-popup-content-info">
						<span class="disk-locked-document-popup-content-text">${text}</span>
					</div>
					${action}
				</div>
			</div>
		</div>
	`;

	if (!Type.isStringFilled(link))
	{
		// An anchor without `href` holds neither the role of a link nor a place on the Tab path,
		// while `href=""` would lead back to the page the window was opened over.
		node.querySelectorAll('.disk-locked-document-popup-content-text a').forEach((anchor: Element) => {
			anchor.removeAttribute('href');
			anchor.removeAttribute('target');
			anchor.removeAttribute('rel');
		});
	}

	return node;
}
