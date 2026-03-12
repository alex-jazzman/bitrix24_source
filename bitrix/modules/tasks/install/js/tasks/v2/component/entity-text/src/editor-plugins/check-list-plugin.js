import { Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Button, BasePlugin, Commands } from 'ui.text-editor';
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
						this.#eventEmitter.emit('checkListButtonClick', selection.getTextContent());

						this.getEditor().blur();
						this.getEditor().dispatchCommand(Commands.HIDE_DIALOG_COMMAND);
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
