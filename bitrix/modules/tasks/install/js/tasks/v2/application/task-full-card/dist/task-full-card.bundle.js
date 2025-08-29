/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,ui_vue3,ui_vue3_mixins_locMixin,tasks_v2_application_taskCard,tasks_v2_component_elements_chip,tasks_v2_component_elements_fieldList,tasks_v2_component_fields_title,tasks_v2_component_fields_importance,tasks_v2_component_fields_description,tasks_v2_component_fields_creator,tasks_v2_component_fields_deadline,tasks_v2_component_fields_status,tasks_v2_component_fields_files,tasks_v2_component_fields_checkList,tasks_v2_component_fields_group,tasks_v2_component_fields_flow,tasks_v2_component_fields_accomplices,tasks_v2_component_fields_auditors,tasks_v2_provider_service_fileService,tasks_v2_provider_service_checkListService,main_core_events,im_public,im_v2_application_integration_task,tasks_v2_core,tasks_v2_component_addTaskButton,ui_vue3_components_button,main_core,ui_vue3_vuex,ui_vue3_components_menu,ui_iconSet_api_vue,ui_iconSet_api_core,ui_iconSet_outline,tasks_v2_const,tasks_v2_component_fields_responsible,tasks_v2_lib_entitySelectorDialog,tasks_v2_provider_service_taskService) {
	'use strict';

	// @vue/component
	const Chat = {
	  name: 'TaskFullCardChat',
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  computed: {
	    task() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/getById`](this.taskId);
	    }
	  },
	  watch: {
	    taskId() {
	      void this.openChat();
	    }
	  },
	  mounted() {
	    void this.openChat();
	  },
	  methods: {
	    async openChat() {
	      var _this$app, _this$app2;
	      (_this$app = this.app) == null ? void 0 : _this$app.bitrixVue.unmount();
	      (_this$app2 = this.app) != null ? _this$app2 : this.app = await im_public.Messenger.initApplication('task');
	      if (this.taskId > 0) {
	        void this.app.mount({
	          rootContainer: this.$el,
	          chatId: this.task.chatId,
	          taskId: this.taskId,
	          type: tasks_v2_core.Core.getParams().chatType
	        });
	      } else {
	        await this.app.mountPlaceholder({
	          rootContainer: this.$el,
	          taskId: this.taskId
	        });
	        main_core_events.EventEmitter.emit('tasks:card:onMembersCountChange', {
	          taskId: this.taskId,
	          userCounter: 1
	        });
	      }
	    }
	  },
	  template: `
		<div class="tasks-full-card-chat"></div>
	`
	};

	// @vue/component
	const FooterCreate = {
	  components: {
	    UiButton: ui_vue3_components_button.Button,
	    AddTaskButton: tasks_v2_component_addTaskButton.AddTaskButton
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  emits: ['addTask'],
	  setup() {
	    return {
	      AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
	      ButtonSize: ui_vue3_components_button.ButtonSize
	    };
	  },
	  computed: {
	    isTemplateEnabled() {
	      return tasks_v2_core.Core.getParams().features.isTemplateEnabled;
	    }
	  },
	  methods: {
	    close() {
	      main_core.Event.EventEmitter.emit(tasks_v2_const.EventName.CloseFullCard);
	    }
	  },
	  template: `
		<div class="tasks-full-card-footer-create">
			<AddTaskButton :taskId="taskId" @addTask="$emit('addTask')"/>
			<UiButton
				:text="loc('TASKS_V2_TASK_FULL_CARD_CANCEL')"
				:size="ButtonSize.LARGE"
				:style="AirButtonStyle.PLAIN"
				data-task-cancel-button
				@click="close"
			/>
			<UiButton
				v-if="isTemplateEnabled"
				class="tasks-full-card-footer-template-button"
				:text="loc('TASKS_V2_TASK_FULL_CARD_TEMPLATES')"
				:size="ButtonSize.SMALL"
				:style="AirButtonStyle.PLAIN_NO_ACCENT"
				:dropdown="true"
			/>
		</div>
	`
	};

	// @vue/component
	const More = {
	  name: 'TaskFullCardMore',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    BMenu: ui_vue3_components_menu.BMenu
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_core.Outline
	    };
	  },
	  data() {
	    return {
	      isMenuShown: false
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      currentUserId: `${tasks_v2_const.Model.Interface}/currentUserId`
	    }),
	    task() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/getById`](this.taskId);
	    },
	    preselected() {
	      return [['user', this.task.responsibleId || this.currentUserId]];
	    },
	    isCreator() {
	      return this.currentUserId === this.task.creatorId;
	    },
	    isResponsible() {
	      return this.currentUserId === this.task.responsibleId;
	    },
	    menuOptions() {
	      return () => ({
	        id: 'tasks-full-card-footer-more-menu',
	        bindElement: this.$refs.button.$el,
	        items: this.menuItems
	      });
	    },
	    menuItems() {
	      const statuses = {
	        [tasks_v2_const.TaskStatus.Pending]: {
	          [this.isResponsible]: [this.getCompleteItem(), this.getDefferItem(), this.getDelegateItem()],
	          [this.isCreator]: [this.getDefferItem(), this.getDelegateItem(), this.getDeleteItem()],
	          [this.isResponsible && this.isCreator]: [this.getCompleteItem(), this.getDefferItem(), this.getDelegateItem(), this.getDeleteItem()]
	        },
	        [tasks_v2_const.TaskStatus.InProgress]: {
	          [this.isResponsible]: [this.getPauseItem(), this.getDefferItem(), this.getDelegateItem()],
	          [this.isCreator]: [this.getDefferItem(), this.getDelegateItem(), this.getDeleteItem()],
	          [this.isResponsible && this.isCreator]: [this.getPauseItem(), this.getDefferItem(), this.getDelegateItem(), this.getDeleteItem()]
	        },
	        [tasks_v2_const.TaskStatus.Deferred]: {
	          [this.isResponsible]: [this.getCompleteItem(), this.getDelegateItem()],
	          [this.isCreator]: [this.getCompleteItem(), this.getDelegateItem(), this.getDeleteItem()]
	        },
	        [tasks_v2_const.TaskStatus.SupposedlyCompleted]: {
	          [this.isResponsible]: [this.getFixItem(), this.getDelegateItem()],
	          [this.isCreator]: [this.getDisapproveItem(), this.getDelegateItem(), this.getDeleteItem()],
	          [this.isResponsible && this.isCreator]: [this.getCompleteItem(), this.getDelegateItem(), this.getDeleteItem()]
	        },
	        [tasks_v2_const.TaskStatus.Completed]: {
	          [this.isCreator]: [this.getRenewItem(), this.getDeleteItem()]
	        }
	      };
	      return statuses[this.task.status].true;
	    }
	  },
	  methods: {
	    handleClick() {
	      this.isMenuShown = true;
	    },
	    getDefferItem() {
	      if (!this.task.rights.defer) {
	        return null;
	      }
	      return {
	        title: this.loc('TASKS_V2_TASK_FULL_CARD_DEFER'),
	        icon: ui_iconSet_api_core.Outline.PAUSE_L,
	        onClick: () => tasks_v2_provider_service_taskService.taskService.defer(this.taskId)
	      };
	    },
	    getPauseItem() {
	      if (!this.task.rights.pause) {
	        return null;
	      }
	      return {
	        title: this.loc('TASKS_V2_TASK_FULL_CARD_PAUSE'),
	        icon: ui_iconSet_api_core.Outline.STOP_L,
	        onClick: () => tasks_v2_provider_service_taskService.taskService.pause(this.taskId)
	      };
	    },
	    getRenewItem() {
	      if (!this.task.rights.renew) {
	        return null;
	      }
	      return {
	        title: this.loc('TASKS_V2_TASK_FULL_CARD_RENEW'),
	        icon: ui_iconSet_api_core.Outline.UNDO,
	        onClick: () => tasks_v2_provider_service_taskService.taskService.renew(this.taskId)
	      };
	    },
	    getFixItem() {
	      if (!this.task.rights.renew) {
	        return null;
	      }
	      return {
	        title: this.loc('TASKS_V2_TASK_FULL_CARD_FIX'),
	        icon: ui_iconSet_api_core.Outline.UNDO,
	        onClick: () => tasks_v2_provider_service_taskService.taskService.renew(this.taskId)
	      };
	    },
	    getDisapproveItem() {
	      if (!this.task.rights.disapprove) {
	        return null;
	      }
	      return {
	        title: this.loc('TASKS_V2_TASK_FULL_CARD_DISAPPROVE'),
	        icon: ui_iconSet_api_core.Outline.UNDO,
	        onClick: () => tasks_v2_provider_service_taskService.taskService.disapprove(this.taskId)
	      };
	    },
	    getCompleteItem() {
	      if (!this.task.rights.complete) {
	        return null;
	      }
	      return {
	        title: this.loc('TASKS_V2_TASK_FULL_CARD_COMPLETE'),
	        icon: ui_iconSet_api_core.Outline.SENDED,
	        onClick: () => tasks_v2_provider_service_taskService.taskService.complete(this.taskId)
	      };
	    },
	    getDelegateItem() {
	      if (!this.task.rights.delegate) {
	        return null;
	      }
	      return {
	        title: this.loc('TASKS_V2_TASK_FULL_CARD_DELEGATE'),
	        icon: ui_iconSet_api_core.Outline.DELEGATE,
	        onClick: () => {
	          var _this$dialog;
	          const onItemChangeDebounced = main_core.Runtime.debounce(this.handleDelegateSelect, 10, this);
	          (_this$dialog = this.dialog) != null ? _this$dialog : this.dialog = new tasks_v2_lib_entitySelectorDialog.EntitySelectorDialog({
	            ...tasks_v2_component_fields_responsible.responsibleMeta.dialogOptions(this.$options.name),
	            preselectedItems: this.preselected,
	            events: {
	              'Item:onSelect': onItemChangeDebounced,
	              'Item:onDeselect': onItemChangeDebounced
	            }
	          });
	          this.dialog.selectItemsByIds(this.preselected);
	          this.dialog.showTo(this.$refs.button.$el);
	        }
	      };
	    },
	    handleDelegateSelect() {
	      var _this$dialog$getSelec, _this$dialog$getSelec2;
	      const responsibleId = (_this$dialog$getSelec = (_this$dialog$getSelec2 = this.dialog.getSelectedItems()[0]) == null ? void 0 : _this$dialog$getSelec2.getId()) != null ? _this$dialog$getSelec : 0;
	      void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	        responsibleId
	      });
	    },
	    getDeleteItem() {
	      if (!this.task.rights.remove) {
	        return null;
	      }
	      return {
	        design: ui_vue3_components_menu.MenuItemDesign.Alert,
	        title: this.loc('TASKS_V2_TASK_FULL_CARD_DELETE'),
	        icon: ui_iconSet_api_core.Outline.TRASHCAN,
	        onClick: () => {
	          void tasks_v2_provider_service_taskService.taskService.delete(this.taskId);
	          main_core.Event.EventEmitter.emit(tasks_v2_const.EventName.CloseFullCard);
	        }
	      };
	    }
	  },
	  template: `
		<BIcon
			v-if="menuItems"
			class="tasks-full-card-footer-more"
			:name="Outline.MORE_L"
			data-task-more-button
			ref="button"
			@click="handleClick"
		/>
		<BMenu v-if="isMenuShown" :options="menuOptions()" @close="isMenuShown = false"/>
	`
	};

	// @vue/component
	const FooterEdit = {
	  components: {
	    UiButton: ui_vue3_components_button.Button,
	    BIcon: ui_iconSet_api_vue.BIcon,
	    More
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  setup() {
	    return {
	      AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
	      ButtonSize: ui_vue3_components_button.ButtonSize,
	      ButtonIcon: ui_vue3_components_button.ButtonIcon,
	      Outline: ui_iconSet_api_core.Outline,
	      TaskStatus: tasks_v2_const.TaskStatus
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      currentUserId: `${tasks_v2_const.Model.Interface}/currentUserId`
	    }),
	    task() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/getById`](this.taskId);
	    },
	    isCreator() {
	      return this.currentUserId === this.task.creatorId;
	    },
	    isResponsible() {
	      return this.currentUserId === this.task.responsibleId;
	    },
	    statusButton() {
	      const statuses = {
	        [tasks_v2_const.TaskStatus.Pending]: {
	          [this.isCreator]: this.getCompleteButton(),
	          [this.isResponsible]: this.getStartButton()
	        },
	        [tasks_v2_const.TaskStatus.InProgress]: {
	          [this.isResponsible]: this.getCompleteButton(),
	          [this.isCreator]: this.getCompleteButton()
	        },
	        [tasks_v2_const.TaskStatus.Deferred]: {
	          [this.isResponsible]: this.getRenewButton(),
	          [this.isCreator]: this.getRenewButton()
	        },
	        [tasks_v2_const.TaskStatus.SupposedlyCompleted]: {
	          [this.isResponsible]: this.getReviewButton(),
	          [this.isCreator]: this.getApproveButton()
	        },
	        [tasks_v2_const.TaskStatus.Completed]: {
	          [this.isResponsible && !this.isCreator]: this.getRenewButton(ui_vue3_components_button.AirButtonStyle.PLAIN)
	        }
	      };
	      return statuses[this.task.status].true;
	    }
	  },
	  methods: {
	    getStartButton() {
	      if (!this.task.rights.start) {
	        return null;
	      }
	      return {
	        text: this.loc('TASKS_V2_TASK_FULL_CARD_START'),
	        onClick: () => tasks_v2_provider_service_taskService.taskService.start(this.taskId)
	      };
	    },
	    getCompleteButton() {
	      if (!this.task.rights.complete) {
	        return null;
	      }
	      return {
	        text: this.loc('TASKS_V2_TASK_FULL_CARD_COMPLETE'),
	        onClick: () => tasks_v2_provider_service_taskService.taskService.complete(this.taskId)
	      };
	    },
	    getRenewButton(style) {
	      if (!this.task.rights.renew) {
	        return null;
	      }
	      return {
	        text: this.loc('TASKS_V2_TASK_FULL_CARD_RENEW'),
	        style,
	        onClick: () => tasks_v2_provider_service_taskService.taskService.renew(this.taskId)
	      };
	    },
	    getReviewButton() {
	      return {
	        text: this.loc('TASKS_V2_TASK_FULL_CARD_ON_REVIEW'),
	        disabled: true
	      };
	    },
	    getApproveButton() {
	      if (!this.task.rights.approve) {
	        return null;
	      }
	      return {
	        text: this.loc('TASKS_V2_TASK_FULL_CARD_APPROVE'),
	        onClick: () => tasks_v2_provider_service_taskService.taskService.complete(this.taskId)
	      };
	    }
	  },
	  template: `
		<div class="tasks-full-card-footer-edit">
			<UiButton
				v-if="statusButton"
				:text="statusButton.text"
				:size="ButtonSize.LARGE"
				:style="statusButton.style ?? AirButtonStyle.FILLED"
				:disabled="statusButton.disabled ?? false"
				data-task-status-button
				@click="statusButton.onClick"
			/>
			<More :taskId="taskId"/>
			<div class="tasks-full-card-footer-actions">
				<div class="tasks-full-card-footer-reaction">
					<BIcon :name="Outline.LIKE"/>
					<div class="tasks-full-card-footer-reaction-text">Нравится</div>
				</div>
				<div class="tasks-full-card-footer-views">
					<BIcon :name="Outline.OBSERVER"/>
					<div class="tasks-full-card-footer-views-text">1</div>
				</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const App = {
	  name: 'TaskFullCard',
	  components: {
	    FieldTitle: tasks_v2_component_fields_title.Title,
	    Importance: tasks_v2_component_fields_importance.Importance,
	    DescriptionField: tasks_v2_component_fields_description.DescriptionField,
	    DescriptionSheet: tasks_v2_component_fields_description.DescriptionSheet,
	    Files: tasks_v2_component_fields_files.Files,
	    FilesSheet: tasks_v2_component_fields_files.FilesSheet,
	    CheckList: tasks_v2_component_fields_checkList.CheckList,
	    FieldList: tasks_v2_component_elements_fieldList.FieldList,
	    Chip: tasks_v2_component_elements_chip.Chip,
	    Chat,
	    FooterCreate,
	    FooterEdit
	  },
	  provide() {
	    return {
	      analytics: this.analytics,
	      cardType: tasks_v2_const.CardType.Full
	    };
	  },
	  props: {
	    id: {
	      type: [Number, String],
	      default: () => main_core.Text.getRandom()
	    },
	    analytics: {
	      type: Object,
	      default: () => ({})
	    }
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_core.Outline,
	      resizeObserver: null
	    };
	  },
	  data() {
	    return {
	      taskId: this.id,
	      isBottomSheetShown: false,
	      isFilesSheetShown: false,
	      isCheckListSheetShown: false,
	      chipsEventHandlers: {
	        showCheckList: this.openCheckList
	      },
	      checkListId: 0,
	      files: tasks_v2_provider_service_fileService.fileService.get(this.id).getFiles()
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      currentUserId: `${tasks_v2_const.Model.Interface}/currentUserId`
	    }),
	    wasAccomplicesFilled() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/wasFieldFilled`](this.taskId, tasks_v2_component_fields_accomplices.accomplicesMeta.id);
	    },
	    wasAuditorsFilled() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/wasFieldFilled`](this.taskId, tasks_v2_component_fields_auditors.auditorsMeta.id);
	    },
	    wasFlowFilled() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/wasFieldFilled`](this.taskId, tasks_v2_component_fields_flow.flowMeta.id);
	    },
	    wasGroupFilled() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/wasFieldFilled`](this.taskId, tasks_v2_component_fields_group.groupMeta.id);
	    },
	    wasFilesFilled() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/wasFieldFilled`](this.taskId, tasks_v2_component_fields_files.filesMeta.id);
	    },
	    task() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/getById`](this.taskId);
	    },
	    checkLists() {
	      var _this$task;
	      return (_this$task = this.task) != null && _this$task.checklist ? this.$store.getters[`${tasks_v2_const.Model.CheckList}/getByIds`](this.task.checklist) : [];
	    },
	    isEdit() {
	      return main_core.Type.isNumber(this.taskId) && this.taskId > 0;
	    },
	    fields() {
	      const fields = [{
	        title: tasks_v2_component_fields_creator.creatorMeta.title,
	        component: tasks_v2_component_fields_creator.Creator,
	        props: {
	          taskId: this.taskId,
	          context: this.$options.name,
	          selectorWithActionMenu: this.isEdit
	        }
	      }, {
	        title: tasks_v2_component_fields_responsible.responsibleMeta.title,
	        component: tasks_v2_component_fields_responsible.Responsible,
	        props: {
	          taskId: this.taskId,
	          context: this.$options.name,
	          selectorWithActionMenu: this.isEdit
	        }
	      }, {
	        title: tasks_v2_component_fields_deadline.deadlineMeta.title,
	        component: tasks_v2_component_fields_deadline.Deadline
	      }, {
	        title: tasks_v2_component_fields_status.statusMeta.title,
	        component: tasks_v2_component_fields_status.Status,
	        withSeparator: true
	      }, {
	        title: tasks_v2_component_fields_files.filesMeta.title,
	        component: tasks_v2_component_fields_files.Files,
	        chip: tasks_v2_component_fields_files.FilesChip
	      }, {
	        title: tasks_v2_component_fields_checkList.checkListMeta.title,
	        component: tasks_v2_component_fields_checkList.CheckList,
	        chip: tasks_v2_component_fields_checkList.CheckListChip
	      }, {
	        title: tasks_v2_component_fields_group.groupMeta.getTitle(this.task.groupId),
	        component: tasks_v2_component_fields_group.Group,
	        chip: tasks_v2_component_fields_group.GroupChip,
	        isEnabled: tasks_v2_core.Core.getParams().features.isProjectsEnabled
	      }, {
	        title: tasks_v2_component_fields_accomplices.accomplicesMeta.title,
	        component: tasks_v2_component_fields_accomplices.Accomplices,
	        chip: tasks_v2_component_fields_accomplices.AccomplicesChip
	      }, {
	        title: tasks_v2_component_fields_auditors.auditorsMeta.title,
	        component: tasks_v2_component_fields_auditors.Auditors,
	        chip: tasks_v2_component_fields_auditors.AuditorsChip,
	        withSeparator: this.wasAccomplicesFilled
	      }, {
	        title: tasks_v2_component_fields_flow.flowMeta.title,
	        component: tasks_v2_component_fields_flow.Flow,
	        chip: tasks_v2_component_fields_flow.FlowChip,
	        withSeparator: true,
	        isEnabled: tasks_v2_core.Core.getParams().features.isFlowEnabled
	      }];

	      /* eslint-disable no-param-reassign */
	      fields.forEach(field => {
	        var _field$props;
	        (_field$props = field.props) != null ? _field$props : field.props = {};
	        field.props.taskId = this.taskId;
	      });
	      return fields;
	    },
	    primaryFields() {
	      const primaryFields = new Set([tasks_v2_component_fields_creator.Creator, tasks_v2_component_fields_responsible.Responsible, tasks_v2_component_fields_deadline.Deadline, tasks_v2_component_fields_status.Status]);
	      return this.fields.filter(({
	        component
	      }) => primaryFields.has(component));
	    },
	    projectFields() {
	      const projectFields = new Set();
	      if (this.wasGroupFilled) {
	        projectFields.add(tasks_v2_component_fields_group.Group);
	      }
	      if (this.wasFlowFilled) {
	        projectFields.add(tasks_v2_component_fields_flow.Flow);
	      }
	      return this.fields.filter(({
	        component
	      }) => projectFields.has(component));
	    },
	    participantsFields() {
	      const participantsFields = new Set();
	      if (this.wasAccomplicesFilled) {
	        participantsFields.add(tasks_v2_component_fields_accomplices.Accomplices);
	      }
	      if (this.wasAuditorsFilled) {
	        participantsFields.add(tasks_v2_component_fields_auditors.Auditors);
	      }
	      return this.fields.filter(({
	        component
	      }) => participantsFields.has(component));
	    },
	    chips() {
	      return this.fields.filter(({
	        chip,
	        isEnabled
	      }) => chip && isEnabled !== false).map(({
	        chip
	      }) => chip);
	    }
	  },
	  watch: {
	    async task() {
	      if (this.task) {
	        await this.$nextTick();
	        this.tryStartObserver();
	      }
	    }
	  },
	  async created() {
	    if (!this.isEdit && !this.task) {
	      void this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/insert`, {
	        id: this.taskId,
	        creatorId: this.currentUserId
	      });
	    }
	    await this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/clearFieldsFilled`, this.taskId);
	    if (this.isEdit && !this.task) {
	      await tasks_v2_provider_service_taskService.taskService.getById(this.taskId);
	    }
	  },
	  mounted() {
	    var _this$$refs$skeleton;
	    this.tryStartObserver();
	    (_this$$refs$skeleton = this.$refs.skeleton) == null ? void 0 : _this$$refs$skeleton.append(tasks_v2_application_taskCard.FullSkeleton());
	  },
	  beforeUnmount() {
	    if (this.resizeObserver) {
	      this.resizeObserver.disconnect();
	    }
	  },
	  unmounted() {
	    if (!this.isEdit) {
	      void this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/delete`, this.taskId);
	      tasks_v2_provider_service_fileService.fileService.delete(this.taskId);
	    }
	  },
	  methods: {
	    ...ui_vue3_vuex.mapActions(tasks_v2_const.Model.Interface, ['updateTitleFieldOffsetHeight']),
	    tryStartObserver() {
	      if (this.$refs.title && !this.resizeObserver) {
	        this.resizeObserver = this.getObserver();
	        this.resizeObserver.observe(this.$refs.title);
	      }
	    },
	    getObserver() {
	      return new ResizeObserver(entries => {
	        for (const entry of entries) {
	          if (entry.target === this.$refs.title) {
	            this.updateTitleFieldOffsetHeight(entry.contentRect.height);
	          }
	        }
	      });
	    },
	    async addTask() {
	      const checkLists = this.checkLists;
	      const [id] = await tasks_v2_provider_service_taskService.taskService.add(this.task);
	      this.taskId = id;
	      if (checkLists.length > 0) {
	        await tasks_v2_provider_service_checkListService.checkListService.save(this.taskId, checkLists);
	      }
	      tasks_v2_provider_service_fileService.fileService.replace(this.id, this.taskId);
	    },
	    openEditor() {
	      this.handleShowBottomSheet();
	    },
	    closeEditor(slot) {
	      slot.close();
	      this.handleCloseBottomSheet();
	    },
	    openFiles() {
	      this.isFilesSheetShown = true;
	      this.handleShowBottomSheet();
	    },
	    closeFiles() {
	      this.isFilesSheetShown = false;
	      this.handleCloseBottomSheet();
	      this.handleCloseBottomSheet();
	    },
	    openCheckList(checkListId) {
	      this.checkListId = checkListId;
	      this.isCheckListSheetShown = true;
	      this.handleShowBottomSheet();
	    },
	    closeCheckList() {
	      this.isCheckListSheetShown = false;
	      this.handleCloseBottomSheet();
	    },
	    handleShowBottomSheet() {
	      this.isBottomSheetShown = true;
	      main_core.Dom.addClass(this.$refs.scrollContent, '--disable-scroll');
	      this.$refs.scrollContent.scrollTo({
	        top: 0,
	        behavior: 'smooth'
	      });
	    },
	    handleCloseBottomSheet() {
	      this.isBottomSheetShown = false;
	      main_core.Dom.removeClass(this.$refs.scrollContent, '--disable-scroll');
	    },
	    close() {
	      main_core.Event.EventEmitter.emit(tasks_v2_const.EventName.CloseFullCard);
	    },
	    getEventListeners(chip, handlers) {
	      const listeners = {};
	      if (chip.emits) {
	        Object.keys(handlers).forEach(event => {
	          if (chip.emits.includes(event)) {
	            listeners[event] = handlers[event];
	          }
	        });
	      }
	      return listeners;
	    }
	  },
	  template: `
		<div class="tasks-full-card" :data-task-id="taskId" data-task-full>
			<template v-if="task">
				<div class="tasks-full-card-main" :class="{ '--overlay': isBottomSheetShown }">
					<div class="tasks-full-card-content" ref="scrollContent">
						<div
							class="tasks-full-card-title"
							:class="{'--no-padding-bottom': task.description.length > 0}"
							ref="title"
						>
							<FieldTitle :taskId="taskId"/>
							<Importance :taskId="taskId"/>
						</div>
						<FilesSheet
							:taskId="taskId"
							:isShown="isFilesSheetShown"
							@close="closeFiles"
						/>
						<CheckList
							:taskId="taskId"
							:checkListId="checkListId"
							:isShown="isCheckListSheetShown"
							@close="closeCheckList"
						/>
						<DescriptionField
							:taskId="taskId"
							v-slot="slot"
						>
							<DescriptionSheet
								:taskId="taskId"
								:isShown="slot.isShown"
								:doOpenInEditMode="slot.doOpenInEditMode"
								@show="openEditor"
								@close="closeEditor(slot)"
							/>
						</DescriptionField>
						<div class="tasks-full-card-fields">
							<div class="tasks-full-card-field-container" data-field-container>
								<FieldList :fields="primaryFields"/>
							</div>
							<div class="tasks-full-card-chips-fields">
								<div
									v-if="files.length > 0 || wasFilesFilled"
									class="tasks-full-card-field-container"
									data-field-container
								>
									<Files :taskId="taskId" @open="openFiles"/>
								</div>
								<div
									v-if="task.checklist.length > 0"
									class="tasks-full-card-field-container --custom"
									data-field-container
								>
									<CheckList
										:taskId="taskId"
										:isPreview="true"
										:isComponentShown="!isCheckListSheetShown"
										@open="openCheckList"
									/>
								</div>
								<div
									v-if="projectFields.length > 0"
									class="tasks-full-card-field-container"
									data-field-container
								>
									<FieldList :fields="projectFields"/>
								</div>
								<div
									v-if="participantsFields.length > 0"
									class="tasks-full-card-field-container"
									data-field-container
								>
									<FieldList
										:fields="participantsFields"
										:useSeparator="participantsFields.length > 1"
									/>
								</div>
								<div class="tasks-full-card-chips">
									<template v-for="(chip, index) of chips" :key="index">
										<component
											:is="chip"
											v-bind="{ taskId }"
											v-on="getEventListeners(chip, chipsEventHandlers)"
										/>
									</template>
									<Chip :icon="Outline.APPS" :text="'Ещё'" :soon="true"/>
								</div>
							</div>
						</div>
					</div>
					<div class="tasks-full-card-footer">
						<FooterEdit v-if="isEdit" :taskId="taskId"/>
						<FooterCreate v-else :taskId="taskId" @addTask="addTask"/>
					</div>
				</div>
				<Chat :taskId="taskId"/>
			</template>
			<template v-else>
				<div ref="skeleton" style="width: 100%;"></div>
			</template>
		</div>
	`
	};

	var _params = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("params");
	var _slider = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("slider");
	var _application = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("application");
	var _mountApplication = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mountApplication");
	var _unmountApplication = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("unmountApplication");
	var _subscribe = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("subscribe");
	var _unsubscribe = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("unsubscribe");
	var _onClose = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onClose");
	var _handlePopupShow = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handlePopupShow");
	class TaskFullCard {
	  constructor(params = {}) {
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
	    Object.defineProperty(this, _slider, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _application, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _onClose, {
	      writable: true,
	      value: () => {
	        babelHelpers.classPrivateFieldLooseBase(this, _slider)[_slider].close();
	      }
	    });
	    Object.defineProperty(this, _handlePopupShow, {
	      writable: true,
	      value: event => {
	        const popup = event.getCompatData()[0];
	        const onScroll = () => popup.adjustPosition();
	        const onClose = () => {
	          popup.unsubscribe('onClose', onClose);
	          popup.unsubscribe('onDestroy', onClose);
	          main_core.Event.unbind(document, 'scroll', onScroll, true);
	        };
	        popup.subscribe('onClose', onClose);
	        popup.subscribe('onDestroy', onClose);
	        main_core.Event.bind(document, 'scroll', onScroll, true);
	      }
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _params)[_params] = params;
	  }
	  async mountCard(slider) {
	    if (!slider.isOpen()) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _slider)[_slider] = slider;
	    babelHelpers.classPrivateFieldLooseBase(this, _subscribe)[_subscribe]();
	    babelHelpers.classPrivateFieldLooseBase(this, _application)[_application] = await babelHelpers.classPrivateFieldLooseBase(this, _mountApplication)[_mountApplication](slider.getContentContainer());
	  }
	  unmountCard() {
	    babelHelpers.classPrivateFieldLooseBase(this, _unmountApplication)[_unmountApplication]();
	    babelHelpers.classPrivateFieldLooseBase(this, _unsubscribe)[_unsubscribe]();
	  }
	}
	async function _mountApplication2(container) {
	  await tasks_v2_core.Core.init();
	  const application = ui_vue3.BitrixVue.createApp(App, {
	    ...babelHelpers.classPrivateFieldLooseBase(this, _params)[_params],
	    id: babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId
	  });
	  application.mixin(ui_vue3_mixins_locMixin.locMixin);
	  application.use(tasks_v2_core.Core.getStore());
	  application.mount(container);
	  return application;
	}
	function _unmountApplication2() {
	  var _babelHelpers$classPr;
	  (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _application)[_application]) == null ? void 0 : _babelHelpers$classPr.unmount();
	}
	function _subscribe2() {
	  main_core.Event.EventEmitter.subscribe(tasks_v2_const.EventName.CloseFullCard, babelHelpers.classPrivateFieldLooseBase(this, _onClose)[_onClose]);
	  main_core.Event.EventEmitter.subscribe('BX.Main.Popup:onShow', babelHelpers.classPrivateFieldLooseBase(this, _handlePopupShow)[_handlePopupShow]);
	}
	function _unsubscribe2() {
	  main_core.Event.EventEmitter.unsubscribe(tasks_v2_const.EventName.CloseFullCard, babelHelpers.classPrivateFieldLooseBase(this, _onClose)[_onClose]);
	  main_core.Event.EventEmitter.unsubscribe('BX.Main.Popup:onShow', babelHelpers.classPrivateFieldLooseBase(this, _handlePopupShow)[_handlePopupShow]);
	}

	exports.TaskFullCard = TaskFullCard;

}((this.BX.Tasks.V2.Application = this.BX.Tasks.V2.Application || {}),BX.Vue3,BX.Vue3.Mixins,BX.Tasks.V2.Application,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service,BX.Event,BX.Messenger.v2.Lib,BX.Messenger.v2.Application,BX.Tasks.V2,BX.Tasks.V2.Component,BX.Vue3.Components,BX,BX.Vue3.Vuex,BX.UI.Vue3.Components,BX.UI.IconSet,BX.UI.IconSet,BX,BX.Tasks.V2.Const,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service));
//# sourceMappingURL=task-full-card.bundle.js.map
