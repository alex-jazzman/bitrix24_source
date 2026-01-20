import { Text } from 'main.core';

import { Core } from 'tasks.v2.core';
import { EntityTypes } from 'tasks.v2.provider.service.file-service';
import { BottomSheet } from 'tasks.v2.component.elements.bottom-sheet';
import { DropZone } from 'tasks.v2.component.drop-zone';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { DescriptionEditor } from './description-editor';

import './description.css';

// @vue/component
export const DescriptionSheet = {
	name: 'TaskDescriptionSheet',
	components: {
		BottomSheet,
		DescriptionEditor,
		DropZone,
	},
	inject: {
		task: {},
		taskId: {},
	},
	props: {
		sheetBindProps: {
			type: Object,
			required: true,
		},
		enableSaveButton: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['close'],
	setup(): { task: TaskModel }
	{
		return {
			EntityTypes,
		};
	},
	data(): void
	{
		return {
			uniqueKey: Text.getRandom(),
		};
	},
	computed: {
		bottomSheetContainer(): HTMLElement | null
		{
			return document.getElementById(`b24-bottom-sheet-${this.uniqueKey}`) || null;
		},
		isDiskModuleInstalled(): boolean
		{
			return Core.getParams().features.disk;
		},
	},
	template: `
		<BottomSheet
			isExpanded
			:padding="0"
			:popupPadding="0"
			:sheetBindProps
			:uniqueKey
			@close="$emit('close')"
		>
			<DescriptionEditor
				:taskId
				:enableSaveButton
				@close="$emit('close')"
			/>
			<DropZone
				v-if="isDiskModuleInstalled && task.rights.edit"
				:container="bottomSheetContainer || {}"
				:entityId="taskId"
				:entityType="EntityTypes.Task"
			/>
		</BottomSheet>
	`,
};
