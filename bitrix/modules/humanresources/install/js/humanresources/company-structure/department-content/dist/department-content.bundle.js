/* eslint-disable */
this.BX = this.BX || {};
this.BX.Humanresources = this.BX.Humanresources || {};
(function (exports,humanresources_companyStructure_userManagementDialog,ui_iconSet_crm,humanresources_companyStructure_api,ui_entitySelector,ui_tooltip,ui_buttons,humanresources_companyStructure_permissionChecker,ui_iconSet_api_core,ui_iconSet_main,main_core_events,ui_avatar,humanresources_companyStructure_orgChart,humanresources_companyStructure_utils,ui_notification,im_public_iframe,humanresources_companyStructure_structureComponents,main_core,humanresources_companyStructure_chartStore,ui_vue3_pinia) {
	'use strict';

	const HeadListDataTestIds = Object.freeze({
	  containerDataTestId: 'hr-department-content_users-tab__head-list-container',
	  listActionButtonDataTestId: 'hr-department-content_users-tab__head-list-action-button',
	  listActonMenuDataTestId: 'hr-department-content_users-tab__head-list-action-menu-container',
	  listCounterDataTestId: 'hr-department-content_users-tab__head-list-counter'
	});
	const EmployeeListDataTestIds = Object.freeze({
	  containerDataTestId: 'hr-department-content_users-tab__employee-list-container',
	  listActionButtonDataTestId: 'hr-department-content_users-tab__employee-list-action-button',
	  listActonMenuDataTestId: 'hr-department-content_users-tab__employee-list-action-menu-container',
	  listCounterDataTestId: 'hr-department-content_users-tab__employee-list-counter'
	});

	const EmptyTabAddButton = {
	  name: 'emptyStateContainer',
	  components: {
	    RouteActionMenu: humanresources_companyStructure_structureComponents.RouteActionMenu
	  },
	  props: {
	    departmentId: {
	      type: Number,
	      required: true
	    },
	    entityType: {
	      type: String,
	      default: humanresources_companyStructure_utils.EntityTypes.department
	    }
	  },
	  data() {
	    return {
	      menuVisible: false
	    };
	  },
	  computed: {
	    menu() {
	      return new humanresources_companyStructure_orgChart.EmptyUsersTabActionMenu(this.departmentId, humanresources_companyStructure_api.AnalyticsSourceType.DETAIL, null, this.entityType);
	    },
	    ...ui_vue3_pinia.mapState(humanresources_companyStructure_chartStore.useChartStore, ['focusedNode'])
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    onClick() {
	      if (this.entityType === humanresources_companyStructure_utils.EntityTypes.team && this.menu.items.length === 1) {
	        // for teams for now there can be only one item, so we invoke action right away
	        this.onActionMenuItemClick(this.menu.items[0].id);
	      } else {
	        this.menuVisible = true;
	      }
	    },
	    onActionMenuItemClick(actionId) {
	      this.menu.onActionMenuItemClick(actionId);
	    }
	  },
	  template: `
		<div class="hr-department-detail-content__users-empty-tab-add_buttons-container">
			<button
				class="hr-add-employee-empty-tab-entity-btn ui-btn ui-btn ui-btn-sm ui-btn-primary ui-btn-round"
				ref="actionMenuButton"
				@click.stop="onClick"
				data-id="hr-department-detail-content__user-empty-tab_add-user-button"
			>
				<span class="hr-add-employee-empty-tab-entity-btn-text">{{loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_EMPTY_EMPLOYEES_ADD_USER_ADD_BUTTON')}}</span>
			</button>
			<RouteActionMenu
				v-if="menuVisible"
				:id="'empty-state-department-detail-add-menu-' + focusedNode"
				:items="menu.items"
				:width="302"
				:bindElement="$refs['actionMenuButton']"
				@action="onActionMenuItemClick"
				@close="menuVisible = false"
			/>
		</div>
	`
	};

	const DepartmentAPI = {
	  getPagedEmployees: (id, page, countPerPage) => {
	    return humanresources_companyStructure_api.getData('humanresources.api.Structure.Node.Member.Employee.list', {
	      nodeId: id,
	      page,
	      countPerPage
	    });
	  },
	  removeUserFromDepartment: (nodeId, userId) => {
	    return humanresources_companyStructure_api.postData('humanresources.api.Structure.Node.Member.deleteUser', {
	      nodeId,
	      userId
	    });
	  },
	  moveUserToDepartment: (nodeId, userId, targetNodeId, role) => {
	    return humanresources_companyStructure_api.postData('humanresources.api.Structure.Node.Member.moveUser', {
	      nodeId,
	      userId,
	      targetNodeId,
	      roleXmlId: role
	    });
	  },
	  isUserInMultipleDepartments: userId => {
	    return humanresources_companyStructure_api.getData('humanresources.api.User.isUserInMultipleDepartments', {
	      userId
	    });
	  },
	  getUserInfo: (nodeId, userId) => {
	    return humanresources_companyStructure_api.getData('humanresources.api.User.getInfoByUserMember', {
	      nodeId,
	      userId
	    });
	  },
	  fireUser: userId => {
	    return humanresources_companyStructure_api.postData('intranet.user.fire', {
	      userId
	    });
	  },
	  findMemberByQuery: (nodeId, query) => {
	    return humanresources_companyStructure_api.getData('humanresources.api.Structure.Node.Member.find', {
	      nodeId,
	      query
	    });
	  },
	  getChatsAndChannels: nodeId => {
	    return humanresources_companyStructure_api.getData('humanresources.api.Structure.Node.Member.Chat.getList', {
	      nodeId
	    });
	  },
	  saveChats: (nodeId, ids = {}, removeIds = {}, parentId = null) => {
	    return humanresources_companyStructure_api.postData('humanresources.api.Structure.Node.Member.Chat.saveChatList', {
	      nodeId,
	      ids,
	      removeIds,
	      parentId
	    });
	  }
	};

	const markDescendantsForChatReload = childrenIds => {
	  const store = humanresources_companyStructure_chartStore.useChartStore();
	  const queue = [...childrenIds];
	  const visited = new Set();
	  const maxIterations = 10000;
	  let iterations = 0;
	  while (queue.length > 0 && iterations < maxIterations) {
	    iterations++;
	    const childId = queue.shift();
	    if (visited.has(childId)) {
	      continue;
	    }
	    visited.add(childId);
	    const childDepartment = store.departments.get(childId);
	    if (!childDepartment) {
	      continue;
	    }
	    childDepartment.chatsDetailed = null;
	    childDepartment.channelsDetailed = null;
	    if (childDepartment.children && childDepartment.children.length > 0) {
	      queue.push(...childDepartment.children);
	    }
	  }
	};
	const DepartmentContentActions = {
	  moveUserToDepartment: (departmentId, userId, targetDepartmentId, role) => {
	    var _department$employees;
	    const store = humanresources_companyStructure_chartStore.useChartStore();
	    const department = store.departments.get(departmentId);
	    const targetDepartment = store.departments.get(targetDepartmentId);
	    if (!department || !targetDepartment) {
	      return;
	    }
	    const oldMemberRoles = humanresources_companyStructure_api.getMemberRoles(department.entityType);
	    const targetMemberRoles = humanresources_companyStructure_api.getMemberRoles(targetDepartment.entityType);
	    const user = role === oldMemberRoles.employee ? (_department$employees = department.employees) == null ? void 0 : _department$employees.find(employee => employee.id === userId) : department.heads.find(head => head.id === userId);
	    if (!user) {
	      return;
	    }
	    department.userCount -= 1;
	    if (role === oldMemberRoles.employee) {
	      department.employees = department.employees.filter(employee => employee.id !== userId);
	    } else {
	      department.heads = department.heads.filter(head => head.id !== userId);
	    }
	    targetDepartment.userCount += 1;
	    if (userId === store.userId) {
	      store.changeCurrentDepartment(departmentId, targetDepartmentId);
	    }
	    user.role = targetMemberRoles.employee;
	    if (!targetDepartment.employees) {
	      return;
	    }
	    targetDepartment.employees.push(user);
	  },
	  removeUserFromDepartment: (departmentId, userId, role) => {
	    const store = humanresources_companyStructure_chartStore.useChartStore();
	    const department = store.departments.get(departmentId);
	    const oldMemberRoles = humanresources_companyStructure_api.getMemberRoles(department.entityType);
	    if (!department) {
	      return;
	    }
	    if (userId === store.userId) {
	      store.changeCurrentDepartment(departmentId);
	    }
	    department.userCount -= 1;
	    if (role === oldMemberRoles.employee) {
	      department.employees = department.employees.filter(employee => employee.id !== userId);
	      return;
	    }
	    department.heads = department.heads.filter(head => head.id !== userId);
	  },
	  updateEmployees: (departmentId, employees) => {
	    const {
	      departments
	    } = humanresources_companyStructure_chartStore.useChartStore();
	    const department = departments.get(departmentId);
	    if (!department) {
	      return;
	    }
	    departments.set(departmentId, {
	      ...department,
	      employees
	    });
	  },
	  updateHeads: (departmentId, heads) => {
	    const {
	      departments
	    } = humanresources_companyStructure_chartStore.useChartStore();
	    const department = departments.get(departmentId);
	    if (!department) {
	      return;
	    }
	    departments.set(departmentId, {
	      ...department,
	      heads
	    });
	  },
	  updateEmployeeListOptions: (departmentId, options) => {
	    const {
	      departments
	    } = humanresources_companyStructure_chartStore.useChartStore();
	    const department = departments.get(departmentId);
	    if (!department) {
	      return;
	    }
	    department.employeeListOptions = {
	      ...department.employeeListOptions,
	      ...options
	    };
	    departments.set(departmentId, department);
	  },
	  setChatsAndChannels: (nodeId, chats, channels, chatsNoAccess = 0, channelsNoAccess = 0) => {
	    const store = humanresources_companyStructure_chartStore.useChartStore();
	    const department = store.departments.get(nodeId);
	    if (!department) {
	      return;
	    }
	    department.channelsDetailed = channels;
	    department.chatsDetailed = chats;
	    department.channelsNoAccess = channelsNoAccess;
	    department.chatsNoAccess = chatsNoAccess;
	    department.chatAndChannelsCount = chats.length + channels.length + chatsNoAccess + channelsNoAccess;
	  },
	  removeUserFromAllDepartments: async userId => {
	    const store = humanresources_companyStructure_chartStore.useChartStore();
	    const departments = store.departments;
	    const departmentsToUpdate = [];
	    for (const [key, department] of departments) {
	      if ('heads' in department && main_core.Type.isArray(department.heads) && department.heads.some(employee => employee.id === userId) || 'employees' in department && main_core.Type.isArray(department.employees) && department.employees.some(employee => employee.id === userId)) {
	        departmentsToUpdate.push(key);
	      }
	    }
	    return store.refreshDepartments(departmentsToUpdate);
	  },
	  unbindChatFromNode: (nodeId, chatId) => {
	    const store = humanresources_companyStructure_chartStore.useChartStore();
	    const department = store.departments.get(nodeId);
	    if (!department) {
	      return;
	    }
	    department.channelsDetailed = department.channelsDetailed.filter(chat => chat.id !== chatId);
	    department.chatsDetailed = department.chatsDetailed.filter(chat => chat.id !== chatId);
	    department.chatAndChannelsCount--;
	  },
	  updateChatsInChildrenNodes: parentNodeId => {
	    const store = humanresources_companyStructure_chartStore.useChartStore();
	    const parentDepartment = store.departments.get(parentNodeId);
	    if (!parentDepartment || !parentDepartment.children) {
	      return;
	    }
	    markDescendantsForChatReload(parentDepartment.children);
	  }
	};

	// @vue/component
	const MoveUserActionPopup = {
	  name: 'MoveUserActionPopup',
	  components: {
	    ConfirmationPopup: humanresources_companyStructure_structureComponents.ConfirmationPopup
	  },
	  emits: ['close', 'action'],
	  props: {
	    parentId: {
	      type: Number,
	      required: true
	    },
	    user: {
	      type: Object,
	      required: true
	    },
	    entityType: {
	      type: String,
	      required: true
	    }
	  },
	  created() {
	    this.permissionChecker = humanresources_companyStructure_permissionChecker.PermissionChecker.getInstance();
	    if (!this.permissionChecker) {
	      return;
	    }
	    this.action = this.isTeamEntity ? humanresources_companyStructure_permissionChecker.PermissionActions.teamAddMember : humanresources_companyStructure_permissionChecker.PermissionActions.employeeAddToDepartment;
	    this.selectedDepartmentId = 0;
	  },
	  data() {
	    return {
	      showMoveUserActionLoader: false,
	      lockMoveUserActionButton: false,
	      showUserAlreadyBelongsToDepartmentPopup: false,
	      accessDenied: false
	    };
	  },
	  mounted() {
	    const departmentContainer = this.$refs['department-selector'];
	    this.departmentSelector = this.createTagSelector();
	    this.departmentSelector.renderTo(departmentContainer);
	  },
	  computed: {
	    ...ui_vue3_pinia.mapState(humanresources_companyStructure_chartStore.useChartStore, ['departments', 'focusedNode']),
	    includedNodeEntityTypesInDialog() {
	      return this.isTeamEntity ? ['team'] : ['department'];
	    },
	    getMoveUserActionPhrase() {
	      var _this$departments$get, _this$user$name;
	      const departmentName = main_core.Text.encode((_this$departments$get = this.departments.get(this.focusedNode).name) != null ? _this$departments$get : '');
	      const userName = main_core.Text.encode((_this$user$name = this.user.name) != null ? _this$user$name : '');
	      let phraseCode = '';
	      if (this.isTeamEntity) {
	        phraseCode = 'HUMANRESOURCES_DEPARTMENT_CONTENT_TAB_USER_ACTION_MENU_MOVE_TO_ANOTHER_TEAM_REMOVE_USER_DESCRIPTION';
	        phraseCode += this.user.gender === 'F' ? '_F' : '_M';
	      } else {
	        phraseCode = 'HUMANRESOURCES_DEPARTMENT_CONTENT_TAB_USER_ACTION_MENU_MOVE_TO_ANOTHER_DEPARTMENT_ALREADY_BELONGS_TO_DEPARTMENT_DESCRIPTION_MSGVER_1';
	      }
	      return this.loc(phraseCode, {
	        '#USER_NAME#': userName,
	        '#DEPARTMENT_NAME#': departmentName
	      }).replace('[link]', `<a class="hr-department-detail-content__move-user-department-user-link" href="${this.user.url}">`).replace('[/link]', '</a>');
	    },
	    getUserAlreadyBelongsToDepartmentPopupPhrase() {
	      var _this$departments$get2, _this$selectedParentD, _this$user$name2;
	      const departmentName = main_core.Text.encode((_this$departments$get2 = this.departments.get((_this$selectedParentD = this.selectedParentDepartment) != null ? _this$selectedParentD : 0).name) != null ? _this$departments$get2 : '');
	      const userName = main_core.Text.encode((_this$user$name2 = this.user.name) != null ? _this$user$name2 : '');
	      let phraseCode = '';
	      if (this.isTeamEntity) {
	        phraseCode = 'HUMANRESOURCES_DEPARTMENT_CONTENT_TAB_USER_ACTION_MENU_MOVE_TO_ANOTHER_TEAM_ALREADY_BELONGS_TO_TEAM_DESCRIPTION';
	        phraseCode += this.user.gender === 'F' ? '_F' : '_M';
	      } else {
	        phraseCode = 'HUMANRESOURCES_DEPARTMENT_CONTENT_TAB_USER_ACTION_MENU_MOVE_TO_ANOTHER_DEPARTMENT_ALREADY_BELONGS_TO_DEPARTMENT_DESCRIPTION_MSGVER_1';
	      }
	      let phrase = this.loc(phraseCode, {
	        '#USER_NAME#': userName,
	        '#DEPARTMENT_NAME#': departmentName
	      });
	      phrase = phrase.replace('[link]', `<a class="hr-department-detail-content__move-user-department-user-link" href="${this.user.url}">`);
	      phrase = phrase.replace('[/link]', '</a>');
	      return phrase;
	    },
	    memberRoles() {
	      return humanresources_companyStructure_api.getMemberRoles(this.entityType);
	    },
	    isTeamEntity() {
	      return this.entityType === humanresources_companyStructure_utils.EntityTypes.team;
	    },
	    confirmTitle() {
	      return this.isTeamEntity ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_USER_ACTION_MENU_MOVE_TO_ANOTHER_TEAM_POPUP_CONFIRM_TITLE') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_USER_ACTION_MENU_MOVE_TO_ANOTHER_DEPARTMENT_POPUP_CONFIRM_TITLE');
	    },
	    confirmDescription() {
	      return this.isTeamEntity ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_USER_ACTION_MENU_MOVE_TO_ANOTHER_TEAM_POPUP_ACTION_SELECT_TEAM_DESCRIPTION') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_USER_ACTION_MENU_MOVE_TO_ANOTHER_DEPARTMENT_POPUP_ACTION_SELECT_DEPARTMENT_DESCRIPTION');
	    }
	  },
	  methods: {
	    createTagSelector() {
	      return new ui_entitySelector.TagSelector({
	        events: {
	          onTagAdd: event => {
	            this.accessDenied = false;
	            const {
	              tag
	            } = event.data;
	            this.selectedParentDepartment = tag.id;
	            if (humanresources_companyStructure_permissionChecker.PermissionChecker.hasPermission(this.action, tag.id)) {
	              this.lockMoveUserActionButton = false;
	              return;
	            }
	            this.accessDenied = true;
	            this.lockMoveUserActionButton = true;
	          },
	          onTagRemove: () => {
	            this.lockMoveUserActionButton = true;
	          }
	        },
	        multiple: false,
	        dialogOptions: {
	          width: 425,
	          height: 350,
	          dropdownMode: true,
	          hideOnDeselect: true,
	          entities: [{
	            id: 'structure-node',
	            options: {
	              selectMode: 'departmentsOnly',
	              restricted: 'addMember',
	              includedNodeEntityTypes: this.includedNodeEntityTypesInDialog,
	              useMultipleTabs: true
	            }
	          }],
	          preselectedItems: [['structure-node', this.parentId]]
	        }
	      });
	    },
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    async confirmMoveUser() {
	      var _this$departments$get3, _this$departments$get4, _this$user$role;
	      this.showMoveUserActionLoader = true;
	      const departmentId = this.focusedNode;
	      const userId = this.user.id;
	      const targetNodeId = this.selectedParentDepartment;
	      try {
	        await DepartmentAPI.moveUserToDepartment(departmentId, userId, targetNodeId);
	      } catch (error) {
	        var _error$code;
	        this.showMoveUserActionLoader = false;
	        const code = (_error$code = error.code) != null ? _error$code : 0;
	        if (code === 'MEMBER_ALREADY_BELONGS_TO_NODE') {
	          this.showUserAlreadyBelongsToDepartmentPopup = true;
	        } else {
	          const phraseCode = this.isTeamEntity ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_USER_ACTION_MENU_MOVE_TO_ANOTHER_TEAM_ERROR') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_USER_ACTION_MENU_MOVE_TO_ANOTHER_DEPARTMENT_ERROR');
	          ui_notification.UI.Notification.Center.notify({
	            content: phraseCode,
	            autoHideDelay: 2000
	          });
	          this.$emit('close');
	        }
	        return;
	      }
	      const departmentName = main_core.Text.encode((_this$departments$get3 = (_this$departments$get4 = this.departments.get(targetNodeId)) == null ? void 0 : _this$departments$get4.name) != null ? _this$departments$get3 : '');
	      const phraseCode = this.isTeamEntity ? 'HUMANRESOURCES_DEPARTMENT_CONTENT_TAB_USER_ACTION_MENU_MOVE_TO_ANOTHER_TEAM_SUCCESS_MESSAGE' : 'HUMANRESOURCES_DEPARTMENT_CONTENT_TAB_USER_ACTION_MENU_MOVE_TO_ANOTHER_DEPARTMENT_SUCCESS_MESSAGE';
	      ui_notification.UI.Notification.Center.notify({
	        content: this.loc(phraseCode, {
	          '#DEPARTMENT_NAME#': departmentName
	        }),
	        autoHideDelay: 2000
	      });
	      DepartmentContentActions.moveUserToDepartment(departmentId, userId, targetNodeId, (_this$user$role = this.user.role) != null ? _this$user$role : this.memberRoles.employee);
	      this.$emit('action');
	      this.showMoveUserActionLoader = false;
	    },
	    closeAction() {
	      this.$emit('close');
	    },
	    closeUserAlreadyBelongsToDepartmentPopup() {
	      this.showUserAlreadyBelongsToDepartmentPopup = false;
	      this.closeAction();
	    }
	  },
	  template: `
		<ConfirmationPopup
			@action="confirmMoveUser"
			@close="closeAction"
			:showActionButtonLoader="showMoveUserActionLoader"
			:lockActionButton="lockMoveUserActionButton"
			:title="confirmTitle"
			:confirmBtnText = "loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_USER_ACTION_MENU_MOVE_TO_ANOTHER_DEPARTMENT_POPUP_CONFIRM_BUTTON')"
			:width="364"
		>
			<template v-slot:content>
				<div class="hr-department-detail-content__user-action-text-container">
					<div v-html="getMoveUserActionPhrase"/>
					<span>
						{{confirmDescription}}
					</span>
				</div>
				<div
					class="hr-department-detail-content__move-user-department-selector"
					ref="department-selector"
					:class="{ 'ui-ctl-warning': accessDenied }"
				/>
				<div
					v-if="accessDenied"
					class="hr-department-detail-content__move-user-department_item-error"
				>
					<div class="ui-icon-set --warning"></div>
					<span
						class="hr-department-detail-content__move-user-department_item-error-message"
					>
							{{loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_USER_ACTION_MENU_MOVE_TO_ANOTHER_DEPARTMENT_PERMISSION_ERROR')}}
					</span>
				</div>
			</template>
		</ConfirmationPopup>
		<ConfirmationPopup
			@action="closeUserAlreadyBelongsToDepartmentPopup"
			@close="closeUserAlreadyBelongsToDepartmentPopup"
			v-if="showUserAlreadyBelongsToDepartmentPopup"
			:withoutTitleBar = true
			:onlyConfirmButtonMode = true
			:confirmBtnText = "loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_USER_ACTION_MENU_MOVE_TO_ANOTHER_DEPARTMENT_ALREADY_BELONGS_TO_DEPARTMENT_CLOSE_BUTTON')"
			:width="300"
		>
			<template v-slot:content>
				<div class="hr-department-detail-content__user-action-text-container">
					<div 
						class="hr-department-detail-content__user-belongs-to-department-text-container"
						v-html="getUserAlreadyBelongsToDepartmentPopupPhrase"
					/>
				</div>
				<div class="hr-department-detail-content__move-user-department-selector" ref="department-selector"></div>
			</template>
		</ConfirmationPopup>
	`
	};

	const UserListItemActionButton = {
	  name: 'userList',
	  props: {
	    user: {
	      type: Object,
	      required: true
	    },
	    departmentId: {
	      type: Number,
	      required: true
	    }
	  },
	  components: {
	    RouteActionMenu: humanresources_companyStructure_structureComponents.RouteActionMenu,
	    ConfirmationPopup: humanresources_companyStructure_structureComponents.ConfirmationPopup,
	    MoveUserActionPopup
	  },
	  data() {
	    return {
	      menuVisible: {},
	      showRemoveUserConfirmationPopup: false,
	      showRemoveUserConfirmationActionLoader: false,
	      showMoveUserPopup: false,
	      showFireUserPopup: false,
	      fireUserLoad: false
	    };
	  },
	  methods: {
	    toggleMenu(userId) {
	      this.menuVisible[userId] = !this.menuVisible[userId];
	    },
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    onActionMenuItemClick(actionId) {
	      if (actionId === humanresources_companyStructure_orgChart.MenuActions.removeUserFromDepartment) {
	        this.showRemoveUserConfirmationPopup = true;
	      }
	      if (actionId === humanresources_companyStructure_orgChart.MenuActions.moveUserToAnotherDepartment) {
	        this.showMoveUserPopup = true;
	      }
	      if (actionId === humanresources_companyStructure_orgChart.MenuActions.fireUserFromCompany) {
	        this.showFireUserPopup = true;
	      }
	    },
	    async removeUser() {
	      var _this$departments$get;
	      this.showRemoveUserConfirmationActionLoader = true;
	      const userId = this.user.id;
	      const isUserInMultipleDepartments = await DepartmentAPI.isUserInMultipleDepartments(userId);
	      const departmentId = this.focusedNode;
	      this.showRemoveUserConfirmationActionLoader = false;
	      this.showRemoveUserConfirmationPopup = false;
	      try {
	        await DepartmentAPI.removeUserFromDepartment(departmentId, userId);
	      } catch {
	        const phraseCode = this.isTeamEntity ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_USER_ACTION_MENU_REMOVE_FROM_TEAM_ERROR') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_USER_ACTION_MENU_REMOVE_FROM_DEPARTMENT_ERROR');
	        ui_notification.UI.Notification.Center.notify({
	          content: phraseCode,
	          autoHideDelay: 2000
	        });
	        return;
	      }
	      const phraseCode = this.isTeamEntity ? 'HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_USER_ACTION_MENU_REMOVE_FROM_TEAM_SUCCESS' : 'HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_USER_ACTION_MENU_REMOVE_FROM_DEPARTMENT_SUCCESS';
	      const departmentName = main_core.Text.encode((_this$departments$get = this.departments.get(this.focusedNode).name) != null ? _this$departments$get : '');
	      ui_notification.UI.Notification.Center.notify({
	        content: this.loc(phraseCode, {
	          '#DEPARTMENT_NAME#': departmentName
	        }),
	        autoHideDelay: 2000
	      });
	      const role = this.user.role;
	      if (isUserInMultipleDepartments || this.isTeamEntity) {
	        DepartmentContentActions.removeUserFromDepartment(departmentId, userId, role);
	        return;
	      }
	      const rootDepartment = [...this.departments.values()].find(department => department.parentId === 0);
	      if (!rootDepartment) {
	        return;
	      }
	      DepartmentContentActions.moveUserToDepartment(departmentId, userId, rootDepartment.id, role);
	    },
	    cancelRemoveUser() {
	      this.showRemoveUserConfirmationPopup = false;
	    },
	    async fireUser() {
	      this.fireUserLoad = true;
	      const userId = this.user.id;
	      try {
	        await DepartmentAPI.fireUser(userId);
	      } catch (error) {
	        if (error.code !== 'STRUCTURE_ACCESS_DENIED') {
	          ui_notification.UI.Notification.Center.notify({
	            content: this.user.isInvited ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_USER_ACTION_MENU_DELETE_ERROR') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_USER_ACTION_MENU_FIRE_ERROR'),
	            autoHideDelay: 2000
	          });
	        }
	        this.showFireUserPopup = false;
	        this.fireUserLoad = false;
	        return;
	      }
	      DepartmentContentActions.removeUserFromDepartment(this.focusedNode, userId, this.user.role);
	      await DepartmentContentActions.removeUserFromAllDepartments(userId);
	      this.showFireUserPopup = false;
	      this.fireUserLoad = false;
	    },
	    cancelFireUser() {
	      this.showFireUserPopup = false;
	    },
	    handleMoveUserAction() {
	      this.showMoveUserPopup = false;
	    },
	    handleMoveUserClose() {
	      this.showMoveUserPopup = false;
	    },
	    getMemberKeyByValue(value) {
	      return Object.keys(humanresources_companyStructure_api.memberRoles).find(key => humanresources_companyStructure_api.memberRoles[key] === value) || '';
	    }
	  },
	  created() {
	    this.menu = new humanresources_companyStructure_orgChart.UserListActionMenu(this.focusedNode, this.entityType, this.user.isInvited);
	  },
	  computed: {
	    ...ui_vue3_pinia.mapState(humanresources_companyStructure_chartStore.useChartStore, ['focusedNode', 'departments']),
	    memberRoles() {
	      return humanresources_companyStructure_api.memberRoles;
	    },
	    getFirePopupDescription() {
	      var _this$user$name, _this$user$url;
	      const userName = main_core.Text.encode((_this$user$name = this.user.name) != null ? _this$user$name : '');
	      const userUrl = main_core.Text.encode((_this$user$url = this.user.url) != null ? _this$user$url : '');
	      const genderSuffix = this.user.gender === 'F' ? '_F' : '_M';
	      const phrase = this.user.isInvited ? `HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_USER_ACTION_MENU_DELETE_POPUP_DESCRIPTION${genderSuffix}` : `HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_USER_ACTION_MENU_FIRE_POPUP_DESCRIPTION${genderSuffix}`;
	      const description = this.loc(phrase, {
	        '#USER_NAME#': userName
	      });
	      return description.replace('[link]', `<a class="hr-department-detail-content__fire-user-link" href="${userUrl}">`).replace('[/link]', '</a>');
	    },
	    getFirePopupTitle() {
	      return this.user.isInvited ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_USER_ACTION_MENU_DELETE_POPUP_TITLE') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_USER_ACTION_MENU_FIRE_POPUP_TITLE');
	    },
	    getFirePopupButtonText() {
	      return this.user.isInvited ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_USER_ACTION_MENU_DELETE_POPUP_CONFIRM_BUTTON') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_USER_ACTION_MENU_FIRE_POPUP_CONFIRM_BUTTON');
	    },
	    getRemovePopupTitle() {
	      return this.isTeamEntity ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_USER_ACTION_MENU_REMOVE_FROM_TEAM_POPUP_TITLE') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_USER_ACTION_MENU_REMOVE_FROM_DEPARTMENT_POPUP_TITLE');
	    },
	    getRemovePopupDescription() {
	      var _this$departments$get2, _this$user$name2;
	      const departmentName = main_core.Text.encode((_this$departments$get2 = this.departments.get(this.focusedNode).name) != null ? _this$departments$get2 : '');
	      const userName = main_core.Text.encode((_this$user$name2 = this.user.name) != null ? _this$user$name2 : '');
	      if (this.isTeamEntity) {
	        const phraseCode = 'HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_USER_ACTION_MENU_REMOVE_FROM_TEAM_POPUP_DESCRIPTION';
	        const genderSuffix = this.user.gender === 'F' ? '_F' : '_M';
	        return this.loc(phraseCode + genderSuffix, {
	          '#USER_NAME#': userName,
	          '#DEPARTMENT_NAME#': departmentName
	        }).replace('[link]', `<a class="hr-department-detail-content__move-user-department-user-link" href="${this.user.url}">`).replace('[/link]', '</a>');
	      }
	      return this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_USER_ACTION_MENU_REMOVE_FROM_DEPARTMENT_POPUP_DESCRIPTION');
	    },
	    entityType() {
	      var _this$departments$get3;
	      return (_this$departments$get3 = this.departments.get(this.focusedNode)) == null ? void 0 : _this$departments$get3.entityType;
	    },
	    isTeamEntity() {
	      return this.entityType === humanresources_companyStructure_utils.EntityTypes.team;
	    }
	  },
	  template: `
		<button
			v-if="menu.items.length"
			class="ui-icon-set --more hr-department-detail-content__user-action-btn"
			:class="{ '--focused': menuVisible[user.id] }"
			@click.stop="toggleMenu(user.id)"
			ref="actionUserButton"
			:data-id="'hr-department-detail-content__'+ getMemberKeyByValue(user.role) + '-list_user-' + user.id + '-action-btn'"
		/>
		<RouteActionMenu
			v-if="menuVisible[user.id]"
			:id="'tree-node-department-menu-' + user.id"
			:items="menu.items"
			:width="302"
			:bindElement="$refs.actionUserButton"
			@action="onActionMenuItemClick"
			@close="menuVisible[user.id] = false"
		/>
		<ConfirmationPopup
			ref="removeUserConfirmationPopup"
			v-if="showRemoveUserConfirmationPopup"
			:showActionButtonLoader="showRemoveUserConfirmationActionLoader"
			:title="getRemovePopupTitle"
			:confirmBtnText="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_USER_ACTION_MENU_REMOVE_FROM_DEPARTMENT_POPUP_CONFIRM_BUTTON')"
			:confirmButtonClass="isTeamEntity ? 'ui-btn-danger' : 'ui-btn-primary'"
			@action="removeUser"
			@close="cancelRemoveUser"
			:width="364"
		>
			<template v-slot:content>
				<div class="hr-department-detail-content__user-action-text-container">
				<div
					v-html="getRemovePopupDescription"
				/>
				</div>
			</template>
		</ConfirmationPopup>
		<ConfirmationPopup
			ref="fireUserConfirmationPopup"
			v-if="showFireUserPopup"
			:showActionButtonLoader="fireUserLoad"
			:title="getFirePopupTitle"
			:confirmBtnText="getFirePopupButtonText"
			:confirmButtonClass="'ui-btn-danger'"
			@action="fireUser"
			@close="cancelFireUser"
			:width="364"
		>
			<template v-slot:content>
				<div class="hr-department-detail-content__user-action-text-container">
					<div
						v-html="getFirePopupDescription"
					/>
				</div>
			</template>
		</ConfirmationPopup>
		<MoveUserActionPopup
			v-if="showMoveUserPopup"
			:parentId="focusedNode"
			:user="user"
			:entityType="entityType"
			@action="handleMoveUserAction"
			@close="handleMoveUserClose"
		/>
	`
	};

	const UserListItem = {
	  name: 'userList',
	  emits: ['itemDragStart'],
	  props: {
	    user: {
	      type: Object,
	      required: true
	    },
	    selectedUserId: {
	      type: Number,
	      required: false,
	      default: null
	    },
	    entityType: {
	      type: String,
	      required: true
	    },
	    listType: {
	      type: String,
	      required: true
	    },
	    canDrag: {
	      type: Boolean,
	      default: false
	    }
	  },
	  components: {
	    UserListItemActionButton
	  },
	  computed: {
	    memberRoles() {
	      return humanresources_companyStructure_api.getMemberRoles(this.entityType);
	    },
	    defaultAvatar() {
	      return '/bitrix/js/humanresources/company-structure/org-chart/src/images/default-user.svg';
	    },
	    ...ui_vue3_pinia.mapState(humanresources_companyStructure_chartStore.useChartStore, ['focusedNode'])
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    handleUserClick(item) {
	      BX.SidePanel.Instance.open(item.url, {
	        cacheable: false
	      });
	    },
	    handleMouseDown(event) {
	      event.preventDefault();
	      this.$emit('itemDragStart', {
	        userId: this.user.id,
	        initialListType: this.listType,
	        event,
	        element: this.$el
	      });
	    }
	  },
	  template: `
		<div 
			:key="user.id"
			class="hr-department-detail-content__user-container"
			:class="{ '--searched': user.id === selectedUserId }"
			:data-id="'hr-department-detail-content__user-' + user.id + '-item'"
		>
			<span v-if="canDrag"
				  @mousedown="handleMouseDown"
				  class="hr-department-detail-content__dnd-icon ui-icon-set --more-points">
			</span>
			<div class="hr-department-detail-content__user-avatar-container" @click="handleUserClick(user)">
				<img 
					class="hr-department-detail-content__user-avatar-img"
					:src="user.avatar ? encodeURI(user.avatar) : defaultAvatar"
				    alt=""
				/>
				<div v-if="user.role === memberRoles.head" class="hr-department-detail-content__user-avatar-overlay"></div>
			</div>
			<div class="hr-department-detail-content-user__text-container">
				<div class="hr-department-detail-content__user-title">
					<div 
						class="hr-department-detail-content__user-name" 
						@click="handleUserClick(user)"
						:bx-tooltip-user-id="user.id"
						bx-tooltip-context="b24"
						:data-id="'hr-department-detail-content__user-' + user.id + '-item-name'"
					>
						{{ user.name }}
					</div>
					<div v-if="user.badgeText" class="hr-department-detail-content-user__name-badge">{{ user.badgeText }}</div>
				</div>
				<div 
					class="hr-department-detail-content__user-subtitle" 
					:class="{ '--without-work-position': !user.subtitle }"
				>
					{{ (user.subtitle?.length ?? 0) > 0 ? user.subtitle : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_LIST_DEFAULT_WORK_POSITION') }}
				</div>
				<div v-if="user.isInvited" class="hr-department-detail-content-user__item-badge">
					{{ this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_LIST_INVITED_BADGE_TEXT') }}
				</div>
			</div>
			<UserListItemActionButton
				:user="user"
				:departmentId="focusedNode"
			/>
		</div>
	`
	};

	const EmptyState = {
	  name: 'emptyState',
	  props: {
	    title: {
	      type: String,
	      required: false
	    },
	    imageClass: {
	      type: String,
	      required: false
	    },
	    description: {
	      type: String,
	      required: false
	    },
	    list: {
	      type: Array,
	      required: false,
	      default: []
	    }
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    }
	  },
	  template: `
		<div class="hr-department-detail-content_tab__empty-state-container">
			<div v-if="imageClass" :class="['hr-department-detail-content_tab__empty-state-icon', imageClass]"/>
			<span v-if="title" class="hr-department-detail-content__empty-tab-entity-title">
				{{ title }}
			</span>
			<span v-if="description" class="hr-department-detail-content_tab__empty-state-description">
				{{ description }}
			</span>
			<div v-if="list.length > 0" class="hr-department-detail-content_tab__empty-state-list">
				<div class="hr-department-detail-content_tab__empty-state-list-item"  v-for="item in list">
					<div 
						class="ui-icon-set --circle-check hr-department-detail-content_tab__empty-state-list-item-check"
						style="--ui-icon-set__icon-size: 20px;"
					/>
					<div class="hr-department-detail-content_tab__empty-state-list--item-text">
						{{ item.text }}
					</div>
				</div>
			</div>
			<slot name="content"/>
		</div>
	`
	};

	const EmptyListItem = {
	  name: 'tabEmptyListItem',
	  props: {
	    title: {
	      type: String,
	      required: true
	    },
	    imageClass: {
	      type: String,
	      required: true
	    },
	    withAddPermission: {
	      type: Boolean,
	      required: false,
	      default: true
	    }
	  },
	  template: `
		<div :class="['hr-department-detail-content__tab-empty-list_item-wrapper', { '--with-add': withAddPermission }]">
			<div class="hr-department-detail-content__tab-empty-list_item-image" :class="imageClass"/>
			<div class="hr-department-detail-content__tab-empty-list_item-content">
				<div class="hr-department-detail-content__tab-empty-list_item-title">
					{{ title }}
				</div>
			</div>
		</div>
	`
	};

	const ListActionButton = {
	  name: 'userListActionButton',
	  emits: ['tabListAction', 'close'],
	  props: {
	    id: {
	      type: String,
	      required: true
	    },
	    menuItems: {
	      type: Array,
	      required: true
	    },
	    dataTestIds: {
	      type: Object,
	      required: false,
	      default: {}
	    }
	  },
	  components: {
	    RouteActionMenu: humanresources_companyStructure_structureComponents.RouteActionMenu
	  },
	  computed: {
	    ...ui_vue3_pinia.mapState(humanresources_companyStructure_chartStore.useChartStore, ['focusedNode'])
	  },
	  data() {
	    return {
	      menuVisible: false
	    };
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    onActionMenuItemClick(itemId) {
	      this.$emit('tabListAction', itemId);
	    }
	  },
	  template: `
		<button
			v-if="menuItems.length"
			class="hr-department-detail-content__tab-list_header-button"
			:class="{ '--focused': menuVisible }"
			:ref="id + '-route-action-menu'"
			@click.stop="menuVisible = true"
			:data-test-id="dataTestIds.buttonDataTestId"
		>
			{{ loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_LIST_ACTION_BUTTON_TITLE') }}
		</button>
		<RouteActionMenu
			v-if="menuVisible"
			:id="id + '-route-action-menu'"
			:items="menuItems"
			:width="302"
			:bindElement="$refs[id + '-route-action-menu']"
			:containerDataTestId="dataTestIds.containerDataTestId"
			@action="onActionMenuItemClick"
			@close="menuVisible = false"
		/>
	`
	};

	const TabList = {
	  name: 'tabList',
	  components: {
	    ListActionButton,
	    EmptyListItem
	  },
	  emits: ['tabListAction'],
	  props: {
	    id: {
	      type: String,
	      required: true
	    },
	    title: {
	      type: String,
	      required: true
	    },
	    count: {
	      type: Number,
	      required: false
	    },
	    menuItems: {
	      type: Array,
	      required: false,
	      default: []
	    },
	    listItems: {
	      type: Array,
	      required: true
	    },
	    emptyItemTitle: {
	      type: String,
	      required: false
	    },
	    emptyItemImageClass: {
	      type: String,
	      required: false
	    },
	    hideEmptyItem: {
	      type: Boolean,
	      required: false,
	      default: false
	    },
	    withAddPermission: {
	      type: Boolean,
	      required: false,
	      default: true
	    },
	    /** @var { TabListDataTestIds } dataTestIds */
	    dataTestIds: {
	      type: Object,
	      required: false,
	      default: {}
	    },
	    isDropTarget: {
	      type: Boolean,
	      default: false
	    },
	    listType: {
	      type: String
	    }
	  },
	  data() {
	    return {
	      placeholderIndex: null,
	      boundHandleDragOverList: null
	    };
	  },
	  computed: {
	    needToShowCount() {
	      return main_core.Type.isNumber(this.count);
	    }
	  },
	  watch: {
	    isDropTarget(newValue, oldValue) {
	      if (newValue === oldValue) {
	        return;
	      }
	      const itemsWrapper = this.$refs.itemsWrapper;
	      if (!itemsWrapper) {
	        return;
	      }
	      if (newValue) {
	        this.boundHandleDragOverList = main_core.Runtime.throttle(this.handleDragOverList.bind(this), 10);
	        main_core.Event.bind(itemsWrapper, 'mousemove', this.boundHandleDragOverList);
	        if (this.listItems.length === 0) {
	          this.placeholderIndex = 0;
	        }
	      } else {
	        main_core.Event.unbind(itemsWrapper, 'mousemove', this.boundHandleDragOverList);
	        this.boundHandleDragOverList = null;
	        this.placeholderIndex = null;
	      }
	    }
	  },
	  methods: {
	    onActionMenuItemClick(actionId) {
	      this.$emit('tabListAction', actionId);
	    },
	    handleDragOverList(event) {
	      if (!this.isDropTarget || !this.$refs.itemsWrapper) {
	        if (this.placeholderIndex !== null) {
	          this.placeholderIndex = null;
	        }
	        return;
	      }
	      const itemsWrapper = this.$refs.itemsWrapper;
	      const children = [...itemsWrapper.querySelectorAll('.hr-department-detail-content__user-container:not(.--dragging)')];
	      const mouseY = event.clientY;
	      if (children.length === 0) {
	        if (this.placeholderIndex !== 0) {
	          this.placeholderIndex = 0;
	        }
	        return;
	      }
	      let newIndex = children.length;
	      for (const [i, child] of children.entries()) {
	        const rect = child.getBoundingClientRect();
	        const childMidpointY = rect.top + rect.height / 2;
	        if (mouseY < childMidpointY) {
	          newIndex = i;
	          break;
	        }
	      }
	      if (newIndex !== this.placeholderIndex) {
	        this.placeholderIndex = newIndex;
	      }
	    }
	  },
	  template: `
		<div
			class="hr-department-detail-content__tab-list_container"
			 :data-test-id="dataTestIds.containerDataTestId"
		>
			<div class="hr-department-detail-content__tab-list_header-container">
				<div class="hr-department-detail-content__tab-list_list-title">
					{{ title }}
					<span
						v-if="needToShowCount"
						class="hr-department-detail-content__tab-list_header-count"
						:data-test-id="dataTestIds.listCounterDataTestId"
					>
					{{ count }}
				</span>
				</div>
				<ListActionButton
					:id="id"
					:menuItems="menuItems"
					@tabListAction="onActionMenuItemClick"
					:dataTestIds="{buttonDataTestId: dataTestIds.listActionButtonDataTestId, containerDataTestId: dataTestIds.listActonMenuDataTestId}"
				/>
			</div>
			<div class="hr-department-detail-content__tab_list-container" ref="itemsWrapper">
				<div
					v-if="placeholderIndex === 0 && isDropTarget"
					class="hr-department-detail-content__drop-placeholder"
				></div>
				<template v-for="(item, index) in listItems" :key="item.id">
					<slot :item="item"
					/>
					<div
						v-if="placeholderIndex === (index + 1) && isDropTarget"
						class="hr-department-detail-content__drop-placeholder"
					></div>
				</template>
				<slot name="footer" />
				<EmptyListItem v-if="emptyItemTitle && emptyItemImageClass && !listItems.length && !hideEmptyItem"
					:title="emptyItemTitle"
					:imageClass="emptyItemImageClass"
					:withAddPermission="withAddPermission"
				/>
			</div>
		</div>
	`
	};

	const SearchInput = {
	  name: 'searchInput',
	  props: {
	    value: {
	      type: String,
	      required: false,
	      default: ''
	    },
	    placeholder: {
	      type: String,
	      required: true
	    },
	    dataTestId: {
	      type: String,
	      required: false
	    }
	  },
	  data() {
	    return {
	      hasFocus: false
	    };
	  },
	  methods: {
	    handleInput(event) {
	      this.$emit('inputChange', event.target.value);
	    },
	    handleBlur() {
	      if (this.value.length === 0) {
	        this.hasFocus = false;
	      }
	    },
	    clearInput() {
	      this.hasFocus = false;
	      this.$emit('inputChange', '');
	    }
	  },
	  template: `
		<div
			class="hr-department-detail-content__content-search"
			:class="{'--focused': hasFocus}"
		>
			<div class="hr-department-detail-content__content-search-icon ui-icon-set --search-1"/>
			<input
				class="hr-department-detail-content__content-search-input"
				type="text"
				:placeholder="!hasFocus ?  placeholder : ''"
				:data-test-id="dataTestId"
				:value="value"
				@input="handleInput"
				@focus="hasFocus = true"
				@blur="handleBlur"
			>
			<div
				class="hr-department-detail-content__content-search-close-button ui-icon-set --cross-circle-50"
				:class="{'--hide': !hasFocus}"
				@click="clearInput"
			/>
		</div>
	`
	};

	const AUTOSCROLL_AREA_SIZE = 70;

	// @vue/component
	const UsersTab = {
	  name: 'usersTab',
	  components: {
	    SearchInput,
	    EmptyState,
	    TabList,
	    EmptyTabAddButton,
	    UserListItem,
	    MoveEmployeeConfirmationPopup: humanresources_companyStructure_structureComponents.MoveEmployeeConfirmationPopup
	  },
	  emits: ['showDetailLoader', 'hideDetailLoader'],
	  data() {
	    return {
	      searchQuery: '',
	      selectedUserId: null,
	      needToScroll: false,
	      dragState: this.getInitialDragState(),
	      showDndConfirmationPopup: false,
	      dndPreviousState: null,
	      dndPopupDescription: '',
	      boundHandleDragMove: null,
	      boundHandleDragEnd: null
	    };
	  },
	  computed: {
	    memberRoles() {
	      return humanresources_companyStructure_api.getMemberRoles(this.entityType);
	    },
	    heads() {
	      var _this$departments$get;
	      return (_this$departments$get = this.departments.get(this.focusedNode).heads) != null ? _this$departments$get : [];
	    },
	    headCount() {
	      var _this$heads$length;
	      return (_this$heads$length = this.heads.length) != null ? _this$heads$length : 0;
	    },
	    departmentId() {
	      return this.focusedNode;
	    },
	    formattedHeads() {
	      return this.heads.map(head => ({
	        ...head,
	        subtitle: head.workPosition,
	        badgeText: this.getBadgeText(head.role)
	      })).sort((a, b) => {
	        const roleOrder = {
	          [this.memberRoles.head]: 1,
	          [this.memberRoles.deputyHead]: 2
	        };
	        const roleA = roleOrder[a.role] || 3;
	        const roleB = roleOrder[b.role] || 3;
	        return roleA - roleB;
	      });
	    },
	    filteredHeads() {
	      return this.formattedHeads.filter(head => {
	        var _head$workPosition;
	        return head.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || ((_head$workPosition = head.workPosition) == null ? void 0 : _head$workPosition.toLowerCase().includes(this.searchQuery.toLowerCase()));
	      });
	    },
	    employeeCount() {
	      var _this$departments$get2, _this$headCount;
	      const memberCount = (_this$departments$get2 = this.departments.get(this.focusedNode).userCount) != null ? _this$departments$get2 : 0;
	      return memberCount - ((_this$headCount = this.headCount) != null ? _this$headCount : 0);
	    },
	    formattedEmployees() {
	      return this.employees.map(employee => ({
	        ...employee,
	        subtitle: employee.workPosition
	      })).reverse();
	    },
	    filteredEmployees() {
	      return this.formattedEmployees.filter(employee => {
	        var _employee$workPositio;
	        return employee.name.toLowerCase().includes(this.searchQuery.toLowerCase()) || ((_employee$workPositio = employee.workPosition) == null ? void 0 : _employee$workPositio.toLowerCase().includes(this.searchQuery.toLowerCase()));
	      });
	    },
	    memberCount() {
	      var _this$departments$get3;
	      return (_this$departments$get3 = this.departments.get(this.focusedNode).userCount) != null ? _this$departments$get3 : 0;
	    },
	    ...ui_vue3_pinia.mapState(humanresources_companyStructure_chartStore.useChartStore, ['focusedNode', 'departments', 'searchedUserId']),
	    ...ui_vue3_pinia.mapWritableState(humanresources_companyStructure_chartStore.useChartStore, ['searchedUserId']),
	    employees() {
	      var _this$departments$get4, _this$departments$get5;
	      return (_this$departments$get4 = (_this$departments$get5 = this.departments.get(this.focusedNode)) == null ? void 0 : _this$departments$get5.employees) != null ? _this$departments$get4 : [];
	    },
	    showSearchBar() {
	      return this.memberCount > 0;
	    },
	    showSearchEmptyState() {
	      return this.filteredHeads.length === 0 && this.filteredEmployees.length === 0;
	    },
	    canAddUsers() {
	      const permissionChecker = humanresources_companyStructure_permissionChecker.PermissionChecker.getInstance();
	      if (!permissionChecker) {
	        return false;
	      }
	      const nodeId = this.focusedNode;
	      const permission = this.isTeamEntity ? humanresources_companyStructure_permissionChecker.PermissionActions.teamAddMember : humanresources_companyStructure_permissionChecker.PermissionActions.employeeAddToDepartment;
	      return permissionChecker.hasPermission(permission, nodeId);
	    },
	    headListEmptyStateTitle() {
	      if (this.canAddUsers) {
	        return this.isTeamEntity ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_TEAM_HEAD_EMPTY_LIST_ITEM_TITLE') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_HEAD_EMPTY_LIST_ITEM_TITLE');
	      }
	      return this.isTeamEntity ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_TEAM_HEAD_EMPTY_LIST_ITEM_TITLE_WITHOUT_ADD_PERMISSION') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_HEAD_EMPTY_LIST_ITEM_TITLE_WITHOUT_ADD_PERMISSION');
	    },
	    employeesListEmptyStateTitle() {
	      if (this.canAddUsers) {
	        return this.isTeamEntity ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_TEAM_EMPLOYEE_EMPTY_LIST_ITEM_TITLE') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_EMPLOYEE_EMPTY_LIST_ITEM_TITLE');
	      }
	      return this.isTeamEntity ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_TEAM_EMPLOYEE_EMPTY_LIST_ITEM_TITLE_WITHOUT_ADD_PERMISSION') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_EMPLOYEE_EMPTY_LIST_ITEM_TITLE_WITHOUT_ADD_PERMISSION');
	    },
	    shouldUpdateList() {
	      var _this$departments$get6, _this$departments$get7;
	      return (_this$departments$get6 = (_this$departments$get7 = this.departments.get(this.focusedNode).employeeListOptions) == null ? void 0 : _this$departments$get7.shouldUpdateList) != null ? _this$departments$get6 : true;
	    },
	    departmentUsersStatus() {
	      const department = this.departments.get(this.focusedNode);
	      if (department != null && department.heads && department.employees) {
	        return {
	          departmentId: this.focusedNode,
	          loaded: true
	        };
	      }
	      return {
	        departmentId: this.focusedNode,
	        loaded: false
	      };
	    },
	    headMenu() {
	      return new humanresources_companyStructure_orgChart.UsersTabActionMenu(this.focusedNode, humanresources_companyStructure_api.AnalyticsSourceType.DETAIL, 'head', this.entityType);
	    },
	    employeeMenu() {
	      return new humanresources_companyStructure_orgChart.UsersTabActionMenu(this.focusedNode, humanresources_companyStructure_api.AnalyticsSourceType.DETAIL, 'employee', this.entityType);
	    },
	    isEmployeeListOptionsSet() {
	      const department = this.departments.get(this.focusedNode) || {};
	      return department.employeeListOptions && Object.keys(department.employeeListOptions).length > 0;
	    },
	    employeeTitle() {
	      return this.isTeamEntity ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_TEAM_EMPLOYEE_LIST_TITLE') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_EMPLOYEE_LIST_TITLE');
	    },
	    entityType() {
	      var _this$departments$get8;
	      return (_this$departments$get8 = this.departments.get(this.focusedNode)) == null ? void 0 : _this$departments$get8.entityType;
	    },
	    isTeamEntity() {
	      return this.entityType === humanresources_companyStructure_utils.EntityTypes.team;
	    },
	    emptyStateTitle() {
	      return this.isTeamEntity ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_EMPTY_EMPLOYEES_TEAM_ADD_USER_TITLE') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_EMPTY_EMPLOYEES_ADD_USER_TITLE');
	    },
	    emptyStateDescription() {
	      if (this.canAddUsers) {
	        return this.isTeamEntity ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_EMPTY_EMPLOYEES_TEAM_ADD_USER_SUBTITLE') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_EMPTY_EMPLOYEES_ADD_USER_SUBTITLE');
	      }

	      // text is in progress
	      return this.isTeamEntity ? '' : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_EMPTY_EMPLOYEES_ADD_USER_SUBTITLE');
	    },
	    isHeadListPotentialTarget() {
	      return this.dragState.isDragging && this.dragState.initialList === 'employees';
	    },
	    isEmployeeListPotentialTarget() {
	      return this.dragState.isDragging && (this.dragState.initialList === 'head' || this.dragState.initialList === 'deputyHead');
	    },
	    dndConfirmationPopupTitle() {
	      const toHead = this.dragState.targetList === 'head';
	      return toHead ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_DND_POPUP_CONFIRM_TITLE_TO_HEAD') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_DND_POPUP_CONFIRM_TITLE');
	    },
	    dndConfirmationPopupBtn() {
	      const toHead = this.dragState.targetList === 'head';
	      return toHead ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_DND_POPUP_CONFIRM_BTN_TO_HEAD') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_DND_POPUP_CONFIRM_BTN');
	    },
	    showDndRoleSelect() {
	      return this.dragState.targetList === 'head';
	    },
	    headListTitle() {
	      return this.isTeamEntity ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_TEAM_HEAD_LIST_TITLE') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_HEAD_LIST_TITLE');
	    }
	  },
	  watch: {
	    focusedNode(newId) {
	      const department = this.departments.get(newId) || {};
	      if (!this.isEmployeeListOptionsSet) {
	        const employeeListOptions = {
	          page: 0,
	          shouldUpdateList: true,
	          isListUpdated: false
	        };
	        DepartmentContentActions.updateEmployeeListOptions(newId, employeeListOptions);
	        this.departments.set(newId, department);
	      }
	      if (department.employeeListOptions.page === 0 && department.employeeListOptions.isListUpdated === false && department.employeeListOptions.shouldUpdateList === true) {
	        this.loadEmployeesAction();
	      }
	      this.isDescriptionExpanded = false;
	      this.searchQuery = '';
	      if (this.searchedUserId) {
	        this.needToFocusUserId = this.searchedUserId;
	        this.$nextTick(() => {
	          this.scrollToUser();
	        });
	      }
	    },
	    searchedUserId: {
	      handler(userId) {
	        if (!userId) {
	          return;
	        }
	        this.needToFocusUserId = userId;
	        if (this.isListUpdated) {
	          this.needToScroll = true;
	        } else {
	          this.$nextTick(() => {
	            this.scrollToUser();
	          });
	        }
	      },
	      immediate: true
	    },
	    async searchQuery(newQuery) {
	      await this.searchMembers(newQuery);
	    },
	    departmentUsersStatus(usersStatus, prevUsersStatus) {
	      const {
	        departmentId,
	        loaded
	      } = usersStatus;
	      const {
	        departmentId: prevDepartmentId,
	        loaded: prevLoaded
	      } = prevUsersStatus;
	      if (departmentId === prevDepartmentId && loaded === prevLoaded) {
	        return;
	      }
	      if (loaded) {
	        this.$emit('hideDetailLoader');
	      } else {
	        this.$emit('showDetailLoader');
	        this.loadEmployeesAction();
	      }
	    }
	  },
	  created() {
	    this.loadEmployeesAction();
	    this.clearSearchTimeout = null;
	    this.autoscrollIntervalId = null;
	    this.boundHandleDragMove = this.handleDragMove.bind(this);
	    this.boundHandleDragEnd = this.handleDragEnd.bind(this);
	  },
	  mounted() {
	    this.tabContainer = this.$refs['tab-container'];
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    getBadgeText(role) {
	      if (role === this.memberRoles.head) {
	        return this.isTeamEntity ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_EMPLOYEES_TEAM_HEAD_BADGE') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_EMPLOYEES_HEAD_BADGE');
	      }
	      if (role === this.memberRoles.deputyHead) {
	        return this.isTeamEntity ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_EMPLOYEES_TEAM_DEPUTY_HEAD_BADGE') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_EMPLOYEES_DEPUTY_HEAD_BADGE');
	      }
	      return null;
	    },
	    updateList(event) {
	      const employeesList = event.target;
	      const scrollPosition = employeesList.scrollTop + employeesList.clientHeight;
	      if (employeesList.scrollHeight - scrollPosition < 40) {
	        this.loadEmployeesAction();
	      }
	    },
	    async loadEmployeesAction() {
	      var _this$departments$get9, _employeeListOptions$, _employeeListOptions$2, _employeeListOptions$3, _this$departments$get10, _this$departments$get11;
	      const nodeId = this.focusedNode;
	      if (!this.departments.get(nodeId)) {
	        return;
	      }
	      const employeeListOptions = (_this$departments$get9 = this.departments.get(nodeId).employeeListOptions) != null ? _this$departments$get9 : {};
	      employeeListOptions.page = (_employeeListOptions$ = employeeListOptions.page) != null ? _employeeListOptions$ : 0;
	      employeeListOptions.shouldUpdateList = (_employeeListOptions$2 = employeeListOptions.shouldUpdateList) != null ? _employeeListOptions$2 : true;
	      employeeListOptions.isListUpdated = (_employeeListOptions$3 = employeeListOptions.isListUpdated) != null ? _employeeListOptions$3 : false;
	      DepartmentContentActions.updateEmployeeListOptions(nodeId, employeeListOptions);
	      if (employeeListOptions.isListUpdated || !employeeListOptions.shouldUpdateList) {
	        return;
	      }
	      if (!employeeListOptions.isListUpdated && employeeListOptions.page === 0 && employeeListOptions.shouldUpdateList === true) {
	        this.$emit('showDetailLoader');
	      }
	      employeeListOptions.isListUpdated = true;
	      employeeListOptions.page += 1;
	      DepartmentContentActions.updateEmployeeListOptions(nodeId, employeeListOptions);
	      let loadedEmployees = await DepartmentAPI.getPagedEmployees(nodeId, employeeListOptions.page, 25);
	      if (!loadedEmployees) {
	        employeeListOptions.shouldUpdateList = false;
	        employeeListOptions.isListUpdated = false;
	        DepartmentContentActions.updateEmployeeListOptions(nodeId, employeeListOptions);
	        return;
	      }
	      loadedEmployees = loadedEmployees.map(user => {
	        return {
	          ...user,
	          role: this.memberRoles.employee
	        };
	      });
	      const employees = (_this$departments$get10 = (_this$departments$get11 = this.departments.get(nodeId)) == null ? void 0 : _this$departments$get11.employees) != null ? _this$departments$get10 : [];
	      const employeeIds = new Set(employees.map(employee => employee.id));
	      const newEmployees = loadedEmployees.reverse().filter(employee => !employeeIds.has(employee.id));
	      employees.unshift(...newEmployees);
	      employeeListOptions.shouldUpdateList = newEmployees.length === 25;
	      employeeListOptions.isListUpdated = false;
	      DepartmentContentActions.updateEmployeeListOptions(nodeId, employeeListOptions);
	      DepartmentContentActions.updateEmployees(nodeId, employees);
	      if (this.departmentUsersStatus.loaded) {
	        this.$emit('hideDetailLoader');
	      }
	      if (this.needToScroll) {
	        this.scrollToUser();
	      }
	    },
	    async scrollToUser() {
	      const userId = this.needToFocusUserId;
	      this.needToFocusUserId = null;
	      this.needToScroll = false;
	      const selectors = `.hr-department-detail-content__user-container[data-id="hr-department-detail-content__user-${userId}-item"]`;
	      let element = this.tabContainer.querySelector(selectors);
	      if (!element) {
	        let user = null;
	        try {
	          user = await DepartmentAPI.getUserInfo(this.focusedNode, userId);
	        } catch {/* empty */}
	        const department = this.departments.get(this.focusedNode);
	        if (!user || !department) {
	          return;
	        }
	        if (user.role === this.memberRoles.head || user.role === this.memberRoles.deputyHead) {
	          var _department$heads;
	          department.heads = (_department$heads = department.heads) != null ? _department$heads : [];
	          if (!department.heads.some(head => head.id === user.id)) {
	            return;
	          }
	        } else {
	          var _department$employees;
	          department.employees = (_department$employees = department.employees) != null ? _department$employees : [];
	          if (!department.employees.some(employee => employee.id === user.id)) {
	            department.employees.push(user);
	          }
	        }

	        // eslint-disable-next-line vue/valid-next-tick
	        await this.$nextTick(() => {
	          element = this.tabContainer.querySelector(selectors);
	        });
	      }
	      if (!element) {
	        return;
	      }
	      element.scrollIntoView({
	        behavior: 'smooth',
	        block: 'center'
	      });
	      setTimeout(() => {
	        this.selectedUserId = userId;
	      }, 750);
	      if (this.clearSearchTimeout) {
	        clearTimeout(this.clearSearchTimeout);
	      }
	      this.clearSearchTimeout = setTimeout(() => {
	        if (this.searchedUserId === userId) {
	          this.selectedUserId = null;
	          this.searchedUserId = null;
	        }
	      }, 4000);
	    },
	    async searchMembers(query) {
	      if (query.length === 0) {
	        return;
	      }
	      this.findQueryResult = this.findQueryResult || {};
	      this.findQueryResult[this.focusedNode] = this.findQueryResult[this.focusedNode] || {
	        success: [],
	        failure: []
	      };
	      const nodeResults = this.findQueryResult[this.focusedNode];
	      if (nodeResults.failure.some(failedQuery => query.startsWith(failedQuery))) {
	        return;
	      }
	      if (nodeResults.success.includes(query) || nodeResults.failure.includes(query)) {
	        return;
	      }
	      const founded = await DepartmentAPI.findMemberByQuery(this.focusedNode, query);
	      if (founded.length === 0) {
	        nodeResults.failure.push(query);
	        return;
	      }
	      const department = this.departments.get(this.focusedNode);
	      const newMembers = founded.filter(found => !department.heads.some(head => head.id === found.id) && !department.employees.some(employee => employee.id === found.id));
	      department.employees.push(...newMembers);
	      nodeResults.success.push(query);
	    },
	    searchUser(searchQuery) {
	      this.searchQuery = searchQuery;
	    },
	    onHeadListActionMenuItemClick(actionId) {
	      this.headMenu.onActionMenuItemClick(actionId);
	    },
	    onEmployeeListActionMenuItemClick(actionId) {
	      this.employeeMenu.onActionMenuItemClick(actionId);
	    },
	    getHeadListDataTestIds() {
	      return HeadListDataTestIds;
	    },
	    getEmployeeListDataTestIds() {
	      return EmployeeListDataTestIds;
	    },
	    handleItemDragStart(payload) {
	      if (this.dragState.isDragging) {
	        return;
	      }
	      const {
	        event,
	        element,
	        userId,
	        initialListType
	      } = payload;
	      event.preventDefault();
	      this.dragState.isDragging = true;
	      this.dragState.userId = userId;
	      this.dragState.initialList = initialListType;
	      this.dragState.draggedElement = element;
	      const rect = this.dragState.draggedElement.getBoundingClientRect();
	      this.dragState.offsetX = event.clientX - rect.left;
	      this.dragState.offsetY = event.clientY - rect.top;
	      const ghost = this.dragState.draggedElement.cloneNode(true);
	      main_core.Dom.addClass(ghost, '--ghost');
	      main_core.Dom.style(ghost, 'left', `${event.clientX - this.dragState.offsetX}px`);
	      main_core.Dom.style(ghost, 'top', `${event.clientY - this.dragState.offsetY}px`);
	      main_core.Dom.append(ghost, document.body);
	      this.dragState.ghostElement = ghost;
	      main_core.Dom.addClass(this.dragState.draggedElement, '--dragging');
	      main_core.Dom.addClass(document.body, '--user-dragging');
	      main_core.Event.bind(document, 'mousemove', this.boundHandleDragMove);
	      main_core.Event.bind(document, 'mouseup', this.boundHandleDragEnd);

	      // user to computed?
	      const user = this.formattedHeads.find(u => u.id === userId) || this.formattedEmployees.find(u => u.id === userId);
	      main_core_events.EventEmitter.emit(humanresources_companyStructure_orgChart.events.HR_USER_DRAG_START, {
	        user
	      });
	    },
	    handleDragMove(event) {
	      var _this$$refs$headList, _this$$refs$employeeL;
	      if (!this.dragState.isDragging) {
	        return;
	      }
	      main_core.Dom.addClass(this.dragState.draggedElement, '--hidden');
	      main_core_events.EventEmitter.emit(humanresources_companyStructure_orgChart.events.HR_USER_DRAG_MOVE, {
	        pageX: event.pageX,
	        pageY: event.pageY
	      });
	      if (this.dragState.ghostElement) {
	        main_core.Dom.style(this.dragState.ghostElement, 'left', `${event.clientX - this.dragState.offsetX}px`);
	        main_core.Dom.style(this.dragState.ghostElement, 'top', `${event.clientY - this.dragState.offsetY}px`);
	      }
	      let potentialTarget = null;
	      if (this.isHeadListPotentialTarget && this.isPointerOverElement(event, (_this$$refs$headList = this.$refs.headList) == null ? void 0 : _this$$refs$headList.$el)) {
	        potentialTarget = 'head';
	      } else if (this.isEmployeeListPotentialTarget && this.isPointerOverElement(event, (_this$$refs$employeeL = this.$refs.employeeList) == null ? void 0 : _this$$refs$employeeL.$el)) {
	        potentialTarget = 'employee';
	      }
	      this.dragState.targetList = potentialTarget;
	      this.handleAutoscrollOnDrag(event);
	    },
	    handleAutoscrollOnDrag(event) {
	      if (!this.isHeadListPotentialTarget) {
	        return;
	      }
	      const scrollableContainer = this.$refs.scrollableContainer;
	      if (!scrollableContainer) {
	        return;
	      }
	      const rect = scrollableContainer.getBoundingClientRect();
	      const mouseY = event.clientY;
	      const topTriggerZone = rect.top + AUTOSCROLL_AREA_SIZE;
	      if (mouseY < topTriggerZone) {
	        if (this.autoscrollIntervalId !== null) {
	          return;
	        }
	        const scrollSpeed = 10;
	        this.autoscrollIntervalId = setInterval(() => {
	          scrollableContainer.scrollTop -= scrollSpeed;
	        }, 16);
	      } else {
	        this.stopAutoscroll();
	      }
	    },
	    stopAutoscroll() {
	      if (this.autoscrollIntervalId !== null) {
	        clearInterval(this.autoscrollIntervalId);
	        this.autoscrollIntervalId = null;
	      }
	    },
	    isPointerOverElement(event, element) {
	      if (!element) {
	        return false;
	      }
	      const rect = element.getBoundingClientRect();
	      return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
	    },
	    async handleDragEnd() {
	      if (!this.dragState.isDragging) {
	        return;
	      }
	      main_core_events.EventEmitter.emit(humanresources_companyStructure_orgChart.events.HR_USER_DRAG_DROP);
	      this.stopAutoscroll();
	      const {
	        userId,
	        initialList,
	        targetList,
	        ghostElement,
	        draggedElement
	      } = this.dragState;
	      const isValidDrop = userId && targetList && targetList !== initialList;
	      let targetIndex = null;
	      if (isValidDrop) {
	        const listRef = targetList === 'head' ? this.$refs.headList : this.$refs.employeeList;
	        targetIndex = listRef == null ? void 0 : listRef.placeholderIndex;
	      }
	      main_core.Event.unbind(document, 'mousemove', this.boundHandleDragMove);
	      main_core.Event.unbind(document, 'mouseup', this.boundHandleDragEnd);
	      if (ghostElement) {
	        main_core.Dom.remove(ghostElement);
	      }
	      if (draggedElement) {
	        main_core.Dom.removeClass(draggedElement, '--dragging');
	        main_core.Dom.removeClass(draggedElement, '--hidden');
	      }
	      main_core.Dom.removeClass(document.body, '--user-dragging');
	      main_core_events.EventEmitter.emit(humanresources_companyStructure_orgChart.events.HR_USER_DRAG_END);
	      if (!isValidDrop || targetIndex === null) {
	        this.dragState = this.getInitialDragState();
	        return;
	      }
	      this.dragState.isDragging = false;
	      this.dragState.ghostElement = null;
	      this.dragState.draggedElement = null;
	      this.dragState.context = {
	        targetIndex
	      };
	      this.dndPreviousState = this.moveDndUser();
	      if (!this.dndPreviousState) {
	        this.dragState = this.getInitialDragState();
	        return;
	      }
	      const {
	        context
	      } = this.dragState;
	      context.selectedRole = null;
	      context.selectedRoleLabel = '';
	      if (targetList === 'head') {
	        context.selectedRole = this.memberRoles.head;
	        context.selectedRoleLabel = this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_EMPLOYEES_HEAD_BADGE');
	      }
	      await this.prepareDndPopupDescription();
	      this.showDndConfirmationPopup = true;
	    },
	    cancelDndUserMove() {
	      const {
	        heads,
	        employees
	      } = this.dndPreviousState;
	      DepartmentContentActions.updateHeads(this.focusedNode, heads);
	      DepartmentContentActions.updateEmployees(this.focusedNode, employees);
	      this.dndPreviousState = null;
	      this.dragState = this.getInitialDragState();
	      this.showDndConfirmationPopup = false;
	    },
	    async confirmDndUserMove(payload) {
	      const {
	        userId
	      } = this.dragState;
	      const targetRole = payload.role || this.memberRoles.employee;
	      const department = this.departments.get(this.focusedNode);
	      const user = department.heads.find(u => u.id === userId) || department.employees.find(u => u.id === userId);
	      if (!user) {
	        this.dragState = this.getInitialDragState();
	        return;
	      }
	      const previousRole = user.role;
	      user.role = targetRole;
	      try {
	        await humanresources_companyStructure_userManagementDialog.UserManagementDialogAPI.addUsersToDepartment(this.focusedNode, [userId], targetRole);
	        ui_notification.UI.Notification.Center.notify({
	          content: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_DND_SUCCESS'),
	          autoHideDelay: 3000
	        });
	      } catch (error) {
	        console.error(error);
	        user.role = previousRole;
	        this.cancelDndUserMove();
	      }
	      this.showDndConfirmationPopup = false;
	      this.dragState = this.getInitialDragState();
	    },
	    async prepareDndPopupDescription() {
	      var _department$name, _user$name, _user, _user$url, _user2;
	      const {
	        userId,
	        targetList
	      } = this.dragState;
	      const toHead = targetList === 'head';
	      const isTeam = this.isTeamEntity;
	      const department = this.departments.get(this.departmentId);
	      const departmentName = main_core.Text.encode((_department$name = department == null ? void 0 : department.name) != null ? _department$name : '');
	      let user = null;
	      try {
	        user = await DepartmentAPI.getUserInfo(this.departmentId, userId);
	      } catch {/* empty */}
	      const userName = main_core.Text.encode((_user$name = (_user = user) == null ? void 0 : _user.name) != null ? _user$name : '');
	      const userUrl = (_user$url = (_user2 = user) == null ? void 0 : _user2.url) != null ? _user$url : '#';
	      let phraseCode = '';
	      if (toHead) {
	        phraseCode = isTeam ? 'HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_DND_POPUP_CONFIRM_DESC_TO_TEAM_HEAD' : 'HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_DND_POPUP_CONFIRM_DESC_TO_HEAD';
	      } else {
	        var _user3;
	        const basePhrase = isTeam ? 'HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_DND_POPUP_CONFIRM_DESC_TEAM' : 'HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_DND_POPUP_CONFIRM_DESC';
	        const genderSuffix = ((_user3 = user) == null ? void 0 : _user3.gender) === 'F' ? '_F' : '_M';
	        phraseCode = basePhrase + genderSuffix;
	      }
	      this.dndPopupDescription = this.loc(phraseCode, {
	        '#USER_NAME#': userName,
	        '#DEPARTMENT_NAME#': departmentName
	      }).replace('[link]', `<a class="hr-department-detail-content__move-user-department-user-link" href="${userUrl}">`).replace('[/link]', '</a>');
	    },
	    moveDndUser() {
	      const {
	        userId,
	        targetList,
	        context
	      } = this.dragState;
	      const {
	        targetIndex
	      } = context;
	      const department = this.departments.get(this.focusedNode);
	      if (!department) {
	        return null;
	      }
	      const previousState = {
	        heads: [...department.heads],
	        employees: [...department.employees]
	      };
	      const isMovingToHeads = targetList === 'head';
	      const sourceList = isMovingToHeads ? [...previousState.employees] : [...previousState.heads];
	      const targetListForMove = isMovingToHeads ? [...previousState.heads] : [...previousState.employees];
	      const userIndex = sourceList.findIndex(user => user.id === userId);
	      if (userIndex === -1) {
	        return null;
	      }
	      const [userToMove] = sourceList.splice(userIndex, 1);
	      targetListForMove.splice(targetIndex, 0, userToMove);
	      if (isMovingToHeads) {
	        DepartmentContentActions.updateHeads(this.focusedNode, targetListForMove);
	        DepartmentContentActions.updateEmployees(this.focusedNode, sourceList);
	      } else {
	        DepartmentContentActions.updateHeads(this.focusedNode, sourceList);
	        DepartmentContentActions.updateEmployees(this.focusedNode, targetListForMove);
	      }
	      return previousState;
	    },
	    getInitialDragState() {
	      return {
	        isDragging: false,
	        userId: null,
	        initialList: null,
	        targetList: null,
	        ghostElement: null,
	        draggedElement: null,
	        offsetX: 0,
	        offsetY: 0,
	        context: null
	      };
	    }
	  },
	  template: `
		<div class="hr-department-detail-content__tab-container --users" ref="tab-container">
			<template v-if="memberCount > 0">
				<SearchInput
					v-if="showSearchBar"
					:placeholder="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_SEARCH_PLACEHOLDER')"
					:value="searchQuery"
					@inputChange="searchUser"
					dataTestId="hr-department-detail-content_users-tab__users-search-input"
				/>
				<div
					v-if="!showSearchEmptyState"
					v-on="shouldUpdateList ? { scroll: updateList } : {}"
					class="hr-department-detail-content__lists-container"
					ref="scrollableContainer"
				>
					<TabList
						ref="headList"
						id='hr-department-detail-content_chats-tab__chat-list'
						:title="headListTitle"
						:count="headCount"
						:menuItems="headMenu.items"
						:listItems="filteredHeads"
						listType="head"
						:emptyItemTitle="headListEmptyStateTitle"
						emptyItemImageClass="hr-department-detail-content__empty-user-list-item-image"
						:hideEmptyItem="searchQuery.length > 0"
						:withAddPermission="canAddUsers"
						@tabListAction="onHeadListActionMenuItemClick"
						:dataTestIds="getHeadListDataTestIds()"
						:isDropTarget="isHeadListPotentialTarget && dragState.targetList === 'head'"
					>
						<template v-slot="{ item }">
							<UserListItem
								:user="item"
								listType="head"
								:selectedUserId="selectedUserId"
								:entityType="entityType"
								:canDrag="canAddUsers"
								@itemDragStart="handleItemDragStart"
							/>
						</template>
					</TabList>
					<TabList
						ref="employeeList"
						id='hr-department-detail-content_chats-tab__channel-list'
						:title="employeeTitle"
						:count="employeeCount"
						listType="employees"
						:menuItems="employeeMenu.items"
						:listItems="filteredEmployees"
						:emptyItemTitle="employeesListEmptyStateTitle"
						emptyItemImageClass="hr-department-detail-content__empty-user-list-item-image"
						:hideEmptyItem="searchQuery.length > 0"
						:withAddPermission="canAddUsers"
						@tabListAction="onEmployeeListActionMenuItemClick"
						:dataTestIds="getEmployeeListDataTestIds()"
						:isDropTarget="isEmployeeListPotentialTarget && dragState.targetList === 'employee'"
					>
						<template v-slot="{ item }">
							<UserListItem
								:user="item"
								listType="employees"
								:canDrag="canAddUsers"
								@itemDragStart="handleItemDragStart"
								:selectedUserId="selectedUserId"
								:entityType="entityType"
							/>
						</template>
					</TabList>
				</div>
				<EmptyState v-else
					imageClass="hr-department-detail-content__empty-tab-user-not-found-icon"
					:title="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_EMPTY_SEARCHED_EMPLOYEES_TITLE')"
					:description ="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_EMPTY_SEARCHED_EMPLOYEES_SUBTITLE')"
				/>
			</template>
			<EmptyState v-else
				:imageClass="canAddUsers 
					? 'hr-department-detail-content__empty-tab-add-user-icon' 
					: 'hr-department-detail-content__empty-tab-cant-add-user-icon'"
				:title="emptyStateTitle"
				:description ="emptyStateDescription"
			>
				<template v-slot:content>
					<EmptyTabAddButton v-if="canAddUsers" :departmentId="departmentId" :entityType="entityType"/>
				</template>
			</EmptyState>
			<MoveEmployeeConfirmationPopup 
				v-if="showDndConfirmationPopup" 
				:title="dndConfirmationPopupTitle"
				:description="dndPopupDescription"
				:confirmButtonText="dndConfirmationPopupBtn"
				:showRoleSelect="showDndRoleSelect"
				:excludeEmployeeRole="true"
				:entityType="entityType"
				@confirm="confirmDndUserMove"
				@close="cancelDndUserMove"
			/>
		</div>
	`
	};

	const MenuOption = Object.freeze({
	  withChildren: 'withChildren',
	  withoutChildren: 'withoutChildren'
	});

	// @vue/component
	const ChildrenModeSelector = {
	  name: 'childrenModeSelector',
	  components: {
	    RouteActionMenu: humanresources_companyStructure_structureComponents.RouteActionMenu
	  },
	  props: {
	    isTeamEntity: {
	      type: Boolean,
	      required: true
	    },
	    dataTestId: {
	      type: String,
	      required: true
	    },
	    hasPermission: {
	      type: Boolean,
	      required: true
	    },
	    text: {
	      type: String,
	      required: true
	    }
	  },
	  emits: ['saveChildrenMode'],
	  data() {
	    return {
	      menuVisible: false,
	      withChildren: false
	    };
	  },
	  computed: {
	    getControlButtonText() {
	      return this.getValueText(this.withChildren);
	    }
	  },
	  created() {
	    this.menuItems = this.getMenuItems();
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    showMenu() {
	      if (this.hasPermission) {
	        this.menuVisible = true;
	      }
	    },
	    onActionMenuItemClick(actionId) {
	      if (this.hasPermission) {
	        this.withChildren = actionId === MenuOption.withChildren;
	        this.$emit('saveChildrenMode', this.withChildren);
	      }
	    },
	    getMenuItems() {
	      return [{
	        id: MenuOption.withoutChildren,
	        title: this.getValueText(false),
	        itemClass: 'hr-department-detail-content__children-mode-selector_menu-item'
	      }, {
	        id: MenuOption.withChildren,
	        title: this.getValueText(true),
	        itemClass: 'hr-department-detail-content__children-mode-selector_menu-item'
	      }];
	    },
	    getValueText(value) {
	      if (this.isTeamEntity) {
	        return value ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_WITH_SUBTEAMS_LABEL') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_ONLY_TEAM_LABEL');
	      }
	      return value ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_WITH_SUBDEPARTMENTS_LABEL') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_ONLY_DEPARTMENT_LABEL');
	    }
	  },
	  template: `
		<div class="hr-department-detail-content__change-save-mode-control-container">
			<span>{{ text }}</span>
			<a
				class="hr-department-detail-content__change-save-mode-control-button"
				:class="{ '--focused': menuVisible, '--disabled': !hasPermission }"
				:data-test-id="dataTestId"
				ref='saveChildrenModeButton'
				@click="showMenu"
			>
				{{ getControlButtonText }}
			</a>
		</div>
		<RouteActionMenu
			v-if="menuVisible"
			:id="'hr-department-detail-children-mode-selector-menu'"
			:items="menuItems"
			:delimiter="false"
			:width="302"
			:bindElement="$refs.saveChildrenModeButton"
			@action="onActionMenuItemClick"
			@close="menuVisible = false"
		/>
	`
	};

	const ChatsMenuOption = Object.freeze({
	  linkChat: 'linkChat',
	  linkChannel: 'linkChannel'
	});
	const ChatsMenuLinkChat = Object.freeze({
	  id: ChatsMenuOption.linkChat,
	  title: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHAT_LIST_LINK_BUTTON_TITLE'),
	  description: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHAT_LIST_LINK_BUTTON_DESC'),
	  bIcon: {
	    name: ui_iconSet_api_core.Main.CHAT_MESSAGE,
	    size: 20,
	    colorTokenName: 'paletteBlue50'
	  },
	  dataTestId: 'hr-department-content_chats-tab__chat-list-action-link'
	});
	const ChatsMenuLinkChannel = Object.freeze({
	  id: ChatsMenuOption.linkChannel,
	  title: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHANNEL_LIST_LINK_BUTTON_TITLE'),
	  description: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHANNEL_LIST_LINK_BUTTON_DESC'),
	  bIcon: {
	    name: ui_iconSet_api_core.Main.SPEAKER_MOUTHPIECE,
	    size: 20,
	    colorTokenName: 'paletteBlue50'
	  },
	  dataTestId: 'hr-department-content_chats-tab__channel-list-action-link'
	});
	const ChatListDataTestIds = Object.freeze({
	  containerDataTestId: 'hr-department-content_chats-tab__chat-list-container',
	  listActionButtonDataTestId: 'hr-department-content_chats-tab__chat-list-action-button',
	  listActonMenuDataTestId: 'hr-department-content_chats-tab__chat-list-action-menu-container',
	  listCounterDataTestId: 'hr-department-content_chats-tab__chat-list-counter'
	});
	const ChannelListDataTestIds = Object.freeze({
	  containerDataTestId: 'hr-department-content_chats-tab__channel-list-container',
	  listActionButtonDataTestId: 'hr-department-content_chats-tab__channel-list-action-button',
	  listActonMenuDataTestId: 'hr-department-content_chats-tab__channel-list-action-menu-container',
	  listCounterDataTestId: 'hr-department-content_chats-tab__channel-list-counter'
	});
	const ChatLinkDialogDataTestIds = Object.freeze({
	  containerDataTestId: 'hr-department-content_chats-tab__link-chat-container',
	  confirmButtonDataTestId: 'hr-department-content_chats-tab__link-chat-confirm-button',
	  cancelButtonDataTestId: 'hr-department-content_chats-tab__link-chat-cancel-button',
	  closeButtonDataTestId: 'hr-department-content_chats-tab__link-chat-close-button',
	  addWithChildrenDataTestId: 'hr-department-content_chats-tab__link-chat-add-with-children'
	});
	const ChannelLinkDialogDataTestIds = Object.freeze({
	  containerDataTestId: 'hr-department-content_chats-tab__link-channel-container',
	  confirmButtonDataTestId: 'hr-department-content_chats-tab__link-channel-confirm-button',
	  cancelButtonDataTestId: 'hr-department-content_chats-tab__link-channel-cancel-button',
	  closeButtonDataTestId: 'hr-department-content_chats-tab__link-channel-close-button',
	  addWithChildrenDataTestId: 'hr-department-content_chats-tab__link-channel-add-with-children'
	});

	const EmptyTabAddButtons = {
	  name: 'emptyStateButtons',
	  emits: ['emptyStateAddAction'],
	  components: {
	    RouteActionMenu: humanresources_companyStructure_structureComponents.RouteActionMenu
	  },
	  data() {
	    return {
	      chatMenuVisible: false,
	      channelMenuVisible: false,
	      chatButtonId: 'hr-empty-tab-chat-add-button',
	      channelButtonId: 'hr-empty-tab-chat-add-button'
	    };
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    onChatButtonClick() {
	      this.$emit('emptyStateAddAction', ChatsMenuOption.linkChat);
	    },
	    onChannelButtonClick() {
	      this.$emit('emptyStateAddAction', ChatsMenuOption.linkChannel);
	    }
	  },
	  template: `
		<div class="hr-department-detail-content__chat-empty-tab-add_buttons-container">
			<button
				:ref="chatButtonId"
				class="ui-btn ui-btn-light-border ui-btn-no-caps ui-btn-round ui-btn-sm hr-department-detail-content__chat-empty-tab-add_chat-button"
				@click.stop="this.onChatButtonClick()"
				data-test-id="hr-department-detail-content_chats-tab__empty-tab-add_chat-button"
			>
				<div class="ui-icon-set --chat-message hr-department-detail-content__chat-empty-tab-add_chat-button-icon"/>
				<span>
					{{ loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_TAB_ADD_EMPTY_CHAT_BUTTON') }}
				</span>
			</button>
			<button
				:ref="channelButtonId"
				class="ui-btn ui-btn-light-border ui-btn-no-caps ui-btn-round ui-btn-sm hr-department-detail-content__chat-empty-tab-add_channel-button"
				@click.stop="onChannelButtonClick()"
				data-test-id="hr-department-detail-content_chats-tab__empty-tab-add_channel-button"
			>
				<div class="ui-icon-set --speaker-mouthpiece hr-department-detail-content__chat-empty-tab-add_chat-button-icon"/>
				<span>
					{{ loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_TAB_ADD_EMPTY_CHANNEL_BUTTON') }}
				</span>
			</button>
		</div>
	`
	};

	// @vue/component
	const ChatListItemActionButton = {
	  name: 'chatListItemActionButton',
	  components: {
	    RouteActionMenu: humanresources_companyStructure_structureComponents.RouteActionMenu,
	    ConfirmationPopup: humanresources_companyStructure_structureComponents.ConfirmationPopup
	  },
	  props: {
	    /** @type ChatOrChannelDetailed */
	    chat: {
	      type: Object,
	      required: true
	    },
	    nodeId: {
	      type: Number,
	      required: true
	    }
	  },
	  data() {
	    return {
	      menuVisible: false,
	      showUnbindChatConfirmationPopup: false,
	      unbindChatLoader: false
	    };
	  },
	  computed: {
	    getUnbindChatTitle() {
	      const entityType = this.isTeamEntity ? 'TEAM' : 'DEPARTMENT';
	      const chatType = this.isChat ? 'CHAT' : 'CHANNEL';
	      return this.loc(`HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_UNBIND_POPUP_${chatType}_FROM_${entityType}_TITLE`);
	    },
	    getUnbindChatDescription() {
	      const entityType = this.isTeamEntity ? 'TEAM' : 'DEPARTMENT';
	      const chatType = this.isChat ? 'CHAT' : 'CHANNEL';
	      return this.loc(`HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_UNBIND_POPUP_${chatType}_FROM_${entityType}_DESCRIPTION`);
	    },
	    isTeamEntity() {
	      var _this$departments$get;
	      return ((_this$departments$get = this.departments.get(this.nodeId)) == null ? void 0 : _this$departments$get.entityType) === humanresources_companyStructure_utils.EntityTypes.team;
	    },
	    isChat() {
	      return this.chat.type === humanresources_companyStructure_utils.ChatTypes.chat;
	    },
	    menu() {
	      var _this$departments$get2;
	      const entityType = (_this$departments$get2 = this.departments.get(this.nodeId)) == null ? void 0 : _this$departments$get2.entityType;
	      return new humanresources_companyStructure_orgChart.ChatListActionMenu(entityType, this.chat, this.nodeId);
	    },
	    ...ui_vue3_pinia.mapState(humanresources_companyStructure_chartStore.useChartStore, ['departments'])
	  },
	  methods: {
	    toggleMenu() {
	      this.menuVisible = !this.menuVisible;
	    },
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    onActionMenuItemClick(actionId) {
	      if (actionId === humanresources_companyStructure_orgChart.MenuActions.openChat) {
	        im_public_iframe.Messenger.openChat(this.chat.dialogId);
	      } else if (actionId === humanresources_companyStructure_orgChart.MenuActions.unbindChat) {
	        this.showUnbindChatConfirmationPopup = true;
	      }
	    },
	    cancelUnbindChat() {
	      this.showUnbindChatConfirmationPopup = false;
	    },
	    async unbindChat() {
	      this.unbindChatLoader = true;
	      const entityType = this.isTeamEntity ? 'TEAM' : 'DEPARTMENT';
	      const chatType = this.isChat ? 'CHAT' : 'CHANNEL';
	      try {
	        await DepartmentAPI.updateChats(this.nodeId, [], [this.chat.id]);
	      } catch (error) {
	        if (error.code !== 'STRUCTURE_ACCESS_DENIED') {
	          ui_notification.UI.Notification.Center.notify({
	            content: this.loc(`HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_UNBIND_POPUP_${chatType}_FROM_${entityType}_ERROR`),
	            autoHideDelay: 2000
	          });
	        }
	        return;
	      } finally {
	        this.unbindChatLoader = false;
	        this.showUnbindChatConfirmationPopup = false;
	      }
	      DepartmentContentActions.unbindChatFromNode(this.nodeId, this.chat.id);
	      const isOwnChat = !this.chat.originalNodeId || this.chat.originalNodeId === this.nodeId;
	      if (isOwnChat) {
	        DepartmentContentActions.updateChatsInChildrenNodes(this.nodeId);
	      }
	      ui_notification.UI.Notification.Center.notify({
	        content: this.loc(`HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_UNBIND_POPUP_${chatType}_FROM_${entityType}_SUCCESS`),
	        autoHideDelay: 2000
	      });
	    }
	  },
	  template: `
		<button
			v-if="menu.items.length"
			class="ui-icon-set --more hr-department-detail-content__tab-list_item-action-btn --chat-item-action-btn ui-icon-set"
			:class="{ '--focused': menuVisible }"
			@click.stop="toggleMenu()"
			ref="actionChatButton"
			:data-id="'hr-department-detail-content__'+ chat.type.toLowerCase() + '-list_chat-' + chat.id + '-action-btn'"
		/>
		<RouteActionMenu
			v-if="menuVisible"
			:id="'tree-node-department-menu-chat_' + this.nodeId + '_' + chat.id"
			:items="menu.items"
			:width="302"
			:bindElement="$refs.actionChatButton"
			@action="onActionMenuItemClick"
			@close="menuVisible = false"
		/>
		<ConfirmationPopup
			ref="unbindChatConfirmationPopup"
			v-if="showUnbindChatConfirmationPopup"
			:showActionButtonLoader="unbindChatLoader"
			:title="getUnbindChatTitle"
			:confirmBtnText="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_UNBIND_POPUP_CONFIRM_BUTTON')"
			confirmButtonClass="ui-btn-danger"
			@action="unbindChat"
			@close="cancelUnbindChat"
			:width="364"
		>
			<template v-slot:content>
				<div class="hr-department-detail-content__user-action-text-container">
					<div
						v-html="getUnbindChatDescription"
					/>
				</div>
			</template>
		</ConfirmationPopup>
	`
	};

	// @vue/component
	const ChatListItem = {
	  name: 'chatListItem',
	  components: {
	    ChatListItemActionButton,
	    ResponsiveHint: humanresources_companyStructure_structureComponents.ResponsiveHint
	  },
	  directives: {
	    hint: humanresources_companyStructure_structureComponents.Hint
	  },
	  props: {
	    /** @type ChatOrChannelDetailed */
	    chat: {
	      type: Object,
	      required: true
	    },
	    nodeId: {
	      type: Number,
	      required: true
	    }
	  },
	  data() {
	    return {
	      avatar: null
	    };
	  },
	  computed: {
	    isChat() {
	      return this.chat.type !== humanresources_companyStructure_utils.ChatTypes.channel;
	    },
	    originalNodeName() {
	      var _this$departments$get;
	      return (_this$departments$get = this.departments.get(this.chat.originalNodeId)) == null ? void 0 : _this$departments$get.name;
	    },
	    hiddenNodeName() {
	      var _this$structureMap$ge;
	      return ((_this$structureMap$ge = this.structureMap.get(this.chat.originalNodeId)) == null ? void 0 : _this$structureMap$ge.entityType) === humanresources_companyStructure_utils.EntityTypes.team ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_HIDDEN_TEAM') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_HIDDEN_DEPARTMENT');
	    },
	    indirectChatSubtitle() {
	      var _this$structureMap$ge2;
	      if (((_this$structureMap$ge2 = this.structureMap.get(this.chat.originalNodeId)) == null ? void 0 : _this$structureMap$ge2.entityType) === humanresources_companyStructure_utils.EntityTypes.team) {
	        return this.isChat ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHAT_OF_TEAM') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHANNEL_OF_TEAM');
	      }
	      return this.isChat ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHAT_OF_DEPARTMENT') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHANNEL_OF_DEPARTMENT');
	    },
	    lockHint() {
	      var _this$structureMap$ge3, _this$structureMap$ge4;
	      if (!this.chat.hasAccess) {
	        return this.isChat ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_USER_HAS_NO_ACCESS_TO_CHAT_HINT') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_USER_HAS_NO_ACCESS_TO_CHANNEL_HINT');
	      }

	      // parent node is a team so child node must be a team too
	      if (((_this$structureMap$ge3 = this.structureMap.get(this.chat.originalNodeId)) == null ? void 0 : _this$structureMap$ge3.entityType) === humanresources_companyStructure_utils.EntityTypes.team) {
	        return this.isChat ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_PARENT_TEAM_CHAT_HINT') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_PARENT_TEAM_CHANNEL_HINT');
	      }

	      // parent node is a department so we check if child node is a department too
	      if (((_this$structureMap$ge4 = this.structureMap.get(this.nodeId)) == null ? void 0 : _this$structureMap$ge4.entityType) === humanresources_companyStructure_utils.EntityTypes.department) {
	        return this.isChat ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_PARENT_DEPARTMENT_CHAT_OF_DEPARTMENT_HINT') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_PARENT_DEPARTMENT_CHANNEL_OF_DEPARTMENT_HINT');
	      }

	      // parent node is a department but child node is a team
	      return this.isChat ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_PARENT_DEPARTMENT_CHAT_OF_TEAM_HINT') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_PARENT_DEPARTMENT_CHANNEL_OF_TEAM_HINT');
	    },
	    ...ui_vue3_pinia.mapState(humanresources_companyStructure_chartStore.useChartStore, ['structureMap', 'departments'])
	  },
	  watch: {
	    chat() {
	      this.prepareAvatar();
	    }
	  },
	  created() {
	    this.prepareAvatar();
	  },
	  methods: {
	    prepareAvatar() {
	      if (this.chat.avatar) {
	        this.chat.color = humanresources_companyStructure_utils.getColorCode('whiteBase');
	      }
	      const avatarOptions = {
	        size: 32,
	        userName: this.chat.title,
	        baseColor: this.isExtranet() && !this.chat.avatar ? humanresources_companyStructure_utils.getColorCode('extranetColor') : this.chat.color,
	        events: {
	          click: () => {
	            this.onChatItemClick();
	          }
	        }
	      };
	      if (this.chat.avatar) {
	        avatarOptions.userpicPath = this.chat.avatar;
	      }
	      this.avatar = this.isChat ? new ui_avatar.AvatarRound(avatarOptions) : new ui_avatar.AvatarSquare(avatarOptions);
	    },
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    onChatItemClick() {
	      if (this.chat.hasAccess) {
	        im_public_iframe.Messenger.openChat(this.chat.dialogId);
	      }
	    },
	    isExtranet() {
	      return this.chat.isExtranet;
	    },
	    locateToOriginalDepartment() {
	      main_core_events.EventEmitter.emit(humanresources_companyStructure_orgChart.events.HR_ORG_CHART_LOCATE_TO_DEPARTMENT, {
	        nodeId: this.chat.originalNodeId
	      });
	    }
	  },
	  template: `
		<div
			:key="chat.id"
			class="hr-department-detail-content__tab-list_item-wrapper --chat"
			:class="{ '--isExtranet': isExtranet() }"
			:data-test-id="'hr-department-content_chats-tab__list_chat-item-' + chat.id"
		>
			<div
				class="hr-department-detail-content__tab-list_item-avatar-container"
				:class="{ '--not-clickable': !chat.hasAccess }"
				v-html="this.avatar.getContainer().outerHTML"
				@click="onChatItemClick"
			/>
			<div class="hr-department-detail-content__tab-list_item-text-container">
				<div class="hr-department-detail-content__tab-list_item-title-container --chat-item">
					<span
						class="hr-department-detail-content__tab-list_item-title"
						:class="{ '--not-clickable': !chat.hasAccess }"
						:data-test-id="'hr-department-content_chats-tab__list_chat-item-' + chat.id + '-title'"
						@click="onChatItemClick"
					>{{ chat.title }}</span>
					<ResponsiveHint 
						v-if="!chat.hasAccess || chat.originalNodeId" 
						:content="lockHint" 
						:extraClasses="{ 'hr-department-detail-content__tab-list_hint-container': true }"
					>
						<span class="ui-icon-set --lock hr-department-detail-content__tab-list_lock-icon"></span>
					</ResponsiveHint>
				</div>
				<div v-if="chat.originalNodeId && originalNodeName" class="hr-department-detail-content__tab-list_item-subtitle --chat-item">
					{{ indirectChatSubtitle }}
					<ResponsiveHint 
						:content="originalNodeName" 
						defaultClass="hr-department-detail-content__tab-list_orig-node-name"
						:checkScrollWidth="true"
						:width="null"
						@click="locateToOriginalDepartment"
					>
						{{ originalNodeName }}
					</ResponsiveHint>
				</div>
				<div v-else-if="chat.originalNodeId" class="hr-department-detail-content__tab-list_item-subtitle --chat-item">
					{{ indirectChatSubtitle }}
					<span class="hr-department-detail-content__tab-list_orig-node-hidden-name">
						{{ hiddenNodeName }}
					</span>
				</div>
				<div v-else class="hr-department-detail-content__tab-list_item-subtitle">
					{{ chat.subtitle }}
				</div>
			</div>
			<ChatListItemActionButton
				:chat="chat"
				:nodeId="nodeId"
			/>
		</div>
	`
	};

	const ChatsTab = {
	  name: 'chatsTab',
	  components: {
	    SearchInput,
	    TabList,
	    EmptyState,
	    EmptyTabAddButtons,
	    ChatListItem,
	    ManagementDialog: humanresources_companyStructure_structureComponents.ManagementDialog,
	    ChildrenModeSelector
	  },
	  data() {
	    return {
	      isChatLinkActive: false,
	      chatLinkDialogVisible: false,
	      isChannelLinkActive: false,
	      channelLinkDialogVisible: false,
	      isLoading: false,
	      searchQuery: '',
	      addChatsWithChildren: false,
	      addChannelsWithChildren: false
	    };
	  },
	  created() {
	    this.loadChatAction();
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    locPlural(phraseCode, count) {
	      return main_core.Loc.getMessagePlural(phraseCode, count, {
	        '#COUNT#': count
	      });
	    },
	    searchChatOrChannel(searchQuery) {
	      this.searchQuery = searchQuery;
	    },
	    async loadChatAction(force) {
	      var _loadedChatsAndChanne, _loadedChatsAndChanne2, _loadedChatsAndChanne3, _loadedChatsAndChanne4;
	      if (this.isLoading) {
	        return null;
	      }
	      const nodeId = this.focusedNode;
	      const department = this.departments.get(nodeId);
	      if (!department) {
	        return null;
	      }
	      if (!force && main_core.Type.isArray(department.chatsDetailed) && main_core.Type.isArray(department.channelsDetailed)) {
	        return {
	          chats: department.chatsDetailed,
	          channels: department.channelsDetailed,
	          chatsNoAccess: department.chatsNoAccess,
	          channelsNoAccess: department.channelsNoAccess
	        };
	      }
	      this.isLoading = true;
	      this.$emit('showDetailLoader');
	      const loadedChatsAndChannels = await DepartmentAPI.getChatsAndChannels(nodeId);
	      DepartmentContentActions.setChatsAndChannels(nodeId, (_loadedChatsAndChanne = loadedChatsAndChannels.chats) != null ? _loadedChatsAndChanne : [], (_loadedChatsAndChanne2 = loadedChatsAndChannels.channels) != null ? _loadedChatsAndChanne2 : [], (_loadedChatsAndChanne3 = loadedChatsAndChannels.chatsNoAccess) != null ? _loadedChatsAndChanne3 : 0, (_loadedChatsAndChanne4 = loadedChatsAndChannels.channelsNoAccess) != null ? _loadedChatsAndChanne4 : 0);
	      this.$emit('hideDetailLoader');
	      this.isLoading = false;
	      return loadedChatsAndChannels;
	    },
	    getChatListMenuItems() {
	      return this.canEdit ? [ChatsMenuLinkChat] : [];
	    },
	    getChannelListMenuItems() {
	      return this.canEdit ? [ChatsMenuLinkChannel] : [];
	    },
	    onActionMenuItemClick(actionId) {
	      if (actionId === ChatsMenuOption.linkChat) {
	        this.chatLinkDialogVisible = true;
	      }
	      if (actionId === ChatsMenuOption.linkChannel) {
	        this.channelLinkDialogVisible = true;
	      }
	    },
	    getAddEmptyStateList() {
	      let stateArray = [];
	      if (this.isTeamEntity) {
	        stateArray = [this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_TAB_ADD_EMPTY_STATE_TEAM_LIST_ITEM_1_MSGVER_1'), this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_TAB_ADD_EMPTY_STATE_LIST_ITEM_2'), this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_TAB_ADD_EMPTY_STATE_TEAM_LIST_ITEM_3')];
	      } else {
	        stateArray = [this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_TAB_ADD_EMPTY_STATE_LIST_ITEM_1_MSGVER_1'), this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_TAB_ADD_EMPTY_STATE_LIST_ITEM_2'), this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_TAB_ADD_EMPTY_STATE_LIST_ITEM_3')];
	      }
	      return stateArray.map(item => ({
	        text: item
	      }));
	    },
	    getChatListDataTestIds() {
	      return ChatListDataTestIds;
	    },
	    getChannelListDataTestIds() {
	      return ChannelListDataTestIds;
	    },
	    getChatLinkDialogEntities() {
	      const entity = humanresources_companyStructure_structureComponents.getChatDialogEntity();
	      entity.options.excludeIds = this.chats.map(item => item.id);
	      return [entity];
	    },
	    getChannelLinkDialogEntities() {
	      const entity = humanresources_companyStructure_structureComponents.getChannelDialogEntity();
	      entity.options.excludeIds = this.channels.map(item => item.id);
	      return [entity];
	    },
	    getChatLinkRecentTabOptions() {
	      return humanresources_companyStructure_structureComponents.getCommunicationsRecentTabOptions(this.teamEntity, humanresources_companyStructure_structureComponents.CommunicationsTypeDict.chat);
	    },
	    getChannelLinkRecentTabOptions() {
	      return humanresources_companyStructure_structureComponents.getCommunicationsRecentTabOptions(this.teamEntity, humanresources_companyStructure_structureComponents.CommunicationsTypeDict.channel);
	    },
	    async linkChats(chatsItems) {
	      this.isChatLinkActive = true;
	      const chats = chatsItems.map(chatItem => Number(chatItem.id.replace('chat', '')));
	      const nodeId = this.focusedNode;
	      const ids = {
	        chat: chats,
	        withChildren: this.addChatsWithChildren
	      };
	      try {
	        await DepartmentAPI.saveChats(nodeId, ids);
	        const loadedChatsAndChannels = await this.loadChatAction(true);
	        if (this.addChatsWithChildren && loadedChatsAndChannels) {
	          const newChats = loadedChatsAndChannels.chats.filter(chat => chats.includes(chat.id));
	          if (newChats.length > 0) {
	            DepartmentContentActions.updateChatsInChildrenNodes(nodeId);
	          }
	        }
	      } catch {/* empty */}
	      this.isChatLinkActive = false;
	      this.chatLinkDialogVisible = false;
	      this.addChatsWithChildren = false;
	    },
	    async linkChannel(chatsItems) {
	      this.isChannelLinkActive = true;
	      const channels = chatsItems.map(chatItem => Number(chatItem.id.replace('chat', '')));
	      const nodeId = this.focusedNode;
	      const ids = {
	        channel: channels,
	        withChildren: this.addChannelsWithChildren
	      };
	      try {
	        await DepartmentAPI.saveChats(nodeId, ids);
	        const loadedChatsAndChannels = await this.loadChatAction(true);
	        if (this.addChannelsWithChildren && loadedChatsAndChannels) {
	          const newChannels = loadedChatsAndChannels.channels.filter(channel => channels.includes(channel.id));
	          if (newChannels.length > 0) {
	            DepartmentContentActions.updateChatsInChildrenNodes(nodeId);
	          }
	        }
	      } catch {/* empty */}
	      this.isChannelLinkActive = false;
	      this.channelLinkDialogVisible = false;
	      this.addChannelsWithChildren = false;
	    },
	    getChatLinkDialogDataTestIds() {
	      return ChatLinkDialogDataTestIds;
	    },
	    getChannelLinkDialogDataTestIds() {
	      return ChannelLinkDialogDataTestIds;
	    }
	  },
	  computed: {
	    chats() {
	      var _this$departments$get, _this$departments$get2;
	      return (_this$departments$get = (_this$departments$get2 = this.departments.get(this.focusedNode)) == null ? void 0 : _this$departments$get2.chatsDetailed) != null ? _this$departments$get : [];
	    },
	    channels() {
	      var _this$departments$get3, _this$departments$get4;
	      return (_this$departments$get3 = (_this$departments$get4 = this.departments.get(this.focusedNode)) == null ? void 0 : _this$departments$get4.channelsDetailed) != null ? _this$departments$get3 : [];
	    },
	    chatsNoAccess() {
	      var _this$departments$get5, _this$departments$get6;
	      return (_this$departments$get5 = (_this$departments$get6 = this.departments.get(this.focusedNode)) == null ? void 0 : _this$departments$get6.chatsNoAccess) != null ? _this$departments$get5 : 0;
	    },
	    channelsNoAccess() {
	      var _this$departments$get7, _this$departments$get8;
	      return (_this$departments$get7 = (_this$departments$get8 = this.departments.get(this.focusedNode)) == null ? void 0 : _this$departments$get8.channelsNoAccess) != null ? _this$departments$get7 : 0;
	    },
	    chatsNoAccessText() {
	      const phrase = this.chats.length > 0 ? 'HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_CHAT_LIST_ITEM_MORE_HIDDEN_TEXT' : 'HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_CHAT_LIST_ITEM_EMPTY_HIDDEN_TEXT';
	      return this.locPlural(phrase, this.chatsNoAccess);
	    },
	    channelsNoAccessText() {
	      const phrase = this.channels.length > 0 ? 'HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_CHANNEL_LIST_ITEM_MORE_HIDDEN_TEXT' : 'HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_CHANNEL_LIST_ITEM_EMPTY_HIDDEN_TEXT';
	      return this.locPlural(phrase, this.channelsNoAccess);
	    },
	    filteredChats() {
	      return this.chats.filter(chat => chat.title.toLowerCase().includes(this.searchQuery.toLowerCase()));
	    },
	    filteredChannels() {
	      return this.channels.filter(channel => channel.title.toLowerCase().includes(this.searchQuery.toLowerCase()));
	    },
	    showAddEmptyState() {
	      return this.chats.length === 0 && this.channels.length === 0 && this.chatsNoAccess === 0 && this.channelsNoAccess === 0;
	    },
	    showSearchEmptyState() {
	      return (this.chats.length > 0 || this.channels.length > 0) && this.filteredChats.length === 0 && this.filteredChannels.length === 0;
	    },
	    getLinkedChatIds() {
	      return this.chats.map(chatItem => `chat${chatItem.id}`);
	    },
	    getLinkedChannelIds() {
	      return this.channels.map(channelItem => `chat${channelItem.id}`);
	    },
	    isChatsLoaded() {
	      const department = this.departments.get(this.focusedNode);
	      return Boolean(main_core.Type.isArray(department.chatsDetailed) && main_core.Type.isArray(department.channelsDetailed));
	    },
	    teamEntity() {
	      var _this$departments$get9;
	      return (_this$departments$get9 = this.departments.get(this.focusedNode)) == null ? void 0 : _this$departments$get9.entityType;
	    },
	    isTeamEntity() {
	      return this.teamEntity === humanresources_companyStructure_utils.EntityTypes.team;
	    },
	    getAddEmptyStateTitle() {
	      return this.isTeamEntity ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_TAB_ADD_EMPTY_STATE_TEAM_TITLE') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_TAB_ADD_EMPTY_STATE_TITLE');
	    },
	    getAddChatDescription() {
	      return this.isTeamEntity ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHAT_LINK_DIALOG_TEAM_DESC') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHAT_LINK_DIALOG_DESC');
	    },
	    getAddChannelDescription() {
	      return this.isTeamEntity ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHANNEL_LINK_DIALOG_TEAM_DESC') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHANNEL_LINK_DIALOG_DESC');
	    },
	    chatMenuItems() {
	      return this.getChatListMenuItems();
	    },
	    channelMenuItems() {
	      return this.getChannelListMenuItems();
	    },
	    emptyChatTitle() {
	      if (this.canEdit) {
	        return this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_CHAT_LIST_ITEM_TEXT_MSGVER_1');
	      }
	      return this.isTeamEntity ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_CHAT_LIST_ITEM_NO_TEAM_TEXT_MSGVER_1') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_CHAT_LIST_ITEM_NO_DEPARTMENT_TEXT_MSGVER_1');
	    },
	    emptyChannelTitle() {
	      if (this.canEdit) {
	        return this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_CHANNEL_LIST_ITEM_TEXT_MSGVER_1');
	      }
	      return this.isTeamEntity ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_CHANNEL_LIST_ITEM_NO_TEAM_TEXT_MSGVER_1') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_EMPTY_CHANNEL_LIST_ITEM_NO_DEPARTMENT_TEXT_MSGVER_1');
	    },
	    canEdit() {
	      const permissionChecker = humanresources_companyStructure_permissionChecker.PermissionChecker.getInstance();
	      return this.isTeamEntity ? permissionChecker.hasPermission(humanresources_companyStructure_permissionChecker.PermissionActions.teamCommunicationEdit, this.focusedNode) : permissionChecker.hasPermission(humanresources_companyStructure_permissionChecker.PermissionActions.departmentCommunicationEdit, this.focusedNode);
	    },
	    getDialogExtraSubtitleLabel() {
	      return this.isTeamEntity ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_WITH_SUBTEAMS_LABEL') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_WITH_SUBDEPARTMENTS_LABEL');
	    },
	    canAddWithChildren() {
	      const permissionChecker = humanresources_companyStructure_permissionChecker.PermissionChecker.getInstance();
	      if (this.isTeamEntity) {
	        const teamTeamMinValue = {
	          TEAM: humanresources_companyStructure_permissionChecker.PermissionLevels.selfAndSub
	        };
	        const teamDepartmentMinValue = {
	          DEPARTMENT: humanresources_companyStructure_permissionChecker.PermissionLevels.selfAndSub
	        };
	        const teamAction = humanresources_companyStructure_permissionChecker.PermissionActions.teamCommunicationEdit;
	        return permissionChecker.hasPermission(teamAction, this.focusedNode, teamTeamMinValue) || permissionChecker.hasPermission(teamAction, this.focusedNode, teamDepartmentMinValue);
	      }
	      const departmentAction = humanresources_companyStructure_permissionChecker.PermissionActions.departmentCommunicationEdit;
	      return permissionChecker.hasPermission(departmentAction, this.focusedNode, humanresources_companyStructure_permissionChecker.PermissionLevels.selfAndSub);
	    },
	    hideEmptyChatItem() {
	      return this.searchQuery.length > 0 || this.chatsNoAccess > 0;
	    },
	    hideEmptyChannelItem() {
	      return this.searchQuery.length > 0 || this.channelsNoAccess > 0;
	    },
	    ...ui_vue3_pinia.mapState(humanresources_companyStructure_chartStore.useChartStore, ['focusedNode', 'departments'])
	  },
	  watch: {
	    isChatsLoaded(isChatsLoaded) {
	      if (isChatsLoaded === false) {
	        this.loadChatAction();
	      }
	    }
	  },
	  template: `
		<div class="hr-department-detail-content__tab-container --chat">
			<template v-if="!showAddEmptyState">
				<SearchInput
					:placeholder="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHAT_SEARCH_INPUT_PLACEHOLDER')"
					:value="searchQuery"
					@inputChange="searchChatOrChannel"
					dataTestId="hr-department-detail-content_chats-tab__chats-and-channels-search-input"
				/>
				<div
					v-if="!showSearchEmptyState"
					class="hr-department-detail-content__lists-container"
				>
					<TabList
						id='hr-department-detail-content_chats-tab__chat-list'
						:title="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHAT_LIST_TITLE')"
						:count="chats.length + chatsNoAccess"
						:menuItems="chatMenuItems"
						:listItems="filteredChats"
						:emptyItemTitle="emptyChatTitle"
						emptyItemImageClass="hr-department-detail-content__chat-empty-tab-list-item_tab-icon"
						:hideEmptyItem="hideEmptyChatItem"
						:withAddPermission="canEdit"
						@tabListAction="onActionMenuItemClick"
						:dataTestIds="getChatListDataTestIds()"
					>
						<template v-slot="{ item }">
							<ChatListItem :chat="item" :nodeId="focusedNode"/>
						</template>
						<template v-if="chatsNoAccess > 0" v-slot:footer>
							<div 
								class="hr-department-detail-content__tab-list_communications-hidden"
								data-test-id="hr-department-content_chats-tab__list_chat-hidden-text"
							>
								{{ chatsNoAccessText }}
							</div>
						</template>
					</TabList>
					<TabList
						id='hr-department-detail-content_chats-tab__channel-list'
						:title="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHANNEL_LIST_TITLE')"
						:count="channels.length + channelsNoAccess"
						:menuItems="channelMenuItems"
						:listItems="filteredChannels"
						:emptyItemTitle="emptyChannelTitle"
						emptyItemImageClass="hr-department-detail-content__chat-empty-tab-list-item_tab-icon"
						:hideEmptyItem="hideEmptyChannelItem"
						:withAddPermission="canEdit"
						@tabListAction="onActionMenuItemClick"
						:dataTestIds="getChannelListDataTestIds()"
					>
						<template v-slot="{ item }">
							<ChatListItem :chat="item" :nodeId="focusedNode"/>
						</template>
						<template v-if="channelsNoAccess > 0" v-slot:footer>
							<div
								class="hr-department-detail-content__tab-list_communications-hidden"
								data-test-id="hr-department-content_chats-tab__list_channel-hidden-text"
							>
								{{ channelsNoAccessText }}
							</div>
						</template>
					</TabList>
				</div>
				<EmptyState 
					v-else
					imageClass="hr-department-detail-content__chat-empty-tab-search_tab-icon"
					:title="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_EMPTY_SEARCHED_EMPLOYEES_TITLE')"
					:description ="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_EMPTY_SEARCHED_EMPLOYEES_SUBTITLE')"
				/>
			</template>
			<EmptyState 
				v-else
				imageClass="hr-department-detail-content__chat-empty-tab-add_tab-icon"
				:title="getAddEmptyStateTitle"
				:list="getAddEmptyStateList()"
			>
				<template v-slot:content>
					<EmptyTabAddButtons
						@emptyStateAddAction="onActionMenuItemClick"
					/>
				</template>
			</EmptyState>
			<ManagementDialog
				v-if="chatLinkDialogVisible"
				id="hr-department-detail-content-chats-tab-chat-link-dialog"
				:entities="getChatLinkDialogEntities()"
				:recentTabOptions="getChatLinkRecentTabOptions()"
				:hiddenItemsIds="getLinkedChatIds"
				:title="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHAT_LINK_DIALOG_TITLE')"
				:description="getAddChatDescription"
				:isActive="isChatLinkActive"
				@managementDialogAction="linkChats"
				@close="chatLinkDialogVisible = false"
				:dataTestIds="getChatLinkDialogDataTestIds()"
			>
				<template v-slot:extra-subtitle>
					<ChildrenModeSelector
						:isTeamEntity="isTeamEntity"
						:data-test-id="getChatLinkDialogDataTestIds().addWithChildrenDataTestId"
						:hasPermission="canAddWithChildren"
						:text="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_MODE_CHATS_TEXT')"
						@saveChildrenMode="addChatsWithChildren = $event"
					/>
				</template>
			</ManagementDialog>
			<ManagementDialog
				v-if="channelLinkDialogVisible"
				id="hr-department-detail-content-chats-tab-channel-link-dialog"
				:entities="getChannelLinkDialogEntities()"
				:recentTabOptions="getChannelLinkRecentTabOptions()"
				:hiddenItemsIds="getLinkedChannelIds"
				:title="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_CHANNEL_LINK_DIALOG_TITLE')"
				:description="getAddChannelDescription"
				:isActive="isChannelLinkActive"
				@managementDialogAction="linkChannel"
				@close="channelLinkDialogVisible = false"
				:dataTestIds="getChannelLinkDialogDataTestIds()"
			>
				<template v-slot:extra-subtitle>
					<ChildrenModeSelector
						:isTeamEntity="isTeamEntity"
						:data-test-id="getChatLinkDialogDataTestIds().addWithChildrenDataTestId"
						:hasPermission="canAddWithChildren"
						:text="loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_MODE_CHANNELS_TEXT')"
						@saveChildrenMode="addChannelsWithChildren = $event"
					/>
				</template>
			</ManagementDialog>
		</div>
	`
	};

	// @vue/component
	const DepartmentContent = {
	  name: 'departmentContent',
	  components: {
	    UsersTab,
	    ChatsTab
	  },
	  props: {
	    isCollapsed: Boolean
	  },
	  emits: ['showDetailLoader', 'hideDetailLoader', 'editEmployee'],
	  data() {
	    return {
	      activeTab: 'usersTab',
	      tabs: [{
	        name: 'usersTab',
	        component: 'UsersTab',
	        id: 'users-tab'
	      }, {
	        name: 'chatsTab',
	        component: 'ChatsTab',
	        id: 'chats-tab'
	      }],
	      isDescriptionOverflowed: false,
	      isDescriptionExpanded: false
	    };
	  },
	  computed: {
	    ...ui_vue3_pinia.mapState(humanresources_companyStructure_chartStore.useChartStore, ['focusedNode', 'departments']),
	    activeTabComponent() {
	      const activeTab = this.tabs.find(tab => tab.name === this.activeTab);
	      return activeTab ? activeTab.component : null;
	    },
	    usersCount() {
	      var _this$departments$get, _this$departments$get2;
	      return (_this$departments$get = (_this$departments$get2 = this.departments.get(this.focusedNode)) == null ? void 0 : _this$departments$get2.userCount) != null ? _this$departments$get : 0;
	    },
	    chatAndChannelsCount() {
	      var _this$departments$get3, _this$departments$get4;
	      return (_this$departments$get3 = (_this$departments$get4 = this.departments.get(this.focusedNode)) == null ? void 0 : _this$departments$get4.chatAndChannelsCount) != null ? _this$departments$get3 : null;
	    },
	    tabArray() {
	      return this.tabs.map(tab => {
	        if (tab.name === 'usersTab') {
	          return {
	            ...tab,
	            count: this.usersCount
	          };
	        }
	        if (tab.name === 'chatsTab') {
	          return {
	            ...tab,
	            count: this.chatAndChannelsCount
	          };
	        }
	        return tab;
	      });
	    },
	    description() {
	      const department = this.departments.get(this.focusedNode);
	      if (!department.description) {
	        return null;
	      }
	      return department.description;
	    },
	    isTeamEntity() {
	      var _this$departments$get5;
	      return ((_this$departments$get5 = this.departments.get(this.focusedNode)) == null ? void 0 : _this$departments$get5.entityType) === humanresources_companyStructure_utils.EntityTypes.team;
	    }
	  },
	  watch: {
	    description() {
	      this.$nextTick(() => {
	        this.isDescriptionOverflowed = this.checkDescriptionOverflowed();
	      });
	    },
	    focusedNode() {
	      this.isDescriptionExpanded = false;
	      this.selectTab('usersTab');
	    },
	    isCollapsed() {
	      this.$nextTick(() => {
	        this.isDescriptionOverflowed = this.checkDescriptionOverflowed();
	      });
	    }
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    selectTab(tabName) {
	      if (this.isTabDisabled(tabName)) {
	        return;
	      }
	      this.activeTab = tabName;
	    },
	    getTabLabel(name) {
	      if (name === 'usersTab') {
	        return this.isTeamEntity ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_TEAM_USERS_TITLE') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_USERS_TITLE');
	      }
	      if (name === 'chatsTab') {
	        return this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_CONTENT_TAB_CHATS_TITLE');
	      }
	      return '';
	    },
	    toggleDescriptionExpand() {
	      this.isDescriptionExpanded = !this.isDescriptionExpanded;
	    },
	    checkDescriptionOverflowed() {
	      var _this$$refs$descripti;
	      const descriptionContainer = (_this$$refs$descripti = this.$refs.descriptionContainer) != null ? _this$$refs$descripti : null;
	      if (descriptionContainer) {
	        return descriptionContainer.scrollHeight > descriptionContainer.clientHeight;
	      }
	      return false;
	    },
	    hideDetailLoader() {
	      this.$emit('hideDetailLoader');
	      this.$nextTick(() => {
	        this.isDescriptionOverflowed = this.checkDescriptionOverflowed();
	      });
	    },
	    isTabDisabled(tabName) {
	      if (tabName === 'chatsTab' && this.tabArray.find(tab => tab.name === tabName).count === 0) {
	        const permissionChecker = humanresources_companyStructure_permissionChecker.PermissionChecker.getInstance();
	        const canEditChats = this.isTeamEntity ? permissionChecker.hasPermission(humanresources_companyStructure_permissionChecker.PermissionActions.teamCommunicationEdit, this.focusedNode) : permissionChecker.hasPermission(humanresources_companyStructure_permissionChecker.PermissionActions.departmentCommunicationEdit, this.focusedNode);
	        if (!canEditChats) {
	          return true;
	        }
	      }
	      return false;
	    }
	  },
	  template: `
		<div class="hr-department-detail-content hr-department-detail-content__scope">
			<div
				ref="descriptionContainer"
				v-show="description"
				:class="[
					'hr-department-detail-content-description',
					{ '--expanded': isDescriptionExpanded },
					{ '--overflowed': isDescriptionOverflowed},
				]"
				v-on="isDescriptionOverflowed ? { click: toggleDescriptionExpand } : {}"
			>
				{{ description }}
			</div>
			<div class="hr-department-detail-content__tab-list">
				<button
					v-for="tab in tabArray"
					:key="tab.name"
					class="hr-department-detail-content__tab-item"
					:class="[{'--active-tab' : activeTab === tab.name, '--disabled-tab': isTabDisabled(tab.name)}]"
					@click="selectTab(tab.name)"
					:data-id="tab.id ? 'hr-department-detail-content__' + tab.id + '_button' : null"
				>
					{{ this.getTabLabel(tab.name) }}
					<span
						class="hr-department-detail-content__tab-count"
						:data-id="tab.id ? 'hr-department-detail-content__' + tab.id + '_counter' : null"
					>{{ tab.count }}
					</span>
				</button>
			</div>
			<UsersTab
				v-show="activeTab === 'usersTab'"
				@showDetailLoader="$emit('showDetailLoader')"
				@hideDetailLoader="hideDetailLoader"
			/>
			<ChatsTab
				v-show="activeTab === 'chatsTab'"
				:is="activeTabComponent"
				@showDetailLoader="$emit('showDetailLoader')"
				@hideDetailLoader="hideDetailLoader"
			/>
		</div>
	`
	};

	exports.DepartmentContent = DepartmentContent;
	exports.DepartmentContentActions = DepartmentContentActions;

}((this.BX.Humanresources.CompanyStructure = this.BX.Humanresources.CompanyStructure || {}),BX.Humanresources.CompanyStructure,BX,BX.Humanresources.CompanyStructure,BX.UI.EntitySelector,BX.UI,BX.UI,BX.Humanresources.CompanyStructure,BX.UI.IconSet,BX,BX.Event,BX.UI,BX.Humanresources.CompanyStructure,BX.Humanresources.CompanyStructure,BX,BX.Messenger.v2.Lib,BX.Humanresources.CompanyStructure,BX,BX.Humanresources.CompanyStructure,BX.Vue3.Pinia));
//# sourceMappingURL=department-content.bundle.js.map
