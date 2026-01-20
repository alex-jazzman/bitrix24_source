/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,main_core,ui_system_typography_vue,ui_iconSet_api_vue,ui_iconSet_outline,tasks_v2_application_taskCard,tasks_v2_component_fields_deadline,tasks_v2_component_fields_responsible,tasks_v2_lib_idUtils,tasks_v2_provider_service_taskService,tasks_v2_const,tasks_v2_component_elements_hoverPill,tasks_v2_application_ganttPopup,tasks_v2_provider_service_relationService,ui_system_skeleton_vue) {
	'use strict';

	// @vue/component
	const Gantt = {
	  components: {
	    HoverPill: tasks_v2_component_elements_hoverPill.HoverPill,
	    GanttMenu: tasks_v2_application_ganttPopup.GanttMenu
	  },
	  inject: {
	    parentTaskId: 'taskId'
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    }
	  },
	  data() {
	    return {
	      isMenuShown: false
	    };
	  },
	  computed: {
	    ganttLink() {
	      return this.$store.getters[`${tasks_v2_const.Model.GanttLinks}/getLink`]({
	        taskId: this.parentTaskId,
	        dependentId: this.taskId
	      });
	    },
	    type: {
	      get() {
	        var _this$ganttLink;
	        return (_this$ganttLink = this.ganttLink) == null ? void 0 : _this$ganttLink.type;
	      },
	      set(type) {
	        void tasks_v2_provider_service_relationService.ganttService.updateDependence({
	          taskId: this.parentTaskId,
	          dependentId: this.taskId,
	          type
	        });
	      }
	    },
	    typeTitle() {
	      return this.loc({
	        finish_start: 'TASKS_V2_GANTT_FINISH_START',
	        start_start: 'TASKS_V2_GANTT_START_START',
	        start_finish: 'TASKS_V2_GANTT_START_FINISH',
	        finish_finish: 'TASKS_V2_GANTT_FINISH_FINISH'
	      }[this.type]);
	    }
	  },
	  template: `
		<HoverPill textOnly noOffset ref="type" @click="isMenuShown = true">
			{{ typeTitle }}
		</HoverPill>
		<GanttMenu v-if="isMenuShown" v-model:type="type" :bindElement="$refs.type.$el" @close="isMenuShown = false"/>
	`
	};

	// @vue/component
	const TaskLine = {
	  components: {
	    TextMd: ui_system_typography_vue.TextMd,
	    BIcon: ui_iconSet_api_vue.BIcon,
	    Responsible: tasks_v2_component_fields_responsible.Responsible,
	    Deadline: tasks_v2_component_fields_deadline.Deadline,
	    Gantt
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    },
	    fields: {
	      type: Set,
	      required: true
	    }
	  },
	  emits: ['remove'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  data() {
	    return {
	      isHovered: false
	    };
	  },
	  computed: {
	    task() {
	      return tasks_v2_provider_service_taskService.taskService.getStoreTask(this.taskId);
	    },
	    isTemplate() {
	      return tasks_v2_lib_idUtils.idUtils.isTemplate(this.taskId);
	    },
	    completed() {
	      return this.task.status === tasks_v2_const.TaskStatus.Completed;
	    },
	    href() {
	      if (String(this.taskId).startsWith('tmp.')) {
	        return tasks_v2_application_taskCard.TaskCard.getUrl(tasks_v2_lib_idUtils.idUtils.boxTemplate(this.taskId.replace('tmp.', '')));
	      }
	      return tasks_v2_application_taskCard.TaskCard.getUrl(this.taskId);
	    },
	    detachReadonly() {
	      const {
	        detachParent,
	        detachRelated,
	        changeDependence
	      } = this.task.rights;
	      const canDetach = detachParent || detachRelated || changeDependence;
	      return !canDetach;
	    }
	  },
	  methods: {
	    handleRemove() {
	      if (!this.detachReadonly) {
	        this.$emit('remove');
	      }
	    }
	  },
	  template: `
		<div class="tasks-task-line-cross-background" @mouseover="isHovered = true" @mouseleave="isHovered = false"/>
		<div class="tasks-task-line-title-container" @mouseover="isHovered = true" @mouseleave="isHovered = false">
			<TextMd class="tasks-task-line-title" :class="{ '--completed': completed }" :title="task.title">
				<a :href>{{ task.title }}</a>
			</TextMd>
		</div>
		<div v-if="fields.has('responsible')" class="tasks-task-line-field">
			<Responsible :taskId avatarOnly/>
		</div>
		<div v-if="fields.has('deadline')" class="tasks-task-line-field">
			<Deadline :taskId :isTemplate compact/>
		</div>
		<div v-if="fields.has('gantt')" class="tasks-task-line-field">
			<Gantt :taskId/>
		</div>
		<div
			class="tasks-task-line-cross"
			:class="{ '--readonly': detachReadonly, '--hover': isHovered }"
			@click="handleRemove"
			@mouseover="isHovered = true"
			@mouseleave="isHovered = false"
		>
			<BIcon :name="Outline.CROSS_L" hoverable/>
		</div>
	`
	};

	// @vue/component
	const TaskLineSkeleton = {
	  components: {
	    BLine: ui_system_skeleton_vue.BLine,
	    BCircle: ui_system_skeleton_vue.BCircle
	  },
	  props: {
	    fields: {
	      type: Set,
	      required: true
	    }
	  },
	  template: `
		<BLine :width="200" :height="10"/>
		<BCircle v-if="fields.size === 2" :size="25"/>
		<BLine :width="70" :height="10" style="margin: 0 10px"/>
		<div style="width: 20px"/>
	`
	};

	const limit = tasks_v2_const.Limit.RelationList;

	// @vue/component
	const TaskList = {
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    TaskLine,
	    TaskLineSkeleton
	  },
	  props: {
	    ids: {
	      type: Array,
	      required: true
	    },
	    loadingIds: {
	      type: Array,
	      required: true
	    },
	    canOpenMore: {
	      type: Boolean,
	      default: true
	    },
	    fields: {
	      type: Set,
	      default: new Set(['responsible', 'deadline'])
	    }
	  },
	  emits: ['openMore', 'removeTask'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline,
	      limit
	    };
	  },
	  computed: {
	    limitedTasks() {
	      return this.ids.slice(0, limit);
	    },
	    moreText() {
	      const count = this.ids.length - limit;
	      return main_core.Loc.getMessagePlural('TASKS_V2_TASK_LIST_MORE', count, {
	        '#COUNT#': count
	      });
	    }
	  },
	  template: `
		<div>
			<div class="tasks-task-list" :style="{ '--fields-count': fields.size }">
				<template v-if="ids.length === 0">
					<div class="tasks-task-line-separator"/>
					<TaskLineSkeleton :fields/>
				</template>
				<template v-for="taskId in limitedTasks" :key="taskId">
					<div class="tasks-task-line-separator"/>
					<TaskLineSkeleton v-if="loadingIds.includes(taskId)" :fields/>
					<TaskLine v-else :taskId :fields @remove="$emit('removeTask', taskId)"/>
				</template>
			</div>
			<div
				v-if="ids.length > limit"
				class="tasks-task-list-more"
				:class="{ '--readonly': !canOpenMore }"
				@click="$emit('openMore')"
			>
				<div class="tasks-task-list-more-text">{{ moreText }}</div>
				<BIcon
					v-if="canOpenMore"
					class="tasks-task-list-icon"
					:name="Outline.CHEVRON_RIGHT_L"
					hoverable
				/>
			</div>
		</div>
	`
	};

	exports.TaskList = TaskList;

}((this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {}),BX,BX.UI.System.Typography.Vue,BX.UI.IconSet,BX,BX.Tasks.V2.Application,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Component.Fields,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Const,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Application,BX.Tasks.V2.Provider.Service,BX.UI.System.Skeleton.Vue));
//# sourceMappingURL=task-list.bundle.js.map
