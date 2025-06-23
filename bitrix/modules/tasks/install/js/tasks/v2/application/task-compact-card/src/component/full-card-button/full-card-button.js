import { Event } from 'main.core';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';

import { Core } from 'tasks.v2.core';
import { EventName, Model } from 'tasks.v2.const';
import { Hint } from 'tasks.v2.component.elements.hint';
import { checkListMeta } from 'tasks.v2.component.fields.check-list';
import { filesMeta } from 'tasks.v2.component.fields.files';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import { analytics } from 'tasks.v2.lib.analytics';
import { EntityTypes, fileService } from 'tasks.v2.provider.service.file-service';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { CheckListModel } from 'tasks.v2.model.check-list';

import './full-card-button.css';

// @vue/component
export const FullCardButton = {
	components: {
		Hint,
		UiButton,
	},
	inject: ['analytics'],
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		isOpening: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['update:isOpening'],
	setup(props): Object
	{
		return {
			AirButtonStyle,
			ButtonSize,
			fileService: fileService.get(props.taskId),
		};
	},
	data(): Object
	{
		return {
			isHintShown: false,
			hintBindElement: null,
		};
	},
	computed: {
		task(): TaskModel
		{
			return this.$store.getters[`${Model.Tasks}/getById`](this.taskId);
		},
		checkLists(): CheckListModel[]
		{
			return this.task?.checklist
				? this.$store.getters[`${Model.CheckList}/getByIds`](this.task.checklist)
				: [];
		},
		isDisabled(): boolean
		{
			return this.isUploading || this.isCheckListUploading;
		},
		isUploading(): boolean
		{
			return this.fileService.isUploading();
		},
		isCheckListUploading(): boolean
		{
			return this.task.checklist?.some((itemId) => fileService.get(itemId, EntityTypes.CheckListItem).isUploading());
		},
	},
	methods: {
		handleClick(): void
		{
			if (this.isUploading)
			{
				this.highlightFiles();
			}
			else if (this.isCheckListUploading)
			{
				this.highlightChecklist();
			}
			else
			{
				this.openFullCard();
			}
		},
		highlightFiles(): void
		{
			this.hintBindElement = fieldHighlighter.setContainer(this.$root.$el).addChipHighlight(filesMeta.id);

			this.showHint();
		},
		highlightChecklist(): void
		{
			this.hintBindElement = fieldHighlighter.setContainer(this.$root.$el).addChipHighlight(checkListMeta.id);

			this.showHint();
		},
		showHint(): void
		{
			const removeHighlight = () => {
				this.isHintShown = false;
				Event.unbind(window, 'keydown', removeHighlight);
			};
			Event.bind(window, 'keydown', removeHighlight);

			this.isHintShown = true;
		},
		openFullCard(): void
		{
			if (this.isOpening)
			{
				return;
			}

			this.$emit('update:isOpening', true);

			const features = Core.getParams().features;
			analytics.sendOpenFullCard(this.analytics);
			if (features.isMiniformEnabled && !features.isV2Enabled)
			{
				Event.EventEmitter.emit(`${EventName.OpenSliderCard}:${this.taskId}`, {
					task: this.task,
					checkLists: this.checkLists,
				});
			}
			else
			{
				Event.EventEmitter.emit(`${EventName.OpenFullCard}:${this.taskId}`, this.taskId);
			}
		},
	},
	template: `
		<div
			class="tasks-compact-card-full-button-container"
			:class="{ '--disabled': isDisabled }"
			@click="handleClick"
		>
			<UiButton
				class="tasks-compact-card-full-button"
				:text="loc('TASKS_V2_TCC_FULL_CARD_BTN')"
				:size="ButtonSize.SMALL"
				:style="AirButtonStyle.PLAIN_NO_ACCENT"
				:loading="isOpening"
				:dataset="{taskButtonId: 'full'}"
				:disabled="isDisabled"
			/>
		</div>
		<Hint
			v-if="isHintShown"
			:bindElement="hintBindElement"
			@close="isHintShown = false"
		>
			{{ loc('TASKS_V2_TCC_FILE_IS_UPLOADING') }}
		</Hint>
	`,
};
