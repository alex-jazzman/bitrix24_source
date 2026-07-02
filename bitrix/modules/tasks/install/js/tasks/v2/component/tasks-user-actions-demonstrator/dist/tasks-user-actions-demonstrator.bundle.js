/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports,tasks_v2_component_tasksEntitiesDemonstrator,tasks_v2_component_elements_userAvatar,tasks_v2_provider_service_userService,ui_iconSet_api_vue,ui_vue3) {
	'use strict';

	// @vue/component
	const TasksUserActionsDemonstrator = {
	  name: 'TasksUserActionsDemonstrator',
	  components: {
	    TasksEntitiesDemonstrator: tasks_v2_component_tasksEntitiesDemonstrator.TasksEntitiesDemonstrator,
	    UserAvatar: tasks_v2_component_elements_userAvatar.UserAvatar
	  },
	  props: {
	    options: {
	      /** @type TasksUserActionsDemonstratorOptions */
	      type: Object,
	      default: null
	    }
	  },
	  emits: ['open', 'close', 'clickPopup', 'demandUserActions'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline,
	      Animated: ui_iconSet_api_vue.Animated,
	      markRaw: ui_vue3.markRaw
	    };
	  },
	  computed: {
	    optionsDefault() {
	      return {
	        isLoadingCount: false,
	        isLoadingList: false,
	        isOpenedOnClick: true,
	        isOpenedOnHover: false,
	        isDateInline: false,
	        componentOpener: null,
	        textOpener: '',
	        textHead: '',
	        userActionsCount: undefined,
	        userActionsList: [],
	        positioning: {}
	      };
	    },
	    optionsFilled() {
	      return {
	        ...this.optionsDefault,
	        ...this.options,
	        // double default protection to prevent falsy type object values
	        userActionsList: this.options.userActionsList || this.optionsDefault.userActionsList,
	        positioning: this.options.positioning || this.optionsDefault.positioning
	      };
	    },
	    optionsEntitiesDemonstrator() {
	      const entitiesList = this.optionsFilled.userActionsList.map(userAction => {
	        const userActionNew = {
	          isEntityClickable: true,
	          id: userAction.id,
	          name: userAction.name,
	          type: userAction.type,
	          optionsAvatar: {
	            src: userAction.image,
	            type: userAction.type
	          }
	        };
	        if (this.optionsFilled.isDateInline) {
	          userActionNew.tag = this.formatTs(userAction.ts);
	        } else {
	          userActionNew.tooltip = this.formatTs(userAction.ts);
	        }
	        return userActionNew;
	      });
	      return {
	        isLoadingCount: this.optionsFilled.isLoadingCount,
	        isLoadingList: this.optionsFilled.isLoadingList,
	        isOpenedOnClick: this.optionsFilled.isOpenedOnClick,
	        isOpenedOnHover: this.optionsFilled.isOpenedOnHover,
	        componentOpener: this.optionsFilled.componentOpener,
	        iconOpener: ui_iconSet_api_vue.Outline.OBSERVER,
	        textOpener: this.optionsFilled.textOpener,
	        classNamePopup: 'tasks-entities-demonstrator__popup_user-actions',
	        textHead: this.optionsFilled.textHead,
	        entitiesCount: this.optionsFilled.userActionsCount,
	        entitiesList,
	        componentAvatar: ui_vue3.markRaw(tasks_v2_component_elements_userAvatar.UserAvatar),
	        positioning: this.optionsFilled.positioning
	      };
	    }
	  },
	  methods: {
	    formatTs(ts) {
	      const dateObject = new Date(ts * 1000);
	      const isCurrentYear = dateObject.getFullYear() === new Date().getFullYear();
	      const formatDayDefault = isCurrentYear ? BX.Main.DateTimeFormat.getFormat('DAY_SHORT_MONTH_FORMAT') : BX.Main.DateTimeFormat.getFormat('MEDIUM_DATE_FORMAT');
	      const formatsDay = [['today', 'today'], ['yesterday', 'yesterday'], ['', formatDayDefault]];
	      const formatTimeOfClock = BX.Main.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
	      const dayFormatted = BX.Main.DateTimeFormat.format(formatsDay, dateObject);
	      const timeOfClockFormatted = BX.Main.DateTimeFormat.format(formatTimeOfClock, dateObject);
	      return `${dayFormatted} ${timeOfClockFormatted}`;
	    },
	    handleOpen() {
	      this.$emit('open');
	    },
	    handleClose() {
	      this.$emit('close');
	    },
	    handleClickPopup() {
	      this.$emit('clickPopup');
	    },
	    handleDemandEntities() {
	      this.$emit('demandUserActions');
	    },
	    handleClickEntity(entityId) {
	      BX.SidePanel.Instance.emulateAnchorClick(tasks_v2_provider_service_userService.userService.getUrl(entityId));
	    }
	  },
	  template: `
		<TasksEntitiesDemonstrator
			:options="optionsEntitiesDemonstrator"
			@open="handleOpen"
			@close="handleClose"
			@clickPopup="handleClickPopup"
			@demandEntities="handleDemandEntities"
			@clickEntity="handleClickEntity"
		/>
	`
	};

	exports.TasksUserActionsDemonstrator = TasksUserActionsDemonstrator;

}((this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {}),BX.Tasks.V2.Component,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Provider.Service,BX.UI.IconSet,BX.Vue3));
//# sourceMappingURL=tasks-user-actions-demonstrator.bundle.js.map
