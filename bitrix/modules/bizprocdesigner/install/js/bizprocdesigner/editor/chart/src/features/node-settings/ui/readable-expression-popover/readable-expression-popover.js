import { Loc, Tag, Text, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Popup } from 'main.popup';
import { Button, ButtonColor, ButtonSize } from 'ui.buttons';
import { UI } from 'ui.notification';

import {
	type ExpressionRefToken,
	TOKEN_PATH_SEPARATOR,
	expressionTokenLabel,
	isSourceBlockOnDiagram,
} from '../../../../entities/node-settings/utils/readable-expressions';

import './style.css';

export const READABLE_EXPRESSION_SHOW_SOURCE_EVENT = 'BizprocDesigner.ReadableExpressions.ShowSource';

const POPUP_ID = 'bizprocdesigner-readable-expression-popover';
const CONTENT_TESTID = 'bizprocdesigner-readable-expression-popover-content';
const COPY_TESTID = 'bizprocdesigner-readable-expression-popover-copy';
const SHOW_SOURCE_TESTID = 'bizprocdesigner-readable-expression-popover-show-source';
const COPY_NOTIFICATION_DELAY = 2000;

let activePopup: ?Popup = null;
let activeAnchor: ?HTMLElement = null;

export function closeReadableExpressionPopover(): void
{
	const popup = activePopup;
	forget(popup);
	popup?.destroy();
}

/**
 * The popover lives in `document.body`, so a token taken off the page leaves it hanging on an anchor
 * no longer there. Every place that takes a layer or a whole editor down closes what it anchors.
 */
export function closeReadableExpressionPopoverIn(container: ?Node): void
{
	if (Type.isDomNode(container) && Type.isDomNode(activeAnchor) && container.contains(activeAnchor))
	{
		closeReadableExpressionPopover();
	}
}

export function openReadableExpressionPopover(token: ExpressionRefToken, anchor: HTMLElement): void
{
	const isRepeatedClick = activeAnchor === anchor;
	closeReadableExpressionPopover();

	if (isRepeatedClick || token?.kind !== 'ref' || !Type.isDomNode(anchor))
	{
		return;
	}

	const popup = new Popup({
		id: POPUP_ID,
		bindElement: anchor,
		content: renderContent(token),
		buttons: createButtons(token),
		className: 'bizprocdesigner-readable-expression-popover',
		targetContainer: document.body,
		autoHide: true,
		closeByEsc: true,
		// The popover lives in `document.body`, so without the trap its buttons would sit at the very
		// end of the tab order. The trap takes the focus in and gives it back to the token on close.
		focusTrap: true,
		ariaLabel: Loc.getMessage(
			'BIZPROCDESIGNER_EDITOR_READABLE_EXPRESSIONS_POPOVER_TITLE',
			{ '#VALUE#': expressionTokenLabel(token) },
		) ?? '',
		cacheable: false,
		angle: true,
		padding: 0,
		// A click on the token itself must toggle the popover: auto-hide would close it before the
		// token handler runs, and the reopen right after would look like the token does nothing.
		autoHideHandler: (event: MouseEvent): boolean => !anchor.contains(event.target),
		events: {
			onPopupClose: (): void => {
				forget(popup);
				popup.destroy();
			},
		},
	});

	activePopup = popup;
	activeAnchor = anchor;
	popup.show();
}

function forget(popup: ?Popup): void
{
	if (popup && activePopup === popup)
	{
		activePopup = null;
		activeAnchor = null;
	}
}

function renderContent(token: ExpressionRefToken): HTMLElement
{
	return Tag.render`
		<div class="bizprocdesigner-readable-expression-popover__content" data-testid="${CONTENT_TESTID}">
			${token.unknown ? renderUnknownNotice() : ''}
			${renderRows(token)}
			<div class="bizprocdesigner-readable-expression-popover__code">${Text.encode(token.raw)}</div>
		</div>
	`;
}

function renderUnknownNotice(): HTMLElement
{
	const text = Loc.getMessage('BIZPROCDESIGNER_EDITOR_READABLE_EXPRESSIONS_UNKNOWN') ?? '';

	return Tag.render`
		<div class="bizprocdesigner-readable-expression-popover__unknown">${Text.encode(text)}</div>
	`;
}

function renderRows(token: ExpressionRefToken): Array<HTMLElement>
{
	const rows = [
		['BIZPROCDESIGNER_EDITOR_READABLE_EXPRESSIONS_POPOVER_PATH', (token.path ?? []).join(TOKEN_PATH_SEPARATOR)],
		['BIZPROCDESIGNER_EDITOR_READABLE_EXPRESSIONS_POPOVER_TYPE', token.valueType],
		['BIZPROCDESIGNER_EDITOR_READABLE_EXPRESSIONS_POPOVER_EXAMPLE', token.example],
	];

	return rows
		.filter(([, value]) => Type.isStringFilled(value))
		.map(([messageId, value]) => Tag.render`
			<div class="bizprocdesigner-readable-expression-popover__row">
				<span class="bizprocdesigner-readable-expression-popover__label">${Text.encode(Loc.getMessage(messageId) ?? '')}</span>
				<span class="bizprocdesigner-readable-expression-popover__value">${Text.encode(value)}</span>
			</div>
		`)
	;
}

function createButtons(token: ExpressionRefToken): Array<Button>
{
	const buttons = [];

	if (BX.clipboard?.isCopySupported())
	{
		buttons.push(new Button({
			text: Loc.getMessage('BIZPROCDESIGNER_EDITOR_READABLE_EXPRESSIONS_POPOVER_COPY') ?? '',
			size: ButtonSize.EXTRA_SMALL,
			color: ButtonColor.LIGHT_BORDER,
			dataset: { testid: COPY_TESTID },
			onclick: (): void => copyCode(token.raw),
		}));
	}

	// A source of the node context — a rule card of its own and its siblings — has no block of its
	// own on the diagram, so there is nowhere to go and the button is not offered.
	if (isSourceBlockOnDiagram(token.sourceBlockId))
	{
		buttons.push(new Button({
			text: Loc.getMessage('BIZPROCDESIGNER_EDITOR_READABLE_EXPRESSIONS_POPOVER_SHOW_SOURCE') ?? '',
			size: ButtonSize.EXTRA_SMALL,
			color: ButtonColor.LIGHT_BORDER,
			dataset: { testid: SHOW_SOURCE_TESTID },
			onclick: (): void => showSource(token.sourceBlockId),
		}));
	}

	return buttons;
}

function copyCode(raw: string): void
{
	BX.clipboard?.copy(raw);

	UI.Notification.Center.notify({
		content: Loc.getMessage('BIZPROCDESIGNER_EDITOR_READABLE_EXPRESSIONS_COPIED') ?? '',
		autoHideDelay: COPY_NOTIFICATION_DELAY,
	});
}

function showSource(blockId: string): void
{
	closeReadableExpressionPopover();
	EventEmitter.emit(READABLE_EXPRESSION_SHOW_SOURCE_EVENT, { blockId });
}
