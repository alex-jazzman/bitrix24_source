import { Dom, Loc, Tag, Type } from 'main.core';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Dialog } from 'ui.system.dialog';
import { Illustration, IllustrationName } from 'ui.system.illustration';
import { Text } from 'ui.system.typography';

import { SimilarChoice, type SimilarChoiceValue } from '../rule/similar-rule';
import { setupDialogA11y, type DialogA11yHandle } from './dialog-a11y';
import { confirmExit } from './exit-confirm';
import { taskName, type InformerTask } from './similar-list';

import './similar-informer.css';

const MESSAGE_TITLE = 'BIZPROC_JS_TASK_PERFORMER_SIMILAR_TITLE';
const MESSAGE_COUNT = 'BIZPROC_JS_TASK_PERFORMER_SIMILAR_COUNT';
const MESSAGE_HINT = 'BIZPROC_JS_TASK_PERFORMER_SIMILAR_HINT';
const MESSAGE_APPLY_TO_ALL = 'BIZPROC_JS_TASK_PERFORMER_SIMILAR_APPLY_TO_ALL';
const MESSAGE_ONE_BY_ONE = 'BIZPROC_JS_TASK_PERFORMER_SIMILAR_ONE_BY_ONE';
const MESSAGE_SHOW_LIST = 'BIZPROC_JS_TASK_PERFORMER_SIMILAR_SHOW_LIST';

const TEST_ID = {
	dialog: 'bizproc-performer-similar-informer',
	name: 'bizproc-performer-similar-name',
	count: 'bizproc-performer-similar-count',
	applyToAll: 'bizproc-performer-similar-apply-to-all',
	oneByOne: 'bizproc-performer-similar-one-by-one',
	showList: 'bizproc-performer-similar-show-list',
	close: 'bizproc-performer-similar-close',
};

const DIALOG_WIDTH = 480;
const ILLUSTRATION_SIZE = 128;

/**
 * Tells the person that the task just performed is not the only one of its kind and asks what to do
 * with the rest: repeat the decision for the whole group, go through the group task by task, or look
 * at the group first and split it by hand.
 *
 * Closing the dialog is a request to leave the pass rather than an answer about the group: it is
 * confirmed apart, and a confirmed one comes back as {@see SimilarChoice.Cancel} for the rule to end
 * the pass by. Staying brings the question back - nothing about the group is decided behind the
 * person's back.
 *
 * @param group The tasks similar to the performed one, the performed one excluded.
 */
export async function askSimilar(group: Array<InformerTask>): Promise<SimilarChoiceValue>
{
	const tasks = Type.isArray(group) ? group.filter((task) => Type.isPlainObject(task)) : [];

	// nothing to repeat a decision for, so there is nothing to ask about either
	return tasks.length > 0 ? askUntilAnswered(tasks) : SimilarChoice.OneByOne;
}

/**
 * The dialog of the design system builds its popup as a single show, so staying in the pass brings the
 * question back as a new dialog instead of reopening the closed one.
 */
async function askUntilAnswered(tasks: Array<InformerTask>): Promise<SimilarChoiceValue>
{
	for (;;)
	{
		// eslint-disable-next-line no-await-in-loop
		const choice = await showPrompt(tasks);

		if (choice)
		{
			return choice;
		}

		// `confirmExit` is a dialog of the design system, not the native `confirm`
		// eslint-disable-next-line no-await-in-loop, @bitrix24/bitrix24-rules/no-native-dialogs
		const isLeaving = await confirmExit();

		if (isLeaving)
		{
			return SimilarChoice.Cancel;
		}
	}
}

/**
 * Shows the question once and answers with the choice of the person, or with nothing at all when the
 * dialog was closed - by the cross, by Esc or by a click outside.
 */
function showPrompt(tasks: Array<InformerTask>): Promise<?SimilarChoiceValue>
{
	return new Promise((resolve) => {
		const title = Loc.getMessage(MESSAGE_TITLE);

		let choice: ?SimilarChoiceValue = null;
		let a11yDialog: ?DialogA11yHandle = null;
		let dialog: ?Dialog = null;

		const chooseAndClose = (chosen: SimilarChoiceValue): void => {
			choice = chosen;
			dialog?.hide();
		};

		const content = renderContent(tasks, () => chooseAndClose(SimilarChoice.ShowList));

		dialog = new Dialog({
			title,
			content,
			width: DIALOG_WIDTH,
			hasOverlay: true,
			leftButtons: [
				createChoiceButton({
					message: MESSAGE_APPLY_TO_ALL,
					style: AirButtonStyle.FILLED,
					testId: TEST_ID.applyToAll,
					// the person came here from a decision, so the keyboard starts on repeating it
					isDefault: true,
					onclick: () => chooseAndClose(SimilarChoice.ApplyToAll),
				}),
				createChoiceButton({
					message: MESSAGE_ONE_BY_ONE,
					style: AirButtonStyle.PLAIN,
					testId: TEST_ID.oneByOne,
					onclick: () => chooseAndClose(SimilarChoice.OneByOne),
				}),
			],
			events: {
				onAfterShow: () => {
					a11yDialog = setupDialogA11y(content, {
						label: title,
						testId: TEST_ID.dialog,
						closeTestId: TEST_ID.close,
					});
				},
				onHide: () => {
					// the answer goes out first: a throw while tearing the trap down would otherwise
					// leave the pass waiting for an answer that never comes
					resolve(choice);
					a11yDialog?.destroy();
				},
			},
		});

		dialog.show();
	});
}

/**
 * The two decisions about the group stay in the footer, and looking at the group first lives in the
 * content: three buttons of the layout in one row do not fit the width of the dialog - the row scrolls
 * sideways and the last of them is cut off. Where it stands also says what it is: an answer about the
 * group is a decision, looking at it first is not.
 */
function renderContent(tasks: Array<InformerTask>, onShowList: () => void): HTMLElement
{
	const illustration = new Illustration({
		name: IllustrationName.DOCUMENTS_STACK,
		size: ILLUSTRATION_SIZE,
	});

	return Tag.render`
		<div class="bizproc-task-performer-similar-informer">
			${illustration.render()}
			${renderGroupName(tasks)}
			${renderGroupCount(tasks.length)}
			${renderHint()}
			${renderShowList(onShowList)}
		</div>
	`;
}

function renderShowList(onShowList: () => void): HTMLElement
{
	const button = createChoiceButton({
		message: MESSAGE_SHOW_LIST,
		style: AirButtonStyle.PLAIN_ACCENT,
		testId: TEST_ID.showList,
		onclick: onShowList,
	});

	return Tag.render`
		<div class="bizproc-task-performer-similar-informer__show-list">${button.render()}</div>
	`;
}

/**
 * The group is named by the name of its tasks: the tasks of one group share a hash, and with it the
 * name the person reads. The technical name of the activity names no group in front of anyone, so it
 * stays out of the text.
 *
 * The name comes from the row of the list (DTO-02) and lands in `textContent`, which is where it gets
 * encoded - it is never interpolated into markup.
 */
function renderGroupName(tasks: Array<InformerTask>): HTMLElement
{
	const name = Text.render(taskName(tasks[0]), {
		tag: 'div',
		size: 'lg',
		accent: true,
		align: 'center',
		className: 'bizproc-task-performer-similar-informer__name',
	});

	Dom.attr(name, 'data-testid', TEST_ID.name);

	return name;
}

function renderGroupCount(count: number): HTMLElement
{
	const counter = Text.render(Loc.getMessagePlural(MESSAGE_COUNT, count, { '#COUNT#': count }), {
		tag: 'div',
		size: 'md',
		align: 'center',
		className: 'bizproc-task-performer-similar-informer__count',
	});

	Dom.attr(counter, 'data-testid', TEST_ID.count);

	return counter;
}

function renderHint(): HTMLElement
{
	return Text.render(Loc.getMessage(MESSAGE_HINT), {
		tag: 'div',
		size: 'sm',
		align: 'center',
		className: 'bizproc-task-performer-similar-informer__hint',
	});
}

type ChoiceButtonOptions = {
	message: string,
	style: string,
	testId: string,
	isDefault?: boolean,
	onclick: () => void,
};

function createChoiceButton(options: ChoiceButtonOptions): Button
{
	const dataset = { testid: options.testId };

	if (options.isDefault === true)
	{
		dataset.autofocus = '';
	}

	return new Button({
		text: Loc.getMessage(options.message),
		useAirDesign: true,
		size: ButtonSize.LARGE,
		style: options.style,
		dataset,
		onclick: options.onclick,
	});
}
