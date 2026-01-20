import { Text, Event, Type } from 'main.core';

import { shallowRef } from 'ui.vue3';
import { hint } from 'ui.vue3.directives.hint';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { HeadlineSm, TextSm } from 'ui.system.typography.vue';
import { BMenu, type MenuOptions, type MenuItemOptions } from 'ui.vue3.components.menu';
import type { VueUploaderAdapter } from 'ui.uploader.vue';

import type { UserFieldWidgetOptions } from 'disk.uploader.user-field-widget';

import { Model } from 'tasks.v2.const';
import { calendar } from 'tasks.v2.lib.calendar';
import { UserAvatar, UserAvatarSize } from 'tasks.v2.component.elements.user-avatar';
import { EntityCollapsibleText } from 'tasks.v2.component.entity-text';
import { DiskUserFieldWidgetComponent } from 'tasks.v2.component.elements.user-field-widget-component';
import { userService } from 'tasks.v2.provider.service.user-service';
import { EntityTypes, fileService } from 'tasks.v2.provider.service.file-service';
import { resultService } from 'tasks.v2.provider.service.result-service';
import type { FileService } from 'tasks.v2.provider.service.file-service';
import type { ResultModel } from 'tasks.v2.model.results';
import type { UserModel } from 'tasks.v2.model.users';

import { resultsMeta } from '../../results-meta';

import './result.css';
import '../../results.css';

// @vue/component
export const ResultListItem = {
	name: 'TaskResultListItem',
	components: {
		BIcon,
		BMenu,
		HeadlineSm,
		UserAvatar,
		UserFieldWidgetComponent: DiskUserFieldWidgetComponent,
		EntityCollapsibleText,
		TextSm,
	},
	directives: { hint },
	props: {
		resultId: {
			type: [Number, String],
			required: true,
		},
		showDelimiter: {
			type: Boolean,
			default: false,
		},
		isResized: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['titleClick', 'edit', 'resize'],
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
			isSticky: false,
			scrollContainer: null,
			mutationObserver: null,
			isMenuShown: false,
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
		resizeIcon(): string
		{
			return this.isResized ? Outline.COLLAPSE_L : Outline.EXPAND_L;
		},
	},
	watch: {
		resultId(newResultId): void
		{
			this.fileService = fileService.get(newResultId, EntityTypes.Result);
			this.uploaderAdapter = this.fileService.getAdapter();
			this.files = this.fileService.getFiles();
		},
	},
	mounted(): void
	{
		this.scrollContainer = this.$el?.closest('.tasks-field-results-result-list-content');

		if (this.scrollContainer)
		{
			Event.bind(this.scrollContainer, 'scroll', this.handleScroll);

			void this.$nextTick(this.checkSticky);

			this.mutationObserver = new MutationObserver(() => this.checkSticky());

			this.mutationObserver.observe(
				this.scrollContainer,
				{
					childList: true,
					subtree: true,
				},
			);
		}
	},
	beforeUnmount(): void
	{
		if (this.scrollContainer)
		{
			Event.unbind(this.scrollContainer, 'scroll', this.handleScroll);
		}

		if (this.mutationObserver)
		{
			this.mutationObserver.disconnect();
		}
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
		handleResizeClick(): void
		{
			this.$emit('resize');
		},
		handleScroll(): void
		{
			this.checkSticky();
		},
		checkSticky(): void
		{
			if (!this.scrollContainer || !this.$refs.title)
			{
				return;
			}

			const itemRect = this.$refs.title.getBoundingClientRect();
			const containerRect = this.scrollContainer.getBoundingClientRect();
			this.isSticky = itemRect.top <= (containerRect.top + itemRect.height / 2);
		},
		handleAuthorClick(): void
		{
			BX.SidePanel.Instance.emulateAnchorClick(userService.getUrl(this.resultAuthor.id));
		},
	},
	template: `
		<div class="tasks-field-results-result --list-mode">
			<div
				class="tasks-field-results-title --list-mode"
				:class="{ '--sticky': isSticky }"
				ref="title"
				@click="$emit('titleClick', resultId)"
			>
				<div class="tasks-field-results-title-main">
					<BIcon :name="Outline.WINDOW_FLAG"/>
					<HeadlineSm>{{ resultTitle }}</HeadlineSm>
				</div>
				<div class="tasks-field-results-title-actions">
					<BIcon
						v-if="hasMenuItems"
						class="tasks-field-results-title-icon --big"
						:name="Outline.MORE_L"
						hoverable
						ref="moreIcon"
						@click.stop="isMenuShown = true"
					/>
					<BIcon
						v-if="isSticky"
						class="tasks-field-results-title-icon --big"
						:name="resizeIcon"
						hoverable
						@click.stop="handleResizeClick"
					/>
					<div v-if="isSticky" class="tasks-field-results-result-empty"/>
					<BMenu
						v-if="isMenuShown"
						:options="menuOptions"
						@close="isMenuShown = false"
					/>
				</div>
			</div>
			<div
				class="tasks-field-results-result-content"
				ref="content"
			>
				<div
					class="tasks-field-results-result-author"
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
				<EntityCollapsibleText
					ref="collapsible"
					:content="resultText"
					:files
					readonly
					showFilesIndicator
					openByDefault
					opened
				/>
				<div
					v-if="filesCount > 0"
					class="tasks-field-results-result-files --list-mode"
				>
					<UserFieldWidgetComponent :uploaderAdapter :widgetOptions/>
				</div>
			</div>
			<div v-if="showDelimiter" class="tasks-field-results-result-separator"/>
			<div v-else class="tasks-field-results-result-last-padding"/>
		</div>
	`,
};
