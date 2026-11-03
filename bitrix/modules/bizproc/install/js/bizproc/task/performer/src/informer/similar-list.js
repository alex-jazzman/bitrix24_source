import { Dom, Loc, Tag, Type } from 'main.core';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Checkbox, CheckboxSize } from 'ui.system.checkbox';
import { Dialog } from 'ui.system.dialog';
import { Text } from 'ui.system.typography';

import { type RuleTask } from '../rule/batch-rule';
import { type SimilarGroupSplit } from '../rule/similar-rule';
import { setupDialogA11y, type DialogA11yHandle } from './dialog-a11y';

import './similar-list.css';

const MESSAGE_TITLE = 'BIZPROC_JS_TASK_PERFORMER_SIMILAR_LIST_TITLE';
const MESSAGE_APPLY = 'BIZPROC_JS_TASK_PERFORMER_SIMILAR_LIST_APPLY';
const MESSAGE_ONE_BY_ONE = 'BIZPROC_JS_TASK_PERFORMER_SIMILAR_LIST_ONE_BY_ONE';
const MESSAGE_TASK = 'BIZPROC_JS_TASK_PERFORMER_SIMILAR_LIST_TASK';

const DIALOG_WIDTH = 560;

const TEST_ID = {
	dialog: 'bizproc-performer-similar-list',
	row: 'bizproc-performer-similar-list-row',
	name: 'bizproc-performer-similar-list-name',
	mark: 'bizproc-performer-similar-list-mark',
	apply: 'bizproc-performer-similar-list-apply',
	oneByOne: 'bizproc-performer-similar-list-one-by-one',
	close: 'bizproc-performer-similar-list-close',
};

/**
 * A task of the group as the surfaces of the informer layer read it: everything a rule tells the
 * tasks apart by, plus the fields the person is shown. The mechanics hands the surfaces the whole row
 * description (DTO-02), so a surface reads more of a task than a rule does - but never more than the
 * row really has, hence the display fields are optional here.
 */
export type InformerTask = RuleTask & {
	name?: string,
	description?: string,
	activity?: ?string,
};

/**
 * The tasks of the group with a mark on each: the person leaves marked the tasks the decision repeats
 * for and sends the rest to be opened one by one. Answers with the group split in two - the surface
 * adds no task to the pass and loses none of the ones it was given.
 *
 * Closing the list without choosing is not a decision about the group: it goes on task by task, so
 * nothing is performed on the strength of marks the person never confirmed.
 */
export class SimilarList
{
	#tasks: Array<InformerTask>;
	#markedTasks: Set<InformerTask>;
	#dialog: ?Dialog = null;
	#applyButton: ?Button = null;
	#a11yDialog: ?DialogA11yHandle = null;
	#split: ?SimilarGroupSplit = null;
	#resolve: ?Function = null;

	/**
	 * @param group The tasks of the group, in the order of the rows of the list.
	 */
	static ask(group: Array<InformerTask>): Promise<SimilarGroupSplit>
	{
		return new SimilarList(group).#ask();
	}

	constructor(group: Array<InformerTask>)
	{
		this.#tasks = Type.isArray(group) ? group.filter((task) => Type.isPlainObject(task)) : [];
		// one decision for the whole group is the frequent case, so the group starts fully marked
		this.#markedTasks = new Set(this.#tasks);
	}

	#ask(): Promise<SimilarGroupSplit>
	{
		if (this.#tasks.length === 0)
		{
			return Promise.resolve({ selected: [], rest: [] });
		}

		return new Promise((resolve) => {
			this.#resolve = resolve;
			this.#dialog = this.#createDialog();
			this.#dialog.show();
		});
	}

	#createDialog(): Dialog
	{
		const title = Loc.getMessage(MESSAGE_TITLE);

		this.#applyButton = new Button({
			text: Loc.getMessage(MESSAGE_APPLY),
			useAirDesign: true,
			size: ButtonSize.LARGE,
			style: AirButtonStyle.FILLED,
			dataset: { testid: TEST_ID.apply, autofocus: '' },
			onclick: () => {
				this.#close(this.#splitByMarks());
			},
		});

		const content = this.#renderList();

		return new Dialog({
			title,
			content,
			width: DIALOG_WIDTH,
			hasOverlay: true,
			leftButtons: [
				this.#applyButton,
				new Button({
					text: Loc.getMessage(MESSAGE_ONE_BY_ONE),
					useAirDesign: true,
					size: ButtonSize.LARGE,
					style: AirButtonStyle.PLAIN,
					dataset: { testid: TEST_ID.oneByOne },
					onclick: () => {
						this.#close(this.#oneByOneSplit());
					},
				}),
			],
			events: {
				onAfterShow: () => {
					this.#a11yDialog = setupDialogA11y(content, {
						label: title,
						testId: TEST_ID.dialog,
						closeTestId: TEST_ID.close,
					});
				},
				onHide: () => {
					// the answer goes out first: a throw while tearing the trap down would otherwise
					// leave the pass waiting for an answer that never comes
					this.#resolve?.(this.#split ?? this.#oneByOneSplit());
					this.#a11yDialog?.destroy();
				},
			},
		});
	}

	/**
	 * The tasks of the group are a list, and saying so is what gives the person the place of a row in
	 * it: with the rows of one group named alike, the position is what tells them apart by ear.
	 */
	#renderList(): HTMLElement
	{
		const list = Tag.render`<div class="bizproc-task-performer-similar-list" role="list"></div>`;

		this.#tasks.forEach((task) => {
			Dom.append(this.#renderRow(task), list);
		});

		return list;
	}

	#renderRow(task: InformerTask): HTMLElement
	{
		const mark = new Checkbox({
			size: CheckboxSize.Md,
			checked: this.#markedTasks.has(task),
			attributes: {
				'aria-label': markLabel(task),
				'data-testid': TEST_ID.mark,
			},
			onChange: ({ checked }) => {
				this.#markTask(task, checked);
			},
		});

		const row = Tag.render`
			<div class="bizproc-task-performer-similar-list__row" role="listitem" data-testid="${TEST_ID.row}">
				${mark.render()}
				<div class="bizproc-task-performer-similar-list__text">
					${renderName(task)}
					${renderDescription(task)}
				</div>
			</div>
		`;

		// the type of a task is the name of its activity - technical, so it stays a mark of the row
		// for whoever reads the DOM instead of becoming text in front of the person
		if (Type.isStringFilled(task.activity))
		{
			Dom.attr(row, 'data-activity', task.activity);
		}

		return row;
	}

	#markTask(task: InformerTask, isMarked: boolean): void
	{
		if (isMarked)
		{
			this.#markedTasks.add(task);
		}
		else
		{
			this.#markedTasks.delete(task);
		}

		// with nothing marked the decision has nothing to repeat for, and the group goes task by task
		this.#applyButton?.setDisabled(this.#markedTasks.size === 0);
	}

	#splitByMarks(): SimilarGroupSplit
	{
		return {
			selected: this.#tasks.filter((task) => this.#markedTasks.has(task)),
			rest: this.#tasks.filter((task) => !this.#markedTasks.has(task)),
		};
	}

	#oneByOneSplit(): SimilarGroupSplit
	{
		return {
			selected: [],
			rest: [...this.#tasks],
		};
	}

	#close(split: SimilarGroupSplit): void
	{
		this.#split = split;
		this.#dialog?.hide();
	}
}

/**
 * The name of the task as the surfaces of this layer give it: decoded (DTO-02) and put into the DOM
 * as text, never as markup. A task the list left without a name is still a task of the group, so it
 * keeps a name to be marked by and to be named by in front of the person.
 */
export function taskName(task: InformerTask): string
{
	return Type.isStringFilled(task.name) ? task.name : Loc.getMessage(MESSAGE_TASK);
}

/**
 * The name the mark of a row is read by. The tasks of one group carry one and the same name - that is
 * what makes them a group - so the name alone tells no row from another: the mark is named by
 * everything the row shows the person.
 */
function markLabel(task: InformerTask): string
{
	const name = taskName(task);

	return Type.isStringFilled(task.description) ? `${name}. ${task.description}` : name;
}

function renderName(task: InformerTask): HTMLElement
{
	const name = Text.render(taskName(task), {
		tag: 'div',
		size: 'md',
		accent: true,
		wrap: 'truncate',
		className: 'bizproc-task-performer-similar-list__name',
	});

	Dom.attr(name, 'data-testid', TEST_ID.name);

	return name;
}

/**
 * The description of the task comes raw from the row (`~DESCRIPTION`), unlike the description of the
 * process, which the server already hands over as safe markup. `Text.render` puts the value into
 * `textContent`, and that is where the encoding of both fields happens: the row never interpolates
 * them into markup.
 */
function renderDescription(task: InformerTask): HTMLElement | string
{
	if (!Type.isStringFilled(task.description))
	{
		return '';
	}

	return Text.render(task.description, {
		tag: 'div',
		size: 'sm',
		wrap: 'truncate',
		className: 'bizproc-task-performer-similar-list__description',
	});
}
