/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,main_sidepanel,ui_vue3_mixins_locMixin,ui_system_skeleton,tasks_v2_lib_analytics,tasks_v2_component_elements_fieldList,tasks_v2_component_elements_contentResizer,tasks_v2_component_dropZone,tasks_v2_component_entityText,tasks_v2_component_userFieldsSlider,tasks_v2_component_fields_description,tasks_v2_component_fields_creator,tasks_v2_component_fields_responsible,tasks_v2_component_fields_deadline,tasks_v2_component_fields_status,tasks_v2_component_fields_files,tasks_v2_component_fields_checkList,tasks_v2_component_fields_group,tasks_v2_component_fields_flow,tasks_v2_component_fields_accomplices,tasks_v2_component_fields_auditors,tasks_v2_component_fields_tags,tasks_v2_component_fields_crm,tasks_v2_component_fields_datePlan,tasks_v2_component_fields_timeTracking,tasks_v2_component_fields_subTasks,tasks_v2_component_fields_parentTask,tasks_v2_component_fields_relatedTasks,tasks_v2_component_fields_gantt,tasks_v2_component_fields_results,tasks_v2_component_fields_reminders,tasks_v2_component_fields_replication,tasks_v2_component_fields_email,tasks_v2_component_fields_userFields,tasks_v2_component_fields_placements,tasks_v2_provider_service_fileService,tasks_v2_provider_service_deadlineService,tasks_v2_component_fields_title,tasks_v2_component_fields_importance,ui_notificationManager,tasks_v2_lib_highlighter,ui_system_chip_vue,tasks_v2_core,tasks_v2_component_addTaskButton,ui_vue3,ui_system_skeleton_vue,ui_system_typography_vue,tasks_v2_component_elements_hint,tasks_v2_lib_ahaMoments,tasks_v2_component_markTaskButton,main_core_events,ui_vue3_vuex,ui_system_menu_vue,ui_iconSet_api_vue,ui_iconSet_outline,tasks_v2_application_taskCard,tasks_v2_const,tasks_v2_lib_userSelectorDialog,tasks_v2_lib_showLimit,tasks_v2_lib_idUtils,tasks_v2_provider_service_taskService,tasks_v2_provider_service_templateService,tasks_v2_provider_service_statusService,ui_vue3_components_button,main_core,ui_dialogs_messagebox) {
	'use strict';

	const sectionPersonal = 'sectionPersonal';
	const sectionTasks = 'sectionTasks';
	const sectionCopy = 'sectionCopy';
	const sectionLinks = 'sectionLinks';

	// @vue/component
	const BurgerMenu = {
	  name: 'TaskFullCardBurgerMenu',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    BMenu: ui_system_menu_vue.BMenu
	  },
	  inject: {
	    task: {},
	    taskId: {}
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline,
	      userRights: tasks_v2_core.Core.getParams().rights
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
	    menuOptions() {
	      return () => ({
	        id: 'tasks-full-card-header-burger-menu',
	        bindElement: this.$refs.container,
	        sections: [{
	          code: sectionPersonal
	        }, {
	          code: sectionTasks
	        }, {
	          code: sectionCopy
	        }, {
	          code: sectionLinks
	        }],
	        items: this.menuItems
	      });
	    },
	    menuItems() {
	      return [this.task.rights.favorite && this.getFavoriteItem(), this.task.rights.watch && this.getWatchItem(), this.task.rights.mute && this.getMuteItem(), this.userRights.tasks.create && this.getCreateNewTaskItem(), this.task.rights.createSubtask && this.getCreateSubtaskItem(), this.task.rights.copy && this.getCreateTaskCopyItem(), this.userRights.tasks.createFromTemplate && this.getCreateNewTaskWithTemplateItem(), false && this.task.rights.saveAsTemplate && this.getCreateTemplateFromTaskItem(),
	      // TODO: handle later
	      this.getCopyTaskIdItem(), this.getGoToBitrixMarketItem(), this.userRights.tasks.robot && this.getGoToRobotsItem()].filter(item => item);
	    },
	    isStakeholderLocked() {
	      return !tasks_v2_core.Core.getParams().restrictions.stakeholder.available;
	    }
	  },
	  methods: {
	    getFavoriteItem() {
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
	        sectionCode: sectionPersonal,
	        title: action.title,
	        icon: action.icon,
	        onClick: async () => {
	          const isSuccess = await tasks_v2_provider_service_taskService.taskService.setFavorite(this.taskId, !this.task.isFavorite);
	          ui_notificationManager.Notifier.notifyViaBrowserProvider({
	            id: 'task-notify-favorite',
	            text: isSuccess ? action.successNotification : action.failNotification
	          });
	        }
	      };
	    },
	    getWatchItem() {
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
	        sectionCode: sectionPersonal,
	        title: action.title,
	        icon: action.icon,
	        isLocked: this.isStakeholderLocked,
	        onClick: async () => {
	          var _result$action$endpoi;
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
	          const isSuccess = !((_result$action$endpoi = result[action.endpoint]) != null && _result$action$endpoi.length);
	          ui_notificationManager.Notifier.notifyViaBrowserProvider({
	            id: 'task-notify-watch',
	            text: isSuccess ? action.successNotification : action.failNotification
	          });
	        }
	      };
	    },
	    getMuteItem() {
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
	        sectionCode: sectionPersonal,
	        title: action.title,
	        icon: action.icon,
	        onClick: async () => {
	          const isSuccess = await tasks_v2_provider_service_taskService.taskService.setMute(this.taskId, !this.task.isMuted);
	          ui_notificationManager.Notifier.notifyViaBrowserProvider({
	            id: 'task-notify-mute',
	            title: action.successNotificationTitle,
	            text: isSuccess ? action.successNotification : action.failNotification
	          });
	        }
	      };
	    },
	    getCreateNewTaskItem() {
	      return {
	        sectionCode: sectionTasks,
	        title: this.loc('TASKS_V2_TASK_FULL_CARD_CREATE_STANDALONE_TASK'),
	        icon: ui_iconSet_api_vue.Outline.TASK,
	        onClick: () => tasks_v2_application_taskCard.TaskCard.showCompactCard({
	          groupId: this.task.groupId
	        })
	      };
	    },
	    getCreateSubtaskItem() {
	      return {
	        sectionCode: sectionTasks,
	        title: this.loc('TASKS_V2_TASK_FULL_CARD_CREATE_SUBTASK'),
	        icon: ui_iconSet_api_vue.Outline.RELATED_TASKS,
	        onClick: () => tasks_v2_application_taskCard.TaskCard.showCompactCard({
	          groupId: this.task.groupId,
	          parentId: this.taskId
	        })
	      };
	    },
	    getCreateTaskCopyItem() {
	      return {
	        sectionCode: sectionTasks,
	        title: this.loc('TASKS_V2_TASK_FULL_CARD_CREATE_TASK_COPY'),
	        icon: ui_iconSet_api_vue.Outline.DUPLICATE,
	        onClick: () => tasks_v2_application_taskCard.TaskCard.showFullCard({
	          copiedFromId: this.taskId
	        })
	      };
	    },
	    getCreateNewTaskWithTemplateItem() {
	      return {
	        sectionCode: sectionTasks,
	        title: this.loc('TASKS_V2_TASK_FULL_CARD_CREATE_STANDALONE_TASK_WITH_TEMPLATE'),
	        icon: ui_iconSet_api_vue.Outline.CHEVRON_RIGHT_L,
	        onClick: () => {
	          // TODO: change to new template creation page when it will be ready
	          BX.SidePanel.Instance.open(`/company/personal/user/${this.currentUserId}/tasks/templates/`, {
	            newWindowLabel: false,
	            copyLinkLabel: false
	          });
	        }
	      };
	    },
	    getCreateTemplateFromTaskItem() {
	      return {
	        sectionCode: sectionTasks,
	        title: this.loc('TASKS_V2_TASK_FULL_CARD_CREATE_TEMPLATE_FROM_TASK'),
	        icon: ui_iconSet_api_vue.Outline.TEMPLATE_TASK,
	        onClick: () => tasks_v2_application_taskCard.TaskCard.showCompactCard({
	          groupId: this.task.groupId
	        })
	      };
	    },
	    getCopyTaskIdItem() {
	      return {
	        sectionCode: sectionCopy,
	        title: this.loc('TASKS_V2_TASK_FULL_CARD_COPY_TASK_ID_ACTION'),
	        icon: ui_iconSet_api_vue.Outline.COPY,
	        onClick: () => {
	          const isCopyingSuccess = BX.clipboard.copy(this.taskId);
	          if (isCopyingSuccess) {
	            ui_notificationManager.Notifier.notifyViaBrowserProvider({
	              id: 'task-notify-copy',
	              text: this.loc('TASKS_V2_TASK_FULL_CARD_COPY_TASK_ID_NOTIF')
	            });
	          }
	        }
	      };
	    },
	    getGoToBitrixMarketItem() {
	      return {
	        sectionCode: sectionLinks,
	        uiButtonOptions: {
	          icon: ui_iconSet_api_vue.Outline.MARKET,
	          text: this.loc('TASKS_V2_TASK_FULL_CARD_GO_TO_BITRIX_MARKET'),
	          size: ui_vue3_components_button.ButtonSize.SMALL,
	          useAirDesign: true,
	          style: ui_vue3_components_button.AirButtonStyle.OUTLINE,
	          wide: true,
	          disabled: false,
	          onclick: () => BX.rest.Marketplace.open({
	            PLACEMENT: 'TASK_LIST_CONTEXT_MENU'
	          })
	        }
	      };
	    },
	    getGoToRobotsItem() {
	      const isLocked = !tasks_v2_core.Core.getParams().restrictions.robots.available;
	      return {
	        sectionCode: sectionLinks,
	        uiButtonOptions: {
	          icon: isLocked ? ui_iconSet_api_vue.Outline.LOCK_L : ui_iconSet_api_vue.Outline.ROBOT,
	          text: this.loc('TASKS_V2_TASK_FULL_CARD_GO_TO_ROBOTS'),
	          size: ui_vue3_components_button.ButtonSize.SMALL,
	          useAirDesign: true,
	          style: ui_vue3_components_button.AirButtonStyle.OUTLINE,
	          wide: true,
	          disabled: false,
	          onclick: () => {
	            if (isLocked) {
	              this.isMenuShown = false;
	              void tasks_v2_lib_showLimit.showLimit({
	                featureId: tasks_v2_core.Core.getParams().restrictions.robots.featureId,
	                bindElement: this.$refs.container
	              });
	              return;
	            }
	            BX.SidePanel.Instance.open(`/bitrix/components/bitrix/tasks.automation/slider.php?site_id=${this.loc('SITE_ID')}&project_id=${this.task.groupId}&task_id=${this.taskId}`, {
	              cacheable: false,
	              customLeftBoundary: 0,
	              loader: 'bizproc:automation-loader'
	            });
	          }
	        }
	      };
	    }
	  },
	  template: `
		<div
			class="tasks-full-card-header-burger"
			ref="container"
			@click="isMenuShown = true"
		>
			<BIcon :name="Outline.MORE_L" hoverable/>
		</div>
		<BMenu v-if="isMenuShown" :options="menuOptions()" @close="isMenuShown = false"/>
	`
	};

	// @vue/component
	const TaskHeader = {
	  name: 'TaskFullCardHeader',
	  components: {
	    TitleField: tasks_v2_component_fields_title.Title,
	    Importance: tasks_v2_component_fields_importance.Importance,
	    BurgerMenu
	  },
	  inject: {
	    isEdit: {},
	    isTemplate: {}
	  },
	  template: `
		<div class="tasks-full-card-header">
			<TitleField/>
			<Importance/>
			<BurgerMenu v-if="!isTemplate && isEdit"/>
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

	const MenuSectionCode = Object.freeze({
	  first: 'first',
	  second: 'second',
	  third: 'third'
	});
	/**
	 * @param {typeof MessageMenu} baseMenu
	 * @returns {typeof MessageMenu}
	 */
	// eslint-disable-next-line max-lines-per-function
	const TaskFullCardMessageMenu = baseMenu => {
	  var _shouldShowAddResult, _shouldShowRemoveResult, _isDeletedMessage, _isOwnMessage, _getMessageResultId, _getTask;
	  return _shouldShowAddResult = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("shouldShowAddResult"), _shouldShowRemoveResult = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("shouldShowRemoveResult"), _isDeletedMessage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isDeletedMessage"), _isOwnMessage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isOwnMessage"), _getMessageResultId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getMessageResultId"), _getTask = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getTask"), class extends baseMenu {
	    constructor(...args) {
	      super(...args);
	      Object.defineProperty(this, _getTask, {
	        value: _getTask2
	      });
	      Object.defineProperty(this, _getMessageResultId, {
	        value: _getMessageResultId2
	      });
	      Object.defineProperty(this, _isOwnMessage, {
	        value: _isOwnMessage2
	      });
	      Object.defineProperty(this, _isDeletedMessage, {
	        value: _isDeletedMessage2
	      });
	      Object.defineProperty(this, _shouldShowRemoveResult, {
	        value: _shouldShowRemoveResult2
	      });
	      Object.defineProperty(this, _shouldShowAddResult, {
	        value: _shouldShowAddResult2
	      });
	    }
	    getMenuItems() {
	      const firstGroupItems = [this.getReplyItem(), this.getCopyItem(), this.getEditItem(), this.getDownloadFileItem(), this.getAddResultItem(), this.getRemoveResultItem(), ...this.getAdditionalItems()];
	      return [...this.groupItems(firstGroupItems, MenuSectionCode.first), ...this.groupItems([this.getDeleteItem()], MenuSectionCode.second)];
	    }
	    getNestedItems() {
	      const firstGroupItems = [this.getPinItem(), this.getCopyLinkItem(), this.getCopyFileItem(), this.getMarkItem(), this.getFavoriteItem(), this.getSaveToDiskItem(), this.getCreateMeetingItem()];
	      return [...this.groupItems(firstGroupItems, MenuSectionCode.first), ...this.groupItems(this.getMarketItems(), MenuSectionCode.second)];
	    }
	    getMenuGroups() {
	      return [{
	        code: MenuSectionCode.first
	      }, {
	        code: MenuSectionCode.second
	      }];
	    }
	    getNestedMenuGroups() {
	      return [{
	        code: MenuSectionCode.first
	      }, {
	        code: MenuSectionCode.second
	      }];
	    }
	    getAddResultItem() {
	      if (babelHelpers.classPrivateFieldLooseBase(this, _isDeletedMessage)[_isDeletedMessage]() || !babelHelpers.classPrivateFieldLooseBase(this, _isOwnMessage)[_isOwnMessage]() || !babelHelpers.classPrivateFieldLooseBase(this, _shouldShowAddResult)[_shouldShowAddResult]()) {
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
	            authorId: this.context.authorId
	          });
	          this.close();
	        }
	      };
	    }
	    getRemoveResultItem() {
	      if (babelHelpers.classPrivateFieldLooseBase(this, _isDeletedMessage)[_isDeletedMessage]() || !babelHelpers.classPrivateFieldLooseBase(this, _isOwnMessage)[_isOwnMessage]() || !babelHelpers.classPrivateFieldLooseBase(this, _shouldShowRemoveResult)[_shouldShowRemoveResult]()) {
	        return null;
	      }
	      return {
	        title: main_core.Loc.getMessage('TASKS_V2_TASK_FULL_CARD_MESSAGE_DELETE_RESULT'),
	        icon: ui_iconSet_api_vue.Outline.FLAG_WITH_CROSS,
	        onClick: () => {
	          main_core_events.EventEmitter.emit(tasks_v2_const.EventName.DeleteResultFromChat, {
	            taskId: this.getTaskId(),
	            resultId: babelHelpers.classPrivateFieldLooseBase(this, _getMessageResultId)[_getMessageResultId]()
	          });
	          this.close();
	        }
	      };
	    }
	    getCreateTaskItem() {
	      return null;
	    }
	    getMarkItem() {
	      return null;
	    }
	    getTaskId() {
	      return 0; // reinitialize in the calling class
	    }
	  };
	  function _shouldShowAddResult2() {
	    const task = babelHelpers.classPrivateFieldLooseBase(this, _getTask)[_getTask]();
	    if (!task) {
	      return false;
	    }
	    return !babelHelpers.classPrivateFieldLooseBase(this, _getMessageResultId)[_getMessageResultId]();
	  }
	  function _shouldShowRemoveResult2() {
	    const task = babelHelpers.classPrivateFieldLooseBase(this, _getTask)[_getTask]();
	    if (!task) {
	      return false;
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _getMessageResultId)[_getMessageResultId]() > 0;
	  }
	  function _isDeletedMessage2() {
	    return this.context.isDeleted;
	  }
	  function _isOwnMessage2() {
	    return this.context.authorId === tasks_v2_core.Core.getParams().currentUser.id;
	  }
	  function _getMessageResultId2() {
	    const task = babelHelpers.classPrivateFieldLooseBase(this, _getTask)[_getTask]();
	    if (!task) {
	      return 0;
	    }
	    const map = (task == null ? void 0 : task.resultsMessageMap) || {};
	    const messageId = this.context.id;
	    for (const [resultId, boundMessageId] of Object.entries(map)) {
	      if (boundMessageId !== null && Number(boundMessageId) === Number(messageId)) {
	        return Number(resultId);
	      }
	    }
	    return 0;
	  }
	  function _getTask2() {
	    return tasks_v2_provider_service_taskService.taskService.getStoreTask(this.getTaskId());
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
	    var _this$app;
	    this.unregisterMessageMenu();
	    (_this$app = this.app) == null ? void 0 : _this$app.bitrixVue.unmount();
	  },
	  methods: {
	    async openChat() {
	      var _this$app2, _this$app3;
	      if (!tasks_v2_core.Core.getParams().features.im) {
	        return;
	      }
	      (_this$app2 = this.app) == null ? void 0 : _this$app2.bitrixVue.unmount();
	      const {
	        Messenger
	      } = await main_core.Runtime.loadExtension('im.public');
	      (_this$app3 = this.app) != null ? _this$app3 : this.app = await Messenger.initApplication('task'); // im.v2.application.integration.task

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
	        MessageMenu,
	        MessageMenuManager
	      } = await main_core.Runtime.loadExtension('im.v2.lib.menu');
	      this.messageMenuManager = MessageMenuManager;
	      const taskId = this.taskId;
	      const taskFullCardMessageMenu = class extends TaskFullCardMessageMenu(MessageMenu) {
	        getTaskId() {
	          return taskId;
	        }
	      };
	      this.messageMenuManager.getInstance().registerMenuByCallback(this.isCurrentChat, taskFullCardMessageMenu);
	    },
	    unregisterMessageMenu() {
	      var _this$messageMenuMana;
	      (_this$messageMenuMana = this.messageMenuManager) == null ? void 0 : _this$messageMenuMana.getInstance().unregisterMenuByCallback(this.isCurrentChat);
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
		<div class="tasks-full-card-chat" ref="chat">
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
	      }) => isEnabled != null ? isEnabled : true).map((chip, index) => ({
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
		<div class="tasks-full-card-chips">
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
	  emits: ['addTask', 'copyTask', 'fromTemplate', 'template', 'update:creationError', 'close'],
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
	  template: `
		<div class="tasks-full-card-footer">
			<div class="tasks-full-card-footer-create">
				<div class="tasks-full-card-footer-main-buttons">
					<AddTaskButton
						v-model:hasError="hasError"
						@addTask="$emit('addTask')"
						@copyTask="$emit('copyTask', $event)"
						@fromTemplate="$emit('fromTemplate', $event)"
					/>
					<UiButton
						:text="loc('TASKS_V2_TASK_FULL_CARD_CANCEL')"
						:size="ButtonSize.LARGE"
						:style="AirButtonStyle.PLAIN"
						:dataset="{ taskButtonId: 'cancel' }"
						@click="$emit('close')"
					/>
				</div>
				<TemplatesButton v-if="!isTemplate && isTemplateEnabled" @template="$emit('template', $event)"/>
				<TemplatePermissionsButton v-if="isTemplate"/>
			</div>
		</div>
	`
	};

	const ButtonId = Object.freeze({
	  Start: 'start',
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
	    settings: {}
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
	      var _this$group;
	      return ((_this$group = this.group) == null ? void 0 : _this$group.type) === tasks_v2_const.GroupType.Scrum;
	    },
	    isCreator() {
	      return this.currentUserId === this.task.creatorId;
	    },
	    isResponsible() {
	      var _this$task$accomplice;
	      return this.task.responsibleIds.includes(this.currentUserId) || ((_this$task$accomplice = this.task.accomplicesIds) == null ? void 0 : _this$task$accomplice.includes(this.currentUserId));
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
	        return [this.getCreateSubtaskForTemplate(),
	        // todo: Uncomment after creating template copy V2 API
	        // this.getCopyTemplate(),
	        this.getDeleteTemplate()];
	      }
	      const statuses = {
	        [tasks_v2_const.TaskStatus.Pending]: [this.getCompleteItem(), this.getDefferItem(), this.getDelegateItem(), this.getDeleteItem(), this.getStartItem()],
	        [tasks_v2_const.TaskStatus.InProgress]: [this.getPauseItem(), this.getDefferItem(), this.getDelegateItem(), this.getDeleteItem()],
	        [tasks_v2_const.TaskStatus.Deferred]: [this.getDelegateItem(), this.getDeleteItem(), this.getCompleteItem()],
	        [tasks_v2_const.TaskStatus.SupposedlyCompleted]: [this.getFixItem(), this.getDelegateItem(), this.getDisapproveItem(), this.getDeleteItem()],
	        [tasks_v2_const.TaskStatus.Completed]: [this.getRenewItem(), this.getDeleteItem()]
	      };
	      const items = statuses[this.task.status] || [];
	      return items.filter(item => item !== null);
	    },
	    selectedButtonIds() {
	      return new Set(this.selectedButtons.map(button => button == null ? void 0 : button.id));
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
	      if (this.selectedButtonIds.has(ButtonId.Start)) {
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
	      if (!this.task.rights.renew) {
	        return null;
	      }
	      return {
	        title: this.loc('TASKS_V2_TASK_FULL_CARD_FIX'),
	        icon: ui_iconSet_api_vue.Outline.UNDO,
	        onClick: () => this.waitStatus(tasks_v2_provider_service_statusService.statusService.renew(this.taskId))
	      };
	    },
	    getDisapproveItem() {
	      if (!this.task.rights.disapprove) {
	        return null;
	      }
	      return {
	        title: this.loc('TASKS_V2_TASK_FULL_CARD_DISAPPROVE'),
	        icon: ui_iconSet_api_vue.Outline.UNDO,
	        onClick: () => this.waitStatus(tasks_v2_provider_service_statusService.statusService.disapprove(this.taskId))
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
	        onClick: () => this.handleCompleteSelect()
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
	    handleClose(usersIds) {
	      var _usersIds$;
	      void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	        responsibleIds: [(_usersIds$ = usersIds[0]) != null ? _usersIds$ : 0]
	      });
	    },
	    async handleCompleteSelect() {
	      await this.waitStatus(tasks_v2_provider_service_statusService.statusService.complete(this.taskId));
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
	          void tasks_v2_provider_service_taskService.taskService.delete(this.taskId);
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
	    settings: {}
	  },
	  setup() {
	    return {
	      AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
	      ButtonSize: ui_vue3_components_button.ButtonSize,
	      ButtonIcon: ui_vue3_components_button.ButtonIcon,
	      Outline: ui_iconSet_api_vue.Outline,
	      TaskStatus: tasks_v2_const.TaskStatus
	    };
	  },
	  data() {
	    return {
	      loading: false,
	      showStartTimeTrackingHint: false,
	      computedSecondaryButton: null
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      currentUserId: `${tasks_v2_const.Model.Interface}/currentUserId`
	    }),
	    timer() {
	      var _this$task$timers;
	      return (_this$task$timers = this.task.timers) == null ? void 0 : _this$task$timers.find(timer => timer.userId === this.currentUserId);
	    },
	    group() {
	      return this.$store.getters[`${tasks_v2_const.Model.Groups}/getById`](this.task.groupId);
	    },
	    isScrum() {
	      var _this$group;
	      return ((_this$group = this.group) == null ? void 0 : _this$group.type) === tasks_v2_const.GroupType.Scrum;
	    },
	    isCreator() {
	      return this.currentUserId === this.task.creatorId;
	    },
	    primaryButton() {
	      const inProgress = this.task.rights.timeTracking ? [this.getStartTimerButton(), this.getPauseButton(ui_vue3_components_button.AirButtonStyle.OUTLINE)] : [this.getCompleteButton()];
	      const statuses = {
	        [tasks_v2_const.TaskStatus.Pending]: [this.getStartTimerButton(), this.getPauseButton(ui_vue3_components_button.AirButtonStyle.OUTLINE), this.getStartButton(), this.getCompleteButton()],
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
	    shouldShowStartTimeTrackingHint() {
	      var _this$primaryButton;
	      return this.showStartTimeTrackingHint && ((_this$primaryButton = this.primaryButton) == null ? void 0 : _this$primaryButton.id) === ButtonId.Start;
	    },
	    shouldShowMarkTaskButton() {
	      return this.task.rights.mark || this.task.mark !== tasks_v2_const.Mark.None;
	    },
	    showFooter() {
	      if (this.isTemplate) {
	        return this.settings.rights.tasks.createFromTemplate || this.task.rights.edit;
	      }
	      return Boolean(this.primaryButton || this.secondaryButton || this.shouldShowMarkTaskButton);
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
	    getStartTimerButton() {
	      if (!this.task.rights.timeTracking || this.timer) {
	        return null;
	      }
	      return {
	        id: ButtonId.Start,
	        text: this.loc('TASKS_V2_TASK_FULL_CARD_START'),
	        onClick: () => this.waitStatus(tasks_v2_provider_service_statusService.statusService.startTimer(this.taskId)),
	        icon: ui_vue3_components_button.ButtonIcon.START
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
	        onClick: () => this.handleTaskComplete()
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
	        onClick: () => this.handleTaskApprove()
	      };
	    },
	    updateSecondaryButton() {
	      void this.$nextTick(() => {
	        const inProgress = this.task.rights.timeTracking ? this.getCompleteButton(this.timer ? '' : ui_vue3_components_button.AirButtonStyle.OUTLINE) : null;
	        const statuses = {
	          [tasks_v2_const.TaskStatus.Pending]: this.getCompleteButton(ui_vue3_components_button.AirButtonStyle.OUTLINE),
	          [tasks_v2_const.TaskStatus.InProgress]: inProgress
	        };
	        let secondary = statuses[this.task.status] || null;
	        if (secondary && this.primaryButton && secondary.id === this.primaryButton.id) {
	          secondary = null;
	        }
	        this.computedSecondaryButton = secondary;
	      });
	    },
	    async handleTaskComplete() {
	      await this.waitStatus(tasks_v2_provider_service_statusService.statusService.complete(this.taskId));
	    },
	    async handleTaskApprove() {
	      await this.waitStatus(tasks_v2_provider_service_statusService.statusService.approve(this.taskId));
	    },
	    handleOverPrimaryButton() {
	      var _this$primaryButton2;
	      if (this.task.rights.timeTracking && ((_this$primaryButton2 = this.primaryButton) == null ? void 0 : _this$primaryButton2.id) === ButtonId.Start && tasks_v2_lib_ahaMoments.ahaMoments.shouldShow(tasks_v2_const.Option.AhaStartTimeTracking)) {
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
	    hideStartTimeTrackingHint() {
	      this.showStartTimeTrackingHint = false;
	    },
	    hidePermanentStartTimeTrackingHint() {
	      this.hideStartTimeTrackingHint();
	      tasks_v2_lib_ahaMoments.ahaMoments.setInactive(tasks_v2_const.Option.AhaStartTimeTracking);
	      tasks_v2_lib_ahaMoments.ahaMoments.setShown(tasks_v2_const.Option.AhaStartTimeTracking);
	    },
	    async waitStatus(statusPromise) {
	      this.loading = true;
	      await statusPromise;
	      this.loading = false;
	    },
	    createTaskFromTemplate() {
	      tasks_v2_application_taskCard.TaskCard.showFullCard({
	        templateId: tasks_v2_lib_idUtils.idUtils.unbox(this.taskId)
	      });
	    }
	  },
	  template: `
		<div v-if="showFooter" class="tasks-full-card-footer">
			<div class="tasks-full-card-footer-edit">
				<UiButton
					v-if="isTemplate && settings.rights.tasks.createFromTemplate"
					:text="loc('TASKS_V2_TASK_TEMPLATE_CREATE_TASK')"
					:size="ButtonSize.LARGE"
					:loading
					:dataset="{ taskButtonId: 'createFromTemplate' }"
					:leftIcon="Outline.PLUS_L"
					@click="createTaskFromTemplate"
				/>
				<template v-if="!isTemplate">
					<div
						v-if="primaryButton"
						ref="primaryButton"
						class="tasks-full-card-footer-edit-primaryButton"
						@mouseover="handleOverPrimaryButton"
					>
						<UiButton
							:text="primaryButton.text"
							:size="ButtonSize.LARGE"
							:style="primaryButton.style ?? AirButtonStyle.FILLED"
							:disabled="Boolean(primaryButton.disabled)"
							:loading
							:leftIcon="primaryButton.icon"
							:dataset="{ taskButtonId: 'status' }"
							@click="primaryButton.onClick"
						/>
					</div>
					<UiButton
						v-if="secondaryButton && !loading"
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
	    UiButton: ui_vue3_components_button.Button
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
	    descr: {
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
	  computed: {},
	  methods: {},
	  template: `
		<div class="tasks-full-card-placeholder">
			<div class="tasks-full-card-placeholder__content">
				<div v-if="imgSrc" class="tasks-full-card-placeholder__img-container">
					<img :src="imgSrc" alt="noAccess" class="tasks-full-card-placeholder__img"/>
				</div>
				<h3 v-if="head" class="tasks-full-card-placeholder__head">{{ head }}</h3>
				<p v-if="descr" class="tasks-full-card-placeholder__descr">{{ descr }}</p>
				<div class="tasks-full-card-placeholder__action-container">
					<UiButton
						v-if="action"
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
	    UserFields: tasks_v2_component_fields_userFields.UserFields
	  },
	  provide() {
	    return {
	      analytics: this.analytics,
	      cardType: tasks_v2_const.CardType.Full,
	      settings: tasks_v2_core.Core.getParams(),
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
	      placeholderImgUrl: null
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      defaultDeadlineTs: `${tasks_v2_const.Model.Interface}/defaultDeadlineTs`,
	      fullCardWidth: `${tasks_v2_const.Model.Interface}/fullCardWidth`,
	      stateFlags: `${tasks_v2_const.Model.Interface}/stateFlags`,
	      taskUserFieldScheme: `${tasks_v2_const.Model.Interface}/taskUserFieldScheme`,
	      templateUserFieldScheme: `${tasks_v2_const.Model.Interface}/templateUserFieldScheme`
	    }),
	    task() {
	      return tasks_v2_provider_service_taskService.taskService.getStoreTask(this.taskId);
	    },
	    group() {
	      return this.$store.getters[`${tasks_v2_const.Model.Groups}/getById`](this.task.groupId);
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
	      var _this$stateFlags$defa;
	      return this.isTemplate ? false : (_this$stateFlags$defa = this.stateFlags.defaultRequireResult) != null ? _this$stateFlags$defa : false;
	    },
	    // eslint-disable-next-line max-lines-per-function,sonarjs/cognitive-complexity
	    fields() {
	      return [{
	        title: tasks_v2_component_fields_creator.creatorMeta.title,
	        component: tasks_v2_component_fields_creator.Creator
	      }, {
	        title: tasks_v2_component_fields_responsible.responsibleMeta.getTitle(!this.task.isForNewUser && this.task.responsibleIds.length > 1),
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
	          isHovered: this.isPrimaryFieldsHovered || this.isTaskSettingsHintShown
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
	      }, {
	        title: tasks_v2_component_fields_email.emailMeta.title,
	        component: tasks_v2_component_fields_email.Email,
	        chip: {
	          component: tasks_v2_component_fields_email.EmailChip,
	          isEnabled: this.wasFilled(tasks_v2_const.TaskField.Email)
	        }
	      }, {
	        title: tasks_v2_component_fields_email.emailMeta.fromTitle,
	        component: tasks_v2_component_fields_email.EmailFrom,
	        withSeparator: true
	      }, {
	        title: tasks_v2_component_fields_email.emailMeta.dateTitle,
	        component: tasks_v2_component_fields_email.EmailDate
	      }, !this.isTemplate && {
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
	        }
	      }, {
	        title: tasks_v2_component_fields_accomplices.accomplicesMeta.title,
	        component: tasks_v2_component_fields_accomplices.Accomplices,
	        chip: {
	          component: tasks_v2_component_fields_accomplices.AccomplicesChip,
	          isEnabled: this.wasFilled(tasks_v2_const.TaskField.Accomplices) || this.task.rights.changeAccomplices
	        }
	      }, {
	        title: tasks_v2_component_fields_auditors.auditorsMeta.title,
	        component: tasks_v2_component_fields_auditors.Auditors,
	        chip: {
	          component: tasks_v2_component_fields_auditors.AuditorsChip,
	          isEnabled: this.wasFilled(tasks_v2_const.TaskField.Auditors) || this.task.rights.addAuditors
	        },
	        withSeparator: this.wasFilled(tasks_v2_const.TaskField.Accomplices)
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
	        withSeparator: true
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
	        }
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
	        withSeparator: this.wasFilled(tasks_v2_const.TaskField.Group) || this.wasFilled(tasks_v2_const.TaskField.Flow)
	      }, {
	        chip: {
	          component: tasks_v2_component_fields_parentTask.ParentTaskChip,
	          collapsed: true,
	          isEnabled: this.wasFilled(tasks_v2_const.TaskField.Parent) || this.task.rights.edit
	        }
	      }, {
	        chip: {
	          component: tasks_v2_component_fields_subTasks.SubTasksChip,
	          collapsed: true,
	          isEnabled: this.wasFilled(tasks_v2_const.TaskField.SubTasks) || this.task.rights.createSubtask || !this.isEdit
	        }
	      }, {
	        chip: {
	          component: tasks_v2_component_fields_relatedTasks.RelatedTasksChip,
	          collapsed: true,
	          isEnabled: this.wasFilled(tasks_v2_const.TaskField.RelatedTasks) || this.task.rights.edit
	        }
	      }, !this.isTemplate && {
	        chip: {
	          component: tasks_v2_component_fields_gantt.GanttChip,
	          collapsed: true,
	          isEnabled: this.wasFilled(tasks_v2_const.TaskField.Gantt) || this.task.rights[tasks_v2_component_fields_gantt.ganttMeta.right]
	        }
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
	      }, this.isTemplate && {
	        chip: {
	          component: tasks_v2_component_fields_replication.ReplicationChip,
	          props: {
	            isSheetShown: this.isReplicationSheetShown,
	            sheetBindProps: this.sheetBindProps
	          },
	          events: {
	            'update:isSheetShown': isShown => {
	              this.isReplicationSheetShown = isShown;
	            }
	          }
	        }
	      }, {
	        chip: {
	          component: tasks_v2_component_fields_timeTracking.TimeTrackingChip,
	          collapsed: true,
	          isEnabled: this.task.rights.edit || this.task.allowsTimeTracking
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
	      return this.getFields(new WeakMap([[tasks_v2_component_fields_creator.Creator, true], [tasks_v2_component_fields_responsible.Responsible, true], [tasks_v2_component_fields_deadline.Deadline, true], [tasks_v2_component_fields_timeTracking.TimeTracking, this.task.allowsTimeTracking], [tasks_v2_component_fields_status.Status, this.isEdit]]));
	    },
	    projectFields() {
	      var _this$group;
	      const isScrum = ((_this$group = this.group) == null ? void 0 : _this$group.type) === tasks_v2_const.GroupType.Scrum;
	      return this.getFields(new WeakMap([[tasks_v2_component_fields_group.Group, this.wasFilled(tasks_v2_const.TaskField.Group)], [tasks_v2_component_fields_flow.Flow, this.wasFilled(tasks_v2_const.TaskField.Flow)], [tasks_v2_component_fields_group.Stage, !this.isTemplate && this.isEdit && this.group && (this.task.stageId !== 0 || !isScrum)], [tasks_v2_component_fields_group.Epic, !this.isTemplate && isScrum], [tasks_v2_component_fields_group.StoryPoints, !this.isTemplate && isScrum], [tasks_v2_component_fields_crm.Crm, this.wasFilled(tasks_v2_const.TaskField.Crm)]]));
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
	      return this.isDescriptionSheetShown || this.isFilesSheetShown || this.isCheckListSheetShown || this.isDatePlanSheetShown || this.isTimeTrackingSheetShown || this.isResultListSheetShown || this.isResultEditorSheetShown || this.isResultChipSheetShown || this.isReminderSheetShown || this.isRemindersSheetShown || this.isReplicationSheetShown || this.isReplicationHistorySheetShown;
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
	      var _this$initialTask, _this$task;
	      return ((_this$initialTask = this.initialTask) == null ? void 0 : _this$initialTask.copiedFromId) && !tasks_v2_lib_idUtils.idUtils.isReal((_this$task = this.task) == null ? void 0 : _this$task.id);
	    },
	    placeholderOptions() {
	      return {
	        imgSrc: this.iconUrl,
	        head: main_core.Loc.getMessage('TASKS_V2_TASK_FULL_CARD_PLACEHOLDER_TITLE_NO_RIGHTS')
	      };
	    },
	    isReplicateTemplate() {
	      var _this$task2;
	      return this.isTemplate && ((_this$task2 = this.task) == null ? void 0 : _this$task2.replicate) === true;
	    },
	    hasFilledUserFields() {
	      var _this$task3;
	      return tasks_v2_component_fields_userFields.userFieldsManager.hasFilledUserFields(((_this$task3 = this.task) == null ? void 0 : _this$task3.userFields) || [], this.userFieldScheme);
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
	    var _this$task4, _this$task4$fileIds, _this$task5;
	    if (!this.isEdit && !this.task) {
	      var _this$initialTask$dea, _this$stateFlags$need, _this$stateFlags$matc;
	      await tasks_v2_provider_service_taskService.taskService.insertStoreTask({
	        ...this.initialTask,
	        id: this.taskId,
	        creatorId: tasks_v2_core.Core.getParams().currentUser.id,
	        responsibleIds: [tasks_v2_core.Core.getParams().currentUser.id],
	        deadlineTs: (_this$initialTask$dea = this.initialTask.deadlineTs) != null ? _this$initialTask$dea : this.defaultDeadlineTs,
	        needsControl: (_this$stateFlags$need = this.stateFlags.needsControl) != null ? _this$stateFlags$need : null,
	        matchesWorkTime: (_this$stateFlags$matc = this.stateFlags.matchesWorkTime) != null ? _this$stateFlags$matc : null,
	        requireResult: tasks_v2_core.Core.getParams().restrictions.requiredResult.available && this.defaultRequireResult
	      });
	      if (this.initialTask.copiedFromId) {
	        await tasks_v2_provider_service_taskService.taskService.getCopy(this.initialTask.copiedFromId, this.taskId);
	      }
	      if (this.initialTask.templateId) {
	        await tasks_v2_provider_service_templateService.templateService.getTask(this.initialTask.templateId, this.taskId);
	      }
	    }
	    await this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/clearFieldsFilled`, this.taskId);
	    if (this.isEdit && (!this.task || this.isPartiallyLoaded)) {
	      await tasks_v2_provider_service_taskService.taskService.get(this.taskId);
	    }
	    if (((_this$task4 = this.task) == null ? void 0 : (_this$task4$fileIds = _this$task4.fileIds) == null ? void 0 : _this$task4$fileIds.length) > 0) {
	      await tasks_v2_provider_service_fileService.fileService.get(this.taskId).list(this.task.fileIds);
	    }
	    this.isLoading = false;
	    if (!this.task) {
	      return;
	    }
	    if (!this.isTemplate && !this.canChangeDeadlineWithoutLimitation && this.task.maxDeadlineChanges) {
	      void tasks_v2_provider_service_deadlineService.deadlineService.updateDeadlineChangeCount(this.task.id);
	    }
	    tasks_v2_component_entityText.entityTextEditor.get(this.taskId, tasks_v2_component_entityText.EntityTextTypes.Task, {
	      content: (_this$task5 = this.task) == null ? void 0 : _this$task5.description
	    });
	    this.taskInitial = this.task;
	    await main_core.Runtime.loadExtension(tasks_v2_core.Core.getParams().externalExtensions);
	    main_core_events.EventEmitter.emit(tasks_v2_const.EventName.FullCardInit, {
	      task: this.task
	    });
	  },
	  async mounted() {
	    main_core_events.EventEmitter.subscribe(tasks_v2_const.EventName.FullCardHasChanges, this.handleHasChanges);
	    this.renderSkeleton();
	    this.iconUrl = (await Promise.resolve().then(function () { return marshmallow_sad_pink_with_orange_lock$1; })).default;
	  },
	  unmounted() {
	    main_core_events.EventEmitter.unsubscribe(tasks_v2_const.EventName.FullCardHasChanges, this.handleHasChanges);
	    if (!this.isEdit) {
	      void this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/delete`, this.taskId);
	      tasks_v2_provider_service_fileService.fileService.delete(this.taskId);
	      tasks_v2_component_entityText.entityTextEditor.delete(this.taskId);
	    }
	  },
	  methods: {
	    ...ui_vue3_vuex.mapActions(tasks_v2_const.Model.Interface, ['updateFullCardWidth']),
	    getFields(map) {
	      return this.fields.filter(({
	        component
	      }) => map.get(component));
	    },
	    wasFilled(fieldId) {
	      return Boolean(this.task.filledFields[fieldId]);
	    },
	    async addTask() {
	      const [id, error] = await tasks_v2_provider_service_taskService.taskService.add(this.task);
	      if (!id) {
	        this.handleCreationError(error);
	        return;
	      }
	      this.taskId = id;
	      tasks_v2_provider_service_fileService.fileService.replace(this.id, id);
	      tasks_v2_component_entityText.entityTextEditor.replace(this.id, id);
	      if (id) {
	        this.sendAddTaskAnalytics(true);
	      } else {
	        this.sendAddTaskAnalytics(false);
	      }
	      this.notifyGrid();
	    },
	    async copyTask(event) {
	      const {
	        withSubTasks
	      } = event;
	      const [id, error] = await tasks_v2_provider_service_taskService.taskService.copy(this.task, withSubTasks);
	      if (!id) {
	        this.handleCreationError(error);
	        return;
	      }
	      this.taskId = id;
	      tasks_v2_provider_service_fileService.fileService.delete(this.id);
	      await tasks_v2_provider_service_fileService.fileService.get(this.taskId).sync(this.task.fileIds);
	      tasks_v2_component_entityText.entityTextEditor.replace(this.id, id);
	      this.notifyGrid();
	    },
	    async createFromTemplate(event) {
	      const {
	        withSubTasks
	      } = event;
	      const [id, error] = await tasks_v2_provider_service_templateService.templateService.addTask(this.task.templateId, this.task, withSubTasks);
	      if (!id) {
	        this.handleCreationError(error);
	        return;
	      }
	      this.taskId = id;
	      tasks_v2_provider_service_fileService.fileService.delete(this.id);
	      await tasks_v2_provider_service_fileService.fileService.get(this.taskId).sync(this.task.fileIds);
	      tasks_v2_component_entityText.entityTextEditor.replace(this.id, id);
	      this.notifyGrid();
	    },
	    handleCreationError(error) {
	      this.creationError = true;
	      ui_notificationManager.Notifier.notifyViaBrowserProvider({
	        id: 'task-notify-add-error',
	        text: error == null ? void 0 : error.message
	      });
	    },
	    notifyGrid() {
	      main_core_events.EventEmitter.emit(tasks_v2_const.EventName.NotifyGrid, new main_core_events.BaseEvent({
	        data: this.taskId,
	        compatData: ['ADD', {
	          task: this.task,
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
	      var _this$task6;
	      const templateId = this.isEdit ? null : (_this$task6 = this.task) == null ? void 0 : _this$task6.templateId;
	      void tasks_v2_component_userFieldsSlider.userFieldsSlider.open(this.taskId, this.isTemplate, templateId);
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
	      var _this$task7, _this$task7$fileIds;
	      this.isLoading = true;
	      await tasks_v2_provider_service_templateService.templateService.getTask(templateId, this.taskId);
	      if (((_this$task7 = this.task) == null ? void 0 : (_this$task7$fileIds = _this$task7.fileIds) == null ? void 0 : _this$task7$fileIds.length) > 0) {
	        var _this$task8;
	        await tasks_v2_provider_service_fileService.fileService.get(this.taskId).list((_this$task8 = this.task) == null ? void 0 : _this$task8.fileIds);
	      }
	      await this.$store.dispatch(`${tasks_v2_const.Model.Tasks}/clearFieldsFilled`, this.taskId);
	      this.isLoading = false;
	    },
	    renderSkeleton() {
	      if (this.$refs.skeleton) {
	        const skeletonPath = '/bitrix/js/tasks/v2/application/task-card/src/skeleton-full.html?v=1';
	        const templateSkeletonPath = '/bitrix/js/tasks/v2/application/task-card/src/skeleton-template.html?v=1';
	        void ui_system_skeleton.renderSkeleton(this.isTemplate ? templateSkeletonPath : skeletonPath, this.$refs.skeleton);
	      }
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
	    }
	  },
	  template: `
		<div class="tasks-full-card" :class="{ '--blur': isDescriptionSheetShown }" :data-task-id="taskId" data-task-full>
			<template v-if="task && !isPartiallyLoaded && !isLoading">
				<div
					ref="main"
					class="tasks-full-card-main"
					:class="{ '--overlay': isBottomSheetShown }"
					:style="{ width: (isTemplate ? '100%' : fullCardWidth + 'px') }"
				>
					<div class="tasks-full-card-content" :data-task-card-scroll="taskId" ref="scrollContent">
						<div ref="title">
							<TaskHeader/>
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
								class="tasks-full-card-field-container"
								data-field-container
								@mouseover="isPrimaryFieldsHovered = true"
								@mouseleave="isPrimaryFieldsHovered = false"
							>
								<FieldList :fields="primaryFields"/>
							</div>
							<div class="tasks-full-card-chips-fields">
								<div
									v-if="emailFields.length > 0"
									class="tasks-full-card-field-container"
									data-field-container
								>
									<FieldList :fields="emailFields"/>
								</div>
								<div
									v-if="!isTemplate && (task.requireResult || wasFilled(TaskField.Results))"
									class="tasks-full-card-field-container --custom"
								>
									<Results
										v-model:isSheetShown="isResultEditorSheetShown"
										v-model:isListSheetShown="isResultListSheetShown"
										:sheetBindProps
									/>
								</div>
								<div
									v-if="isDiskModuleInstalled && (files.length > 0 || wasFilled(TaskField.Files))"
									class="tasks-full-card-field-container --small-vertical-padding"
									data-field-container
								>
									<Files v-model:isSheetShown="isFilesSheetShown" :taskId :sheetBindProps/>
								</div>
								<div
									v-if="wasFilled(TaskField.CheckList)"
									class="tasks-full-card-field-container --custom"
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
								<div
									v-if="!isTemplate && isEdit && wasFilled(TaskField.Placements)"
									class="tasks-full-card-field-container --custom"
								>
									<Placements/>
								</div>
								<div
									v-if="!isTemplate && wasFilled(TaskField.Reminders)"
									class="tasks-full-card-field-container --custom"
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
									class="tasks-full-card-field-container"
									data-field-container
								>
									<FieldList :fields="tagsFields"/>
								</div>
								<div
									v-if="wasFilled(TaskField.Parent)"
									class="tasks-full-card-field-container --custom"
									data-field-container
								>
									<ParentTask/>
								</div>
								<div
									v-if="wasFilled(TaskField.SubTasks) && !isCopyMode"
									class="tasks-full-card-field-container --custom --task-list"
									data-field-container
								>
									<SubTasks/>
								</div>
								<div
									v-if="wasFilled(TaskField.RelatedTasks)"
									class="tasks-full-card-field-container --custom --task-list"
									data-field-container
								>
									<RelatedTasks/>
								</div>
								<div
									v-if="!isTemplate && wasFilled(TaskField.Gantt)"
									class="tasks-full-card-field-container --custom --task-list"
									data-field-container
								>
									<Gantt/>
								</div>
								<div
									v-if="wasFilled(TaskField.DatePlan)"
									class="tasks-full-card-field-container"
									data-field-container
								>
									<DatePlan v-model:isSheetShown="isDatePlanSheetShown" :sheetBindProps/>
								</div>
								<div
									v-if="isTemplate && wasFilled(TaskField.Replication)"
									class="tasks-full-card-field-container --custom tasks-full-card-field-container-replication"
									data-field-container
								>
									<Replication
										v-model:isSheetShown="isReplicationSheetShown"
										v-model:isHistorySheetShown="isReplicationHistorySheetShown"
										:sheetBindProps
									/>
								</div>
							<div
								v-if="shouldShowUserFields"
								class="tasks-full-card-field-container --custom"
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
						@template="handleTemplate"
					/>
					<ContentResizer v-if="!isTemplate" @endResize="handleEndResize"/>
					<DropZone
						v-if="isDiskModuleInstalled && !isBottomSheetShown && task.rights.edit"
						:container="$refs.main || {}"
						:entityId="taskId"
						:entityType="EntityTypes.Task"
					/>
				</div>
				<Chat v-if="!isTemplate"/>
			</template>
			<template v-else-if="isLoading">
				<div ref="skeleton" style="width: 100%;"/>
			</template>
			<Placeholder
				v-else
				:imgSrc="placeholderOptions.imgSrc"
				:head="placeholderOptions.head"
				:descr="placeholderOptions.descr"
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
	var _params = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("params");
	var _slider = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("slider");
	var _application = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("application");
	var _handlers = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handlers");
	var _needToReloadGrid = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("needToReloadGrid");
	var _isCloseConfirmed = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isCloseConfirmed");
	var _shouldCloseComplete = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("shouldCloseComplete");
	var _mountApplication = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mountApplication");
	var _unmountApplication = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("unmountApplication");
	var _subscribe = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("subscribe");
	var _unsubscribe = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("unsubscribe");
	var _handleTaskUpdate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleTaskUpdate");
	var _handleTaskCardInit = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleTaskCardInit");
	var _handleTaskAdd = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleTaskAdd");
	var _handleTemplateAdd = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleTemplateAdd");
	var _handleTemplateUpdate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleTemplateUpdate");
	var _updateSliderUrl = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateSliderUrl");
	var _updateSliderTitle = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateSliderTitle");
	var _onTryClose = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onTryClose");
	var _onClose = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onClose");
	var _openViewSliderCard = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openViewSliderCard");
	var _openHistory = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openHistory");
	var _openCompactCard = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openCompactCard");
	var _openGrid = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openGrid");
	var _openTemplateHistory = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openTemplateHistory");
	var _handlePopupShow = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handlePopupShow");
	class TaskFullCard {
	  constructor(_params2 = {}) {
	    var _babelHelpers$classPr;
	    Object.defineProperty(this, _updateSliderTitle, {
	      value: _updateSliderTitle2
	    });
	    Object.defineProperty(this, _updateSliderUrl, {
	      value: _updateSliderUrl2
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
	    Object.defineProperty(this, _slider, {
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
	    Object.defineProperty(this, _needToReloadGrid, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _isCloseConfirmed, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _shouldCloseComplete, {
	      writable: true,
	      value: true
	    });
	    Object.defineProperty(this, _handleTaskUpdate, {
	      writable: true,
	      value: event => {
	        const task = event.getData().task;
	        const taskId = task.id;
	        const relationIds = new Set([...task.subTaskIds, ...task.relatedTaskIds, ...task.ganttTaskIds]);
	        const isRelationTaskUpdated = relationIds.has(taskId);
	        const fields = Object.keys(event.getData().fields);
	        const fieldsForReloadGrid = new Set(['deadlineTs', 'responsibleIds']);
	        const isFieldsForGridUpdated = fields.some(it => fieldsForReloadGrid.has(it));
	        if (isRelationTaskUpdated || taskId === babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId && isFieldsForGridUpdated) {
	          babelHelpers.classPrivateFieldLooseBase(this, _needToReloadGrid)[_needToReloadGrid] = true;
	        }
	        babelHelpers.classPrivateFieldLooseBase(this, _updateSliderTitle)[_updateSliderTitle](task.title);
	      }
	    });
	    Object.defineProperty(this, _handleTaskCardInit, {
	      writable: true,
	      value: event => {
	        const task = event.getData().task;
	        babelHelpers.classPrivateFieldLooseBase(this, _updateSliderTitle)[_updateSliderTitle](task.title);
	      }
	    });
	    Object.defineProperty(this, _handleTaskAdd, {
	      writable: true,
	      value: event => {
	        const initialTask = event.getData().initialTask;
	        if (initialTask.id !== babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId) {
	          return;
	        }
	        const task = event.getData().task;
	        openedCards.delete(babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId);
	        babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId = task.id;
	        openedCards.add(babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId);
	        babelHelpers.classPrivateFieldLooseBase(this, _isCloseConfirmed)[_isCloseConfirmed] = true;
	        babelHelpers.classPrivateFieldLooseBase(this, _updateSliderTitle)[_updateSliderTitle](task.title);
	        babelHelpers.classPrivateFieldLooseBase(this, _updateSliderUrl)[_updateSliderUrl]();
	      }
	    });
	    Object.defineProperty(this, _handleTemplateAdd, {
	      writable: true,
	      value: event => {
	        const initialTemplate = event.getData().initialTemplate;
	        if (initialTemplate.id !== babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId) {
	          return;
	        }
	        const template = event.getData().template;
	        babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId = template.id;
	        babelHelpers.classPrivateFieldLooseBase(this, _isCloseConfirmed)[_isCloseConfirmed] = true;
	        babelHelpers.classPrivateFieldLooseBase(this, _updateSliderTitle)[_updateSliderTitle](template.title);
	        babelHelpers.classPrivateFieldLooseBase(this, _updateSliderUrl)[_updateSliderUrl]();
	      }
	    });
	    Object.defineProperty(this, _handleTemplateUpdate, {
	      writable: true,
	      value: event => {
	        const template = event.getData().template;
	        babelHelpers.classPrivateFieldLooseBase(this, _updateSliderTitle)[_updateSliderTitle](template.title);
	      }
	    });
	    Object.defineProperty(this, _onTryClose, {
	      writable: true,
	      value: event => {
	        if (event.getData().taskId === babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId) {
	          babelHelpers.classPrivateFieldLooseBase(this, _slider)[_slider].close();
	        }
	      }
	    });
	    Object.defineProperty(this, _onClose, {
	      writable: true,
	      value: event => {
	        if (event.getData().taskId === babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId) {
	          babelHelpers.classPrivateFieldLooseBase(this, _isCloseConfirmed)[_isCloseConfirmed] = true;
	          babelHelpers.classPrivateFieldLooseBase(this, _slider)[_slider].close();
	        }
	      }
	    });
	    Object.defineProperty(this, _openViewSliderCard, {
	      writable: true,
	      value: baseEvent => {
	        const {
	          taskId
	        } = baseEvent.getData();
	        babelHelpers.classPrivateFieldLooseBase(this, _shouldCloseComplete)[_shouldCloseComplete] = false;
	        main_sidepanel.SidePanel.Instance.open(new main_core.Uri(tasks_v2_application_taskCard.TaskCard.getUrl(taskId)).setQueryParam('OLD_FORM', 'Y').toString(), {
	          cacheable: false,
	          requestMethod: 'post',
	          events: {
	            onCloseComplete: () => {
	              if (babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].closeCompleteUrl) {
	                location.href = babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].closeCompleteUrl;
	              }
	            }
	          }
	        });
	        babelHelpers.classPrivateFieldLooseBase(this, _slider)[_slider].close(true);
	      }
	    });
	    Object.defineProperty(this, _openHistory, {
	      writable: true,
	      value: async baseEvent => {
	        const {
	          taskId
	        } = baseEvent.getData();
	        const {
	          HistoryGrid
	        } = await main_core.Runtime.loadExtension('tasks.v2.application.history-grid');
	        HistoryGrid.openHistoryGrid({
	          taskId
	        });
	      }
	    });
	    Object.defineProperty(this, _openCompactCard, {
	      writable: true,
	      value: async baseEvent => {
	        const params = baseEvent.getData();
	        tasks_v2_application_taskCard.TaskCard.showCompactCard({
	          ...params,
	          groupId: babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].groupId
	        });
	      }
	    });
	    Object.defineProperty(this, _openGrid, {
	      writable: true,
	      value: baseEvent => {
	        const {
	          taskId,
	          type
	        } = baseEvent.getData();
	        const userId = tasks_v2_core.Core.getParams().currentUser.id;
	        main_sidepanel.SidePanel.Instance.open(`/company/personal/user/${userId}/tasks/?relationToId=${taskId}&relationType=${type}`, {
	          newWindowLabel: false,
	          copyLinkLabel: false
	        });
	      }
	    });
	    Object.defineProperty(this, _openTemplateHistory, {
	      writable: true,
	      value: baseEvent => {
	        const params = baseEvent.getData();
	        let templateHistoryGrid = null;
	        BX.SidePanel.Instance.open('tasks-template-history-grid', {
	          contentCallback: async slider => {
	            const exports = await main_core.Runtime.loadExtension('tasks.v2.application.template-history-grid');
	            templateHistoryGrid = new exports.TemplateHistoryGrid(params);
	            return templateHistoryGrid.mount(slider);
	          },
	          events: {
	            onClose: () => {
	              var _templateHistoryGrid;
	              return (_templateHistoryGrid = templateHistoryGrid) == null ? void 0 : _templateHistoryGrid.unmount();
	            }
	          },
	          cacheable: false,
	          width: 1200
	        });
	      }
	    });
	    Object.defineProperty(this, _handlePopupShow, {
	      writable: true,
	      value: event => {
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
	      }
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _params)[_params] = Object.fromEntries(Object.entries(_params2).filter(([, value]) => !main_core.Type.isUndefined(value)));
	    (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _params)[_params]).taskId || (_babelHelpers$classPr.taskId = main_core.Text.getRandom());
	    if (babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId === 'template0') {
	      babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId = tasks_v2_lib_idUtils.idUtils.boxTemplate(main_core.Text.getRandom());
	    }
	  }
	  static isCardOpened(taskId) {
	    var _Core$getStore;
	    const task = (_Core$getStore = tasks_v2_core.Core.getStore()) == null ? void 0 : _Core$getStore.getters[`${tasks_v2_const.Model.Tasks}/getById`](taskId);
	    return openedCards.has(task == null ? void 0 : task.id);
	  }
	  async mount(slider) {
	    var _babelHelpers$classPr2, _babelHelpers$classPr3, _babelHelpers$classPr4, _Core$getParams$defau;
	    if (!slider.isOpen()) {
	      return;
	    }
	    const queryParams = new main_core.Uri((_babelHelpers$classPr2 = (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].link) == null ? void 0 : _babelHelpers$classPr3.url) != null ? _babelHelpers$classPr2 : babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].url).getQueryParams();
	    babelHelpers.classPrivateFieldLooseBase(this, _params)[_params] = {
	      ...tasks_v2_provider_service_taskService.TaskMappers.mapSliderDataToModel({
	        ...queryParams,
	        ...slider.getRequestParams()
	      }),
	      ...babelHelpers.classPrivateFieldLooseBase(this, _params)[_params],
	      ...(['tasks_planning', 'tasks_kanban_sprint'].includes(queryParams.SCOPE) ? {
	        deadlineTs: 0
	      } : {})
	    };
	    (_babelHelpers$classPr4 = babelHelpers.classPrivateFieldLooseBase(this, _params)[_params]).groupId || (_babelHelpers$classPr4.groupId = ((_Core$getParams$defau = tasks_v2_core.Core.getParams().defaultCollab) == null ? void 0 : _Core$getParams$defau.id) || undefined);
	    babelHelpers.classPrivateFieldLooseBase(this, _slider)[_slider] = slider;
	    babelHelpers.classPrivateFieldLooseBase(this, _updateSliderUrl)[_updateSliderUrl]();
	    babelHelpers.classPrivateFieldLooseBase(this, _subscribe)[_subscribe]();
	    babelHelpers.classPrivateFieldLooseBase(this, _application)[_application] = await babelHelpers.classPrivateFieldLooseBase(this, _mountApplication)[_mountApplication](slider.getContentContainer());
	    openedCards.add(babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId);
	  }
	  unmount() {
	    babelHelpers.classPrivateFieldLooseBase(this, _unmountApplication)[_unmountApplication]();
	    babelHelpers.classPrivateFieldLooseBase(this, _unsubscribe)[_unsubscribe]();
	    if (babelHelpers.classPrivateFieldLooseBase(this, _needToReloadGrid)[_needToReloadGrid] && BX.Tasks.Util) {
	      const id = babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId;
	      BX.Tasks.Util.fireGlobalTaskEvent('UPDATE', {
	        ID: id
	      }, {
	        STAY_AT_PAGE: true
	      }, {
	        id
	      });
	    }
	    openedCards.delete(babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId);
	  }
	  onClose(event) {
	    var _allChanges$find;
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isCloseConfirmed)[_isCloseConfirmed]) {
	      return;
	    }

	    /** @type {{ taskId: number | string, hasChanges: boolean }[]} */
	    const allChanges = main_core_events.EventEmitter.emit(tasks_v2_const.EventName.FullCardHasChanges, {
	      taskId: babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId
	    });
	    const hasChanges = (_allChanges$find = allChanges.find(result => result.taskId === babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId)) == null ? void 0 : _allChanges$find.hasChanges;
	    if (!hasChanges) {
	      return;
	    }
	    event.denyAction();
	    new ClosePopup().show(dialog => {
	      dialog.close();
	      babelHelpers.classPrivateFieldLooseBase(this, _isCloseConfirmed)[_isCloseConfirmed] = true;
	      babelHelpers.classPrivateFieldLooseBase(this, _slider)[_slider].close();
	    });
	  }
	  onCloseComplete() {
	    this.unmount();
	    if (babelHelpers.classPrivateFieldLooseBase(this, _shouldCloseComplete)[_shouldCloseComplete] && babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].closeCompleteUrl) {
	      location.href = babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].closeCompleteUrl;
	    }
	  }
	}
	async function _mountApplication2(container) {
	  await tasks_v2_core.Core.init();
	  const {
	    taskId,
	    analytics,
	    url,
	    link,
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
	  return application;
	}
	function _unmountApplication2() {
	  var _babelHelpers$classPr5;
	  (_babelHelpers$classPr5 = babelHelpers.classPrivateFieldLooseBase(this, _application)[_application]) == null ? void 0 : _babelHelpers$classPr5.unmount();
	  main_core_events.EventEmitter.emit(tasks_v2_const.EventName.FullCardClosed, babelHelpers.classPrivateFieldLooseBase(this, _params)[_params]);
	}
	function _subscribe2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _handlers)[_handlers] = {
	    [tasks_v2_const.EventName.FullCardInit]: babelHelpers.classPrivateFieldLooseBase(this, _handleTaskCardInit)[_handleTaskCardInit],
	    [tasks_v2_const.EventName.TaskAdded]: babelHelpers.classPrivateFieldLooseBase(this, _handleTaskAdd)[_handleTaskAdd],
	    [tasks_v2_const.EventName.TaskBeforeUpdate]: babelHelpers.classPrivateFieldLooseBase(this, _handleTaskUpdate)[_handleTaskUpdate],
	    [tasks_v2_const.EventName.TemplateAdded]: babelHelpers.classPrivateFieldLooseBase(this, _handleTemplateAdd)[_handleTemplateAdd],
	    [tasks_v2_const.EventName.TemplateBeforeUpdate]: babelHelpers.classPrivateFieldLooseBase(this, _handleTemplateUpdate)[_handleTemplateUpdate],
	    [tasks_v2_const.EventName.CloseFullCard]: babelHelpers.classPrivateFieldLooseBase(this, _onClose)[_onClose],
	    [tasks_v2_const.EventName.TryCloseFullCard]: babelHelpers.classPrivateFieldLooseBase(this, _onTryClose)[_onTryClose],
	    [tasks_v2_const.EventName.OpenViewSliderCard]: babelHelpers.classPrivateFieldLooseBase(this, _openViewSliderCard)[_openViewSliderCard],
	    [tasks_v2_const.EventName.OpenCompactCard]: babelHelpers.classPrivateFieldLooseBase(this, _openCompactCard)[_openCompactCard],
	    [tasks_v2_const.EventName.OpenGrid]: babelHelpers.classPrivateFieldLooseBase(this, _openGrid)[_openGrid],
	    [tasks_v2_const.EventName.OpenTemplateHistory]: babelHelpers.classPrivateFieldLooseBase(this, _openTemplateHistory)[_openTemplateHistory],
	    [tasks_v2_const.EventName.OpenHistory]: babelHelpers.classPrivateFieldLooseBase(this, _openHistory)[_openHistory],
	    'BX.Main.Popup:onShow': babelHelpers.classPrivateFieldLooseBase(this, _handlePopupShow)[_handlePopupShow]
	  };
	  Object.entries(babelHelpers.classPrivateFieldLooseBase(this, _handlers)[_handlers]).forEach(([event, handler]) => main_core_events.EventEmitter.subscribe(event, handler));
	}
	function _unsubscribe2() {
	  Object.entries(babelHelpers.classPrivateFieldLooseBase(this, _handlers)[_handlers]).forEach(([event, handler]) => main_core_events.EventEmitter.unsubscribe(event, handler));
	}
	function _updateSliderUrl2() {
	  const taskId = Number.isInteger(babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId) ? babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId : 0;
	  const taskUrl = tasks_v2_application_taskCard.TaskCard.getUrl(babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId, babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].groupId);
	  if (!tasks_v2_lib_idUtils.idUtils.isTemplate(babelHelpers.classPrivateFieldLooseBase(this, _params)[_params].taskId)) {
	    babelHelpers.classPrivateFieldLooseBase(this, _slider)[_slider].setMinimizeOptions({
	      entityType: 'tasks:task',
	      entityName: main_core.Loc.getMessage('INTRANET_BINDINGS_TASK'),
	      url: taskUrl,
	      entityId: taskId
	    });
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _slider)[_slider].setUrl(taskUrl);
	  main_sidepanel.SidePanel.Instance.resetBrowserHistory();
	}
	function _updateSliderTitle2(title) {
	  if (main_core.Type.isStringFilled(title)) {
	    babelHelpers.classPrivateFieldLooseBase(this, _slider)[_slider].setTitle(title);
	    main_sidepanel.SidePanel.Instance.updateBrowserTitle();
	  }
	}

	var marshmallow_sad_pink_with_orange_lock = "/bitrix/js/tasks/v2/application/task-full-card/dist/images/marshmallow_sad_pink_with_orange_lock.png";

	var marshmallow_sad_pink_with_orange_lock$1 = /*#__PURE__*/Object.freeze({
		default: marshmallow_sad_pink_with_orange_lock
	});

	exports.TaskFullCard = TaskFullCard;

}((this.BX.Tasks.V2.Application = this.BX.Tasks.V2.Application || {}),BX.SidePanel,BX.Vue3.Mixins,BX.UI.System,BX.Tasks.V2.Lib,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component,BX.Tasks.V2.Component,BX.Tasks.V2.Component,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.UI.NotificationManager,BX.Tasks.V2.Lib,BX.UI.System.Chip.Vue,BX.Tasks.V2,BX.Tasks.V2.Component,BX.Vue3,BX.UI.System.Skeleton.Vue,BX.UI.System.Typography.Vue,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Lib,BX.Tasks.V2.Component,BX.Event,BX.Vue3.Vuex,BX.UI.System.Menu,BX.UI.IconSet,BX,BX.Tasks.V2.Application,BX.Tasks.V2.Const,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Provider.Service,BX.Vue3.Components,BX,BX.UI.Dialogs));
//# sourceMappingURL=task-full-card.bundle.js.map
