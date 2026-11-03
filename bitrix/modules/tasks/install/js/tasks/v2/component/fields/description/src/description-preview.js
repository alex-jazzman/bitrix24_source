import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { type VueUploaderAdapter } from 'ui.uploader.vue';
import 'ui.icon-set.outline';

import { type UserFieldWidgetOptions } from 'disk.uploader.user-field-widget';
import {
	TasksPopupButtonQuote,
	TYPES_DEFAULT_QUOTE_ACTIONS,
	type TypeDataQuote,
} from 'tasks.v2.component.tasks-popup-button-quote';

import { Analytics, EventName } from 'tasks.v2.const';
import { analytics } from 'tasks.v2.lib.analytics';
import { fileService } from 'tasks.v2.provider.service.file-service';
import { DiskUserFieldWidgetComponent } from 'tasks.v2.component.elements.user-field-widget-component';
import { EntityCollapsibleText, EntityCollapsibleTextEvent } from 'tasks.v2.component.entity-text';
import { type TaskModel } from 'tasks.v2.model.tasks';

import './description.css';

const TYPES_QUOTE_ACTIONS = {
	MESSAGE: TYPES_DEFAULT_QUOTE_ACTIONS.MESSAGE,
	CHECKLIST: 'TYPE_QUOTE_ACTION_CHECKLIST',
};

// @vue/component
export const DescriptionPreview = {
	name: 'TaskDescriptionPreview',
	components: {
		BIcon,
		EntityCollapsibleText,
		TasksPopupButtonQuote,
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
			elementAnchorQuote: null,
			elementScrollContainerQuote: null,
			opened: false,
			quoteButtonKey: 0,
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
		actionsQuote(): []
		{
			const actionQuoteMessage = {
				type: TYPES_QUOTE_ACTIONS.MESSAGE,
				chatId: this.task.chatId,
			};
			const actionQuoteChecklist = this.task.rights.checklistAdd && {
				type: TYPES_QUOTE_ACTIONS.CHECKLIST,
				icon: Outline.MOVE_TO_CHECKLIST,
				// Keep the panel open as the picker's anchor; it closes on CheckListAddFromTextResolved.
				isClosingPrevented: true,
			};

			return [actionQuoteMessage, actionQuoteChecklist].filter(Boolean);
		},
		widgetOptions(): UserFieldWidgetOptions
		{
			return {
				isEmbedded: true,
				withControlPanel: false,
				canCreateDocuments: false,
				viewMode: this.readonly ? 'list' : 'tile',
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
	mounted(): Promise<void>
	{
		this.elementAnchorQuote = this.$refs.collapsible.$el.parentNode?.querySelector('.tasks-card-entity-collapsible-text');
		this.elementScrollContainerQuote = this.elementAnchorQuote?.closest('.tasks-full-card-content');

		this.$bitrix.eventEmitter.subscribe(EventName.CheckListAddFromTextResolved, this.handleCheckListAddResolved);
	},
	beforeUnmount(): void
	{
		this.$bitrix.eventEmitter.unsubscribe(EventName.CheckListAddFromTextResolved, this.handleCheckListAddResolved);
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
		handleClickButtonQuote(dataQuote: TypeDataQuote): void
		{
			if (dataQuote.type !== TYPES_QUOTE_ACTIONS.CHECKLIST)
			{
				return;
			}

			// Live button node (the panel stays open); fall back to the description container.
			const anchor = dataQuote.event?.currentTarget ?? this.elementAnchorQuote;

			this.$bitrix.eventEmitter.emit(EventName.AddCheckListFromText, {
				text: dataQuote.quote,
				anchor,
			});
		},
		handleCheckListAddResolved(): void
		{
			// Bump the key to remount and reset the panel, which keeps isOpened internally.
			this.quoteButtonKey += 1;
		},
	},
	template: `
		<div class="tasks-full-card-field-container print-no-box-shadow" data-testid="tasks-description-preview">
			<EntityCollapsibleText
				ref="collapsible"
				:content="taskDescription"
				:files
				:readonly
				showFilesIndicator
				:maxHeight="300"
				stickyFooter
				enableClickToExpand
				:editButtonLabel="loc('TASKS_V2_DESCRIPTION_EDIT_LABEL')"
				v-model:opened="opened"
				@update:opened="updateOpened"
				@editButtonClick="editButtonClick"
			>
				<div
					v-if="opened && filesCount"
					class="tasks-card-description-editor-files --read-only print-ignore"
					:class="{ '--with-description': taskDescription.length > 0 }"
					data-testid="task-description-files"
					ref="filesWrapper"
				>
					<UserFieldWidgetComponent :uploaderAdapter :widgetOptions/>
				</div>
			</EntityCollapsibleText>
		</div>
		<TasksPopupButtonQuote
			v-if="elementAnchorQuote"
			:key="quoteButtonKey"
			:isQuoteTrimmed="true"
			:elementAnchor="elementAnchorQuote"
			:elementScrollContainer="elementScrollContainerQuote"
			:actions="actionsQuote"
			@click="handleClickButtonQuote"
		/>
	`,
};
