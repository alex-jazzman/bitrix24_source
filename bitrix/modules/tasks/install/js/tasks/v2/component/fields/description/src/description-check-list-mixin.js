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
			let checklistString = null;
			try
			{
				checklistString = await aiCommandExecutor.makeChecklistFromText(editorText);
			}
			catch (errorResult)
			{
				const bindElement = this.$refs.checkListButton?.$el ?? null;
				this.handleBaasError(errorResult, bindElement);
			}

			this.isAiCommandProcessing = false;

			if (checklistString !== null)
			{
				this.handleCloseWithCheckList(checklistString);
			}
		},
		handleCloseWithCheckList(checklistString: string): void
		{
			emitAddCheckListDebounced(this, checklistString);
		},
		async handleBaasError(errorResult, bindElement): void
		{
			const { AjaxErrorHandler } = await Runtime.loadExtension('ai.ajax-error-handler');
			const firstError = errorResult?.errors?.[0];

			AjaxErrorHandler.handleTextGenerateError({
				baasOptions: {
					bindElement,
					context: 'tasks_field_checklist',
					useAngle: false,
				},
				errorCode: firstError?.code ?? 'undefined_error',
				showSliderWithMsg: firstError?.customData?.showSliderWithMsg,
				sliderCode: firstError?.customData?.sliderCode,
			});
		}
	},
};
