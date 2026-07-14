/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_core, main_core_events, ui_vue3, ui_vue3_mixins_locMixin, tasks_v2_lib_analytics, tasks_v2_application_taskCard, tasks_v2_lib_idUtils, tasks_v2_provider_service_taskService, tasks_v2_core, tasks_v2_const, tasks_v2_model_users, ui_vue3_vuex, ui_notificationManager, ui_uploader_tileWidget, ui_vue3_components_button, ui_iconSet_api_vue, ui_iconSet_outline, tasks_v2_component_addTaskButton, tasks_v2_component_fields_title, tasks_v2_component_fields_importance, tasks_v2_component_fields_description, tasks_v2_component_elements_fieldList, tasks_v2_component_dropZone, tasks_v2_component_fields_responsible, tasks_v2_component_fields_deadline, tasks_v2_component_fields_checkList, tasks_v2_component_fields_files, tasks_v2_component_fields_group, tasks_v2_provider_service_fileService, tasks_v2_provider_service_viewersService, tasks_v2_component_elements_hint, tasks_v2_lib_fieldHighlighter, tasks_v2_lib_ahaMoments) {
	'use strict';

	// @vue/component
	const FullCardButton = {
		components: {
			Hint: tasks_v2_component_elements_hint.Hint,
			UiButton: ui_vue3_components_button.Button
		},
		inject: {
			analytics: {},
			task: {},
			taskId: {}
		},
		props: {
			isOpening: {
				type: Boolean,
				required: true
			}
		},
		emits: ['update:isOpening'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		data() {
			return {
				isHintShown: false,
				hintBindElement: null,
				showAuditorsHint: false,
				auditorsHintBindElement: null
			};
		},
		computed: {
			checkLists() {
				return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](this.task.checklist);
			},
			isDisabled() {
				return this.isUploading || this.isCheckListUploading;
			},
			isUploading() {
				return tasks_v2_provider_service_fileService.fileService.get(this.taskId).isUploading();
			},
			isCheckListUploading() {
				return this.task.checklist?.some(itemId => tasks_v2_provider_service_fileService.fileService.get(itemId, tasks_v2_provider_service_fileService.EntityTypes.CheckListItem).isUploading());
			},
			hasAuditors() {
				return Array.isArray(this.task?.auditorsIds) && this.task.auditorsIds.length > 0;
			},
			auditorsHintOptions() {
				return {
					closeIcon: true,
					offsetLeft: -60,
					angle: {
						offset: 140
					},
					bindOptions: {
						forceBindPosition: true,
						forceTop: true,
						position: 'top'
					}
				};
			}
		},
		mounted() {
			// Show auditors hint if auditorsIds is not empty
			if (this.hasAuditors && tasks_v2_lib_ahaMoments.ahaMoments.shouldShow(tasks_v2_const.Option.AhaAuditorsInCompactFormPopup)) {
				tasks_v2_lib_ahaMoments.ahaMoments.setActive(tasks_v2_const.Option.AhaAuditorsInCompactFormPopup);
				this.$nextTick(() => {
					// Bind to the button element
					this.auditorsHintBindElement = this.$refs.fullCardButtonContainer;
					this.showAuditorsHint = true;
				});
			}
		},
		methods: {
			handleClick() {
				if (this.isUploading) {
					this.highlightFiles();
				} else if (this.isCheckListUploading) {
					this.highlightChecklist();
				} else {
					this.openFullCard();
				}
			},
			highlightFiles() {
				this.hintBindElement = tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).addChipHighlight(tasks_v2_const.TaskField.Files).getChipContainer(tasks_v2_const.TaskField.Files);
				this.showHint();
			},
			highlightChecklist() {
				this.hintBindElement = tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).addChipHighlight(tasks_v2_const.TaskField.CheckList).getChipContainer(tasks_v2_const.TaskField.CheckList);
				this.showHint();
			},
			showHint() {
				const removeHighlight = () => {
					this.isHintShown = false;
					main_core.Event.unbind(window, 'keydown', removeHighlight);
				};
				main_core.Event.bind(window, 'keydown', removeHighlight);
				this.isHintShown = true;
			},
			openFullCard() {
				if (this.isOpening) {
					return;
				}
				this.$emit('update:isOpening', true);
				const features = tasks_v2_core.Core.getParams().features;
				tasks_v2_lib_analytics.analytics.sendOpenFullCard(this.analytics);
				const canOpenFullCard = features.isV2Enabled || main_core.Type.isArray(features.allowedGroups) && features.allowedGroups.includes(this.task.groupId);
				if (canOpenFullCard) {
					main_core.Event.EventEmitter.emit(`${tasks_v2_const.EventName.OpenFullCard}:${this.taskId}`, this.taskId);
				} else {
					main_core.Event.EventEmitter.emit(`${tasks_v2_const.EventName.OpenSliderCard}:${this.taskId}`, {
						task: this.task,
						checkLists: this.checkLists
					});
				}
			},
			closeAuditorsHint() {
				this.showAuditorsHint = false;
				tasks_v2_lib_ahaMoments.ahaMoments.setInactive(tasks_v2_const.Option.AhaAuditorsInCompactFormPopup);
			},
			handleAuditorsHintLinkClick() {
				tasks_v2_lib_ahaMoments.ahaMoments.setShown(tasks_v2_const.Option.AhaAuditorsInCompactFormPopup);
				this.closeAuditorsHint();
			}
		},
		template: `
		<div
			ref="fullCardButtonContainer"
			class="tasks-compact-card-full-button-container"
			:class="{ '--disabled': isDisabled }"
			@click="handleClick"
		>
			<UiButton
				class="tasks-compact-card-full-button"
				:text="loc('TASKS_V2_TCC_FULL_CARD_BTN')"
				:size="ButtonSize.SMALL"
				:style="AirButtonStyle.PLAIN_NO_ACCENT"
				:loading="isOpening"
				:dataset="{taskButtonId: 'full'}"
				:disabled="isDisabled"
			/>
			<Hint
				v-if="showAuditorsHint"
				:bindElement="auditorsHintBindElement"
				@close="closeAuditorsHint"
				:options="auditorsHintOptions"
			>
				<div class="tasks-compact-card-full-button-auditors-hint">
					<div class="tasks-compact-card-full-button-auditors-hint-title">
						{{ loc('TASKS_V2_TCC_AUDITORS_HINT_TITLE') }}
					</div>
					<div class="tasks-compact-card-full-button-auditors-hint-content">
						{{ loc('TASKS_V2_TCC_AUDITORS_HINT_CONTENT') }}
					</div>
					<div
						class="tasks-compact-card-full-button-auditors-hint-link"
						@click.stop="handleAuditorsHintLinkClick"
					>
						{{ loc('TASKS_V2_TCC_AUDITORS_HINT_DO_NOT_SHOW_AGAIN') }}
					</div>
				</div>
			</Hint>
		</div>
		<Hint
			v-if="isHintShown"
			:bindElement="hintBindElement"
			@close="isHintShown = false"
		>
			{{ loc('TASKS_V2_TCC_FILE_IS_UPLOADING') }}
		</Hint>
	`
	};

	// @vue/component
	const App = {
		name: 'TaskCompactCard',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			FieldTitle: tasks_v2_component_fields_title.Title,
			DescriptionInline: tasks_v2_component_fields_description.DescriptionInline,
			Importance: tasks_v2_component_fields_importance.Importance,
			FieldList: tasks_v2_component_elements_fieldList.FieldList,
			UiButton: ui_vue3_components_button.Button,
			AddTaskButton: tasks_v2_component_addTaskButton.AddTaskButton,
			CheckList: tasks_v2_component_fields_checkList.CheckList,
			FullCardButton,
			DropZone: tasks_v2_component_dropZone.DropZone
		},
		mixins: [ui_uploader_tileWidget.DragOverMixin],
		provide() {
			return {
				settings: tasks_v2_core.Core.getParams(),
				analytics: this.analytics,
				cardType: tasks_v2_const.CardType.Compact,
				/** @type { TaskModel } */
				task: ui_vue3.computed(() => tasks_v2_provider_service_taskService.taskService.getStoreTask(this.taskId)),
				/** @type { number | string } */
				taskId: ui_vue3.computed(() => this.taskId),
				/** @type { boolean } */
				isEdit: ui_vue3.computed(() => false),
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
				/**
				 * @type TaskModel
				 */
				type: Object,
				required: true
			},
			analytics: {
				type: Object,
				default: () => ({})
			}
		},
		setup() {
			return {
				ButtonSize: ui_vue3_components_button.ButtonSize,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				Outline: ui_iconSet_api_vue.Outline,
				EntityTypes: tasks_v2_provider_service_fileService.EntityTypes
			};
		},
		data() {
			return {
				taskId: this.id,
				openingFullCard: false,
				isCheckListPopupShown: false,
				creationError: false,
				popupCount: 0
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters({
				titleFieldOffsetHeight: `${tasks_v2_const.Model.Interface}/titleFieldOffsetHeight`,
				currentUserId: `${tasks_v2_const.Model.Interface}/currentUserId`,
				deadlineUserOption: `${tasks_v2_const.Model.Interface}/deadlineUserOption`,
				defaultDeadlineTs: `${tasks_v2_const.Model.Interface}/defaultDeadlineTs`,
				stateFlags: `${tasks_v2_const.Model.Interface}/stateFlags`,
				templateStateFlags: `${tasks_v2_const.Model.Interface}/templateStateFlags`
			}),
			task() {
				return tasks_v2_provider_service_taskService.taskService.getStoreTask(this.taskId);
			},
			isTemplate() {
				return tasks_v2_lib_idUtils.idUtils.isTemplate(this.taskId);
			},
			group() {
				return this.$store.getters[`${tasks_v2_const.Model.Groups}/getById`](this.task.groupId);
			},
			checklist() {
				if (!this.task.checklist) {
					return [];
				}
				return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](this.task.checklist);
			},
			fields() {
				return [{
					title: tasks_v2_component_fields_responsible.responsibleMeta.getTitle(false),
					component: tasks_v2_component_fields_responsible.Responsible,
					props: {
						taskId: this.taskId,
						isSingle: true
					}
				}, {
					title: tasks_v2_component_fields_deadline.deadlineMeta.title,
					component: tasks_v2_component_fields_deadline.Deadline,
					props: {
						taskId: this.taskId,
						isTemplate: this.isTemplate,
						isAutonomous: true,
						isHovered: false
					}
				}, tasks_v2_core.Core.getParams().features.disk && {
					chip: {
						component: tasks_v2_component_fields_files.FilesChip,
						props: {
							taskId: this.taskId
						}
					}
				}, {
					chip: {
						component: tasks_v2_component_fields_checkList.CheckListChip,
						events: {
							showCheckList: this.showCheckListPopup
						}
					}
				}, tasks_v2_core.Core.getParams().features.isProjectsEnabled && {
					chip: {
						component: tasks_v2_component_fields_group.GroupChip
					}
				}].filter(field => field);
			},
			primaryFields() {
				return this.getFields(new WeakMap([[tasks_v2_component_fields_responsible.Responsible, true], [tasks_v2_component_fields_deadline.Deadline, true]]));
			},
			chips() {
				return this.fields.filter(({
					chip
				}) => chip).map(({
					chip
				}) => chip);
			},
			isDiskModuleInstalled() {
				return tasks_v2_core.Core.getParams().features.disk;
			}
		},
		created() {
			const flags = this.isTemplate ? this.templateStateFlags : this.stateFlags;
			this.insert({
				...this.initialTask,
				id: this.taskId,
				creatorId: this.currentUserId,
				responsibleIds: [this.currentUserId],
				deadlineTs: this.initialTask.deadlineTs ?? this.defaultDeadlineTs,
				needsControl: flags.needsControl ?? null,
				matchesWorkTime: flags.matchesWorkTime ?? null,
				allowsTimeTracking: flags.allowsTimeTracking ?? null,
				requireResult: tasks_v2_core.Core.getParams().restrictions.requiredResult.available && (flags.defaultRequireResult ?? false),
				allowsChangeDeadline: this.deadlineUserOption.canChangeDeadline,
				requireDeadlineChangeReason: this.deadlineUserOption.requireDeadlineChangeReason,
				maxDeadlineChangeDate: this.deadlineUserOption.maxDeadlineChangeDate,
				maxDeadlineChanges: this.deadlineUserOption.maxDeadlineChanges
			});
			void tasks_v2_provider_service_fileService.fileService.get(this.taskId).list(this.task.fileIds);
			tasks_v2_lib_analytics.analytics.sendClickCreate(this.analytics, {
				collabId: this.group?.type === tasks_v2_const.GroupType.Collab ? this.group.id : null,
				cardType: tasks_v2_const.CardType.Compact,
				viewersCount: this.initialTask?.auditorsIds?.length ?? 0,
				coexecutorsCount: this.initialTask?.accomplicesIds?.length ?? 0
			});
		},
		mounted() {
			this.resizeObserver = new ResizeObserver(async entries => {
				const title = entries.find(({
					target
				}) => target === this.$refs.title);
				if (title) {
					await this.updateTitleFieldOffsetHeight(title.contentRect.height);
				}
			});
			this.resizeObserver.observe(this.$refs.title);
			this.subscribeEvents();
		},
		beforeUnmount() {
			this.resizeObserver?.disconnect();
			this.unsubscribeEvents();
		},
		unmounted() {
			if (this.openingFullCard === false) {
				this.destroy();
			}
		},
		methods: {
			...ui_vue3_vuex.mapActions(tasks_v2_const.Model.Tasks, ['insert', 'delete']),
			...ui_vue3_vuex.mapActions(tasks_v2_const.Model.Interface, ['updateTitleFieldOffsetHeight']),
			getFields(map) {
				return this.fields.filter(({
					component
				}) => map.get(component));
			},
			close() {
				main_core_events.EventEmitter.emit(`${tasks_v2_const.EventName.CloseCard}:${this.id}`);
			},
			async addTask() {
				const checklists = this.checklist;
				const [id, error] = await tasks_v2_provider_service_taskService.taskService.add({
					task: this.task,
					view: true
				});
				if (!id) {
					this.creationError = true;
					ui_notificationManager.Notifier.notifyViaBrowserProvider({
						id: 'task-notify-add-error',
						text: error.message
					});
					this.sendAddTaskAnalytics(false, checklists);
					return;
				}
				this.taskId = id;
				this.showTaskAddedNotification();
				this.sendAddTaskAnalytics(true, checklists);
				tasks_v2_lib_analytics.analytics.sendDescription(this.analytics, {
					hasDescription: main_core.Type.isStringFilled(this.task?.description),
					hasScroll: this.$refs?.description?.hasScroll(),
					cardType: tasks_v2_const.CardType.Compact
				});
				tasks_v2_provider_service_fileService.fileService.replace(this.id, id);
				main_core_events.EventEmitter.emit(tasks_v2_const.EventName.LegacyTasksTaskEvent, new main_core_events.BaseEvent({
					data: id,
					compatData: ['ADD', {
						task: {
							ID: id
						},
						taskUgly: {
							id
						},
						options: {}
					}]
				}));
				if (!this.isTemplate) {
					tasks_v2_provider_service_viewersService.viewersService.count(this.taskId);
				}
				this.close();
			},
			sendAddTaskAnalytics(isSuccess, checklists) {
				const collabId = this.group?.type === tasks_v2_const.GroupType.Collab ? this.group.id : null;
				const viewersCount = this.task.auditorsIds.length;
				const coexecutorsCount = this.task.accomplicesIds.length;
				if (this.task.templateId) {
					tasks_v2_lib_analytics.analytics.sendAddTask(this.analytics, {
						isSuccess,
						collabId,
						viewersCount,
						coexecutorsCount,
						event: tasks_v2_const.Analytics.Event.PatternTaskCreate,
						cardType: tasks_v2_const.CardType.Compact,
						taskId: this.taskId
					});
				} else if (this.task.parentId) {
					tasks_v2_lib_analytics.analytics.sendAddTask(this.analytics, {
						isSuccess,
						collabId,
						viewersCount,
						coexecutorsCount,
						event: tasks_v2_const.Analytics.Event.SubTaskAdd,
						cardType: tasks_v2_const.CardType.Compact,
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
						viewersCount: this.task.auditorsIds.length,
						checklistCount,
						checklistItemsCount,
						cardType: tasks_v2_const.CardType.Compact,
						taskId: this.taskId
					});
				} else {
					tasks_v2_lib_analytics.analytics.sendAddTask(this.analytics, {
						isSuccess,
						collabId,
						viewersCount,
						coexecutorsCount,
						event: tasks_v2_const.Analytics.Event.TaskCreate,
						cardType: tasks_v2_const.CardType.Compact,
						taskId: this.taskId
					});
				}
			},
			showTaskAddedNotification() {
				const url = tasks_v2_application_taskCard.TaskCard.getUrl(this.taskId);
				BX.UI.Notification.Center.notify({
					id: main_core.Text.getRandom(),
					content: main_core.Loc.getMessage('TASKS_V2_TCC_NOTIFY_TASK_CREATED'),
					actions: [{
						title: main_core.Loc.getMessage('TASKS_V2_TCC_NOTIFY_TASK_DO_VIEW'),
						events: {
							click: (event, balloon) => {
								balloon.close();
								BX.SidePanel.Instance.open(url);
							}
						}
					}]
				});
			},
			handleShowingPopup(event) {
				main_core_events.EventEmitter.emit(`${tasks_v2_const.EventName.ShowOverlay}:${this.taskId}`);
				main_core_events.EventEmitter.emit(`${tasks_v2_const.EventName.AdjustPosition}:${this.taskId}`);
				this.externalPopup = event.popupInstance;
				this.adjustCardPopup(true);
			},
			handleHidingPopup() {
				main_core_events.EventEmitter.emit(`${tasks_v2_const.EventName.HideOverlay}:${this.taskId}`);
				main_core_events.EventEmitter.emit(`${tasks_v2_const.EventName.AdjustPosition}:${this.taskId}`);
				this.externalPopup = null;
			},
			handleResizingPopup() {
				this.adjustCardPopup();
			},
			adjustCardPopup(animate = false) {
				if (!this.externalPopup) {
					main_core_events.EventEmitter.emit(`${tasks_v2_const.EventName.AdjustPosition}:${this.taskId}`);
					return;
				}
				main_core_events.EventEmitter.emit(`${tasks_v2_const.EventName.AdjustPosition}:${this.taskId}`, {
					titleFieldHeight: this.titleFieldOffsetHeight,
					innerPopup: this.externalPopup,
					animate
				});
			},
			showCheckListPopup() {
				this.isCheckListPopupShown = true;
			},
			closeCheckListPopup() {
				this.isCheckListPopupShown = false;
			},
			subscribeEvents() {
				main_core_events.EventEmitter.subscribe('BX.Main.Popup:onShow', this.handlePopupShow);
				main_core.Event.bind(document, 'keydown', this.handleKeyDown, {
					capture: true
				});
			},
			unsubscribeEvents() {
				main_core_events.EventEmitter.unsubscribe('BX.Main.Popup:onShow', this.handlePopupShow);
				main_core.Event.unbind(document, 'keydown', this.handleKeyDown, {
					capture: true
				});
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
				if (this.popupCount > 0) {
					return;
				}
				if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
					void this.$refs.addTaskButton.handleClick();
				}
			},
			destroy() {
				this.delete(this.id);
				tasks_v2_provider_service_fileService.fileService.delete(this.id);
			}
		},
		template: `
		<div v-drop class="tasks-compact-card-container" ref="main">
			<div v-if="task" class="tasks-compact-card" :data-task-id="taskId" data-task-compact>
				<div class="tasks-compact-card-fields">
					<div
						class="tasks-compact-card-fields-title"
						:class="{'--no-gap': task.description.length > 0}"
						ref="title"
					>
						<FieldTitle :disabled="isCheckListPopupShown"/>
						<Importance/>
						<BIcon
							class="tasks-compact-card-fields-close"
							:name="Outline.CROSS_L"
							data-task-button-id="close"
							@click="close"
						/>
					</div>
					<DescriptionInline ref="description"/>
					<div class="tasks-compact-card-fields-list">
						<FieldList :fields="primaryFields"/>
					</div>
					<CheckList
						v-if="isCheckListPopupShown"
						isAutonomous
						@show="handleShowingPopup"
						@close="handleHidingPopup(); closeCheckListPopup();"
						@resize="handleResizingPopup"
					/>
				</div>
				<div class="tasks-compact-card-footer">
					<div class="tasks-compact-card-chips">
						<template v-for="(chip, key) of chips" :key>
							<component
								:is="chip.component"
								v-bind="{ isAutonomous: true, ...chip.props }"
								v-on="chip.events ?? {}"
							/>
						</template>
					</div>
					<div class="tasks-compact-card-buttons">
						<div class="tasks-compact-card-main-buttons">
							<AddTaskButton
								ref="addTaskButton"
								:size="ButtonSize.LARGE"
								v-model:hasError="creationError"
								@addTask="addTask"
							/>
							<UiButton
								:text="loc('TASKS_V2_TCC_CANCEL_BTN')"
								:size="ButtonSize.LARGE"
								:style="AirButtonStyle.PLAIN"
								:dataset="{
									taskButtonId: 'cancel',
								}"
								@click="close"
							/>
						</div>
						<FullCardButton v-model:isOpening="openingFullCard"/>
					</div>
				</div>
			</div>
			<DropZone
				v-if="isDiskModuleInstalled && !isCheckListPopupShown"
				:container="$refs.main || {}"
				:entityId="taskId"
				:entityType="EntityTypes.Task"
				:bottom="18"
			/>
		</div>
	`
	};

	class TaskCompactCard {
		#params;
		#popup;
		#application;
		#handlers;
		#openingFullCard;
		constructor(params = {}) {
			this.#params = params;
			this.#params.taskId ||= main_core.Text.getRandom();
			if (this.#params.taskId === 'template0') {
				this.#params.taskId = tasks_v2_lib_idUtils.idUtils.boxTemplate(main_core.Text.getRandom());
			}
			this.#params.groupId = this.#getInitialGroupId();
		}
		async mount(popup) {
			if (popup.isDestroyed()) {
				return;
			}
			this.#popup = popup;
			await this.#mountApplication(popup.getContentContainer());
			this.#adjustPosition();
			this.#subscribe();
			const dragHandle = main_core.Tag.render`<div class="tasks-compact-card-popup-drag-handle"/>`;
			main_core.Dom.append(dragHandle, popup.getContentContainer());
			this.#popup.setDraggable({
				element: dragHandle,
				restrict: true
			});
		}
		unmount() {
			this.#unmountApplication();
			this.#unsubscribe();
		}
		async #mountApplication(container) {
			await tasks_v2_core.Core.init();
			const {
				taskId,
				analytics,
				url,
				closeCompleteUrl,
				...initialTask
			} = this.#params;
			const application = ui_vue3.BitrixVue.createApp(App, {
				id: taskId,
				initialTask: Object.fromEntries(Object.entries(initialTask).filter(([, value]) => !main_core.Type.isNil(value))),
				analytics
			});
			application.mixin(ui_vue3_mixins_locMixin.locMixin);
			application.use(tasks_v2_core.Core.getStore());
			application.mount(container);
			this.#application = application;
		}
		#unmountApplication() {
			this.#application.unmount();
			if (!this.#openingFullCard) {
				main_core_events.EventEmitter.emit(tasks_v2_const.EventName.CardClosed, this.#params);
			}
		}
		#subscribe() {
			this.#handlers = {
				[`${tasks_v2_const.EventName.CloseCard}:${this.#params.taskId}`]: this.#closeCard,
				[`${tasks_v2_const.EventName.OpenFullCard}:${this.#params.taskId}`]: this.#openFullCard,
				[`${tasks_v2_const.EventName.OpenSliderCard}:${this.#params.taskId}`]: this.#openSliderCard,
				[`${tasks_v2_const.EventName.ShowOverlay}:${this.#params.taskId}`]: this.#showOverlay,
				[`${tasks_v2_const.EventName.HideOverlay}:${this.#params.taskId}`]: this.#hideOverlay,
				[`${tasks_v2_const.EventName.AdjustPosition}:${this.#params.taskId}`]: this.#handleAdjustPosition,
				'BX.Main.Popup:onShow': this.#handlePopupShow
			};
			Object.entries(this.#handlers).forEach(([event, handler]) => main_core_events.EventEmitter.subscribe(event, handler));
		}
		#unsubscribe() {
			Object.entries(this.#handlers).forEach(([event, handler]) => main_core_events.EventEmitter.unsubscribe(event, handler));
		}
		#openFullCard = () => {
			this.#openingFullCard = true;
			this.#closeCard();
			tasks_v2_application_taskCard.TaskCard.showFullCard(this.#params);
		};
		#openSliderCard = baseEvent => {
			const task = baseEvent.getData().task;
			const checkLists = baseEvent.getData().checkLists;
			const data = tasks_v2_provider_service_taskService.TaskMappers.mapModelToSliderData(task, checkLists);
			// Analytic data
			// ta_sec=tasks&ta_sub=list&ta_el=create_button&p1=isDemo_N&p2=user_intranet
			const path = BX.Uri.addParam(tasks_v2_core.Core.getParams().paths.editPath, {
				SCOPE: 'tasks_grid',
				ta_sec: this.#params.analytics?.context,
				ta_sub: this.#params.analytics?.additionalContext,
				ta_el: this.#params.analytics?.element,
				p1: tasks_v2_const.Analytics.Params.IsDemo(tasks_v2_lib_analytics.settings.isDemo),
				p2: tasks_v2_lib_analytics.settings.userType
			});
			BX.SidePanel.Instance.open(path, {
				requestMethod: 'post',
				requestParams: data,
				cacheable: false
			});
			this.#closeCard();
		};
		#closeCard = () => {
			this.#popup.close();
		};
		#showOverlay = () => {
			main_core.Dom.addClass(this.#popup.getPopupContainer(), '--overlay');
		};
		#hideOverlay = () => {
			main_core.Dom.removeClass(this.#popup.getPopupContainer(), '--overlay');
		};
		#handleAdjustPosition = baseEvent => {
			const {
				innerPopup,
				titleFieldHeight,
				animate
			} = baseEvent?.getData() ?? {};
			if (!innerPopup) {
				this.#popup.setOffset({
					offsetTop: 0
				});
				this.#adjustPosition();
				return;
			}
			const innerPopupContainer = innerPopup.getPopupContainer();
			const popupContainer = this.#popup.getPopupContainer();
			const heightDifference = innerPopupContainer.offsetHeight - popupContainer.offsetHeight;
			const popupPaddingTop = 20;
			const offset = titleFieldHeight + heightDifference / 2 + popupPaddingTop * 2;
			main_core.Dom.style(popupContainer, '--overlay-offset-top', `-${offset}px`);
			if (!animate) {
				this.#adjustPosition();
				main_core.Dom.style(popupContainer, 'transition', 'none');
				setTimeout(() => main_core.Dom.style(popupContainer, 'transition', null));
			}
		};
		#adjustPosition() {
			this.#popup.adjustPosition({
				forceBindPosition: true
			});
		}
		#handlePopupShow = event => {
			this.#handlePopupShow.openedPopupsCount ??= 0;
			const popup = event.getCompatData()[0];
			const popupContainer = this.#popup.getPopupContainer();
			const onClose = () => {
				popup.unsubscribe('onClose', onClose);
				popup.unsubscribe('onDestroy', onClose);
				this.#handlePopupShow.openedPopupsCount--;
				if (this.#handlePopupShow.openedPopupsCount === 0) {
					main_core.Dom.removeClass(popupContainer, '--disable-drag');
				}
			};
			popup.subscribe('onClose', onClose);
			popup.subscribe('onDestroy', onClose);
			this.#handlePopupShow.openedPopupsCount++;
			main_core.Dom.addClass(popupContainer, '--disable-drag');
		};
		#getInitialGroupId() {
			if (this.#params.groupId && tasks_v2_core.Core.getParams().currentUser?.type === tasks_v2_model_users.UserTypes.Collaber) {
				const group = tasks_v2_core.Core.getStore()?.getters[`${tasks_v2_const.Model.Groups}/getById`](this.#params.groupId);
				if (group && group.type !== tasks_v2_const.GroupType.Collab) {
					return tasks_v2_core.Core.getParams().defaultCollab?.id;
				}
			}
			return this.#params.groupId || tasks_v2_core.Core.getParams().defaultCollab?.id || undefined;
		}
	}

	exports.TaskCompactCard = TaskCompactCard;

})(this.BX.Tasks.V2.Application = this.BX.Tasks.V2.Application || {}, BX, BX.Event, BX.Vue3, BX.Vue3.Mixins, BX.Tasks.V2.Lib, BX.Tasks.V2.Application, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX.Tasks.V2, BX.Tasks.V2.Const, BX.Tasks.V2.Model, BX.Vue3.Vuex, BX.UI.NotificationManager, BX.UI.Uploader, BX.Vue3.Components, BX.UI.IconSet, window, BX.Tasks.V2.Component, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib);
//# sourceMappingURL=task-compact-card.bundle.js.map
