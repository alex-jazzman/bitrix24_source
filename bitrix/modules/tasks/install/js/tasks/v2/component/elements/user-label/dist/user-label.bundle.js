/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,ui_system_skeleton_vue,ui_tooltip,tasks_v2_component_elements_userAvatar) {
	'use strict';

	// @vue/component
	const UserLabel = {
	  name: 'UiUserLabel',
	  components: {
	    UserAvatar: tasks_v2_component_elements_userAvatar.UserAvatar,
	    BCircle: ui_system_skeleton_vue.BCircle,
	    BLine: ui_system_skeleton_vue.BLine
	  },
	  props: {
	    /** @type UserModel */
	    user: {
	      type: Object,
	      required: true
	    },
	    avatarOnly: {
	      type: Boolean,
	      default: false
	    }
	  },
	  template: `
		<div v-if="user" class="b24-user-label" :bx-tooltip-user-id="user.id" bx-tooltip-context="b24">
			<UserAvatar
				:src="user.image ?? ''"
				:type="user.type"
				:borderColor="avatarOnly ? 'var(--ui-color-background-primary)' : undefined"
			/>
			<div v-if="!avatarOnly" :class="['b24-user-label-name', '--' + user.type]">{{ user.name }}</div>
		</div>
		<div v-else style="display: flex;align-items: center;min-height: 22px;">
			<BCircle :size="22"/>
			<BLine v-if="!avatarOnly" :width="130" :height="12" style="margin-left: 8px"/>
		</div>
	`
	};

	exports.UserLabel = UserLabel;

}((this.BX.Tasks.V2.Component.Elements = this.BX.Tasks.V2.Component.Elements || {}),BX.UI.System.Skeleton.Vue,BX.UI,BX.Tasks.V2.Component.Elements));
//# sourceMappingURL=user-label.bundle.js.map
