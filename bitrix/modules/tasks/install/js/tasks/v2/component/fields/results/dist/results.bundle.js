/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, main_core, main_core_events, ui_a11y, tasks_v2_lib_showLimit, ui_vue3_vuex, ui_vue3_directives_hint, ui_vue3_components_menu, ui_system_typography_vue, ui_iconSet_api_vue, ui_iconSet_animated, ui_iconSet_outline, tasks_v2_core, tasks_v2_const, tasks_v2_lib_ahaMoments, tasks_v2_lib_fieldHighlighter, tasks_v2_component_elements_hint, tasks_v2_provider_service_resultService, tasks_v2_provider_service_taskService, tasks_v2_provider_service_stateService, ui_vue3, tasks_v2_component_tasksPopupButtonQuote, tasks_v2_lib_calendar, tasks_v2_component_elements_userAvatar, tasks_v2_component_entityText, tasks_v2_component_elements_userFieldWidgetComponent, tasks_v2_component_fields_files, tasks_v2_provider_service_userService, tasks_v2_provider_service_fileService, ui_vue3_components_button, tasks_v2_component_elements_bottomSheet, tasks_v2_lib_bottomSheetAria, tasks_v2_lib_highlighter, ui_system_skeleton_vue, tasks_v2_component_dropZone, ui_uploader_core, ui_notificationManager, tasks_v2_lib_analytics, ui_system_chip_vue) {
	'use strict';

	const resultsMeta = Object.freeze({
		id: tasks_v2_const.TaskField.Results,
		title: main_core.Loc.getMessage('TASKS_V2_RESULT_TITLE_META')
	});

	function captureFocusTrigger() {
		const active = document.activeElement;
		return active && active !== document.body ? active : null;
	}
	function restoreFocusTrigger(trigger) {
		if (trigger && trigger.isConnected && main_core.Type.isFunction(trigger.focus)) {
			trigger.focus();
			return;
		}
		ui_a11y.FocusMonitor.Instance.restoreFocus();
	}

	const REQUIRED_STABLE_INTERVALS = 2;
	const MAX_MEASURED_FRAMES = 30;
	function waitForStableRect(element) {
		return new StableRectWaiter(element).start();
	}

	/**
	 * Waits until the element has a non-zero box that keeps the same position and size.
	 * A box-less element is awaited on a size observer, so a hidden anchor costs nothing
	 * and still resolves once it becomes visible; measuring is limited by a frame budget,
	 * so an endlessly moving anchor gives up instead of looping forever.
	 */
	class StableRectWaiter {
		#element;
		#promise;
		#resolve = () => {};
		#frameId = null;
		#sizeObserver = null;
		#previousRect = null;
		#stableIntervals = 0;
		#remainingFrames = MAX_MEASURED_FRAMES;
		#isFinished = false;
		constructor(element) {
			this.#element = element;
			this.#promise = new Promise(resolve => {
				this.#resolve = resolve;
			});
		}
		start() {
			if (this.#element.isConnected) {
				this.#observeSize();
			} else {
				this.#finish(false);
			}
			return {
				promise: this.#promise,
				cancel: () => this.#finish(false)
			};
		}
		#observeSize() {
			if (this.#isFinished) {
				return;
			}
			this.#sizeObserver = new ResizeObserver(() => this.#handleResize());
			this.#sizeObserver.observe(this.#element);
		}
		#handleResize() {
			if (this.#isFinished || this.#readRect() === null) {
				return;
			}
			this.#stopObserving();
			this.#scheduleMeasure();
		}
		#measure() {
			this.#frameId = null;
			const rect = this.#readRect();
			if (rect === null) {
				this.#previousRect = null;
				this.#stableIntervals = 0;
				this.#observeSize();
				return;
			}
			this.#stableIntervals = isSameRect(rect, this.#previousRect) ? this.#stableIntervals + 1 : 0;
			this.#previousRect = rect;
			if (this.#stableIntervals >= REQUIRED_STABLE_INTERVALS) {
				this.#finish(true);
				return;
			}
			this.#scheduleMeasure();
		}
		#scheduleMeasure() {
			if (this.#remainingFrames <= 0) {
				this.#finish(false);
				return;
			}
			this.#remainingFrames--;
			this.#frameId = requestAnimationFrame(() => this.#measure());
		}
		#readRect() {
			if (!this.#element.isConnected) {
				this.#finish(false);
				return null;
			}
			const {
				left,
				top,
				width,
				height
			} = this.#element.getBoundingClientRect();
			return width > 0 && height > 0 ? {
				left,
				top,
				width,
				height
			} : null;
		}
		#stopObserving() {
			this.#sizeObserver?.disconnect();
			this.#sizeObserver = null;
		}
		#finish(isStable) {
			if (this.#isFinished) {
				return;
			}
			this.#isFinished = true;
			this.#stopObserving();
			if (this.#frameId !== null) {
				cancelAnimationFrame(this.#frameId);
				this.#frameId = null;
			}
			this.#resolve(isStable);
		}
	}
	function isSameRect(rect, previousRect) {
		return previousRect !== null && rect.left === previousRect.left && rect.top === previousRect.top && rect.width === previousRect.width && rect.height === previousRect.height;
	}

	const TYPES_QUOTE_ACTIONS$1 = {
		MESSAGE: tasks_v2_component_tasksPopupButtonQuote.TYPES_DEFAULT_QUOTE_ACTIONS.MESSAGE
	};

	// @vue/component
	const ResultCardItem = {
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			BMenu: ui_vue3_components_menu.BMenu,
			UserAvatar: tasks_v2_component_elements_userAvatar.UserAvatar,
			UserFieldWidgetComponent: tasks_v2_component_elements_userFieldWidgetComponent.DiskUserFieldWidgetComponent,
			EntityCollapsibleText: tasks_v2_component_entityText.EntityCollapsibleText,
			TasksPopupButtonQuote: tasks_v2_component_tasksPopupButtonQuote.TasksPopupButtonQuote,
			DownloadArchiveButton: tasks_v2_component_fields_files.DownloadArchiveButton,
			TextSm: ui_system_typography_vue.TextSm,
			TextXs: ui_system_typography_vue.TextXs,
			TextMd: ui_system_typography_vue.TextMd,
			Hint: tasks_v2_component_elements_hint.Hint
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		inject: {
			task: {},
			taskId: {}
		},
		props: {
			resultId: {
				type: [Number, String],
				required: true
			},
			isAnySheetShown: {
				type: Boolean,
				default: false
			}
		},
		emits: ['titleClick', 'edit', 'highlightField'],
		setup(props) {
			const fileServiceInstance = tasks_v2_provider_service_fileService.fileService.get(props.resultId, tasks_v2_provider_service_fileService.EntityTypes.Result);
			const fileServiceRef = ui_vue3.shallowRef(fileServiceInstance);
			const uploaderAdapterRef = ui_vue3.shallowRef(fileServiceInstance.getAdapter());
			return {
				Outline: ui_iconSet_api_vue.Outline,
				EntityTypes: tasks_v2_provider_service_fileService.EntityTypes,
				resultsMeta,
				UserAvatarSize: tasks_v2_component_elements_userAvatar.UserAvatarSize,
				fileService: fileServiceRef,
				uploaderAdapter: uploaderAdapterRef
			};
		},
		data() {
			return {
				elementAnchorQuote: null,
				elementScrollContainerQuote: null,
				opened: false,
				isMenuShown: false,
				showResultFromMessageHint: false,
				files: this.fileService.getFiles()
			};
		},
		computed: {
			actionsQuote() {
				const actionQuoteMessage = {
					type: TYPES_QUOTE_ACTIONS$1.MESSAGE,
					chatId: this.task.chatId
				};
				return [actionQuoteMessage];
			},
			result() {
				return this.$store.getters[`${tasks_v2_const.Model.Results}/getById`](this.resultId);
			},
			isEdit() {
				return main_core.Type.isNumber(this.resultId) && this.resultId > 0;
			},
			resultTitle() {
				return this.loc('TASKS_V2_RESULT_TITLE_WITH_DATE', {
					'#DATE#': this.resultDate
				});
			},
			resultDate() {
				if (!this.result.createdAtTs) {
					return '';
				}
				return tasks_v2_lib_calendar.calendar.formatDateTime(this.result.createdAtTs);
			},
			resultText() {
				return this.result.text ?? '';
			},
			resultAuthor() {
				return this.result.author;
			},
			filesCount() {
				return this.files.length;
			},
			archiveLink() {
				return this.result.archiveLink;
			},
			canDownloadArchive() {
				return tasks_v2_component_fields_files.canDownloadArchive(this.filesCount, this.archiveLink);
			},
			widgetOptions() {
				return {
					isEmbedded: true,
					withControlPanel: false,
					canCreateDocuments: false,
					viewMode: 'list',
					tileWidgetOptions: {
						compact: true,
						hideDropArea: true,
						readonly: true,
						enableDropzone: false,
						autoCollapse: false
					}
				};
			},
			menuOptions() {
				return {
					id: `result-action-menu-${main_core.Text.getRandom()}`,
					bindOptions: {
						forceBindPosition: true
					},
					bindElement: this.$refs.moreIcon,
					targetContainer: document.body,
					offsetLeft: -100,
					minWidth: 250,
					items: this.menuItems,
					autoHide: true,
					closeByEsc: true
				};
			},
			menuItems() {
				return [this.result.rights.edit && this.isEdit && {
					title: this.loc('TASKS_V2_RESULT_EDIT'),
					icon: ui_iconSet_api_vue.Outline.EDIT_L,
					onClick: this.handleEditClick.bind(this),
					dataset: {
						id: `MenuResultEdit-${this.resultId}`
					}
				}, this.result.rights.remove && {
					design: 'alert',
					title: this.loc('TASKS_V2_RESULT_REMOVE'),
					icon: ui_iconSet_api_vue.Outline.TRASHCAN,
					onClick: this.handleDeleteClick.bind(this),
					dataset: {
						id: `MenuResultRemove-${this.resultId}`
					}
				}].filter(Boolean);
			},
			hasMenuItems() {
				return this.menuItems.length > 0;
			},
			tooltip() {
				return () => tasks_v2_component_elements_hint.tooltip({
					text: this.loc('TASKS_V2_RESULT_ADD'),
					popupOptions: {
						offsetLeft: this.$refs.addIcon.offsetWidth / 2
					}
				});
			}
		},
		watch: {
			resultId(newResultId) {
				this.fileService = tasks_v2_provider_service_fileService.fileService.get(newResultId, tasks_v2_provider_service_fileService.EntityTypes.Result);
				this.uploaderAdapter = this.fileService.getAdapter();
				this.files = this.fileService.getFiles();
				this.opened = false;
			},
			resultText() {
				void this.$nextTick(this.$refs.collapsible?.updateIsOverflowing);
			}
		},
		mounted() {
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.ResultFromMessageAdded, this.handleResultFromMessageAdded);
			this.elementAnchorQuote = this.$refs.collapsible.$el.parentNode?.querySelector('.tasks-card-entity-collapsible-text');
			this.elementScrollContainerQuote = this.elementAnchorQuote?.closest('.tasks-full-card-content');
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.ResultFromMessageAdded, this.handleResultFromMessageAdded);
		},
		methods: {
			handleMenuClose() {
				this.isMenuShown = false;
				this.$refs.moreIcon?.focus();
			},
			handleEditClick() {
				this.$emit('edit', this.resultId);
			},
			handleDeleteClick() {
				void tasks_v2_provider_service_resultService.resultService.delete(this.resultId);
			},
			handleAuthorClick() {
				BX.SidePanel.Instance.emulateAnchorClick(tasks_v2_provider_service_userService.userService.getUrl(this.resultAuthor.id));
			},
			handleResultFromMessageAdded(event) {
				const {
					taskId
				} = event.getData();
				if (this.taskId !== taskId) {
					return;
				}
				this.$emit('highlightField');
				if (this.isAnySheetShown || !this.hasMenuItems) {
					return;
				}
				if (!tasks_v2_lib_ahaMoments.ahaMoments.shouldShow(tasks_v2_const.Option.AhaResultFromMessagePopup)) {
					return;
				}
				tasks_v2_lib_ahaMoments.ahaMoments.setActive(tasks_v2_const.Option.AhaResultFromMessagePopup);
				this.showResultFromMessageHint = true;
			},
			handleResultFromMessageHintClose() {
				this.showResultFromMessageHint = false;
				tasks_v2_lib_ahaMoments.ahaMoments.setInactive(tasks_v2_const.Option.AhaResultFromMessagePopup);
			},
			handleResultFromMessageHintCloseComplete() {
				if (!this.showResultFromMessageHint) {
					return;
				}
				this.showResultFromMessageHint = false;
				tasks_v2_lib_ahaMoments.ahaMoments.setShown(tasks_v2_const.Option.AhaResultFromMessagePopup);
			}
		},
		template: `
		<div
			class="tasks-field-results-result --card print-no-border print-no-box-shadow"
			data-testid="tasks-result-card-item"
			:data-task-field-id="resultsMeta.id"
			data-field-container
		>
			<div
				class="tasks-field-results-title"
				data-testid="task-result-card-title"
				ref="title"
			>
				<button
					type="button"
					class="tasks-field-results-title-main"
					data-testid="tasks-result-card-item-title-btn"
					@click="$emit('titleClick', resultId)"
				>
					<BIcon :name="Outline.WINDOW_FLAG" aria-hidden="true"/>
					<TextMd accent>{{ resultTitle }}</TextMd>
				</button>
				<div class="tasks-field-results-title-actions print-ignore">
					<button
						v-if="hasMenuItems"
						type="button"
						class="tasks-field-results-icon-button"
						aria-haspopup="menu"
						data-testid="tasks-result-card-item-menu-btn"
						:aria-expanded="isMenuShown ? 'true' : 'false'"
						:aria-label="loc('TASKS_V2_RESULT_ITEM_MENU_LABEL')"
						ref="moreIcon"
						@click.stop="isMenuShown = true"
					>
						<BIcon
							class="tasks-field-results-title-icon"
							:name="Outline.MORE_L"
							hoverable
							aria-hidden="true"
						/>
					</button>
					<BMenu v-if="isMenuShown" :options="menuOptions" @close="handleMenuClose"/>
					<Hint
						v-if="showResultFromMessageHint && hasMenuItems"
						:bindElement="$refs.moreIcon"
						:options="{
							closeIcon: true,
							offsetLeft: 10,
							minWidth: 340,
							maxWidth: 340,
							focusTrap: { initialFocus: false },
							bindOptions: {
								forceBindPosition: true,
							},
						}"
						@close="handleResultFromMessageHintClose"
					>
						<div class="tasks-field-results-hint-info --from-message">
							<TextMd className="tasks-field-results-hint-info-text">
								{{ loc('TASKS_V2_RESULT_AHA_RESULT_FROM_MESSAGE') }}
							</TextMd>
							<TextXs
								tag="button"
								type="button"
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
				<div class="tasks-field-results-result-author-border print-no-after">
					<button
						type="button"
						class="tasks-field-results-result-author-border-clickable"
						:aria-label="loc('TASKS_V2_RESULT_AUTHOR_PROFILE_LABEL', { '#NAME#': resultAuthor.name })"
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
					</button>
				</div>
				<EntityCollapsibleText
					ref="collapsible"
					:files
					:content="resultText"
					readonly
					:showFilesIndicator="false"
					v-model:opened="opened"
				/>
				<div v-if="filesCount > 0" class="tasks-field-results-result-files print-ignore" :key="resultId" data-testid="task-result-card-files">
					<UserFieldWidgetComponent :uploaderAdapter :widgetOptions/>
					<DownloadArchiveButton
						v-if="canDownloadArchive"
						:files
						:archiveLink
						:entityId="resultId"
						:entityType="EntityTypes.Result"
					/>
				</div>
			</div>
			<TasksPopupButtonQuote
				v-if="elementAnchorQuote"
				:isQuoteTrimmed="true"
				:elementAnchor="elementAnchorQuote"
				:elementScrollContainer="elementScrollContainerQuote"
				:actions="actionsQuote"
			/>
		</div>
	`
	};

	// @vue/component
	const ResultRequiredAha = {
		components: {
			UiButton: ui_vue3_components_button.Button,
			Hint: tasks_v2_component_elements_hint.Hint,
			TextMd: ui_system_typography_vue.TextMd,
			HeadlineSm: ui_system_typography_vue.HeadlineSm
		},
		props: {
			bindElement: {
				type: Object,
				required: true
			},
			popupWidth: {
				type: Number,
				default: 530
			},
			hasResults: {
				type: Boolean,
				default: false
			}
		},
		emits: ['close', 'addResult'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		computed: {
			title() {
				return this.hasResults ? this.loc('TASKS_V2_RESULT_AHA_REQUIRE_NEW_RESULT_RESPONSIBLE_TITLE') : this.loc('TASKS_V2_RESULT_AHA_REQUIRE_RESULT_RESPONSIBLE_TITLE');
			},
			description() {
				return this.hasResults ? this.loc('TASKS_V2_RESULT_AHA_REQUIRE_NEW_RESULT_RESPONSIBLE_DESC') : this.loc('TASKS_V2_RESULT_AHA_REQUIRE_RESULT_RESPONSIBLE_DESC');
			}
		},
		template: `
		<Hint
			:bindElement
			:options="{
				closeIcon: true,
				minWidth: popupWidth,
				maxWidth: popupWidth,
				padding: 0,
				ariaLabel: title,
				focusTrap: { initialFocus: false },
			}"
			@close="$emit('close')"
		>
			<div class="tasks-field-results-hint-container">
				<div class="tasks-field-results-hint-icon"/>
				<div class="tasks-field-results-hint-info">
					<HeadlineSm className="tasks-field-results-hint-info-text">{{ title }}</HeadlineSm>
					<TextMd className="tasks-field-results-hint-info-text">{{ description }}</TextMd>
					<div class="tasks-field-results-hint-button">
						<UiButton
							:text="loc('TASKS_V2_RESULT_ADD')"
							:size="ButtonSize.SMALL"
							:style="AirButtonStyle.TINTED"
							:leftIcon="Outline.PLUS_L"
							:wide="false"
							:dataset="{ testid: 'tasks-result-required-aha-add-btn' }"
							@click="$emit('addResult')"
						/>
					</div>
				</div>
			</div>
		</Hint>
	`
	};

	const TYPES_QUOTE_ACTIONS = {
		MESSAGE: tasks_v2_component_tasksPopupButtonQuote.TYPES_DEFAULT_QUOTE_ACTIONS.MESSAGE
	};

	// @vue/component
	const ResultListItem = {
		name: 'TaskResultListItem',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			BMenu: ui_vue3_components_menu.BMenu,
			HeadlineSm: ui_system_typography_vue.HeadlineSm,
			TasksPopupButtonQuote: tasks_v2_component_tasksPopupButtonQuote.TasksPopupButtonQuote,
			UserAvatar: tasks_v2_component_elements_userAvatar.UserAvatar,
			UserFieldWidgetComponent: tasks_v2_component_elements_userFieldWidgetComponent.DiskUserFieldWidgetComponent,
			EntityCollapsibleText: tasks_v2_component_entityText.EntityCollapsibleText,
			DownloadArchiveButton: tasks_v2_component_fields_files.DownloadArchiveButton,
			TextSm: ui_system_typography_vue.TextSm
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		inject: {
			task: {},
			embedded: {}
		},
		props: {
			resultId: {
				type: [Number, String],
				required: true
			},
			showDelimiter: {
				type: Boolean,
				default: false
			},
			isResized: {
				type: Boolean,
				default: false
			}
		},
		emits: ['titleClick', 'edit', 'resize'],
		setup(props) {
			const fileServiceInstance = tasks_v2_provider_service_fileService.fileService.get(props.resultId, tasks_v2_provider_service_fileService.EntityTypes.Result);
			const fileServiceRef = ui_vue3.shallowRef(fileServiceInstance);
			const uploaderAdapterRef = ui_vue3.shallowRef(fileServiceInstance.getAdapter());
			return {
				Outline: ui_iconSet_api_vue.Outline,
				EntityTypes: tasks_v2_provider_service_fileService.EntityTypes,
				resultsMeta,
				UserAvatarSize: tasks_v2_component_elements_userAvatar.UserAvatarSize,
				fileService: fileServiceRef,
				uploaderAdapter: uploaderAdapterRef
			};
		},
		data() {
			return {
				isSticky: false,
				elementAnchorQuote: null,
				elementScrollContainerQuote: null,
				scrollContainer: null,
				mutationObserver: null,
				isMenuShown: false,
				files: this.fileService.getFiles()
			};
		},
		computed: {
			actionsQuote() {
				const actionQuoteMessage = {
					type: TYPES_QUOTE_ACTIONS.MESSAGE,
					chatId: this.task.chatId
				};
				return [actionQuoteMessage];
			},
			result() {
				return this.$store.getters[`${tasks_v2_const.Model.Results}/getById`](this.resultId);
			},
			isEdit() {
				return main_core.Type.isNumber(this.resultId) && this.resultId > 0;
			},
			resultTitle() {
				return this.loc('TASKS_V2_RESULT_TITLE_WITH_DATE', {
					'#DATE#': this.resultDate
				});
			},
			resultDate() {
				if (!this.result.createdAtTs) {
					return '';
				}
				return tasks_v2_lib_calendar.calendar.formatDateTime(this.result.createdAtTs);
			},
			resultText() {
				return this.result.text ?? '';
			},
			resultAuthor() {
				return this.result.author;
			},
			filesCount() {
				return this.files.length;
			},
			archiveLink() {
				return this.result.archiveLink;
			},
			canDownloadArchive() {
				return tasks_v2_component_fields_files.canDownloadArchive(this.filesCount, this.archiveLink);
			},
			widgetOptions() {
				return {
					isEmbedded: true,
					withControlPanel: false,
					canCreateDocuments: false,
					viewMode: 'list',
					tileWidgetOptions: {
						compact: true,
						hideDropArea: true,
						readonly: true,
						enableDropzone: false,
						autoCollapse: false
					}
				};
			},
			menuOptions() {
				return {
					id: `result-action-menu-${main_core.Text.getRandom()}`,
					bindOptions: {
						forceBindPosition: true
					},
					bindElement: this.$refs.moreIcon,
					targetContainer: document.body,
					offsetLeft: -100,
					minWidth: 250,
					items: this.menuItems,
					autoHide: true,
					closeByEsc: true
				};
			},
			menuItems() {
				return [this.result.rights.edit && this.isEdit && {
					title: this.loc('TASKS_V2_RESULT_EDIT'),
					icon: ui_iconSet_api_vue.Outline.EDIT_L,
					onClick: this.handleEditClick.bind(this),
					dataset: {
						id: `MenuResultEdit-${this.resultId}`
					}
				}, this.result.rights.remove && {
					design: 'alert',
					title: this.loc('TASKS_V2_RESULT_REMOVE'),
					icon: ui_iconSet_api_vue.Outline.TRASHCAN,
					onClick: this.handleDeleteClick.bind(this),
					dataset: {
						id: `MenuResultRemove-${this.resultId}`
					}
				}].filter(Boolean);
			},
			hasMenuItems() {
				return this.menuItems.length > 0;
			},
			resizeIcon() {
				return this.isResized ? ui_iconSet_api_vue.Outline.COLLAPSE_L : ui_iconSet_api_vue.Outline.EXPAND_L;
			}
		},
		watch: {
			resultId(newResultId) {
				this.fileService = tasks_v2_provider_service_fileService.fileService.get(newResultId, tasks_v2_provider_service_fileService.EntityTypes.Result);
				this.uploaderAdapter = this.fileService.getAdapter();
				this.files = this.fileService.getFiles();
			}
		},
		mounted() {
			this.elementAnchorQuote = this.$refs.collapsible.$el.parentNode?.querySelector('.tasks-card-entity-collapsible-text');
			this.scrollContainer = this.$el?.closest('.tasks-field-results-result-list-content');
			if (this.scrollContainer) {
				main_core.Event.bind(this.scrollContainer, 'scroll', this.handleScroll);
				void this.$nextTick(this.checkSticky);
				this.mutationObserver = new MutationObserver(() => this.checkSticky());
				this.mutationObserver.observe(this.scrollContainer, {
					childList: true,
					subtree: true
				});
				this.elementScrollContainerQuote = this.scrollContainer;
			}
		},
		beforeUnmount() {
			if (this.scrollContainer) {
				main_core.Event.unbind(this.scrollContainer, 'scroll', this.handleScroll);
			}
			if (this.mutationObserver) {
				this.mutationObserver.disconnect();
			}
		},
		methods: {
			handleMenuClose() {
				this.isMenuShown = false;
				this.$refs.moreIcon?.focus();
			},
			handleEditClick() {
				this.$emit('edit', this.resultId);
			},
			handleDeleteClick() {
				void tasks_v2_provider_service_resultService.resultService.delete(this.resultId);
			},
			handleResizeClick() {
				this.$emit('resize');
			},
			handleScroll() {
				this.checkSticky();
			},
			checkSticky() {
				if (!this.scrollContainer || !this.$refs.title) {
					return;
				}
				const itemRect = this.$refs.title.getBoundingClientRect();
				const containerRect = this.scrollContainer.getBoundingClientRect();
				this.isSticky = itemRect.top <= containerRect.top + itemRect.height / 2;
			},
			handleAuthorClick() {
				BX.SidePanel.Instance.emulateAnchorClick(tasks_v2_provider_service_userService.userService.getUrl(this.resultAuthor.id));
			}
		},
		template: `
		<div class="tasks-field-results-result --list-mode" data-testid="tasks-result-list-item">
			<div
				class="tasks-field-results-title --list-mode"
				:class="{ '--sticky': isSticky }"
				data-testid="task-result-list-title"
				ref="title"
			>
				<button
					type="button"
					class="tasks-field-results-title-main"
					data-testid="tasks-result-list-item-title-btn"
					@click="$emit('titleClick', resultId)"
				>
					<BIcon :name="Outline.WINDOW_FLAG" aria-hidden="true"/>
					<HeadlineSm>{{ resultTitle }}</HeadlineSm>
				</button>
				<div class="tasks-field-results-title-actions print-ignore">
					<button
						v-if="hasMenuItems"
						type="button"
						class="tasks-field-results-icon-button"
						aria-haspopup="menu"
						data-testid="tasks-result-list-item-menu-btn"
						:aria-expanded="isMenuShown ? 'true' : 'false'"
						:aria-label="loc('TASKS_V2_RESULT_ITEM_MENU_LABEL')"
						ref="moreIcon"
						@click.stop="isMenuShown = true"
					>
						<BIcon
							class="tasks-field-results-title-icon --big"
							:name="Outline.MORE_L"
							hoverable
							aria-hidden="true"
						/>
					</button>
					<button
						v-if="isSticky && !embedded"
						type="button"
						class="tasks-field-results-icon-button"
						:aria-expanded="isResized ? 'true' : 'false'"
						:aria-label="isResized
							? loc('TASKS_V2_RESULT_COLLAPSE_LABEL')
							: loc('TASKS_V2_RESULT_EXPAND_LABEL')"
						data-testid="tasks-result-list-item-resize-btn"
						@click.stop="handleResizeClick"
					>
						<BIcon
							class="tasks-field-results-title-icon --big"
							:name="resizeIcon"
							hoverable
							aria-hidden="true"
						/>
					</button>
					<div v-if="isSticky" class="tasks-field-results-result-empty"/>
					<BMenu
						v-if="isMenuShown"
						:options="menuOptions"
						@close="handleMenuClose"
					/>
				</div>
			</div>
			<div
				class="tasks-field-results-result-content"
				ref="content"
			>
				<button
					type="button"
					class="tasks-field-results-result-author"
					:aria-label="loc('TASKS_V2_RESULT_AUTHOR_PROFILE_LABEL', { '#NAME#': resultAuthor.name })"
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
				</button>
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
					data-testid="task-result-list-files"
				>
					<UserFieldWidgetComponent :uploaderAdapter :widgetOptions/>
					<DownloadArchiveButton
						v-if="canDownloadArchive"
						:files
						:archiveLink
						:entityId="resultId"
						:entityType="EntityTypes.Result"
					/>
				</div>
			</div>
			<div v-if="showDelimiter" class="tasks-field-results-result-separator"/>
			<div v-else class="tasks-field-results-result-last-padding"/>
			<TasksPopupButtonQuote
				v-if="elementAnchorQuote"
				:isQuoteTrimmed="true"
				:elementAnchor="elementAnchorQuote"
				:elementScrollContainer="elementScrollContainerQuote"
				:actions="actionsQuote"
			/>
		</div>
	`
	};

	// @vue/component
	const ResultSkeleton = {
		components: {
			BLine: ui_system_skeleton_vue.BLine
		},
		template: `
		<div class="tasks-field-results-result-skeleton-container">
			<BLine :width="460" :height="12" :radius="60"/>
			<BLine :width="460" :height="12" :radius="60"/>
			<BLine :width="460" :height="12" :radius="60"/>
			<BLine :width="197" :height="12" :radius="60"/>
		</div>
	`
	};

	// Each normalization pass peels one nesting level of empty blocks, so an unbounded walk costs
	// O(length x depth) on crafted deep nesting. Mirrored in ResultService::assertNotEmpty().
	const MAX_EMPTY_BLOCK_PASSES = 16;

	// @vue/component
	const ResultEditor = {
		name: 'TaskResultEditor',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			UiButton: ui_vue3_components_button.Button,
			EntityTextArea: tasks_v2_component_entityText.EntityTextArea,
			CopilotButton: tasks_v2_component_entityText.CopilotButton,
			AttachButton: tasks_v2_component_entityText.AttachButton,
			MentionButton: tasks_v2_component_entityText.MentionButton,
			MoreButton: tasks_v2_component_entityText.MoreButton,
			NumberListButton: tasks_v2_component_entityText.NumberListButton,
			BulletListButton: tasks_v2_component_entityText.BulletListButton
		},
		inject: {
			taskId: {},
			task: {},
			analytics: {},
			cardType: {}
		},
		provide() {
			return {
				editor: () => this.editor,
				fileService: () => this.fileService
			};
		},
		props: {
			resultId: {
				type: [Number, String],
				required: true
			},
			content: {
				type: String,
				default: ''
			},
			isResized: {
				type: Boolean,
				default: false
			},
			showResize: {
				type: Boolean,
				default: true
			},
			titleId: {
				type: String,
				default: ''
			}
		},
		emits: ['close', 'resize'],
		setup(props) {
			return {
				ButtonSize: ui_vue3_components_button.ButtonSize,
				ButtonColor: ui_vue3_components_button.ButtonColor,
				Outline: ui_iconSet_api_vue.Outline,
				EntityTypes: tasks_v2_provider_service_fileService.EntityTypes,
				EntityTextTypes: tasks_v2_component_entityText.EntityTextTypes,
				fileService: tasks_v2_provider_service_fileService.fileService.get(props.resultId, tasks_v2_provider_service_fileService.EntityTypes.Result),
				entityTextEditor: tasks_v2_component_entityText.entityTextEditor.get(props.resultId, tasks_v2_component_entityText.EntityTextTypes.Result, {
					content: props.content,
					blockSpaceInline: 'var(--ui-space-stack-xl)'
				})
			};
		},
		data() {
			return {
				isSaving: false,
				hasChanges: false,
				hasFilesChanges: false,
				buttonDisabled: !(main_core.Type.isStringFilled(this.getPreparedText(this.content)) || this.hasAttachedFiles())
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				currentUserId: `${tasks_v2_const.Model.Interface}/currentUserId`
			}),
			result() {
				return this.$store.getters[`${tasks_v2_const.Model.Results}/getById`](this.resultId);
			},
			currentUser() {
				return this.$store.getters[`${tasks_v2_const.Model.Users}/getById`](this.currentUserId);
			},
			isEdit() {
				return main_core.Type.isNumber(this.resultId) && this.resultId > 0;
			},
			resultDate() {
				if (!this.result.createdAtTs) {
					return '';
				}
				return tasks_v2_lib_calendar.calendar.formatDateTime(this.result.createdAtTs);
			},
			title() {
				if (this.isEdit) {
					return this.loc('TASKS_V2_RESULT_TITLE_WITH_DATE', {
						'#DATE#': this.resultDate
					});
				}
				return this.loc('TASKS_V2_RESULT_ADD');
			},
			buttonTitle() {
				return this.isEdit ? this.loc('TASKS_V2_RESULT_BUTTON_SAVE') : this.loc('TASKS_V2_RESULT_BUTTON_SEND');
			},
			readonly() {
				if (!this.result) {
					return !this.task?.rights?.read;
				}
				return !this.result?.rights?.edit;
			},
			editor() {
				return this.entityTextEditor.getEditor();
			},
			hasEditorChanges() {
				return this.hasChanges || this.hasFilesChanges;
			},
			resizeIcon() {
				return this.isResized ? ui_iconSet_api_vue.Outline.COLLAPSE_L : ui_iconSet_api_vue.Outline.EXPAND_L;
			},
			isDiskModuleInstalled() {
				return tasks_v2_core.Core.getParams().features.disk;
			},
			isCopilotEnabled() {
				return tasks_v2_core.Core.getParams().features.isCopilotEnabled;
			}
		},
		mounted() {
			if (!this.task.filledFields[resultsMeta.id]) {
				void this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/setFieldFilled`, {
					id: this.taskId,
					fieldName: resultsMeta.id
				});
			}
			if (!main_core.Type.isStringFilled(this.content) || this.resultId === 0) {
				setTimeout(this.focusToEnd, 400);
			}

			// EntityTextArea relays only onFileAdd/onFileRemove as filesChange; the upload
			// completion (UPLOADING -> COMPLETE) arrives as a separate file-service event.
			// Re-gate the save button directly without marking the editor dirty: onFileComplete
			// also fires for background server attachments (loadFilesFromData/list), and routing it
			// through handleFilesChange would set hasFilesChanges and send a spurious update on close.
			this.fileService.subscribe('onFileComplete', this.recalcButtonState);
		},
		unmounted() {
			this.fileService.unsubscribe('onFileComplete', this.recalcButtonState);
			if (!this.isEdit && !this.isSaving) {
				void this.$store.dispatch(`${tasks_v2_const.Model.Results}/delete`, this.resultId);
				tasks_v2_provider_service_fileService.fileService.delete(this.resultId, tasks_v2_provider_service_fileService.EntityTypes.Result);
				tasks_v2_component_entityText.entityTextEditor.delete(this.resultId, tasks_v2_component_entityText.EntityTextTypes.Result);
			}
		},
		methods: {
			handleEditButtonClick() {
				if (this.isEdit) {
					this.handleClose();
				} else {
					this.handleAddResult();
				}
			},
			handleAddResult() {
				this.isSaving = true;
				const result = {
					...this.result,
					text: this.editor.getText(),
					author: this.currentUser,
					status: tasks_v2_const.ResultStatus.Open,
					createdAtTs: Date.now(),
					updatedAtTs: Date.now()
				};
				void this.addResult(result);
				this.handleClose();
				main_core.Event.EventEmitter.emit(tasks_v2_const.EventName.ResultAdded, {
					taskId: this.taskId
				});
			},
			async addResult(result) {
				const isSuccess = await tasks_v2_provider_service_resultService.resultService.add(this.taskId, result);
				this.sendAnalyticsResultAdd(isSuccess);
				if (isSuccess) {
					main_core.Event.EventEmitter.emit(tasks_v2_const.EventName.ResultSuccessfulAdded, {
						taskId: this.taskId
					});
				}
			},
			sendAnalyticsResultAdd(isSuccess) {
				tasks_v2_lib_analytics.analytics.sendStatusSummaryAdd(this.analytics, {
					isSuccess,
					cardType: this.cardType,
					taskId: main_core.Type.isNumber(this.taskId) ? this.taskId : 0,
					element: tasks_v2_const.Analytics.Element.AddResult,
					subSection: tasks_v2_const.Analytics.SubSection.TaskCard
				});
			},
			handleUpdateResult() {
				if (!this.hasEditorChanges) {
					return;
				}
				const fields = {
					text: this.editor.getText(),
					updatedAtTs: Date.now() / 1000,
					status: tasks_v2_const.ResultStatus.Open
				};
				void tasks_v2_provider_service_resultService.resultService.update(this.resultId, fields);
				this.hasChanges = false;
				this.hasFilesChanges = false;
				main_core.Event.EventEmitter.emit(tasks_v2_const.EventName.ResultUpdated, {
					taskId: this.taskId,
					resultId: this.resultId
				});
			},
			handleEditorChange() {
				const preparedOldText = this.getPreparedText(this.content);
				const preparedNewText = this.getPreparedText(this.editor?.getText());
				this.hasChanges = preparedOldText !== preparedNewText;
				this.recalcButtonState(preparedNewText);
			},
			handleFilesChange() {
				this.hasFilesChanges = true;
				this.recalcButtonState();
			},
			recalcButtonState(preparedText) {
				const hasFiles = this.hasAttachedFiles();
				// May be invoked as an onFileComplete handler, which passes a BaseEvent here;
				// fall back to the editor text unless an actual prepared string was provided. With a
				// completed file the text cannot change the outcome, so skip normalizing it: that event
				// fires per file (background server attachments included) and each normalization walks
				// the whole text up to MAX_EMPTY_BLOCK_PASSES times.
				const text = main_core.Type.isString(preparedText) ? preparedText : hasFiles ? '' : this.getPreparedText(this.editor?.getText());
				const isTextFilled = main_core.Type.isStringFilled(text);
				const wasDisabled = this.buttonDisabled;
				this.buttonDisabled = !(isTextFilled || hasFiles);

				// Announce the disabled -> enabled transition to screen readers (WCAG 4.1.3).
				if (wasDisabled && !this.buttonDisabled) {
					void this.announceButtonEnabled();
				}
			},
			async announceButtonEnabled() {
				// ui.a11y is loaded lazily so this rare disabled -> enabled transition does not pull
				// the extension into the result field's eager bundle. Best-effort: a failed load must
				// not break the editor flow.
				try {
					const {
						LiveAnnouncer
					} = await main_core.Runtime.loadExtension('ui.a11y');
					LiveAnnouncer.announce(this.loc('TASKS_V2_RESULT_BUTTON_ENABLED_ANNOUNCE', {
						'#BUTTON#': this.buttonTitle
					}));
				} catch {
					// Announcement is best-effort.
				}
			},
			hasAttachedFiles() {
				// count only files that finished uploading, not files in flight or failed (CT-RESULT-FILE-PRESENCE)
				return this.fileService.getFileItems().some(({
					status
				}) => status === ui_uploader_core.FileStatus.COMPLETE);
			},
			getPreparedText(text) {
				let preparedText = text.replaceAll(/\[p]\n|\[p]\s*\[\/p]|\[\/p]/gi, '');
				let previousText;
				let passes = 0;
				do {
					previousText = preparedText;
					preparedText = preparedText.replaceAll(/\[(quote|code|spoiler)]\s*\[\/\1]/gi, '').replaceAll(/\[list(?:=[^\]]+)?](?:\s*\[\*])*\s*\[\/list]/gi, '');
					++passes;
				} while (preparedText !== previousText && passes < MAX_EMPTY_BLOCK_PASSES);
				return preparedText.trim();
			},
			focusToEnd() {
				this.editor?.focus(null, {
					defaultSelection: 'rootEnd'
				});
			},
			handleClose() {
				if (this.isEdit) {
					// Keep the editor open only after an edit leaves it invalid (no text and no completed file).
					if (this.hasEditorChanges && this.buttonDisabled) {
						ui_notificationManager.Notifier.notifyViaBrowserProvider({
							id: 'task-notify-result-empty-close-error',
							text: this.loc('TASKS_V2_RESULT_EMPTY_CLOSE_ERROR')
						});
						return;
					}
					this.handleUpdateResult();
				}
				this.$emit('close');
			}
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
	`
	};

	// @vue/component
	const ResultEditorSheet = {
		components: {
			BottomSheet: tasks_v2_component_elements_bottomSheet.BottomSheet,
			DropZone: tasks_v2_component_dropZone.DropZone,
			ResultEditor
		},
		inject: {
			taskId: {},
			embedded: {}
		},
		props: {
			resultId: {
				type: [Number, String],
				required: true
			},
			showResize: {
				type: Boolean,
				default: true
			},
			sheetBindProps: {
				type: Object,
				required: true
			}
		},
		emits: ['close'],
		setup() {
			return {
				EntityTypes: tasks_v2_provider_service_fileService.EntityTypes
			};
		},
		data() {
			return {
				isResized: false,
				uniqueKey: main_core.Text.getRandom(),
				editorTitleId: `tasks-result-editor-title-${main_core.Text.getRandom()}`
			};
		},
		computed: {
			result() {
				return this.$store.getters[`${tasks_v2_const.Model.Results}/getById`](this.resultId);
			},
			bottomSheetContainer() {
				return document.getElementById(`b24-bottom-sheet-${this.uniqueKey}`) || null;
			},
			isDiskModuleInstalled() {
				return tasks_v2_core.Core.getParams().features.disk;
			},
			shouldShowResize() {
				return this.showResize && !this.embedded;
			}
		},
		mounted() {
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.OpenResultFromChat, this.handleOpenResultFromMessage);
			void this.$nextTick(this.syncSheetModality);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.OpenResultFromChat, this.handleOpenResultFromMessage);
		},
		methods: {
			handleOpenResultFromMessage(event) {
				const {
					taskId
				} = event.getData();
				if (this.taskId === taskId) {
					this.$emit('close');
				}
			},
			syncSheetModality() {
				tasks_v2_lib_bottomSheetAria.syncBottomSheetModality(this.$refs.bottomSheet);
			}
		},
		template: `
		<BottomSheet
			ref="bottomSheet"
			:sheetBindProps
			:isExpanded="isResized"
			:padding="0"
			:popupPadding="0"
			:uniqueKey
			:ariaLabelledBy="editorTitleId"
			@close="$emit('close')"
		>
			<ResultEditor
				:resultId
				:isResized
				:content="result.text || ''"
				:showResize="shouldShowResize"
				:titleId="editorTitleId"
				@close="$emit('close')"
				@resize="isResized = !isResized"
			/>
			<DropZone
				v-if="isDiskModuleInstalled"
				:container="bottomSheetContainer || {}"
				:entityId="resultId || 0"
				:entityType="EntityTypes.Result"
			/>
		</BottomSheet>
	`
	};

	// @vue/component
	const ResultListEmpty = {
		name: 'ResultListEmpty',
		components: {
			TextLg: ui_system_typography_vue.TextLg,
			UiButton: ui_vue3_components_button.Button
		},
		emits: ['addResult'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		template: `
		<div class="tasks-field-results-result-list-empty">
			<div class="tasks-field-results-result-list-empty-image"/>
			<TextLg className="tasks-field-results-result-list-empty-title">
				{{ loc('TASKS_V2_RESULT_LIST_EMPTY') }}
			</TextLg>
			<div class="tasks-field-results-result-list-empty-button">
				<UiButton
					:text="loc('TASKS_V2_RESULT_ADD')"
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.FILLED"
					:leftIcon="Outline.PLUS_L"
					:wide="false"
					@click="$emit('addResult')"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const ResultListSheet = {
		components: {
			BottomSheet: tasks_v2_component_elements_bottomSheet.BottomSheet,
			BIcon: ui_iconSet_api_vue.BIcon,
			UiButton: ui_vue3_components_button.Button,
			ResultListItem,
			ResultSkeleton,
			ResultEditorSheet,
			ResultListEmpty,
			HeadlineMd: ui_system_typography_vue.HeadlineMd
		},
		inject: {
			task: {},
			taskId: {}
		},
		props: {
			resultId: {
				type: [Number, String],
				required: true
			},
			sheetBindProps: {
				type: Object,
				required: true
			}
		},
		emits: ['close'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		data() {
			return {
				editResultId: 0,
				isResultEditorShown: false,
				isResized: false,
				editorFocusTrigger: null
			};
		},
		computed: {
			results() {
				return this.task.results;
			},
			loadedResults() {
				return this.results.filter(resultId => this.isResultLoaded(resultId));
			},
			hasUnloadedResults() {
				return this.results.length !== this.loadedResults.length;
			},
			isEmptyState() {
				return this.results.length === 0;
			}
		},
		watch: {
			async resultId(newResultId) {
				await this.$nextTick();
				if (newResultId) {
					this.focusTo(newResultId);
				}
			}
		},
		mounted() {
			if (this.hasUnloadedResults) {
				void tasks_v2_provider_service_resultService.resultService.getAll(this.taskId);
			}
			void this.$nextTick(this.syncSheetModality);
			this.focusTo(this.resultId);
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.ResultAdded, this.handleResultAdded);
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.ResultUpdated, this.handleResultUpdated);
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.OpenResultFromChat, this.handleOpenResultFromMessage);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.ResultAdded, this.handleResultAdded);
			main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.ResultUpdated, this.handleResultUpdated);
			main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.OpenResultFromChat, this.handleOpenResultFromMessage);
		},
		methods: {
			isResultLoaded(resultId) {
				return Boolean(this.$store.getters[`${tasks_v2_const.Model.Results}/getById`](resultId));
			},
			focusTo(resultId) {
				if (!resultId) {
					return;
				}
				const scrollContainer = this.$refs.scrollContainer;
				if (!scrollContainer) {
					return;
				}
				const {
					targetId,
					offset,
					shouldHighlight
				} = this.calculateFocusTarget(resultId);
				this.scrollToTarget(targetId, offset, shouldHighlight);
			},
			calculateFocusTarget(resultId) {
				return {
					targetId: resultId,
					offset: 80,
					shouldHighlight: true
				};
			},
			scrollToTarget(targetId, offset, shouldHighlight) {
				setTimeout(() => {
					const targetNode = this.getResultNode(targetId);
					if (!targetNode) {
						return;
					}
					if (shouldHighlight) {
						this.highlightResult(targetId);
					}
					targetNode.focus({
						preventScroll: true
					});
					this.$refs.scrollContainer.scrollTop = targetNode.offsetTop - offset;
				}, 0);
			},
			syncSheetModality() {
				tasks_v2_lib_bottomSheetAria.syncBottomSheetModality(this.$refs.bottomSheet);
			},
			getResultNode(resultId) {
				return this.$refs.scrollContainer?.querySelector(`[data-result-id="${CSS.escape(String(resultId))}"]`);
			},
			highlightResult(targetId) {
				const highlightElement = this.getResultNode(targetId);
				if (highlightElement) {
					void tasks_v2_lib_highlighter.highlighter.highlight(highlightElement);
				}
			},
			openAddResultSheet() {
				this.editorFocusTrigger = captureFocusTrigger();
				this.editResultId = main_core.Text.getRandom();
				const payload = {
					id: this.editResultId,
					taskId: this.taskId,
					author: tasks_v2_core.Core.getParams().currentUser
				};
				void this.$store.dispatch(`${tasks_v2_const.Model.Results}/insert`, payload);
				this.isResultEditorShown = true;
			},
			openEditResult(resultId) {
				this.editorFocusTrigger = captureFocusTrigger();
				this.editResultId = resultId;
				this.isResultEditorShown = true;
			},
			closeResultEditor() {
				this.isResultEditorShown = false;
				this.editResultId = 0;
				restoreFocusTrigger(this.editorFocusTrigger);
				this.editorFocusTrigger = null;
			},
			handleResultAdded(event) {
				const {
					taskId
				} = event.getData();
				if (taskId !== this.taskId) {
					return;
				}
				this.$emit('close');
			},
			handleResultUpdated(event) {
				const {
					taskId,
					resultId
				} = event.getData();
				if (taskId !== this.taskId) {
					return;
				}
				this.focusTo(resultId);
			},
			handleOpenResultFromMessage(event) {
				const {
					taskId,
					resultId
				} = event.getData();
				if (this.taskId !== taskId) {
					return;
				}
				this.focusTo(resultId);
			}
		},
		template: `
		<BottomSheet
			ref="bottomSheet"
			:sheetBindProps
			:isExpanded="isResized"
			:padding="0"
			:popupPadding="0"
			:ariaLabel="loc('TASKS_V2_RESULT_LIST_SHEET_LABEL')"
			@close="$emit('close')"
		>
			<div class="tasks-field-results-result-list" ref="main" data-testid="tasks-result-list">
				<button
					type="button"
					class="tasks-field-results-result-list-close-icon"
					data-testid="tasks-result-list-close-btn"
					:aria-label="loc('TASKS_V2_RESULT_CLOSE_LABEL')"
					@click="$emit('close')"
				>
					<BIcon :name="Outline.CROSS_L" hoverable aria-hidden="true"/>
				</button>
				<div  v-if="isEmptyState" class="tasks-field-results-result-list-header">
					<HeadlineMd className="tasks-field-results-result-list-title">
						{{ loc('TASKS_V2_RESULT_LIST_EMPTY_TITLE') }}
					</HeadlineMd>
				</div>
				<div
					class="tasks-field-results-result-list-content"
					ref="scrollContainer"
					:role="isEmptyState ? null : 'list'"
				>
					<ResultListEmpty v-if="isEmptyState" @addResult="openAddResultSheet"/>
					<div
						v-else
						v-for="(result, resultIndex) in results"
						:key="result"
						:data-result-id="result"
						class="tasks-field-results-result-item"
						role="listitem"
						tabindex="-1"
					>
						<ResultListItem
							v-if="isResultLoaded(result)"
							:resultId="result"
							listMode
							:showDelimiter="resultIndex !== results.length - 1"
							:isResized
							@edit="openEditResult"
							@resize="isResized = !isResized"
						/>
						<ResultSkeleton v-else/>
					</div>
				</div>
			</div>
			<div
				v-if="!isEmptyState"
				class="tasks-field-results-result-add-button"
			>
				<UiButton
					:text="loc('TASKS_V2_RESULT_ADD')"
					:style="AirButtonStyle.SELECTION"
					:dataset="{ testid: 'tasks-result-list-add-btn' }"
					:size="ButtonSize.SMALL"
					@click="openAddResultSheet"
				/>
			</div>
			<ResultEditorSheet
				v-if="isResultEditorShown"
				:resultId="editResultId"
				:sheetBindProps
				:showResize="false"
				@close="closeResultEditor"
			/>
		</BottomSheet>
	`
	};

	// @vue/component
	const Results = {
		name: 'TaskResults',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			BMenu: ui_vue3_components_menu.BMenu,
			Hint: tasks_v2_component_elements_hint.Hint,
			TextMd: ui_system_typography_vue.TextMd,
			TextXs: ui_system_typography_vue.TextXs,
			ResultCardItem,
			ResultRequiredAha,
			ResultEditorSheet,
			ResultListSheet
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		inject: {
			task: {},
			taskId: {},
			isEdit: {},
			isTemplate: {}
		},
		props: {
			isSheetShown: {
				type: Boolean,
				default: false
			},
			isListSheetShown: {
				type: Boolean,
				default: false
			},
			isAnySheetShown: {
				type: Boolean,
				default: false
			},
			sheetBindProps: {
				type: Object,
				required: true
			}
		},
		setup() {
			return {
				resultsMeta,
				Outline: ui_iconSet_api_vue.Outline,
				Animated: ui_iconSet_api_vue.Animated
			};
		},
		data() {
			return {
				isMenuShown: false,
				isLoading: null,
				showCreatorResultHint: false,
				showResponsibleResultHint: false,
				sheetResultId: 0,
				sheetFocusTrigger: null
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				stateFlags: `${tasks_v2_const.Model.Interface}/stateFlags`,
				templateStateFlags: `${tasks_v2_const.Model.Interface}/templateStateFlags`
			}),
			requireResult() {
				return this.task?.requireResult || false;
			},
			isCreator() {
				return tasks_v2_core.Core.getParams().currentUser.id === this?.task.creatorId;
			},
			isResponsible() {
				const userId = tasks_v2_core.Core.getParams().currentUser.id;
				return this.task?.responsibleIds?.includes(userId) || this.task?.accomplicesIds.includes(userId);
			},
			containsResults() {
				return this.task.containsResults;
			},
			results() {
				return this.task.results || [];
			},
			hasResults() {
				return this.results.length > 0;
			},
			showMore() {
				return this.results.length > 1;
			},
			lastResultId() {
				return this.hasResults ? this.results[0] : null;
			},
			moreText() {
				const count = this.results.length - 1;
				return main_core.Loc.getMessagePlural('TASKS_V2_RESULT_SHOW_MORE', count, {
					'#COUNT#': count
				});
			},
			emptyResultTitle() {
				return this.requireResult ? main_core.Loc.getMessage('TASKS_V2_RESULT_TITLE_REQUIRED') : resultsMeta.title;
			},
			showMoreIcon() {
				return this.task.rights.edit;
			},
			menuOptions() {
				return {
					id: `result-field-menu-${main_core.Text.getRandom()}`,
					bindOptions: {
						forceBindPosition: true
					},
					bindElement: this.$refs.moreIcon,
					targetContainer: document.body,
					minWidth: 240,
					offsetLeft: -100,
					items: this.menuItems,
					autoHide: true,
					closeByEsc: true
				};
			},
			menuItems() {
				const items = [];
				if (!this.isTemplate) {
					items.push({
						title: this.loc('TASKS_V2_RESULT_ADD'),
						icon: ui_iconSet_api_vue.Outline.PLUS_L,
						onClick: this.openAddResultSheet,
						dataset: {
							id: `MenuResultAdd-${this.taskId}`
						}
					});
				}
				if (this.requireResult) {
					items.push({
						title: this.loc('TASKS_V2_RESULT_NOT_REQUIRED'),
						design: 'alert',
						icon: ui_iconSet_api_vue.Outline.CROSS_L,
						onClick: this.handleUnrequireResult,
						dataset: {
							id: `MenuResultNotRequire-${this.taskId}`
						}
					});
				} else {
					items.push({
						title: this.loc('TASKS_V2_RESULT_REQUIRE'),
						icon: ui_iconSet_api_vue.Outline.WINDOW_FLAG,
						isLocked: this.isLocked,
						onClick: this.handleRequireResult,
						dataset: {
							id: `MenuResultRequire-${this.taskId}`
						}
					});
				}
				return items;
			},
			isLocked() {
				return !tasks_v2_core.Core.getParams().restrictions.requiredResult.available;
			},
			featureId() {
				return tasks_v2_core.Core.getParams().restrictions.requiredResult.featureId;
			}
		},
		watch: {
			requireResult: {
				async handler(newVal) {
					if (newVal) {
						await this.$nextTick();
						this.tryShowResultHints();
					}
				},
				deep: true
			}
		},
		async created() {
			this.responsibleHintRequestId = 0;
			this.responsibleHintRectWait = null;
			this.responsibleHintTimeoutId = null;
			this.ownsResponsibleAhaMoment = false;
			this.isUnmounted = false;
			if (!this.isEdit || !this.containsResults) {
				return;
			}
			if (main_core.Type.isArrayFilled(this.results)) {
				return;
			}
			this.isLoading = true;
			await tasks_v2_provider_service_resultService.resultService.tail(this.taskId);
			this.isLoading = false;
		},
		mounted() {
			this.tryShowResultHints();
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.ResultAdded, this.handleHighlightFieldAfterEdit);
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.ResultUpdated, this.handleHighlightFieldAfterEdit);
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.RequiredResultsMissing, this.showResponsibleHint);
			main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.OpenResultFromChat, this.handleOpenResultFromMessage);
		},
		beforeUnmount() {
			this.isUnmounted = true;
			this.responsibleHintRequestId++;
			clearTimeout(this.responsibleHintTimeoutId);
			this.cancelResponsibleHintRectWait();
			this.releaseResponsibleAhaMoment();
			main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.ResultAdded, this.handleHighlightFieldAfterEdit);
			main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.ResultUpdated, this.handleHighlightFieldAfterEdit);
			main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.RequiredResultsMissing, this.showResponsibleHint);
			main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.OpenResultFromChat, this.handleOpenResultFromMessage);
		},
		methods: {
			openMore() {
				this.openResultSheet(0);
			},
			handleTitleClick() {
				if (!this.isLoading && !this.isTemplate) {
					this.openAddResultSheet();
				}
			},
			openAddResultSheet() {
				const id = main_core.Text.getRandom();
				const payload = {
					id,
					taskId: this.taskId,
					author: tasks_v2_core.Core.getParams().currentUser
				};
				void this.$store.dispatch(`${tasks_v2_const.Model.Results}/insert`, payload);
				this.openEditSheet(id);
			},
			handleResponsibleHintButtonClick() {
				this.handleResponsibleHintClose();
				this.openAddResultSheet();
			},
			handleRequireResult() {
				if (this.isLocked) {
					void tasks_v2_lib_showLimit.showLimit({
						code: `limit_${this.featureId}`,
						bindElement: this.$refs.moreIcon,
						analytics: {
							type: 'limit_tasks_status_summary'
						}
					});
					return;
				}
				this.setRequireResult(true);
			},
			handleUnrequireResult() {
				this.setRequireResult(false);
			},
			async setRequireResult(requireResult) {
				void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
					requireResult
				});
				if (this.isEdit) {
					return;
				}
				if (this.isTemplate) {
					await this.$store.dispatch(`${tasks_v2_const.Model.Interface}/updateTemplateStateFlags`, {
						defaultRequireResult: requireResult
					});
					void tasks_v2_provider_service_stateService.stateService.setTemplateFlags(this.templateStateFlags);
				} else {
					await this.$store.dispatch(`${tasks_v2_const.Model.Interface}/updateStateFlags`, {
						defaultRequireResult: requireResult
					});
					void tasks_v2_provider_service_stateService.stateService.set(this.stateFlags);
				}
			},
			tryShowResultHints() {
				if (!this.requireResult || this.containsResults || this.isTemplate) {
					return;
				}
				if (!this.isEdit && tasks_v2_lib_ahaMoments.ahaMoments.shouldShow(tasks_v2_const.Option.AhaRequiredResultCreatorPopup)) {
					tasks_v2_lib_ahaMoments.ahaMoments.setActive(tasks_v2_const.Option.AhaRequiredResultCreatorPopup);
					this.showCreatorHint();
					return;
				}
				if (this.isEdit && this.isResponsible && !this.isCreator && tasks_v2_lib_ahaMoments.ahaMoments.shouldShow(tasks_v2_const.Option.AhaRequiredResultResponsiblePopup)) {
					tasks_v2_lib_ahaMoments.ahaMoments.setActive(tasks_v2_const.Option.AhaRequiredResultResponsiblePopup);
					this.ownsResponsibleAhaMoment = true;
					this.responsibleHintTimeoutId = setTimeout(async () => {
						this.responsibleHintTimeoutId = null;
						const event = new main_core_events.BaseEvent({
							data: {
								taskId: this.taskId
							}
						});
						await this.showResponsibleHint(event);
						if (!this.showResponsibleResultHint) {
							this.releaseResponsibleAhaMoment();
						}
					}, 2000);
				}
			},
			showCreatorHint() {
				this.showCreatorResultHint = true;
				this.highlightField();
			},
			async showResponsibleHint(event) {
				const {
					taskId
				} = event.getData();
				if (this.taskId !== taskId || this.isUnmounted || this.showResponsibleResultHint) {
					return;
				}
				const requestId = ++this.responsibleHintRequestId;
				this.cancelResponsibleHintRectWait();
				await this.$nextTick();
				if (!this.isResponsibleHintRequestAlive(requestId)) {
					return;
				}
				const resultsContainer = this.$refs.resultsContainer;
				if (!main_core.Type.isElementNode(resultsContainer) || !resultsContainer.isConnected) {
					return;
				}
				const rectWait = waitForStableRect(resultsContainer);
				this.responsibleHintRectWait = rectWait;
				const isRectStable = await rectWait.promise;
				if (this.responsibleHintRectWait === rectWait) {
					this.responsibleHintRectWait = null;
				}
				if (!isRectStable || !this.isResponsibleHintRequestAlive(requestId) || this.$refs.resultsContainer !== resultsContainer) {
					return;
				}
				this.showResponsibleResultHint = true;
				this.highlightField();
			},
			isResponsibleHintRequestAlive(requestId) {
				return !this.isUnmounted && this.responsibleHintRequestId === requestId;
			},
			cancelResponsibleHintRectWait() {
				const rectWait = this.responsibleHintRectWait;
				this.responsibleHintRectWait = null;
				rectWait?.cancel();
			},
			releaseResponsibleAhaMoment() {
				// Only the instance that took the global aha slot may give it back: a stuck slot
				// suppresses every other aha moment on the page.
				if (!this.ownsResponsibleAhaMoment) {
					return;
				}
				this.ownsResponsibleAhaMoment = false;
				tasks_v2_lib_ahaMoments.ahaMoments.setInactive(tasks_v2_const.Option.AhaRequiredResultResponsiblePopup);
			},
			handleHighlightFieldAfterEdit(event) {
				const {
					taskId
				} = event.getData();
				if (this.taskId !== taskId) {
					return;
				}
				this.highlightField();
			},
			handleCreatorHintClose() {
				if (!this.showCreatorResultHint) {
					return;
				}
				this.showCreatorResultHint = false;
				tasks_v2_lib_ahaMoments.ahaMoments.setInactive(tasks_v2_const.Option.AhaRequiredResultCreatorPopup);
				tasks_v2_lib_ahaMoments.ahaMoments.setShown(tasks_v2_const.Option.AhaRequiredResultCreatorPopup);
				this.focusFieldTrigger();
			},
			handleResponsibleHintClose() {
				if (!this.showResponsibleResultHint) {
					return;
				}
				this.showResponsibleResultHint = false;
				this.ownsResponsibleAhaMoment = false;
				tasks_v2_lib_ahaMoments.ahaMoments.setInactive(tasks_v2_const.Option.AhaRequiredResultResponsiblePopup);
				if (tasks_v2_lib_ahaMoments.ahaMoments.shouldShow(tasks_v2_const.Option.AhaRequiredResultResponsiblePopup)) {
					tasks_v2_lib_ahaMoments.ahaMoments.setShown(tasks_v2_const.Option.AhaRequiredResultResponsiblePopup);
				}
				this.focusFieldTrigger();
			},
			focusFieldTrigger() {
				const candidates = [...(this.$refs.resultsContainer?.querySelectorAll('button, a') ?? [])];
				candidates.find(node => ui_a11y.InteractivityChecker.isFocusable(node))?.focus();
			},
			handleFieldMenuClose() {
				this.isMenuShown = false;
				this.$refs.moreIcon?.focus();
			},
			handleOpenResultFromMessage(event) {
				const {
					taskId,
					resultId
				} = event.getData();
				if (this.taskId !== taskId || this.isListSheetShown) {
					return;
				}
				this.openResultSheet(resultId);
			},
			highlightField() {
				void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(resultsMeta.id);
			},
			getRequiredResultAhaWidth() {
				return main_core.Type.isNumber(this.$refs?.resultsContainer?.offsetWidth) ? Math.min(this.$refs.resultsContainer.offsetWidth, 530) : 530;
			},
			openEditSheet(resultId) {
				this.sheetFocusTrigger = captureFocusTrigger();
				this.sheetResultId = resultId;
				this.setSheetShown(true);
			},
			openResultSheet(resultId) {
				this.sheetFocusTrigger = captureFocusTrigger();
				this.sheetResultId = resultId;
				this.setListSheetShown(true);
			},
			handleEditSheetClose() {
				this.setSheetShown(false);
				restoreFocusTrigger(this.sheetFocusTrigger);
				this.sheetFocusTrigger = null;
			},
			handleListSheetClose() {
				this.setListSheetShown(false);
				restoreFocusTrigger(this.sheetFocusTrigger);
				this.sheetFocusTrigger = null;
			},
			setSheetShown(isShown) {
				this.$emit('update:isSheetShown', isShown);
			},
			setListSheetShown(isShown) {
				this.$emit('update:isListSheetShown', isShown);
			}
		},
		template: `
		<div
			class="tasks-field-results print-no-box-shadow"
			data-testid="tasks-results"
			:data-task-id="taskId"
			role="group"
			:aria-label="resultsMeta.title"
			ref="resultsContainer"
		>
			<template v-if="lastResultId">
				<ResultCardItem
					:resultId="lastResultId"
					:isAnySheetShown
					@titleClick="openResultSheet"
					@add="openAddResultSheet"
					@edit="openEditSheet"
					@highlightField="highlightField"
				/>
				<div class="tasks-field-results-more-container">
					<button
						v-if="showMore"
						type="button"
						class="tasks-field-results-more"
						data-testid="tasks-results-more-btn"
						@click="openMore"
					>
						<div class="tasks-field-results-more-text">{{ moreText }}</div>
						<BIcon
							class="tasks-field-results-title-icon --auto-left print-ignore"
							:name="Outline.CHEVRON_RIGHT_L"
							hoverable
							aria-hidden="true"
						/>
					</button>
					<button
						type="button"
						class="tasks-field-results-more print-ignore"
						data-testid="tasks-results-add-more-btn"
						:class="{ '--border': showMore }"
						@click="openAddResultSheet"
					>
						<div class="tasks-field-results-more-text">{{ loc('TASKS_V2_RESULT_ADD_MORE') }}</div>
						<BIcon
							class="tasks-field-results-title-icon --auto-left"
							:name="Outline.PLUS_L"
							hoverable
							aria-hidden="true"
						/>
					</button>
				</div>
			</template>
			<template v-else>
				<div
					class="tasks-field-results-empty-container"
					:data-task-field-id="resultsMeta.id"
					data-field-container
				>
					<div
						class="tasks-field-results-title"
						:class="{ '--non-clickable': isTemplate }"
					>
						<button
							type="button"
							class="tasks-field-results-title-main"
							data-testid="tasks-results-title-btn"
							:disabled="isTemplate"
							@click="handleTitleClick"
						>
							<template v-if="isLoading">
								<BIcon :name="Animated.LOADER_WAIT" aria-hidden="true"/>
								<TextMd accent>{{ loc('TASKS_V2_RESULT_TITLE_LOADING') }}</TextMd>
							</template>
							<template v-else>
								<BIcon :name="Outline.WINDOW_FLAG" aria-hidden="true"/>
								<TextMd accent>{{ emptyResultTitle }}</TextMd>
							</template>
						</button>
						<div class="tasks-field-results-title-actions print-ignore">
							<button
								v-if="showMoreIcon"
								type="button"
								class="tasks-field-results-icon-button"
								aria-haspopup="menu"
								data-testid="tasks-results-menu-btn"
								:aria-expanded="isMenuShown ? 'true' : 'false'"
								:aria-label="loc('TASKS_V2_RESULT_FIELD_MENU_LABEL')"
								ref="moreIcon"
								@click.stop="isMenuShown = true"
							>
								<BIcon
									class="tasks-field-results-title-icon"
									:name="Outline.MORE_L"
									hoverable
									aria-hidden="true"
								/>
							</button>
							<button
								v-else
								type="button"
								class="tasks-field-results-icon-button"
								:aria-label="loc('TASKS_V2_RESULT_ADD')"
								:data-task-results-add="resultsMeta.id"
								data-testid="tasks-results-add-btn"
								@click.stop="openAddResultSheet"
							>
								<BIcon
									class="tasks-field-results-title-icon"
									:name="Outline.PLUS_L"
									hoverable
									aria-hidden="true"
								/>
							</button>
						</div>
					</div>
					<BMenu
						v-if="isMenuShown"
						:options="menuOptions"
						@close="handleFieldMenuClose"
					/>
				</div>
				<Hint
					v-if="showCreatorResultHint"
					:bindElement="$refs.resultsContainer"
					:options="{ closeIcon: true, ariaLabel: loc('TASKS_V2_RESULT_AHA_REQUIRE_RESULT_CREATOR') }"
					@close="handleCreatorHintClose"
				>
					{{ loc('TASKS_V2_RESULT_AHA_REQUIRE_RESULT_CREATOR') }}
				</Hint>
			</template>
			<ResultRequiredAha
				v-if="showResponsibleResultHint"
				:bindElement="$refs.resultsContainer"
				:popupWidth="getRequiredResultAhaWidth()"
				:hasResults
				@close="handleResponsibleHintClose"
				@addResult="handleResponsibleHintButtonClick"
			/>
		</div>
		<ResultEditorSheet
			v-if="isSheetShown"
			:resultId="sheetResultId"
			:sheetBindProps
			@close="handleEditSheetClose"
		/>
		<ResultListSheet
			v-if="isListSheetShown"
			:resultId="sheetResultId"
			:sheetBindProps
			@close="handleListSheetClose"
		/>
	`
	};

	const ChipAction = Object.freeze({
		Highlight: 'highlight',
		RequireResult: 'requireResult',
		Menu: 'menu',
		AddResult: 'addResult'
	});

	// @vue/component
	const ResultsChip = {
		components: {
			Chip: ui_system_chip_vue.Chip,
			BMenu: ui_vue3_components_menu.BMenu,
			ResultEditorSheet
		},
		inject: {
			task: {},
			taskId: {},
			isEdit: {},
			isTemplate: {},
			embedded: {}
		},
		props: {
			isSheetShown: {
				type: Boolean,
				default: false
			},
			sheetBindProps: {
				type: Object,
				required: true
			}
		},
		emits: ['update:isSheetShown'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				resultsMeta
			};
		},
		data() {
			return {
				isMenuShown: false,
				sheetResultId: 0,
				sheetFocusTrigger: null
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				currentUserId: `${tasks_v2_const.Model.Interface}/currentUserId`,
				stateFlags: `${tasks_v2_const.Model.Interface}/stateFlags`,
				templateStateFlags: `${tasks_v2_const.Model.Interface}/templateStateFlags`
			}),
			design() {
				return this.isSelected ? ui_system_chip_vue.ChipDesign.ShadowAccent : ui_system_chip_vue.ChipDesign.ShadowNoAccent;
			},
			isSelected() {
				return this.task.filledFields[resultsMeta.id] || this.task.requireResult;
			},
			menuOptions() {
				return {
					id: `result-chip-menu-${main_core.Text.getRandom()}`,
					bindOptions: {
						forceBindPosition: true,
						forceTop: true,
						position: 'top'
					},
					bindElement: this.$refs.chip.$el,
					targetContainer: document.body,
					minWidth: 240,
					items: this.menuItems,
					autoHide: true,
					closeByEsc: true
				};
			},
			menuItems() {
				return [{
					title: this.loc('TASKS_V2_RESULT_ADD'),
					icon: ui_iconSet_api_vue.Outline.PLUS_L,
					onClick: this.openAddResultSheet,
					dataset: {
						id: `MenuResultAdd-${this.taskId}`
					}
				}, {
					title: this.loc('TASKS_V2_RESULT_REQUIRE'),
					icon: ui_iconSet_api_vue.Outline.WINDOW_FLAG,
					onClick: this.requireResult,
					isLocked: this.isLocked,
					dataset: {
						id: `MenuResultRequire-${this.taskId}`
					}
				}];
			},
			isLocked() {
				return !tasks_v2_core.Core.getParams().restrictions.requiredResult.available;
			},
			featureId() {
				return tasks_v2_core.Core.getParams().restrictions.requiredResult.featureId;
			},
			clickAction() {
				if (this.isSelected) {
					return ChipAction.Highlight;
				}
				if (this.isTemplate || !this.isEdit && !this.isLocked) {
					return ChipAction.RequireResult;
				}
				return this.task.rights.edit ? ChipAction.Menu : ChipAction.AddResult;
			},
			shownPopupType() {
				if (this.isMenuShown) {
					return 'menu';
				}
				return this.isSheetShown ? 'dialog' : null;
			},
			popupType() {
				// A popup this chip opened stays on screen even when the click branch moves on meanwhile
				// (a result arrives, a result becomes required): keep announcing what is really open.
				return this.shownPopupType ?? {
					[ChipAction.Menu]: 'menu',
					[ChipAction.AddResult]: 'dialog'
				}[this.clickAction] ?? null;
			},
			isPopupShown() {
				return Boolean(this.shownPopupType);
			}
		},
		watch: {
			popupType() {
				this.syncChipAria();
			},
			isPopupShown() {
				this.syncChipAria();
			}
		},
		mounted() {
			main_core.Event.EventEmitter.subscribe(tasks_v2_const.EventName.OpenPrefilledResultForm, this.handleOpenPrefilledResultForm);
			this.syncChipAria();
		},
		beforeUnmount() {
			main_core.Event.EventEmitter.unsubscribe(tasks_v2_const.EventName.OpenPrefilledResultForm, this.handleOpenPrefilledResultForm);
		},
		methods: {
			handleClick() {
				switch (this.clickAction) {
					case ChipAction.Highlight:
						this.highlightField();
						break;
					case ChipAction.RequireResult:
						this.requireResult();
						break;
					case ChipAction.Menu:
						this.isMenuShown = true;
						break;
					default:
						this.openAddResultSheet();
						break;
				}
			},
			openAddResultSheet(text = null) {
				this.sheetFocusTrigger = captureFocusTrigger();
				const id = main_core.Text.getRandom();
				const payload = {
					id,
					text,
					taskId: this.taskId,
					author: this.getUser(this.currentUserId)
				};
				void this.$store.dispatch(`${tasks_v2_const.Model.Results}/insert`, payload);
				this.sheetResultId = id;
				this.setSheetShown(true);
			},
			syncChipAria() {
				const el = this.$refs.chip?.$el;
				if (!el) {
					return;
				}
				el.setAttribute('role', 'button');
				if (this.popupType === null) {
					el.removeAttribute('aria-haspopup');
					el.removeAttribute('aria-expanded');
					return;
				}
				el.setAttribute('aria-haspopup', this.popupType);
				el.setAttribute('aria-expanded', String(this.isPopupShown));
			},
			handleMenuClose() {
				this.isMenuShown = false;
				this.$refs.chip?.$el?.focus();
			},
			handleSheetClose() {
				this.setSheetShown(false);
				restoreFocusTrigger(this.sheetFocusTrigger);
				this.sheetFocusTrigger = null;
			},
			async requireResult() {
				if (this.isLocked) {
					void tasks_v2_lib_showLimit.showLimit({
						code: `limit_${this.featureId}`,
						bindElement: this.$refs.chip.$el,
						analytics: {
							type: 'limit_tasks_status_summary'
						}
					});
					return;
				}
				void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
					requireResult: true
				});
				if (this.isEdit) {
					return;
				}
				if (this.isTemplate) {
					await this.$store.dispatch(`${tasks_v2_const.Model.Interface}/updateTemplateStateFlags`, {
						defaultRequireResult: true
					});
					void tasks_v2_provider_service_stateService.stateService.setTemplateFlags(this.templateStateFlags);
				} else {
					await this.$store.dispatch(`${tasks_v2_const.Model.Interface}/updateStateFlags`, {
						defaultRequireResult: true
					});
					void tasks_v2_provider_service_stateService.stateService.set(this.stateFlags);
				}
			},
			highlightField() {
				void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(resultsMeta.id);
			},
			getUser(userId) {
				return this.$store.getters[`${tasks_v2_const.Model.Users}/getById`](userId);
			},
			setSheetShown(isShown) {
				this.$emit('update:isSheetShown', isShown);
			},
			handleOpenPrefilledResultForm(event) {
				const {
					taskId,
					text
				} = event.getData();
				if (this.taskId !== taskId || event.isDefaultPrevented()) {
					return;
				}
				if (this.embedded) {
					queueMicrotask(() => {
						if (!event.isDefaultPrevented()) {
							event.preventDefault();
							this.openAddResultSheet(text);
						}
					});
					return;
				}
				event.preventDefault();
				this.openAddResultSheet(text);
			}
		},
		template: `
		<Chip
			:design
			:text="resultsMeta.title"
			:icon="Outline.WINDOW_FLAG"
			:data-task-id="taskId"
			:data-task-chip-id="resultsMeta.id"
			data-testid="tasks-results-chip"
			ref="chip"
			@click="handleClick"
		/>
		<BMenu v-if="isMenuShown" :options="menuOptions" @close="handleMenuClose"/>
		<ResultEditorSheet
			v-if="isSheetShown"
			:resultId="sheetResultId"
			:sheetBindProps
			@close="handleSheetClose"
		/>
	`
	};

	exports.ResultEditorSheet = ResultEditorSheet;
	exports.ResultListSheet = ResultListSheet;
	exports.Results = Results;
	exports.ResultsChip = ResultsChip;
	exports.resultsMeta = resultsMeta;

})(this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}, BX, BX.Event, BX.UI.Accessibility, BX.Tasks.V2.Lib, BX.Vue3.Vuex, BX.Vue3.Directives, BX.UI.Vue3.Components, BX.UI.System.Typography.Vue, BX.UI.IconSet, window, window, BX.Tasks.V2, BX.Tasks.V2.Const, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Vue3, BX.Tasks.V2.Component, BX.Tasks.V2.Lib, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Vue3.Components, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.UI.System.Skeleton.Vue, BX.Tasks.V2.Component, BX.UI.Uploader, BX.UI.NotificationManager, BX.Tasks.V2.Lib, BX.UI.System.Chip.Vue);
//# sourceMappingURL=results.bundle.js.map
