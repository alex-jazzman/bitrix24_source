/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,ui_vue3_mixins_locMixin,tasks_v2_application_taskCard,tasks_v2_model_users,main_core_events,ui_vue3,ui_vue3_vuex,ui_notificationManager,ui_uploader_tileWidget,ui_iconSet_api_vue,ui_iconSet_outline,tasks_v2_component_addTaskButton,tasks_v2_component_fields_title,tasks_v2_component_fields_importance,tasks_v2_component_fields_description,tasks_v2_component_elements_fieldList,tasks_v2_component_dropZone,tasks_v2_component_fields_responsible,tasks_v2_component_fields_deadline,tasks_v2_component_fields_checkList,tasks_v2_component_fields_files,tasks_v2_component_fields_group,tasks_v2_lib_idUtils,tasks_v2_provider_service_taskService,main_core,ui_vue3_components_button,tasks_v2_core,tasks_v2_const,tasks_v2_component_elements_hint,tasks_v2_lib_fieldHighlighter,tasks_v2_lib_analytics,tasks_v2_lib_ahaMoments,tasks_v2_provider_service_fileService) {
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
	      var _this$task$checklist;
	      return (_this$task$checklist = this.task.checklist) == null ? void 0 : _this$task$checklist.some(itemId => tasks_v2_provider_service_fileService.fileService.get(itemId, tasks_v2_provider_service_fileService.EntityTypes.CheckListItem).isUploading());
	    },
	    hasAuditors() {
	      var _this$task;
	      return Array.isArray((_this$task = this.task) == null ? void 0 : _this$task.auditorsIds) && this.task.auditorsIds.length > 0;
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
	      popupCount: 0,
	      isHovered: false
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      titleFieldOffsetHeight: `${tasks_v2_const.Model.Interface}/titleFieldOffsetHeight`,
	      currentUserId: `${tasks_v2_const.Model.Interface}/currentUserId`,
	      defaultDeadlineTs: `${tasks_v2_const.Model.Interface}/defaultDeadlineTs`,
	      stateFlags: `${tasks_v2_const.Model.Interface}/stateFlags`
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
	          isHovered: this.isHovered
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
	    var _this$initialTask$dea, _this$stateFlags$need, _this$stateFlags$matc, _this$stateFlags$defa, _this$task$fileIds, _this$group;
	    this.insert({
	      ...this.initialTask,
	      id: this.taskId,
	      creatorId: this.currentUserId,
	      responsibleIds: [this.currentUserId],
	      deadlineTs: (_this$initialTask$dea = this.initialTask.deadlineTs) != null ? _this$initialTask$dea : this.defaultDeadlineTs,
	      needsControl: (_this$stateFlags$need = this.stateFlags.needsControl) != null ? _this$stateFlags$need : null,
	      matchesWorkTime: (_this$stateFlags$matc = this.stateFlags.matchesWorkTime) != null ? _this$stateFlags$matc : null,
	      requireResult: (_this$stateFlags$defa = this.stateFlags.defaultRequireResult) != null ? _this$stateFlags$defa : false
	    });
	    if (((_this$task$fileIds = this.task.fileIds) == null ? void 0 : _this$task$fileIds.length) > 0) {
	      void tasks_v2_provider_service_fileService.fileService.get(this.taskId).list(this.task.fileIds);
	    }
	    tasks_v2_lib_analytics.analytics.sendOpenCard(this.analytics, {
	      collabId: ((_this$group = this.group) == null ? void 0 : _this$group.type) === tasks_v2_const.GroupType.Collab ? this.group.id : null
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
	    var _this$resizeObserver;
	    (_this$resizeObserver = this.resizeObserver) == null ? void 0 : _this$resizeObserver.disconnect();
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
	      var _this$task, _this$$refs, _this$$refs$descripti;
	      const [id, error] = await tasks_v2_provider_service_taskService.taskService.add(this.task);
	      if (!id) {
	        this.creationError = true;
	        ui_notificationManager.Notifier.notifyViaBrowserProvider({
	          id: 'task-notify-add-error',
	          text: error.message
	        });
	        this.sendAddTaskAnalytics(false);
	        return;
	      }
	      this.taskId = id;
	      this.sendAddTaskAnalytics(true);
	      tasks_v2_lib_analytics.analytics.sendDescription(this.analytics, {
	        hasDescription: main_core.Type.isStringFilled((_this$task = this.task) == null ? void 0 : _this$task.description),
	        hasScroll: (_this$$refs = this.$refs) == null ? void 0 : (_this$$refs$descripti = _this$$refs.description) == null ? void 0 : _this$$refs$descripti.hasScroll()
	      });
	      tasks_v2_provider_service_fileService.fileService.replace(this.id, id);
	      main_core_events.EventEmitter.emit(tasks_v2_const.EventName.NotifyGrid, new main_core_events.BaseEvent({
	        data: id,
	        compatData: ['ADD', {
	          task: this.task,
	          options: {}
	        }]
	      }));
	      this.close();
	    },
	    sendAddTaskAnalytics(isSuccess) {
	      var _this$group2;
	      const collabId = ((_this$group2 = this.group) == null ? void 0 : _this$group2.type) === tasks_v2_const.GroupType.Collab ? this.group.id : null;
	      const checkLists = this.$store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](this.task.checklist);
	      if (checkLists.length > 0) {
	        const checklistCount = checkLists.filter(({
	          parentId
	        }) => parentId === 0).length;
	        const checklistItemsCount = checkLists.filter(({
	          parentId
	        }) => parentId !== 0).length;
	        tasks_v2_lib_analytics.analytics.sendAddTaskWithCheckList(this.analytics, {
	          isSuccess,
	          collabId,
	          viewersCount: this.task.auditorsIds.length,
	          checklistCount,
	          checklistItemsCount
	        });
	      } else {
	        tasks_v2_lib_analytics.analytics.sendAddTask(this.analytics, {
	          isSuccess,
	          collabId,
	          viewersCount: this.task.auditorsIds.length,
	          coexecutorsCount: this.task.accomplicesIds.length
	        });
	      }
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
	        this.$refs.addTaskButton.handleClick();
	      } else if (event.key === 'Escape') {
	        setTimeout(() => this.close());
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
					<div
						class="tasks-compact-card-fields-list"
						@mouseover="isHovered = true"
						@mouseleave="isHovered = false"
					>
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

	let _ = t => t,
	  _t;
	var _params = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("params");
	var _popup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popup");
	var _application = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("application");
	var _handlers = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handlers");
	var _openingFullCard = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openingFullCard");
	var _mountApplication = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mountApplication");
	var _unmountApplication = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("unmountApplication");
	var _subscribe = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("subscribe");
	var _unsubscribe = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("unsubscribe");
	var _openFullCard = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openFullCard");
	var _openSliderCard = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openSliderCard");
	var _closeCard = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("closeCard");
	var _showOverlay = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showOverlay");
	var _hideOverlay = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hideOverlay");
	var _handleAdjustPosition = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleAdjustPosition");
	var _adjustPosition = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("adjustPosition");
	var _handlePopupShow = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handlePopupShow");
	var _getInitialGroupId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getInitialGroupId");
	class TaskCompactCard {
	  constructor(params = {}) {
	    var _babelHelpers$classPr6;
	    Object.defineProperty(this, _getInitialGroupId, {
	      value: _getInitialGroupId2
	    });
	    Object.defineProperty(this, _adjustPosition, {
	      value: _adjustPosition2
	    });
	    Object.defineProperty(this, _unsubscribe, {
	      value: _unsubscribe2
	    });
	    Object.defineProperty(this, _subscribe, {
	      value: _subscribe2
	    });
	    Object.defineProperty(this, _unmountApplication, {
	      value: _unmountApplication2
	    });
	    Object.defineProperty(this, _mountApplication, {
	      value: _mountApplication2
	    });
	    Object.defineProperty(this, _params, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _popup, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _application, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _handlers, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _openingFullCard, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _openFullCard, {
	      writable: true,
	      value: () => {
	        babelHelpers.classPrivateFieldLooseBase(this, _openingFullCard)[_openingFullCard] = true;
	        babelHelpers.classPrivateFieldLooseBase(this, _closeCard)[_closeCard]();
	        tasks_v2_application_taskCard.TaskCard.showFullCard(babelHelpers.classPrivateFieldLooseBase(this, _params)[_params]);
	      }
	    });
	    Object.defineProperty(this, _openSliderCard, {
	      writable: true,
	      value: baseEvent => {
	        var _babelHelpers$classPr, _babelHelpers$classPr2, _babelHelpers$classPr3;
	        const task = baseEvent.getData().task;
	        const checkLists = baseEvent.getData().checkLists;
	        const data = tasks_v2_provider_service_taskService.TaskMappers.mapModelToSliderData(task, checkLists);
	        // Analytic data
	        // ta_sec=tasks&ta_sub=list&ta_el=create_button&p1=isDemo_N&p2=user_intranet
	        const path = BX.Uri.addParam(tasks_v2_core.Core.getParams().paths.editPath, {
	          SCOPE: 'tasks_grid',
	          ta_sec: (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].analytics) == null ? void 0 : _babelHelpers$classPr.context,
	          ta_sub: (_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].analytics) == null ? void 0 : _babelHelpers$classPr2.additionalContext,
	          ta_el: (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].analytics) == null ? void 0 : _babelHelpers$classPr3.element,
	          p1: tasks_v2_lib_analytics.settings.isDemo ? 'isDemo_Y' : 'isDemo_N',
	          p2: tasks_v2_lib_analytics.settings.userType
	        });
	        BX.SidePanel.Instance.open(path, {
	          requestMethod: 'post',
	          requestParams: data,
	          cacheable: false
	        });
	        babelHelpers.classPrivateFieldLooseBase(this, _closeCard)[_closeCard]();
	      }
	    });
	    Object.defineProperty(this, _closeCard, {
	      writable: true,
	      value: () => {
	        babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].close();
	      }
	    });
	    Object.defineProperty(this, _showOverlay, {
	      writable: true,
	      value: () => {
	        main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].getPopupContainer(), '--overlay');
	      }
	    });
	    Object.defineProperty(this, _hideOverlay, {
	      writable: true,
	      value: () => {
	        main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].getPopupContainer(), '--overlay');
	      }
	    });
	    Object.defineProperty(this, _handleAdjustPosition, {
	      writable: true,
	      value: baseEvent => {
	        var _baseEvent$getData;
	        const {
	          innerPopup,
	          titleFieldHeight,
	          animate
	        } = (_baseEvent$getData = baseEvent == null ? void 0 : baseEvent.getData()) != null ? _baseEvent$getData : {};
	        if (!innerPopup) {
	          babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].setOffset({
	            offsetTop: 0
	          });
	          babelHelpers.classPrivateFieldLooseBase(this, _adjustPosition)[_adjustPosition]();
	          return;
	        }
	        const innerPopupContainer = innerPopup.getPopupContainer();
	        const popupContainer = babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].getPopupContainer();
	        const heightDifference = innerPopupContainer.offsetHeight - popupContainer.offsetHeight;
	        const popupPaddingTop = 20;
	        const offset = titleFieldHeight + heightDifference / 2 + popupPaddingTop * 2;
	        main_core.Dom.style(popupContainer, '--overlay-offset-top', `-${offset}px`);
	        if (!animate) {
	          babelHelpers.classPrivateFieldLooseBase(this, _adjustPosition)[_adjustPosition]();
	          main_core.Dom.style(popupContainer, 'transition', 'none');
	          setTimeout(() => main_core.Dom.style(popupContainer, 'transition', null));
	        }
	      }
	    });
	    Object.defineProperty(this, _handlePopupShow, {
	      writable: true,
	      value: event => {
	        var _babelHelpers$classPr4, _babelHelpers$classPr5;
	        (_babelHelpers$classPr5 = (_babelHelpers$classPr4 = babelHelpers.classPrivateFieldLooseBase(this, _handlePopupShow)[_handlePopupShow]).openedPopupsCount) != null ? _babelHelpers$classPr5 : _babelHelpers$classPr4.openedPopupsCount = 0;
	        const popup = event.getCompatData()[0];
	        const popupContainer = babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].getPopupContainer();
	        const onClose = () => {
	          popup.unsubscribe('onClose', onClose);
	          popup.unsubscribe('onDestroy', onClose);
	          babelHelpers.classPrivateFieldLooseBase(this, _handlePopupShow)[_handlePopupShow].openedPopupsCount--;
	          if (babelHelpers.classPrivateFieldLooseBase(this, _handlePopupShow)[_handlePopupShow].openedPopupsCount === 0) {
	            main_core.Dom.removeClass(popupContainer, '--disable-drag');
	          }
	        };
	        popup.subscribe('onClose', onClose);
	        popup.subscribe('onDestroy', onClose);
	        babelHelpers.classPrivateFieldLooseBase(this, _handlePopupShow)[_handlePopupShow].openedPopupsCount++;
	        main_core.Dom.addClass(popupContainer, '--disable-drag');
	      }
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _params)[_params] = params;
	    (_babelHelpers$classPr6 = babelHelpers.classPrivateFieldLooseBase(this, _params)[_params]).taskId || (_babelHelpers$classPr6.taskId = main_core.Text.getRandom());
	    if (babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId === 'template0') {
	      babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId = tasks_v2_lib_idUtils.idUtils.boxTemplate(main_core.Text.getRandom());
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].groupId = babelHelpers.classPrivateFieldLooseBase(this, _getInitialGroupId)[_getInitialGroupId]();
	  }
	  async mount(popup) {
	    babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup] = popup;
	    await babelHelpers.classPrivateFieldLooseBase(this, _mountApplication)[_mountApplication](popup.getContentContainer());
	    babelHelpers.classPrivateFieldLooseBase(this, _adjustPosition)[_adjustPosition]();
	    babelHelpers.classPrivateFieldLooseBase(this, _subscribe)[_subscribe]();
	    const dragHandle = main_core.Tag.render(_t || (_t = _`<div class="tasks-compact-card-popup-drag-handle"/>`));
	    main_core.Dom.append(dragHandle, popup.getContentContainer());
	    babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].setDraggable({
	      element: dragHandle,
	      restrict: true
	    });
	  }
	  unmount() {
	    babelHelpers.classPrivateFieldLooseBase(this, _unmountApplication)[_unmountApplication]();
	    babelHelpers.classPrivateFieldLooseBase(this, _unsubscribe)[_unsubscribe]();
	  }
	}
	async function _mountApplication2(container) {
	  await tasks_v2_core.Core.init();
	  const {
	    taskId,
	    analytics,
	    url,
	    closeCompleteUrl,
	    ...initialTask
	  } = babelHelpers.classPrivateFieldLooseBase(this, _params)[_params];
	  const application = ui_vue3.BitrixVue.createApp(App, {
	    id: taskId,
	    initialTask: Object.fromEntries(Object.entries(initialTask).filter(([, value]) => !main_core.Type.isNil(value))),
	    analytics
	  });
	  application.mixin(ui_vue3_mixins_locMixin.locMixin);
	  application.use(tasks_v2_core.Core.getStore());
	  application.mount(container);
	  babelHelpers.classPrivateFieldLooseBase(this, _application)[_application] = application;
	}
	function _unmountApplication2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _application)[_application].unmount();
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _openingFullCard)[_openingFullCard]) {
	    main_core_events.EventEmitter.emit(tasks_v2_const.EventName.CardClosed, babelHelpers.classPrivateFieldLooseBase(this, _params)[_params]);
	  }
	}
	function _subscribe2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _handlers)[_handlers] = {
	    [`${tasks_v2_const.EventName.CloseCard}:${babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId}`]: babelHelpers.classPrivateFieldLooseBase(this, _closeCard)[_closeCard],
	    [`${tasks_v2_const.EventName.OpenFullCard}:${babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId}`]: babelHelpers.classPrivateFieldLooseBase(this, _openFullCard)[_openFullCard],
	    [`${tasks_v2_const.EventName.OpenSliderCard}:${babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId}`]: babelHelpers.classPrivateFieldLooseBase(this, _openSliderCard)[_openSliderCard],
	    [`${tasks_v2_const.EventName.ShowOverlay}:${babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId}`]: babelHelpers.classPrivateFieldLooseBase(this, _showOverlay)[_showOverlay],
	    [`${tasks_v2_const.EventName.HideOverlay}:${babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId}`]: babelHelpers.classPrivateFieldLooseBase(this, _hideOverlay)[_hideOverlay],
	    [`${tasks_v2_const.EventName.AdjustPosition}:${babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId}`]: babelHelpers.classPrivateFieldLooseBase(this, _handleAdjustPosition)[_handleAdjustPosition],
	    'BX.Main.Popup:onShow': babelHelpers.classPrivateFieldLooseBase(this, _handlePopupShow)[_handlePopupShow]
	  };
	  Object.entries(babelHelpers.classPrivateFieldLooseBase(this, _handlers)[_handlers]).forEach(([event, handler]) => main_core_events.EventEmitter.subscribe(event, handler));
	}
	function _unsubscribe2() {
	  Object.entries(babelHelpers.classPrivateFieldLooseBase(this, _handlers)[_handlers]).forEach(([event, handler]) => main_core_events.EventEmitter.unsubscribe(event, handler));
	}
	function _adjustPosition2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].adjustPosition({
	    forceBindPosition: true
	  });
	}
	function _getInitialGroupId2() {
	  var _Core$getParams$curre, _Core$getParams$defau2;
	  if (babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].groupId && ((_Core$getParams$curre = tasks_v2_core.Core.getParams().currentUser) == null ? void 0 : _Core$getParams$curre.type) === tasks_v2_model_users.UserTypes.Collaber) {
	    var _Core$getStore;
	    const group = (_Core$getStore = tasks_v2_core.Core.getStore()) == null ? void 0 : _Core$getStore.getters[`${tasks_v2_const.Model.Groups}/getById`](babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].groupId);
	    if (group && group.type !== tasks_v2_const.GroupType.Collab) {
	      var _Core$getParams$defau;
	      return (_Core$getParams$defau = tasks_v2_core.Core.getParams().defaultCollab) == null ? void 0 : _Core$getParams$defau.id;
	    }
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].groupId || ((_Core$getParams$defau2 = tasks_v2_core.Core.getParams().defaultCollab) == null ? void 0 : _Core$getParams$defau2.id) || undefined;
	}

	exports.TaskCompactCard = TaskCompactCard;

}((this.BX.Tasks.V2.Application = this.BX.Tasks.V2.Application || {}),BX.Vue3.Mixins,BX.Tasks.V2.Application,BX.Tasks.V2.Model,BX.Event,BX.Vue3,BX.Vue3.Vuex,BX.UI.NotificationManager,BX.UI.Uploader,BX.UI.IconSet,BX,BX.Tasks.V2.Component,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX,BX.Vue3.Components,BX.Tasks.V2,BX.Tasks.V2.Const,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service));
//# sourceMappingURL=task-compact-card.bundle.js.map
