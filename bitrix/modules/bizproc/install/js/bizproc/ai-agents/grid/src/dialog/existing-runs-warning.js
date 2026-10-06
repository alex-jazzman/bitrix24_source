import { Dom, Loc, Runtime, Tag, Type } from 'main.core';
import { FocusTrap } from 'ui.a11y';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Text as TypographyText } from 'ui.system.typography';

import { withTimeout } from '../api';
import { EXISTING_RUNS_WARNING_OUTCOME } from '../constants';
import type { ExistingRunsWarningOutcome } from '../types';

const DIALOG_EXTENSION = 'ui.system.dialog';
const DIALOG_WIDTH = 480;
const DIALOG_CONTAINER_SELECTOR = '.ui-system-dialog';
const DIALOG_CLOSE_BUTTON_SELECTOR = '.ui-system-dialog__header-close-btn';

const TEST_ID = {
	DIALOG: 'bizproc-ai-agents-grid-existing-runs-warning-dialog',
	CONTENT: 'bizproc-ai-agents-grid-existing-runs-warning',
	CLOSE: 'bizproc-ai-agents-grid-existing-runs-warning-close',
	VIEW: 'bizproc-ai-agents-grid-existing-runs-warning-view',
	LAUNCH: 'bizproc-ai-agents-grid-existing-runs-warning-launch',
};

// Above the loader's own recovery budget (three retries with 1 + 3 + 5 s backoff) so a slow load
// that would still succeed is never cut short - the single show of the warning is already paid for
// on the server. Bounded all the same: a load that never settles would otherwise hold the
// page-level launch guard until a reload.
const DIALOG_LOAD_TIMEOUT = 20000;

// ui.system.dialog is loaded on demand: the warning is shown at most once per user, so its
// classes are described locally instead of being imported (a static import would put the
// extension back into the grid dependencies).
type DialogExtensionExports = { Dialog: Function };

/**
 * No promise cache around the loader: it deduplicates parallel loads by itself, while a cached
 * rejection would make the single show of the warning unrecoverable - the right to show it is
 * already spent on the server by the time the dialog is loaded.
 *
 * The wait is bounded because the loader can leave its promise unsettled forever (a failed assets
 * batch rejects outside the promise chain), and an unsettled load never releases the caller's
 * finally. Only the load is bounded: the shown dialog waits for the user for as long as it takes.
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

const renderContent = (): HTMLElement => {
	const message = TypographyText.render(
		Loc.getMessage('BIZPROC_AI_AGENTS_GRID_EXISTING_RUNS_WARNING_TEXT'),
		{ size: 'md', tag: 'div' },
	);

	const content = Tag.render`<div class="bizproc-ai-agents__existing-runs-warning">${message}</div>`;
	Dom.attr(content, 'data-test-id', TEST_ID.CONTENT);

	return content;
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
 * shared close phrase of ui.buttons. An existing name is left alone: naming the cross belongs to the
 * component, and once it does so its own label must win.
 *
 * The cross comes from the component too, so its test marker is set from here as well - it is the
 * only cancel control of the layout an e2e test can click.
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
 * ui.system.dialog builds its popup options internally and gives no way to enable focus
 * retention from outside, and a dialog without an overlay is not modal by default - so the trap
 * is attached to the rendered popup container instead of relying on the portal accessibility
 * setting.
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
 * One-off warning about agents already running from the same system template. Resolves with the
 * chosen outcome; closing the dialog by the cross, Esc or a click outside cancels the launch.
 *
 * Rejects when the dialog cannot be loaded or rendered - the caller falls back to the standard
 * launch, so the failure must not be swallowed here.
 */
export const showExistingRunsWarning = async (): Promise<ExistingRunsWarningOutcome> => {
	const Dialog = await loadDialogClass();
	const content = renderContent();
	const title = Loc.getMessage('BIZPROC_AI_AGENTS_GRID_EXISTING_RUNS_WARNING_TITLE');

	return new Promise((resolve) => {
		let outcome: ExistingRunsWarningOutcome = EXISTING_RUNS_WARNING_OUTCOME.CANCELLED;
		let focusTrap: ?FocusTrap = null;
		let dialog = null;

		const chooseOutcome = (chosen: ExistingRunsWarningOutcome): void => {
			outcome = chosen;
			dialog.hide();
		};

		dialog = new Dialog({
			// The header carries the cross of the layout: ui.system.dialog hides the whole header
			// while its left part is empty, so without a title the dialog has no close control at all.
			title,
			content,
			centerButtons: [
				createButton(
					'BIZPROC_AI_AGENTS_GRID_EXISTING_RUNS_WARNING_BUTTON_VIEW',
					AirButtonStyle.FILLED,
					TEST_ID.VIEW,
					() => chooseOutcome(EXISTING_RUNS_WARNING_OUTCOME.VIEW_LAUNCHED),
				),
				createButton(
					'BIZPROC_AI_AGENTS_GRID_EXISTING_RUNS_WARNING_BUTTON_LAUNCH',
					AirButtonStyle.OUTLINE,
					TEST_ID.LAUNCH,
					() => chooseOutcome(EXISTING_RUNS_WARNING_OUTCOME.LAUNCH_NEW),
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
					// The outcome is resolved first: a throw while tearing the trap down would otherwise
					// leave the promise unsettled forever, and with it the page-level launch guard.
					resolve(outcome);
					focusTrap?.destroy();
				},
			},
		});

		dialog.show();
	});
};
