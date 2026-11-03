/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, ui_uploader_core, ui_iconSet_api_vue, ui_vue3_directives_hint, ui_iconSet_animated, ui_iconSet_outline, tasks_v2_component_elements_hint, tasks_v2_provider_service_fileService, tasks_v2_provider_service_optionService, tasks_v2_component_elements_userFieldWidgetComponent, tasks_v2_const, main_core, tasks_v2_lib_ahaMoments, ui_system_menu_vue, main_sidepanel, ui_vue3_components_button, tasks_v2_lib_highlighter, ui_system_typography_vue, ui_system_chip_vue, tasks_v2_lib_fieldHighlighter, tasks_v2_lib_analytics, ui_vue3_components_popup) {
	'use strict';

	const filesMeta = Object.freeze({
		id: tasks_v2_const.TaskField.Files,
		title: main_core.Loc.getMessage('TASKS_V2_FILES_TITLE')
	});

	const sectionMain = 'view-switcher';

	// @vue/component
	const ViewSwitcher = {
		name: 'TaskFilesViewSwitcher',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			BMenu: ui_system_menu_vue.BMenu
		},
		emits: ['change'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				isMenuShown: false
			};
		},
		computed: {
			viewMode() {
				return this.$store.getters[`${tasks_v2_const.Model.Interface}/filesViewMode`];
			},
			menuOptions() {
				return () => ({
					id: 'tasks-files-view-switcher-menu',
					bindElement: this.$refs.switcher,
					offsetTop: 8,
					width: 220,
					sections: this.menuSections,
					items: this.menuItems,
					targetContainer: document.body
				});
			},
			menuSections() {
				return [{
					code: sectionMain,
					title: this.loc('TASKS_V2_FILES_VIEW_SWITCHER_TITLE')
				}];
			},
			menuItems() {
				return [{
					id: 'view-tile',
					sectionCode: sectionMain,
					title: this.loc('TASKS_V2_FILES_VIEW_TILE'),
					icon: ui_iconSet_api_vue.Outline.APPS,
					isSelected: this.viewMode === 'tile',
					onClick: () => this.handleSelect('tile')
				}, {
					id: 'view-list',
					sectionCode: sectionMain,
					title: this.loc('TASKS_V2_FILES_VIEW_LIST'),
					icon: ui_iconSet_api_vue.Outline.BULLETED_LIST,
					isSelected: this.viewMode === 'list',
					onClick: () => this.handleSelect('list')
				}];
			}
		},
		methods: {
			handleSelect(mode) {
				this.isMenuShown = false;
				if (mode !== this.viewMode) {
					this.$emit('change', mode);
				}
			}
		},
		template: `
		<div class="tasks-field-files-view-switcher" data-testid="task-files-view-switcher">
			<button
				type="button"
				class="tasks-field-files-view-switcher-button"
				:aria-label="loc('TASKS_V2_FILES_VIEW_SWITCHER_TITLE')"
				aria-haspopup="menu"
				:aria-expanded="isMenuShown"
				data-task-files-view-switcher
				data-testid="task-files-view-switcher-btn"
				@click="isMenuShown = true"
				ref="switcher"
			>
				<BIcon
					class="tasks-field-files-view-switcher-icon"
					:name="Outline.APPS"
					hoverable
					aria-hidden="true"
				/>
			</button>
			<BMenu v-if="isMenuShown" :options="menuOptions()" @close="isMenuShown = false"/>
		</div>
	`
	};

	// @vue/component
	const DownloadArchiveButton = {
		components: {
			UiButton: ui_vue3_components_button.Button
		},
		inject: {
			task: {},
			taskId: {}
		},
		props: {
			files: {
				type: Array,
				required: true
			},
			archiveLink: {
				type: String,
				default: null
			},
			entityId: {
				type: [Number, String],
				default: null
			},
			entityType: {
				type: String,
				default: tasks_v2_provider_service_fileService.EntityTypes.Task
			}
		},
		setup() {
			return {
				ButtonSize: ui_vue3_components_button.ButtonSize,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonCounterColor: ui_vue3_components_button.ButtonCounterColor,
				ButtonState: ui_vue3_components_button.ButtonState,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				loading: false
			};
		},
		computed: {
			downloadLink() {
				return this.archiveLink ?? this.task.archiveLink;
			},
			fileServiceEntityId() {
				return this.entityId ?? this.taskId;
			},
			filesSize() {
				return this.files.reduce((total, file) => total + file.size, 0);
			},
			formattedFilesSize() {
				return ui_uploader_core.formatFileSize(this.filesSize);
			}
		},
		methods: {
			async downloadArchive() {
				const service = tasks_v2_provider_service_fileService.fileService.get(this.fileServiceEntityId, this.entityType);
				if (service.hasPendingRequests()) {
					this.loading = true;
					await service.handleSave();
					this.loading = false;
				}
				main_sidepanel.SidePanel.Instance.emulateAnchorClick(this.downloadLink);
			}
		},
		template: `
		<div data-task-files-download-archive data-testid="task-files-download-archive">
			<UiButton
				:class="'tasks-files-download-archive-button'"
				:text="loc('TASKS_V2_FILES_DOWNLOAD_ARCHIVE', { '#FILES_SIZE#': formattedFilesSize })"
				:size="ButtonSize.MEDIUM"
				:style="AirButtonStyle.PLAIN_NO_ACCENT"
				:state="loading ? ButtonState.WAITING : null"
				data-testid="task-files-download-archive-btn"
				@click="downloadArchive"
			/>
		</div>
	`
	};

	// @vue/component
	const FilesViewAha = {
		components: {
			Hint: tasks_v2_component_elements_hint.Hint,
			TextMd: ui_system_typography_vue.TextMd,
			HeadlineSm: ui_system_typography_vue.HeadlineSm
		},
		props: {
			isShown: {
				type: Boolean,
				required: true
			},
			bindElement: {
				type: HTMLElement,
				default: () => null
			}
		},
		emits: ['close', 'visibilityChange'],
		data() {
			return {
				visibilityObserver: null
			};
		},
		watch: {
			bindElement() {
				this.observeBindElement();
			},
			isShown(isShown) {
				if (isShown) {
					void tasks_v2_lib_highlighter.highlighter.highlight(this.bindElement, 1000);
				}
			}
		},
		mounted() {
			this.observeBindElement();
		},
		beforeUnmount() {
			this.disconnectVisibilityObserver();
		},
		methods: {
			observeBindElement() {
				const wasObserved = this.visibilityObserver !== null;
				this.disconnectVisibilityObserver();
				if (wasObserved) {
					this.$emit('visibilityChange', false);
				}
				if (!this.bindElement) {
					return;
				}

				// eslint-disable-next-line @bitrix24/bitrix24-rules/no-io-without-polyfill
				this.visibilityObserver = new IntersectionObserver(entries => {
					const entry = entries.at(-1);
					this.$emit('visibilityChange', entry?.intersectionRatio === 1);
				}, {
					rootMargin: '-1px',
					threshold: [1]
				});
				this.visibilityObserver.observe(this.bindElement);
			},
			disconnectVisibilityObserver() {
				this.visibilityObserver?.disconnect();
				this.visibilityObserver = null;
			}
		},
		template: `
		<Hint
			v-if="isShown"
			:bindElement
			:options="{
				closeIcon: true,
				minWidth: 460,
				maxWidth: 460,
				padding: 0,
				offsetLeft: 0,
				angle: { offset: 34 },
			}"
			@close="$emit('close')"
		>
			<div class="tasks-files-view-aha-container">
				<div class="tasks-files-view-aha-icon"/>
				<div class="tasks-files-view-aha-info">
					<HeadlineSm class="tasks-files-view-aha-info-text">
						{{ loc('TASKS_V2_FILES_VIEW_ONBOARDING_TITLE') }}
					</HeadlineSm>
					<TextMd class="tasks-files-view-aha-info-text">
						{{ loc('TASKS_V2_FILES_VIEW_ONBOARDING_TEXT') }}
					</TextMd>
				</div>
			</div>
		</Hint>
	`
	};

	// Returns true when a download-archive action is available for a file list.
	function canDownloadArchive(filesCount, archiveLink) {
		return filesCount > 1 && Boolean(archiveLink);
	}

	// @vue/component
	const Files = {
		name: 'TaskFiles',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			UserFieldWidgetComponent: tasks_v2_component_elements_userFieldWidgetComponent.DiskUserFieldWidgetComponent,
			ViewSwitcher,
			DownloadArchiveButton,
			FilesViewAha
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		inject: {
			task: {},
			isEdit: {}
		},
		props: {
			taskId: {
				type: [Number, String],
				required: true
			}
		},
		setup(props) {
			return {
				Animated: ui_iconSet_api_vue.Animated,
				Outline: ui_iconSet_api_vue.Outline,
				filesMeta,
				fileService: tasks_v2_provider_service_fileService.fileService.get(props.taskId),
				uploaderAdapter: tasks_v2_provider_service_fileService.fileService.get(props.taskId).getAdapter()
			};
		},
		data() {
			return {
				files: this.fileService.getFiles(),
				showPreview: false,
				isExpanded: false,
				isOverflowing: false,
				isFilesViewAhaShown: false,
				isFilesViewAhaObserved: false,
				isFilesViewAhaPending: false,
				menuTrigger: null
			};
		},
		computed: {
			filesCount() {
				return this.files.length;
			},
			isCollapsible() {
				return this.filesCount > 1;
			},
			isTitleInteractive() {
				// The title acts as a control only when the click actually does something:
				// with no files it opens the file browser, with an overflowing list it toggles
				// collapse. A single file (or a short list) has no title action.
				return this.filesCount === 0 || this.isCollapsible && this.isOverflowing;
			},
			archiveLink() {
				return this.task.archiveLink;
			},
			canDownloadArchive() {
				return canDownloadArchive(this.filesCount, this.archiveLink);
			},
			textFormatted() {
				if (this.filesCount > 0) {
					return this.loc('TASKS_V2_FILES_COUNT', {
						'#COUNT#': this.filesCount
					});
				}
				return this.loc('TASKS_V2_FILES_TITLE');
			},
			isUploading() {
				return this.files.some(({
					status
				}) => [ui_uploader_core.FileStatus.UPLOADING, ui_uploader_core.FileStatus.LOADING].includes(status));
			},
			ariaLabel() {
				if (this.isUploading) {
					return this.loc('TASKS_V2_FILES_LOADING');
				}
				if (this.filesCount === 0) {
					return this.loc('TASKS_V2_FILES_ARIA_LABEL');
				}
				return this.loc('TASKS_V2_FILES_COUNT_ARIA_LABEL', {
					'#COUNT#': this.filesCount
				});
			},
			titleAriaExpanded() {
				// With no files the title owns the file source menu; with an overflowing list it
				// owns the collapse. In every other state it is not a disclosure at all.
				if (this.filesCount === 0) {
					return this.menuTrigger === 'title';
				}
				return this.isCollapsible && this.isOverflowing ? this.isExpanded : null;
			},
			canAttachFiles() {
				return this.task.rights.attachFile || this.task.rights.edit;
			},
			viewMode() {
				return this.$store.getters[`${tasks_v2_const.Model.Interface}/filesViewMode`];
			},
			filesViewAhaBindElement() {
				return this.$refs.viewSwitcher?.$el?.querySelector('[data-task-files-view-switcher]') ?? null;
			},
			widgetOptions() {
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
						forceDisableSelection: true
					}
				};
			},
			tooltip() {
				return () => tasks_v2_component_elements_hint.tooltip({
					text: this.loc('TASKS_V2_FILES_ADD'),
					popupOptions: {
						offsetLeft: this.$refs.add.offsetWidth / 2
					}
				});
			}
		},
		watch: {
			files: {
				handler(newFiles) {
					if (newFiles.length > 0 && this.fileService.isFileBrowserClosed()) {
						this.showPreview = true;
						this.fileService.resetFileBrowserClosedState();
					}
					if (!this.isCollapsible) {
						this.isExpanded = false;
					}
					if (newFiles.length > 0) {
						this.showFilesViewOnboarding();
					}
					this.$nextTick(() => {
						this.attachResizeObserver();
						this.updateOverflow();
					});
				},
				deep: true
			},
			showPreview() {
				this.$nextTick(() => {
					this.attachResizeObserver();
					this.updateOverflow();
				});
			}
		},
		created() {
			this.overflowRafId = null;
			this.resizeObserver = new ResizeObserver(() => {
				cancelAnimationFrame(this.overflowRafId);
				this.overflowRafId = requestAnimationFrame(() => this.updateOverflow());
			});
		},
		mounted() {
			// Read the collapsed max-height once from the CSS custom property to avoid duplicating the value in JS.
			// $el is a fragment anchor for multi-root templates; use $refs.root (the actual .tasks-field-files div)
			// where the CSS variable is defined.
			const rootEl = this.$refs.root;
			const raw = rootEl ? getComputedStyle(rootEl).getPropertyValue('--tasks-field-files-collapsed-max-height').trim() : '';
			this.collapsedMaxHeight = parseInt(raw, 10) || 155;
			this.showPreview = this.isEdit;
			if (this.filesCount > 0) {
				this.showFilesViewOnboarding();
			}
			this.$nextTick(() => {
				this.attachResizeObserver();
				this.updateOverflow();
			});
		},
		beforeUnmount() {
			this.resizeObserver?.disconnect();
			cancelAnimationFrame(this.overflowRafId);
			this.markFilesViewAhaSeen();
			clearTimeout(this.filesViewAhaTimer);

			// Release the global aha slot: without this, unmounting between setActive()
			// and the popup close keeps every other aha moment suppressed on this page.
			tasks_v2_lib_ahaMoments.ahaMoments.setInactive(tasks_v2_const.Option.AhaFilesView);
		},
		methods: {
			handleAddClick() {
				this.returnFocusElement = document.activeElement;
				this.fileService.browse({
					bindElement: this.$refs.add,
					onShowCallback: () => this.onFileBrowserShow('add'),
					onHideCallback: this.onFileBrowserClose
				});
			},
			handleOpenClick() {
				if (!this.isTitleInteractive) {
					return;
				}
				if (this.filesCount === 0) {
					this.returnFocusElement = document.activeElement;
					this.fileService.browse({
						bindElement: this.$refs.title,
						onShowCallback: () => this.onFileBrowserShow('title'),
						onHideCallback: this.onFileBrowserClose
					});
					return;
				}
				if (this.isCollapsible) {
					this.toggleExpanded();
				}
			},
			toggleExpanded() {
				this.isExpanded = !this.isExpanded;
			},
			onFileBrowserShow(trigger) {
				this.menuTrigger = trigger;
			},
			onFileBrowserClose() {
				this.menuTrigger = null;
				this.fileService.setFileBrowserClosed(true);
				const element = this.returnFocusElement;
				this.returnFocusElement = null;
				if (element?.isConnected) {
					element.focus?.();
				}
			},
			handleViewModeChange(mode) {
				void this.$store.dispatch(`${tasks_v2_const.Model.Interface}/updateFilesViewMode`, mode);
				void tasks_v2_provider_service_optionService.optionService.set(tasks_v2_const.Option.FilesViewMode, mode);
				this.$nextTick(() => this.updateOverflow());
			},
			updateOverflow() {
				const el = this.$refs.files;
				const collapsedMaxHeight = this.collapsedMaxHeight || 155;
				this.isOverflowing = Boolean(el) && el.scrollHeight > collapsedMaxHeight;
				if (!this.isOverflowing && this.isExpanded) {
					this.isExpanded = false;
				}
			},
			attachResizeObserver() {
				this.resizeObserver.disconnect();
				const inner = this.$refs.files?.firstElementChild;
				if (inner) {
					this.resizeObserver.observe(inner);
				}
			},
			showFilesViewOnboarding() {
				if (!tasks_v2_lib_ahaMoments.ahaMoments.shouldShow(tasks_v2_const.Option.AhaFilesView)) {
					return;
				}
				this.$nextTick(() => {
					if (!tasks_v2_lib_ahaMoments.ahaMoments.shouldShow(tasks_v2_const.Option.AhaFilesView)) {
						return;
					}
					if (!this.filesViewAhaBindElement) {
						return;
					}
					this.isFilesViewAhaObserved = true;
				});
			},
			showFilesViewAha() {
				if (this.isFilesViewAhaShown || this.isFilesViewAhaPending || !tasks_v2_lib_ahaMoments.ahaMoments.shouldShow(tasks_v2_const.Option.AhaFilesView)) {
					return;
				}
				tasks_v2_lib_ahaMoments.ahaMoments.setActive(tasks_v2_const.Option.AhaFilesView);
				this.isFilesViewAhaPending = true;

				// Small delay so the popup appears after the field has settled.
				this.filesViewAhaTimer = setTimeout(() => {
					this.isFilesViewAhaPending = false;
					if (!tasks_v2_lib_ahaMoments.ahaMoments.shouldShow(tasks_v2_const.Option.AhaFilesView)) {
						return;
					}
					tasks_v2_lib_ahaMoments.ahaMoments.setPopupShown(tasks_v2_const.Option.AhaFilesView);
					this.isFilesViewAhaShown = true;
				}, 1500);
			},
			handleFilesViewAhaVisibilityChange(isFullyVisible) {
				if (!isFullyVisible) {
					this.hideFilesViewAha();
					return;
				}
				this.showFilesViewAha();
			},
			hideFilesViewAha() {
				clearTimeout(this.filesViewAhaTimer);
				this.filesViewAhaTimer = null;
				this.isFilesViewAhaPending = false;
				this.isFilesViewAhaShown = false;
				tasks_v2_lib_ahaMoments.ahaMoments.setInactive(tasks_v2_const.Option.AhaFilesView);
			},
			markFilesViewAhaSeen() {
				if (!this.isFilesViewAhaShown) {
					return;
				}
				this.hideFilesViewAha();

				// Cross-session dedup: persist via tasks promo flag (FilesViewPromotion::isViewed).
				void main_core.ajax.runAction('tasks.promotion.setViewed', {
					data: {
						promotion: 'tasks_files_view'
					}
				});
			}
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
	`
	};

	// @vue/component
	const FilesPopup = {
		components: {
			Popup: ui_vue3_components_popup.Popup,
			UiButton: ui_vue3_components_button.Button,
			UserFieldWidgetComponent: tasks_v2_component_elements_userFieldWidgetComponent.DiskUserFieldWidgetComponent
		},
		props: {
			taskId: {
				type: [Number, String],
				required: true
			},
			getBindElement: {
				type: Function,
				required: true
			}
		},
		emits: ['upload', 'close'],
		setup(props) {
			return {
				ButtonSize: ui_vue3_components_button.ButtonSize,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonIcon: ui_vue3_components_button.ButtonIcon,
				Outline: ui_iconSet_api_vue.Outline,
				uploaderAdapter: tasks_v2_provider_service_fileService.fileService.get(props.taskId).getAdapter()
			};
		},
		data() {
			return {
				files: tasks_v2_provider_service_fileService.fileService.get(this.taskId).getFiles()
			};
		},
		computed: {
			bindElement() {
				return this.getBindElement();
			},
			options() {
				return {
					id: 'tasks-field-files-popup',
					bindElement: this.bindElement,
					targetContainer: document.body,
					minWidth: 380,
					maxHeight: 320,
					padding: 14,
					bindOptions: {
						forceBindPosition: true,
						forceTop: true,
						position: 'top'
					},
					focusTrap: true,
					closeByEsc: true,
					ariaLabel: this.loc('TASKS_V2_FILES_ARIA_LABEL'),
					autoHideHandler: event => {
						const anyTileMenuShown = this.files.some(({
							isMenuShown
						}) => isMenuShown);
						return this.$refs.popup?.autoHideHandler(event) && !anyTileMenuShown;
					}
				};
			},
			viewMode() {
				return this.$store.getters[`${tasks_v2_const.Model.Interface}/filesViewMode`];
			},
			widgetOptions() {
				return {
					isEmbedded: true,
					withControlPanel: false,
					canCreateDocuments: false,
					viewMode: this.viewMode,
					tileWidgetOptions: {
						hideDropArea: true,
						enableDropzone: false,
						compact: true,
						autoCollapse: false
					}
				};
			},
			filesCount() {
				return this.files.length;
			}
		},
		watch: {
			filesCount() {
				if (this.filesCount === 0) {
					this.closePopup();
				}
			}
		},
		methods: {
			handleClearClick() {
				tasks_v2_provider_service_fileService.fileService.get(this.taskId).getAdapter().getUploader().removeFiles();
				this.closePopup();
			},
			handleUploadClick() {
				tasks_v2_provider_service_fileService.fileService.get(this.taskId).browseFiles();
			},
			handleMyDriveClick() {
				tasks_v2_provider_service_fileService.fileService.get(this.taskId).browseMyDrive();
			},
			closePopup() {
				this.$emit('close');
			}
		},
		template: `
		<Popup :options ref="popup" @close="closePopup">
			<div class="tasks-field-files-popup" data-testid="task-files-popup">
				<div class="tasks-field-files-popup-files" data-testid="task-files-popup-list">
					<UserFieldWidgetComponent :uploaderAdapter :widgetOptions/>
				</div>
				<div class="tasks-field-files-popup-footer" data-testid="task-files-popup-footer">
					<div class="tasks-field-files-popup-add-buttons">
						<UiButton
							:text="loc('TASKS_V2_FILES_UPLOAD_BUTTON')"
							:size="ButtonSize.SMALL"
							:style="AirButtonStyle.TINTED"
							:leftIcon="Outline.DOWNLOAD"
							data-testid="task-files-popup-upload-btn"
							@click="handleUploadClick"
						/>
						<UiButton
							:text="loc('TASKS_V2_FILES_MY_DRIVE')"
							:size="ButtonSize.SMALL"
							:style="AirButtonStyle.TINTED"
							:leftIcon="Outline.UPLOAD"
							data-testid="task-files-popup-my-drive-btn"
							@click="handleMyDriveClick"
						/>
					</div>
					<UiButton
						:text="loc('TASKS_V2_FILES_CLEAR')"
						:size="ButtonSize.SMALL"
						:style="AirButtonStyle.PLAIN_NO_ACCENT"
						:leftIcon="Outline.TRASHCAN"
						data-testid="task-files-popup-clear-btn"
						@click="handleClearClick"
					/>
				</div>
			</div>
		</Popup>
	`
	};

	// @vue/component
	const FilesChip = {
		components: {
			Chip: ui_system_chip_vue.Chip,
			FilesPopup
		},
		inject: {
			analytics: {},
			cardType: {},
			task: {}
		},
		props: {
			taskId: {
				type: [Number, String],
				required: true
			},
			isAutonomous: {
				type: Boolean,
				default: false
			}
		},
		setup(props) {
			return {
				filesMeta,
				fileService: tasks_v2_provider_service_fileService.fileService.get(props.taskId)
			};
		},
		data() {
			return {
				files: this.fileService.getFiles(),
				isPopupShown: false,
				isPopupShownWithFiles: false,
				isMenuShown: false
			};
		},
		computed: {
			group() {
				return this.$store.getters[`${tasks_v2_const.Model.Groups}/getById`](this.task.groupId);
			},
			filesCount() {
				return this.files.length;
			},
			design() {
				return {
					[!this.isAutonomous && !this.isSelected]: ui_system_chip_vue.ChipDesign.ShadowNoAccent,
					[!this.isAutonomous && this.isSelected]: ui_system_chip_vue.ChipDesign.ShadowAccent,
					[this.isAutonomous && !this.isSelected]: ui_system_chip_vue.ChipDesign.OutlineNoAccent,
					[this.isAutonomous && this.isSelected]: ui_system_chip_vue.ChipDesign.OutlineAccent,
					[this.hasError]: ui_system_chip_vue.ChipDesign.OutlineAlert
				}.true;
			},
			isSelected() {
				if (this.isAutonomous) {
					return this.files.length > 0;
				}
				return this.task.filledFields[filesMeta.id] || this.files.length > 0;
			},
			icon() {
				if (this.isAutonomous && this.isUploading) {
					return ui_iconSet_api_vue.Animated.LOADER_WAIT;
				}
				return ui_iconSet_api_vue.Outline.ATTACH;
			},
			text() {
				if (this.isAutonomous && this.filesCount > 0) {
					return this.loc('TASKS_V2_FILES_COUNT', {
						'#COUNT#': this.filesCount
					});
				}
				return filesMeta.title;
			},
			isUploading() {
				return this.fileService.isUploading();
			},
			hasError() {
				return this.files.some(({
					status
				}) => [ui_uploader_core.FileStatus.UPLOAD_FAILED, ui_uploader_core.FileStatus.LOAD_FAILED].includes(status));
			},
			canAttachFiles() {
				return this.task.rights.attachFile || this.task.rights.edit;
			},
			popupHasAlreadyBeenShown() {
				return this.filesCount > 0 && this.isPopupShownWithFiles;
			},
			opensDialog() {
				return this.isAutonomous || !this.isSelected;
			},
			ariaLabel() {
				if (!this.isAutonomous || this.filesCount === 0) {
					return this.loc('TASKS_V2_FILES_ARIA_LABEL');
				}
				return this.loc('TASKS_V2_FILES_COUNT_ARIA_LABEL', {
					'#COUNT#': this.filesCount
				});
			}
		},
		watch: {
			isPopupShown: {
				handler() {
					this.syncAria();
				},
				flush: 'post'
			},
			opensDialog: {
				handler() {
					this.syncAria();
				},
				flush: 'post'
			},
			filesCount: {
				handler() {
					this.syncAria();
				},
				flush: 'post'
			},
			isMenuShown: {
				handler() {
					this.syncAria();
				},
				flush: 'post'
			}
		},
		mounted() {
			this.syncAria();
			this.fileService.subscribe('onFileAdd', this.handleFileAdd);
			this.fileService.subscribe('onFileAttach', this.handleFileAttach);
		},
		beforeUnmount() {
			this.fileService.unsubscribe('onFileAdd', this.handleFileAdd);
			this.fileService.unsubscribe('onFileAttach', this.handleFileAttach);
		},
		methods: {
			handleFileAdd() {
				if (this.isAutonomous && this.popupHasAlreadyBeenShown) {
					this.showPopup();
				}
			},
			handleFileAttach(event) {
				this.sendAnalytics(event.getData());
			},
			sendAnalytics(file) {
				tasks_v2_lib_analytics.analytics.sendAttachFile(this.analytics, {
					cardType: this.cardType,
					collabId: this.group?.type === tasks_v2_const.GroupType.Collab ? this.group.id : null,
					fileOrigin: file.origin,
					fileSize: file.size,
					fileExtension: file.extension,
					filesCount: this.filesCount
				});
			},
			handleClick() {
				if (!this.isAutonomous && this.isSelected) {
					this.highlightField();
					return;
				}
				if (this.files.length > 0) {
					this.isPopupShownWithFiles = true;
					this.showPopup();
				} else {
					this.browseFiles();
				}
			},
			showPopup() {
				this.isPopupShown = true;
			},
			closePopup() {
				this.isPopupShown = false;
				if (!this.filesCount) {
					this.isPopupShownWithFiles = false;
				}
			},
			browseFiles() {
				const bindElement = this.getChipElement();
				if (!bindElement) {
					return;
				}
				this.fileService.browse({
					bindElement,
					onShowCallback: this.onFileBrowserShow,
					onHideCallback: this.onFileBrowserClose,
					compact: this.cardType === tasks_v2_const.CardType.Compact
				});
			},
			highlightField() {
				void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(filesMeta.id);
			},
			onFileBrowserShow() {
				this.isMenuShown = true;
			},
			onFileBrowserClose() {
				this.isMenuShown = false;
				this.$refs.chip?.$el.focus();
				this.fileService.setFileBrowserClosed(true);
			},
			handleKeydown(event) {
				if (event.key !== ' ') {
					return;
				}
				event.preventDefault();
				this.handleClick();
			},
			syncAria() {
				const el = this.getChipElement();
				if (!el) {
					return;
				}
				main_core.Dom.attr(el, 'role', 'button');
				main_core.Dom.attr(el, 'aria-label', this.ariaLabel);
				if (!this.opensDialog) {
					main_core.Dom.attr(el, 'aria-haspopup', null);
					main_core.Dom.attr(el, 'aria-expanded', null);
					return;
				}
				const opensMenu = this.filesCount === 0;
				main_core.Dom.attr(el, 'aria-haspopup', opensMenu ? 'menu' : 'dialog');
				main_core.Dom.attr(el, 'aria-expanded', String(opensMenu ? this.isMenuShown : this.isPopupShown));
			},
			getChipElement() {
				return this.$refs.chip?.$el ?? null;
			}
		},
		template: `
		<Chip
			v-if="isSelected || canAttachFiles"
			:design
			:icon
			:text
			:data-task-id="taskId"
			:data-task-chip-id="filesMeta.id"
			ref="chip"
			@click="handleClick"
			@keydown="handleKeydown"
		/>
		<FilesPopup
			v-if="isPopupShown && getChipElement()"
			:taskId
			:getBindElement="getChipElement"
			@upload="browseFiles"
			@close="closePopup"
		/>
	`
	};

	exports.DownloadArchiveButton = DownloadArchiveButton;
	exports.Files = Files;
	exports.FilesChip = FilesChip;
	exports.canDownloadArchive = canDownloadArchive;
	exports.filesMeta = filesMeta;

})(this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}, BX.UI.Uploader, BX.UI.IconSet, BX.Vue3.Directives, window, window, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Const, BX, BX.Tasks.V2.Lib, BX.UI.System.Menu, BX.SidePanel, BX.Vue3.Components, BX.Tasks.V2.Lib, BX.UI.System.Typography.Vue, BX.UI.System.Chip.Vue, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.UI.Vue3.Components);
//# sourceMappingURL=files.bundle.js.map
