import { Event, Loc, Text, Type } from 'main.core';
import { PopupManager } from 'main.popup';
import { Hint } from 'ui.hint';

const LABEL_SELECTOR = '[data-role="demo-label"]';
const CLOSE_SELECTOR = '[data-role="demo-hint-close"]';
const HINT_TEXT_PHRASE = 'BICONNECTOR_SUPERSET_DASHBOARD_DEMO_LABEL_HINT';
const HINT_CLOSE_PHRASE = 'BICONNECTOR_SUPERSET_DASHBOARD_DEMO_LABEL_HINT_CLOSE';
const HINT_POPUP_ID = 'biconnector-demo-label-hint-popup';
const HINT_POPUP_CLASS = 'ui-hint-popup biconnector-demo__hint-popup';
const ANGLE_CENTERED_ON_POPUP = false;
const AUTO_SHOW_DELAY_MS = 2000;

function renderHintHtml(text: string, closeLabel: string): string
{
	return `
		<div class="biconnector-demo__hint" data-testid="dashboard-demo-label-hint">
			<div class="biconnector-demo__hint-image" aria-hidden="true"></div>
			<div class="biconnector-demo__hint-text">${Text.encode(text)}</div>
			<button
				type="button"
				class="biconnector-demo__hint-close"
				data-role="demo-hint-close"
				data-testid="dashboard-demo-label-hint-close"
				aria-label="${Text.encode(closeLabel)}"
			><div class="ui-icon-set --cross-m" aria-hidden="true"></div></button>
		</div>
	`;
}

export function initDemoLabelHint(containerId: string): void
{
	const container: HTMLElement | null = document.getElementById(containerId);
	const labelNode: HTMLElement | null = container?.querySelector(LABEL_SELECTOR) ?? null;
	const text: string | null | undefined = Loc.getMessage(HINT_TEXT_PHRASE);

	if (labelNode === null || !Type.isStringFilled(text))
	{
		return;
	}

	const closeLabel: string = Loc.getMessage(HINT_CLOSE_PHRASE) ?? '';
	const content: HTMLElement = document.createElement('div');
	content.className = 'ui-hint-content';

	let autoShowTimeoutId: number | null = null;

	// any close is an explicit dismissal: the pending auto-show must not reopen the hint
	const cancelAutoShow = (): void => {
		if (autoShowTimeoutId !== null)
		{
			clearTimeout(autoShowTimeoutId);
			autoShowTimeoutId = null;
		}
	};

	const hint = Hint.createInstance({
		id: HINT_POPUP_ID,
		content,
		popupParameters: {
			className: HINT_POPUP_CLASS,
			role: 'presentation',
			closeByEsc: true,
			autoHide: true,
			events: {
				onPopupClose: cancelAutoShow,
			},
		},
	});
	const html: string = renderHintHtml(text, closeLabel);

	hint.initOwnerDocument(labelNode);

	const show = (): void => {
		if (!labelNode.isConnected)
		{
			return;
		}

		hint.show(labelNode, html, ANGLE_CENTERED_ON_POPUP);
	};

	const isInsideHint = (node: EventTarget | null): boolean => {
		const popupContainer: HTMLElement | null = PopupManager.getPopupById(HINT_POPUP_ID)?.getPopupContainer() ?? null;

		return node instanceof Node && popupContainer !== null && popupContainer.contains(node);
	};

	// close by the cross: no anchor, so the popup closes at once,
	// skipping the interactivity delay for the cursor inside the popup
	Event.bind(content, 'click', (event: MouseEvent) => {
		if ((event.target as HTMLElement).closest(CLOSE_SELECTOR))
		{
			hint.hide();
		}
	});

	// the keyboard leaves the hint through its own controls, not through the label
	Event.bind(content, 'focusout', (event: FocusEvent) => {
		const nextFocused: EventTarget | null = event.relatedTarget;

		if (nextFocused === labelNode || isInsideHint(nextFocused))
		{
			return;
		}

		hint.hide();
	});

	Event.bind(labelNode, 'mouseenter', show);
	Event.bind(labelNode, 'mouseleave', () => hint.hide(labelNode));
	Event.bind(labelNode, 'focus', show);
	Event.bind(labelNode, 'blur', (event: FocusEvent) => {
		if (isInsideHint(event.relatedTarget))
		{
			return;
		}

		hint.hide(labelNode);
	});

	autoShowTimeoutId = setTimeout(() => {
		autoShowTimeoutId = null;
		show();
	}, AUTO_SHOW_DELAY_MS);
}
