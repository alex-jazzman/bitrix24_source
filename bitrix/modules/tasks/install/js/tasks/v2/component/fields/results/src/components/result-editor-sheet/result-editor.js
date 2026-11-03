import { Type, Event, Runtime } from 'main.core';

import { FileStatus } from 'ui.uploader.core';
import { Notifier } from 'ui.notification-manager';

import { mapGetters } from 'ui.vue3.vuex';
import { type TextEditor } from 'ui.text-editor';
import { Button as UiButton, ButtonColor, ButtonSize } from 'ui.vue3.components.button';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { Model, EventName, ResultStatus, Analytics } from 'tasks.v2.const';
import { analytics } from 'tasks.v2.lib.analytics';
import { calendar } from 'tasks.v2.lib.calendar';
import { resultService } from 'tasks.v2.provider.service.result-service';
import { fileService, EntityTypes, type FileService } from 'tasks.v2.provider.service.file-service';
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
import type { ResultModel } from 'tasks.v2.model.results';
import type { UserModel } from 'tasks.v2.model.users';

import { resultsMeta } from '../../results-meta';

import './result-editor-sheet.css';

// Each normalization pass peels one nesting level of empty blocks, so an unbounded walk costs
// O(length x depth) on crafted deep nesting. Mirrored in ResultService::assertNotEmpty().
const MAX_EMPTY_BLOCK_PASSES = 16;

// @vue/component
export const ResultEditor = {
	name: 'TaskResultEditor',
	components: {
		BIcon,
		UiButton,
		EntityTextArea,
		CopilotButton,
		AttachButton,
		MentionButton,
		MoreButton,
		NumberListButton,
		BulletListButton,
	},
	inject: {
		taskId: {},
		task: {},
		analytics: {},
		cardType: {},
	},
	provide(): { fileService: FileService, entityTextEditor: EntityTextEditor }
	{
		return {
			editor: () => this.editor,
			fileService: () => this.fileService,
		};
	},
	props: {
		resultId: {
			type: [Number, String],
			required: true,
		},
		content: {
			type: String,
			default: '',
		},
		isResized: {
			type: Boolean,
			default: false,
		},
		showResize: {
			type: Boolean,
			default: true,
		},
		titleId: {
			type: String,
			default: '',
		},
	},
	emits: ['close', 'resize'],
	setup(props): { task: TaskModel, fileService: FileService, entityTextEditor: EntityTextEditor }
	{
		return {
			ButtonSize,
			ButtonColor,
			Outline,
			EntityTypes,
			EntityTextTypes,
			fileService: fileService.get(props.resultId, EntityTypes.Result),
			entityTextEditor: entityTextEditor.get(
				props.resultId,
				EntityTextTypes.Result,
				{
					content: props.content,
					blockSpaceInline: 'var(--ui-space-stack-xl)',
				},
			),
		};
	},
	data(): Object
	{
		return {
			isSaving: false,
			hasChanges: false,
			hasFilesChanges: false,
			buttonDisabled: !(Type.isStringFilled(this.getPreparedText(this.content)) || this.hasAttachedFiles()),
		};
	},
	computed: {
		...mapGetters({
			currentUserId: `${Model.Interface}/currentUserId`,
		}),
		result(): ResultModel | null
		{
			return this.$store.getters[`${Model.Results}/getById`](this.resultId);
		},
		currentUser(): UserModel
		{
			return this.$store.getters[`${Model.Users}/getById`](this.currentUserId);
		},
		isEdit(): boolean
		{
			return Type.isNumber(this.resultId) && this.resultId > 0;
		},
		resultDate(): string
		{
			if (!this.result.createdAtTs)
			{
				return '';
			}

			return calendar.formatDateTime(this.result.createdAtTs);
		},
		title(): string
		{
			if (this.isEdit)
			{
				return this.loc('TASKS_V2_RESULT_TITLE_WITH_DATE', {
					'#DATE#': this.resultDate,
				});
			}

			return this.loc('TASKS_V2_RESULT_ADD');
		},
		buttonTitle(): string
		{
			return this.isEdit
				? this.loc('TASKS_V2_RESULT_BUTTON_SAVE')
				: this.loc('TASKS_V2_RESULT_BUTTON_SEND')
			;
		},
		readonly(): boolean
		{
			if (!this.result)
			{
				return !this.task?.rights?.read;
			}

			return !this.result?.rights?.edit;
		},
		editor(): TextEditor
		{
			return this.entityTextEditor.getEditor();
		},
		hasEditorChanges(): boolean
		{
			return this.hasChanges || this.hasFilesChanges;
		},
		resizeIcon(): string
		{
			return this.isResized ? Outline.COLLAPSE_L : Outline.EXPAND_L;
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
	mounted(): void
	{
		if (!this.task.filledFields[resultsMeta.id])
		{
			void this.$store.dispatch(`${Model.Tasks}/setFieldFilled`, {
				id: this.taskId,
				fieldName: resultsMeta.id,
			});
		}

		if (!Type.isStringFilled(this.content) || this.resultId === 0)
		{
			setTimeout(this.focusToEnd, 400);
		}

		// EntityTextArea relays only onFileAdd/onFileRemove as filesChange; the upload
		// completion (UPLOADING -> COMPLETE) arrives as a separate file-service event.
		// Re-gate the save button directly without marking the editor dirty: onFileComplete
		// also fires for background server attachments (loadFilesFromData/list), and routing it
		// through handleFilesChange would set hasFilesChanges and send a spurious update on close.
		this.fileService.subscribe('onFileComplete', this.recalcButtonState);
	},
	unmounted(): void
	{
		this.fileService.unsubscribe('onFileComplete', this.recalcButtonState);

		if (!this.isEdit && !this.isSaving)
		{
			void this.$store.dispatch(`${Model.Results}/delete`, this.resultId);

			fileService.delete(this.resultId, EntityTypes.Result);
			entityTextEditor.delete(this.resultId, EntityTextTypes.Result);
		}
	},
	methods: {
		handleEditButtonClick(): void
		{
			if (this.isEdit)
			{
				this.handleClose();
			}
			else
			{
				this.handleAddResult();
			}
		},
		handleAddResult(): void
		{
			this.isSaving = true;

			const result = {
				...this.result,
				text: this.editor.getText(),
				author: this.currentUser,
				status: ResultStatus.Open,
				createdAtTs: Date.now(),
				updatedAtTs: Date.now(),
			};

			void this.addResult(result);

			this.handleClose();

			Event.EventEmitter.emit(EventName.ResultAdded, { taskId: this.taskId });
		},
		async addResult(result): void
		{
			const isSuccess = await resultService.add(this.taskId, result);

			this.sendAnalyticsResultAdd(isSuccess);

			if (isSuccess)
			{
				Event.EventEmitter.emit(EventName.ResultSuccessfulAdded, { taskId: this.taskId });
			}
		},
		sendAnalyticsResultAdd(isSuccess: boolean): void
		{
			analytics.sendStatusSummaryAdd(this.analytics, {
				isSuccess,
				cardType: this.cardType,
				taskId: Type.isNumber(this.taskId) ? this.taskId : 0,
				element: Analytics.Element.AddResult,
				subSection: Analytics.SubSection.TaskCard,
			});
		},
		handleUpdateResult(): void
		{
			if (!this.hasEditorChanges)
			{
				return;
			}

			const fields = {
				text: this.editor.getText(),
				updatedAtTs: Date.now() / 1000,
				status: ResultStatus.Open,
			};

			void resultService.update(this.resultId, fields);

			this.hasChanges = false;
			this.hasFilesChanges = false;

			Event.EventEmitter.emit(EventName.ResultUpdated, { taskId: this.taskId, resultId: this.resultId });
		},
		handleEditorChange(): void
		{
			const preparedOldText = this.getPreparedText(this.content);
			const preparedNewText = this.getPreparedText(this.editor?.getText());

			this.hasChanges = preparedOldText !== preparedNewText;
			this.recalcButtonState(preparedNewText);
		},
		handleFilesChange(): void
		{
			this.hasFilesChanges = true;
			this.recalcButtonState();
		},
		recalcButtonState(preparedText?: string): void
		{
			const hasFiles = this.hasAttachedFiles();
			// May be invoked as an onFileComplete handler, which passes a BaseEvent here;
			// fall back to the editor text unless an actual prepared string was provided. With a
			// completed file the text cannot change the outcome, so skip normalizing it: that event
			// fires per file (background server attachments included) and each normalization walks
			// the whole text up to MAX_EMPTY_BLOCK_PASSES times.
			const text = Type.isString(preparedText)
				? preparedText
				: (hasFiles ? '' : this.getPreparedText(this.editor?.getText()))
			;
			const isTextFilled = Type.isStringFilled(text);

			const wasDisabled = this.buttonDisabled;
			this.buttonDisabled = !(isTextFilled || hasFiles);

			// Announce the disabled -> enabled transition to screen readers (WCAG 4.1.3).
			if (wasDisabled && !this.buttonDisabled)
			{
				void this.announceButtonEnabled();
			}
		},
		async announceButtonEnabled(): Promise<void>
		{
			// ui.a11y is loaded lazily so this rare disabled -> enabled transition does not pull
			// the extension into the result field's eager bundle. Best-effort: a failed load must
			// not break the editor flow.
			try
			{
				const { LiveAnnouncer } = await Runtime.loadExtension('ui.a11y');
				LiveAnnouncer.announce(this.loc('TASKS_V2_RESULT_BUTTON_ENABLED_ANNOUNCE', {
					'#BUTTON#': this.buttonTitle,
				}));
			}
			catch
			{
				// Announcement is best-effort.
			}
		},
		hasAttachedFiles(): boolean
		{
			// count only files that finished uploading, not files in flight or failed (CT-RESULT-FILE-PRESENCE)
			return this.fileService.getFileItems().some(({ status }) => status === FileStatus.COMPLETE);
		},
		getPreparedText(text): string | null
		{
			let preparedText = text
				.replaceAll(/\[p]\n|\[p]\s*\[\/p]|\[\/p]/gi, '')
			;
			let previousText: string;
			let passes = 0;
			do
			{
				previousText = preparedText;
				preparedText = preparedText
					.replaceAll(/\[(quote|code|spoiler)]\s*\[\/\1]/gi, '')
					.replaceAll(/\[list(?:=[^\]]+)?](?:\s*\[\*])*\s*\[\/list]/gi, '')
				;
				++passes;
			}
			while (preparedText !== previousText && passes < MAX_EMPTY_BLOCK_PASSES);

			return preparedText.trim();
		},
		focusToEnd(): void
		{
			this.editor?.focus(null, { defaultSelection: 'rootEnd' });
		},
		handleClose(): void
		{
			if (this.isEdit)
			{
				// Keep the editor open only after an edit leaves it invalid (no text and no completed file).
				if (this.hasEditorChanges && this.buttonDisabled)
				{
					Notifier.notifyViaBrowserProvider({
						id: 'task-notify-result-empty-close-error',
						text: this.loc('TASKS_V2_RESULT_EMPTY_CLOSE_ERROR'),
					});

					return;
				}

				this.handleUpdateResult();
			}

			this.$emit('close');
		},
	},
	template: `
		<div class="tasks-result-editor-wrapper" ref="wrapper" data-testid="tasks-result-editor">
			<div class="tasks-result-editor-header" ref="resultHeader">
				<div class="tasks-result-editor-title" :id="titleId">{{ title }}</div>
				<div class="tasks-result-editor-field-actions">
					<button
						v-if="showResize"
						type="button"
						class="tasks-result-editor-field-icon"
						:aria-expanded="isResized ? 'true' : 'false'"
						:aria-label="isResized
							? loc('TASKS_V2_RESULT_COLLAPSE_LABEL')
							: loc('TASKS_V2_RESULT_EXPAND_LABEL')"
						data-testid="tasks-result-editor-resize-btn"
						@click="$emit('resize')"
					>
						<BIcon :name="resizeIcon" hoverable aria-hidden="true"/>
					</button>
					<button
						type="button"
						class="tasks-result-editor-field-icon"
						:aria-label="loc('TASKS_V2_RESULT_CLOSE_LABEL')"
						data-testid="tasks-result-editor-close-btn"
						@click="handleClose"
					>
						<BIcon :name="Outline.CROSS_L" hoverable aria-hidden="true"/>
					</button>
				</div>
			</div>
			<div class="tasks-result-editor-container">
				<EntityTextArea
					:entityId="resultId"
					:entityType="EntityTextTypes.Result"
					:readonly
					:removeFromServer="!isEdit"
					ref="resultTextArea"
					@change="handleEditorChange"
					@filesChange="handleFilesChange"
				/>
			</div>
			<div v-if="!readonly" class="tasks-result-editor-footer" ref="resultActions">
				<div class="tasks-result-editor-action-list">
					<AttachButton v-if="isDiskModuleInstalled" :fileService/>
					<MentionButton :editor/>
					<BulletListButton :editor/>
					<NumberListButton :editor/>
					<MoreButton :editor/>
					<CopilotButton v-if="isCopilotEnabled" :editor/>
				</div>
				<div class="tasks-result-editor-footer-buttons">
					<UiButton
						data-testid="task-result-editor-submit-btn"
						:text="buttonTitle"
						:size="ButtonSize.MEDIUM"
						:color="ButtonColor.PRIMARY"
						:disabled="buttonDisabled || isSaving"
						:dataset="{ testid: 'tasks-result-editor-save-btn' }"
						@click="handleEditButtonClick"
					/>
				</div>
			</div>
		</div>
	`,
};
