import { Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Button, BasePlugin } from 'ui.text-editor';
import { $getSelection, $getPreviousSelection, $isRangeSelection } from 'ui.lexical.core';

export const CHECK_LIST_BUTTON = 'tasks-check-list-button';

export class CheckListPlugin extends BasePlugin
{
	#eventEmitter: EventEmitter;

	constructor(editor)
	{
		super(editor);

		this.#eventEmitter = new EventEmitter();
		this.#eventEmitter.setEventNamespace('Tasks.V2.Component.EntityTextEditor.CheckListPlugin');

		this.getEditor().getComponentRegistry().register(CHECK_LIST_BUTTON, () => {
			const button = new Button();
			button.setContent('<div class="ui-icon-set --o-move-to-checklist"></div>');
			button.setTooltip(Loc.getMessage('TASKS_V2_ENTITY_TEXT_PLUGIN_TITLE_CHECK_LIST'));
			button.subscribe('onClick', () => {
				this.getEditor().update(() => {
					const selection = $getSelection() || $getPreviousSelection();
					if ($isRangeSelection(selection))
					{
						// Keep the toolbar open so the picker can anchor to the live button.
						// It closes on CheckListAddFromTextResolved, not on this click.
						this.#eventEmitter.emit('checkListButtonClick', {
							text: selection.getTextContent(),
							// Live node stays valid while the toolbar is open; the popup recomputes position.
							anchor: button.getContainer(),
						});
					}
				});
			});

			return button;
		});
	}

	static getName(): string
	{
		return 'TasksCheckList';
	}

	getEmitter(): EventEmitter
	{
		return this.#eventEmitter;
	}
}
