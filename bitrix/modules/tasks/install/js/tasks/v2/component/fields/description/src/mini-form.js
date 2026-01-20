import type { TextEditor } from 'ui.text-editor';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { fileService, type FileService } from 'tasks.v2.provider.service.file-service';
import { EntityTextArea, EntityTextTypes, entityTextEditor, type EntityTextEditor } from 'tasks.v2.component.entity-text';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { DescriptionMixin } from './description-mixin';
import { CheckList } from './actions/check-list';
import { Copilot } from './actions/copilot';
import { Attach } from './actions/attach';
import { Mention } from './actions/mention';
import { FullDescription } from './actions/full-description';

import './description.css';

// @vue/component
export const MiniForm = {
	name: 'TaskDescriptionMiniForm',
	components: {
		CheckList,
		Copilot,
		Attach,
		Mention,
		FullDescription,
		EntityTextArea,
	},
	mixins: [
		DescriptionMixin,
	],
	inject: {
		task: {},
		isEdit: {},
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		isSheetShown: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['expand', 'change', 'filesChange', 'close'],
	setup(props): { task: TaskModel, fileService: FileService, entityTextEditor: EntityTextEditor }
	{
		return {
			Outline,
			EntityTextTypes,
			fileService: fileService.get(props.taskId),
			entityTextEditor: entityTextEditor.get(props.taskId),
		};
	},
	data(): Object
	{
		return {
			isNeedTeleport: false,
		};
	},
	computed: {
		readonly(): boolean
		{
			return !this.task.rights.edit;
		},
		editor(): TextEditor
		{
			return this.entityTextEditor.getEditor();
		},
		isDiskModuleInstalled(): boolean
		{
			return Core.getParams().features.disk;
		},
		isCopilotEnabled(): boolean
		{
			return Core.getParams().features.isCopilotEnabled;
		},
	},
	watch: {
		isSheetShown(newValue): void
		{
			this.handleTeleport(newValue);
		},
	},
	methods: {
		handleExpand(): void
		{
			this.$emit('expand');
		},
		handleCopilotButtonClick(): void
		{
			if (!this.isCopilotEnabled)
			{
				return;
			}

			this.editor.focus(
				() => {
					this.editor.dispatchCommand(
						BX.UI.TextEditor.Plugins.Copilot.INSERT_COPILOT_DIALOG_COMMAND,
					);
				},
				{ defaultSelection: 'rootEnd' },
			);
		},
		handleMentionButtonClick(): void
		{
			this.editor.focus(
				() => {
					this.editor.dispatchCommand(
						BX.UI.TextEditor.Plugins.Mention.INSERT_MENTION_DIALOG_COMMAND,
					);
				},
				{ defaultSelection: 'rootEnd' },
			);
		},
		handleAttachButtonClick(): void
		{
			this.fileService.browse({
				bindElement: this.$refs.attach.$el,
				onHideCallback: this.onFileBrowserClose,
			});
		},
		handleTeleport(isSheetShown): void
		{
			if (isSheetShown === true)
			{
				setTimeout(() => {
					this.isNeedTeleport = true;
					this.editor.setVisualOptions({ blockSpaceInline: 'var(--ui-space-stack-xl)' });
				}, 100);

				setTimeout(() => {
					this.editor.focus(null, { defaultSelection: 'rootEnd' });
				}, 300);
			}
			else
			{
				this.isNeedTeleport = false;
				this.editor.setMaxHeight(null);
				this.editor.setVisualOptions({ blockSpaceInline: 'var(--ui-space-stack-md2)' });
			}
		},
		onFileBrowserClose(): void
		{
			this.fileService.setFileBrowserClosed(false);
		},
	},
	template: `
		<div class="tasks-card-change-description-mini-container">
			<div
				class="tasks-full-card-field-container --description-preview"
				ref="container"
				tabindex="-1"
			>
				<Teleport :to="isNeedTeleport ? '#descriptionTextAreaDestination' : undefined" :disabled="!isNeedTeleport">
					<EntityTextArea
						:entityId="taskId"
						:entityType="EntityTextTypes.Task"
						:readonly
						:removeFromServer="!isEdit"
						@change="$emit('change')"
						@filesChange="$emit('filesChange')"
						ref="descriptionTextArea"
					/>
				</Teleport>
				<div class="tasks-card-description-footer-container">
					<div class="tasks-card-description-footer">
						<div class="tasks-card-description-action-list">
							<Copilot v-if="isCopilotEnabled" @click="handleCopilotButtonClick"/>
							<Attach
								v-if="isDiskModuleInstalled"
								ref="attach"
								@click="handleAttachButtonClick"
							/>
							<Mention @click="handleMentionButtonClick"/>
							<CheckList
								v-if="isCopilotEnabled"
								:loading="isAiCommandProcessing"
								@click="handleCheckListButtonClick"
							/>
						</div>
						<div
							class="tasks-card-description-footer-buttons"
							ref="fullDescriptionArea"
						>
							<FullDescription @click="handleExpand"/>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
};
