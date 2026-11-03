import { FileStatus } from 'ui.uploader.core';
import { BIcon, Animated, Outline } from 'ui.icon-set.api.vue';
import { hint, type HintParams } from 'ui.vue3.directives.hint';
import type { VueUploaderAdapter } from 'ui.uploader.vue';

import 'ui.icon-set.animated';
import 'ui.icon-set.outline';

import type { UserFieldWidgetOptions } from 'disk.uploader.user-field-widget';

import { tooltip } from 'tasks.v2.component.elements.hint';
import { fileService, type FileService } from 'tasks.v2.provider.service.file-service';
import { optionService } from 'tasks.v2.provider.service.option-service';
import { DiskUserFieldWidgetComponent } from 'tasks.v2.component.elements.user-field-widget-component';
import { Model, Option } from 'tasks.v2.const';
import { ajax as Ajax } from 'main.core';
import { ahaMoments } from 'tasks.v2.lib.aha-moments';
import type { TaskModel } from 'tasks.v2.model.tasks';
import { type FilesViewMode } from 'tasks.v2.model.interface';

import { filesMeta } from './files-meta';
import { ViewSwitcher } from './component/view-switcher';
import { DownloadArchiveButton } from './component/download-archive-button';
import { FilesViewAha } from './component/files-view-aha/files-view-aha';
import { canDownloadArchive } from './can-download-archive';
import './files.css';

// @vue/component
export const Files = {
	name: 'TaskFiles',
	components: {
		BIcon,
		UserFieldWidgetComponent: DiskUserFieldWidgetComponent,
		ViewSwitcher,
		DownloadArchiveButton,
		FilesViewAha,
	},
	directives: { hint },
	inject: {
		task: {},
		isEdit: {},
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
	},
	setup(props): { task: TaskModel, uploaderAdapter: VueUploaderAdapter, fileService: FileService }
	{
		return {
			Animated,
			Outline,
			filesMeta,
			fileService: fileService.get(props.taskId),
			uploaderAdapter: fileService.get(props.taskId).getAdapter(),
		};
	},
	data(): Object
	{
		return {
			files: this.fileService.getFiles(),
			showPreview: false,
			isExpanded: false,
			isOverflowing: false,
			isFilesViewAhaShown: false,
			isFilesViewAhaObserved: false,
			isFilesViewAhaPending: false,
			menuTrigger: null,
		};
	},
	computed: {
		filesCount(): number
		{
			return this.files.length;
		},
		isCollapsible(): boolean
		{
			return this.filesCount > 1;
		},
		isTitleInteractive(): boolean
		{
			// The title acts as a control only when the click actually does something:
			// with no files it opens the file browser, with an overflowing list it toggles
			// collapse. A single file (or a short list) has no title action.
			return this.filesCount === 0 || (this.isCollapsible && this.isOverflowing);
		},
		archiveLink(): ?string
		{
			return this.task.archiveLink;
		},
		canDownloadArchive(): boolean
		{
			return canDownloadArchive(this.filesCount, this.archiveLink);
		},
		textFormatted(): string
		{
			if (this.filesCount > 0)
			{
				return this.loc('TASKS_V2_FILES_COUNT', {
					'#COUNT#': this.filesCount,
				});
			}

			return this.loc('TASKS_V2_FILES_TITLE');
		},
		isUploading(): boolean
		{
			return this.files.some(({ status }) => [
				FileStatus.UPLOADING,
				FileStatus.LOADING,
			].includes(status));
		},
		ariaLabel(): string
		{
			if (this.isUploading)
			{
				return this.loc('TASKS_V2_FILES_LOADING');
			}

			if (this.filesCount === 0)
			{
				return this.loc('TASKS_V2_FILES_ARIA_LABEL');
			}

			return this.loc('TASKS_V2_FILES_COUNT_ARIA_LABEL', {
				'#COUNT#': this.filesCount,
			});
		},
		titleAriaExpanded(): ?boolean
		{
			// With no files the title owns the file source menu; with an overflowing list it
			// owns the collapse. In every other state it is not a disclosure at all.
			if (this.filesCount === 0)
			{
				return this.menuTrigger === 'title';
			}

			return this.isCollapsible && this.isOverflowing ? this.isExpanded : null;
		},
		canAttachFiles(): boolean
		{
			return this.task.rights.attachFile || this.task.rights.edit;
		},
		viewMode(): FilesViewMode
		{
			return this.$store.getters[`${Model.Interface}/filesViewMode`];
		},
		filesViewAhaBindElement(): ?HTMLElement
		{
			return this.$refs.viewSwitcher?.$el?.querySelector('[data-task-files-view-switcher]') ?? null;
		},
		widgetOptions(): UserFieldWidgetOptions
		{
			return {
				isEmbedded: true,
				withControlPanel: false,
				canCreateDocuments: false,
				viewMode: this.viewMode,
				tileWidgetOptions: {
					compact: true,
					hideDropArea: true,
					enableDropzone: false,
					readonly: !this.canAttachFiles,
					autoCollapse: false,
					removeFromServer: !this.isEdit,
					forceDisableSelection: true,
				},
			};
		},
		tooltip(): Function
		{
			return (): HintParams => tooltip({
				text: this.loc('TASKS_V2_FILES_ADD'),
				popupOptions: {
					offsetLeft: this.$refs.add.offsetWidth / 2,
				},
			});
		},
	},
	watch: {
		files: {
			handler(newFiles): void
			{
				if (newFiles.length > 0 && this.fileService.isFileBrowserClosed())
				{
					this.showPreview = true;
					this.fileService.resetFileBrowserClosedState();
				}

				if (!this.isCollapsible)
				{
					this.isExpanded = false;
				}

				if (newFiles.length > 0)
				{
					this.showFilesViewOnboarding();
				}

				this.$nextTick(() => {
					this.attachResizeObserver();
					this.updateOverflow();
				});
			},
			deep: true,
		},
		showPreview(): void
		{
			this.$nextTick(() => {
				this.attachResizeObserver();
				this.updateOverflow();
			});
		},
	},
	created(): void
	{
		this.overflowRafId = null;
		this.resizeObserver = new ResizeObserver(() => {
			cancelAnimationFrame(this.overflowRafId);
			this.overflowRafId = requestAnimationFrame(() => this.updateOverflow());
		});
	},
	mounted(): void
	{
		// Read the collapsed max-height once from the CSS custom property to avoid duplicating the value in JS.
		// $el is a fragment anchor for multi-root templates; use $refs.root (the actual .tasks-field-files div)
		// where the CSS variable is defined.
		const rootEl = this.$refs.root;
		const raw = rootEl ? getComputedStyle(rootEl).getPropertyValue('--tasks-field-files-collapsed-max-height').trim() : '';
		this.collapsedMaxHeight = parseInt(raw, 10) || 155;

		this.showPreview = this.isEdit;

		if (this.filesCount > 0)
		{
			this.showFilesViewOnboarding();
		}

		this.$nextTick(() => {
			this.attachResizeObserver();
			this.updateOverflow();
		});
	},
	beforeUnmount(): void
	{
		this.resizeObserver?.disconnect();
		cancelAnimationFrame(this.overflowRafId);
		this.markFilesViewAhaSeen();
		clearTimeout(this.filesViewAhaTimer);

		// Release the global aha slot: without this, unmounting between setActive()
		// and the popup close keeps every other aha moment suppressed on this page.
		ahaMoments.setInactive(Option.AhaFilesView);
	},
	methods: {
		handleAddClick(): void
		{
			this.returnFocusElement = document.activeElement;
			this.fileService.browse({
				bindElement: this.$refs.add,
				onShowCallback: () => this.onFileBrowserShow('add'),
				onHideCallback: this.onFileBrowserClose,
			});
		},
		handleOpenClick(): void
		{
			if (!this.isTitleInteractive)
			{
				return;
			}

			if (this.filesCount === 0)
			{
				this.returnFocusElement = document.activeElement;
				this.fileService.browse({
					bindElement: this.$refs.title,
					onShowCallback: () => this.onFileBrowserShow('title'),
					onHideCallback: this.onFileBrowserClose,
				});

				return;
			}

			if (this.isCollapsible)
			{
				this.toggleExpanded();
			}
		},
		toggleExpanded(): void
		{
			this.isExpanded = !this.isExpanded;
		},
		onFileBrowserShow(trigger: string): void
		{
			this.menuTrigger = trigger;
		},
		onFileBrowserClose(): void
		{
			this.menuTrigger = null;

			this.fileService.setFileBrowserClosed(true);

			const element = this.returnFocusElement;
			this.returnFocusElement = null;

			if (element?.isConnected)
			{
				element.focus?.();
			}
		},
		handleViewModeChange(mode: FilesViewMode): void
		{
			void this.$store.dispatch(`${Model.Interface}/updateFilesViewMode`, mode);

			void optionService.set(Option.FilesViewMode, mode);

			this.$nextTick(() => this.updateOverflow());
		},
		updateOverflow(): void
		{
			const el = this.$refs.files;
			const collapsedMaxHeight = this.collapsedMaxHeight || 155;
			this.isOverflowing = Boolean(el) && el.scrollHeight > collapsedMaxHeight;
			if (!this.isOverflowing && this.isExpanded)
			{
				this.isExpanded = false;
			}
		},
		attachResizeObserver(): void
		{
			this.resizeObserver.disconnect();
			const inner = this.$refs.files?.firstElementChild;
			if (inner)
			{
				this.resizeObserver.observe(inner);
			}
		},
		showFilesViewOnboarding(): void
		{
			if (!ahaMoments.shouldShow(Option.AhaFilesView))
			{
				return;
			}

			this.$nextTick(() => {
				if (!ahaMoments.shouldShow(Option.AhaFilesView))
				{
					return;
				}

				if (!this.filesViewAhaBindElement)
				{
					return;
				}

				this.isFilesViewAhaObserved = true;
			});
		},
		showFilesViewAha(): void
		{
			if (
				this.isFilesViewAhaShown
				|| this.isFilesViewAhaPending
				|| !ahaMoments.shouldShow(Option.AhaFilesView)
			)
			{
				return;
			}

			ahaMoments.setActive(Option.AhaFilesView);
			this.isFilesViewAhaPending = true;

			// Small delay so the popup appears after the field has settled.
			this.filesViewAhaTimer = setTimeout(() => {
				this.isFilesViewAhaPending = false;
				if (!ahaMoments.shouldShow(Option.AhaFilesView))
				{
					return;
				}

				ahaMoments.setPopupShown(Option.AhaFilesView);
				this.isFilesViewAhaShown = true;
			}, 1500);
		},
		handleFilesViewAhaVisibilityChange(isFullyVisible: boolean): void
		{
			if (!isFullyVisible)
			{
				this.hideFilesViewAha();

				return;
			}

			this.showFilesViewAha();
		},
		hideFilesViewAha(): void
		{
			clearTimeout(this.filesViewAhaTimer);
			this.filesViewAhaTimer = null;
			this.isFilesViewAhaPending = false;
			this.isFilesViewAhaShown = false;
			ahaMoments.setInactive(Option.AhaFilesView);
		},
		markFilesViewAhaSeen(): void
		{
			if (!this.isFilesViewAhaShown)
			{
				return;
			}

			this.hideFilesViewAha();

			// Cross-session dedup: persist via tasks promo flag (FilesViewPromotion::isViewed).
			void Ajax.runAction('tasks.promotion.setViewed', { data: { promotion: 'tasks_files_view' } });
		},
	},
	template: `
		<div
			class="tasks-field-files"
			:data-task-id="taskId"
			:data-task-field-id="filesMeta.id"
			:data-task-files-count="filesCount"
			data-testid="task-files-container"
			ref="root"
		>
			<div class="tasks-field-files-title">
				<button
					type="button"
					class="tasks-field-files-main"
					:class="{ '--interactive': isTitleInteractive }"
					:aria-label="ariaLabel"
					:aria-haspopup="filesCount === 0 ? 'menu' : null"
					:aria-expanded="titleAriaExpanded"
					data-task-files-open
					data-testid="task-files-title-toggle"
					@click="handleOpenClick"
					ref="title"
				>
					<template v-if="isUploading">
						<BIcon class="tasks-field-files-icon" :name="Animated.LOADER_WAIT" aria-hidden="true"/>
						<span class="tasks-field-files-text">{{ loc('TASKS_V2_FILES_LOADING') }}</span>
					</template>
					<template v-else>
						<BIcon class="tasks-field-files-icon" :name="Outline.ATTACH" aria-hidden="true"/>
						<span class="tasks-field-files-text">{{ textFormatted }}</span>
					</template>
				</button>
				<div class="tasks-field-files-actions" data-testid="task-files-actions">
					<ViewSwitcher ref="viewSwitcher" @change="handleViewModeChange"/>
					<div v-if="canAttachFiles" class="tasks-field-files-add-container" v-hint="tooltip">
						<button
							type="button"
							class="tasks-field-files-add-button"
							:aria-label="loc('TASKS_V2_FILES_ADD')"
							aria-haspopup="menu"
							:aria-expanded="menuTrigger === 'add'"
							data-task-files-plus
							data-testid="task-files-add-btn"
							@click="handleAddClick"
							ref="add"
						>
							<BIcon
								class="tasks-field-files-add"
								:name="Outline.PLUS_L"
								hoverable
								aria-hidden="true"
							/>
						</button>
					</div>
				</div>
			</div>
			<div
				v-if="showPreview && filesCount > 0"
				class="tasks-field-files-list --card"
				:class="{ '--collapsed': isCollapsible && !isExpanded && isOverflowing }"
				data-testid="task-files-list"
				ref="files"
			>
				<UserFieldWidgetComponent :uploaderAdapter :widgetOptions/>
			</div>
			<div
				v-if="canDownloadArchive || isOverflowing"
				class="tasks-field-files-bottom"
				:class="{ '--with-archive': canDownloadArchive }"
			>
				<DownloadArchiveButton v-if="canDownloadArchive" :files/>
				<div
					v-if="isOverflowing"
					class="tasks-field-files-toggle"
					role="button"
					tabindex="0"
					:aria-expanded="isExpanded ? 'true' : 'false'"
					data-task-files-toggle
					data-testid="task-files-toggle-btn"
					@click="toggleExpanded"
					@keydown.enter.prevent="toggleExpanded"
					@keydown.space.prevent="toggleExpanded"
				>
					{{ loc(isExpanded ? 'TASKS_V2_FILES_COLLAPSE' : 'TASKS_V2_FILES_EXPAND') }}
				</div>
			</div>
		</div>
		<FilesViewAha
			v-if="isFilesViewAhaObserved"
			:isShown="isFilesViewAhaShown"
			:bindElement="filesViewAhaBindElement"
			@close="markFilesViewAhaSeen"
			@visibilityChange="handleFilesViewAhaVisibilityChange"
		/>
	`,
};
