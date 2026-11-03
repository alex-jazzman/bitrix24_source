import { Dom, Loc, Runtime, Tag, Type } from 'main.core';
import { FocusTrap } from 'ui.a11y';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { TagSelector } from 'ui.entity-selector';
import { Text as TypographyText } from 'ui.system.typography';

import { withTimeout } from '../api';
import { CHANGE_OWNER_DIALOG_OUTCOME } from '../constants';
import type { ChangeOwnerDialogResult } from '../types';

const DIALOG_EXTENSION = 'ui.system.dialog';
const DIALOG_WIDTH = 480;
const DIALOG_CONTAINER_SELECTOR = '.ui-system-dialog';
const DIALOG_CLOSE_BUTTON_SELECTOR = '.ui-system-dialog__header-close-btn';

const SELECTOR_ENTITY_USER = 'user';
const SELECTOR_CONTEXT = 'BIZPROC_AI_AGENTS_GRID_CHANGE_OWNER';
const SELECTOR_WIDTH = 440;
const SELECTOR_HEIGHT = 250;

const TEST_ID = {
	DIALOG: 'bizproc-ai-agents-grid-change-owner-dialog',
	CONTENT: 'bizproc-ai-agents-grid-change-owner',
	CLOSE: 'bizproc-ai-agents-grid-change-owner-close',
	WARNING: 'bizproc-ai-agents-grid-change-owner-warning',
	SELECTOR: 'bizproc-ai-agents-grid-change-owner-selector',
	ERROR: 'bizproc-ai-agents-grid-change-owner-error',
	CONFIRM: 'bizproc-ai-agents-grid-change-owner-confirm',
	CANCEL: 'bizproc-ai-agents-grid-change-owner-cancel',
};

// Same budget as the existing runs warning: above the loader's own three retries (1 + 3 + 5 s
// backoff), so a slow but succeeding load is not cut short, and still bounded - a load that never
// settles would otherwise hold the caller's action forever.
const DIALOG_LOAD_TIMEOUT = 20000;

// ui.system.dialog is loaded on demand: the transfer is a rare action, so its classes are
// described locally instead of being imported (a static import would put the extension back into
// the grid dependencies).
type DialogExtensionExports = { Dialog: Function };

const CANCELLED_RESULT: ChangeOwnerDialogResult = Object.freeze({
	outcome: CHANGE_OWNER_DIALOG_OUTCOME.CANCELLED,
	userId: null,
});

/**
 * No promise cache around the loader: it deduplicates parallel loads by itself, while a cached
 * rejection would keep the transfer unavailable until a page reload.
 *
 * The wait is bounded because the loader can leave its promise unsettled forever (a failed assets
 * batch rejects outside the promise chain). Only the load is bounded: the shown dialog waits for
 * the user for as long as it takes.
 */
const loadDialogClass = async (): Promise<Function> => {
	const { Dialog }: DialogExtensionExports = await withTimeout(
		Runtime.loadExtension(DIALOG_EXTENSION),
		DIALOG_LOAD_TIMEOUT,
	);

	if (!Type.isFunction(Dialog))
	{
		throw new Error(`${DIALOG_EXTENSION} is loaded but exports no Dialog`);
	}

	return Dialog;
};

const renderWarning = (): HTMLElement => {
	const warning = TypographyText.render(
		Loc.getMessage('BIZPROC_AI_AGENTS_GRID_CHANGE_OWNER_WARNING'),
		{ size: 'md', tag: 'div' },
	);

	Dom.attr(warning, 'data-test-id', TEST_ID.WARNING);

	return warning;
};

/**
 * The validation message lives in a live region that is present from the start and empty until the
 * confirmation is attempted without a recipient - a region inserted together with its text is not
 * announced by screen readers.
 */
const renderError = (): HTMLElement => {
	const error = TypographyText.render('', {
		size: 'sm',
		tag: 'div',
		className: 'bizproc-ai-agents__change-owner-error',
	});

	Dom.attr(error, 'data-test-id', TEST_ID.ERROR);
	Dom.attr(error, 'role', 'alert');

	return error;
};

const createUserSelector = (onSelect: () => void): TagSelector => {
	return new TagSelector({
		multiple: false,
		showCreateButton: false,
		placeholder: Loc.getMessage('BIZPROC_AI_AGENTS_GRID_CHANGE_OWNER_SELECTOR_PLACEHOLDER'),
		addButtonCaption: Loc.getMessage('BIZPROC_AI_AGENTS_GRID_CHANGE_OWNER_SELECTOR_ADD_BUTTON'),
		dialogOptions: {
			context: SELECTOR_CONTEXT,
			multiple: false,
			showAvatars: true,
			dropdownMode: true,
			compactView: true,
			width: SELECTOR_WIDTH,
			height: SELECTOR_HEIGHT,
			entities: [
				{
					id: SELECTOR_ENTITY_USER,
					options: { inviteEmployeeLink: false },
				},
			],
		},
		events: {
			onAfterTagAdd: onSelect,
		},
	});
};

/**
 * Departments are not offered by the selector, so a tag of another entity can only appear if the
 * selector configuration changes - such a tag is not a recipient and is ignored here.
 */
const getSelectedUserId = (tagSelector: TagSelector): ?number => {
	const [tag] = tagSelector.getTags();

	if (!tag || tag.getEntityId() !== SELECTOR_ENTITY_USER)
	{
		return null;
	}

	const userId = Number.parseInt(tag.getId(), 10);

	return userId > 0 ? userId : null;
};

const createButton = (phraseCode: string, style: string, testId: string, onclick: () => void): Button => {
	const button = new Button({
		text: Loc.getMessage(phraseCode),
		size: ButtonSize.LARGE,
		style,
		useAirDesign: true,
		onclick,
	});

	Dom.attr(button.getContainer(), 'data-test-id', testId);

	return button;
};

/**
 * ui.system.dialog renders its cross as an icon-only button without an accessible name, and the
 * title makes that cross the first stop of the dialog's Tab order - so it is named here, with the
 * shared close phrase of ui.buttons. An existing name is left alone: naming the cross belongs to
 * the component, and once it does so its own label must win.
 *
 * The cross comes from the component too, so its test marker is set from here as well.
 */
const prepareCloseButton = (container: HTMLElement): void => {
	const closeButton = container.querySelector(DIALOG_CLOSE_BUTTON_SELECTOR);

	if (!closeButton)
	{
		return;
	}

	Dom.attr(closeButton, 'data-test-id', TEST_ID.CLOSE);

	if (Type.isStringFilled(Dom.attr(closeButton, 'aria-label')))
	{
		return;
	}

	Dom.attr(closeButton, 'aria-label', Loc.getMessage('UI_BUTTONS_CLOSE_BTN_TEXT'));
};

/**
 * ui.system.dialog builds its popup options internally and gives no way to enable focus retention
 * from outside, so the trap is attached to the rendered popup container. The selector dropdown is
 * driven from the text box inside the container (arrow keys and typing), so it stays reachable
 * with the trap active.
 */
const trapFocus = (container: HTMLElement): FocusTrap => {
	const focusTrap = new FocusTrap(container, {
		initialFocus: 'first-tabbable',
		restoreFocus: true,
	});

	focusTrap.activate();

	return focusTrap;
};

/**
 * Asks for the employee the launched agent is handed over to and confirms the transfer. Shows the
 * warning about the transfer being irreversible in every scenario and resolves with the chosen
 * recipient; the cross, Esc, a click outside and the cancel button all resolve with a cancellation
 * and leave the agent alone. The request itself belongs to the caller.
 *
 * Rejects when the dialog cannot be loaded or rendered - the caller reports the failure, so it
 * must not be swallowed here.
 */
export const showChangeOwnerDialog = async (): Promise<ChangeOwnerDialogResult> => {
	const Dialog = await loadDialogClass();
	const title = Loc.getMessage('BIZPROC_AI_AGENTS_GRID_CHANGE_OWNER_TITLE');

	const error = renderError();
	const selectorContainer = Tag.render`<div></div>`;
	Dom.attr(selectorContainer, 'data-test-id', TEST_ID.SELECTOR);

	const content = Tag.render`
		<div class="bizproc-ai-agents__change-owner">
			${renderWarning()}
			${selectorContainer}
			${error}
		</div>
	`;
	Dom.attr(content, 'data-test-id', TEST_ID.CONTENT);

	const tagSelector = createUserSelector(() => {
		error.textContent = '';
	});
	tagSelector.renderTo(selectorContainer);

	return new Promise((resolve) => {
		let result: ChangeOwnerDialogResult = CANCELLED_RESULT;
		let focusTrap: ?FocusTrap = null;
		let dialog = null;

		const confirm = (): void => {
			const userId = getSelectedUserId(tagSelector);

			if (!userId)
			{
				error.textContent = Loc.getMessage('BIZPROC_AI_AGENTS_GRID_CHANGE_OWNER_NO_RECIPIENT_ERROR');

				// The selector is shown without its text box, and a hidden box takes no focus - so the
				// keyboard goes to the add button, the same target the component itself falls back to
				// while the box is hidden.
				tagSelector.getAddButtonLink().focus();

				return;
			}

			result = { outcome: CHANGE_OWNER_DIALOG_OUTCOME.CONFIRMED, userId };
			dialog.hide();
		};

		dialog = new Dialog({
			// The header carries the cross of the layout: ui.system.dialog hides the whole header
			// while its left part is empty, so without a title the dialog has no close control at all.
			title,
			content,
			centerButtons: [
				createButton(
					'BIZPROC_AI_AGENTS_GRID_CHANGE_OWNER_BUTTON_CONFIRM',
					AirButtonStyle.FILLED,
					TEST_ID.CONFIRM,
					confirm,
				),
				createButton(
					'BIZPROC_AI_AGENTS_GRID_CHANGE_OWNER_BUTTON_CANCEL',
					AirButtonStyle.PLAIN,
					TEST_ID.CANCEL,
					() => dialog.hide(),
				),
			],
			width: DIALOG_WIDTH,
			events: {
				onAfterShow: () => {
					const container = content.closest(DIALOG_CONTAINER_SELECTOR);

					if (!container)
					{
						return;
					}

					// ui.system.dialog renders the title as a heading inside the popup but leaves the
					// role=dialog container itself unnamed, so the name is set here.
					Dom.attr(container, 'aria-label', title);
					Dom.attr(container, 'data-test-id', TEST_ID.DIALOG);
					prepareCloseButton(container);

					focusTrap = trapFocus(container);
				},
				onHide: () => {
					// The outcome is resolved first: a throw while tearing the selector or the trap
					// down would otherwise leave the promise unsettled forever.
					resolve(result);
					tagSelector.getDialog()?.destroy();
					focusTrap?.destroy();
				},
			},
		});

		dialog.show();
	});
};
