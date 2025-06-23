/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,ui_vue3_components_popup,ui_vue3_components_richLoc,tasks_v2_const,tasks_v2_component_elements_hint,tasks_v2_component_elements_userCustomTagSelector) {
	'use strict';

	// @vue/component
	const Participant = {
	  name: 'TaskParticipant',
	  components: {
	    UserCustomTagSelector: tasks_v2_component_elements_userCustomTagSelector.UserCustomTagSelector,
	    Popup: ui_vue3_components_popup.Popup,
	    RichLoc: ui_vue3_components_richLoc.RichLoc,
	    Hint: tasks_v2_component_elements_hint.Hint
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    },
	    dialogOptions: {
	      type: Object,
	      required: true
	    },
	    preselected: {
	      type: Array,
	      required: true
	    },
	    canChange: {
	      type: Function,
	      required: true
	    },
	    cantChangeHint: {
	      type: String,
	      required: true
	    },
	    hintClickHandler: {
	      type: Function,
	      required: true
	    },
	    selectorWithActionMenu: {
	      type: Boolean,
	      default: false
	    },
	    dataset: {
	      type: Object,
	      default: null
	    },
	    readonly: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['update'],
	  data() {
	    return {
	      isPopupShown: false
	    };
	  },
	  computed: {
	    task() {
	      return this.$store.getters[`${tasks_v2_const.Model.Tasks}/getById`](this.taskId);
	    },
	    userInfo() {
	      var _this$preselected$;
	      const [, userId] = (_this$preselected$ = this.preselected[0]) != null ? _this$preselected$ : [];
	      return this.$store.getters[`${tasks_v2_const.Model.Users}/getById`](userId);
	    }
	  },
	  methods: {
	    handleUserSelected(user) {
	      this.$emit('update', user);
	    },
	    async onClick() {
	      if (this.canChange()) {
	        return true;
	      }
	      this.isPopupShown = true;
	      return new Promise(resolve => {
	        this.resolvePopupClosePromise = resolve;
	      });
	    },
	    handleHintClick() {
	      this.hintClickHandler();
	      this.resolvePopupClosePromise(true);
	      this.isPopupShown = false;
	    },
	    closeHint() {
	      this.resolvePopupClosePromise(false);
	      this.isPopupShown = false;
	    },
	    handleKeydown(event) {
	      if (event.key === 'Enter' && !(event.ctrlKey || event.metaKey)) {
	        void this.$refs.selector.handleClick();
	      }
	    },
	    focus() {
	      this.$refs.container.focus();
	    }
	  },
	  template: `
		<div class="tasks-field-participant" v-bind="dataset" ref="container" tabindex="0" @keydown="handleKeydown">
			<UserCustomTagSelector
				:dialogOptions="dialogOptions"
				:items="preselected"
				:userInfo="userInfo"
				:withActionMenu="selectorWithActionMenu"
				:clickHandler="onClick"
				:readonly="readonly"
				ref="selector"
				@select="handleUserSelected"
				@unfreeze="focus"
			/>
		</div>
		<Hint
			v-if="isPopupShown"
			:bindElement="$refs.container"
			@close="closeHint"
		>
			<RichLoc :text="cantChangeHint" placeholder="[action]">
				<template #action="{ text }">
					<span @click="handleHintClick">{{ text }}</span>
				</template>
			</RichLoc>
		</Hint>
	`
	};

	exports.Participant = Participant;

}((this.BX.Tasks.V2.Component.Elements = this.BX.Tasks.V2.Component.Elements || {}),BX.UI.Vue3.Components,BX.UI.Vue3.Components,BX.Tasks.V2.Const,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements));
//# sourceMappingURL=participant.bundle.js.map
