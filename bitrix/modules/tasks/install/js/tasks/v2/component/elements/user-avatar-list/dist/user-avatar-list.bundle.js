/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,ui_vue3_components_popup,tasks_v2_provider_service_userService,tasks_v2_component_elements_userAvatar,ui_tooltip,tasks_v2_component_elements_hoverPill,tasks_v2_component_elements_userLabel) {
	'use strict';

	// @vue/component
	const UserAvatarListUsers = {
	  components: {
	    HoverPill: tasks_v2_component_elements_hoverPill.HoverPill,
	    UserLabel: tasks_v2_component_elements_userLabel.UserLabel
	  },
	  props: {
	    users: {
	      type: Array,
	      required: true
	    },
	    readonly: {
	      type: Boolean,
	      default: false
	    },
	    removableUserId: {
	      type: Number,
	      default: 0
	    },
	    activeUserId: {
	      type: Number,
	      default: 0
	    },
	    compact: {
	      type: Boolean,
	      default: false
	    },
	    withoutClear: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['onUserClick', 'onUserCrossClick'],
	  methods: {
	    getNode(userId) {
	      var _this$$refs;
	      return (_this$$refs = this.$refs[`user_${userId}`]) == null ? void 0 : _this$$refs[0].$el;
	    }
	  },
	  template: `
		<template v-for="user in users" :key="user.id">
			<HoverPill
				class="b24-user-avatar-list-user"
				:compact
				:withClear="!withoutClear && (!readonly || user.id === removableUserId) && !compact"
				:active="activeUserId === user.id"
				@click.stop="$emit('onUserClick', user.id)"
				@clear="$emit('onUserCrossClick', user.id)"
			>
				<UserLabel :user :ref="'user_' + user.id" :avatarOnly="compact"/>
			</HoverPill>
		</template>
	`
	};

	// @vue/component
	const UserAvatarList = {
	  name: 'UiUserAvatarList',
	  components: {
	    Popup: ui_vue3_components_popup.Popup,
	    UserAvatar: tasks_v2_component_elements_userAvatar.UserAvatar,
	    UserAvatarListUsers
	  },
	  props: {
	    users: {
	      type: Array,
	      required: true
	    },
	    visibleAmount: {
	      type: Number,
	      default: 3
	    },
	    withPopup: {
	      type: Boolean,
	      default: true
	    }
	  },
	  data() {
	    return {
	      isPopupShown: false
	    };
	  },
	  computed: {
	    visibleUsers() {
	      return this.users.slice(0, this.visibleAmount);
	    },
	    popupUsers() {
	      return this.users.slice(this.visibleAmount);
	    },
	    count() {
	      return this.users.length;
	    },
	    invisibleCount() {
	      return this.count - this.visibleAmount;
	    },
	    popupOptions() {
	      return () => ({
	        id: 'ui-user-avatar-list-more-popup',
	        bindElement: this.$refs.more,
	        padding: 18,
	        maxWidth: 300,
	        maxHeight: window.innerHeight / 2 - 40,
	        offsetTop: 8,
	        offsetLeft: -18,
	        targetContainer: document.body
	      });
	    }
	  },
	  methods: {
	    showListUsers() {
	      if (!this.withPopup) {
	        return;
	      }
	      this.isPopupShown = true;
	    },
	    handleClickFromListUsers(userId) {
	      BX.SidePanel.Instance.emulateAnchorClick(tasks_v2_provider_service_userService.userService.getUrl(userId));
	    }
	  },
	  template: `
		<div
			ref="container"
			class="b24-user-avatar-list"
		>
			<UserAvatar
				v-for="user in visibleUsers"
				:key="user.id"
				:id="user.id"
				:src="user.image"
				:type="user.type"
				:bx-tooltip-user-id="user.id"
				bx-tooltip-context="b24"
				class="b24-user-avatar-list-item"
			/>
			<div
				v-if="count > visibleAmount"
				ref="more"
				class="b24-user-avatar-list-more"
				@click="showListUsers"
			>
				+{{ invisibleCount }}
			</div>
			<Popup
				v-if="isPopupShown"
				:options="popupOptions()"
				@close="isPopupShown = false"
			>
				<div class="b24-user-avatar-list-users --popup">
					<UserAvatarListUsers
						:users="popupUsers"
						ref="popupUserList"
						@onUserClick="(userId) => handleClickFromListUsers(userId)"
					/>
				</div>
			</Popup>
		</div>
	`
	};

	exports.UserAvatarList = UserAvatarList;
	exports.UserAvatarListUsers = UserAvatarListUsers;

}((this.BX.Tasks.V2.Component.Elements = this.BX.Tasks.V2.Component.Elements || {}),BX.UI.Vue3.Components,BX.Tasks.V2.Provider.Service,BX.Tasks.V2.Component.Elements,BX.UI,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements));
//# sourceMappingURL=user-avatar-list.bundle.js.map
