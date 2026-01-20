/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports,im_v2_component_list_items_task,im_v2_lib_logger,im_v2_lib_entityCreator,im_v2_component_list_container_elements_baseHeaderMenu,im_v2_component_elements_menu,im_v2_const,im_v2_lib_confirm,im_v2_provider_service_chat) {
	'use strict';

	// @vue/component
	const HeaderMenu = {
	  name: 'HeaderMenu',
	  components: {
	    BaseHeaderMenu: im_v2_component_list_container_elements_baseHeaderMenu.BaseHeaderMenu,
	    MenuItem: im_v2_component_elements_menu.MenuItem
	  },
	  methods: {
	    async onReadAllClick(closeCallback) {
	      const confirmResult = await im_v2_lib_confirm.showReadMessagesConfirm(this.loc('IM_LIST_CONTAINER_TASK_HEADER_MENU_READ_ALL_CONFIRM_TEXT'));
	      if (!confirmResult) {
	        return;
	      }
	      new im_v2_provider_service_chat.ChatService().readAllByType(im_v2_const.ChatType.taskComments);
	      closeCallback();
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<BaseHeaderMenu>
			<template #menu-items="{ closeCallback }">
				<MenuItem
					:title="loc('IM_LIST_CONTAINER_TASK_HEADER_MENU_READ_ALL')"
					@click="onReadAllClick(closeCallback)"
				/>
			</template>
		</BaseHeaderMenu>
	`
	};

	// @vue/component
	const TaskListContainer = {
	  name: 'TaskListContainer',
	  components: {
	    TaskList: im_v2_component_list_items_task.TaskList,
	    HeaderMenu
	  },
	  emits: ['selectEntity'],
	  created() {
	    im_v2_lib_logger.Logger.warn('List: Task container created');
	  },
	  methods: {
	    onChatClick(dialogId) {
	      this.$emit('selectEntity', {
	        layoutName: im_v2_const.Layout.taskComments,
	        entityId: dialogId
	      });
	    },
	    onCreateClick() {
	      new im_v2_lib_entityCreator.EntityCreator().openTaskCreationForm();
	    },
	    loc(phraseCode) {
	      return this.$Bitrix.Loc.getMessage(phraseCode);
	    }
	  },
	  template: `
		<div class="bx-im-list-container-task__container">
			<div class="bx-im-list-container-task__header_container">
				<HeaderMenu />
				<div class="bx-im-list-container-task__header_title">
					{{ loc('IM_LIST_CONTAINER_TASK_HEADER_TITLE_MSGVER_1') }}
				</div>
				<div @click="onCreateClick" class="bx-im-list-container-task__header_create-task"></div>
			</div>
			<div class="bx-im-list-container-task__elements_container">
				<div class="bx-im-list-container-task__elements">
					<TaskList @chatClick="onChatClick" />
				</div>
			</div>
		</div>
	`
	};

	exports.TaskListContainer = TaskListContainer;

}((this.BX.Messenger.v2.Component.List = this.BX.Messenger.v2.Component.List || {}),BX.Messenger.v2.Component.List,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Component.List,BX.Messenger.v2.Component.Elements,BX.Messenger.v2.Const,BX.Messenger.v2.Lib,BX.Messenger.v2.Service));
//# sourceMappingURL=task-container.bundle.js.map
