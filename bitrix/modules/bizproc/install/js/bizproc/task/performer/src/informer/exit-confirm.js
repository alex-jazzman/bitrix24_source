import { Loc } from 'main.core';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Dialog } from 'ui.system.dialog';
import { Text } from 'ui.system.typography';

import { setupDialogA11y, type DialogA11yHandle } from './dialog-a11y';

const MESSAGE_TITLE = 'BIZPROC_JS_TASK_PERFORMER_EXIT_CONFIRM_TITLE';
const MESSAGE_TEXT = 'BIZPROC_JS_TASK_PERFORMER_EXIT_CONFIRM_TEXT';
const MESSAGE_EXIT = 'BIZPROC_JS_TASK_PERFORMER_EXIT_CONFIRM_EXIT';
const MESSAGE_STAY = 'BIZPROC_JS_TASK_PERFORMER_EXIT_CONFIRM_STAY';

const DIALOG_WIDTH = 470;

const TEST_ID = {
	dialog: 'bizproc-performer-exit-confirm',
	exit: 'bizproc-performer-exit-confirm-exit',
	stay: 'bizproc-performer-exit-confirm-stay',
};

/**
 * Asks whether the person really leaves the pass: `true` for leaving, `false` for staying. Staying is
 * the answer of every other way out of the question - Esc, a click outside - so a pass never ends by
 * an accident of the interface.
 *
 * Leaving ends the pass where it stands: the tasks already performed keep their decisions, the ones
 * behind them stay in the list awaiting theirs. Nothing is rolled back and nothing is decided here -
 * the surface that asked walks the person back to the very task they were on.
 */
export function confirmExit(): Promise<boolean>
{
	return new Promise((resolve) => {
		const title = Loc.getMessage(MESSAGE_TITLE);
		const content = Text.render(Loc.getMessage(MESSAGE_TEXT), { size: 'md', tag: 'div' });

		let isConfirmed = false;
		let a11yDialog: ?DialogA11yHandle = null;

		const dialog = new Dialog({
			title,
			content,
			width: DIALOG_WIDTH,
			hasOverlay: true,
			// the question has exactly two answers, and one of them already is "stay": a cross next to
			// them would be a third way of saying the same thing
			hasCloseButton: false,
			leftButtons: [
				new Button({
					text: Loc.getMessage(MESSAGE_EXIT),
					useAirDesign: true,
					size: ButtonSize.LARGE,
					style: AirButtonStyle.FILLED,
					dataset: { testid: TEST_ID.exit },
					onclick: () => {
						isConfirmed = true;
						dialog.hide();
					},
				}),
				new Button({
					text: Loc.getMessage(MESSAGE_STAY),
					useAirDesign: true,
					size: ButtonSize.LARGE,
					style: AirButtonStyle.PLAIN,
					// staying is the safe answer, so the keyboard starts on it
					dataset: { testid: TEST_ID.stay, autofocus: '' },
					onclick: () => {
						dialog.hide();
					},
				}),
			],
			events: {
				onAfterShow: () => {
					a11yDialog = setupDialogA11y(content, { label: title, testId: TEST_ID.dialog });
				},
				onHide: () => {
					// the answer goes out first: a throw while tearing the trap down would otherwise
					// leave the pass waiting for an answer that never comes
					resolve(isConfirmed);
					a11yDialog?.destroy();
				},
			},
		});

		dialog.show();
	});
}
