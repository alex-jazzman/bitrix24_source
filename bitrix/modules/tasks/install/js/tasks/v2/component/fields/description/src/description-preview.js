import { BIcon, Outline } from 'ui.icon-set.api.vue';
import type { VueUploaderAdapter } from 'ui.uploader.vue';
import 'ui.icon-set.outline';

import type { UserFieldWidgetOptions } from 'disk.uploader.user-field-widget';

import { Analytics } from 'tasks.v2.const';
import { analytics } from 'tasks.v2.lib.analytics';
import { fileService } from 'tasks.v2.provider.service.file-service';
import { DiskUserFieldWidgetComponent } from 'tasks.v2.component.elements.user-field-widget-component';
import { EntityCollapsibleText, EntityCollapsibleTextEvent } from 'tasks.v2.component.entity-text';
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
		analytics: {},
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
	methods: {
		editButtonClick(): void
		{
			this.$emit('editButtonClick');

			void analytics.sendDescriptionEdit({
				...this.analytics,
				element: Analytics.Element.DescriptionEditButton,
			}, { taskId: this.taskId });
		},
		updateOpened(opened: boolean, event: string): void
		{
			if (event === EntityCollapsibleTextEvent.HtmlFormatterComponentMouseUp)
			{
				void analytics.sendDescriptionExpand({
					...this.analytics,
					element: Analytics.Element.DescriptionExpandClick,
				}, { taskId: this.taskId });
			}
			else if (event === EntityCollapsibleTextEvent.ExpandButtonClick && opened)
			{
				void analytics.sendDescriptionExpand({
					...this.analytics,
					element: Analytics.Element.DescriptionExpandButton,
				}, { taskId: this.taskId });
			}
		},
	},
	template: `
		<div class="tasks-full-card-field-container print-no-box-shadow">
			<EntityCollapsibleText
				ref="collapsible"
				:content="taskDescription"
				:files
				:readonly
				showFilesIndicator
				:maxHeight="300"
				stickyFooter
				v-model:opened="opened"
				@update:opened="updateOpened"
				@editButtonClick="editButtonClick"
			>
				<div
					v-if="opened && filesCount"
					class="tasks-card-description-editor-files --read-only print-ignore"
					:class="{ '--with-description': taskDescription.length > 0 }"
					ref="filesWrapper"
				>
					<UserFieldWidgetComponent :uploaderAdapter :widgetOptions/>
				</div>
			</EntityCollapsibleText>
		</div>
	`,
};
