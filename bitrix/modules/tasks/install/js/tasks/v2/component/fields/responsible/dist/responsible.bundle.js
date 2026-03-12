/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,ui_iconSet_api_vue,ui_iconSet_outline,tasks_v2_core,tasks_v2_component_elements_participants,tasks_v2_lib_ahaMoments,tasks_v2_lib_fieldHighlighter,tasks_v2_lib_analytics,tasks_v2_provider_service_taskService,tasks_v2_const,ui_vue3_directives_hint,ui_system_typography_vue,ui_switcher,ui_vue3_components_switcher,tasks_v2_component_elements_questionMark,tasks_v2_component_elements_hint,tasks_v2_lib_idUtils,main_core,ui_vue3,tasks_v2_component_elements_userAvatarList) {
	'use strict';

	const responsibleMeta = Object.freeze({
	  id: tasks_v2_const.TaskField.Responsible,
	  hint: main_core.Loc.getMessage('TASKS_V2_RESPONSIBLE_MANY_AHA'),
	  getTitle: isMany => {
	    return isMany ? main_core.Loc.getMessage('TASKS_V2_RESPONSIBLE_TITLE_MANY') : main_core.Loc.getMessage('TASKS_V2_RESPONSIBLE_TITLE');
	  }
	});

	// @vue/component
	const ForNewUserSwitcher = {
	  name: 'ForNewUserSwitcher',
	  components: {
	    Switcher: ui_vue3_components_switcher.Switcher,
	    TextSm: ui_system_typography_vue.TextSm,
	    QuestionMark: tasks_v2_component_elements_questionMark.QuestionMark
	  },
	  directives: {
	    hint: ui_vue3_directives_hint.hint
	  },
	  inject: {
	    task: {},
	    isTemplate: {}
	  },
	  props: {
	    isChecked: {
	      type: Boolean,
	      required: true
	    }
	  },
	  emits: ['update:isChecked'],
	  setup() {},
	  computed: {
	    disabled() {
	      return this.isTemplate && (this.task.replicate || tasks_v2_lib_idUtils.idUtils.isTemplate(this.task.parentId));
	    },
	    options() {
	      return {
	        size: ui_switcher.SwitcherSize.extraSmall,
	        useAirDesign: true
	      };
	    },
	    tooltip() {
	      if (!this.disabled) {
	        return null;
	      }
	      return () => tasks_v2_component_elements_hint.tooltip({
	        text: this.loc('TASKS_TASK_TEMPLATE_COMPONENT_TEMPLATE_NO_TYPE_NEW_TEMPLATE_NOTICE'),
	        popupOptions: {
	          offsetLeft: 10
	        },
	        timeout: 200
	      });
	    }
	  },
	  methods: {
	    handleClick() {
	      if (!this.disabled) {
	        this.$emit('update:isChecked', !this.isChecked);
	      }
	    }
	  },
	  template: `
		<div :class="['tasks-field-responsible-new-user', { '--disabled': disabled }]">
			<div v-hint="tooltip" class="tasks-field-responsible-new-user-switcher" @click="handleClick">
				<Switcher :isChecked :options/>
				<TextSm className="tasks-field-responsible-new-user-text">
					{{ loc('TASKS_V2_RESPONSIBLE_FOR_NEW_USER') }}
				</TextSm>
			</div>
			<QuestionMark :hintText="loc('TASKS_V2_RESPONSIBLE_FOR_NEW_USER_HINT')" :hintMaxWidth="320" @click.stop/>
		</div>
	`
	};

	const NewUserLabel = ui_vue3.h(tasks_v2_component_elements_userAvatarList.UserAvatarListUsers, {
	  users: [{
	    name: main_core.Loc.getMessage('TASKS_V2_RESPONSIBLE_NEW_USER'),
	    type: 'employee'
	  }],
	  readonly: true
	});

	// @vue/component
	const Responsible = {
	  name: 'TaskResponsible',
	  components: {
	    Participants: tasks_v2_component_elements_participants.Participants,
	    BIcon: ui_iconSet_api_vue.BIcon,
	    ForNewUserSwitcher,
	    NewUserLabel,
	    Hint: tasks_v2_component_elements_hint.Hint,
	    TextXs: ui_system_typography_vue.TextXs
	  },
	  inject: {
	    analytics: {},
	    cardType: {}
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    },
	    isSingle: {
	      type: Boolean,
	      default: false
	    },
	    avatarOnly: {
	      type: Boolean,
	      default: false
	    }
	  },
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline,
	      responsibleMeta
	    };
	  },
	  data() {
	    return {
	      isManyAhaShown: false
	    };
	  },
	  computed: {
	    forNewUser: {
	      get() {
	        return this.task.isForNewUser;
	      },
	      set(isForNewUser) {
	        void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	          isForNewUser,
	          responsibleIds: isForNewUser ? [0] : [this.currentUserId]
	        });
	      }
	    },
	    currentUserId() {
	      return tasks_v2_core.Core.getParams().currentUser.id;
	    },
	    task() {
	      return tasks_v2_provider_service_taskService.taskService.getStoreTask(this.taskId);
	    },
	    isEdit() {
	      return tasks_v2_lib_idUtils.idUtils.isReal(this.taskId);
	    },
	    isTemplate() {
	      return tasks_v2_lib_idUtils.idUtils.isTemplate(this.taskId);
	    },
	    isFlowFilledOnAdd() {
	      return this.task.flowId > 0 && !this.isEdit;
	    },
	    single() {
	      return this.isSingle || !this.isTemplate && this.isEdit;
	    },
	    dataset() {
	      return {
	        'data-task-id': this.taskId,
	        'data-task-field-id': responsibleMeta.id,
	        'data-task-field-value': this.task.responsibleIds[0]
	      };
	    },
	    isAdmin() {
	      return tasks_v2_core.Core.getParams().rights.user.admin;
	    }
	  },
	  methods: {
	    updateTask(responsibleIds) {
	      if (responsibleIds.length === 0) {
	        responsibleIds.push(this.task.responsibleIds[0]);
	      }
	      const currentIds = new Set(this.task.responsibleIds);
	      void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	        responsibleIds
	      });
	      if (responsibleIds.some(id => !currentIds.has(id))) {
	        var _this$task$auditorsId, _this$task$auditorsId2, _this$task$accomplice, _this$task$accomplice2;
	        tasks_v2_lib_analytics.analytics.sendAssigneeChange(this.analytics, {
	          cardType: this.cardType,
	          taskId: main_core.Type.isNumber(this.taskId) ? this.taskId : 0,
	          viewersCount: (_this$task$auditorsId = (_this$task$auditorsId2 = this.task.auditorsIds) == null ? void 0 : _this$task$auditorsId2.length) != null ? _this$task$auditorsId : 0,
	          coexecutorsCount: (_this$task$accomplice = (_this$task$accomplice2 = this.task.accomplicesIds) == null ? void 0 : _this$task$accomplice2.length) != null ? _this$task$accomplice : 0
	        });
	      }
	      if (responsibleIds.length > 1) {
	        this.showManyAha();
	      }
	    },
	    handleHintClick() {
	      void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
	        creatorId: this.currentUserId
	      });
	    },
	    showManyAha() {
	      if (tasks_v2_lib_ahaMoments.ahaMoments.shouldShow(tasks_v2_const.Option.AhaResponsibleMany)) {
	        tasks_v2_lib_ahaMoments.ahaMoments.setActive(tasks_v2_const.Option.AhaResponsibleMany);
	        this.isManyAhaShown = true;
	        tasks_v2_lib_ahaMoments.ahaMoments.setPopupShown(tasks_v2_const.Option.AhaResponsibleMany);
	        void tasks_v2_lib_fieldHighlighter.fieldHighlighter.highlight(responsibleMeta.id);
	      }
	    },
	    stopManyAha() {
	      tasks_v2_lib_ahaMoments.ahaMoments.setShown(tasks_v2_const.Option.AhaResponsibleMany);
	      this.closeManyAha();
	    },
	    closeManyAha() {
	      this.isManyAhaShown = false;
	      tasks_v2_lib_ahaMoments.ahaMoments.setInactive(tasks_v2_const.Option.AhaResponsibleMany);
	    }
	  },
	  template: `
		<div ref="container">
			<div v-if="isFlowFilledOnAdd" class="tasks-field-responsible-auto">
				<BIcon :name="Outline.BOTTLENECK"/>
				<div v-if="!avatarOnly">{{ loc('TASKS_V2_RESPONSIBLE_AUTO') }}</div>
			</div>
			<NewUserLabel v-else-if="forNewUser"/>
			<Participants
				v-else
				:taskId
				:context="responsibleMeta.id"
				:userIds="task.responsibleIds"
				:canAdd="task.rights.delegate || task.rights.changeResponsible"
				:canRemove="task.rights.delegate || task.rights.changeResponsible"
				:forceEdit="!isEdit"
				:withHint="!isAdmin && !isEdit && task.creatorId !== currentUserId"
				:hintText="loc('TASKS_V2_RESPONSIBLE_CANT_CHANGE')"
				:single
				:multipleOnPlus="!single && task.responsibleIds.length === 1"
				:inline="avatarOnly || single"
				:avatarOnly
				:dataset
				:showMenu="false"
				@hintClick="handleHintClick"
				@update="updateTask"
			/>
			<ForNewUserSwitcher v-if="!isEdit && isTemplate && !avatarOnly && task.context !== 'flow'" v-model:isChecked="forNewUser"/>
		</div>
		<Hint v-if="isManyAhaShown" :bindElement="$refs.container" @close="isManyAhaShown = false">
			<div class="tasks-field-responsible-many-aha">
				<div>{{ loc('TASKS_V2_RESPONSIBLE_MANY_AHA') }}</div>
				<TextXs @click="stopManyAha">{{ loc('TASKS_V2_RESPONSIBLE_MANY_AHA_STOP') }}</TextXs>
			</div>
		</Hint>
	`
	};

	exports.Responsible = Responsible;
	exports.responsibleMeta = responsibleMeta;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX.UI.IconSet,BX,BX.Tasks.V2,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Const,BX.Vue3.Directives,BX.UI.System.Typography.Vue,BX.UI,BX.UI.Vue3.Components,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Lib,BX,BX.Vue3,BX.Tasks.V2.Component.Elements));
//# sourceMappingURL=responsible.bundle.js.map
