/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_core, main_core_events, main_sidepanel, ui_vue3, ui_vue3_mixins_locMixin, tasks_v2_application_taskCard, tasks_v2_core, tasks_v2_const, tasks_v2_lib_idUtils, tasks_v2_provider_service_taskService, ui_notificationManager, ui_system_skeleton, ui_system_skeleton_vue, ui_vue3_vuex, tasks_v2_lib_analytics, tasks_v2_lib_ahaMoments, tasks_v2_component_elements_fieldList, tasks_v2_component_elements_contentResizer, tasks_v2_component_dropZone, tasks_v2_component_entityText, tasks_v2_component_userFieldsSlider, tasks_v2_component_fields_description, tasks_v2_component_fields_creator, tasks_v2_component_fields_responsible, tasks_v2_component_fields_deadline, tasks_v2_component_fields_status, tasks_v2_component_fields_files, tasks_v2_component_fields_checkList, tasks_v2_component_fields_group, tasks_v2_component_fields_flow, tasks_v2_component_fields_accomplices, tasks_v2_component_fields_auditors, tasks_v2_component_fields_tags, tasks_v2_component_fields_crm, tasks_v2_component_fields_datePlan, tasks_v2_component_fields_timeTracking, tasks_v2_component_fields_subTasks, tasks_v2_component_fields_parentTask, tasks_v2_component_fields_relatedTasks, tasks_v2_component_fields_gantt, tasks_v2_component_fields_results, tasks_v2_component_fields_reminders, tasks_v2_component_fields_replication, tasks_v2_component_fields_email, tasks_v2_component_fields_userFields, tasks_v2_component_fields_placements, tasks_v2_component_fields_createdDate, tasks_v2_provider_service_fileService, tasks_v2_provider_service_templateService, tasks_v2_provider_service_deadlineService, tasks_v2_provider_service_timeTrackingService, tasks_v2_provider_service_viewersService, tasks_v2_component_fields_title, tasks_v2_component_fields_importance, ui_iconSet_api_vue, ui_iconSet_outline, ui_vue3_components_popup, tasks_v2_component_tasksControlPanel, tasks_v2_component_tasksEntityPicker, tasks_v2_lib_showLimit, tasks_v2_component_elements_hint, tasks_v2_lib_highlighter, tasks_v2_provider_service_resultService, ui_system_typography_vue, ui_vue3_components_button, ui_system_chip_vue, tasks_v2_component_addTaskButton, tasks_v2_component_tasksUserActionsDemonstrator, tasks_v2_component_elements_hoverPill, tasks_v2_component_markTaskButton, tasks_v2_provider_service_statusService, ui_system_menu_vue, tasks_v2_lib_userSelectorDialog, ui_vue3_directives_hint, ui_dialogs_messagebox) {
	'use strict';

	// @vue/component
	const TasksOpenerFullCard = {
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		inject: {
			taskId: {},
			task: {}
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			urlTaskCard() {
				return tasks_v2_application_taskCard.TaskCard.getUrl(this.taskId);
			}
		},
		methods: {
			openTaskInNewTab() {
				const newWindowUrl = this.urlTaskCard;
				Object.assign(document.createElement('a'), {
					target: '_blank',
					href: newWindowUrl
				}).click();
			},
			handleClickOpener() {
				this.openTaskInNewTab();
			}
		},
		template: `
		<button
			class="tasks-opener-full-card"
			@click="handleClickOpener"
		>
			<BIcon
				:name="Outline.GO_TO_L"
				class="tasks-opener-full-card__icon"
				hoverable
			/>
			<span class="tasks-opener-full-card__text">{{ loc('TASKS_V2_TASK_FULL_CARD_OPEN_TASK_NEW_TAB') }}</span>
		</button>
	`
	};

	const templatePickerOpenerId = 'templatePickerOpener';

	// @vue/component
	const ControlPanel = {
		name: 'TaskFullCardControlPanel',
		components: {
			Popup: ui_vue3_components_popup.Popup,
			BIcon: ui_iconSet_api_vue.BIcon,
			TasksOpenerFullCard,
			TasksControlPanel: tasks_v2_component_tasksControlPanel.TasksControlPanel,
			TasksControlPanelSection: tasks_v2_component_tasksControlPanel.TasksControlPanelSection,
			TasksControlPanelMenu: tasks_v2_component_tasksControlPanel.TasksControlPanelMenu,
			TasksControlPanelInfo: tasks_v2_component_tasksControlPanel.TasksControlPanelInfo,
			TasksEntityPicker: tasks_v2_component_tasksEntityPicker.TasksEntityPicker
		},
		inject: {
			analytics: {},
			embedded: {},
			task: {},
			taskId: {}
		},
		setup() {
			return {
				Main: ui_iconSet_api_vue.Main,
				Outline: ui_iconSet_api_vue.Outline,
				Solid: ui_iconSet_api_vue.Solid,
				userRights: tasks_v2_core.Core.getParams().rights
			};
		},
		data() {
			return {
				intervalAutoHideWorkaround: null,
				isControlPanelOpened: false,
				isTemplatesPickerOpened: false,
				popupOpenerTemplatesPicker: null
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				currentUserId: `${tasks_v2_const.Model.Interface}/currentUserId`
			}),
			isStakeholderLocked() {
				return !tasks_v2_core.Core.getParams().restrictions.stakeholder.available;
			},
			isInnerPopupOpened() {
				return Boolean(this.isTemplatesPickerOpened);
			},
			isSelfHideEnabled() {
				return !this.isInnerPopupOpened;
			},
			optionsPopupControlPanel() {
				const popupWidth = 340;
				return {
					bindElement: this.$refs.controlPanelOpener,
					className: 'tasks-full-card-header__control-panel-popup',
					width: popupWidth,
					offsetTop: 10,
					offsetLeft: 10 + this.$refs.controlPanelOpener.offsetWidth - popupWidth
				};
			},
			optionsPopupTemplatesPicker() {
				const openerElement = this.popupOpenerTemplatesPicker;
				const openerWidth = openerElement ? openerElement.offsetWidth : 0;
				const openerHeight = openerElement ? openerElement.offsetHeight : 0;
				return {
					positioning: {
						elementAnchor: openerElement,
						offsetVertical: openerHeight * -1 - 10,
						offsetHorizontal: openerWidth + 5
					}
				};
			},
			optionsTemplatesPicker() {
				const popupWidth = 385;
				const popupHeight = 385;
				return {
					context: 'tasks-card',
					width: popupWidth,
					height: popupHeight,
					autoHide: false,
					closeByEsc: false,
					multiple: false,
					enableSearch: true,
					dropdownMode: true,
					entities: [{
						id: tasks_v2_const.EntitySelectorEntity.TemplateCommon,
						options: {
							isFullListOpenable: true
						}
					}],
					popupOptions: {
						className: 'popup-window_entity-picker-no-check'
					}
				};
			},
			itemToggleWatch() {
				const watch = {
					title: this.loc('TASKS_V2_TASK_FULL_CARD_BECOME_AUDITOR_ACTION'),
					icon: ui_iconSet_api_vue.Outline.OBSERVER,
					successNotification: this.loc('TASKS_V2_TASK_FULL_CARD_BECOME_AUDITOR_NOTIF_SUCC'),
					failNotification: this.loc('TASKS_V2_TASK_FULL_CARD_BECOME_AUDITOR_NOTIF_FAIL'),
					auditorsIds: [...this.task.auditorsIds, this.currentUserId],
					endpoint: 'Task.Audit.watch'
				};
				const unWatch = {
					title: this.loc('TASKS_V2_TASK_FULL_CARD_STOP_BEING_AUDITOR_ACTION'),
					icon: ui_iconSet_api_vue.Outline.CROSSED_EYE,
					successNotification: this.loc('TASKS_V2_TASK_FULL_CARD_STOP_BEING_AUDITOR_NOTIF_SUCC'),
					failNotification: this.loc('TASKS_V2_TASK_FULL_CARD_STOP_BEING_AUDITOR_NOTIF_FAIL'),
					auditorsIds: this.task.auditorsIds.filter(id => id !== this.currentUserId),
					endpoint: 'Task.Audit.unwatch'
				};
				const action = this.task.auditorsIds.includes(this.currentUserId) ? unWatch : watch;
				return {
					title: action.title,
					icon: action.icon,
					isLocked: this.isStakeholderLocked,
					isDisabled: !this.task.rights.watch,
					handleClickItem: async () => {
						if (this.isStakeholderLocked) {
							void tasks_v2_lib_showLimit.showLimit({
								featureId: tasks_v2_core.Core.getParams().restrictions.stakeholder.featureId,
								bindElement: this.$el
							});
							return;
						}
						const result = await tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
							auditorsIds: action.auditorsIds
						});
						const isSuccess = !result[action.endpoint]?.length;
						ui_notificationManager.Notifier.notifyViaBrowserProvider({
							id: 'task-notify-watch',
							text: isSuccess ? action.successNotification : action.failNotification
						});
					}
				};
			},
			itemToggleNotification() {
				const mute = {
					title: this.loc('TASKS_V2_TASK_FULL_CARD_MUTE_ACTION'),
					icon: ui_iconSet_api_vue.Outline.SOUND_OFF,
					successNotificationTitle: this.loc('TASKS_V2_TASK_FULL_CARD_MUTE_NOTIF_SUCC_TITLE'),
					successNotification: this.loc('TASKS_V2_TASK_FULL_CARD_MUTE_NOTIF_SUCC_DESCR'),
					failNotification: this.loc('TASKS_V2_TASK_FULL_CARD_MUTE_NOTIF_FAIL')
				};
				const unMute = {
					title: this.loc('TASKS_V2_TASK_FULL_CARD_UNMUTE_ACTION'),
					icon: ui_iconSet_api_vue.Outline.SOUND_ON,
					successNotificationTitle: this.loc('TASKS_V2_TASK_FULL_CARD_UNMUTE_NOTIF_SUCC_TITLE'),
					successNotification: this.loc('TASKS_V2_TASK_FULL_CARD_UNMUTE_NOTIF_SUCC_DESCR'),
					failNotification: this.loc('TASKS_V2_TASK_FULL_CARD_UNMUTE_NOTIF_FAIL')
				};
				const action = this.task.isMuted ? unMute : mute;
				return {
					title: action.title,
					icon: action.icon,
					isDisabled: !this.task.rights.mute,
					handleClickItem: async () => {
						const isSuccess = await tasks_v2_provider_service_taskService.taskService.setMute(this.taskId, !this.task.isMuted);
						ui_notificationManager.Notifier.notifyViaBrowserProvider({
							id: 'task-notify-mute',
							title: action.successNotificationTitle,
							text: isSuccess ? action.successNotification : action.failNotification
						});
					}
				};
			},
			itemToggleFavor() {
				const favor = {
					title: this.loc('TASKS_V2_TASK_FULL_CARD_FAVOR_ACTION'),
					icon: ui_iconSet_api_vue.Outline.FAVORITE,
					successNotification: this.loc('TASKS_V2_TASK_FULL_CARD_FAVOR_NOTIF_SUCC'),
					failNotification: this.loc('TASKS_V2_TASK_FULL_CARD_FAVOR_NOTIF_FAIL')
				};
				const unFavor = {
					title: this.loc('TASKS_V2_TASK_FULL_CARD_UNFAVOR_ACTION'),
					icon: ui_iconSet_api_vue.Outline.NON_FAVORITE,
					successNotification: this.loc('TASKS_V2_TASK_FULL_CARD_UNFAVOR_NOTIF_SUCC'),
					failNotification: this.loc('TASKS_V2_TASK_FULL_CARD_UNFAVOR_NOTIF_FAIL')
				};
				const action = this.task.isFavorite ? unFavor : favor;
				return {
					title: action.title,
					icon: action.icon,
					isDisabled: !this.task.rights.favorite,
					handleClickItem: async () => {
						const isSuccess = await tasks_v2_provider_service_taskService.taskService.setFavorite(this.taskId, !this.task.isFavorite);
						ui_notificationManager.Notifier.notifyViaBrowserProvider({
							id: 'task-notify-favorite',
							text: isSuccess ? action.successNotification : action.failNotification
						});
					}
				};
			},
			itemCopyUrl() {
				const action = {
					title: this.loc('TASKS_V2_TASK_FULL_CARD_COPY_TASK_URL_ACTION'),
					icon: ui_iconSet_api_vue.Outline.LINK,
					successNotification: this.loc('TASKS_V2_TASK_FULL_CARD_COPY_TASK_URL_NOTIF_SUCC'),
					failNotification: this.loc('TASKS_V2_TASK_FULL_CARD_COPY_TASK_URL_NOTIF_FAIL')
				};
				return {
					title: action.title,
					icon: action.icon,
					handleClickItem: async () => {
						const path = tasks_v2_application_taskCard.TaskCard.getUrl(this.taskId);
						const url = `${window.location.origin}${path}`;
						const isCopyingSuccess = Boolean(path) && BX.clipboard.copy(url);
						ui_notificationManager.Notifier.notifyViaBrowserProvider({
							id: 'task-notify-copy-url',
							text: isCopyingSuccess ? action.successNotification : action.failNotification
						});
					}
				};
			},
			itemCreationTaskNew() {
				return {
					title: this.loc('TASKS_V2_TASK_FULL_CARD_CREATE_STANDALONE_TASK'),
					icon: ui_iconSet_api_vue.Outline.TASK,
					handleClickItem: () => {
						this.isControlPanelOpened = false;
						tasks_v2_application_taskCard.TaskCard.showCompactCard({
							groupId: this.task.groupId,
							analytics: this.getAnalytics()
						});
					}
				};
			},
			itemCreationSubtask() {
				return {
					title: this.loc('TASKS_V2_TASK_FULL_CARD_CREATE_SUBTASK'),
					icon: ui_iconSet_api_vue.Outline.RELATED_TASKS,
					handleClickItem: () => {
						this.isControlPanelOpened = false;
						tasks_v2_application_taskCard.TaskCard.showCompactCard({
							groupId: this.task.groupId,
							parentId: this.taskId,
							analytics: this.getAnalytics(tasks_v2_const.Analytics.Element.ContextMenuSubtask)
						});
					}
				};
			},
			itemCreationTaskCopy() {
				return {
					title: this.loc('TASKS_V2_TASK_FULL_CARD_CREATE_TASK_COPY'),
					icon: ui_iconSet_api_vue.Outline.DUPLICATE,
					handleClickItem: () => tasks_v2_application_taskCard.TaskCard.showFullCard({
						copiedFromId: this.taskId,
						analytics: this.getAnalytics()
					})
				};
			},
			itemCreationTaskNewWithTemplate() {
				return {
					id: templatePickerOpenerId,
					title: this.loc('TASKS_V2_TASK_FULL_CARD_CREATE_STANDALONE_TASK_WITH_TEMPLATE'),
					icon: ui_iconSet_api_vue.Outline.TEMPLATE_PLUS,
					handleClickItem: this.handleClickTemplatesPickerOpener,
					isActive: this.isTemplatesPickerOpened
				};
			},
			itemCreationTemplateFromTask() {
				return {
					title: this.loc('TASKS_V2_TASK_FULL_CARD_CREATE_TEMPLATE_FROM_TASK'),
					icon: ui_iconSet_api_vue.Outline.O_TEMPLATE_TASK,
					handleClickItem: async () => {
						this.isControlPanelOpened = false;
						const [id, error] = await tasks_v2_provider_service_templateService.templateService.addFromExistingTask(this.taskId);
						main_core_events.EventEmitter.emit(tasks_v2_const.EventName.NotifyTemplateCreated, {
							id,
							error
						});
					}
				};
			},
			itemRoutingBitrixMarket() {
				return {
					title: this.loc('TASKS_V2_TASK_FULL_CARD_GO_TO_BITRIX_MARKET'),
					icon: ui_iconSet_api_vue.Outline.MARKET,
					handleClickItem: () => {
						this.isControlPanelOpened = false;
						BX.rest.Marketplace.open({
							PLACEMENT: 'TASK_LIST_CONTEXT_MENU'
						});
					}
				};
			},
			itemRoutingRobots() {
				const isLocked = !tasks_v2_core.Core.getParams().restrictions.robots.available;
				return {
					title: this.loc('TASKS_V2_TASK_FULL_CARD_GO_TO_ROBOTS'),
					icon: isLocked ? ui_iconSet_api_vue.Outline.LOCK_L : ui_iconSet_api_vue.Outline.ROBOT,
					handleClickItem: () => {
						if (isLocked) {
							this.isMenuShown = false;
							void tasks_v2_lib_showLimit.showLimit({
								featureId: tasks_v2_core.Core.getParams().restrictions.robots.featureId,
								bindElement: this.$refs.container
							});
							return;
						}
						this.isControlPanelOpened = false;
						BX.SidePanel.Instance.open(`/bitrix/components/bitrix/tasks.automation/slider.php?site_id=${this.loc('SITE_ID')}&project_id=${this.task.groupId}&task_id=${this.taskId}`, {
							cacheable: false,
							customLeftBoundary: 0,
							loader: 'bizproc:automation-loader'
						});
					}
				};
			},
			itemsToggle() {
				return [this.itemToggleWatch, this.itemToggleNotification, this.itemCopyUrl].filter(item => item);
			},
			itemsCreation() {
				return [this.userRights.tasks.create && this.itemCreationTaskNew, this.task.rights.createSubtask && this.itemCreationSubtask, this.task.rights.copy && this.itemCreationTaskCopy, this.userRights.tasks.createFromTemplate && this.itemCreationTaskNewWithTemplate, this.task.rights.saveAsTemplate && this.itemCreationTemplateFromTask, this.itemToggleFavor].filter(item => item);
			},
			itemsRouting() {
				return [this.itemRoutingBitrixMarket, this.userRights.tasks.robot && this.itemRoutingRobots].filter(item => item);
			}
		},
		watch: {
			isSelfHideEnabled(value) {
				this.setSelfHide(value);
			},
			async isControlPanelOpened(value) {
				await this.$nextTick();
				this.popupOpenerTemplatesPicker = value ? document.getElementById(templatePickerOpenerId) : null;
			}
		},
		async beforeUnmount() {
			// TODO: "BOTTOMSHEET REMOVING BINDINGS BUG"
			// remove this workaround (and other instanses) when main.popup autoHide is fixed
			// it prevents unbinding popup props including autoHide after
			// big bottomsheet is opened, e.g. "All templates" bottomsheet
			if (this.intervalAutoHideWorkaround) {
				clearInterval(this.intervalAutoHideWorkaround);
			}
			// workaround end
		},
		methods: {
			getAnalytics(element = tasks_v2_const.Analytics.Element.ContextMenu) {
				return {
					element,
					context: this.analytics?.context ?? tasks_v2_const.Analytics.Section.Tasks,
					additionalContext: tasks_v2_const.Analytics.SubSection.TaskCard
				};
			},
			freezeControlPanelPopup() {
				this.$refs.controlPanelPopup?.getPopupInstance()?.setAutoHide(false);
				this.$refs.controlPanelPopup?.getPopupInstance()?.setClosingByEsc(false);
			},
			unfreezeControlPanelPopup() {
				setTimeout(() => {
					this.$refs.controlPanelPopup?.getPopupInstance()?.setAutoHide(true);
					this.$refs.controlPanelPopup?.getPopupInstance()?.setClosingByEsc(true);
				}, 100);
			},
			setSelfHide(isSelfHideEnabledNew) {
				if (isSelfHideEnabledNew === false) {
					this.freezeControlPanelPopup();
					// TODO: "BOTTOMSHEET REMOVING BINDINGS BUG"
					if (this.intervalAutoHideWorkaround) {
						clearInterval(this.intervalAutoHideWorkaround);
					}
					this.intervalAutoHideWorkaround = setInterval(() => {
						this.setSelfHide(this.isSelfHideEnabled);
					}, 100);
				} else {
					// TODO: "BOTTOMSHEET REMOVING BINDINGS BUG"
					if (this.intervalAutoHideWorkaround) {
						clearInterval(this.intervalAutoHideWorkaround);
					}
					this.unfreezeControlPanelPopup();
				}
			},
			createTaskFromTemplate(templateId) {
				tasks_v2_application_taskCard.TaskCard.showFullCard({
					templateId: tasks_v2_lib_idUtils.idUtils.unbox(templateId),
					analytics: {
						context: tasks_v2_const.Analytics.Section.Templates,
						additionalContext: tasks_v2_const.Analytics.SubSection.TemplatesCard,
						element: tasks_v2_const.Analytics.Element.CreateButton
					}
				});
			},
			showTemplatesPicker() {
				this.isTemplatesPickerOpened = true;
			},
			closeTemplatesPicker() {
				this.isTemplatesPickerOpened = false;
			},
			handleClickControlPanelOpener() {
				this.isControlPanelOpened = !this.isControlPanelOpened;
			},
			handleCloseControlPanel() {
				this.isControlPanelOpened = false;
			},
			handleClickTemplatesPickerOpener() {
				event.preventDefault();
				event.stopPropagation();
				this.showTemplatesPicker();
			},
			handleSelectTemplatesPicker(dialog) {
				const entity = dialog.getSelectedItems()[0];
				const entityId = entity?.getId();
				if (entityId > 0) {
					this.createTaskFromTemplate(entityId);
					dialog.deselectAll();
				}
			},
			handleCloseTemplatesPicker() {
				this.closeTemplatesPicker();
			}
		},
		template: `
		<div
			class="tasks-full-card-header__control-panel-opener print-ignore"
			ref="controlPanelOpener"
			@click="handleClickControlPanelOpener"
		>
			<BIcon
				class="tasks-full-card-header__control-panel-opener-icon"
				:name="Outline.HAMBURGER_MENU"
				hoverable
			/>
		</div>
		<Popup
			v-if="isControlPanelOpened"
			ref="controlPanelPopup"
			:options="optionsPopupControlPanel"
			@close="handleCloseControlPanel"
		>
			<TasksControlPanel>
				<TasksControlPanelSection
					:controlItems="itemsToggle"
				>
				</TasksControlPanelSection>
				<TasksControlPanelMenu
					:menuItems="itemsCreation"
				/>
				<TasksControlPanelMenu
					:menuItems="itemsRouting"
				/>
				<TasksControlPanelInfo v-if="embedded">
					<TasksOpenerFullCard />
				</TasksControlPanelInfo>
			</TasksControlPanel>
		</Popup>
		<TasksEntityPicker
			ref="popupTemplatesPicker"
			:isOpened="isTemplatesPickerOpened"
			:optionsPopup="optionsPopupTemplatesPicker"
			:optionsEntityPicker="optionsTemplatesPicker"
			@select="handleSelectTemplatesPicker"
			@close="handleCloseTemplatesPicker"
		/>
	`
	};

	// @vue/component
	const TasksCloserEmbedded = {
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			onCloseEmbedded: {
				type: Function,
				required: true
			}
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		methods: {
			handleClickCloser() {
				this.onCloseEmbedded();
			}
		},
		template: `
		<button
			class="tasks-closer-embedded"
			@click="handleClickCloser"
		>
			<BIcon
				:name="Outline.CROSS_L"
				class="tasks-closer-embedded__icon"
				hoverable
			/>
		</button>
	`
	};

	// @vue/component
	const TaskHeader = {
		name: 'TaskFullCardHeader',
		components: {
			TitleField: tasks_v2_component_fields_title.Title,
			Importance: tasks_v2_component_fields_importance.Importance,
			ControlPanel,
			TasksCloserEmbedded
		},
		inject: {
			isEdit: {},
			isTemplate: {},
			embedded: {},
			onCloseEmbedded: {}
		},
		template: `
		<div class="tasks-full-card-header">
			<TitleField />
			<Importance />
			<ControlPanel
				v-if="!isTemplate && isEdit"
			/>
			<TasksCloserEmbedded
				v-if="embedded && onCloseEmbedded"
				:onCloseEmbedded
			/>
		</div>
	`
	};

	// @vue/component
	const TaskSettingsHint = {
		name: 'TasksTaskSettingsHint',
		components: {
			Hint: tasks_v2_component_elements_hint.Hint
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
		computed: {},
		created() {
			void tasks_v2_lib_highlighter.highlighter.highlight(this.bindElement);
		},
		template: `
		<Hint
			v-if="isShown"
			:bindElement
			:options="{
				maxWidth: 460,
				closeIcon: true,
				offsetLeft: 14,
			}"
			@close="$emit('close')"
		>
			<div class="tasks-task-settings-hint">
				<div class="tasks-task-settings-hint-image">
					<div class="tasks-task-settings-hint-icon"/>
				</div>
				<div class="tasks-task-settings-hint-content">
					<div class="tasks-task-settings-hint-title">
						{{ loc('TASKS_V2_TASK_FULL_CARD_AHA_TASK_SETTINGS_HINT_TITLE') }}
					</div>
					<div class="tasks-task-settings-hint-text">
						{{ loc('TASKS_V2_TASK_FULL_CARD_AHA_TASK_SETTINGS_HINT_TEXT') }}
					</div>
				</div>
			</div>
		</Hint>
	`
	};

	// eslint-disable-next-line no-unused-vars

	/**
	 * @param {typeof TaskCommentsMessageMenu} baseMenu
	 * @returns {typeof TaskCommentsMessageMenu}
	 */
	// eslint-disable-next-line max-lines-per-function
	const TaskFullCardMessageMenu = baseMenu => class extends baseMenu {
		getAddResultItem() {
			if (this.isDeletedMessage() || this.#isSystemMessage() || !this.#shouldShowAddResult()) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('TASKS_V2_TASK_FULL_CARD_MESSAGE_ADD_RESULT'),
				icon: ui_iconSet_api_vue.Outline.FLAG,
				onClick: () => {
					main_core_events.EventEmitter.emit(tasks_v2_const.EventName.AddResultFromChat, {
						taskId: this.getTaskId(),
						messageId: this.context.id,
						text: this.context.text,
						authorId: this.#getUserId()
					});
					this.close();
				}
			};
		}
		getRemoveResultItem() {
			if (this.isDeletedMessage() || this.#isSystemMessage() || !this.#shouldShowRemoveResult()) {
				return null;
			}
			return {
				title: main_core.Loc.getMessage('TASKS_V2_TASK_FULL_CARD_MESSAGE_DELETE_RESULT'),
				icon: ui_iconSet_api_vue.Outline.FLAG_WITH_CROSS,
				onClick: () => {
					main_core_events.EventEmitter.emit(tasks_v2_const.EventName.DeleteResultFromChat, {
						taskId: this.getTaskId(),
						resultId: this.#getMessageResultIdForCurrentUser()
					});
					this.close();
				}
			};
		}
		getTaskId() {
			return 0; // reinitialize in the calling class
		}
		#shouldShowAddResult() {
			const task = this.#getTask();
			if (!task) {
				return false;
			}
			return this.#getMessageResultIdForCurrentUser() === 0;
		}
		#isSystemMessage() {
			return this.context.authorId === 0;
		}
		#shouldShowRemoveResult() {
			const task = this.#getTask();
			if (!task) {
				return false;
			}
			return this.#getMessageResultIdForCurrentUser() > 0;
		}
		#getMessageResultIdForCurrentUser() {
			const task = this.#getTask();
			if (!task) {
				return 0;
			}
			const map = task?.resultsMessageMap || {};
			const messageId = this.context.id;
			for (const [resultId, boundMessageId] of Object.entries(map)) {
				if (boundMessageId !== null && Number(boundMessageId) === Number(messageId)) {
					const messageResult = tasks_v2_provider_service_resultService.resultService.getStoreResult(Number(resultId));
					if (messageResult !== null && messageResult.author.id === this.#getUserId()) {
						return messageResult.id;
					}
				}
			}
			return 0;
		}
		#getTask() {
			return tasks_v2_provider_service_taskService.taskService.getStoreTask(this.getTaskId());
		}
		#getUserId() {
			return tasks_v2_core.Core.getParams().currentUser.id;
		}
	};

	// @vue/component
	const ChatAha = {
		components: {
			UiButton: ui_vue3_components_button.Button,
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
		emits: ['close'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		created() {
			void tasks_v2_lib_highlighter.highlighter.highlight(this.bindElement, 1000);
		},
		template: `
		<Hint
			v-if="isShown"
			:bindElement
			:options="{
				closeIcon: true,
				minWidth: 500,
				maxWidth: 500,
				padding: 0,
				offsetLeft: 22,
			}"
			@close="$emit('close')"
		>
			<div class="tasks-chat-aha-container">
				<div class="tasks-chat-aha-icon"/>
				<div class="tasks-chat-aha-info">
					<HeadlineSm class="tasks-chat-aha-info-text">
						{{ loc('TASKS_V2_TASK_FULL_CARD_CHAT_AHA_TITLE') }}
					</HeadlineSm>
					<TextMd class="tasks-chat-aha-info-text">
						{{ loc('TASKS_V2_TASK_FULL_CARD_CHAT_AHA_DESC') }}
					</TextMd>
				</div>
			</div>
		</Hint>
	`
	};

	// @vue/component
	const ImportantMessagesAha = {
		components: {
			UiButton: ui_vue3_components_button.Button,
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
		emits: ['close'],
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		created() {
			void tasks_v2_lib_highlighter.highlighter.highlight(this.bindElement, 2000);
		},
		template: `
		<Hint
			v-if="isShown"
			:bindElement
			:options="{
				closeIcon: true,
				minWidth: 500,
				maxWidth: 500,
				padding: 0,
				offsetLeft: bindElement.offsetWidth / 4,
				angle: {
					offset: bindElement.offsetWidth / 4,
				}
			}"
			@close="$emit('close')"
		>
			<div class="tasks-important-messages-aha-container">
				<div class="tasks-important-messages-aha-icon"/>
				<div class="tasks-important-messages-aha-info">
					<HeadlineSm class="tasks-important-messages-aha-info-text">
						{{ loc('TASKS_V2_TASK_FULL_CARD_IMPORTANT_MESSAGES_TITLE') }}
					</HeadlineSm>
					<TextMd class="tasks-important-messages-aha-info-text">
						{{ loc('TASKS_V2_TASK_FULL_CARD_IMPORTANT_MESSAGES_DESC') }}
					</TextMd>
				</div>
			</div>
		</Hint>
	`
	};

	// @vue/component
	const Chat = {
		name: 'TaskFullCardChat',
		components: {
			ChatAha,
			ImportantMessagesAha
		},
		inject: {
			task: {},
			taskId: {},
			isEdit: {}
		},
		setup() {
			return {
				/** @type MessageMenuContext */
				messageMenuManager: null
			};
		},
		data() {
			return {
				isTaskChatAhaShown: false,
				isTaskImportantMessagesAhaShown: false
			};
		},
		computed: {
			taskChatAhaBindElement() {
				if (this.$refs.chat) {
					return this.$refs.chat.querySelector('.bx-im-chat-header__left');
				}
				return null;
			},
			taskImportantMessagesAhaBindElement() {
				if (this.$refs.chat) {
					return this.$refs.chat.querySelector('.bx-im-send-panel__container');
				}
				return null;
			}
		},
		watch: {
			async taskId() {
				await this.openChat();
				void this.registerMessageMenu();
			}
		},
		created() {
			if (this.isEdit) {
				this.registerMessageMenu();
			}
		},
		mounted() {
			void this.openChat();
		},
		unmounted() {
			this.unregisterMessageMenu();
			this.app?.bitrixVue.unmount();
		},
		methods: {
			async openChat() {
				if (!tasks_v2_core.Core.getParams().features.im) {
					return;
				}
				this.app?.bitrixVue.unmount();
				const {
					Messenger
				} = await main_core.Runtime.loadExtension('im.public');
				this.app ??= await Messenger.initApplication('task'); // im.v2.application.integration.task

				if (this.isEdit) {
					await this.app.mount({
						rootContainer: this.$refs.chat,
						chatId: this.task.chatId,
						taskId: this.taskId,
						type: tasks_v2_core.Core.getParams().chatType
					});
					this.tryShowAha();
				} else {
					await this.app.mountPlaceholder({
						rootContainer: this.$refs.chat,
						taskId: `'${this.taskId}'`
					});
					main_core_events.EventEmitter.emit('tasks:card:onMembersCountChange', {
						taskId: this.taskId,
						userCounter: 1
					});
				}
			},
			async registerMessageMenu() {
				if (!tasks_v2_core.Core.getParams().features.im) {
					return;
				}
				const {
					TaskCommentsMessageMenu,
					MessageMenuManager
				} = await main_core.Runtime.loadExtension('im.v2.lib.menu');
				this.messageMenuManager = MessageMenuManager;
				const taskId = this.taskId;
				const taskFullCardMessageMenu = class extends TaskFullCardMessageMenu(TaskCommentsMessageMenu) {
					getTaskId() {
						return taskId;
					}
				};
				this.messageMenuManager.getInstance().registerMenuByCallback(this.isCurrentChat, taskFullCardMessageMenu);
			},
			unregisterMessageMenu() {
				this.messageMenuManager?.getInstance().unregisterMenuByCallback(this.isCurrentChat);
			},
			isCurrentChat(messageContext) {
				return messageContext.chatId === this.task.chatId;
			},
			tryShowAha() {
				if (this.taskChatAhaBindElement && tasks_v2_lib_ahaMoments.ahaMoments.shouldShow(tasks_v2_const.Option.AhaTaskChatPopup)) {
					tasks_v2_lib_ahaMoments.ahaMoments.setActive(tasks_v2_const.Option.AhaTaskChatPopup);
					setTimeout(this.showTaskChatAha, 3000);
					return;
				}
				if (this.taskImportantMessagesAhaBindElement && tasks_v2_lib_ahaMoments.ahaMoments.shouldShow(tasks_v2_const.Option.AhaTaskImportantMessagesPopup)) {
					tasks_v2_lib_ahaMoments.ahaMoments.setActive(tasks_v2_const.Option.AhaTaskImportantMessagesPopup);
					setTimeout(this.showTaskImportantMessagesAha, 3000);
				}
			},
			showTaskChatAha() {
				this.isTaskChatAhaShown = true;
				tasks_v2_lib_ahaMoments.ahaMoments.setShown(tasks_v2_const.Option.AhaTaskChatPopup);
			},
			showTaskImportantMessagesAha() {
				this.isTaskImportantMessagesAhaShown = true;
				tasks_v2_lib_ahaMoments.ahaMoments.setShown(tasks_v2_const.Option.AhaTaskImportantMessagesPopup);
			},
			handleCloseChatAha() {
				this.isTaskChatAhaShown = false;
				tasks_v2_lib_ahaMoments.ahaMoments.setInactive(tasks_v2_const.Option.AhaTaskChatPopup);
				if (tasks_v2_lib_ahaMoments.ahaMoments.shouldShow(tasks_v2_const.Option.AhaTaskImportantMessagesPopup)) {
					setTimeout(this.showTaskImportantMessagesAha, 2000);
				}
			},
			handleCloseImportantMessagesAha() {
				this.isTaskImportantMessagesAhaShown = false;
				tasks_v2_lib_ahaMoments.ahaMoments.setInactive(tasks_v2_const.Option.AhaTaskImportantMessagesPopup);
			}
		},
		template: `
		<div class="tasks-full-card-chat print-ignore" ref="chat">
			<div style="color: #f00">module 'im' is not installed</div>
		</div>
		<ChatAha
			v-if="isTaskChatAhaShown"
			:isShown="isTaskChatAhaShown"
			:bindElement="taskChatAhaBindElement"
			@close="handleCloseChatAha"
		/>
		<ImportantMessagesAha
			v-if="isTaskImportantMessagesAhaShown"
			:isShown="isTaskImportantMessagesAhaShown"
			:bindElement="taskImportantMessagesAhaBindElement"
			@close="handleCloseImportantMessagesAha"
		/>
	`
	};

	const maxVisible = 50;

	// @vue/component
	const Chips = {
		components: {
			Chip: ui_system_chip_vue.Chip
		},
		props: {
			/** @type AppChip[] */
			chips: {
				type: Array,
				required: true
			}
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				ChipDesign: ui_system_chip_vue.ChipDesign
			};
		},
		data() {
			return {
				chipsCollapsed: true
			};
		},
		computed: {
			preparedChips() {
				return this.chips.filter(({
					isEnabled
				}) => isEnabled ?? true).map((chip, index) => ({
					...chip,
					collapsed: index >= maxVisible
				}));
			},
			hasCollapsedChips() {
				return this.preparedChips.some(({
					collapsed
				}) => collapsed);
			}
		},
		template: `
		<div class="tasks-full-card-chips print-ignore">
			<template v-for="(chip, key) of preparedChips" :key>
				<component
					v-if="!chip.collapsed || !chipsCollapsed"
					:is="chip.component"
					v-bind="chip.props ?? {}"
					v-on="chip.events ?? {}"
				/>
			</template>
			<Chip
				v-if="hasCollapsedChips"
				:design="ChipDesign.ShadowNoAccent"
				:icon="chipsCollapsed ? Outline.APPS : Outline.CHEVRON_TOP_L"
				:text="chipsCollapsed ? loc('TASKS_V2_TASK_FULL_CARD_MORE') : ''"
				@click="chipsCollapsed = !chipsCollapsed"
			/>
		</div>
	`
	};

	// @vue/component
	const FooterCreate = {
		components: {
			UiButton: ui_vue3_components_button.Button,
			AddTaskButton: tasks_v2_component_addTaskButton.AddTaskButton,
			TemplatesButton: ui_vue3.BitrixVue.defineAsyncComponent('tasks.v2.component.templates-button', 'TemplatesButton', {
				delay: 0,
				loadingComponent: {
					components: {
						BLine: ui_system_skeleton_vue.BLine
					},
					template: '<BLine :width="131" :height="22"/>'
				}
			}),
			TemplatePermissionsButton: ui_vue3.BitrixVue.defineAsyncComponent('tasks.v2.component.template-permissions-button', 'TemplatePermissionsButton', {
				delay: 0,
				loadingComponent: {
					components: {
						BLine: ui_system_skeleton_vue.BLine
					},
					template: '<BLine :width="131" :height="22"/>'
				}
			})
		},
		inject: {
			/** @type{boolean} */
			isTemplate: {}
		},
		props: {
			creationError: {
				type: Boolean,
				required: true
			}
		},
		emits: ['addTask', 'copyTask', 'fromTemplate', 'update:creationError', 'close'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		computed: {
			hasError: {
				get() {
					return this.creationError;
				},
				set(creationError) {
					this.$emit('update:creationError', creationError);
				}
			},
			isTemplateEnabled() {
				return tasks_v2_core.Core.getParams().features.isTemplateEnabled;
			}
		},
		methods: {
			handleAddClick() {
				void this.$refs.addTaskButton.handleClick();
			}
		},
		template: `
		<div class="tasks-full-card-footer print-ignore">
			<div class="tasks-full-card-footer-create">
				<div class="tasks-full-card-footer-main-buttons">
					<AddTaskButton
						v-model:hasError="hasError"
						@addTask="$emit('addTask')"
						@copyTask="$emit('copyTask', $event)"
						@fromTemplate="$emit('fromTemplate', $event)"
						ref="addTaskButton"
					/>
					<UiButton
						:text="loc('TASKS_V2_TASK_FULL_CARD_CANCEL')"
						:size="ButtonSize.LARGE"
						:style="AirButtonStyle.PLAIN"
						:dataset="{ taskButtonId: 'cancel' }"
						@click="$emit('close')"
					/>
				</div>
				<TemplatesButton v-if="!isTemplate && isTemplateEnabled"/>
				<TemplatePermissionsButton v-if="isTemplate"/>
			</div>
		</div>
	`
	};

	const ButtonId = Object.freeze({
		Start: 'start',
		Take: 'take',
		Pause: 'pause',
		Complete: 'complete',
		Renew: 'renew',
		Review: 'review',
		Approve: 'approve'
	});

	// @vue/component
	const More = {
		name: 'TaskFullCardMoreActionsStatus',
		components: {
			UiButton: ui_vue3_components_button.Button,
			BMenu: ui_system_menu_vue.BMenu
		},
		inject: {
			task: {},
			taskId: {},
			isTemplate: {},
			settings: {},
			analytics: {}
		},
		props: {
			selectedButtons: {
				type: Array,
				default: () => []
			}
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		data() {
			return {
				isMenuShown: false,
				loading: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				currentUserId: `${tasks_v2_const.Model.Interface}/currentUserId`
			}),
			group() {
				return this.$store.getters[`${tasks_v2_const.Model.Groups}/getById`](this.task.groupId);
			},
			isScrum() {
				return this.group?.type === tasks_v2_const.GroupType.Scrum;
			},
			isCreator() {
				return this.currentUserId === this.task.creatorId;
			},
			isResponsible() {
				return this.task.responsibleIds.includes(this.currentUserId) || this.task.accomplicesIds?.includes(this.currentUserId);
			},
			menuOptions() {
				return () => ({
					id: 'tasks-full-card-footer-more-menu',
					bindElement: this.$refs.button,
					items: this.menuItems
				});
			},
			menuItems() {
				if (this.isTemplate) {
					return [this.getCreateSubtaskForTemplate(), this.getCopyTemplate(), this.getDeleteTemplate()].filter(item => item !== null);
				}
				const statuses = {
					[tasks_v2_const.TaskStatus.Pending]: [this.getCompleteItem(), this.getDefferItem(), this.getDelegateItem(), this.getDeleteItem(), this.getStartItem()],
					[tasks_v2_const.TaskStatus.InProgress]: [this.getPauseItem(), this.getDefferItem(), this.getDelegateItem(), this.getDeleteItem()],
					[tasks_v2_const.TaskStatus.Deferred]: [this.getDelegateItem(), this.getDeleteItem(), this.getCompleteItem()],
					[tasks_v2_const.TaskStatus.SupposedlyCompleted]: [this.getFixItem(), this.getDelegateItem(), this.getDeleteItem()],
					[tasks_v2_const.TaskStatus.Completed]: [this.getRenewItem(), this.getDeleteItem()]
				};
				const items = statuses[this.task.status] || [];
				return items.filter(item => item !== null);
			},
			selectedButtonIds() {
				return new Set(this.selectedButtons.map(button => button?.id));
			},
			isDelegateLocked() {
				return !this.settings.restrictions.delegating.available;
			}
		},
		methods: {
			handleClick() {
				this.isMenuShown = true;
			},
			getStartItem() {
				if (!this.task.rights.start) {
					return null;
				}
				if (this.selectedButtonIds.has(ButtonId.Start) || this.selectedButtonIds.has(ButtonId.Take)) {
					return null;
				}
				return {
					title: this.loc('TASKS_V2_TASK_FULL_CARD_START'),
					icon: ui_iconSet_api_vue.Outline.PLAY_L,
					onClick: () => this.waitStatus(tasks_v2_provider_service_statusService.statusService.start(this.taskId))
				};
			},
			getDefferItem() {
				if (!this.task.rights.defer) {
					return null;
				}
				return {
					title: this.loc('TASKS_V2_TASK_FULL_CARD_DEFER'),
					icon: ui_iconSet_api_vue.Outline.PAUSE_L,
					onClick: () => this.waitStatus(tasks_v2_provider_service_statusService.statusService.defer(this.taskId))
				};
			},
			getPauseItem() {
				if (!this.task.rights.pause) {
					return null;
				}
				if (this.selectedButtonIds.has(ButtonId.Pause)) {
					return null;
				}
				return {
					title: this.loc('TASKS_V2_TASK_FULL_CARD_PAUSE'),
					icon: ui_iconSet_api_vue.Outline.HOURGLASS,
					onClick: () => this.waitStatus(tasks_v2_provider_service_statusService.statusService.pause(this.taskId))
				};
			},
			getRenewItem() {
				if (!this.task.rights.renew) {
					return null;
				}
				if (this.selectedButtonIds.has(ButtonId.Renew)) {
					return null;
				}
				return {
					title: this.loc('TASKS_V2_TASK_FULL_CARD_RENEW'),
					icon: ui_iconSet_api_vue.Outline.UNDO,
					onClick: () => this.waitStatus(tasks_v2_provider_service_statusService.statusService.renew(this.taskId))
				};
			},
			getFixItem() {
				if (!this.task.rights.renew && !this.task.rights.disapprove) {
					return null;
				}
				const title = this.isCreator && !this.isResponsible ? this.loc('TASKS_V2_TASK_FULL_CARD_DISAPPROVE') : this.loc('TASKS_V2_TASK_FULL_CARD_FIX');
				const onClick = this.task.rights.renew ? () => this.waitStatus(tasks_v2_provider_service_statusService.statusService.renew(this.taskId)) : () => this.waitStatus(tasks_v2_provider_service_statusService.statusService.disapprove(this.taskId));
				return {
					title,
					onClick,
					icon: ui_iconSet_api_vue.Outline.UNDO
				};
			},
			getCompleteItem() {
				if (!this.task.rights.complete) {
					return null;
				}
				if (this.selectedButtonIds.has(ButtonId.Complete)) {
					return null;
				}
				return {
					title: this.loc('TASKS_V2_TASK_FULL_CARD_COMPLETE'),
					icon: ui_iconSet_api_vue.Outline.SENDED,
					onClick: () => this.waitStatus(tasks_v2_provider_service_statusService.statusService.complete(this.taskId, {
						context: this.analytics?.context ?? tasks_v2_const.Analytics.Section.Tasks,
						additionalContext: tasks_v2_const.Analytics.SubSection.TaskCard,
						element: tasks_v2_const.Analytics.Element.ContextMenu
					}))
				};
			},
			getDelegateItem() {
				if (!this.task.rights.delegate) {
					return null;
				}
				return {
					icon: ui_iconSet_api_vue.Outline.DELEGATE,
					title: this.loc('TASKS_V2_TASK_FULL_CARD_DELEGATE'),
					isLocked: this.isDelegateLocked,
					onClick: () => this.handleDelegateSelect()
				};
			},
			handleClose(responsibleIds) {
				if (responsibleIds.length === 1) {
					void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
						responsibleIds
					});
				}
			},
			async handleDelegateSelect() {
				if (this.isDelegateLocked) {
					void tasks_v2_lib_showLimit.showLimit({
						featureId: this.settings.restrictions.delegating.featureId
					});
					return;
				}
				void tasks_v2_lib_userSelectorDialog.usersDialog.show({
					targetNode: this.$refs.button,
					ids: this.task.responsibleIds,
					isMultiple: false,
					onClose: this.handleClose
				});
			},
			getDeleteItem() {
				if (!this.task.rights.remove) {
					return null;
				}
				return {
					design: ui_system_menu_vue.MenuItemDesign.Alert,
					title: this.loc('TASKS_V2_TASK_FULL_CARD_DELETE'),
					icon: ui_iconSet_api_vue.Outline.TRASHCAN,
					onClick: () => {
						void tasks_v2_provider_service_taskService.taskService.delete(this.taskId, {
							context: this.analytics?.context ?? tasks_v2_const.Analytics.Section.Tasks,
							additionalContext: tasks_v2_const.Analytics.SubSection.TaskCard,
							element: tasks_v2_const.Analytics.Element.ContextMenu
						});
						main_core_events.EventEmitter.emit(tasks_v2_const.EventName.CloseFullCard, {
							taskId: this.taskId
						});
					}
				};
			},
			async waitStatus(statusPromise) {
				this.loading = true;
				await statusPromise;
				this.loading = false;
			},
			getCreateSubtaskForTemplate() {
				if (!this.settings.rights.templates.create) {
					return null;
				}
				const isLocked = !this.settings.restrictions.templatesSubtasks.available;
				return {
					isLocked,
					title: this.loc('TASKS_V2_TASK_TEMPLATE_CREATE_SUBTASK'),
					icon: ui_iconSet_api_vue.Outline.RELATED_TASKS,
					onClick: () => {
						if (isLocked) {
							void tasks_v2_lib_showLimit.showLimit({
								featureId: this.settings.restrictions.templatesSubtasks.featureId
							});
							return;
						}
						tasks_v2_application_taskCard.TaskCard.showCompactCard({
							taskId: 'template0',
							groupId: this.task.groupId,
							parentId: this.taskId
						});
					}
				};
			},
			getCopyTemplate() {
				if (!this.settings.rights.templates.create) {
					return null;
				}
				return {
					title: this.loc('TASKS_V2_TASK_TEMPLATE_COPY'),
					icon: ui_iconSet_api_vue.Outline.COPY,
					onClick: () => tasks_v2_application_taskCard.TaskCard.showFullCard({
						taskId: 'template0',
						copiedFromId: tasks_v2_lib_idUtils.idUtils.unbox(this.taskId)
					})
				};
			},
			getDeleteTemplate() {
				if (!this.task.rights.remove) {
					return null;
				}
				return {
					design: ui_system_menu_vue.MenuItemDesign.Alert,
					title: this.loc('TASKS_V2_TASK_TEMPLATE_DELETE'),
					icon: ui_iconSet_api_vue.Outline.TRASHCAN,
					onClick: async () => {
						await tasks_v2_provider_service_templateService.templateService.delete(this.taskId);
						main_core_events.EventEmitter.emit(tasks_v2_const.EventName.CloseFullCard, {
							taskId: this.taskId
						});
					}
				};
			}
		},
		template: `
		<div ref="button">
			<UiButton
				v-if="menuItems.length > 0"
				:size="ButtonSize.LARGE"
				:style="AirButtonStyle.PLAIN"
				:leftIcon="Outline.MORE_L"
				:loading
				:dataset="{ taskButtonId: 'more' }"
				ref="button"
				@click="handleClick"
			/>
		</div>
		<BMenu v-if="isMenuShown" :options="menuOptions()" @close="isMenuShown = false"/>
	`
	};

	// @vue/component
	const FooterEdit = {
		components: {
			Hint: tasks_v2_component_elements_hint.Hint,
			UiButton: ui_vue3_components_button.Button,
			BIcon: ui_iconSet_api_vue.BIcon,
			More,
			TextMd: ui_system_typography_vue.TextMd,
			TextXs: ui_system_typography_vue.TextXs,
			MarkTaskButton: tasks_v2_component_markTaskButton.MarkTaskButton,
			TasksUserActionsDemonstrator: tasks_v2_component_tasksUserActionsDemonstrator.TasksUserActionsDemonstrator,
			HoverPill: tasks_v2_component_elements_hoverPill.HoverPill,
			TemplatePermissionsButton: ui_vue3.BitrixVue.defineAsyncComponent('tasks.v2.component.template-permissions-button', 'TemplatePermissionsButton', {
				delay: 0,
				loadingComponent: {
					components: {
						BLine: ui_system_skeleton_vue.BLine
					},
					template: '<BLine :width="131" :height="22"/>'
				}
			})
		},
		inject: {
			task: {},
			taskId: {},
			isTemplate: {},
			settings: {},
			analytics: {}
		},
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				ButtonIcon: ui_vue3_components_button.ButtonIcon,
				Outline: ui_iconSet_api_vue.Outline,
				TaskStatus: tasks_v2_const.TaskStatus,
				markRaw: ui_vue3.markRaw
			};
		},
		data() {
			return {
				isLoadingActions: false,
				showStartTimeTrackingHint: false,
				computedSecondaryButton: null
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				currentUserId: `${tasks_v2_const.Model.Interface}/currentUserId`
			}),
			timer() {
				return this.task.timers?.find(timer => timer.userId === this.currentUserId);
			},
			group() {
				return this.$store.getters[`${tasks_v2_const.Model.Groups}/getById`](this.task.groupId);
			},
			isScrum() {
				return this.group?.type === tasks_v2_const.GroupType.Scrum;
			},
			isCreator() {
				return this.currentUserId === this.task.creatorId;
			},
			primaryButton() {
				const inProgress = this.task.rights.timeTracking ? [this.getStartTimerButton(), this.getPauseButton(ui_vue3_components_button.AirButtonStyle.OUTLINE)] : [this.getCompleteButton()];
				const statuses = {
					[tasks_v2_const.TaskStatus.Pending]: [this.getTakeButton(), this.getStartTimerButton(), this.getPauseButton(ui_vue3_components_button.AirButtonStyle.OUTLINE), this.getStartButton(), this.getCompleteButton()],
					[tasks_v2_const.TaskStatus.InProgress]: inProgress,
					[tasks_v2_const.TaskStatus.Deferred]: this.getRenewButton(),
					[tasks_v2_const.TaskStatus.SupposedlyCompleted]: [this.getApproveButton(), this.getReviewButton()],
					[tasks_v2_const.TaskStatus.Completed]: this.getRenewButton(ui_vue3_components_button.AirButtonStyle.PLAIN)
				};
				if (main_core.Type.isArray(statuses[this.task.status])) {
					return statuses[this.task.status].find(item => item !== null);
				}
				return statuses[this.task.status] || null;
			},
			secondaryButton() {
				return this.computedSecondaryButton;
			},
			selectedButtons() {
				return [this.primaryButton, this.secondaryButton];
			},
			isLoadingViewersCount() {
				return Boolean(this.task.viewers?.isLoadingCount);
			},
			isLoadingViewersList() {
				return Boolean(this.task.viewers?.isLoadingList);
			},
			taskViewersCount() {
				return this.task.viewers?.count;
			},
			taskViewersList() {
				return this.task.viewers?.list;
			},
			optionsViewersDemonstrator() {
				return {
					isLoadingCount: this.isLoadingViewersCount,
					isLoadingList: this.isLoadingViewersList,
					isOpenedOnClick: true,
					isOpenedOnHover: false,
					isDateInline: true,
					componentOpener: ui_vue3.markRaw(tasks_v2_component_elements_hoverPill.HoverPill),
					textHead: this.loc('TASKS_V2_TASK_FULL_CARD_VIEWS'),
					userActionsCount: this.taskViewersCount,
					userActionsList: this.taskViewersList,
					positioning: {
						offsetVertical: 11
					}
				};
			},
			shouldShowStartTimeTrackingHint() {
				return this.showStartTimeTrackingHint && this.primaryButton?.id === ButtonId.Start;
			},
			shouldShowMoreButton() {
				return this.task.rights.remove || this.task.rights.defer || this.task.rights.delegate;
			},
			shouldShowMarkTaskButton() {
				return this.task.rights.mark || this.task.mark !== tasks_v2_const.Mark.None;
			},
			showFooter() {
				if (this.isTemplate) {
					return this.settings.rights.tasks.createFromTemplate || this.task.rights.edit;
				}
				return true;
			}
		},
		watch: {
			primaryButton: {
				handler: 'updateSecondaryButton',
				immediate: true
			},
			'task.status': {
				handler: 'updateSecondaryButton'
			}
		},
		mounted() {
			this.$bitrix.eventEmitter.subscribe(tasks_v2_const.EventName.TimeTrackingChange, this.handleTimeTrackingActivating);
		},
		methods: {
			async updateSecondaryButton() {
				await this.$nextTick();
				const inProgress = this.task.rights.timeTracking ? this.getCompleteButton(this.timer ? null : ui_vue3_components_button.AirButtonStyle.OUTLINE) : null;
				const statuses = {
					[tasks_v2_const.TaskStatus.Pending]: this.getCompleteButton(ui_vue3_components_button.AirButtonStyle.OUTLINE),
					[tasks_v2_const.TaskStatus.InProgress]: inProgress
				};
				let secondary = statuses[this.task.status] || null;
				if (secondary && this.primaryButton && secondary.id === this.primaryButton.id) {
					secondary = null;
				}
				this.computedSecondaryButton = secondary;
			},
			hideStartTimeTrackingHint() {
				this.showStartTimeTrackingHint = false;
			},
			hidePermanentStartTimeTrackingHint() {
				this.hideStartTimeTrackingHint();
				tasks_v2_lib_ahaMoments.ahaMoments.setInactive(tasks_v2_const.Option.AhaStartTimeTracking);
				tasks_v2_lib_ahaMoments.ahaMoments.setShown(tasks_v2_const.Option.AhaStartTimeTracking);
			},
			async waitStatus(statusPromise) {
				this.isLoadingActions = true;
				await statusPromise;
				this.isLoadingActions = false;
			},
			createTaskFromTemplate() {
				tasks_v2_application_taskCard.TaskCard.showFullCard({
					templateId: tasks_v2_lib_idUtils.idUtils.unbox(this.taskId),
					analytics: {
						context: tasks_v2_const.Analytics.Section.Templates,
						additionalContext: tasks_v2_const.Analytics.SubSection.TemplatesCard,
						element: tasks_v2_const.Analytics.Element.CreateButton
					}
				});
			},
			async updateViewersCount() {
				await tasks_v2_provider_service_viewersService.viewersService.count(this.taskId);
			},
			annihilateViewersList() {
				const viewers = this.task.viewers || {};
				tasks_v2_provider_service_taskService.taskService.updateStoreTask(this.taskId, {
					viewers: {
						...viewers,
						list: []
					}
				});
			},
			async updateViewersList() {
				const stepQuantityViewers = 10;
				const quantityViewersCurrent = this.task.viewers?.list?.length || 0;
				const quantityStepNumberCurrent = Math.floor(quantityViewersCurrent / stepQuantityViewers);
				const quantityStepNumberToLoad = quantityStepNumberCurrent + 1;
				const paramsRequestGetViewers = {
					id: this.taskId,
					page: quantityStepNumberToLoad,
					size: stepQuantityViewers
				};
				await tasks_v2_provider_service_viewersService.viewersService.list(paramsRequestGetViewers);
			},
			refreshViewers() {
				this.annihilateViewersList();
				this.updateViewersCount();
			},
			handleOverPrimaryButton() {
				if (this.task.rights.timeTracking && this.primaryButton?.id === ButtonId.Start && tasks_v2_lib_ahaMoments.ahaMoments.shouldShow(tasks_v2_const.Option.AhaStartTimeTracking)) {
					tasks_v2_lib_ahaMoments.ahaMoments.setActive(tasks_v2_const.Option.AhaStartTimeTracking);
					this.showStartTimeTrackingHint = true;
				}
			},
			handleTimeTrackingActivating() {
				void this.waitStatus(new Promise(resolve => {
					const unwatch = this.$watch(() => this.task.rights.timeTracking, async () => {
						await this.$nextTick();
						resolve();
					}, {
						immediate: false
					});
					setTimeout(() => {
						unwatch();
						resolve();
					}, 5000);
				}));
			},
			handleOpenViewersDemonstrator() {
				this.refreshViewers();
			},
			handleDemandViewers() {
				this.updateViewersList();
			},
			getStartButton() {
				if (!this.task.rights.start || this.timer) {
					return null;
				}
				return {
					id: ButtonId.Start,
					text: this.loc('TASKS_V2_TASK_FULL_CARD_START'),
					onClick: () => this.waitStatus(tasks_v2_provider_service_statusService.statusService.start(this.taskId))
				};
			},
			getTakeButton() {
				if (!this.task.rights.take || this.task.status !== tasks_v2_const.TaskStatus.Pending) {
					return null;
				}
				return {
					id: ButtonId.Take,
					text: this.loc('TASKS_V2_TASK_FULL_CARD_TAKE'),
					onClick: () => this.waitStatus(tasks_v2_provider_service_statusService.statusService.take(this.taskId, {
						context: this.analytics?.context ?? tasks_v2_const.Analytics.Section.Tasks
					}))
				};
			},
			getStartTimerButton() {
				if (!this.task.rights.timeTracking || this.timer) {
					return null;
				}
				return {
					id: ButtonId.Start,
					text: this.loc('TASKS_V2_TASK_FULL_CARD_START'),
					icon: ui_vue3_components_button.ButtonIcon.START,
					onClick: () => this.waitStatus(tasks_v2_provider_service_statusService.statusService.startTimer(this.taskId, {
						context: this.analytics?.context ?? tasks_v2_const.Analytics.Section.Tasks
					}))
				};
			},
			getCompleteButton(style) {
				if (!this.task.rights.complete) {
					return null;
				}
				return {
					id: ButtonId.Complete,
					text: this.loc('TASKS_V2_TASK_FULL_CARD_COMPLETE'),
					style,
					onClick: () => this.waitStatus(tasks_v2_provider_service_statusService.statusService.complete(this.taskId, {
						context: this.analytics?.context ?? tasks_v2_const.Analytics.Section.Tasks,
						additionalContext: tasks_v2_const.Analytics.SubSection.TaskCard,
						element: tasks_v2_const.Analytics.Element.CompleteButton
					}))
				};
			},
			getPauseButton(style) {
				if (!this.task.rights.timeTracking || !this.timer) {
					return null;
				}
				return {
					id: ButtonId.Pause,
					text: this.loc('TASKS_V2_TASK_FULL_CARD_PAUSE_TIMER'),
					style,
					onClick: () => this.waitStatus(tasks_v2_provider_service_statusService.statusService.pauseTimer(this.taskId))
				};
			},
			getRenewButton(style) {
				if (!this.task.rights.renew) {
					return null;
				}
				return {
					id: ButtonId.Renew,
					text: this.loc('TASKS_V2_TASK_FULL_CARD_RENEW'),
					style,
					onClick: () => this.waitStatus(tasks_v2_provider_service_statusService.statusService.renew(this.taskId))
				};
			},
			getReviewButton() {
				return {
					id: ButtonId.Review,
					text: this.loc('TASKS_V2_TASK_FULL_CARD_ON_REVIEW_MSGVER_1'),
					disabled: true
				};
			},
			getApproveButton() {
				if (!this.task.rights.approve) {
					return null;
				}
				return {
					id: ButtonId.Approve,
					text: this.loc('TASKS_V2_TASK_FULL_CARD_APPROVE'),
					onClick: () => this.waitStatus(tasks_v2_provider_service_statusService.statusService.approve(this.taskId))
				};
			}
		},
		template: `
		<div v-if="showFooter" class="tasks-full-card-footer print-ignore">
			<div class="tasks-full-card-footer-edit">
				<UiButton
					v-if="isTemplate && settings.rights.tasks.createFromTemplate"
					:text="loc('TASKS_V2_TASK_TEMPLATE_CREATE_TASK')"
					:size="ButtonSize.LARGE"
					:dataset="{ taskButtonId: 'createFromTemplate' }"
					:leftIcon="Outline.PLUS_L"
					@click="createTaskFromTemplate"
				/>
				<template v-if="!isTemplate">
					<div
						v-if="primaryButton"
						ref="primaryButton"
						@mouseover="handleOverPrimaryButton"
					>
						<UiButton
							:text="primaryButton.text"
							:size="ButtonSize.LARGE"
							:style="primaryButton.style ?? AirButtonStyle.FILLED"
							:disabled="Boolean(primaryButton.disabled)"
							:loading="isLoadingActions"
							:leftIcon="primaryButton.icon"
							:dataset="{ taskButtonId: 'status' }"
							@click="primaryButton.onClick"
						/>
					</div>
					<UiButton
						v-if="secondaryButton && !isLoadingActions"
						:text="secondaryButton.text"
						:size="ButtonSize.LARGE"
						:style="secondaryButton.style ?? AirButtonStyle.FILLED"
						:disabled="secondaryButton.disabled ?? false"
						:dataset="{ taskButtonId: 'secondary' }"
						@click="secondaryButton.onClick"
					/>
				</template>
				<More :selectedButtons/>
				<div class="tasks-full-card-footer-edit-grow"/>
				<MarkTaskButton v-if="!isTemplate && shouldShowMarkTaskButton"/>
				<TemplatePermissionsButton v-if="isTemplate && task.rights.edit"/>
				<TasksUserActionsDemonstrator
					v-if="!isTemplate"
					:options="optionsViewersDemonstrator"
					@open="handleOpenViewersDemonstrator"
					@demandUserActions="handleDemandViewers"
				/>
			</div>
			<Hint
				v-if="shouldShowStartTimeTrackingHint"
				:bindElement="$refs.primaryButton"
				:options="{
					closeIcon: true,
					offsetLeft: 24,
					minWidth: 344,
					maxWidth: 344,
				}"
				@close="hideStartTimeTrackingHint"
			>
				<div class="tasks-full-card-start-time-tracking-hint">
					<TextMd class="tasks-full-card-start-time-tracking-hint-info-text">
						{{ loc('TASKS_V2_TASK_FULL_CARD_AHA_START_TIME_TRACKING_HINT_TEXT') }}
					</TextMd>
					<TextXs
						class="tasks-full-card-start-time-tracking-hint-info-link"
						@click.stop="hidePermanentStartTimeTrackingHint"
					>
						{{ loc('TASKS_V2_TASK_FULL_CARD_AHA_START_TIME_TRACKING_HINT_MORE') }}
					</TextXs>
				</div>
			</Hint>
		</div>
	`
	};

	// @vue/component
	const Placeholder = {
		components: {
			UiButton: ui_vue3_components_button.Button,
			HeadlineMd: ui_system_typography_vue.HeadlineMd,
			TextLg: ui_system_typography_vue.TextLg
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		props: {
			imgSrc: {
				type: String,
				default: ''
			},
			head: {
				type: String,
				default: ''
			},
			description: {
				type: String,
				default: ''
			},
			action: {
				type: Object,
				default: null
			}
		},
		setup() {
			return {
				ButtonSize: ui_vue3_components_button.ButtonSize,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle
			};
		},
		data() {
			return {};
		},
		computed: {
			tooltip() {
				if (!this.action?.hint) {
					return null;
				}
				return () => tasks_v2_component_elements_hint.tooltip({
					text: this.action.hint,
					popupOptions: {
						bindElement: this.$refs.actionContainer,
						offsetLeft: this.$refs.actionContainer.offsetWidth / 2,
						maxWidth: 300
					}
				});
			}
		},
		methods: {},
		template: `
		<div class="tasks-full-card-placeholder">
			<div class="tasks-full-card-placeholder__content">
				<div v-if="imgSrc" class="tasks-full-card-placeholder__img-container">
					<img :src="imgSrc" alt="noAccess" class="tasks-full-card-placeholder__img"/>
				</div>
				<HeadlineMd v-if="head" class="tasks-full-card-placeholder__head">{{ head }}</HeadlineMd>
				<TextLg v-if="description" class="tasks-full-card-placeholder__descr">{{ description }}</TextLg>
				<div v-if="action" v-hint="tooltip" class="tasks-full-card-placeholder__action-container" ref="actionContainer">
					<UiButton
						class="tasks-full-card-placeholder__action"
						:text="action.text"
						:size="ButtonSize.MEDIUM"
						:style="AirButtonStyle.FILLED"
						:disabled="action.disabled"
						:loading="action.isLoading"
						@click="action.click"
					/>
				</div>
			</div>
		</div>
	`
	};

	var iconUrl = "/bitrix/js/tasks/v2/application/task-full-card/dist/assets/marshmallow_sad_pink_with_orange_lock.png";

	var notFoundUrl = "/bitrix/js/tasks/v2/application/task-full-card/dist/assets/marshmallow_confused_pink_with_blue_magnifier.png";

	const UserOptions = main_core.Reflection.namespace('BX.userOptions');

	// @vue/component
	const App = {
		name: 'TaskFullCard',
		components: {
			TaskHeader,
			DescriptionField: tasks_v2_component_fields_description.DescriptionField,
			Files: tasks_v2_component_fields_files.Files,
			CheckList: tasks_v2_component_fields_checkList.CheckList,
			DatePlan: tasks_v2_component_fields_datePlan.DatePlan,
			SubTasks: tasks_v2_component_fields_subTasks.SubTasks,
			ParentTask: tasks_v2_component_fields_parentTask.ParentTask,
			RelatedTasks: tasks_v2_component_fields_relatedTasks.RelatedTasks,
			Gantt: tasks_v2_component_fields_gantt.Gantt,
			Results: tasks_v2_component_fields_results.Results,
			Placements: tasks_v2_component_fields_placements.Placements,
			Reminders: tasks_v2_component_fields_reminders.Reminders,
			Replication: tasks_v2_component_fields_replication.Replication,
			FieldList: tasks_v2_component_elements_fieldList.FieldList,
			Chat,
			FooterCreate,
			FooterEdit,
			Placeholder,
			DropZone: tasks_v2_component_dropZone.DropZone,
			Chips,
			ContentResizer: tasks_v2_component_elements_contentResizer.ContentResizer,
			TaskSettingsHint,
			Email: tasks_v2_component_fields_email.Email,
			EmailFrom: tasks_v2_component_fields_email.EmailFrom,
			EmailDate: tasks_v2_component_fields_email.EmailDate,
			UserFields: tasks_v2_component_fields_userFields.UserFields,
			CreatedDate: tasks_v2_component_fields_createdDate.CreatedDate
		},
		provide() {
			return {
				settings: tasks_v2_core.Core.getParams(),
				analytics: this.analytics,
				embedded: this.embedded,
				onCloseEmbedded: this.onCloseEmbedded,
				cardType: tasks_v2_const.CardType.Full,
				/** @type { TaskModel } */
				task: ui_vue3.computed(() => tasks_v2_provider_service_taskService.taskService.getStoreTask(this.taskId)),
				/** @type { number | string } */
				taskId: ui_vue3.computed(() => this.taskId),
				/** @type { boolean } */
				isEdit: ui_vue3.computed(() => tasks_v2_lib_idUtils.idUtils.isReal(this.taskId)),
				/** @type { boolean } */
				isTemplate: ui_vue3.computed(() => tasks_v2_lib_idUtils.idUtils.isTemplate(this.taskId))
			};
		},
		props: {
			id: {
				type: [Number, String],
				required: true
			},
			initialTask: {
				/** @type TaskModel */
				type: Object,
				required: true
			},
			analytics: {
				type: Object,
				default: () => ({})
			},
			embedded: {
				type: Boolean,
				default: false
			},
			onCloseEmbedded: {
				type: Function,
				default: null
			}
		},
		setup() {
			return {
				EntityTextTypes: tasks_v2_component_entityText.EntityTextTypes,
				EntityTypes: tasks_v2_provider_service_fileService.EntityTypes,
				TaskField: tasks_v2_const.TaskField
			};
		},
		data() {
			return {
				taskId: this.id,
				isFilesSheetShown: false,
				isDescriptionSheetShown: false,
				isCheckListSheetShown: false,
				isDatePlanSheetShown: false,
				isTimeTrackingSheetShown: false,
				isTimeTrackingChipSheetShown: false,
				isResultListSheetShown: false,
				isResultEditorSheetShown: false,
				isResultChipSheetShown: false,
				isReminderSheetShown: false,
				isRemindersSheetShown: false,
				isReplicationSheetShown: false,
				isReplicationHistorySheetShown: false,
				isPrimaryFieldsHovered: false,
				isSettingsPopupShown: false,
				isTaskSettingsHintShown: false,
				checkListId: 0,
				files: tasks_v2_provider_service_fileService.fileService.get(this.id).getFiles(),
				isLoading: true,
				creationError: false,
				taskInitial: null,
				placeholderImgUrl: null,
				taskGetError: null,
				isAccessRequested: true,
				accessRequestError: null,
				popupCount: 0
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				deadlineUserOption: `${tasks_v2_const.Model.Interface}/deadlineUserOption`,
				defaultDeadlineTs: `${tasks_v2_const.Model.Interface}/defaultDeadlineTs`,
				fullCardWidth: `${tasks_v2_const.Model.Interface}/fullCardWidth`,
				stateFlags: `${tasks_v2_const.Model.Interface}/stateFlags`,
				templateStateFlags: `${tasks_v2_const.Model.Interface}/templateStateFlags`,
				taskUserFieldScheme: `${tasks_v2_const.Model.Interface}/taskUserFieldScheme`,
				templateUserFieldScheme: `${tasks_v2_const.Model.Interface}/templateUserFieldScheme`,
				currentUserId: `${tasks_v2_const.Model.Interface}/currentUserId`
			}),
			task() {
				return tasks_v2_provider_service_taskService.taskService.getStoreTask(this.taskId);
			},
			group() {
				return this.$store.getters[`${tasks_v2_const.Model.Groups}/getById`](this.task.groupId);
			},
			timer() {
				return this.task.timers?.find(timer => timer.userId === this.currentUserId);
			},
			checklist() {
				if (!this.task.checklist) {
					return [];
				}
				return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](this.task.checklist);
			},
			isEdit() {
				return tasks_v2_lib_idUtils.idUtils.isReal(this.taskId);
			},
			isTemplate() {
				return tasks_v2_lib_idUtils.idUtils.isTemplate(this.taskId);
			},
			isCreator() {
				return this.currentUserId === this.task.creatorId;
			},
			isAdmin() {
				return tasks_v2_core.Core.getParams().rights.user.admin;
			},
			isFlowFilledOnAdd() {
				return this.task.flowId > 0 && !this.isEdit;
			},
			hasManyResponsibleUsers() {
				return !this.task.isForNewUser && this.task.responsibleIds.length > 1;
			},
			canChangeDeadline() {
				if (!this.isEdit) {
					return true;
				}
				return this.task.rights.deadline && !this.isFlowFilledOnAdd;
			},
			canChangeDeadlineWithoutLimitation() {
				return !this.isEdit || this.isCreator || this.task.rights.edit || this.isAdmin;
			},
			isPartiallyLoaded() {
				return this.$store.getters[`${tasks_v2_const.Model.Tasks}/isPartiallyLoaded`](this.taskId);
			},
			userFieldScheme() {
				return this.isTemplate ? this.templateUserFieldScheme : this.taskUserFieldScheme;
			},
			defaultRequireResult() {
				if (this.isTemplate) {
					return this.templateStateFlags.defaultRequireResult ?? false;
				}
				return this.stateFlags.defaultRequireResult ?? false;
			},
			// eslint-disable-next-line max-lines-per-function,sonarjs/cognitive-complexity
			fields() {
				return [{
					title: tasks_v2_component_fields_creator.creatorMeta.title,
					component: tasks_v2_component_fields_creator.Creator
				}, {
					title: tasks_v2_component_fields_responsible.responsibleMeta.getTitle(this.hasManyResponsibleUsers),
					hint: this.hasManyResponsibleUsers ? tasks_v2_component_fields_responsible.responsibleMeta.hint : null,
					component: tasks_v2_component_fields_responsible.Responsible,
					props: {
						taskId: this.taskId
					}
				}, {
					title: tasks_v2_component_fields_deadline.deadlineMeta.title,
					component: tasks_v2_component_fields_deadline.Deadline,
					props: {
						taskId: this.taskId,
						isTemplate: this.isTemplate,
						isHovered: this.isTaskSettingsHintShown
					},
					events: {
						isSettingsPopupShown: value => {
							this.isSettingsPopupShown = value;
						}
					}
				}, {
					title: tasks_v2_component_fields_timeTracking.timeTrackingMeta.title,
					component: tasks_v2_component_fields_timeTracking.TimeTracking,
					props: {
						isSheetShown: this.isTimeTrackingSheetShown,
						sheetBindProps: this.sheetBindProps
					},
					events: {
						'update:isSheetShown': isShown => {
							this.isTimeTrackingSheetShown = isShown;
						}
					}
				}, !this.isTemplate && {
					title: tasks_v2_component_fields_status.statusMeta.title,
					component: tasks_v2_component_fields_status.Status,
					withSeparator: true
				}, !this.isTemplate && {
					title: tasks_v2_component_fields_createdDate.createdDateMeta.title,
					component: tasks_v2_component_fields_createdDate.CreatedDate
				}, {
					title: tasks_v2_component_fields_email.emailMeta.title,
					component: tasks_v2_component_fields_email.Email,
					printIgnore: !this.task.email,
					chip: {
						component: tasks_v2_component_fields_email.EmailChip,
						isEnabled: this.wasFilled(tasks_v2_const.TaskField.Email)
					}
				}, {
					title: tasks_v2_component_fields_email.emailMeta.fromTitle,
					component: tasks_v2_component_fields_email.EmailFrom,
					withSeparator: true,
					printIgnore: !this.task.email
				}, {
					title: tasks_v2_component_fields_email.emailMeta.dateTitle,
					component: tasks_v2_component_fields_email.EmailDate,
					printIgnore: !this.task.email
				}, {
					chip: {
						component: tasks_v2_component_fields_results.ResultsChip,
						props: {
							isSheetShown: this.isResultChipSheetShown,
							sheetBindProps: this.sheetBindProps
						},
						events: {
							'update:isSheetShown': isShown => {
								this.isResultChipSheetShown = isShown;
							}
						}
					}
				}, tasks_v2_core.Core.getParams().features.disk && {
					chip: {
						component: tasks_v2_component_fields_files.FilesChip,
						props: {
							taskId: this.taskId
						},
						isEnabled: this.wasFilled(tasks_v2_const.TaskField.Files) || this.files.length > 0 || this.task.rights.attachFile || this.task.rights.edit
					}
				}, {
					chip: {
						component: ui_vue3.BitrixVue.defineAsyncComponent('tasks.v2.component.fields.comment-files', 'CommentFilesChip', {
							delay: 0,
							loadingComponent: {
								components: {
									BLine: ui_system_skeleton_vue.BLine
								},
								template: '<BLine :width="212" :height="32"/>'
							}
						}),
						isEnabled: this.task.containsCommentFiles === true
					}
				}, {
					chip: {
						component: tasks_v2_component_fields_checkList.CheckListChip,
						events: {
							showCheckList: this.openCheckList
						},
						isEnabled: this.task.rights.checklistSave
					}
				}, tasks_v2_core.Core.getParams().features.isProjectsEnabled && {
					title: tasks_v2_component_fields_group.groupMeta.getTitle(this.task.groupId),
					component: tasks_v2_component_fields_group.Group,
					chip: {
						component: tasks_v2_component_fields_group.GroupChip,
						isEnabled: this.wasFilled(tasks_v2_const.TaskField.Group) || this.task.rights.edit
					},
					printIgnore: !this.task.groupId
				}, {
					title: tasks_v2_component_fields_accomplices.accomplicesMeta.title,
					component: tasks_v2_component_fields_accomplices.Accomplices,
					chip: {
						component: tasks_v2_component_fields_accomplices.AccomplicesChip,
						isEnabled: this.wasFilled(tasks_v2_const.TaskField.Accomplices) || this.task.rights.changeAccomplices
					},
					printIgnore: !this.task.accomplicesIds || this.task.accomplicesIds.length === 0
				}, {
					title: tasks_v2_component_fields_auditors.auditorsMeta.title,
					component: tasks_v2_component_fields_auditors.Auditors,
					chip: {
						component: tasks_v2_component_fields_auditors.AuditorsChip,
						isEnabled: this.wasFilled(tasks_v2_const.TaskField.Auditors) || this.task.rights.addAuditors
					},
					withSeparator: this.wasFilled(tasks_v2_const.TaskField.Accomplices),
					printIgnore: !this.task.auditorsIds || this.task.auditorsIds.length === 0
				}, !this.isTemplate && {
					chip: {
						component: tasks_v2_component_fields_placements.PlacementsChip,
						isEnabled: this.isEdit && this.wasFilled(tasks_v2_const.TaskField.Placements)
					}
				}, !this.isTemplate && tasks_v2_core.Core.getParams().features.isFlowEnabled && {
					title: tasks_v2_component_fields_flow.flowMeta.title,
					component: tasks_v2_component_fields_flow.Flow,
					chip: {
						component: tasks_v2_component_fields_flow.FlowChip,
						isEnabled: this.wasFilled(tasks_v2_const.TaskField.Flow) || this.task.rights.edit
					},
					withSeparator: true,
					printIgnore: !this.task.flowId
				}, tasks_v2_core.Core.getParams().features.isProjectsEnabled && {
					title: tasks_v2_component_fields_group.groupMeta.stageTitle,
					component: tasks_v2_component_fields_group.Stage
				}, tasks_v2_core.Core.getParams().features.isProjectsEnabled && {
					title: tasks_v2_component_fields_group.groupMeta.epicTitle,
					component: tasks_v2_component_fields_group.Epic
				}, tasks_v2_core.Core.getParams().features.isProjectsEnabled && {
					title: tasks_v2_component_fields_group.groupMeta.storyPointsTitle,
					component: tasks_v2_component_fields_group.StoryPoints
				}, {
					title: tasks_v2_component_fields_tags.tagsMeta.title,
					component: tasks_v2_component_fields_tags.Tags,
					chip: {
						component: tasks_v2_component_fields_tags.TagsChip,
						isEnabled: this.wasFilled(tasks_v2_const.TaskField.Tags) || this.task.rights.edit
					},
					printIgnore: !this.task.tags || this.task.tags.length === 0
				}, !this.isTemplate && {
					chip: {
						component: tasks_v2_component_fields_reminders.RemindersChip,
						props: {
							isSheetShown: this.isReminderSheetShown,
							sheetBindProps: this.sheetBindProps
						},
						events: {
							'update:isSheetShown': isShown => {
								this.isReminderSheetShown = isShown;
							}
						},
						isEnabled: this.wasFilled(tasks_v2_const.TaskField.Reminders) || this.task.rights.reminder
					}
				}, tasks_v2_core.Core.getParams().features.crm && {
					title: tasks_v2_component_fields_crm.crmMeta.title,
					component: tasks_v2_component_fields_crm.Crm,
					chip: {
						component: tasks_v2_component_fields_crm.CrmChip,
						collapsed: true,
						isEnabled: this.wasFilled(tasks_v2_const.TaskField.Crm) || this.task.rights.edit
					},
					withSeparator: this.wasFilled(tasks_v2_const.TaskField.Group) || this.wasFilled(tasks_v2_const.TaskField.Flow),
					printIgnore: !this.task.crmItemIds || this.task.crmItemIds.length === 0
				}, {
					chip: {
						component: tasks_v2_component_fields_parentTask.ParentTaskChip,
						collapsed: true,
						isEnabled: this.wasFilled(tasks_v2_const.TaskField.Parent) || this.task.rights.edit
					},
					printIgnore: !this.task.parentId
				}, {
					chip: {
						component: tasks_v2_component_fields_subTasks.SubTasksChip,
						collapsed: true,
						isEnabled: this.wasFilled(tasks_v2_const.TaskField.SubTasks) || this.task.rights.createSubtask || !this.isEdit
					},
					printIgnore: !this.task.subTaskIds || this.task.subTaskIds.length === 0
				}, {
					chip: {
						component: tasks_v2_component_fields_relatedTasks.RelatedTasksChip,
						collapsed: true,
						isEnabled: this.wasFilled(tasks_v2_const.TaskField.RelatedTasks) || this.task.rights.edit
					},
					printIgnore: !this.task.relatedTaskIds || this.task.relatedTaskIds.length === 0
				}, {
					chip: {
						component: tasks_v2_component_fields_replication.ReplicationChip,
						props: {
							isSheetShown: this.isReplicationSheetShown,
							sheetBindProps: this.sheetBindProps
						},
						isEnabled: this.wasFilled(tasks_v2_const.TaskField.Replication) || this.task.rights.saveAsTemplate || tasks_v2_core.Core.getParams().rights.templates.create,
						events: {
							'update:isSheetShown': isShown => {
								this.isReplicationSheetShown = isShown;
							}
						}
					}
				}, !this.isTemplate && {
					chip: {
						component: tasks_v2_component_fields_gantt.GanttChip,
						collapsed: true,
						isEnabled: this.wasFilled(tasks_v2_const.TaskField.Gantt) || this.task.rights[tasks_v2_component_fields_gantt.ganttMeta.right]
					},
					printIgnore: !this.task.ganttTaskIds || this.task.ganttTaskIds.length === 0
				}, {
					chip: {
						component: tasks_v2_component_fields_datePlan.DatePlanChip,
						collapsed: true,
						isEnabled: this.wasFilled(tasks_v2_const.TaskField.DatePlan) || this.task.rights.edit,
						props: {
							isSheetShown: this.isDatePlanSheetShown,
							sheetBindProps: this.sheetBindProps
						},
						events: {
							'update:isSheetShown': isShown => {
								this.isDatePlanSheetShown = isShown;
							}
						}
					}
				}, {
					chip: {
						component: tasks_v2_component_fields_timeTracking.TimeTrackingChip,
						collapsed: true,
						isEnabled: this.task.rights.edit || this.task.rights.elapsedTime,
						props: {
							isSheetShown: this.isTimeTrackingChipSheetShown,
							sheetBindProps: this.sheetBindProps
						},
						events: {
							'update:isSheetShown': isShown => {
								this.isTimeTrackingChipSheetShown = isShown;
							}
						}
					}
				}, {
					chip: {
						component: tasks_v2_component_fields_userFields.UserFieldsChip,
						collapsed: true,
						isEnabled: this.shouldShowUserFieldsChip,
						events: {
							open: this.openUserFieldsHandler
						}
					}
				}].filter(field => field);
			},
			sheetBindProps() {
				return {
					getBindElement: () => this.$refs.title,
					getTargetContainer: () => this.$refs.main
				};
			},
			primaryFields() {
				return this.getFields(new WeakMap([[tasks_v2_component_fields_creator.Creator, true], [tasks_v2_component_fields_responsible.Responsible, true], [tasks_v2_component_fields_deadline.Deadline, true], [tasks_v2_component_fields_timeTracking.TimeTracking, this.task.allowsTimeTracking || this.task.rights.elapsedTime && this.task.numberOfElapsedTimes], [tasks_v2_component_fields_status.Status, this.isEdit], [tasks_v2_component_fields_createdDate.CreatedDate, this.isEdit]]));
			},
			projectFields() {
				const isScrum = this.group?.type === tasks_v2_const.GroupType.Scrum;
				return this.getFields(new WeakMap([[tasks_v2_component_fields_group.Group, this.wasFilled(tasks_v2_const.TaskField.Group)], [tasks_v2_component_fields_flow.Flow, this.wasFilled(tasks_v2_const.TaskField.Flow)], [tasks_v2_component_fields_group.Stage, !this.isTemplate && this.isEdit && this.group?.id > 0 && (this.task.stageId !== 0 || !isScrum)], [tasks_v2_component_fields_group.Epic, !this.isTemplate && isScrum], [tasks_v2_component_fields_group.StoryPoints, !this.isTemplate && isScrum], [tasks_v2_component_fields_crm.Crm, this.wasFilled(tasks_v2_const.TaskField.Crm)]]));
			},
			participantsFields() {
				return this.getFields(new WeakMap([[tasks_v2_component_fields_accomplices.Accomplices, this.wasFilled(tasks_v2_const.TaskField.Accomplices)], [tasks_v2_component_fields_auditors.Auditors, this.wasFilled(tasks_v2_const.TaskField.Auditors)]]));
			},
			tagsFields() {
				return this.getFields(new WeakMap([[tasks_v2_component_fields_tags.Tags, this.wasFilled(tasks_v2_const.TaskField.Tags)]]));
			},
			emailFields() {
				return this.getFields(new WeakMap([[tasks_v2_component_fields_email.Email, this.wasFilled(tasks_v2_const.TaskField.Email)], [tasks_v2_component_fields_email.EmailFrom, this.wasFilled(tasks_v2_const.TaskField.Email) && this.task.email.from], [tasks_v2_component_fields_email.EmailDate, this.wasFilled(tasks_v2_const.TaskField.Email) && this.task.email.dateTs]]));
			},
			chips() {
				return this.fields.filter(({
					chip
				}) => chip && chip.isEnabled !== false).map(({
					chip
				}) => chip);
			},
			isBottomSheetShown() {
				return this.isDescriptionSheetShown || this.isFilesSheetShown || this.isCheckListSheetShown || this.isDatePlanSheetShown || this.isTimeTrackingSheetShown || this.isTimeTrackingChipSheetShown || this.isResultListSheetShown || this.isResultEditorSheetShown || this.isResultChipSheetShown || this.isReminderSheetShown || this.isRemindersSheetShown || this.isReplicationSheetShown || this.isReplicationHistorySheetShown;
			},
			isDiskModuleInstalled() {
				return tasks_v2_core.Core.getParams().features.disk;
			},
			taskSettingsBindElement() {
				if (this.isPrimaryFieldsHovered) {
					return this.$refs.main.querySelector('[data-settings-label]');
				}
				return null;
			},
			isCopyMode() {
				return this.initialTask?.copiedFromId && !tasks_v2_lib_idUtils.idUtils.isReal(this.task?.id);
			},
			placeholderOptions() {
				if (this.taskGetError?.message === 'access_denied') {
					return {
						imgSrc: this.iconUrl,
						head: main_core.Loc.getMessage('TASKS_V2_TASK_FULL_CARD_PLACEHOLDER_TITLE_NO_RIGHTS_TITLE'),
						description: main_core.Loc.getMessage('TASKS_V2_TASK_FULL_CARD_PLACEHOLDER_TITLE_NOT_FOUND_DESCRIPTION'),
						action: {
							text: main_core.Loc.getMessage('TASKS_V2_TASK_FULL_CARD_PLACEHOLDER_ACTION_REQUEST_ACCESS'),
							disabled: this.isAccessRequested,
							click: this.requestAccess,
							hint: this.accessRequestError
						}
					};
				}
				return {
					imgSrc: this.notFoundUrl,
					head: main_core.Loc.getMessage('TASKS_V2_TASK_FULL_CARD_PLACEHOLDER_TITLE_NOT_FOUND_TITLE')
				};
			},
			isReplicateTemplate() {
				return this.isTemplate && this.task?.replicate === true;
			},
			hasFilledUserFields() {
				return tasks_v2_component_fields_userFields.userFieldsManager.hasFilledUserFields(this.task?.userFields || [], this.userFieldScheme);
			},
			hasRequiredUserFields() {
				return tasks_v2_component_fields_userFields.userFieldsManager.hasMandatoryUserFields(this.userFieldScheme);
			},
			shouldShowUserFields() {
				return this.isEdit ? this.hasFilledUserFields : this.hasRequiredUserFields || this.hasFilledUserFields;
			},
			shouldShowUserFieldsChip() {
				if (this.isAdmin) {
					return true;
				}
				return this.task.rights.edit && this.userFieldScheme.length > 0 || this.hasFilledUserFields;
			},
			shouldIgnoreResultPrint() {
				return this.task.results.length === 0;
			},
			shouldIgnoreCheckListPrint() {
				return this.checklist.length === 0;
			},
			shouldIgnoreSubTasksPrint() {
				return this.task.subTaskIds.length === 0;
			},
			shouldIgnoreParentTaskPrint() {
				return !this.task.parentId;
			},
			shouldIgnoreRelatedTasksPrint() {
				return this.task.relatedTaskIds.length === 0;
			},
			shouldIgnoreGanttPrint() {
				return this.task.ganttTaskIds.length === 0;
			},
			shouldIgnoreProjectFieldsPrint() {
				return this.projectFields.filter(field => !field.printIgnore).length === 0;
			},
			shouldIgnoreEmailPrint() {
				return !this.task.email;
			},
			shouldIgnoreTagsPrint() {
				return this.task.tags.length === 0;
			},
			shouldIgnoreParticipantsPrint() {
				return this.participantsFields.filter(field => !field.printIgnore).length === 0;
			},
			shouldIgnoreDatePlanPrint() {
				return !this.task.startPlanTs && !this.task.endPlanTs;
			}
		},
		watch: {
			async isLoading() {
				await this.$nextTick();
				this.renderSkeleton();
			},
			async isPrimaryFieldsHovered(isHovered) {
				if (isHovered && tasks_v2_lib_ahaMoments.ahaMoments.shouldShow(tasks_v2_const.Option.AhaTaskSettingsMessagePopup)) {
					setTimeout(this.showTaskSettingsHint, 500);
				}
			},
			'task.templateId': function (templateId, previousTemplateId) {
				if (this.taskInitial && !this.isEdit && templateId && templateId !== previousTemplateId) {
					void this.handleTemplate(templateId);
				}
			}
		},
		async created() {
			if (!this.isEdit && !this.task) {
				const initialTemplate = {};
				const flags = this.isTemplate ? this.templateStateFlags : this.stateFlags;
				if (this.isTemplate) {
					initialTemplate.requireDeadlineChangeReason = false;
					initialTemplate.allowsChangeDeadline = false;
				}
				const responsibleIds = this.initialTask.responsibleIds;
				await tasks_v2_provider_service_taskService.taskService.insertStoreTask({
					...this.initialTask,
					id: this.taskId,
					creatorId: tasks_v2_core.Core.getParams().currentUser.id,
					responsibleIds: responsibleIds?.length > 0 ? responsibleIds : [tasks_v2_core.Core.getParams().currentUser.id],
					deadlineTs: this.initialTask.deadlineTs ?? this.defaultDeadlineTs,
					needsControl: flags.needsControl ?? null,
					matchesWorkTime: flags.matchesWorkTime ?? null,
					allowsTimeTracking: flags.allowsTimeTracking ?? null,
					requireResult: tasks_v2_core.Core.getParams().restrictions.requiredResult.available && this.defaultRequireResult,
					allowsChangeDeadline: this.deadlineUserOption.canChangeDeadline,
					requireDeadlineChangeReason: this.deadlineUserOption.requireDeadlineChangeReason,
					maxDeadlineChangeDate: this.deadlineUserOption.maxDeadlineChangeDate,
					maxDeadlineChanges: this.deadlineUserOption.maxDeadlineChanges,
					...initialTemplate
				});
				if (this.initialTask.copiedFromId) {
					await tasks_v2_provider_service_taskService.taskService.getCopy(this.initialTask.copiedFromId, this.taskId);
				}
				if (this.initialTask.templateId) {
					await tasks_v2_provider_service_templateService.templateService.getTask(this.initialTask.templateId, this.taskId);
				}
				tasks_v2_lib_analytics.analytics.sendClickCreate(this.analytics, {
					collabId: this.group?.type === tasks_v2_const.GroupType.Collab ? this.group.id : null,
					cardType: tasks_v2_const.CardType.Full,
					viewersCount: this.initialTask?.auditorsIds?.length ?? 0,
					coexecutorsCount: this.initialTask?.accomplicesIds?.length ?? 0
				});
			}
			await this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/clearFieldsFilled`, this.taskId);
			if (this.isEdit && (!this.task || this.isPartiallyLoaded)) {
				tasks_v2_provider_service_taskService.taskService.setSilentErrorMode(true);
				const {
					error
				} = await tasks_v2_provider_service_taskService.taskService.get(this.taskId);
				tasks_v2_provider_service_taskService.taskService.setSilentErrorMode(false);
				this.taskGetError = error;
				if (!this.isTemplate) {
					await tasks_v2_provider_service_viewersService.viewersService.count(this.taskId);
				}
			}
			if (!this.task) {
				this.isLoading = false;
				this.isAccessRequested = await tasks_v2_provider_service_taskService.taskService.isAccessRequested(this.taskId);
				this.accessRequestError = this.isAccessRequested ? main_core.Loc.getMessage('TASKS_V2_TASK_FULL_CARD_PLACEHOLDER_ACCESS_ALREADY_REQUESTED') : null;
				return;
			}
			this.isAccessRequested = false;
			await tasks_v2_provider_service_fileService.fileService.get(this.taskId).list(this.task.fileIds);
			this.isLoading = false;
			if (!this.isTemplate && !this.canChangeDeadlineWithoutLimitation && this.task.maxDeadlineChanges) {
				void tasks_v2_provider_service_deadlineService.deadlineService.updateDeadlineChangeCount(this.task.id);
			}
			if (this.isEdit && this.task.rights.timeTracking && !this.timer) {
				void tasks_v2_provider_service_timeTrackingService.timeTrackingService.getTaskWithActiveTimer();
			}
			tasks_v2_component_entityText.entityTextEditor.get(this.taskId, tasks_v2_component_entityText.EntityTextTypes.Task, {
				content: this.task?.description
			});
			this.taskInitial = this.task;
			if (this.isEdit) {
				tasks_v2_lib_analytics.analytics.sendTaskView(this.analytics, {
					taskId: this.task?.id,
					viewersCount: this.task?.auditorsIds?.length ?? 0,
					coexecutorsCount: this.task?.accomplicesIds?.length ?? 0
				});
			}
			await main_core.Runtime.loadExtension(tasks_v2_core.Core.getParams().externalExtensions);
			main_core_events.EventEmitter.emit(tasks_v2_const.EventName.FullCardInit, {
				task: this.task
			});
		},
		async mounted() {
			this.subscribeEvents();
			this.renderSkeleton();
			this.iconUrl = iconUrl;
			this.notFoundUrl = notFoundUrl;
		},
		unmounted() {
			this.unsubscribeEvents();
			if (!this.isEdit) {
				void this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/delete`, this.taskId);
				tasks_v2_provider_service_fileService.fileService.delete(this.taskId);
				tasks_v2_component_entityText.entityTextEditor.delete(this.taskId);
			}
		},
		methods: {
			...ui_vue3_vuex.mapActions(tasks_v2_const.Model.Interface, ['updateFullCardWidth']),
			subscribeEvents() {
				main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.FullCardHasChanges, this.handleHasChanges);
				main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.CloseAllBottomSheets, this.closeAllSheets);
				main_core_events.EventEmitter.subscribe('BX.Main.Popup:onShow', this.handlePopupShow);
				main_core.Event.bind(document, 'keydown', this.handleKeyDown, {
					capture: true
				});
			},
			unsubscribeEvents() {
				main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.FullCardHasChanges, this.handleHasChanges);
				main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.CloseAllBottomSheets, this.closeAllSheets);
				main_core_events.EventEmitter.unsubscribe('BX.Main.Popup:onShow', this.handlePopupShow);
				main_core.Event.unbind(document, 'keydown', this.handleKeyDown, {
					capture: true
				});
			},
			closeAllSheets(event) {
				const {
					actionName
				} = event.getData();
				const sheetsByAction = {
					[tasks_v2_const.ChatAction.OpenResult]: ['isResultListSheetShown', 'isResultEditorSheetShown', 'isResultChipSheetShown'],
					[tasks_v2_const.ChatAction.ShowCheckList]: ['isCheckListSheetShown'],
					[tasks_v2_const.ChatAction.ShowCheckListItems]: ['isCheckListSheetShown'],
					[tasks_v2_const.ChatAction.OpenTimeTracking]: ['isTimeTrackingSheetShown', 'isTimeTrackingChipSheetShown']
				};
				const preserved = new Set(sheetsByAction[actionName] || []);
				const allSheets = ['isFilesSheetShown', 'isDescriptionSheetShown', 'isCheckListSheetShown', 'isDatePlanSheetShown', 'isTimeTrackingSheetShown', 'isTimeTrackingChipSheetShown', 'isResultListSheetShown', 'isResultEditorSheetShown', 'isResultChipSheetShown', 'isReminderSheetShown', 'isRemindersSheetShown', 'isReplicationSheetShown', 'isReplicationHistorySheetShown'];
				for (const sheet of allSheets) {
					if (!preserved.has(sheet)) {
						this[sheet] = false;
					}
				}
			},
			handlePopupShow(event) {
				const popup = event.getCompatData()[0];
				const onClose = () => {
					popup.unsubscribe('onClose', onClose);
					popup.unsubscribe('onDestroy', onClose);
					this.popupCount--;
				};
				popup.subscribe('onClose', onClose);
				popup.subscribe('onDestroy', onClose);
				this.popupCount++;
			},
			handleKeyDown(event) {
				if (this.isEdit || this.popupCount > 0) {
					return;
				}
				if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
					this.$refs.footerCreate.handleAddClick();
				}
			},
			getFields(map) {
				return this.fields.filter(({
					component
				}) => map.get(component));
			},
			wasFilled(fieldId) {
				return Boolean(this.task.filledFields[fieldId]);
			},
			async addTask() {
				const checklists = this.checklist;
				const [id, error] = await tasks_v2_provider_service_taskService.taskService.add({
					task: this.task,
					view: true
				});
				if (!id) {
					this.handleCreationError(error);
					return;
				}
				this.taskId = id;
				tasks_v2_provider_service_fileService.fileService.replace(this.id, id);
				tasks_v2_component_entityText.entityTextEditor.replace(this.id, id);
				const isSuccess = Boolean(id);
				this.sendAddTaskAnalytics(isSuccess, checklists);
				this.fireLegacyGlobalEvent();
				if (!this.isTemplate) {
					await tasks_v2_provider_service_viewersService.viewersService.count(this.taskId);
				}
			},
			async copyTask(event) {
				const {
					withSubTasks
				} = event;
				const optionsTaskCopy = {
					task: this.task,
					withSubTasks,
					view: true
				};
				const [id, error] = await tasks_v2_provider_service_taskService.taskService.copy(optionsTaskCopy);
				if (!id) {
					this.handleCreationError(error);
					return;
				}
				this.taskId = id;
				tasks_v2_provider_service_fileService.fileService.delete(this.id);
				await tasks_v2_provider_service_fileService.fileService.get(this.taskId).list(this.task.fileIds);
				tasks_v2_component_entityText.entityTextEditor.replace(this.id, id);
				this.fireLegacyGlobalEvent();
				if (!this.isTemplate) {
					await tasks_v2_provider_service_viewersService.viewersService.count(this.taskId);
				}
			},
			async createFromTemplate(event) {
				const {
					withSubTasks
				} = event;
				const view = true;
				const [id, error] = await tasks_v2_provider_service_templateService.templateService.addTask(this.task.templateId, this.task, withSubTasks, view);
				if (!id) {
					this.handleCreationError(error);
					this.sendAddTaskFromTemplateAnalytics(false);
					return;
				}
				this.taskId = id;
				this.sendAddTaskFromTemplateAnalytics(true);
				await tasks_v2_provider_service_viewersService.viewersService.count(this.taskId);
				tasks_v2_provider_service_fileService.fileService.delete(this.id, tasks_v2_provider_service_fileService.EntityTypes.Task, false);
				tasks_v2_component_entityText.entityTextEditor.replace(this.id, id);
				this.fireLegacyGlobalEvent();
			},
			handleCreationError(error) {
				this.creationError = true;
				ui_notificationManager.Notifier.notifyViaBrowserProvider({
					id: 'task-notify-add-error',
					text: error?.message
				});
			},
			fireLegacyGlobalEvent() {
				main_core_events.EventEmitter.emit(tasks_v2_const.EventName.LegacyTasksTaskEvent, new main_core_events.BaseEvent({
					data: this.taskId,
					compatData: ['ADD', {
						task: {
							ID: this.taskId
						},
						taskUgly: {
							id: this.taskId
						},
						options: {}
					}]
				}));
			},
			openCheckList(checkListId) {
				this.checkListId = checkListId;
				this.isCheckListSheetShown = true;
			},
			closeCheckList(checkListId) {
				this.checkListId = checkListId;
				this.isCheckListSheetShown = false;
			},
			openUserFieldsHandler() {
				void tasks_v2_component_userFieldsSlider.userFieldsSlider.open({
					taskId: this.taskId,
					isTemplate: this.isTemplate,
					templateId: this.isEdit ? null : this.task?.templateId,
					copiedFromId: this.isEdit ? null : this.task?.copiedFromId
				});
			},
			handleCloseTaskSettingsHint() {
				this.isTaskSettingsHintShown = false;
				tasks_v2_lib_ahaMoments.ahaMoments.setInactive(tasks_v2_const.Option.AhaTaskSettingsMessagePopup);
				if (tasks_v2_lib_ahaMoments.ahaMoments.shouldShow(tasks_v2_const.Option.AhaTaskSettingsMessagePopup)) {
					tasks_v2_lib_ahaMoments.ahaMoments.setShown(tasks_v2_const.Option.AhaTaskSettingsMessagePopup);
				}
			},
			handleEndResize(newWidth) {
				const cardWidth = this.validateCardWidth(newWidth);
				void this.updateFullCardWidth(cardWidth);
				UserOptions.delay = 100;
				UserOptions.save('tasks', 'fullCard', 'cardWidth', cardWidth);
			},
			validateCardWidth(width) {
				return Number.isNaN(parseInt(width, 10)) ? null : parseInt(width, 10);
			},
			handleHasChanges(event) {
				const handleResult = {
					taskId: this.taskId
				};
				if (this.isEdit || event.getData().taskId !== this.taskId) {
					handleResult.hasChanges = false;
					return handleResult;
				}
				handleResult.hasChanges = JSON.stringify(this.task) !== JSON.stringify(this.taskInitial);
				return handleResult;
			},
			tryClose() {
				main_core_events.EventEmitter.emit(tasks_v2_const.EventName.TryCloseFullCard, {
					taskId: this.taskId
				});
			},
			showTaskSettingsHint() {
				if (this.isSettingsPopupShown === false && this.taskSettingsBindElement) {
					tasks_v2_lib_ahaMoments.ahaMoments.setActive(tasks_v2_const.Option.AhaTaskSettingsMessagePopup);
					this.isTaskSettingsHintShown = true;
				}
			},
			async handleTemplate(templateId) {
				this.isLoading = true;
				await tasks_v2_provider_service_templateService.templateService.getTask(templateId, this.taskId);
				await tasks_v2_provider_service_fileService.fileService.get(this.taskId).list(this.task?.fileIds);
				await this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/clearFieldsFilled`, this.taskId);
				this.isLoading = false;
			},
			renderSkeleton() {
				if (this.$refs.skeleton) {
					let path = '/bitrix/js/tasks/v2/application/task-card/src/skeleton-full.html?v=1';
					if (this.embedded) {
						path = '/bitrix/js/tasks/v2/application/task-card/src/skeleton-full-embedded.html?v=1';
					} else if (this.isTemplate) {
						path = '/bitrix/js/tasks/v2/application/task-card/src/skeleton-template.html?v=1';
					}
					void ui_system_skeleton.renderSkeleton(path, this.$refs.skeleton);
				}
			},
			sendAddTaskAnalytics(isSuccess, checklists) {
				const collabId = this.group?.type === tasks_v2_const.GroupType.Collab ? this.group.id : null;
				const viewersCount = this.task.auditorsIds.length;
				const coexecutorsCount = this.task.accomplicesIds.length;
				if (this.task.templateId) {
					this.sendAddTaskFromTemplateAnalytics(isSuccess);
				} else if (this.task.parentId) {
					tasks_v2_lib_analytics.analytics.sendAddTask(this.analytics, {
						isSuccess,
						collabId,
						viewersCount,
						coexecutorsCount,
						event: tasks_v2_const.Analytics.Event.SubTaskAdd,
						cardType: tasks_v2_const.CardType.Full,
						taskId: this.taskId
					});
				} else if (checklists.length > 0) {
					const checklistCount = checklists.filter(({
						parentId
					}) => parentId === 0).length;
					const checklistItemsCount = checklists.filter(({
						parentId
					}) => parentId !== 0).length;
					tasks_v2_lib_analytics.analytics.sendAddTaskWithCheckList(this.analytics, {
						isSuccess,
						collabId,
						viewersCount,
						checklistCount,
						checklistItemsCount,
						cardType: tasks_v2_const.CardType.Full,
						taskId: this.taskId
					});
				} else {
					tasks_v2_lib_analytics.analytics.sendAddTask(this.analytics, {
						isSuccess,
						collabId,
						viewersCount,
						coexecutorsCount,
						event: tasks_v2_const.Analytics.Event.TaskCreate,
						cardType: tasks_v2_const.CardType.Full,
						taskId: this.taskId
					});
				}
			},
			sendAddTaskFromTemplateAnalytics(isSuccess) {
				const collabId = this.group?.type === tasks_v2_const.GroupType.Collab ? this.group.id : null;
				const viewersCount = this.task.auditorsIds.length;
				const coexecutorsCount = this.task.accomplicesIds.length;
				tasks_v2_lib_analytics.analytics.sendAddTask(this.analytics, {
					isSuccess,
					collabId,
					viewersCount,
					coexecutorsCount,
					event: tasks_v2_const.Analytics.Event.PatternTaskCreate,
					cardType: tasks_v2_const.CardType.Full,
					taskId: this.taskId
				});
			},
			async requestAccess() {
				const {
					accessRequest,
					error
				} = await tasks_v2_provider_service_taskService.taskService.requestAccess(this.taskId);
				this.isAccessRequested = true;
				this.accessRequestError = error?.message || main_core.Loc.getMessage('TASKS_V2_TASK_FULL_CARD_PLACEHOLDER_ACCESS_ALREADY_REQUESTED');
				ui_notificationManager.Notifier.notifyViaBrowserProvider({
					id: 'tasks-request-accessed',
					text: main_core.Loc.getMessage('TASKS_V2_TASK_FULL_CARD_PLACEHOLDER_ACCESS_REQUESTED_NOTIFICATION')
				});
				return accessRequest;
			}
		},
		template: `
		<div
			class="tasks-full-card print-fit-height"
			:class="{ '--blur': isDescriptionSheetShown }"
			:data-task-id="taskId"
			data-task-full
		>
			<template v-if="task && !isPartiallyLoaded && !isLoading">
				<div
					ref="main"
					class="tasks-full-card-main print-background-white"
					:class="{ 
						'--overlay': isBottomSheetShown,
						'--embedded': embedded,
					}"
					:style="{ width: ((isTemplate || embedded) ? '100%' : fullCardWidth + 'px'),}"
				>
					<div class="tasks-full-card-content" :data-task-card-scroll="taskId" ref="scrollContent">
						<div ref="title">
							<TaskHeader />
						</div>
						<CheckList
							:checkListId
							:isShown="isCheckListSheetShown"
							:sheetBindProps
							@close="closeCheckList"
						/>
						<DescriptionField
							v-model:isSheetShown="isDescriptionSheetShown"
							:taskId
							:sheetBindProps
							ref="description"
						/>
						<div class="tasks-full-card-fields">
							<div
								class="tasks-full-card-field-container print-before-divider-accent print-no-box-shadow"
								data-field-container
								@mouseover="isPrimaryFieldsHovered = true"
								@mouseleave="isPrimaryFieldsHovered = false"
							>
								<FieldList :fields="primaryFields"/>
							</div>
							<div class="tasks-full-card-chips-fields">
								<div
									v-if="emailFields.length > 0"
									class="tasks-full-card-field-container print-before-divider-accent print-no-box-shadow"
									:class="{ 'print-ignore': shouldIgnoreEmailPrint }"
									data-field-container
								>
									<FieldList :fields="emailFields"/>
								</div>
								<div
									v-if="task.requireResult || wasFilled(TaskField.Results)"
									class="tasks-full-card-field-container  --custom"
									:class="{ 
										'print-ignore': shouldIgnoreResultPrint,
										'print-before-divider-accent': !shouldIgnoreResultPrint,
									}"
								>
									<Results
										v-model:isSheetShown="isResultEditorSheetShown"
										v-model:isListSheetShown="isResultListSheetShown"
										:sheetBindProps
									/>
								</div>
								<div
									v-if="isDiskModuleInstalled && (files.length > 0 || wasFilled(TaskField.Files))"
									class="tasks-full-card-field-container --small-vertical-padding print-ignore"
									data-field-container
								>
									<Files v-model:isSheetShown="isFilesSheetShown" :taskId :sheetBindProps/>
								</div>
								<div
									v-if="wasFilled(TaskField.CheckList)"
									class="tasks-full-card-field-container print-before-divider-accent print-padding-bottom-inset-md --custom"
									:class="{ 'print-ignore': shouldIgnoreCheckListPrint }"
								>
									<CheckList
										isPreview
										:isComponentShown="!isCheckListSheetShown"
										:checkListId
										@open="openCheckList"
									/>
								</div>
								<div
									v-if="projectFields.length > 0"
									class="tasks-full-card-field-container print-before-divider-accent print-no-box-shadow"
									:class="{ 'print-ignore': shouldIgnoreProjectFieldsPrint }"
									data-field-container
								>
									<FieldList :fields="projectFields"/>
								</div>
								<div
									v-if="participantsFields.length > 0"
									class="tasks-full-card-field-container print-before-divider-accent print-no-box-shadow"
									:class="{ 'print-ignore': shouldIgnoreParticipantsPrint }"
									data-field-container
								>
									<FieldList
										:fields="participantsFields"
										:useSeparator="participantsFields.length > 1"
									/>
								</div>
								<div
									v-if="!isTemplate && isEdit && wasFilled(TaskField.Placements)"
									class="tasks-full-card-field-container --custom print-ignore"
								>
									<Placements/>
								</div>
								<div
									v-if="!isTemplate && wasFilled(TaskField.Reminders)"
									class="tasks-full-card-field-container --custom print-ignore"
									data-field-container
								>
									<Reminders
										v-model:isSheetShown="isReminderSheetShown"
										v-model:isListSheetShown="isRemindersSheetShown"
										:sheetBindProps
									/>
								</div>
								<div
									v-if="tagsFields.length > 0"
									class="tasks-full-card-field-container print-before-divider-accent print-no-box-shadow"
									:class="{ 'print-ignore': shouldIgnoreTagsPrint }"
									data-field-container
								>
									<FieldList :fields="tagsFields"/>
								</div>
								<div
									v-if="wasFilled(TaskField.Parent)"
									class="tasks-full-card-field-container print-before-divider-accent --custom"
									:class="{ 'print-ignore': shouldIgnoreParentTaskPrint }"
									data-field-container
								>
									<ParentTask/>
								</div>
								<div
									v-if="wasFilled(TaskField.SubTasks) && !isCopyMode"
									class="tasks-full-card-field-container print-before-divider-accent --custom --task-list print-background-white"
									:class="{ 'print-ignore': shouldIgnoreSubTasksPrint }"
									data-field-container
								>
									<SubTasks/>
								</div>
								<div
									v-if="wasFilled(TaskField.RelatedTasks)"
									class="tasks-full-card-field-container print-before-divider-accent --custom --task-list print-background-white"
									:class="{ 'print-ignore': shouldIgnoreRelatedTasksPrint }"
									data-field-container
								>
									<RelatedTasks/>
								</div>
								<div
									v-if="wasFilled(TaskField.Replication)"
									class="tasks-full-card-field-container --custom print-ignore"
									data-field-container
								>
									<Replication
										v-model:isSheetShown="isReplicationSheetShown"
										v-model:isHistorySheetShown="isReplicationHistorySheetShown"
										:sheetBindProps
									/>
								</div>
								<div
									v-if="!isTemplate && wasFilled(TaskField.Gantt)"
									class="tasks-full-card-field-container print-before-divider-accent --custom --task-list print-background-white"
									:class="{ 'print-ignore': shouldIgnoreGanttPrint }"
									data-field-container
								>
									<Gantt/>
								</div>
								<div
									v-if="wasFilled(TaskField.DatePlan)"
									class="tasks-full-card-field-container print-before-divider-accent print-no-box-shadow"
									:class="{ 'print-ignore': shouldIgnoreDatePlanPrint }"
									data-field-container
								>
									<DatePlan v-model:isSheetShown="isDatePlanSheetShown" :sheetBindProps/>
								</div>
								<div
									v-if="shouldShowUserFields"
									class="tasks-full-card-field-container print-before-divider-accent --custom"
									data-field-container
								>
									<UserFields @open="openUserFieldsHandler"/>
								</div>
								<Chips :chips/>
							</div>
							<TaskSettingsHint
								v-if="isTaskSettingsHintShown"
								:isShown="isTaskSettingsHintShown"
								:bindElement="taskSettingsBindElement"
								@close="handleCloseTaskSettingsHint"
							/>
						</div>
					</div>
					<FooterEdit v-if="isEdit"/>
					<FooterCreate
						v-else
						v-model:creationError="creationError"
						@addTask="addTask"
						@copyTask="copyTask"
						@fromTemplate="createFromTemplate"
						@close="tryClose"
						ref="footerCreate"
					/>
					<ContentResizer v-if="!isTemplate" @endResize="handleEndResize"/>
					<DropZone
						v-if="isDiskModuleInstalled && !isBottomSheetShown && task.rights.edit"
						:container="$refs.main || {}"
						:entityId="taskId"
						:entityType="EntityTypes.Task"
					/>
				</div>
				<Chat v-if="!isTemplate && !embedded"/>
			</template>
			<template v-else-if="isLoading">
				<div ref="skeleton" style="width: 100%;"/>
			</template>
			<Placeholder
				v-else
				:imgSrc="placeholderOptions.imgSrc"
				:head="placeholderOptions.head"
				:description="placeholderOptions.description"
				:action="placeholderOptions.action"
			/>
		</div>
	`
	};

	class ClosePopup {
		show(onOk) {
			ui_dialogs_messagebox.MessageBox.show({
				useAirDesign: true,
				title: main_core.Loc.getMessage('TASKS_V2_TASK_FULL_CARD_CLOSE_POPUP_TITLE_MSGVER_1'),
				message: main_core.Loc.getMessage('TASKS_V2_TASK_FULL_CARD_CLOSE_POPUP_MESSAGE'),
				buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
				okCaption: main_core.Loc.getMessage('TASKS_V2_TASK_FULL_CARD_CLOSE_POPUP_OK_CAPTION'),
				onOk,
				popupOptions: {
					closeIcon: false
				}
			});
		}
	}

	const openedCards = new Set();
	class TaskFullCard {
		#params;
		#slider;
		#application;
		#handlers;
		#needToReloadGrid = false;
		#isCloseConfirmed = false;
		#shouldCloseComplete = true;
		constructor(params = {}) {
			this.#params = Object.fromEntries(Object.entries(params).filter(([, value]) => !main_core.Type.isUndefined(value)));
			this.#params.taskId ||= main_core.Text.getRandom();
			if (this.#params.taskId === 'template0') {
				this.#params.taskId = tasks_v2_lib_idUtils.idUtils.boxTemplate(main_core.Text.getRandom());
			}
		}
		static isOpened(taskId) {
			return openedCards.has(taskId);
		}
		async mount(slider) {
			if (!slider.isOpen()) {
				return;
			}
			const queryParams = new main_core.Uri(this.#params.link?.url ?? this.#params.url).getQueryParams();
			this.#params = {
				...tasks_v2_provider_service_taskService.TaskMappers.mapSliderDataToModel({
					...queryParams,
					...slider.getRequestParams()
				}),
				...this.#params,
				...(['tasks_planning', 'tasks_kanban_sprint'].includes(queryParams.SCOPE) ? {
					deadlineTs: 0
				} : {}),
				embedded: false
			};
			this.#params.groupId ||= tasks_v2_core.Core.getParams().defaultCollab?.id || undefined;
			this.#slider = slider;
			this.#updateSliderUrl();
			this.#subscribe();
			this.#application = await this.#mountApplication(slider.getContentContainer());
			openedCards.add(this.#params.taskId);
		}
		async mountEmbedded(container) {
			this.#params = {
				...this.#params,
				embedded: true
			};
			this.#subscribe();
			this.#application = await this.#mountApplication(container);
			openedCards.add(this.#params.taskId);
		}
		unmount() {
			this.#unmountApplication();
			this.#unsubscribe();
			if (this.#needToReloadGrid) {
				const id = this.#params.taskId;
				main_core_events.EventEmitter.emit(tasks_v2_const.EventName.LegacyTasksTaskEvent, new main_core_events.BaseEvent({
					data: id,
					compatData: ['UPDATE', {
						task: {
							ID: id
						},
						taskUgly: {
							id
						},
						options: {
							STAY_AT_PAGE: true
						}
					}]
				}));
			}
			openedCards.delete(this.#params.taskId);
		}
		unmountEmbedded() {
			this.#unmountApplication();
			this.#unsubscribe();
		}
		onClose(event) {
			if (this.#isCloseConfirmed) {
				return;
			}

			/** @type {{ taskId: number | string, hasChanges: boolean }[]} */
			const allChanges = main_core_events.EventEmitter.emit(tasks_v2_const.EventName.FullCardHasChanges, {
				taskId: this.#params.taskId
			});
			const hasChanges = allChanges.find(result => result.taskId === this.#params.taskId)?.hasChanges;
			if (!hasChanges) {
				return;
			}
			event.denyAction();
			new ClosePopup().show(dialog => {
				dialog.close();
				this.#isCloseConfirmed = true;
				this.#slider.close();
			});
		}
		onCloseComplete() {
			this.unmount();
			if (this.#shouldCloseComplete && this.#params.closeCompleteUrl) {
				location.href = this.#params.closeCompleteUrl;
			}
		}
		async #mountApplication(container) {
			await tasks_v2_core.Core.init();
			const {
				taskId,
				analytics,
				url,
				link,
				closeCompleteUrl,
				embedded,
				onCloseEmbedded,
				...initialTask
			} = this.#params;
			const application = ui_vue3.BitrixVue.createApp(App, {
				id: taskId,
				initialTask: Object.fromEntries(Object.entries(initialTask).filter(([, value]) => !main_core.Type.isNil(value))),
				analytics,
				embedded,
				onCloseEmbedded
			});
			application.mixin(ui_vue3_mixins_locMixin.locMixin);
			application.use(tasks_v2_core.Core.getStore());
			application.mount(container);
			return application;
		}
		#unmountApplication() {
			this.#application?.unmount();
			main_core_events.EventEmitter.emit(tasks_v2_const.EventName.FullCardClosed, this.#params);
		}
		#subscribe() {
			this.#handlers = {
				[tasks_v2_const.EventName.FullCardInit]: this.#handleTaskCardInit,
				[tasks_v2_const.EventName.TaskAdded]: this.#handleTaskAdd,
				[tasks_v2_const.EventName.TaskBeforeUpdate]: this.#handleTaskUpdate,
				[tasks_v2_const.EventName.TemplateAdded]: this.#handleTemplateAdd,
				[tasks_v2_const.EventName.TemplateBeforeUpdate]: this.#handleTemplateUpdate,
				[tasks_v2_const.EventName.CloseFullCard]: this.#onClose,
				[tasks_v2_const.EventName.TryCloseFullCard]: this.#onTryClose,
				[tasks_v2_const.EventName.OpenCompactCard]: this.#openCompactCard,
				[tasks_v2_const.EventName.OpenGrid]: this.#openGrid,
				[tasks_v2_const.EventName.OpenTemplateHistory]: this.#openTemplateHistory,
				[tasks_v2_const.EventName.OpenHistory]: this.#openHistory,
				'BX.Main.Popup:onShow': this.#handlePopupShow
			};
			Object.entries(this.#handlers).forEach(([event, handler]) => main_core_events.EventEmitter.subscribe(event, handler));
		}
		#unsubscribe() {
			Object.entries(this.#handlers).forEach(([event, handler]) => main_core_events.EventEmitter.unsubscribe(event, handler));
		}
		#handleTaskUpdate = event => {
			const task = event.getData().task;
			const taskId = task.id;
			const relationIds = new Set([...task.subTaskIds, ...task.relatedTaskIds, ...task.ganttTaskIds]);
			const isRelationTaskUpdated = relationIds.has(taskId);
			const fields = Object.keys(event.getData().fields);
			const fieldsForReloadGrid = new Set(['deadlineTs', 'responsibleIds']);
			const isFieldsForGridUpdated = fields.some(it => fieldsForReloadGrid.has(it));
			if (isRelationTaskUpdated || taskId === this.#params.taskId && isFieldsForGridUpdated) {
				this.#needToReloadGrid = true;
			}
			this.#updateSliderTitle(task.title);
		};
		#handleTaskCardInit = event => {
			const task = event.getData().task;
			if (task.id === this.#params.taskId) {
				this.#updateSliderTitle(task.title);
			}
		};
		#handleTaskAdd = event => {
			const initialTask = event.getData().initialTask;
			if (initialTask.id !== this.#params.taskId) {
				return;
			}
			const task = event.getData().task;
			openedCards.delete(this.#params.taskId);
			this.#params.taskId = task.id;
			openedCards.add(this.#params.taskId);
			this.#isCloseConfirmed = true;
			this.#updateSliderTitle(task.title);
			this.#updateSliderUrl();
		};
		#handleTemplateAdd = event => {
			const initialTemplate = event.getData().initialTemplate;
			if (!initialTemplate || initialTemplate.id !== this.#params.taskId) {
				return;
			}
			const template = event.getData().template;
			this.#params.taskId = template.id;
			this.#isCloseConfirmed = true;
			this.#updateSliderTitle(template.title);
			this.#updateSliderUrl();
		};
		#handleTemplateUpdate = event => {
			const template = event.getData().template;
			this.#updateSliderTitle(template.title);
		};
		#updateSliderUrl() {
			const taskId = Number.isInteger(this.#params.taskId) ? this.#params.taskId : 0;
			const taskUrl = tasks_v2_application_taskCard.TaskCard.getUrl(this.#params.taskId, this.#params.groupId);
			if (!tasks_v2_lib_idUtils.idUtils.isTemplate(this.#params.taskId)) {
				this.#slider.setMinimizeOptions({
					entityType: 'tasks:task',
					entityName: main_core.Loc.getMessage('INTRANET_BINDINGS_TASK'),
					url: taskUrl,
					entityId: taskId
				});
			}
			this.#slider.setUrl(taskUrl);
			main_sidepanel.SidePanel.Instance.resetBrowserHistory();
		}
		#updateSliderTitle(title) {
			if (this.#slider && main_core.Type.isStringFilled(title)) {
				this.#slider.setTitle(title);
				main_sidepanel.SidePanel.Instance.updateBrowserTitle();
			}
		}
		#onTryClose = event => {
			if (this.#slider && event.getData().taskId === this.#params.taskId) {
				this.#slider.close();
			}
		};
		#onClose = event => {
			if (this.#slider && event.getData().taskId === this.#params.taskId) {
				this.#isCloseConfirmed = true;
				this.#slider.close();
			}
		};
		#openHistory = async baseEvent => {
			const {
				taskId
			} = baseEvent.getData();
			const {
				HistoryGrid
			} = await main_core.Runtime.loadExtension('tasks.v2.application.history-grid');
			HistoryGrid.openHistoryGrid({
				taskId
			});
		};
		#openCompactCard = async baseEvent => {
			const params = baseEvent.getData();
			tasks_v2_application_taskCard.TaskCard.showCompactCard({
				...params,
				groupId: this.#params.groupId
			});
		};
		#openGrid = baseEvent => {
			const {
				taskId,
				type
			} = baseEvent.getData();
			const userId = tasks_v2_core.Core.getParams().currentUser.id;
			main_sidepanel.SidePanel.Instance.open(`/company/personal/user/${userId}/tasks/?relationToId=${taskId}&relationType=${type}`, {
				newWindowLabel: false,
				copyLinkLabel: false
			});
		};
		#openTemplateHistory = baseEvent => {
			const params = baseEvent.getData();
			let templateHistoryGrid = null;
			BX.SidePanel.Instance.open('tasks-template-history-grid', {
				contentCallback: async slider => {
					const exports = await main_core.Runtime.loadExtension('tasks.v2.application.template-history-grid');
					templateHistoryGrid = new exports.TemplateHistoryGrid(params);
					return templateHistoryGrid.mount(slider);
				},
				events: {
					onClose: () => templateHistoryGrid?.unmount()
				},
				cacheable: false,
				width: 1200
			});
		};
		#handlePopupShow = event => {
			const popup = event.getCompatData()[0];
			if (popup.getTargetContainer() !== document.body) {
				return;
			}
			const onScroll = () => popup.adjustPosition();
			const onClose = () => {
				popup.unsubscribe('onClose', onClose);
				popup.unsubscribe('onDestroy', onClose);
				main_core.Event.unbind(document, 'scroll', onScroll, true);
			};
			popup.subscribe('onClose', onClose);
			popup.subscribe('onDestroy', onClose);
			main_core.Event.bind(document, 'scroll', onScroll, true);
		};
	}

	exports.TaskFullCard = TaskFullCard;

})(this.BX.Tasks.V2.Application = this.BX.Tasks.V2.Application || {}, BX, BX.Event, BX.SidePanel, BX.Vue3, BX.Vue3.Mixins, BX.Tasks.V2.Application, BX.Tasks.V2, BX.Tasks.V2.Const, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX.UI.NotificationManager, BX.UI.System, BX.UI.System.Skeleton.Vue, BX.Vue3.Vuex, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component, BX.Tasks.V2.Component, BX.Tasks.V2.Component, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.UI.IconSet, window, BX.UI.Vue3.Components, BX.Tasks.V2.Component, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX.UI.System.Typography.Vue, BX.Vue3.Components, BX.UI.System.Chip.Vue, BX.Tasks.V2.Component, BX.Tasks.V2.Component, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component, BX.Tasks.V2.Provider.Service, BX.UI.System.Menu, BX.Tasks.V2.Lib, BX.Vue3.Directives, BX.UI.Dialogs);
//# sourceMappingURL=task-full-card.bundle.js.map
