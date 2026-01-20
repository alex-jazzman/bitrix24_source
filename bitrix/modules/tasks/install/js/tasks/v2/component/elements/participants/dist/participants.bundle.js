/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,tasks_v2_lib_showLimit,ui_vue3_components_popup,ui_vue3_components_richLoc,tasks_v2_core,tasks_v2_component_elements_fieldAdd,tasks_v2_component_elements_addButton,tasks_v2_component_elements_hint,tasks_v2_lib_idUtils,tasks_v2_lib_userSelectorDialog,main_core_events,ui_system_menu_vue,ui_iconSet_api_vue,ui_iconSet_outline,tasks_v2_const,tasks_v2_component_elements_hoverPill,tasks_v2_component_elements_userLabel,tasks_v2_provider_service_userService) {
	'use strict';

	// @vue/component
	const User = {
	  components: {
	    HoverPill: tasks_v2_component_elements_hoverPill.HoverPill,
	    UserLabel: tasks_v2_component_elements_userLabel.UserLabel,
	    BMenu: ui_system_menu_vue.BMenu
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    },
	    userId: {
	      type: Number,
	      required: true
	    },
	    canAdd: {
	      type: Boolean,
	      required: true
	    },
	    inline: {
	      type: Boolean,
	      required: true
	    },
	    withClear: {
	      type: Boolean,
	      required: true
	    },
	    withMenu: {
	      type: Boolean,
	      required: true
	    }
	  },
	  emits: ['edit', 'remove'],
	  data() {
	    return {
	      isMenuShown: false
	    };
	  },
	  computed: {
	    user() {
	      return this.$store.getters[`${tasks_v2_const.Model.Users}/getById`](this.userId);
	    },
	    menuOptions() {
	      const testId = `${this.taskId}-${this.userId}`;
	      return {
	        id: 'tasks-field-users-menu',
	        bindElement: this.$refs.user.$el,
	        offsetTop: 8,
	        targetContainer: document.body,
	        items: [{
	          title: this.loc('TASKS_V2_USERS_VIEW'),
	          icon: ui_iconSet_api_vue.Outline.PERSON,
	          dataset: {
	            id: `UserMenuProfile-${testId}`
	          },
	          onClick: this.openProfile
	        }, ...main_core_events.EventEmitter.emit(tasks_v2_const.EventName.UserMenuExternalItems, {
	          taskId: this.taskId,
	          userId: this.userId
	        }).flat(), this.inline && {
	          title: this.loc('TASKS_V2_USERS_EDIT'),
	          icon: ui_iconSet_api_vue.Outline.EDIT_L,
	          onClick: this.edit
	        }, !this.inline && {
	          design: ui_system_menu_vue.MenuItemDesign.Alert,
	          title: this.loc('TASKS_V2_USERS_REMOVE'),
	          icon: ui_iconSet_api_vue.Outline.TRASHCAN,
	          dataset: {
	            id: `UserMenuRemove-${testId}`
	          },
	          onClick: this.remove
	        }]
	      };
	    }
	  },
	  methods: {
	    handleClick() {
	      if (this.withMenu) {
	        this.isMenuShown = true;
	        return;
	      }
	      if (this.canAdd) {
	        this.edit();
	        return;
	      }
	      this.openProfile();
	    },
	    edit() {
	      this.$emit('edit');
	    },
	    remove() {
	      this.$emit('remove');
	    },
	    openProfile() {
	      BX.SidePanel.Instance.emulateAnchorClick(tasks_v2_provider_service_userService.userService.getUrl(this.userId));
	    }
	  },
	  template: `
		<HoverPill ref="user" :withClear @clear="remove" @click="handleClick">
			<UserLabel :user/>
		</HoverPill>
		<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
	`
	};

	// @vue/component
	const Users = {
	  components: {
	    User
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    },
	    isEdit: {
	      type: Boolean,
	      default: false
	    },
	    userIds: {
	      type: Array,
	      required: true
	    },
	    canAdd: {
	      type: Boolean,
	      default: false
	    },
	    canRemove: {
	      type: Boolean,
	      default: false
	    },
	    removableUserId: {
	      type: Number,
	      default: 0
	    },
	    single: {
	      type: Boolean,
	      default: false
	    },
	    inline: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['edit', 'remove'],
	  template: `
		<div class="tasks-field-users">
			<template v-for="userId in userIds">
				<User
					:taskId
					:userId
					:canAdd
					:inline
					:withClear="!single && !inline && (canRemove || userId === removableUserId)"
					:withMenu="isEdit && (canRemove || removableUserId === userId)"
					@edit="$emit('edit')"
					@remove="$emit('remove', userId)"
				/>
			</template>
		</div>
	`
	};

	// @vue/component
	const More = {
	  props: {
	    count: {
	      type: Number,
	      required: true
	    },
	    withRemove: {
	      type: Boolean,
	      default: false
	    },
	    inline: {
	      type: Boolean,
	      default: false
	    }
	  },
	  emits: ['showMore', 'removeAll'],
	  computed: {
	    moreFormatted() {
	      return this.loc('TASKS_V2_USERS_MORE_COUNT', {
	        '#COUNT#': this.count
	      });
	    }
	  },
	  template: `
		<div v-if="count || withRemove" :class="['tasks-field-users-footer', { '--inline': inline }]">
			<div v-if="count" class="tasks-field-users-more" @click="$emit('showMore')">
				{{ moreFormatted }}
			</div>
			<div v-if="withRemove" class="tasks-field-users-more --remove" @click="$emit('removeAll')">
				{{ loc('TASKS_V2_USERS_REMOVE_ALL') }}
			</div>
		</div>
	`
	};

	const maxUsers = 4;

	// @vue/component
	const Participants = {
	  components: {
	    RichLoc: ui_vue3_components_richLoc.RichLoc,
	    Popup: ui_vue3_components_popup.Popup,
	    HoverPill: tasks_v2_component_elements_hoverPill.HoverPill,
	    FieldAdd: tasks_v2_component_elements_fieldAdd.FieldAdd,
	    AddButton: tasks_v2_component_elements_addButton.AddButton,
	    Hint: tasks_v2_component_elements_hint.Hint,
	    UserLabel: tasks_v2_component_elements_userLabel.UserLabel,
	    Users,
	    More
	  },
	  props: {
	    taskId: {
	      type: [Number, String],
	      required: true
	    },
	    context: {
	      type: String,
	      required: true
	    },
	    userIds: {
	      type: Array,
	      required: true
	    },
	    canAdd: {
	      type: Boolean,
	      default: true
	    },
	    canRemove: {
	      type: Boolean,
	      default: true
	    },
	    withHint: {
	      type: Boolean,
	      default: false
	    },
	    hintText: {
	      type: String,
	      default: ''
	    },
	    useRemoveAll: {
	      type: Boolean,
	      default: false
	    },
	    single: {
	      type: Boolean,
	      default: false
	    },
	    multipleOnPlus: {
	      type: Boolean,
	      default: false
	    },
	    inline: {
	      type: Boolean,
	      default: false
	    },
	    avatarOnly: {
	      type: Boolean,
	      default: false
	    },
	    dataset: {
	      type: Object,
	      required: true
	    },
	    isLocked: {
	      type: Boolean,
	      default: false
	    },
	    featureId: {
	      type: String,
	      default: ''
	    }
	  },
	  emits: ['update', 'hintClick'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  data() {
	    return {
	      isDialogShown: false,
	      isMoreShown: false,
	      isHintShown: false,
	      isHovered: false
	    };
	  },
	  computed: {
	    isEdit() {
	      return tasks_v2_lib_idUtils.idUtils.isReal(this.taskId);
	    },
	    removableUserId() {
	      if (this.multipleOnPlus) {
	        return 0;
	      }
	      return this.canAdd ? tasks_v2_core.Core.getParams().currentUser.id : 0;
	    },
	    userCount() {
	      return this.userIds.length;
	    },
	    popupOptions() {
	      return () => ({
	        id: 'tasks-field-users-more-popup',
	        bindElement: this.$refs.anchor,
	        padding: 18,
	        maxWidth: 300,
	        maxHeight: 300,
	        offsetTop: 8,
	        targetContainer: document.body
	      });
	    },
	    bodyUserIds() {
	      return this.userIds.slice(0, maxUsers);
	    },
	    moreUserIds() {
	      return this.userIds.slice(maxUsers);
	    },
	    popupUserIds() {
	      return this.inline && !this.canAdd ? this.userIds : this.moreUserIds;
	    },
	    withRemove() {
	      if (!this.canRemove) {
	        return false;
	      }
	      if (!this.useRemoveAll || this.userCount <= maxUsers) {
	        return false;
	      }
	      return this.isDialogShown || this.isHovered;
	    }
	  },
	  watch: {
	    userCount() {
	      if (this.popupUserIds.length === 0) {
	        this.isMoreShown = false;
	      }
	    }
	  },
	  mounted() {
	    void tasks_v2_provider_service_userService.userService.list(this.userIds);
	  },
	  methods: {
	    getUser(userId) {
	      return this.$store.getters[`${tasks_v2_const.Model.Users}/getById`](userId);
	    },
	    handleClick() {
	      if (this.canAdd) {
	        void this.showDialog();
	        return;
	      }
	      if (this.userIds.length === 1) {
	        BX.SidePanel.Instance.emulateAnchorClick(tasks_v2_provider_service_userService.userService.getUrl(this.userIds[0]));
	        return;
	      }
	      this.isMoreShown = true;
	    },
	    handleMore() {
	      if ((!this.isEdit || this.inline) && this.canAdd) {
	        void this.showDialog();
	        return;
	      }
	      this.isMoreShown = true;
	    },
	    async showDialog(plus = false) {
	      if (this.isLocked) {
	        void tasks_v2_lib_showLimit.showLimit({
	          featureId: this.featureId,
	          bindElement: this.$refs.anchor
	        });
	        return;
	      }
	      if (this.withHint) {
	        this.isHintShown = true;
	        this.hintPromise = new Resolvable();
	        if ((await this.hintPromise) === false) {
	          return;
	        }
	      }
	      this.isDialogShown = true;
	      void tasks_v2_lib_userSelectorDialog.usersDialog.show({
	        targetNode: this.$refs.anchor,
	        ids: this.userIds,
	        selectableIds: this.canRemove ? null : new Set([this.removableUserId]),
	        onClose: this.handleDialogClose,
	        isMultiple: !this.single && (!this.multipleOnPlus || plus)
	      });
	    },
	    handleDialogClose(userIds) {
	      this.isDialogShown = false;
	      if (tasks_v2_lib_userSelectorDialog.usersDialog.getDialog().isLoaded()) {
	        this.updateUsers(userIds);
	      }
	    },
	    removeUser(userId) {
	      this.updateUsers(this.userIds.filter(id => id !== userId));
	    },
	    updateUsers(userIds) {
	      this.$emit('update', userIds);
	    },
	    handleHintClick() {
	      this.$emit('hintClick');
	      this.hintPromise.resolve(true);
	      this.isHintShown = false;
	    },
	    closeHint() {
	      this.hintPromise.resolve(false);
	      this.isHintShown = false;
	    }
	  },
	  template: `
		<div v-bind="dataset" @mouseenter="isHovered = true" @mouseleave="isHovered = false">
			<FieldAdd 
				v-if="userCount === 0"
				:icon="Outline.PERSON"
				:isLocked
				@click="showDialog"
			/>
			<div v-else-if="inline && userCount > 1 || avatarOnly" class="tasks-field-users-inline">
				<HoverPill compact @click="handleClick">
					<template v-for="userId in bodyUserIds">
						<UserLabel class="tasks-field-user --inline" :user="getUser(userId)" avatarOnly/>
					</template>
				</HoverPill>
				<More
					:count="moreUserIds.length"
					:withRemove
					inline
					@showMore="handleMore"
					@removeAll="updateUsers([])"
				/>
			</div>
			<div v-else>
				<AddButton 
					v-if="canAdd && !inline" 
					:isVisible="isDialogShown || isHovered" 
					:isLocked
					@click="showDialog(true)"
				/>
				<Users
					:taskId
					:isEdit
					:userIds="bodyUserIds"
					:canAdd
					:canRemove="canRemove && !multipleOnPlus"
					:removableUserId
					:single
					:inline
					@edit="showDialog"
					@remove="removeUser"
				/>
				<More
					:count="moreUserIds.length"
					:withRemove
					@showMore="handleMore"
					@removeAll="updateUsers([])"
				/>
			</div>
			<div ref="anchor"/>
		</div>
		<Popup v-if="isMoreShown" :options="popupOptions()" @close="isMoreShown = false">
			<Users
				:taskId
				:isEdit
				:userIds="popupUserIds"
				:canAdd
				:canRemove
				:removableUserId
				:single
				@edit="showDialog"
				@remove="removeUser"
			/>
		</Popup>
		<Hint v-if="isHintShown" :bindElement="$refs.anchor" @close="closeHint">
			<RichLoc class="tasks-field-users-hint" :text="hintText" placeholder="[action]">
				<template #action="{ text }">
					<span @click="handleHintClick">{{ text }}</span>
				</template>
			</RichLoc>
		</Hint>
	`
	};
	function Resolvable() {
	  const promise = new Promise(resolve => {
	    this.resolve = resolve;
	  });
	  promise.resolve = this.resolve;
	  return promise;
	}

	exports.Participants = Participants;

}((this.BX.Tasks.V2.Component.Elements = this.BX.Tasks.V2.Component.Elements || {}),BX.Tasks.V2.Lib,BX.UI.Vue3.Components,BX.UI.Vue3.Components,BX.Tasks.V2,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Lib,BX.Tasks.V2.Lib,BX.Event,BX.UI.System.Menu,BX.UI.IconSet,BX,BX.Tasks.V2.Const,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Component.Elements,BX.Tasks.V2.Provider.Service));
//# sourceMappingURL=participants.bundle.js.map
