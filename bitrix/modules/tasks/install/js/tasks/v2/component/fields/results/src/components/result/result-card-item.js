import { Text, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';

import { shallowRef } from 'ui.vue3';
import { hint, type HintParams } from 'ui.vue3.directives.hint';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { TextMd, TextXs, TextSm } from 'ui.system.typography.vue';
import { BMenu, type MenuOptions, type MenuItemOptions } from 'ui.vue3.components.menu';
import type { VueUploaderAdapter } from 'ui.uploader.vue';

import type { UserFieldWidgetOptions } from 'disk.uploader.user-field-widget';

import { EventName, Model, Option } from 'tasks.v2.const';
import { ahaMoments } from 'tasks.v2.lib.aha-moments';
import { calendar } from 'tasks.v2.lib.calendar';
import { Hint, tooltip } from 'tasks.v2.component.elements.hint';
import { UserAvatar, UserAvatarSize } from 'tasks.v2.component.elements.user-avatar';
import { EntityCollapsibleText } from 'tasks.v2.component.entity-text';
import { DiskUserFieldWidgetComponent } from 'tasks.v2.component.elements.user-field-widget-component';
import { userService } from 'tasks.v2.provider.service.user-service';
import { EntityTypes, fileService, type FileService } from 'tasks.v2.provider.service.file-service';
import { resultService } from 'tasks.v2.provider.service.result-service';
import type { ResultModel } from 'tasks.v2.model.results';
import type { UserModel } from 'tasks.v2.model.users';

import { resultsMeta } from '../../results-meta';

import './result.css';
import '../../results.css';

// @vue/component
export const ResultCardItem = {
	components: {
		BIcon,
		BMenu,
		UserAvatar,
		UserFieldWidgetComponent: DiskUserFieldWidgetComponent,
		EntityCollapsibleText,
		TextSm,
		TextXs,
		TextMd,
		Hint,
	},
	directives: { hint },
	inject: {
		taskId: {},
	},
	props: {
		resultId: {
			type: [Number, String],
			required: true,
		},
	},
	emits: ['titleClick', 'edit', 'highlightField'],
	setup(props): { fileService: FileService, uploaderAdapter: VueUploaderAdapter }
	{
		const fileServiceInstance = fileService.get(props.resultId, EntityTypes.Result);

		const fileServiceRef = shallowRef(fileServiceInstance);
		const uploaderAdapterRef = shallowRef(fileServiceInstance.getAdapter());

		return {
			Outline,
			resultsMeta,
			UserAvatarSize,
			fileService: fileServiceRef,
			uploaderAdapter: uploaderAdapterRef,
		};
	},
	data(): Object
	{
		return {
			opened: false,
			isMenuShown: false,
			showResultFromMessageHint: false,
			files: this.fileService.getFiles(),
		};
	},
	computed: {
		result(): ResultModel
		{
			return this.$store.getters[`${Model.Results}/getById`](this.resultId);
		},
		isEdit(): boolean
		{
			return Type.isNumber(this.resultId) && this.resultId > 0;
		},
		resultTitle(): string
		{
			return this.loc('TASKS_V2_RESULT_TITLE_WITH_DATE', {
				'#DATE#': this.resultDate,
			});
		},
		resultDate(): string
		{
			if (!this.result.createdAtTs)
			{
				return '';
			}

			return calendar.formatDateTime(this.result.createdAtTs);
		},
		resultText(): string
		{
			return this.result.text ?? '';
		},
		resultAuthor(): UserModel
		{
			return this.result.author;
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
				},
			};
		},
		menuOptions(): MenuOptions
		{
			return {
				id: `result-action-menu-${Text.getRandom()}`,
				bindOptions: { forceBindPosition: true },
				bindElement: this.$refs.moreIcon.$el,
				targetContainer: document.body,
				offsetLeft: -100,
				minWidth: 250,
				items: this.menuItems,
				autoHide: true,
				closeByEsc: true,
			};
		},
		menuItems(): MenuItemOptions[]
		{
			return [
				this.result.rights.edit && this.isEdit && {
					title: this.loc('TASKS_V2_RESULT_EDIT'),
					icon: Outline.EDIT_L,
					onClick: this.handleEditClick.bind(this),
					dataset: {
						id: `MenuResultEdit-${this.resultId}`,
					},
				},
				this.result.rights.remove && {
					design: 'alert',
					title: this.loc('TASKS_V2_RESULT_REMOVE'),
					icon: Outline.TRASHCAN,
					onClick: this.handleDeleteClick.bind(this),
					dataset: {
						id: `MenuResultRemove-${this.resultId}`,
					},
				},
			].filter(Boolean);
		},
		hasMenuItems(): boolean
		{
			return this.menuItems.length > 0;
		},
		tooltip(): Function
		{
			return (): HintParams => tooltip({
				text: this.loc('TASKS_V2_RESULT_ADD'),
				popupOptions: {
					offsetLeft: this.$refs.addIcon.offsetWidth / 2,
				},
			});
		},
	},
	watch: {
		resultId(newResultId): void
		{
			this.fileService = fileService.get(newResultId, EntityTypes.Result);
			this.uploaderAdapter = this.fileService.getAdapter();
			this.files = this.fileService.getFiles();
			this.opened = false;
		},
		resultText(): void
		{
			void this.$nextTick(this.$refs.collapsible?.updateIsOverflowing);
		},
	},
	mounted(): void
	{
		EventEmitter.subscribe(EventName.ResultFromMessageAdded, this.handleResultFromMessageAdded);
	},
	beforeUnmount(): void
	{
		EventEmitter.unsubscribe(EventName.ResultFromMessageAdded, this.handleResultFromMessageAdded);
	},
	methods: {
		handleEditClick(): void
		{
			this.$emit('edit', this.resultId);
		},
		handleDeleteClick(): void
		{
			void resultService.delete(this.resultId);
		},
		handleAuthorClick(): void
		{
			BX.SidePanel.Instance.emulateAnchorClick(userService.getUrl(this.resultAuthor.id));
		},
		handleResultFromMessageAdded(event: BaseEvent): void
		{
			const { taskId } = event.getData();

			if (this.taskId !== taskId)
			{
				return;
			}

			this.$emit('highlightField');

			if (!ahaMoments.shouldShow(Option.AhaResultFromMessagePopup))
			{
				return;
			}

			ahaMoments.setActive(Option.AhaResultFromMessagePopup);
			this.showResultFromMessageHint = true;
		},
		handleResultFromMessageHintClose(): void
		{
			this.showResultFromMessageHint = false;
			ahaMoments.setInactive(Option.AhaResultFromMessagePopup);
		},
		handleResultFromMessageHintCloseComplete(): void
		{
			if (!this.showResultFromMessageHint)
			{
				return;
			}

			this.showResultFromMessageHint = false;

			ahaMoments.setShown(Option.AhaResultFromMessagePopup);
		},
	},
	template: `
		<div
			class="tasks-field-results-result --card"
			:data-task-field-id="resultsMeta.id"
			data-field-container
		>
			<div
				class="tasks-field-results-title"
				ref="title"
				@click="$emit('titleClick', resultId)"
			>
				<div class="tasks-field-results-title-main">
					<BIcon :name="Outline.WINDOW_FLAG"/>
					<TextMd accent>{{ resultTitle }}</TextMd>
				</div>
				<div class="tasks-field-results-title-actions">
					<BIcon
						v-if="hasMenuItems"
						class="tasks-field-results-title-icon"
						:name="Outline.MORE_L"
						hoverable
						ref="moreIcon"
						@click.stop="isMenuShown = true"
					/>
					<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
					<Hint
						v-if="showResultFromMessageHint"
						:bindElement="$refs.moreIcon.$el"
						:options="{
							closeIcon: true,
							offsetLeft: 10,
							minWidth: 340,
							maxWidth: 340,
							bindOptions: {
								forceBindPosition: true,
							},
						}"
						@close="handleResultFromMessageHintClose"
					>
						<div class="tasks-field-results-hint-info">
							<TextMd className="tasks-field-results-hint-info-text">
								{{ loc('TASKS_V2_RESULT_AHA_RESULT_FROM_MESSAGE') }}
							</TextMd>
							<TextXs
								className="tasks-field-results-hint-info-link"
								@click.stop="handleResultFromMessageHintCloseComplete"
							>
								{{ loc('TASKS_V2_RESULT_AHA_SHOW_NO_MORE') }}
							</TextXs>
						</div>
					</Hint>
				</div>
			</div>
			<div class="tasks-field-results-result-content" ref="content">
				<div class="tasks-field-results-result-author-border">
					<div
						class="tasks-field-results-result-author-border-clickable"
						@click="handleAuthorClick"
					>
						<UserAvatar
							:src="resultAuthor.image"
							:type="resultAuthor.type"
							:size="UserAvatarSize.XS"
							:bx-tooltip-user-id="resultAuthor.id"
							bx-tooltip-context="b24"
						/>
						<TextSm
							className="tasks-field-results-result-author-name"
							:bx-tooltip-user-id="resultAuthor.id"
							bx-tooltip-context="b24"
						>
							{{ resultAuthor.name }}
						</TextSm>
					</div>
				</div>
				<EntityCollapsibleText
					ref="collapsible"
					:files
					:content="resultText"
					readonly
					:showFilesIndicator="false"
					v-model:opened="opened"
				/>
				<div v-if="filesCount > 0" class="tasks-field-results-result-files" :key="resultId">
					<UserFieldWidgetComponent :uploaderAdapter :widgetOptions/>
				</div>
			</div>
		</div>
	`,
};
