import { BIcon, Outline } from 'ui.icon-set.api.vue';
import type { VueUploaderAdapter } from 'ui.uploader.vue';
import 'ui.icon-set.outline';

import type { UserFieldWidgetOptions } from 'disk.uploader.user-field-widget';

import { fileService } from 'tasks.v2.provider.service.file-service';
import { DiskUserFieldWidgetComponent } from 'tasks.v2.component.elements.user-field-widget-component';
import { EntityCollapsibleText } from 'tasks.v2.component.entity-text';
import type { TaskModel } from 'tasks.v2.model.tasks';

import './description.css';

// @vue/component
export const DescriptionPreview = {
	name: 'TaskDescriptionPreview',
	components: {
		BIcon,
		EntityCollapsibleText,
		UserFieldWidgetComponent: DiskUserFieldWidgetComponent,
	},
	inject: {
		task: {},
		isEdit: {},
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		files: {
			type: Array,
			required: true,
		},
		isMiniFormShown: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['editButtonClick'],
	setup(props): { task: TaskModel, uploaderAdapter: VueUploaderAdapter }
	{
		return {
			BIcon,
			Outline,
			uploaderAdapter: fileService.get(props.taskId).getAdapter(),
		};
	},
	data(): Object
	{
		return {
			opened: false,
		};
	},
	computed: {
		taskDescription(): string
		{
			return this.task.description ?? '';
		},
		readonly(): boolean
		{
			return !this.task.rights.edit;
		},
		filesCount(): number
		{
			return this.files.length;
		},
		widgetOptions(): UserFieldWidgetOptions
		{
			return {
				isEmbedded: true,
				withControlPanel: false,
				canCreateDocuments: false,
				tileWidgetOptions: {
					compact: true,
					hideDropArea: true,
					readonly: true,
					enableDropzone: false,
					autoCollapse: false,
					removeFromServer: !this.isEdit,
				},
			};
		},
	},
	template: `
		<div class="tasks-full-card-field-container">
			<EntityCollapsibleText
				ref="collapsible"
				:content="taskDescription"
				:files
				:readonly
				:openByDefault="isMiniFormShown"
				showFilesIndicator
				:maxHeight="300"
				v-model:opened="opened"
				@editButtonClick="$emit('editButtonClick')"
			>
				<div
					v-if="opened && filesCount"
					class="tasks-card-description-editor-files --read-only"
					:class="{ '--with-description': taskDescription.length > 0 }"
					ref="filesWrapper"
				>
					<UserFieldWidgetComponent :uploaderAdapter :widgetOptions/>
				</div>
			</EntityCollapsibleText>
		</div>
	`,
};
