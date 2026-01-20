import { Runtime } from 'main.core';
import { EventName, Model } from 'tasks.v2.const';
import type { CheckListModel } from 'tasks.v2.model.check-list';

// @vue/component
export const DescriptionMixin = {
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
	methods: {
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

			this.handleClose();

			setTimeout(() => {
				this.$bitrix.eventEmitter.emit(EventName.AiAddCheckList, checklistString);
			}, 500);
		},
		handleClose(): void
		{
			this.$emit('close');
		},
	},
};
