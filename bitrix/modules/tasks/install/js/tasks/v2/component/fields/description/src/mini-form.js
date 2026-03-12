import type { TextEditor } from 'ui.text-editor';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { fileService, type FileService } from 'tasks.v2.provider.service.file-service';
import {
	EntityTextArea,
	EntityTextTypes,
	entityTextEditor,
	CopilotButton,
	AttachButton,
	MentionButton,
	MoreButton,
	NumberListButton,
	BulletListButton,
	type EntityTextEditor,
} from 'tasks.v2.component.entity-text';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { DescriptionCheckListMixin } from './description-check-list-mixin';
import { CheckList } from './actions/check-list';
import { FullDescription } from './actions/full-description';

import './description.css';

// @vue/component
export const MiniForm = {
	name: 'TaskDescriptionMiniForm',
	components: {
		CheckList,
		CopilotButton,
		AttachButton,
		MentionButton,
		MoreButton,
		FullDescription,
		EntityTextArea,
		NumberListButton,
		BulletListButton,
	},
	mixins: [
		DescriptionCheckListMixin,
	],
	inject: {
		task: {},
		isEdit: {},
	},
	provide(): { fileService: FileService, entityTextEditor: EntityTextEditor }
	{
		return {
			editor: () => this.editor,
			fileService: () => this.fileService,
		};
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
	emits: ['expand', 'change', 'filesChange', 'addCheckList'],
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
							<AttachButton v-if="isDiskModuleInstalled" :fileService/>
							<MentionButton :editor/>
							<BulletListButton :editor/>
							<NumberListButton :editor/>
							<MoreButton :editor/>
							<CopilotButton v-if="isCopilotEnabled" :editor/>
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
