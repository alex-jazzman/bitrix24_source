import { Runtime } from 'main.core';
import { BaseEvent } from 'main.core.events';
import { Model } from 'tasks.v2.const';
import type { CheckListModel } from 'tasks.v2.model.check-list';

const emitAddCheckListDebounced = Runtime.debounce((component, checklistString) => {
	component.$emit('addCheckList', checklistString);
}, 500);

// @vue/component
export const DescriptionCheckListMixin = {
	data(): Object
	{
		return {
			isAiCommandProcessing: false,
		};
	},
	computed: {
		checkLists(): CheckListModel[]
		{
			return this.$store.getters[`${Model.CheckList}/getByIds`](this.task.checklist);
		},
	},
	mounted(): void
	{
		this.entityTextEditor.subscribe('addCheckList', this.handleAddCheckList);
	},
	unmounted()
	{
		this.entityTextEditor.unsubscribe('addCheckList', this.handleAddCheckList);
	},
	methods: {
		handleAddCheckList(baseEvent: BaseEvent): void
		{
			this.handleCloseWithCheckList(baseEvent.getData());
		},
		async handleCheckListButtonClick(): Promise<void>
		{
			if (this.isAiCommandProcessing)
			{
				return;
			}

			this.isAiCommandProcessing = true;

			const { CommandExecutor } = await Runtime.loadExtension('ai.command-executor');

			const aiCommandExecutor = new CommandExecutor({
				moduleId: 'tasks',
				contextId: 'tasks_field_checklist',
			});

			const editorText = this.editor.getText() || 'empty';
			const checklistString = await aiCommandExecutor.makeChecklistFromText(editorText);

			this.isAiCommandProcessing = false;

			this.handleCloseWithCheckList(checklistString);
		},
		handleCloseWithCheckList(checklistString: string): void
		{
			emitAddCheckListDebounced(this, checklistString);
		},
	},
};
