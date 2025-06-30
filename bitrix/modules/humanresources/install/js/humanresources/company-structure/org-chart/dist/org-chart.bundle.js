/* eslint-disable */
this.BX = this.BX || {};
this.BX.Humanresources = this.BX.Humanresources || {};
(function (exports,ui_vue3,ui_confetti,ui_canvas,ui_entitySelector,ui_dialogs_messagebox,ui_notification,humanresources_companyStructure_userManagementDialog,ui_vue3_pinia,humanresources_companyStructure_departmentContent,humanresources_companyStructure_api,humanresources_companyStructure_structureComponents,ui_iconSet_main,ui_iconSet_crm,ui_buttons,ui_forms,ui_iconSet_api_vue,humanresources_companyStructure_chartStore,humanresources_companyStructure_chartWizard,ui_analytics,ui_designTokens,humanresources_companyStructure_permissionChecker,humanresources_companyStructure_utils,ui_iconSet_api_core,main_core_events,main_core) {
	'use strict';

	const events = Object.freeze({
	  HR_DEPARTMENT_CONNECT: 'hr-department-connect',
	  HR_DEPARTMENT_DISCONNECT: 'hr-department-disconnect',
	  HR_DEPARTMENT_ADAPT_SIBLINGS: 'hr-department-adapt-siblings',
	  HR_DEPARTMENT_ADAPT_CONNECTOR_HEIGHT: 'hr-department-adapt-connector-height',
	  HR_DEPARTMENT_FOCUS: 'hr-department-focus',
	  HR_DEPARTMENT_CONTROL: 'hr-department-control',
	  HR_DEPARTMENT_MENU_CLOSE: 'hr-department-menu-close',
	  HR_ORG_CHART_CLOSE_BY_ESC: 'SidePanel.Slider:onCloseByEsc',
	  HR_ORG_CHART_CLOSE: 'SidePanel.Slider:onClose',
	  HR_FIRST_POPUP_SHOW: 'HR.company-structure:first-popup-showed',
	  HR_DRAG_DEPARTMENT: 'hr-drag-department',
	  HR_DROP_DEPARTMENT: 'hr-drop-department',
	  HR_DEPARTMENT_TOGGLE_CONNECTORS: 'hr-department-toggle-connectors',
	  HR_DEPARTMENT_SLIDER_ON_MESSAGE: 'SidePanel.Slider:onMessage',
	  HR_ENTITY_SHOW_WIZARD: 'hr-entity-show-wizard',
	  HR_ENTITY_REMOVE: 'hr-entity-remove',
	  HR_PUBLIC_FOCUS_NODE: 'HumanResources.CompanyStructure:focusNode',
	  INTRANET_USER_MINIPROFILE_CLOSE: 'Intranet.User.MiniProfile:close'
	});
	const detailPanelWidth = 364;

	const MenuOption = Object.freeze({
	  addDepartment: 'add-department',
	  addEmployee: 'add-employee'
	});

	// @vue/component
	const AddButton = {
	  name: 'AddButton',
	  components: {
	    RouteActionMenu: humanresources_companyStructure_structureComponents.RouteActionMenu
	  },
	  emits: ['addDepartment'],
	  data() {
	    return {
	      actionMenu: {
	        visible: false
	      }
	    };
	  },
	  computed: {
	    MenuOption() {
	      return MenuOption;
	    }
	  },
	  mounted() {
	    const permissionChecker = humanresources_companyStructure_permissionChecker.PermissionChecker.getInstance();
	    if (!permissionChecker) {
	      return;
	    }
	    this.dropdownItems = [{
	      id: MenuOption.addDepartment,
	      title: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_ADD_BUTTON_MENU_ADD_DEPARTMENT_TITLE'),
	      description: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_ADD_BUTTON_MENU_ADD_DEPARTMENT_DESCR'),
	      bIcon: {
	        name: ui_iconSet_api_core.Main.CUBE_PLUS,
	        size: 20,
	        color: humanresources_companyStructure_utils.getColorCode('paletteBlue50')
	      },
	      permission: {
	        action: humanresources_companyStructure_permissionChecker.PermissionActions.departmentCreate
	      }
	    }, {
	      id: MenuOption.addEmployee,
	      title: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_ADD_BUTTON_MENU_ADD_EMPLOYEE_TITLE'),
	      description: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_ADD_BUTTON_MENU_ADD_EMPLOYEE_DESCR'),
	      bIcon: {
	        name: ui_iconSet_api_core.CRM.PERSON_PLUS_2,
	        size: 20,
	        color: humanresources_companyStructure_utils.getColorCode('paletteBlue50')
	      },
	      permission: {
	        action: humanresources_companyStructure_permissionChecker.PermissionActions.employeeAddToDepartment
	      }
	    }];
	    this.dropdownItems = this.dropdownItems.filter(item => {
	      if (!item.permission) {
	        return false;
	      }
	      return permissionChecker.hasPermissionOfAction(item.permission.action);
	    });
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    addDepartment() {
	      this.$emit('addDepartment');
	    },
	    actionMenuItemClickHandler(actionId) {
	      if (actionId === MenuOption.addDepartment) {
	        this.$emit('addDepartment');
	      }
	    }
	  },
	  template: `
		<div
			class="ui-btn ui-btn-success ui-btn-round ui-btn-sm humanresources-title-panel__add-button"
			data-test-id="hr-org-chart_title-panel__add-button"
			@click="addDepartment"
		>
			{{ loc('HUMANRESOURCES_COMPANY_STRUCTURE_ADD_BUTTON') }}
		</div>
	`
	};

	const OrgChartActions = {
	  applyData: (departments, currentDepartments, userId) => {
	    const store = humanresources_companyStructure_chartStore.useChartStore();
	    store.$patch({
	      departments,
	      currentDepartments,
	      userId,
	      searchedUserId: userId
	    });
	  },
	  focusDepartment: departmentId => {
	    const store = humanresources_companyStructure_chartStore.useChartStore();
	    store.focusedNode = departmentId;
	  },
	  searchUserInDepartment: userId => {
	    const store = humanresources_companyStructure_chartStore.useChartStore();
	    store.searchedUserId = userId;
	  },
	  moveSubordinatesToParent: removableDepartmentId => {
	    const store = humanresources_companyStructure_chartStore.useChartStore();
	    const {
	      departments,
	      currentDepartments
	    } = store;
	    const removableDepartment = departments.get(removableDepartmentId);
	    const {
	      parentId,
	      entityType,
	      children: removableDeparmentChildren = [],
	      userCount: removableDepartmentUserCount,
	      heads: removableDeparmentHeads,
	      employees: removableDeparmentEmployees = []
	    } = removableDepartment;
	    const parentDepartment = departments.get(parentId);
	    removableDeparmentChildren.forEach(childId => {
	      const department = departments.get(childId);
	      department.parentId = parentId;
	    });
	    if (removableDepartmentUserCount > 0 && entityType === humanresources_companyStructure_utils.EntityTypes.department) {
	      var _parentDepartment$emp, _parentDepartment$emp2;
	      const parentDepartmentUsersIds = new Set([...parentDepartment.heads, ...((_parentDepartment$emp = parentDepartment.employees) != null ? _parentDepartment$emp : [])].map(user => user.id));
	      const removableDeparmentUsers = [...removableDeparmentHeads, ...removableDeparmentEmployees];
	      const movableUsers = removableDeparmentUsers.filter(user => {
	        return !parentDepartmentUsersIds.has(user.id);
	      });
	      for (const user of movableUsers) {
	        user.role = humanresources_companyStructure_api.memberRoles.employee;
	      }
	      parentDepartment.userCount += movableUsers.length;
	      parentDepartment.employees = [...((_parentDepartment$emp2 = parentDepartment.employees) != null ? _parentDepartment$emp2 : []), ...movableUsers];
	    }
	    parentDepartment.children = [...parentDepartment.children, ...removableDeparmentChildren];
	    if (currentDepartments.includes(removableDepartmentId) && entityType === humanresources_companyStructure_utils.EntityTypes.department) {
	      store.changeCurrentDepartment(removableDepartmentId, parentId);
	    }
	  },
	  markDepartmentAsRemoved: removableDepartmentId => {
	    const {
	      departments
	    } = humanresources_companyStructure_chartStore.useChartStore();
	    const removableDepartment = departments.get(removableDepartmentId);
	    const {
	      parentId
	    } = removableDepartment;
	    const parentDepartment = departments.get(parentId);
	    parentDepartment.children = parentDepartment.children.filter(childId => {
	      return childId !== removableDepartmentId;
	    });
	    delete removableDepartment.parentId;
	    departments.set(removableDepartmentId, {
	      ...removableDepartment,
	      prevParentId: parentId
	    });
	  },
	  removeDepartment: departmentId => {
	    const {
	      departments
	    } = humanresources_companyStructure_chartStore.useChartStore();
	    departments.delete(departmentId);
	  },
	  inviteUser: userData => {
	    const {
	      nodeId,
	      ...restData
	    } = userData;
	    const {
	      departments
	    } = humanresources_companyStructure_chartStore.useChartStore();
	    const department = departments.get(nodeId);
	    if (department.employees) {
	      departments.set(nodeId, {
	        ...department,
	        employees: [...department.employees, {
	          ...restData
	        }],
	        userCount: department.userCount + 1
	      });
	    }
	  },
	  orderDepartments: async (draggedId, targetId, direction, count) => {
	    const {
	      departments
	    } = humanresources_companyStructure_chartStore.useChartStore();
	    const department = departments.get(draggedId);
	    const {
	      parentId
	    } = department;
	    const parentDepartment = departments.get(parentId);
	    const {
	      children
	    } = parentDepartment;
	    const targetIndex = children.indexOf(targetId);
	    const newChildren = children.filter(childId => childId !== draggedId);
	    newChildren.splice(targetIndex, 0, draggedId);
	    departments.set(parentId, {
	      ...parentDepartment,
	      children: newChildren
	    });
	    try {
	      await humanresources_companyStructure_api.postData('humanresources.api.Structure.Node.changeOrder', {
	        nodeId: draggedId,
	        direction,
	        count
	      });
	      return true;
	    } catch {
	      departments.set(parentId, {
	        ...parentDepartment,
	        children
	      });
	      return false;
	    }
	  },
	  clearNodesChatLists: nodeIds => {
	    const {
	      departments
	    } = humanresources_companyStructure_chartStore.useChartStore();
	    nodeIds.forEach(nodeId => {
	      const department = departments.get(nodeId);
	      departments.set(nodeId, {
	        ...department,
	        chats: null,
	        channels: null
	      });
	    });
	  }
	};

	// @vue/component
	const SearchBar = {
	  name: 'search-bar',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  directives: {
	    focus: {
	      mounted(el) {
	        el.focus();
	      }
	    }
	  },
	  emits: ['locate'],
	  data() {
	    return {
	      canEditPermissions: false,
	      showSearchBar: false
	    };
	  },
	  computed: {
	    set() {
	      return ui_iconSet_api_vue.Set;
	    },
	    ...ui_vue3_pinia.mapState(humanresources_companyStructure_chartStore.useChartStore, ['departments'])
	  },
	  watch: {
	    departments: {
	      handler() {
	        this.searchDialog.destroy();
	      },
	      deep: true
	    }
	  },
	  created() {
	    this.searchDialog = this.getSearchDialog();
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    showSearchbar() {
	      if (this.showSearchBar) {
	        this.showSearchBar = false;
	        return;
	      }
	      ui_analytics.sendData({
	        tool: 'structure',
	        category: 'structure',
	        event: 'search'
	      });
	      this.showSearchBar = true;
	    },
	    hideSearchbar() {
	      this.showSearchBar = false;
	    },
	    getSearchDialog() {
	      const dialog = new ui_entitySelector.Dialog({
	        width: 425,
	        height: 320,
	        multiple: false,
	        entities: [{
	          id: 'user',
	          searchFields: [{
	            name: 'supertitle',
	            type: 'string',
	            system: true,
	            searchable: true
	          }, {
	            name: 'position',
	            type: 'string'
	          }],
	          options: {
	            intranetUsersOnly: true,
	            emailUsers: false,
	            inviteEmployeeLink: false
	          }
	        }, {
	          id: 'structure-node',
	          options: {
	            selectMode: 'departmentsOnly',
	            useMultipleTabs: true,
	            restricted: 'view',
	            flatMode: true,
	            includedNodeEntityTypes: ['department', 'team']
	          }
	        }],
	        recentTabOptions: {
	          id: 'recents',
	          visible: true
	        },
	        dropdownMode: true,
	        enableSearch: false,
	        hideOnDeselect: false,
	        context: 'HR_STRUCTURE',
	        events: {
	          'Item:onSelect': event => {
	            const item = event.getData().item;
	            if (item.entityType === 'employee') {
	              this.$emit('locate', item.customData.get('nodeId'));
	              OrgChartActions.searchUserInDepartment(item.id);
	              dialog.recentItemsToSave.push(item);
	              dialog.saveRecentItems();
	              return;
	            }
	            dialog.recentItemsToSave.push(item);
	            dialog.saveRecentItems();
	            this.$emit('locate', item.id);
	          },
	          onLoad: event => {
	            var _event$target$items$g;
	            (_event$target$items$g = event.target.items.get('user')) == null ? void 0 : _event$target$items$g.forEach(item => {
	              if (!item.getSubtitle()) {
	                item.setSubtitle(item.customData.get('position'));
	              }
	            });
	          },
	          'SearchTab:onLoad': event => {
	            var _event$target$items$g2;
	            (_event$target$items$g2 = event.target.items.get('user')) == null ? void 0 : _event$target$items$g2.forEach(item => {
	              if (!item.getSubtitle()) {
	                item.setSubtitle(item.customData.get('position'));
	              }
	            });
	          },
	          onDestroy: () => {
	            this.searchDialog = this.getSearchDialog();
	          }
	        }
	      });
	      const dialogContainer = dialog.getContainer();
	      main_core.Dom.attr(dialogContainer, 'data-test-id', 'hr-org-chart_title-panel__search-dialog-container');
	      return dialog;
	    },
	    onEnter() {
	      if (this.$refs.searchName) {
	        this.searchDialog.setTargetNode(this.$refs.searchName);
	        if (!this.searchDialog.isOpen()) {
	          this.searchDialog.show();
	        }
	        main_core.Event.bind(window, 'mousedown', this.handleClickOutside);
	      }
	    },
	    handleClickOutside(event) {
	      if (this.$refs.searchName && !this.$refs.searchName.parentElement.contains(event.target) && !this.searchDialog.isOpen()) {
	        this.clearSearch();
	        this.hideSearchbar();
	        main_core.Event.unbind(window, 'mousedown', this.handleClickOutside);
	      }
	    },
	    search(value) {
	      if (!this.searchDialog.isOpen()) {
	        this.searchDialog.show();
	      }
	      this.searchDialog.search(value);
	    },
	    clearSearch() {
	      this.searchDialog.getSearchTab().clearResults();
	      this.searchDialog.selectTab('recents');
	      if (this.$refs.searchName) {
	        this.$refs.searchName.value = '';
	        this.$refs.searchName.focus();
	      }
	    }
	  },
	  template: `
		<div
		    class="humanresources-title-panel-search-bar-container"
		    :class="{'--opened': showSearchBar}"
		>
		  <div
		      class="humanresources-title-panel-search-bar-block__search"
		      @click="showSearchbar"
				data-test-id="hr-org-chart_title-panel__search-bar-button"
		  >
		    <BIcon :name="set.SEARCH_2" :size="24" class="hr-title-search-icon"></BIcon>
		  </div>
		  <transition name="humanresources-title-panel-search-bar-fade" mode="in-out" @after-enter="onEnter">
		    <div v-if="showSearchBar"
		         class="humanresources-title-panel-search-bar-block__search-bar"
		    >
		      <input
		          ref="searchName"
		          key="searchInput"
		          type="text"
		          :placeholder="loc('HUMANRESOURCES_SEARCH_PLACEHOLDER_MSGVER_1')"
		          v-focus
		          class="humanresources-title-panel-search-bar-block__search-input"
		          @click="onEnter"
		          @input="search($event.target.value)"
					data-test-id="hr-org-chart_title-panel__search-bar-input"
		      >
		      <div
		          key="searchReset"
		          @click="clearSearch"
		          class="humanresources-title-panel-search-bar-block__search-reset"
		      >
		        <div class="humanresources-title-panel-search-bar-block__search-cursor"></div>
		        <BIcon
		            :name="set.CROSS_CIRCLE_50"
		            :size="24"
		            color="#2FC6F6"
		        ></BIcon>
		      </div>
		    </div>
		  </transition>
		</div>
	`
	};

	const MenuOption$1 = Object.freeze({
	  accessRights: 'access-rights',
	  teamAccessRights: 'team-access-rights'
	});

	// @vue/component
	const BurgerMenuButton = {
	  name: 'BurgerMenuButton',
	  components: {
	    RouteActionMenu: humanresources_companyStructure_structureComponents.RouteActionMenu
	  },
	  data() {
	    return {
	      actionMenu: {
	        visible: false
	      }
	    };
	  },
	  mounted() {
	    const permissionChecker = humanresources_companyStructure_permissionChecker.PermissionChecker.getInstance();
	    this.dropdownItems = [{
	      id: MenuOption$1.accessRights,
	      title: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIG_PERMISSION_TITLE_MSGVER_1'),
	      description: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIG_PERMISSION_DESCR_MSGVER_1'),
	      bIcon: {
	        name: ui_iconSet_api_core.Main.PERSONS_2,
	        size: 20,
	        color: humanresources_companyStructure_utils.getColorCode('paletteBlue50')
	      },
	      dataTestId: 'hr-org-chart_title-panel__access-rights-button',
	      permission: permissionChecker.hasPermissionOfAction(humanresources_companyStructure_permissionChecker.PermissionActions.accessEdit)
	    }, {
	      id: MenuOption$1.teamAccessRights,
	      title: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIG_TEAM_PERMISSION_TITLE'),
	      description: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIG_TEAM_PERMISSION_DESCR'),
	      bIcon: {
	        name: ui_iconSet_api_core.Main.MY_PLAN,
	        size: 20,
	        color: humanresources_companyStructure_utils.getColorCode('paletteBlue50')
	      },
	      dataTestId: 'hr-org-chart_title-panel__team-access-rights-button',
	      permission: permissionChecker.hasPermissionOfAction(humanresources_companyStructure_permissionChecker.PermissionActions.teamAccessEdit)
	    }];
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    actionMenuItemClickHandler(actionId) {
	      if (actionId === MenuOption$1.accessRights) {
	        ui_analytics.sendData({
	          tool: 'structure',
	          category: 'structure',
	          event: 'open_roles'
	        });
	        BX.SidePanel.Instance.open('/hr/config/permission/', {
	          usePadding: true
	        });
	      }
	      if (actionId === MenuOption$1.teamAccessRights) {
	        ui_analytics.sendData({
	          tool: 'structure',
	          category: 'structure',
	          event: 'open_roles'
	        });
	        BX.SidePanel.Instance.open('/hr/config/permission/?category=TEAM', {
	          usePadding: true
	        });
	      }
	    }
	  },
	  template: `
		<span
			ref="burgerMenuButton"
			@click="actionMenu.visible = true"
			class="humanresources-title-panel__burger-menu-button"
			data-test-id="hr-org-chart_title-panel__burger-menu-button"
		>
			<svg
				viewBox="0 0 24 24"
				fill="none"
				class="humanresources-title-panel__icon"
				:class="{'--selected': actionMenu.visible }"
				>
					<path fill-rule="evenodd" clip-rule="evenodd" d="M18.7067 15.5577C18.8172 15.5577 18.9067 15.6473 18.9067 15.7577L18.9067 17.2424C18.9067 17.3528 18.8172 17.4424 18.7067 17.4424H5.29375C5.1833 17.4424 5.09375 17.3528 5.09375 17.2424L5.09379 15.7577C5.09379 15.6473 5.18333 15.5577 5.29379 15.5577H18.7067ZM18.7067 11.5577C18.8172 11.5577 18.9067 11.6473 18.9067 11.7577L18.9067 13.2424C18.9067 13.3528 18.8172 13.4424 18.7067 13.4424H5.29375C5.1833 13.4424 5.09375 13.3528 5.09375 13.2424L5.09379 11.7577C5.09379 11.6473 5.18333 11.5577 5.29379 11.5577H18.7067ZM18.7067 7.55774C18.8172 7.55774 18.9067 7.64729 18.9067 7.75774L18.9067 9.24238C18.9067 9.35284 18.8172 9.44238 18.7067 9.44238H5.29375C5.1833 9.44238 5.09375 9.35283 5.09375 9.24237L5.09379 7.75773C5.09379 7.64728 5.18333 7.55774 5.29379 7.55774H18.7067Z" fill="#959ca4"/>
			</svg>
		 </span>
		<RouteActionMenu
			v-if="actionMenu.visible"
			id="title-panel-burger-menu"
			:items="dropdownItems.filter(item => item.permission)"
			:bindElement="this.$refs.burgerMenuButton"
			@action="actionMenuItemClickHandler($event)"
			@close="this.actionMenu.visible = false"
			containerDataTestId="hr-org-chart_title-panel__burger-menu-container"
		/>
	`
	};

	const TitlePanel = {
	  components: {
	    AddButton,
	    BurgerMenuButton,
	    SearchBar,
	    BIcon: ui_iconSet_api_vue.BIcon,
	    Set: ui_iconSet_api_vue.Set
	  },
	  data() {
	    return {
	      canEditPermissions: false,
	      canAddNode: false,
	      toolbarStarActive: false,
	      isHovered: false
	    };
	  },
	  created() {
	    this.toolbarStarElement = document.getElementById('uiToolbarStar');
	  },
	  mounted() {
	    try {
	      const permissionChecker = humanresources_companyStructure_permissionChecker.PermissionChecker.getInstance();
	      this.canEditPermissions = permissionChecker && (permissionChecker.hasPermissionOfAction(humanresources_companyStructure_permissionChecker.PermissionActions.accessEdit) || permissionChecker.hasPermissionOfAction(humanresources_companyStructure_permissionChecker.PermissionActions.teamAccessEdit));
	      this.canAddNode = permissionChecker && (permissionChecker.hasPermissionWithAnyNode(humanresources_companyStructure_permissionChecker.PermissionActions.departmentCreate) || permissionChecker.hasPermissionWithAnyNode(humanresources_companyStructure_permissionChecker.PermissionActions.teamCreate));
	    } catch (error) {
	      console.error('Failed to fetch data:', error);
	    }
	    const observer = new MutationObserver(() => {
	      this.toolbarStarActive = main_core.Dom.hasClass(this.toolbarStarElement, 'ui-toolbar-star-active');
	    });
	    observer.observe(this.toolbarStarElement, {
	      attributes: true,
	      attributeFilter: ['class']
	    });
	    this.toolbarStarActive = main_core.Dom.hasClass(this.toolbarStarElement, 'ui-toolbar-star-active');
	  },
	  name: 'title-panel',
	  emits: ['showWizard', 'locate'],
	  computed: {
	    set() {
	      return ui_iconSet_api_vue.Set;
	    },
	    toolbarStarIcon() {
	      if (this.isAirTemplate) {
	        return null;
	      }
	      if (this.isHovered || this.toolbarStarActive) {
	        return this.set.FAVORITE_1;
	      }
	      return this.set.FAVORITE_0;
	    },
	    isAirTemplate() {
	      return BX.Reflection.getClass('top.BX.Intranet.Bitrix24.Template') !== null;
	    },
	    toolbarClassIcon() {
	      if (!this.isAirTemplate) {
	        return 'humanresources-title-panel__star';
	      }
	      return this.toolbarStarActive ? 'humanresources-title-panel__unpin' : 'humanresources-title-panel__pin';
	    }
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    addDepartment() {
	      this.$emit('showWizard', {
	        source: humanresources_companyStructure_api.AnalyticsSourceType.HEADER
	      });
	    },
	    onLocate(nodeId) {
	      this.$emit('locate', nodeId);
	    },
	    triggerFavoriteStar() {
	      this.toolbarStarElement.click();
	      ui_notification.UI.Notification.Center.notify({
	        content: this.toolbarStarActive ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_LEFT_MENU_UN_SAVED') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_LEFT_MENU_SAVED'),
	        autoHideDelay: 2000
	      });
	    }
	  },
	  template: `
		<div class="humanresources-title-panel">
			<p class="humanresources-title-panel__title">
				{{ loc('HUMANRESOURCES_COMPANY_STRUCTURE_TITLE') }}
			</p>
			<BIcon
				:name="toolbarStarIcon"
				:size="24"
				color="rgba(149, 156, 164, 1)"
				:class="toolbarClassIcon"
				@mouseover="isHovered = true"
				@mouseleave="isHovered = false" @click="triggerFavoriteStar"
			></BIcon>
			<AddButton
				v-if="canAddNode"
				@addDepartment="addDepartment"
			/>
			<div class="humanresources-title-panel__icon-buttons">
				<BurgerMenuButton v-if="canEditPermissions"/>
				<SearchBar @locate="onLocate"/>
			</div>
		</div>
	`
	};

	const UrlParamNames = Object.freeze({
	  FocusNodeId: 'focusNodeId'
	});
	var _getParamsFromUrl = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getParamsFromUrl");
	var _castAndValidate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("castAndValidate");
	class UrlProvidedParamsService {
	  static getParams() {
	    const paramMap = babelHelpers.classPrivateFieldLooseBase(this, _getParamsFromUrl)[_getParamsFromUrl]();
	    return {
	      focusNodeId: babelHelpers.classPrivateFieldLooseBase(this, _castAndValidate)[_castAndValidate](UrlParamNames.FocusNodeId, paramMap.get(UrlParamNames.FocusNodeId))
	    };
	  }
	}
	function _getParamsFromUrl2() {
	  const paramMap = new Map();
	  const urlSearchParams = new URLSearchParams(document.location.search);
	  Object.values(UrlParamNames).forEach(paramName => {
	    const paramValue = urlSearchParams.get(paramName);
	    if (!paramValue) {
	      return;
	    }
	    paramMap.set(paramName, paramValue);
	  });
	  return paramMap;
	}
	function _castAndValidate2(paramName, value) {
	  if (main_core.Type.isUndefined(value)) {
	    return null;
	  }
	  let castedValue = value;
	  if (paramName === UrlParamNames.FocusNodeId) {
	    castedValue = Number(value);
	    if (!main_core.Type.isInteger(castedValue)) {
	      return null;
	    }
	  }
	  return castedValue;
	}
	Object.defineProperty(UrlProvidedParamsService, _castAndValidate, {
	  value: _castAndValidate2
	});
	Object.defineProperty(UrlProvidedParamsService, _getParamsFromUrl, {
	  value: _getParamsFromUrl2
	});

	// @vue/component
	const HeadList = {
	  name: 'headList',
	  components: {
	    UserListActionMenu: humanresources_companyStructure_structureComponents.UserListActionMenu
	  },
	  props: {
	    items: {
	      type: Array,
	      required: false,
	      default: () => []
	    },
	    title: {
	      type: String,
	      required: false,
	      default: ''
	    },
	    collapsed: {
	      type: Boolean,
	      required: false,
	      default: false
	    },
	    type: {
	      type: String,
	      required: false,
	      default: 'head'
	    },
	    isTeamEntity: {
	      type: Boolean,
	      required: false,
	      default: false
	    }
	  },
	  data() {
	    return {
	      isCollapsed: false,
	      isUpdating: true,
	      headsVisible: false
	    };
	  },
	  computed: {
	    defaultAvatar() {
	      return '/bitrix/js/humanresources/company-structure/org-chart/src/images/default-user.svg';
	    },
	    dropdownItems() {
	      return this.items.map(item => {
	        const workPosition = this.getPositionText(item);
	        return {
	          ...item,
	          workPosition
	        };
	      });
	    },
	    titleBar() {
	      return this.type === this.userTypes.deputy ? this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_EMPLOYEE_DEPUTY_TITLE') : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_WIZARD_EMPLOYEE_HEAD_TITLE');
	    }
	  },
	  created() {
	    this.userTypes = {
	      head: 'head',
	      deputy: 'deputy'
	    };
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    handleUserClick(url) {
	      BX.SidePanel.Instance.open(url, {
	        cacheable: false
	      });
	    },
	    closeHeadList() {
	      if (this.headsVisible)
	        // to prevent double unsubscription
	        {
	          this.headsVisible = false;
	          main_core_events.EventEmitter.unsubscribe(events.HR_DEPARTMENT_MENU_CLOSE, this.closeHeadList);
	          main_core_events.EventEmitter.unsubscribe(events.HR_DRAG_DEPARTMENT, this.closeHeadList);
	        }
	    },
	    openHeadList() {
	      if (!this.headsVisible)
	        // to prevent double subscription
	        {
	          this.headsVisible = true;
	          main_core_events.EventEmitter.subscribe(events.HR_DEPARTMENT_MENU_CLOSE, this.closeHeadList);
	          main_core_events.EventEmitter.subscribe(events.HR_DRAG_DEPARTMENT, this.closeHeadList);
	        }
	    },
	    getPositionText(item) {
	      return item.workPosition || this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_HEAD_POSITION');
	    }
	  },
	  template: `
		<div v-if="items.length">
			<p v-if="title" class="humanresources-tree__node_employees-title">
				{{ title }}
			</p>
			<div
				class="humanresources-tree__node_head"
				:class="{ '--collapsed': collapsed }"
				v-for="(item, index) in items.slice(0, 2)"
			>
				<img
					:src="item.avatar ? encodeURI(item.avatar) : defaultAvatar"
					class="humanresources-tree__node_avatar --head"
					:class="{ '--collapsed': collapsed }"
					@click.stop="handleUserClick(item.url)"
				/>
				<div class="humanresources-tree__node_head-text">
					<span
						:bx-tooltip-user-id="item.id"
						bx-tooltip-context="b24"
						class="humanresources-tree__node_head-name"
						@click.stop="handleUserClick(item.url)"
					>
						{{ item.name }}
					</span>
					<span v-if="!collapsed" class="humanresources-tree__node_head-position">
						{{ getPositionText(item) }}
					</span>
				</div>
				<span
					v-if="index === 1 && items.length > 2"
					class="humanresources-tree__node_head-rest"
					:class="{ '--active': headsVisible }"
					:data-test-id="'hr-company-structure_org-chart-tree__node-' + type + '-rest'"
					ref="showMoreHeadList"
					@click.stop="openHeadList"
				>
					{{ '+' + String(items.length - 2) }}
				</span>
			</div>
		</div>
		<UserListActionMenu
			v-if="headsVisible"
			:id="type === userTypes.head ? 'head-list-popup-head' : 'head-list-popup-deputy'"
			:items="dropdownItems"
			:width="228"
			:bindElement="$refs.showMoreHeadList[0]"
			@close="closeHeadList"
			:titleBar="titleBar"
		/>
	`
	};

	let _ = t => t,
	  _t;
	const itemWidth = 278;
	const gap = 24;
	const mousedownHandler = ({
	  target,
	  currentTarget: dragContainer
	}) => {
	  if (!main_core.Dom.hasClass(target, 'humanresources-tree__node_dnd-icon')) {
	    return;
	  }
	  event.stopPropagation();
	  const draggedItem = target.closest('.humanresources-tree__node');
	  const draggedId = Number(draggedItem.dataset.id);
	  const children = [...dragContainer.children];
	  const draggedIndex = children.indexOf(draggedItem);
	  const ghost = createGhost(draggedItem);
	  main_core.Dom.append(ghost, dragContainer);
	  let transformX = 0;
	  let prevAffectedItems = [];
	  let targetIndex = null;
	  const mouseMoveHandler = event => {
	    main_core.Dom.style(document.body, 'userSelect', 'none');
	    main_core.Dom.style(document.body, 'cursor', 'grabbing');
	    main_core.Dom.addClass(dragContainer, '--drag-progress');
	    main_core.Dom.addClass(draggedItem, '--dragging');
	    transformX += event.movementX / dragContainer.dataset.zoom;
	    setTransform(draggedItem, transformX);
	    prevAffectedItems.forEach(affectedItem => setTransform(affectedItem));
	    targetIndex = Math.trunc((draggedItem.offsetLeft + transformX) / (itemWidth + gap));
	    if (targetIndex === draggedIndex) {
	      setTransform(ghost, draggedItem.offsetLeft);
	      return;
	    }
	    const direction = draggedIndex < targetIndex ? 1 : -1;
	    const affectedItems = direction > 0 ? children.slice(draggedIndex + 1, targetIndex + 1) : children.slice(targetIndex, draggedIndex);
	    const fullWidth = itemWidth + gap;
	    affectedItems.forEach(affectedItem => setTransform(affectedItem, -direction * fullWidth));
	    setTransform(ghost, draggedItem.offsetLeft + direction * affectedItems.length * fullWidth);
	    prevAffectedItems = affectedItems;
	  };
	  const mouseUpHandler = () => {
	    main_core.Dom.style(document.body, 'userSelect', '');
	    main_core.Dom.style(document.body, 'cursor', '');
	    main_core.Event.unbind(document, 'mousemove', mouseMoveHandler);
	    main_core.Event.unbind(document, 'mouseup', mouseUpHandler);
	    [...prevAffectedItems, draggedItem].forEach(item => setTransform(item));
	    main_core.Dom.removeClass(dragContainer, '--drag-progress');
	    main_core.Dom.removeClass(draggedItem, '--dragging');
	    main_core.Dom.remove(ghost);
	    main_core_events.EventEmitter.emit(events.HR_DEPARTMENT_TOGGLE_CONNECTORS, {
	      draggedId,
	      shouldShow: true
	    });
	    if (draggedIndex === targetIndex) {
	      return;
	    }
	    const targetId = children[targetIndex] ? Number(children[targetIndex].dataset.id) : 0;
	    if (targetId) {
	      main_core_events.EventEmitter.emit(events.HR_DROP_DEPARTMENT, {
	        draggedId,
	        targetId,
	        affectedItems: prevAffectedItems.map(item => Number(item.dataset.id)),
	        direction: draggedIndex < targetIndex ? 1 : -1
	      });
	    }
	  };
	  main_core.Event.bind(document, 'mousemove', mouseMoveHandler);
	  main_core.Event.bind(document, 'mouseup', mouseUpHandler);
	  main_core_events.EventEmitter.emit(events.HR_DEPARTMENT_TOGGLE_CONNECTORS, {
	    draggedId,
	    shouldShow: false
	  });
	  main_core_events.EventEmitter.emit(events.HR_DRAG_DEPARTMENT, {
	    draggedId
	  });
	};
	const createGhost = draggedItem => {
	  const {
	    offsetWidth,
	    offsetHeight,
	    offsetLeft
	  } = draggedItem;
	  return main_core.Tag.render(_t || (_t = _`
		<div
			class="humanresources-tree__node_dnd-ghost"
			style="width: ${0}px; height: ${0}px; transform: translateX(${0}px);"
		></div>
	`), offsetWidth, offsetHeight, offsetLeft);
	};
	const setTransform = (element, x) => {
	  main_core.Dom.style(element, 'transform', x ? `translate3d(${x}px, 0, 0)` : '');
	};
	const DragAndDrop = {
	  mounted(el) {
	    main_core.Event.bind(el, 'mousedown', mousedownHandler);
	  },
	  updated(el, {
	    value
	  }) {
	    el.setAttribute('data-zoom', value);
	  }
	};

	class AbstractActionMenu {
	  constructor(entityId) {
	    this.permissionChecker = humanresources_companyStructure_permissionChecker.PermissionChecker.getInstance();
	    this.entityId = entityId;
	  }
	  getItems() {
	    throw new Error('Must override this function');
	  }
	  getFilteredItems() {
	    if (!this.permissionChecker) {
	      return [];
	    }
	    const items = this.getItems();
	    return items.filter(item => {
	      if (main_core.Type.isFunction(item.hasPermission)) {
	        return item.hasPermission(this.permissionChecker, this.entityId);
	      }
	      return false;
	    });
	  }
	  onActionMenuItemClick(actionId) {
	    const targetItem = this.items.find(item => item.id === actionId);
	    targetItem == null ? void 0 : targetItem.invoke({
	      entityId: this.entityId,
	      analyticSource: this.analyticSource,
	      entityType: this.entityType
	    });
	  }
	}

	class AbstractMenuItem {
	  constructor({
	    id,
	    title,
	    description,
	    bIcon,
	    permissionAction,
	    dataTestId
	  }) {
	    this.id = id;
	    this.title = title;
	    this.description = description;
	    this.bIcon = bIcon;
	    this.permissionAction = permissionAction;
	    this.dataTestId = dataTestId;
	  }
	  invoke(options) {
	    throw new Error('Must override this function');
	  }
	  hasPermission(permissionChecker, entityId) {
	    return permissionChecker.hasPermission(this.permissionAction, entityId);
	  }
	}

	const MenuActions = Object.freeze({
	  editDepartment: 'editDepartment',
	  addDepartment: 'addDepartment',
	  addEmployee: 'addEmployee',
	  editEmployee: 'editEmployee',
	  removeDepartment: 'removeDepartment',
	  moveEmployee: 'moveEmployee',
	  userInvite: 'userInvite',
	  teamRights: 'teamRights',
	  moveUserToAnotherDepartment: 'moveUserToAnotherDepartment',
	  removeUserFromDepartment: 'removeUserFromDepartment',
	  fireUserFromCompany: 'fireUserFromCompany'
	});

	class AddDepartmentMenuItem extends AbstractMenuItem {
	  constructor(entityType) {
	    let title = '';
	    let description = '';

	    // temporary check for option
	    const permissionChecker = humanresources_companyStructure_permissionChecker.PermissionChecker.getInstance();
	    if (permissionChecker.isTeamsAvailable) {
	      title = entityType === humanresources_companyStructure_utils.EntityTypes.team ? main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_ADD_TEAM_TITLE') : main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_ADD_DEPARTMENT_TITLE_MSGVER_1');
	      description = entityType === humanresources_companyStructure_utils.EntityTypes.team ? main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_ADD_TEAM_SUBTITLE') : main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_ADD_DEPARTMENT_SUBTITLE_MSGVER_1');
	    } else {
	      title = main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_ADD_DEPARTMENT_TITLE_NO_TEAM');
	      description = main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_ADD_DEPARTMENT_SUBTITLE_NO_TEAM');
	    }
	    super({
	      id: MenuActions.addDepartment,
	      title,
	      description,
	      bIcon: {
	        name: ui_iconSet_api_core.Main.CUBE_PLUS,
	        size: 20,
	        color: humanresources_companyStructure_utils.getColorCode('paletteBlue50')
	      },
	      permissionAction: null,
	      dataTestId: 'hr-company-structure_menu__add-department-item'
	    });
	    this.permissionChecker = permissionChecker;
	  }
	  invoke({
	    entityId,
	    analyticSource,
	    entityType
	  }) {
	    // for a team we can create only another team
	    if (entityType === humanresources_companyStructure_utils.EntityTypes.team) {
	      if (!this.permissionChecker.isTeamsAvailable) {
	        ui_notification.UI.Notification.Center.notify({
	          content: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_TEAMS_DISABLED_ERROR_MSGVER_1'),
	          autoHideDelay: 2000
	        });
	        return;
	      }
	      main_core_events.EventEmitter.emit(events.HR_ENTITY_SHOW_WIZARD, {
	        nodeId: entityId,
	        isEditMode: false,
	        showEntitySelector: false,
	        source: analyticSource,
	        entityType
	      });
	    }
	    // for a department we offer to chose entity
	    else {
	      main_core_events.EventEmitter.emit(events.HR_ENTITY_SHOW_WIZARD, {
	        nodeId: entityId,
	        isEditMode: false,
	        showEntitySelector: true,
	        source: analyticSource
	      });
	    }
	  }
	  hasPermission(permissionChecker, entityId) {
	    if (this.entityType === humanresources_companyStructure_utils.EntityTypes.team) {
	      return permissionChecker.hasPermission(humanresources_companyStructure_permissionChecker.PermissionActions.teamCreate, entityId);
	    }
	    return permissionChecker.hasPermission(humanresources_companyStructure_permissionChecker.PermissionActions.departmentCreate, entityId) || permissionChecker.hasPermission(humanresources_companyStructure_permissionChecker.PermissionActions.teamCreate, entityId);
	  }
	}

	class EditDepartmentMenuItem extends AbstractMenuItem {
	  constructor(entityType) {
	    const title = entityType === humanresources_companyStructure_utils.EntityTypes.team ? main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_EDIT_TEAM_TITLE') : main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_EDIT_DEPARTMENT_TITLE');
	    const description = entityType === humanresources_companyStructure_utils.EntityTypes.team ? main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_EDIT_TEAM_SUBTITLE') : main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_EDIT_DEPARTMENT_SUBTITLE');
	    const permissionAction = entityType === humanresources_companyStructure_utils.EntityTypes.team ? humanresources_companyStructure_permissionChecker.PermissionActions.teamEdit : humanresources_companyStructure_permissionChecker.PermissionActions.departmentEdit;
	    super({
	      id: MenuActions.editDepartment,
	      title,
	      description,
	      bIcon: {
	        name: ui_iconSet_api_core.Main.EDIT_PENCIL,
	        size: 20,
	        color: humanresources_companyStructure_utils.getColorCode('paletteBlue50')
	      },
	      permissionAction,
	      dataTestId: 'hr-company-structure_menu__edit-department-item'
	    });
	  }
	  invoke({
	    entityId,
	    analyticSource,
	    refToFocus = 'title'
	  }) {
	    main_core_events.EventEmitter.emit(events.HR_ENTITY_SHOW_WIZARD, {
	      nodeId: entityId,
	      isEditMode: true,
	      type: 'department',
	      source: analyticSource,
	      refToFocus
	    });
	  }
	}

	class RemoveDepartmentMenuItem extends AbstractMenuItem {
	  constructor(entityType) {
	    const title = entityType === humanresources_companyStructure_utils.EntityTypes.team ? main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_REMOVE_TEAM_TITLE') : main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_REMOVE_DEPARTMENT_TITLE');
	    const description = entityType === humanresources_companyStructure_utils.EntityTypes.team ? main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_REMOVE_TEAM_SUBTITLE') : main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_REMOVE_DEPARTMENT_SUBTITLE');
	    const permissionAction = entityType === humanresources_companyStructure_utils.EntityTypes.team ? humanresources_companyStructure_permissionChecker.PermissionActions.teamDelete : humanresources_companyStructure_permissionChecker.PermissionActions.departmentDelete;
	    super({
	      id: MenuActions.removeDepartment,
	      title,
	      description,
	      bIcon: {
	        name: ui_iconSet_api_core.Main.TRASH_BIN,
	        size: 20,
	        color: humanresources_companyStructure_utils.getColorCode('paletteRed40')
	      },
	      permissionAction,
	      dataTestId: 'hr-company-structure_menu__remove-department-item'
	    });
	  }
	  invoke({
	    entityId,
	    entityType
	  }) {
	    main_core_events.EventEmitter.emit(events.HR_ENTITY_REMOVE, {
	      nodeId: entityId,
	      entityType
	    });
	  }
	}

	class TeamRightsMenuItem extends AbstractMenuItem {
	  constructor() {
	    super({
	      id: MenuActions.teamRights,
	      title: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_TEAM_RIGHTS_TITLE'),
	      description: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_TEAM_RIGHTS_SUBTITLE'),
	      bIcon: {
	        name: ui_iconSet_api_core.Actions.SETTINGS_2,
	        size: 20,
	        color: humanresources_companyStructure_utils.getColorCode('paletteBlue50')
	      },
	      permissionAction: humanresources_companyStructure_permissionChecker.PermissionActions.teamSettingsEdit,
	      dataTestId: 'hr-company-structure_menu__team-rights-item'
	    });
	  }
	  invoke({
	    entityId,
	    analyticSource,
	    entityType
	  }) {
	    main_core_events.EventEmitter.emit(events.HR_ENTITY_SHOW_WIZARD, {
	      nodeId: entityId,
	      isEditMode: true,
	      type: 'teamRights',
	      source: analyticSource
	    });
	  }
	}

	class AddEmployeeMenuItem extends AbstractMenuItem {
	  constructor(entityType, role) {
	    const permissionAction = entityType === humanresources_companyStructure_utils.EntityTypes.team ? humanresources_companyStructure_permissionChecker.PermissionActions.teamAddMember : humanresources_companyStructure_permissionChecker.PermissionActions.employeeAddToDepartment;
	    super({
	      id: MenuActions.addEmployee,
	      bIcon: {
	        name: ui_iconSet_api_core.CRM.PERSON_PLUS_2,
	        size: 20,
	        color: humanresources_companyStructure_utils.getColorCode('paletteBlue50')
	      },
	      permissionAction,
	      dataTestId: 'hr-company-structure_menu__add-employee-item'
	    });
	    this.localize(entityType, role);
	  }
	  localize(entityType, role) {
	    const i18nRole = ['head', 'employee'].includes(role) ? role : 'default';
	    const i18nType = entityType === humanresources_companyStructure_utils.EntityTypes.team ? 'team' : 'default';
	    const i18nMap = {
	      head: {
	        team: {
	          title: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_TAB_USERS_MEMBER_ACTION_MENU_ADD_HEAD_TITLE'),
	          description: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_TAB_USERS_MEMBER_ACTION_MENU_ADD_TEAM_HEAD_SUBTITLE'),
	          role: humanresources_companyStructure_api.teamMemberRoles.head
	        },
	        default: {
	          title: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_TAB_USERS_MEMBER_ACTION_MENU_ADD_HEAD_TITLE'),
	          description: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_TAB_USERS_MEMBER_ACTION_MENU_ADD_HEAD_SUBTITLE'),
	          role: humanresources_companyStructure_api.memberRoles.head
	        }
	      },
	      employee: {
	        team: {
	          title: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_TAB_USERS_MEMBER_ACTION_MENU_ADD_TEAM_EMPLOYEE_TITLE'),
	          description: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_TAB_USERS_MEMBER_ACTION_MENU_ADD_TEAM_EMPLOYEE_SUBTITLE'),
	          role: humanresources_companyStructure_api.teamMemberRoles.employee
	        },
	        default: {
	          title: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_TAB_USERS_MEMBER_ACTION_MENU_ADD_EMPLOYEE_TITLE'),
	          description: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_TAB_USERS_MEMBER_ACTION_MENU_ADD_EMPLOYEE_SUBTITLE'),
	          role: humanresources_companyStructure_api.memberRoles.employee
	        }
	      },
	      default: {
	        team: {
	          title: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_ADD_TEAM_EMPLOYEE_TITLE'),
	          description: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_ADD_TEAM_EMPLOYEE_SUBTITLE'),
	          role: null
	        },
	        default: {
	          title: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_ADD_EMPLOYEE_TITLE'),
	          description: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_ADD_EMPLOYEE_SUBTITLE'),
	          role: null
	        }
	      }
	    };
	    this.title = i18nMap[i18nRole][i18nType].title;
	    this.description = i18nMap[i18nRole][i18nType].description;
	    this.role = i18nMap[i18nRole][i18nType].role;
	  }
	  invoke({
	    entityId,
	    entityType
	  }) {
	    humanresources_companyStructure_userManagementDialog.UserManagementDialog.openDialog({
	      nodeId: entityId,
	      type: 'add',
	      role: this.role,
	      entityType
	    });
	  }
	}

	class EditEmployeesMenuItem extends AbstractMenuItem {
	  constructor(entityType, role) {
	    const permissionAction = entityType === humanresources_companyStructure_utils.EntityTypes.team ? humanresources_companyStructure_permissionChecker.PermissionActions.teamAddMember : humanresources_companyStructure_permissionChecker.PermissionActions.employeeAddToDepartment;
	    super({
	      id: MenuActions.editEmployee,
	      imageClass: '-hr-department-org-chart-menu-edit-list',
	      bIcon: {
	        name: ui_iconSet_api_core.Main.EDIT_MENU,
	        size: 20,
	        color: humanresources_companyStructure_utils.getColorCode('paletteBlue50')
	      },
	      permissionAction,
	      dataTestId: 'hr-company-structure_menu__edit-employee-item'
	    });
	    this.localize(entityType, role);
	  }
	  localize(entityType, role) {
	    const i18nRole = ['head', 'employee'].includes(role) ? role : 'default';
	    const i18nType = entityType === humanresources_companyStructure_utils.EntityTypes.team ? 'team' : 'default';
	    const i18nMap = {
	      head: {
	        team: {
	          title: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_TAB_USERS_MEMBER_ACTION_MENU_EDIT_TEAM_HEAD_TITLE'),
	          description: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_TAB_USERS_MEMBER_ACTION_MENU_EDIT_TEAM_HEAD_SUBTITLE')
	        },
	        default: {
	          title: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_TAB_USERS_MEMBER_ACTION_MENU_EDIT_HEAD_TITLE'),
	          description: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_TAB_USERS_MEMBER_ACTION_MENU_EDIT_HEAD_SUBTITLE')
	        }
	      },
	      employee: {
	        team: {
	          title: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_TAB_USERS_MEMBER_ACTION_MENU_EDIT_TEAM_EMPLOYEE_TITLE'),
	          description: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_TAB_USERS_MEMBER_ACTION_MENU_EDIT_TEAM_EMPLOYEE_SUBTITLE')
	        },
	        default: {
	          title: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_TAB_USERS_MEMBER_ACTION_MENU_EDIT_EMPLOYEE_TITLE'),
	          description: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_TAB_USERS_MEMBER_ACTION_MENU_EDIT_TEAM_EMPLOYEE_SUBTITLE')
	        }
	      },
	      default: {
	        team: {
	          title: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_EDIT_TEAM_EMPLOYEE_LIST_TITLE'),
	          description: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_EDIT_TEAM_EMPLOYEE_LIST_SUBTITLE')
	        },
	        default: {
	          title: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_EDIT_EMPLOYEE_LIST_TITLE'),
	          description: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_EDIT_EMPLOYEE_LIST_SUBTITLE')
	        }
	      }
	    };
	    this.title = i18nMap[i18nRole][i18nType].title;
	    this.description = i18nMap[i18nRole][i18nType].description;
	  }
	  invoke({
	    entityId,
	    analyticSource
	  }) {
	    main_core_events.EventEmitter.emit(events.HR_ENTITY_SHOW_WIZARD, {
	      nodeId: entityId,
	      isEditMode: true,
	      type: 'employees',
	      source: analyticSource
	    });
	  }
	}

	class MoveEmployeeMenuItem extends AbstractMenuItem {
	  constructor() {
	    super({
	      id: MenuActions.moveEmployee,
	      title: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_MOVE_EMPLOYEE_TITLE'),
	      description: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_MOVE_EMPLOYEE_SUBTITLE'),
	      bIcon: {
	        name: ui_iconSet_api_core.Main.PERSON_ARROW_LEFT_1,
	        size: 20,
	        color: humanresources_companyStructure_utils.getColorCode('paletteBlue50')
	      },
	      permissionAction: humanresources_companyStructure_permissionChecker.PermissionActions.employeeAddToDepartment,
	      dataTestId: 'hr-company-structure_menu__move-employee-item'
	    });
	  }
	  invoke({
	    entityId,
	    analyticSource
	  }) {
	    humanresources_companyStructure_userManagementDialog.UserManagementDialog.openDialog({
	      nodeId: entityId,
	      type: 'move'
	    });
	  }
	  hasPermission(permissionChecker, entityId) {
	    return permissionChecker.currentUserPermissions.ACTION_EMPLOYEE_REMOVE_FROM_DEPARTMENT && permissionChecker.hasPermission(this.permissionAction, entityId);
	  }
	}

	class UserInviteMenuItem extends AbstractMenuItem {
	  constructor() {
	    super({
	      id: MenuActions.userInvite,
	      title: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_USER_INVITE_TITLE'),
	      description: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_DEPARTMENT_DETAIL_EDIT_MENU_USER_INVITE_SUBTITLE'),
	      bIcon: {
	        name: ui_iconSet_api_core.Main.PERSON_LETTER,
	        size: 20,
	        color: humanresources_companyStructure_utils.getColorCode('paletteBlue50')
	      },
	      permissionAction: humanresources_companyStructure_permissionChecker.PermissionActions.inviteToDepartment,
	      dataTestId: 'hr-company-structure_menu__user-invite-item'
	    });
	  }
	  invoke({
	    entityId
	  }) {
	    BX.SidePanel.Instance.open('/bitrix/services/main/ajax.php?action=getSliderContent' + '&c=bitrix%3Aintranet.invitation&mode=ajax' + `&departments[]=${Number(entityId)}&firstInvitationBlock=invite-with-group-dp`, {
	      cacheable: false,
	      allowChangeHistory: false,
	      width: 1100
	    });
	  }
	}

	class EntityActionMenu extends AbstractActionMenu {
	  constructor(entityId, entityType, analyticSource) {
	    super(entityId);
	    this.entityType = entityType;
	    this.analyticSource = analyticSource;
	    this.items = this.getFilteredItems();
	  }
	  getItems() {
	    if (this.entityType === humanresources_companyStructure_utils.EntityTypes.team) {
	      return [new EditDepartmentMenuItem(this.entityType), new AddDepartmentMenuItem(this.entityType), new EditEmployeesMenuItem(this.entityType, null), new TeamRightsMenuItem(), new AddEmployeeMenuItem(this.entityType), new RemoveDepartmentMenuItem(this.entityType)];
	    }
	    return [new EditDepartmentMenuItem(this.entityType), new AddDepartmentMenuItem(this.entityType), new AddEmployeeMenuItem(this.entityType), new EditEmployeesMenuItem(this.entityType, null), new MoveEmployeeMenuItem(), new UserInviteMenuItem(), new RemoveDepartmentMenuItem(this.entityType)];
	  }
	}

	// @vue/component
	const DepartmentMenuButton = {
	  name: 'DepartmentMenuButton',
	  components: {
	    RouteActionMenu: humanresources_companyStructure_structureComponents.RouteActionMenu
	  },
	  props: {
	    entityId: {
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
	      return new EntityActionMenu(this.entityId, this.entityType, humanresources_companyStructure_api.AnalyticsSourceType.DETAIL);
	    }
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    onActionMenuItemClick(actionId) {
	      this.menu.onActionMenuItemClick(actionId);
	    },
	    closeMenu() {
	      if (this.menuVisible) {
	        this.menuVisible = false;
	        main_core_events.EventEmitter.unsubscribe(events.HR_DEPARTMENT_MENU_CLOSE, this.closeMenu);
	        main_core_events.EventEmitter.unsubscribe(events.HR_DRAG_DEPARTMENT, this.closeMenu);
	      }
	    },
	    openMenu() {
	      if (!this.menuVisible) {
	        this.menuVisible = true;
	        main_core_events.EventEmitter.subscribe(events.HR_DEPARTMENT_MENU_CLOSE, this.closeMenu);
	        main_core_events.EventEmitter.subscribe(events.HR_DRAG_DEPARTMENT, this.closeMenu);
	      }
	    }
	  },
	  template: `
		<div
			v-if="menu.items.length"
			class="ui-icon-set --more humanresources-tree__node_department-menu-button"
			:class="{ '--focused': this.menuVisible }"
			ref="departmentMenuButton"
			data-test-id="tree-node-more-button"
			@click.stop="openMenu"
		>
		</div>

		<RouteActionMenu
			v-if="menuVisible"
			:id="'tree-node-department-menu-' + entityId"
			:width="302"
			:items="menu.items"
			:bindElement="this.$refs.departmentMenuButton"
			@action="onActionMenuItemClick"
			@close="closeMenu"
		/>
	`
	};

	// @vue/component
	const DepartmentInfoIconButton = {
	  name: 'DepartmentInfoIconButton',
	  components: {
	    BasePopup: humanresources_companyStructure_structureComponents.BasePopup
	  },
	  props: {
	    entityId: {
	      type: Number,
	      required: true
	    },
	    canvasZoom: {
	      type: Number,
	      required: true
	    },
	    description: {
	      type: [String, null],
	      default: null
	    }
	  },
	  data() {
	    return {
	      showPopup: false
	    };
	  },
	  computed: {
	    popupConfig() {
	      const popupWidth = 340;
	      const buttonWidth = 22 * this.canvasZoom;
	      const initialPopupOffset = 41 - this.canvasZoom; // subtract 1px * zoom
	      const angleWidth = 33;
	      return {
	        width: popupWidth,
	        bindElement: this.$refs.departmentMenuButton,
	        bindOptions: {
	          position: 'top'
	        },
	        borderRadius: '12px',
	        contentNoPaddings: true,
	        contentPadding: 0,
	        padding: 16,
	        offsetTop: -2 * this.canvasZoom,
	        offsetLeft: buttonWidth / 2 - popupWidth / 2 + initialPopupOffset,
	        angleOffset: popupWidth / 2 - angleWidth / 2
	      };
	    }
	  },
	  created() {
	    this.menuItem = new EditDepartmentMenuItem(humanresources_companyStructure_utils.EntityTypes.team);
	    const permissionChecker = humanresources_companyStructure_permissionChecker.PermissionChecker.getInstance();
	    this.canEdit = this.menuItem.hasPermission(permissionChecker, this.entityId);
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    onClose() {
	      if (this.showPopup) {
	        this.showPopup = false;
	        main_core_events.EventEmitter.unsubscribe(events.HR_DEPARTMENT_MENU_CLOSE, this.onClose);
	        main_core_events.EventEmitter.unsubscribe(events.HR_DRAG_DEPARTMENT, this.onClose);
	      }
	    },
	    onOpen() {
	      if (!this.showPopup) {
	        this.showPopup = true;
	        main_core_events.EventEmitter.subscribe(events.HR_DEPARTMENT_MENU_CLOSE, this.onClose);
	        main_core_events.EventEmitter.subscribe(events.HR_DRAG_DEPARTMENT, this.onClose);
	      }
	    },
	    addDescription() {
	      this.onClose();
	      this.menuItem.invoke({
	        entityId: this.entityId,
	        analyticSource: humanresources_companyStructure_api.AnalyticsSourceType.CARD,
	        refToFocus: 'description'
	      });
	    }
	  },
	  template: `
		<div
			v-if="canEdit || description"
			class="ui-icon-set --info-1 humanresources-tree__node_department-menu-button"
			:class="{ '--focused': this.showPopup }"
			ref="departmentMenuButton"
			@click.stop="onOpen"
			data-test-id="tree-node-info-button"
		>
		</div>
		<BasePopup
			v-if="showPopup"
			:config="popupConfig"
			:id="'humanresources-tree__node_info-popup' + entityId"
			@close="onClose"
		>
			<div class="humanresources-tree__node_info-popup-content_description" v-if="description">
				{{ description }}
			</div>
			<div v-else class="humanresources-tree__node_info-popup-content">
				<div class="humanresources-tree__node_info-popup-content_left"></div>
				<div class="humanresources-tree__node_info-popup-content_right">
					<div class="humanresources-tree__node_info-popup-content_right_title">
						{{ loc('HUMANRESOURCES_COMPANY_STRUCTURE_INFO_POPUP_ADD_DESCRIPTION_TITLE') }}
					</div>
					<div class="humanresources-tree__node_info-popup-content_right_text">
						{{ loc('HUMANRESOURCES_COMPANY_STRUCTURE_INFO_POPUP_ADD_DESCRIPTION_TEXT') }}
					</div>
					<div
						class="ui-btn ui-btn-primary ui-btn-round ui-btn-xs ui-btn-no-caps"
						data-test-id="tree-node-info-popup_add-button"
						@click="addDescription"
					>
						{{ loc('HUMANRESOURCES_COMPANY_STRUCTURE_INFO_POPUP_ADD_DESCRIPTION_BUTTON') }}
					</div>
				</div>
			</div>
		</BasePopup>
	`
	};

	// @vue/component
	const SubdivisionAddButton = {
	  name: 'SubdivisionAddButton',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  props: {
	    entityId: {
	      type: Number,
	      required: true
	    },
	    entityType: {
	      type: String,
	      default: humanresources_companyStructure_utils.EntityTypes.department
	    }
	  },
	  computed: {
	    set() {
	      return ui_iconSet_api_vue.Set;
	    }
	  },
	  created() {
	    this.menuItem = new AddDepartmentMenuItem(this.entityType);
	    const permissionChecker = humanresources_companyStructure_permissionChecker.PermissionChecker.getInstance();
	    this.canShow = this.menuItem.hasPermission(permissionChecker, this.entityId);
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    addSubdivision() {
	      this.menuItem.invoke({
	        entityId: this.entityId,
	        analyticSource: humanresources_companyStructure_api.AnalyticsSourceType.PLUS,
	        entityType: this.entityType
	      });
	    }
	  },
	  template: `
		<div class="humanresources-tree__node_add-subdivision" v-if="canShow">
		  <button class="humanresources-tree__node_add-button" @click="addSubdivision">
		    <BIcon :name="set.PLUS_20" :size="32" class="humanresources-tree__node_add-icon"></BIcon>
		  </button>
		</div>
	`
	};

	// @vue/component
	const TreeNode = {
	  name: 'treeNode',
	  components: {
	    DepartmentMenuButton,
	    HeadList,
	    SubdivisionAddButton,
	    DepartmentInfoIconButton
	  },
	  directives: {
	    hint: humanresources_companyStructure_structureComponents.Hint,
	    dnd: DragAndDrop
	  },
	  inject: ['getTreeBounds'],
	  props: {
	    nodeId: {
	      type: Number,
	      required: true
	    },
	    expandedNodes: {
	      type: Array,
	      required: true
	    },
	    canvasZoom: {
	      type: Number,
	      required: true
	    },
	    currentDepartments: {
	      type: Array,
	      required: true
	    },
	    isShown: {
	      type: Boolean,
	      required: false,
	      default: true
	    }
	  },
	  emits: ['calculatePosition'],
	  data() {
	    return {
	      childrenOffset: 0,
	      childrenMounted: false,
	      showInfo: true,
	      showDnd: true
	    };
	  },
	  computed: {
	    memberRoles() {
	      return humanresources_companyStructure_api.getMemberRoles(this.nodeData.entityType);
	    },
	    nodeData() {
	      return this.departments.get(this.nodeId);
	    },
	    nodeClass() {
	      return {
	        '--expanded': this.expandedNodes.includes(this.nodeId),
	        '--current-department': this.isCurrentDepartment,
	        '--focused': this.focusedNode === this.nodeId,
	        '--with-restricted-access-rights': !this.showInfo,
	        '--team': this.isTeamEntity
	      };
	    },
	    subdivisionsClass() {
	      return {
	        'humanresources-tree__node_arrow': this.hasChildren,
	        '--up': this.hasChildren && this.isExpanded,
	        '--down': this.hasChildren && !this.isExpanded,
	        '--transparent': !this.hasChildren
	      };
	    },
	    hasChildren() {
	      var _this$nodeData$childr;
	      return ((_this$nodeData$childr = this.nodeData.children) == null ? void 0 : _this$nodeData$childr.length) > 0;
	    },
	    isExpanded() {
	      return this.expandedNodes.includes(this.nodeId);
	    },
	    isCurrentDepartment() {
	      return this.currentDepartments.includes(this.nodeId);
	    },
	    head() {
	      var _this$nodeData$heads;
	      return (_this$nodeData$heads = this.nodeData.heads) == null ? void 0 : _this$nodeData$heads.filter(head => {
	        return head.role === this.memberRoles.head;
	      });
	    },
	    deputy() {
	      var _this$nodeData$heads2;
	      return (_this$nodeData$heads2 = this.nodeData.heads) == null ? void 0 : _this$nodeData$heads2.filter(head => {
	        return head.role === this.memberRoles.deputyHead;
	      });
	    },
	    employeeCount() {
	      return this.nodeData.userCount - this.nodeData.heads.length;
	    },
	    childNodeStyle() {
	      return {
	        left: `${this.childrenOffset}px`
	      };
	    },
	    showSubdivisionAddButton() {
	      return this.expandedNodes.includes(this.nodeId) || this.focusedNode === this.nodeId;
	    },
	    isTeamEntity() {
	      return this.nodeData.entityType === humanresources_companyStructure_utils.EntityTypes.team;
	    },
	    nodeDataTitle() {
	      if (!this.isCurrentDepartment) {
	        return null;
	      }
	      return this.isTeamEntity ? this.loc('HUMANRESOURCES_COMPANY_CURRENT_TEAM') : this.loc('HUMANRESOURCES_COMPANY_CURRENT_DEPARTMENT');
	    },
	    subdivisionsText() {
	      var _this$nodeData$childr3;
	      if (this.isTeamEntity) {
	        var _this$nodeData$childr2;
	        return (_this$nodeData$childr2 = this.nodeData.children) != null && _this$nodeData$childr2.length ? this.locPlural('HUMANRESOURCES_COMPANY_TEAM_CHILDREN_COUNT', this.nodeData.children.length) : this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_TREE_TEAM_NO_SUBDEPARTMENTS');
	      }
	      if (!((_this$nodeData$childr3 = this.nodeData.children) != null && _this$nodeData$childr3.length)) {
	        return this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_TREE_NO_SUBDEPARTMENTS');
	      }
	      const childDepartmentsCount = [...this.departments.values()].filter(department => {
	        return department.entityType === humanresources_companyStructure_utils.EntityTypes.department && this.nodeData.children.includes(department.id);
	      }).length;
	      const childTeamsCount = [...this.departments.values()].filter(department => {
	        return department.entityType === humanresources_companyStructure_utils.EntityTypes.team && this.nodeData.children.includes(department.id);
	      }).length;
	      if (childTeamsCount > 0 && childDepartmentsCount > 0) {
	        return this.loc('HUMANRESOURCES_COMPANY_DEPARTMENT_CHILDREN_COUNT_WITH_CONJUNCTION', {
	          '#DEPT_COUNT#': this.locPlural('HUMANRESOURCES_COMPANY_DEPARTMENT_CHILDREN_COUNT', childDepartmentsCount),
	          '#TEAM_COUNT#': this.locPlural('HUMANRESOURCES_COMPANY_TEAM_CHILDREN_COUNT', childTeamsCount)
	        });
	      }
	      if (childDepartmentsCount > 0) {
	        return this.locPlural('HUMANRESOURCES_COMPANY_DEPARTMENT_CHILDREN_COUNT', childDepartmentsCount);
	      }
	      if (childTeamsCount > 0) {
	        return this.locPlural('HUMANRESOURCES_COMPANY_TEAM_CHILDREN_COUNT', childTeamsCount);
	      }
	      return this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_TREE_NO_SUBDEPARTMENTS');
	    },
	    ...ui_vue3_pinia.mapState(humanresources_companyStructure_chartStore.useChartStore, ['departments', 'focusedNode'])
	  },
	  watch: {
	    head() {
	      this.adaptHeight();
	    },
	    isShown() {
	      this.adaptHeight();
	    },
	    isExpanded: {
	      handler(isExpanded) {
	        if (isExpanded && !this.childrenMounted) {
	          this.childrenMounted = true;
	        }
	      },
	      immediate: true
	    }
	  },
	  created() {
	    this.width = 278;
	    this.gap = 24;
	    this.prevChildrenOffset = 0;
	    this.prevHeight = 0;
	  },
	  async mounted() {
	    if (this.isTeamEntity) {
	      this.showInfo = humanresources_companyStructure_permissionChecker.PermissionChecker.getInstance().hasPermission(humanresources_companyStructure_permissionChecker.PermissionActions.teamView, this.nodeId);
	    } else {
	      this.showInfo = humanresources_companyStructure_permissionChecker.PermissionChecker.getInstance().hasPermission(humanresources_companyStructure_permissionChecker.PermissionActions.structureView, this.nodeId);
	    }
	    this.showDnd = humanresources_companyStructure_permissionChecker.PermissionChecker.getInstance().hasPermission(humanresources_companyStructure_permissionChecker.PermissionActions.departmentEdit, this.nodeData.parentId, humanresources_companyStructure_permissionChecker.PermissionLevels.selfAndSub) && humanresources_companyStructure_permissionChecker.PermissionChecker.getInstance().hasPermission(humanresources_companyStructure_permissionChecker.PermissionActions.structureView, this.nodeData.parentId, humanresources_companyStructure_permissionChecker.PermissionLevels.selfAndSub);
	    this.$emit('calculatePosition', this.nodeId);
	    await this.$nextTick();
	    this.prevHeight = this.$el.offsetHeight;
	    main_core_events.EventEmitter.emit(events.HR_DEPARTMENT_CONNECT, {
	      id: this.nodeId,
	      parentId: this.nodeData.parentId,
	      html: this.$el,
	      parentsPath: this.getParentsPath(this.nodeData.parentId),
	      ...this.calculateNodePoints()
	    });
	  },
	  unmounted() {
	    main_core.Dom.remove(this.$el);
	    const {
	      prevParentId
	    } = this.nodeData;
	    if (!prevParentId) {
	      return;
	    }
	    this.$emit('calculatePosition', this.nodeId);
	    main_core_events.EventEmitter.emit(events.HR_DEPARTMENT_DISCONNECT, {
	      id: this.nodeId,
	      parentId: prevParentId
	    });
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    onDepartmentClick(targetId) {
	      if (!this.showInfo) {
	        return;
	      }
	      main_core_events.EventEmitter.emit(events.HR_DEPARTMENT_FOCUS, {
	        nodeId: this.nodeId,
	        showEmployees: targetId === 'employees',
	        subdivisionsSelected: targetId === 'subdivisions'
	      });
	    },
	    calculatePosition(nodeId) {
	      const node = this.departments.get(this.nodeId);
	      if (node.children.length === 0) {
	        this.childrenOffset = 0;
	      } else {
	        const gap = this.gap * (node.children.length - 1);
	        this.prevChildrenOffset = this.childrenOffset;
	        this.childrenOffset = (this.width - (this.width * node.children.length + gap)) / 2;
	      }
	      const offset = this.childrenOffset - this.prevChildrenOffset;
	      if (offset !== 0) {
	        main_core_events.EventEmitter.emit(events.HR_DEPARTMENT_ADAPT_SIBLINGS, {
	          parentId: this.nodeId,
	          nodeId,
	          offset
	        });
	      }
	    },
	    locPlural(phraseCode, count) {
	      return main_core.Loc.getMessagePlural(phraseCode, count, {
	        '#COUNT#': count
	      });
	    },
	    calculateNodePoints() {
	      const {
	        left,
	        top,
	        width
	      } = this.$el.getBoundingClientRect();
	      const {
	        $el: parentNode
	      } = this.$parent.$parent;
	      const {
	        left: parentLeft,
	        top: parentTop,
	        width: parentWidth,
	        height: parentHeight
	      } = parentNode.getBoundingClientRect();
	      const {
	        x: chartX,
	        y: chartY
	      } = this.getTreeBounds();
	      return {
	        startPoint: {
	          x: (parentLeft - chartX + parentWidth / 2) / this.canvasZoom,
	          y: (parentTop - chartY + parentHeight) / this.canvasZoom
	        },
	        endPoint: {
	          x: (left - chartX + width / 2) / this.canvasZoom,
	          y: (top - chartY) / this.canvasZoom
	        }
	      };
	    },
	    getParentsPath(parentId) {
	      let topLevelId = parentId;
	      const parentsPath = [parentId];
	      while (topLevelId) {
	        const parentNode = this.departments.get(topLevelId);
	        topLevelId = parentNode.parentId;
	        if (topLevelId) {
	          parentsPath.push(topLevelId);
	        }
	      }
	      return parentsPath;
	    },
	    async adaptHeight() {
	      if (!this.isShown) {
	        return;
	      }
	      await this.$nextTick();
	      const shift = this.$el.offsetHeight - this.prevHeight;
	      if (shift !== 0) {
	        main_core_events.EventEmitter.emit(events.HR_DEPARTMENT_ADAPT_CONNECTOR_HEIGHT, {
	          nodeId: this.nodeId,
	          shift
	        });
	        this.prevHeight = this.$el.offsetHeight;
	      }
	    }
	  },
	  template: `
		<div
			:data-id="nodeId"
			:class="nodeClass"
			:data-title="nodeDataTitle"
			class="humanresources-tree__node"
			:style="{
				'--team-bubble-background': nodeData.teamColor?.bubbleBackground,
				'--team-focused-border-color': nodeData.teamColor?.focusedBorderColor,
				'--node-expanded-color': nodeData.teamColor?.expandedBorderColor,
			}"
		>
			<div
				class="humanresources-tree__node_summary"
				@click.stop="onDepartmentClick('department')"
			>
				<template v-if="showInfo">
					<div
						class="humanresources-tree__node_department"
						:style="{ 'background-color': nodeData.teamColor?.treeHeadBackground}"
					>
						<div class="humanresources-tree__node_department-title">
							<div
								v-if="nodeData.parentId !== 0 && showDnd"
								class="humanresources-tree__node_dnd-icon ui-icon-set --more-points"
								:class="{ '--team': isTeamEntity }"
							>
							</div>
							<span
								v-hint
								class="humanresources-tree__node_department-title_text"
								:class="{ '--no-dnd': !showDnd }"
							>
								{{nodeData.name}}
							</span>
						</div>
						<div class="humanresources-tree__node_department-menu-icons">
							<DepartmentInfoIconButton
								v-if="isTeamEntity"
								:description="nodeData.description"
								:entityId="nodeId"
								:canvasZoom="canvasZoom"
							/>
							<DepartmentMenuButton
								v-if="head && deputy"
								:entityId="nodeId"
								:entityType="nodeData.entityType"
							></DepartmentMenuButton>
						</div>
					</div>
					<div class="humanresources-tree__node_description">
						<HeadList v-if="head" :items="head" :isTeamEntity="isTeamEntity"></HeadList>
						<div
							v-else
							class="humanresources-tree__node_load-skeleton --heads"
						></div>
						<div v-if="deputy" class="humanresources-tree__node_employees">
							<div>
								<p class="humanresources-tree__node_employees-title">
									{{
										isTeamEntity
											? loc('HUMANRESOURCES_COMPANY_STRUCTURE_TREE_TEAM_EMPLOYEES_TITLE')
											: loc('HUMANRESOURCES_COMPANY_STRUCTURE_TREE_EMPLOYEES_TITLE')
									}}
								</p>
								<span
									class="humanresources-tree__node_employees-count"
									@click.stop="onDepartmentClick('employees')"
								>
									{{locPlural('HUMANRESOURCES_COMPANY_STRUCTURE_TREE_EMPLOYEES_COUNT', employeeCount)}}
								</span>
							</div>
							<div v-if="!deputy.length"></div>
							<HeadList
								:items="deputy"
								:title="loc('HUMANRESOURCES_COMPANY_STRUCTURE_TREE_DEPUTY_TITLE')"
								:collapsed="true"
								:type="'deputy'"
							>
							</HeadList>
						</div>
						<div
							v-else
							class="humanresources-tree__node_load-skeleton --deputies"
						></div>
					</div>
					<div
						class="humanresources-tree__node_subdivisions"
						:class="subdivisionsClass"
						@click.stop="onDepartmentClick('subdivisions')"
					>
						<span>{{ subdivisionsText }}</span>
					</div>
				</template>
				<svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" class="humanresources-tree__node_lock">
					<path d="M12.0646 4.231C13.9529 4.231 15.4836 5.76968 15.4836 7.66775V10.5612H17.2905V7.66775C17.2905 4.76657 14.9507 2.41476 12.0645 2.41476C9.17827 2.41476 6.83847 4.76657 6.83847 7.66775V10.5612H8.64544V7.66775C8.64544 5.76968 10.1762 4.231 12.0646 4.231Z" fill="#D5D7DB"/>
					<path fill-rule="evenodd" clip-rule="evenodd" d="M7.14721 10.3237C6.12854 10.3237 5.30273 11.1495 5.30273 12.1682V18.506C5.30273 19.5246 6.12854 20.3504 7.14722 20.3504H17.1029C18.1216 20.3504 18.9474 19.5246 18.9474 18.506V12.1682C18.9474 11.1495 18.1216 10.3237 17.1029 10.3237H7.14721ZM12.9216 15.5869C12.9216 15.5685 12.93 15.5512 12.944 15.5392C13.2142 15.3085 13.3859 14.9643 13.3859 14.5797C13.3859 13.8847 12.8259 13.3214 12.1353 13.3214C11.4446 13.3214 10.8846 13.8847 10.8846 14.5797C10.8846 14.9643 11.0563 15.3085 11.3266 15.5392C11.3406 15.5512 11.3489 15.5685 11.3489 15.5869V16.7572C11.3489 17.1915 11.701 17.5435 12.1353 17.5435C12.5696 17.5435 12.9216 17.1915 12.9216 16.7572V15.5869Z" fill="#D5D7DB"/>
				</svg>
				<SubdivisionAddButton
					v-if="showSubdivisionAddButton"
					:entityId="nodeId"
					:entityType="nodeData.entityType"
					@click.stop
				></SubdivisionAddButton>
			</div>
			<div
				v-if="nodeData.parentId === 0 && !hasChildren"
				class="humanresources-tree__node_empty-skeleton"
			></div>
			<div
				v-if="hasChildren"
				v-dnd="canvasZoom"
				ref="childrenNode"
				class="humanresources-tree__node_children"
				:style="childNodeStyle"
			>
				<TransitionGroup>
					<treeNode
						v-for="id in nodeData.children"
						v-if="isExpanded || childrenMounted"
						v-show="isExpanded"
						:ref="'node-' + id"
						:key="id"
						:nodeId="id"
						:expandedNodes="expandedNodes"
						:canvasZoom="canvasZoom"
						:currentDepartments="currentDepartments"
						:isShown="isExpanded"
						@calculatePosition="calculatePosition"
					/>
				</TransitionGroup>
			</div>
		</div>
	`
	};

	// @vue/component
	const Connectors = {
	  name: 'companyTreeConnectors',
	  expose: ['toggleConnectorsVisibility', 'toggleConnectorHighlighting', 'adaptConnectorsAfterReorder'],
	  props: {
	    isLocatedDepartmentVisible: {
	      type: Boolean,
	      required: true
	    },
	    /** @type Map */
	    treeNodes: {
	      type: Object,
	      required: true
	    }
	  },
	  data() {
	    return {
	      connectors: {}
	    };
	  },
	  computed: {
	    ...ui_vue3_pinia.mapState(humanresources_companyStructure_chartStore.useChartStore, ['focusedNode', 'departments'])
	  },
	  created() {
	    this.subscribeOnEvents();
	    this.prevWindowWidth = window.innerWidth;
	  },
	  beforeUnmount() {
	    this.unsubscribeFromEvents();
	  },
	  methods: {
	    onAddConnector({
	      data
	    }) {
	      var _this$connectors;
	      const {
	        id,
	        parentId
	      } = data;
	      if (!parentId) {
	        return;
	      }
	      const connector = (_this$connectors = this.connectors[`${parentId}-${id}`]) != null ? _this$connectors : {};
	      Object.assign(connector, data);
	      if (connector.highlighted) {
	        delete this.connectors[`${parentId}-${id}`];
	      }
	      this.connectors[`${parentId}-${id}`] = {
	        show: true,
	        highlighted: false,
	        ...connector
	      };
	    },
	    onRemoveConnector({
	      data
	    }) {
	      const {
	        parentId,
	        id
	      } = data;
	      delete this.connectors[`${parentId}-${id}`];
	    },
	    onAdaptSiblingConnectors({
	      data
	    }) {
	      const {
	        nodeId,
	        parentId,
	        offset
	      } = data;
	      const parentDepartment = this.departments.get(parentId);
	      if (parentDepartment.children.includes(nodeId)) {
	        this.adaptConnectorsAfterMount(parentId, nodeId, offset);
	        return;
	      }
	      this.adaptConnectorsAfterUnmount(parentId, nodeId, offset);
	    },
	    adaptConnectorsAfterMount(parentId, nodeId, offset) {
	      Object.values(this.connectors).forEach(connector => {
	        if (!connector.id) {
	          return;
	        }
	        if (connector.parentId === parentId) {
	          const {
	            x
	          } = connector.endPoint;
	          Object.assign(connector.endPoint, {
	            x: x + offset
	          });
	          return;
	        }
	        if (connector.parentsPath.includes(parentId)) {
	          const {
	            startPoint: currentStartPoint,
	            endPoint
	          } = connector;
	          Object.assign(currentStartPoint, {
	            x: currentStartPoint.x + offset
	          });
	          Object.assign(endPoint, {
	            x: endPoint.x + offset
	          });
	        }
	      });
	    },
	    adaptConnectorsAfterUnmount(parentId, nodeId, offset) {
	      const values = Object.values(this.connectors);
	      const {
	        endPoint
	      } = this.connectors[`${parentId}-${nodeId}`];
	      const parsedSiblingConnectors = values.reduce((acc, connector) => {
	        const {
	          endPoint: currentEndPoint,
	          id,
	          parentId: currentParentId
	        } = connector;
	        if (currentParentId !== parentId || id === nodeId) {
	          return acc;
	        }
	        const sign = endPoint.x > currentEndPoint.x ? 1 : -1;
	        return {
	          ...acc,
	          [id]: sign
	        };
	      }, {});
	      values.forEach(connector => {
	        const {
	          id: currentId,
	          parentId: currentParentId,
	          parentsPath,
	          endPoint: currentEndPoint,
	          startPoint: currentStartPoint
	        } = connector;
	        if (currentId === nodeId) {
	          return;
	        }
	        if (currentParentId === parentId) {
	          const {
	            x
	          } = currentEndPoint;
	          const sign = parsedSiblingConnectors[currentId];
	          Object.assign(currentEndPoint, {
	            x: x + offset * sign
	          });
	          return;
	        }
	        const ancestorId = parentsPath == null ? void 0 : parentsPath.find(id => {
	          return Boolean(parsedSiblingConnectors[id]);
	        });
	        if (ancestorId) {
	          const ancestorSign = parsedSiblingConnectors[ancestorId];
	          Object.assign(currentStartPoint, {
	            x: currentStartPoint.x + offset * ancestorSign
	          });
	          Object.assign(currentEndPoint, {
	            x: currentEndPoint.x + offset * ancestorSign
	          });
	        }
	      });
	    },
	    adaptConnectorsAfterReorder(ids, shift, isRoot) {
	      ids.forEach(departmentId => {
	        const {
	          parentId,
	          children
	        } = this.departments.get(departmentId);
	        const connector = this.connectors[`${parentId}-${departmentId}`];
	        if (!connector) {
	          return;
	        }
	        Object.assign(connector.endPoint, {
	          x: connector.endPoint.x + shift
	        });
	        if (!isRoot) {
	          Object.assign(connector.startPoint, {
	            x: connector.startPoint.x + shift
	          });
	        }
	        if ((children == null ? void 0 : children.length) > 0) {
	          this.adaptConnectorsAfterReorder(children, shift, false);
	        }
	      });
	    },
	    onAdaptConnectorHeight({
	      data
	    }) {
	      const {
	        shift,
	        nodeId
	      } = data;
	      Object.values(this.connectors).forEach(connector => {
	        if (connector.parentId === nodeId) {
	          Object.assign(connector.startPoint, {
	            y: connector.startPoint.y + shift
	          });
	        }
	      });
	    },
	    toggleConnectorsVisibility(parentId, show, expandedNodes) {
	      const {
	        children
	      } = this.departments.get(parentId);
	      children.forEach(childId => {
	        var _this$connectors2;
	        const connector = (_this$connectors2 = this.connectors[`${parentId}-${childId}`]) != null ? _this$connectors2 : {};
	        this.connectors = {
	          ...this.connectors,
	          [`${parentId}-${childId}`]: {
	            ...connector,
	            show
	          }
	        };
	        if (expandedNodes.includes(childId)) {
	          this.toggleConnectorsVisibility(childId, show, expandedNodes);
	        }
	      });
	    },
	    toggleConnectorHighlighting(nodeId, expanded) {
	      var _this$connectors3;
	      const {
	        parentId
	      } = this.departments.get(nodeId);
	      if (!parentId) {
	        return;
	      }
	      if (!expanded) {
	        this.connectors[`${parentId}-${nodeId}`] = {
	          ...this.connectors[`${parentId}-${nodeId}`],
	          highlighted: false
	        };
	        return;
	      }
	      const highlightedConnector = (_this$connectors3 = this.connectors[`${parentId}-${nodeId}`]) != null ? _this$connectors3 : {};
	      delete this.connectors[`${parentId}-${nodeId}`];
	      this.connectors = {
	        ...this.connectors,
	        [`${parentId}-${nodeId}`]: {
	          ...highlightedConnector,
	          highlighted: true
	        }
	      };
	    },
	    getPath(id) {
	      const connector = this.connectors[id];
	      const {
	        startPoint,
	        endPoint,
	        parentId
	      } = connector;
	      if (!startPoint || !endPoint) {
	        return '';
	      }
	      let verticalLineHeight = 115;
	      const parentNode = this.treeNodes.get(parentId);
	      const parentNodeStyle = getComputedStyle(parentNode);
	      const minDepartmentHeight = parseInt(parentNodeStyle.getPropertyValue('--min-height'), 10);
	      const diffHeight = parentNode.offsetHeight - minDepartmentHeight;
	      verticalLineHeight = diffHeight > 0 ? verticalLineHeight - diffHeight : verticalLineHeight;
	      const shiftY = 1;
	      const startY = startPoint.y - shiftY;
	      const shadowOffset = this.focusedNode === connector.id ? 12 : 0;
	      const rounded = {
	        start: '',
	        end: ''
	      };
	      let arcRadius = 0;
	      if (Math.round(startPoint.x) > Math.round(endPoint.x)) {
	        arcRadius = 15;
	        rounded.start = 'a15,15 0 0 1 -15,15';
	        rounded.end = 'a15,15 0 0 0 -15,15';
	      } else if (Math.round(startPoint.x) < Math.round(endPoint.x)) {
	        arcRadius = -15;
	        rounded.start = 'a15,15 0 0 0 15,15';
	        rounded.end = 'a15,15 0 0 1 15,15';
	      }
	      const adjustedEndY = endPoint.y - shadowOffset;
	      return [`M${startPoint.x} ${startY}`, `V${startY + verticalLineHeight}`, `${String(rounded.start)}`, `H${endPoint.x + arcRadius}`, `${String(rounded.end)}`, `V${adjustedEndY}`].join('');
	    },
	    subscribeOnEvents() {
	      this.events = {
	        [events.HR_DEPARTMENT_CONNECT]: this.onAddConnector,
	        [events.HR_DEPARTMENT_DISCONNECT]: this.onRemoveConnector,
	        [events.HR_DEPARTMENT_ADAPT_SIBLINGS]: this.onAdaptSiblingConnectors,
	        [events.HR_DEPARTMENT_ADAPT_CONNECTOR_HEIGHT]: this.onAdaptConnectorHeight
	      };
	      Object.entries(this.events).forEach(([event, handle]) => {
	        main_core_events.EventEmitter.subscribe(event, handle);
	      });
	      main_core.Event.bind(window, 'resize', this.onResizeWindow);
	    },
	    unsubscribeFromEvents() {
	      Object.entries(this.events).forEach(([event, handle]) => {
	        main_core_events.EventEmitter.unsubscribe(event, handle);
	      });
	      main_core.Event.unbind(window, 'resize', this.onResizeWindow);
	    },
	    onResizeWindow() {
	      const offset = (window.innerWidth - this.prevWindowWidth) / 2;
	      this.prevWindowWidth = window.innerWidth;
	      if (offset === 0) {
	        return;
	      }
	      Object.keys(this.connectors).forEach(key => {
	        const connector = this.connectors[key];
	        if (connector.startPoint && connector.endPoint) {
	          const startPointX = connector.startPoint.x;
	          const endPointX = connector.endPoint.x;
	          Object.assign(connector.startPoint, {
	            x: startPointX + offset
	          });
	          Object.assign(connector.endPoint, {
	            x: endPointX + offset
	          });
	        }
	      });
	    }
	  },
	  template: `
		<svg class="humanresources-tree__connectors" fill="none">
			<marker
				id='arrow'
				markerUnits='userSpaceOnUse'
				markerWidth='20'
				markerHeight='12'
				refX='10'
				refY='10.5'
			>
				<path d="M1 1L10 10L19 1" class="--highlighted" />
			</marker>
			<path
				v-for="(connector, id) in connectors"
				v-show="connector.show"
				:ref="id"
				:marker-end="connector.highlighted ? 'url(#arrow)' : null"
				:class="{ '--highlighted': connector.highlighted }"
				:id="id"
				:d="getPath(id)"
			></path>
		</svg>
	`
	};

	const createTreeDataStore = treeData => {
	  const dataMap = new Map();
	  treeData.forEach(item => {
	    var _dataMap$get, _dataMap$get2, _mapParentItem$childr;
	    const {
	      id,
	      parentId,
	      colorName,
	      entityType
	    } = item;
	    const mapItem = (_dataMap$get = dataMap.get(id)) != null ? _dataMap$get : {};
	    const teamColor = humanresources_companyStructure_utils.getNodeColorSettings(colorName, entityType);
	    dataMap.set(id, {
	      ...mapItem,
	      ...item,
	      teamColor
	    });
	    if (parentId === 0) {
	      return;
	    }
	    const mapParentItem = (_dataMap$get2 = dataMap.get(parentId)) != null ? _dataMap$get2 : {};
	    const children = (_mapParentItem$childr = mapParentItem.children) != null ? _mapParentItem$childr : [];
	    dataMap.set(parentId, {
	      ...mapParentItem,
	      children: [...children, id]
	    });
	  });
	  return dataMap;
	};
	const chartAPI = {
	  removeDepartment: id => {
	    return humanresources_companyStructure_api.getData('humanresources.api.Structure.Node.delete', {
	      nodeId: id
	    });
	  },
	  getDepartmentsData: () => {
	    return humanresources_companyStructure_api.getData('humanresources.api.Structure.get', {}, {
	      tool: 'structure',
	      category: 'structure',
	      event: 'open_structure'
	    });
	  },
	  getCurrentDepartments: () => {
	    return humanresources_companyStructure_api.getData('humanresources.api.Structure.Node.current');
	  },
	  getDictionary: () => {
	    return humanresources_companyStructure_api.getData('humanresources.api.Structure.dictionary');
	  },
	  getUserId: () => {
	    return humanresources_companyStructure_api.getData('humanresources.api.User.getCurrentId');
	  },
	  firstTimeOpened: () => {
	    return humanresources_companyStructure_api.postData('humanresources.api.User.firstTimeOpen');
	  },
	  createTreeDataStore
	};

	// @vue/component
	const Tree = {
	  name: 'companyTree',
	  components: {
	    TreeNode,
	    Connectors
	  },
	  provide() {
	    return {
	      getTreeBounds: () => this.getTreeBounds()
	    };
	  },
	  props: {
	    canvasZoom: {
	      type: Number,
	      required: true
	    }
	  },
	  emits: ['moveTo', 'showWizard', 'controlDetail'],
	  data() {
	    return {
	      expandedNodes: [],
	      isLocatedDepartmentVisible: false
	    };
	  },
	  computed: {
	    rootId() {
	      const {
	        id: rootId
	      } = [...this.departments.values()].find(department => {
	        return department.parentId === 0;
	      });
	      return rootId;
	    },
	    connectors() {
	      return this.$refs.connectors;
	    },
	    ...ui_vue3_pinia.mapState(humanresources_companyStructure_chartStore.useChartStore, ['currentDepartments', 'userId', 'focusedNode', 'departments'])
	  },
	  created() {
	    this.treeNodes = new Map();
	    this.subscribeOnEvents();
	    this.loadHeads([this.rootId]);
	  },
	  mounted() {
	    const departmentToFocus = this.getDepartmentIdForInitialFocus();
	    this.currentDepartmentsLocated = [departmentToFocus];
	    if (departmentToFocus !== this.rootId) {
	      this.expandDepartmentParents(departmentToFocus);
	      this.focus(departmentToFocus, {
	        expandAfterFocus: true
	      });
	      return;
	    }
	    this.expandLowerDepartments();
	    this.focus(departmentToFocus);
	  },
	  beforeUnmount() {
	    this.unsubscribeFromEvents();
	  },
	  methods: {
	    getDepartmentIdForInitialFocus() {
	      const providedFocusNodeId = UrlProvidedParamsService.getParams().focusNodeId;
	      if (providedFocusNodeId) {
	        const node = this.departments.get(providedFocusNodeId);
	        if (node) {
	          return providedFocusNodeId;
	        }
	      }
	      for (const currentDepartmentId of this.currentDepartments) {
	        const node = this.departments.get(currentDepartmentId);
	        if (node.entityType === humanresources_companyStructure_utils.EntityTypes.department) {
	          return currentDepartmentId;
	        }
	      }
	      return this.rootId;
	    },
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    getTreeBounds() {
	      return this.$el.getBoundingClientRect();
	    },
	    onConnectDepartment({
	      data
	    }) {
	      const {
	        id,
	        html
	      } = data;
	      this.treeNodes.set(id, html);
	      const departmentIdToFocus = this.getDepartmentIdForInitialFocus();
	      if (id === departmentIdToFocus)
	        // zoom to  department when loading
	        {
	          const movingDelay = 1800;
	          main_core.Runtime.debounce(() => {
	            this.moveTo(departmentIdToFocus);
	          }, movingDelay)();
	        }
	    },
	    onDisconnectDepartment({
	      data
	    }) {
	      const {
	        id
	      } = data;
	      const department = this.departments.get(id);
	      delete department.prevParentId;
	      if (!department.parentId) {
	        OrgChartActions.removeDepartment(id);
	      }
	    },
	    onDragDepartment({
	      data
	    }) {
	      const {
	        draggedId
	      } = data;
	      const department = this.departments.get(draggedId);
	      const {
	        parentId
	      } = department;
	      const parentDepartment = this.departments.get(parentId);
	      parentDepartment.children.forEach(childId => {
	        if (this.expandedNodes.includes(childId)) {
	          this.collapse(childId);
	        }
	      });
	    },
	    onToggleConnectors({
	      data
	    }) {
	      const {
	        draggedId,
	        shouldShow
	      } = data;
	      const department = this.departments.get(draggedId);
	      const {
	        parentId
	      } = department;
	      this.connectors.toggleConnectorsVisibility(parentId, shouldShow, this.expandedNodes);
	    },
	    async onDropDepartment({
	      data
	    }) {
	      const {
	        draggedId,
	        targetId,
	        affectedItems,
	        direction
	      } = data;
	      const promise = OrgChartActions.orderDepartments(draggedId, targetId, direction, affectedItems.length);
	      const fullDepartmentWidth = 302;
	      const draggedShift = affectedItems.length * direction * fullDepartmentWidth;
	      this.connectors.adaptConnectorsAfterReorder([draggedId], draggedShift, true);
	      const affectedShift = -direction * fullDepartmentWidth;
	      this.connectors.adaptConnectorsAfterReorder(affectedItems, affectedShift, true);
	      const ordered = await promise;
	      if (!ordered) {
	        this.connectors.adaptConnectorsAfterReorder([draggedId], -draggedShift, true);
	        this.connectors.adaptConnectorsAfterReorder(affectedItems, -affectedShift, true);
	      }
	    },
	    onPublicFocusNode({
	      data
	    }) {
	      const {
	        nodeId
	      } = data;
	      const node = this.departments.get(nodeId);
	      if (!node) {
	        return;
	      }
	      void this.locateToDepartment(nodeId);
	    },
	    collapse(nodeId) {
	      this.expandedNodes = this.expandedNodes.filter(expandedId => expandedId !== nodeId);
	      this.connectors.toggleConnectorsVisibility(nodeId, false, this.expandedNodes);
	      this.connectors.toggleConnectorHighlighting(nodeId, false);
	    },
	    collapseRecursively(nodeId) {
	      const deepCollapse = id => {
	        var _node$children;
	        this.collapse(id);
	        const node = this.departments.get(id);
	        (_node$children = node.children) == null ? void 0 : _node$children.forEach(childId => {
	          if (this.expandedNodes.includes(childId)) {
	            deepCollapse(childId);
	          }
	        });
	      };
	      const {
	        parentId
	      } = this.departments.get(nodeId);
	      const expandedNode = this.expandedNodes.find(id => {
	        const node = this.departments.get(id);
	        return node.parentId === parentId;
	      });
	      if (expandedNode) {
	        deepCollapse(expandedNode);
	      }
	    },
	    expand(departmentId) {
	      this.collapseRecursively(departmentId);
	      this.expandedNodes = [...this.expandedNodes, departmentId];
	      this.connectors.toggleConnectorsVisibility(departmentId, true, this.expandedNodes);
	      this.connectors.toggleConnectorHighlighting(departmentId, true);
	      const department = this.departments.get(departmentId);
	      const childrenWithoutHeads = department.children.filter(childId => {
	        return !this.departments.get(childId).heads;
	      });
	      if (childrenWithoutHeads.length > 0) {
	        this.loadHeads(childrenWithoutHeads);
	      }
	      ui_analytics.sendData({
	        tool: 'structure',
	        category: 'structure',
	        event: 'expand_department'
	      });
	    },
	    focus(nodeId, options = {}) {
	      var _this$departments$get;
	      const {
	        expandAfterFocus = false,
	        showEmployees = false,
	        subdivisionsSelected = false
	      } = options;
	      const hasChildren = ((_this$departments$get = this.departments.get(nodeId).children) == null ? void 0 : _this$departments$get.length) > 0;
	      let shouldExpand = expandAfterFocus || !this.expandedNodes.includes(nodeId);
	      if (showEmployees) {
	        shouldExpand = this.expandedNodes.includes(nodeId);
	      }
	      if (subdivisionsSelected || !hasChildren) {
	        this.collapseRecursively(nodeId);
	      }
	      if (hasChildren && shouldExpand) {
	        this.expand(nodeId);
	      }
	      if (this.focusedNode && !this.expandedNodes.includes(this.focusedNode)) {
	        this.connectors.toggleConnectorHighlighting(this.focusedNode, false);
	      }
	      OrgChartActions.focusDepartment(nodeId);
	      this.connectors.toggleConnectorHighlighting(this.focusedNode, true);
	    },
	    onFocusDepartment({
	      data
	    }) {
	      const {
	        nodeId,
	        showEmployees,
	        subdivisionsSelected
	      } = data;
	      this.focus(nodeId, {
	        showEmployees,
	        subdivisionsSelected
	      });
	      this.$emit('controlDetail', {
	        showEmployees,
	        preventSwitch: subdivisionsSelected
	      });
	    },
	    tryRemoveDepartment(nodeId, entityType) {
	      const localizationMap = {
	        team: {
	          title: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIRM_REMOVE_TEAM_TITLE'),
	          message: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIRM_REMOVE_TEAM_MESSAGE'),
	          success: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIRM_REMOVE_TEAM_REMOVED'),
	          error: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIRM_REMOVE_TEAM_ERROR')
	        },
	        default: {
	          title: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIRM_REMOVE_DEPARTMENT_TITLE'),
	          message: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIRM_REMOVE_DEPARTMENT_MESSAGE'),
	          success: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIRM_REMOVE_DEPARTMENT_REMOVED'),
	          error: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIRM_REMOVE_DEPARTMENT_ERROR')
	        }
	      };
	      const mapIndex = entityType === humanresources_companyStructure_utils.EntityTypes.team ? 'team' : 'default';
	      const messageBox = ui_dialogs_messagebox.MessageBox.create({
	        title: localizationMap[mapIndex].title,
	        message: localizationMap[mapIndex].message,
	        buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
	        onOk: async dialog => {
	          try {
	            await this.removeDepartment(nodeId);
	            ui_notification.UI.Notification.Center.notify({
	              content: localizationMap[mapIndex].success,
	              autoHideDelay: 2000
	            });
	            dialog.close();
	          } catch {
	            ui_notification.UI.Notification.Center.notify({
	              content: localizationMap[mapIndex].error,
	              autoHideDelay: 2000
	            });
	          }
	        },
	        onCancel: dialog => dialog.close(),
	        minWidth: 250,
	        maxWidth: 320,
	        minHeight: 175,
	        okCaption: this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_CONFIRM_REMOVE_DEPARTMENT_OK_CAPTION'),
	        popupOptions: {
	          className: 'humanresources-tree__message-box',
	          overlay: {
	            opacity: 40
	          }
	        }
	      });
	      const okButton = messageBox.getOkButton();
	      const cancelButton = messageBox.getCancelButton();
	      okButton.setRound(true);
	      cancelButton.setRound(true);
	      okButton.setColor(ui_buttons.ButtonColor.DANGER);
	      cancelButton.setColor(ui_buttons.ButtonColor.LIGHT_BORDER);
	      messageBox.show();
	    },
	    async removeDepartment(nodeId) {
	      await chartAPI.removeDepartment(nodeId);
	      const removableDepartment = this.departments.get(nodeId);
	      const {
	        parentId,
	        children: removableDepartmentChildren = []
	      } = removableDepartment;
	      if (removableDepartmentChildren.length > 0) {
	        this.collapse(nodeId);
	      }
	      OrgChartActions.moveSubordinatesToParent(nodeId);
	      await this.$nextTick();
	      OrgChartActions.markDepartmentAsRemoved(nodeId);
	      this.focus(parentId, {
	        expandAfterFocus: true
	      });
	      this.moveTo(parentId);
	    },
	    expandDepartmentParents(nodeId) {
	      let {
	        parentId
	      } = this.departments.get(nodeId);
	      while (parentId) {
	        if (!this.expandedNodes.includes(parentId)) {
	          this.expand(parentId);
	        }
	        parentId = this.departments.get(parentId).parentId;
	      }
	    },
	    expandLowerDepartments() {
	      let expandLevel = 0;
	      const expandRecursively = departmentId => {
	        var _this$departments$get2;
	        const {
	          children = []
	        } = this.departments.get(departmentId);
	        if (expandLevel === 4 || children.length === 0) {
	          return;
	        }
	        this.expand(departmentId);
	        expandLevel += 1;
	        const middleBound = Math.trunc(children.length / 2);
	        const childId = children[middleBound];
	        if (((_this$departments$get2 = this.departments.get(childId).children) == null ? void 0 : _this$departments$get2.length) > 0) {
	          expandRecursively(childId);
	          return;
	        }
	        for (let i = middleBound - 1; i >= 0; i--) {
	          if (traverseSibling(children[i])) {
	            return;
	          }
	        }
	        for (let i = middleBound + 1; i < children.length; i++) {
	          if (traverseSibling(children[i])) {
	            return;
	          }
	        }
	      };
	      const traverseSibling = siblingId => {
	        const {
	          children: currentChildren = []
	        } = this.departments.get(siblingId);
	        if (currentChildren.length > 0) {
	          expandRecursively(siblingId);
	          return true;
	        }
	        return false;
	      };
	      expandRecursively(this.rootId);
	    },
	    async locateToCurrentDepartment() {
	      // currentDepartmentsLocated manipulation needed to cycle through current departments
	      if (this.currentDepartmentsLocated.length === this.currentDepartments.length) {
	        this.currentDepartmentsLocated = [];
	      }
	      const currentDepartment = this.currentDepartments.find(item => !this.currentDepartmentsLocated.includes(item));
	      if (!currentDepartment) {
	        return;
	      }
	      this.currentDepartmentsLocated.push(currentDepartment);
	      await this.locateToDepartment(currentDepartment);
	      OrgChartActions.searchUserInDepartment(this.userId);
	    },
	    async locateToDepartment(nodeId) {
	      this.isLocatedDepartmentVisible = false;
	      this.expandDepartmentParents(nodeId);
	      this.focus(nodeId, {
	        expandAfterFocus: true
	      });
	      // $nextTick makes sure that this.getTreeBounds() returns correct value when nodeId is not visible
	      await this.$nextTick();
	      this.isLocatedDepartmentVisible = true;
	      await this.moveTo(nodeId);
	    },
	    async moveTo(nodeId) {
	      await this.$nextTick();
	      const treeRect = this.getTreeBounds();
	      const centerX = treeRect.x + treeRect.width / 2;
	      const centerY = treeRect.y + treeRect.height / 2;
	      const treeNode = this.treeNodes.get(nodeId);
	      const treeNodeRect = treeNode.getBoundingClientRect();
	      this.$emit('moveTo', {
	        x: centerX - treeNodeRect.x - treeNodeRect.width / 2,
	        y: centerY - treeNodeRect.y - treeNodeRect.height / 2,
	        nodeId
	      });
	    },
	    loadHeads(departmentIds) {
	      const store = humanresources_companyStructure_chartStore.useChartStore();
	      store.loadHeads(departmentIds);
	    },
	    subscribeOnEvents() {
	      this.events = {
	        [events.HR_DEPARTMENT_CONNECT]: this.onConnectDepartment,
	        [events.HR_DEPARTMENT_DISCONNECT]: this.onDisconnectDepartment,
	        [events.HR_DEPARTMENT_FOCUS]: this.onFocusDepartment,
	        [events.HR_DRAG_DEPARTMENT]: this.onDragDepartment,
	        [events.HR_DROP_DEPARTMENT]: this.onDropDepartment,
	        [events.HR_DEPARTMENT_TOGGLE_CONNECTORS]: this.onToggleConnectors,
	        [events.HR_PUBLIC_FOCUS_NODE]: this.onPublicFocusNode
	      };
	      Object.entries(this.events).forEach(([event, handle]) => {
	        main_core_events.EventEmitter.subscribe(event, handle);
	      });
	    },
	    unsubscribeFromEvents() {
	      Object.entries(this.events).forEach(([event, handle]) => {
	        main_core_events.EventEmitter.unsubscribe(event, handle);
	      });
	    }
	  },
	  template: `
		<div
			class="humanresources-tree"
			v-if="departments.size > 0"
		>
			<TreeNode
				class="--root"
				:key="rootId"
				:nodeId="rootId"
				:expandedNodes="[...expandedNodes]"
				:canvasZoom="canvasZoom"
				:currentDepartments="currentDepartments"
			></TreeNode>
			<Connectors
				ref="connectors"
				:isLocatedDepartmentVisible="isLocatedDepartmentVisible"
				:treeNodes="treeNodes"
			></Connectors>
		</div>
	`
	};

	// @vue/component
	const TransformPanel = {
	  name: 'transform-panel',
	  props: {
	    modelValue: {
	      type: Object,
	      required: true
	    }
	  },
	  emits: ['locate', 'update:modelValue'],
	  data() {
	    return {
	      selectedId: ''
	    };
	  },
	  computed: {
	    zoomInPercent() {
	      const percent = '<span class="humanresources-transform-panel__zoom_percent">%</span>';
	      return `${(this.modelValue.zoom * 100).toFixed(0)}${percent}`;
	    }
	  },
	  created() {
	    this.actions = Object.freeze({
	      zoomIn: 'zoomIn',
	      zoomOut: 'zoomOut',
	      locate: 'locate',
	      navigate: 'navigate'
	    });
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    onZoom(zoomIn) {
	      const leftBound = 0.2;
	      const rightBound = 3;
	      let direction = -1;
	      if (zoomIn) {
	        direction = 1;
	        this.selectedId = this.actions.zoomIn;
	      } else {
	        this.selectedId = this.actions.zoomOut;
	      }
	      const zoom = Number((this.modelValue.zoom + leftBound * direction).toFixed(1));
	      if (zoom < leftBound || zoom > rightBound) {
	        return;
	      }

	      // calibrate x and y according to viewpoint center
	      const treeRect = this.$parent.$refs.tree.getTreeBounds();
	      const centerX = treeRect.width / 2 / this.modelValue.zoom - detailPanelWidth / 2;
	      const centerY = treeRect.height / 2 / this.modelValue.zoom;
	      const oldCenterX = (centerX - this.modelValue.x) / this.modelValue.zoom;
	      const oldCenterY = (centerY - this.modelValue.y) / this.modelValue.zoom;
	      const x = centerX - oldCenterX * zoom;
	      const y = centerY - oldCenterY * zoom;
	      this.$emit('update:modelValue', {
	        ...this.modelValue,
	        zoom,
	        x,
	        y
	      });
	    },
	    onLocate() {
	      const {
	        locate
	      } = this.actions;
	      this.$emit(locate);
	      this.selectedId = locate;
	    },
	    onfocusout() {
	      this.selectedId = '';
	    }
	  },
	  template: `
		<div class="humanresources-transform-panel" @focusout="onfocusout" tabindex="-1">
			<div
				class="humanresources-transform-panel__locate"
				:class="{ '--selected': selectedId === actions.locate }"
				@click="onLocate"
			>
				{{loc('HUMANRESOURCES_COMPANY_STRUCTURE_TREE_LOCATE')}}
			</div>
			<div class="humanresources-transform-panel__separator"></div>
			<div class="humanresources-transform-panel__zoom">
				<svg
					viewBox="0 0 16 16"
					fill="none"
					class="humanresources-transform-panel__icon --zoom-out"
					:class="{ '--selected': selectedId === actions.zoomOut }"
					@click="onZoom(false)"
				>
					<path fill-rule="evenodd" clip-rule="evenodd" d="M4 8.66671V7.33337H7.33333H8.66667H12V8.66671H8.66667H7.33333H4Z" fill="#6A737F"/>
				</svg>
				<span v-html="zoomInPercent"></span>
				<svg
					viewBox="0 0 16 16"
					fill="none"
					class="humanresources-transform-panel__icon --zoom-in"
					:class="{ '--selected': selectedId === actions.zoomIn }"
					@click="onZoom(true)"
				>
					<path fill-rule="evenodd" clip-rule="evenodd" d="M7.83333 4H9.16667V7.33333H12.5V8.66667H9.16667V12H7.83333V8.66667H4.5V7.33333H7.83333V4Z" fill="#6A737F"/>
				</svg>
			</div>
		</div>
	`
	};

	// @vue/component
	const DetailPanelCollapsedTitle = {
	  name: 'detailPanelCollapsedTitle',
	  props: {
	    title: {
	      type: String,
	      required: true
	    },
	    avatars: {
	      type: Array,
	      required: true
	    }
	  },
	  computed: {
	    maxVisibleAvatarsCount() {
	      return 2;
	    },
	    additionalCount() {
	      return this.avatars.length > this.maxVisibleAvatarsCount ? this.avatars.length - this.maxVisibleAvatarsCount : 0;
	    }
	  },
	  template: `
		<div class="humanresources-detail-panel__collapsed-title">
			<template v-for="(avatar, index) in avatars">
				<img
					v-if="index < this.maxVisibleAvatarsCount"
					:key="index"
					:src="encodeURI(avatar)"
					class="humanresources-detail-panel__collapsed-title-avatar"
				/>
			</template>
			<div
				v-if="avatars.length > maxVisibleAvatarsCount"
				class="humanresources-detail-panel__collapsed-title-avatar --additional"
			>
			 +{{ additionalCount }}
			</div>
			<div class="humanresources-detail-panel__title">{{ title }}</div>
		</div>
	`
	};

	/**
	 * Component for displaying icon that shows EntityActionMenu
	 */
	// @vue/component
	const DetailPanelEditButton = {
	  name: 'detailPanelEditButton',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    RouteActionMenu: humanresources_companyStructure_structureComponents.RouteActionMenu
	  },
	  props: {
	    entityId: {
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
	    set() {
	      return ui_iconSet_api_vue.Set;
	    },
	    menu() {
	      return new EntityActionMenu(this.entityId, this.entityType, humanresources_companyStructure_api.AnalyticsSourceType.DETAIL);
	    }
	  },
	  methods: {
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    },
	    onActionMenuItemClick(actionId) {
	      this.menu.onActionMenuItemClick(actionId);
	    }
	  },
	  template: `
		<div
			v-if="menu.items.length"
			class="humanresources-detail-panel__edit-button"
			:class="{ '--focused': menuVisible }"
			:ref="'detailPanelEditButton'"
			data-id="hr-department-detail-panel__edit-menu-button"
			@click.stop="menuVisible = true"
		>
			<BIcon
				class="humanresources-detail-panel__edit-button-icon"
				:name="set.MORE"
				:size="20"
			/>
		</div>
		<RouteActionMenu
			v-if="menuVisible"
			id="department-detail-content-edit-menu"
			:items="menu.items"
			:width="302"
			:bindElement="$refs.detailPanelEditButton"
			@action="onActionMenuItemClick"
			@close="menuVisible = false"
		/>
	`
	};

	// @vue/component
	const DetailPanel = {
	  name: 'detailPanel',
	  components: {
	    DepartmentContent: humanresources_companyStructure_departmentContent.DepartmentContent,
	    DetailPanelCollapsedTitle,
	    DetailPanelEditButton
	  },
	  directives: {
	    hint: humanresources_companyStructure_structureComponents.Hint
	  },
	  props: {
	    preventPanelSwitch: Boolean,
	    modelValue: Boolean
	  },
	  emits: ['showWizard', 'removeDepartment', 'update:modelValue'],
	  data() {
	    return {
	      title: '',
	      isTeamEntity: false,
	      teamColor: null,
	      isCollapsed: true,
	      isLoading: true,
	      needToShowLoader: false
	    };
	  },
	  computed: {
	    ...ui_vue3_pinia.mapState(humanresources_companyStructure_chartStore.useChartStore, ['focusedNode', 'departments']),
	    defaultAvatar() {
	      return '/bitrix/js/humanresources/company-structure/org-chart/src/images/default-user.svg';
	    },
	    headAvatarsArray() {
	      var _this$departments$get, _heads$filter$map, _heads$filter;
	      const heads = (_this$departments$get = this.departments.get(this.focusedNode).heads) != null ? _this$departments$get : [];
	      return (_heads$filter$map = heads == null ? void 0 : (_heads$filter = heads.filter(employee => employee.role === this.memberRoles.head)) == null ? void 0 : _heads$filter.map(employee => employee.avatar || this.defaultAvatar)) != null ? _heads$filter$map : [];
	    },
	    entityType() {
	      return this.departments.get(this.focusedNode).entityType;
	    },
	    memberRoles() {
	      return humanresources_companyStructure_api.getMemberRoles(this.entityType);
	    }
	  },
	  watch: {
	    focusedNode(newId, oldId) {
	      this.updateDetailPageHandler(newId, oldId);
	    },
	    modelValue(collapsed) {
	      this.isCollapsed = collapsed;
	    },
	    departments: {
	      handler(newDepartments) {
	        const department = newDepartments.get(this.focusedNode);
	        if (department) {
	          var _department$name;
	          this.title = (_department$name = department.name) != null ? _department$name : '';
	        }
	      },
	      deep: true
	    }
	  },
	  methods: {
	    toggleCollapse() {
	      this.$emit('update:modelValue', !this.isCollapsed);
	    },
	    updateDetailPageHandler(nodeId, oldId) {
	      var _department$name2, _department$teamColor;
	      if (!this.preventPanelSwitch && oldId !== 0) {
	        this.$emit('update:modelValue', false);
	      }
	      this.isLoading = true;
	      const department = this.departments.get(nodeId);
	      this.isTeamEntity = department.entityType === humanresources_companyStructure_utils.EntityTypes.team;
	      this.title = (_department$name2 = department.name) != null ? _department$name2 : '';
	      this.teamColor = (_department$teamColor = department.teamColor) != null ? _department$teamColor : null;
	      this.isLoading = false;
	    },
	    showLoader() {
	      this.needToShowLoader = true;
	    },
	    hideLoader() {
	      this.needToShowLoader = false;
	    }
	  },
	  template: `
		<div
			:class="['humanresources-detail-panel', { '--collapsed': isCollapsed }]"
			v-on="isCollapsed ? { click: toggleCollapse } : {}"
			data-id="hr-department-detail-panel__container"
		>
			<div
				v-if="!isLoading"
				class="humanresources-detail-panel-container"
				:class="{ '--hide': needToShowLoader && !isCollapsed }"
			>
				<div class="humanresources-detail-panel__head" 
					 :class="{ '--team': isTeamEntity, '--collapsed': isCollapsed }"
					 :style="{ '--team-head-background': teamColor?.treeHeadBackground }"
				>
					<span
						v-if="!isCollapsed"
						v-hint
						class="humanresources-detail-panel__title"
					>
						{{ title }}
					</span>
					<DetailPanelCollapsedTitle
						v-else
						:title="title"
						:avatars="headAvatarsArray"
					>
					</DetailPanelCollapsedTitle>
					<div class="humanresources-detail-panel__header_buttons_container">
						<DetailPanelEditButton
							v-if="!isCollapsed"
							:entityId="focusedNode"
							:entityType="entityType"
						/>
						<div
							class="humanresources-detail-panel__collapse_button --icon"
							@click="toggleCollapse"
							:class="{ '--collapsed': isCollapsed }"
							data-id="hr-department-detail-panel__collapse-button"
						/>
					</div>
				</div>
				<div class="humanresources-detail-panel__content" v-show="!isCollapsed">
					<DepartmentContent
						@showDetailLoader="showLoader"
						@hideDetailLoader="hideLoader"
						:isCollapsed="isCollapsed"
					/>
				</div>
			</div>
			<div v-if="needToShowLoader && !isCollapsed" class="humanresources-detail-panel-loader-container"/>
		</div>
	`
	};

	// @vue/component
	const FirstPopup = {
	  name: 'FirstPopup',
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  data() {
	    return {
	      show: false,
	      title: '',
	      description: '',
	      subDescription: '',
	      features: []
	    };
	  },
	  computed: {
	    set() {
	      return ui_iconSet_api_vue.Set;
	    }
	  },
	  async mounted() {
	    this.title = this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_FIRST_OPEN_TITLE');
	    this.description = this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_FIRST_OPEN_DESCRIPTION');
	    this.subDescription = this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_FIRST_OPEN_SUB_DESCRIPTION');
	    this.features = [this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_FIRST_OPEN_FEATURE_1'), this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_FIRST_OPEN_FEATURE_2'), this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_FIRST_OPEN_FEATURE_3'), this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_FIRST_OPEN_FEATURE_4'), this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_FIRST_OPEN_FEATURE_5'), this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_FIRST_OPEN_FEATURE_6'), this.loc('HUMANRESOURCES_COMPANY_STRUCTURE_FIRST_OPEN_FEATURE_7')];
	    const {
	      firstTimeOpened
	    } = await chartAPI.getDictionary();
	    this.show = firstTimeOpened === 'N' && this.title.length > 0;
	  },
	  methods: {
	    closePopup() {
	      chartAPI.firstTimeOpened();
	      this.show = false;
	      top.BX.Event.EventEmitter.emit(events.HR_FIRST_POPUP_SHOW);
	    },
	    loc(phraseCode, replacements = {}) {
	      return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
	    }
	  },
	  template: `
		<div v-if="show" class="first-popup">
			<div class="first-popup-overlay" @click="closePopup"></div>
			<div class="first-popup-content">
				<div class="title">{{ title }}</div>
				<div class="first-popup-left">
					<p class="description">{{ description }}</p>
					<p class="sub-description">{{ subDescription }}</p>
					<div class="first-popup-list">
						<div class="first-popup-list-item" v-for="(feature, index) in features" :key="index">
							<div class="first-popup-list-item-point">•</div>
							<div class="first-popup-list-item-feature">{{ feature }}</div>
						</div>
					</div>
					<button class="ui-btn ui-btn-success first-popup-ui-btn" @click="closePopup">
						{{ loc('HUMANRESOURCES_COMPANY_STRUCTURE_FIRST_OPEN_BUTTON_START') }}
					</button>
				</div>
				<div class="first-popup-right">
					<video
						src="/bitrix/js/humanresources/company-structure/org-chart/src/components/first-popup/images/preview.webm"
						autoplay
						loop
						muted
						playsinline
						class="first-popup-animation"
					></video>
				</div>
				<BIcon :name="set.CROSS_25" :size="24" class="first-popup-close" @click="closePopup"></BIcon>
			</div>
		</div>
	`
	};

	// @vue/component
	const Chart = {
	  components: {
	    TransformCanvas: ui_canvas.TransformCanvas,
	    Tree,
	    TransformPanel,
	    ChartWizard: humanresources_companyStructure_chartWizard.ChartWizard,
	    FirstPopup,
	    DetailPanel,
	    TitlePanel
	  },
	  data() {
	    return {
	      canvas: {
	        shown: false,
	        moving: false,
	        modelTransform: {
	          x: 0,
	          y: 0,
	          zoom: 0.3
	        }
	      },
	      wizard: {
	        shown: false,
	        isEditMode: false,
	        showEntitySelector: true,
	        entity: '',
	        nodeId: 0,
	        source: ''
	      },
	      detailPanel: {
	        collapsed: true,
	        preventSwitch: false
	      },
	      // there is no way to determine if transition was initial transition was due to initial zoom in
	      // so we block all controls until initial zoom in is completed
	      initTransitionCompleted: false
	    };
	  },
	  computed: {
	    rootId() {
	      const {
	        id: rootId
	      } = [...this.departments.values()].find(department => {
	        return department.parentId === 0;
	      });
	      return rootId;
	    },
	    ...ui_vue3_pinia.mapState(humanresources_companyStructure_chartStore.useChartStore, ['departments', 'currentDepartments'])
	  },
	  async created() {
	    const slider = BX.SidePanel.Instance.getTopSlider();
	    slider == null ? void 0 : slider.showLoader();
	    const [departments, currentDepartments, userId] = await Promise.all([chartAPI.getDepartmentsData(), chartAPI.getCurrentDepartments(), chartAPI.getUserId()]);
	    slider == null ? void 0 : slider.closeLoader();
	    const parsedDepartments = chartAPI.createTreeDataStore(departments);
	    const availableDepartments = currentDepartments.filter(item => parsedDepartments.has(item));
	    OrgChartActions.applyData(parsedDepartments, availableDepartments, userId);
	    this.rootOffset = 100;
	    this.transformCanvas();
	    this.canvas.shown = true;
	    this.showConfetti = false;
	    main_core_events.EventEmitter.subscribe(events.HR_DEPARTMENT_SLIDER_ON_MESSAGE, this.handleInviteSliderMessage);
	    BX.PULL.subscribe({
	      type: BX.PullClient.SubscriptionType.Server,
	      moduleId: 'humanresources',
	      command: 'linkChatsToNodes',
	      callback: data => this.clearChatLists(data)
	    });
	    main_core_events.EventEmitter.subscribe(events.HR_ENTITY_SHOW_WIZARD, this.showWizardEventHandler);
	    main_core_events.EventEmitter.subscribe(events.HR_ENTITY_REMOVE, this.removeDepartmentEventHandler);
	  },
	  unmounted() {
	    main_core_events.EventEmitter.unsubscribe(events.HR_DEPARTMENT_SLIDER_ON_MESSAGE, this.handleInviteSliderMessage);
	    main_core_events.EventEmitter.unsubscribe(events.HR_ENTITY_SHOW_WIZARD, this.showWizardEventHandler);
	    main_core_events.EventEmitter.unsubscribe(events.HR_ENTITY_REMOVE, this.removeDepartmentEventHandler);
	  },
	  methods: {
	    onMoveTo({
	      x,
	      y,
	      nodeId
	    }) {
	      const {
	        x: prevX,
	        y: prevY,
	        zoom
	      } = this.canvas.modelTransform;
	      const detailPanelWidthZoomed = detailPanelWidth * zoom;
	      const newX = x - detailPanelWidthZoomed / 2;
	      const newY = nodeId === this.rootId ? this.rootOffset : y / zoom;
	      const samePoint = Math.round(newX) === Math.round(prevX) && Math.round(y) === Math.round(prevY);
	      this.detailPanel = {
	        ...this.detailPanel,
	        collapsed: false
	      };
	      if (samePoint) {
	        return;
	      }
	      this.canvas = {
	        ...this.canvas,
	        moving: true,
	        modelTransform: {
	          ...this.canvas.modelTransform,
	          x: newX / zoom,
	          y: newY,
	          zoom: 1
	        }
	      };
	      this.onUpdateTransform();
	    },
	    onLocate(nodeId) {
	      if (nodeId) {
	        this.$refs.tree.locateToDepartment(nodeId);
	        return;
	      }
	      this.$refs.tree.locateToCurrentDepartment();
	    },
	    showWizardEventHandler({
	      data
	    }) {
	      this.onShowWizard(data);
	    },
	    onShowWizard({
	      nodeId = 0,
	      isEditMode = false,
	      type,
	      showEntitySelector = true,
	      source = '',
	      entityType,
	      refToFocus
	    } = {}) {
	      this.wizard = {
	        ...this.wizard,
	        shown: true,
	        isEditMode,
	        showEntitySelector,
	        entity: type,
	        nodeId,
	        source,
	        entityType,
	        refToFocus
	      };
	      if (!isEditMode && source !== humanresources_companyStructure_api.AnalyticsSourceType.HEADER) {
	        ui_analytics.sendData({
	          tool: 'structure',
	          category: 'structure',
	          event: 'create_dept_step1',
	          c_element: source
	        });
	      }

	      // eslint-disable-next-line default-case
	      switch (type) {
	        case 'department':
	          ui_analytics.sendData({
	            tool: 'structure',
	            category: 'structure',
	            event: 'create_dept_step1',
	            c_element: source
	          });
	          break;
	        case 'employees':
	          ui_analytics.sendData({
	            tool: 'structure',
	            category: 'structure',
	            event: 'create_dept_step2',
	            c_element: source
	          });
	          break;
	        case 'bindChat':
	          ui_analytics.sendData({
	            tool: 'structure',
	            category: 'structure',
	            event: 'create_dept_step3',
	            c_element: source
	          });
	          break;
	        case 'teamRights':
	          ui_analytics.sendData({
	            tool: 'structure',
	            category: 'structure',
	            event: 'create_dept_step4',
	            c_element: source
	          });
	          break;
	      }
	    },
	    async onModifyTree({
	      id,
	      parentId,
	      showConfetti
	    }) {
	      this.showConfetti = showConfetti != null ? showConfetti : false;
	      const {
	        tree
	      } = this.$refs;
	      tree.expandDepartmentParents(id);
	      tree.focus(id, {
	        expandAfterFocus: true
	      });
	      await this.$nextTick();
	      tree.moveTo(id);
	    },
	    onWizardClose() {
	      this.wizard.shown = false;
	    },
	    removeDepartmentEventHandler({
	      data
	    }) {
	      this.onRemoveDepartment(data.nodeId, data.entityType);
	    },
	    onRemoveDepartment(nodeId, entityType) {
	      const {
	        tree
	      } = this.$refs;
	      tree.tryRemoveDepartment(nodeId, entityType);
	    },
	    onTransitionEnd() {
	      if (this.canvas.moving) {
	        this.initTransitionCompleted = true;
	      }
	      this.canvas.moving = false;
	      if (this.showConfetti) {
	        ui_confetti.Confetti.fire({
	          particleCount: 300,
	          startVelocity: 10,
	          spread: 400,
	          ticks: 100,
	          origin: {
	            y: 0.4,
	            x: 0.37
	          }
	        });
	        this.showConfetti = false;
	      }
	    },
	    onControlDetail({
	      showEmployees,
	      preventSwitch
	    }) {
	      this.detailPanel = {
	        ...this.detailPanel,
	        preventSwitch
	      };
	      if (!showEmployees) {
	        return;
	      }
	      this.detailPanel = {
	        ...this.detailPanel,
	        collapsed: false
	      };
	    },
	    transformCanvas() {
	      const {
	        zoom
	      } = this.canvas.modelTransform;
	      const {
	        offsetWidth,
	        offsetHeight
	      } = this.$el;
	      const [currentDepartment] = this.currentDepartments;
	      const y = currentDepartment === this.rootId ? this.rootOffset : offsetHeight / 2 - offsetHeight * zoom / 2;
	      this.canvas.modelTransform = {
	        ...this.canvas.modelTransform,
	        x: offsetWidth / 2 - offsetWidth * zoom / 2,
	        y
	      };
	    },
	    onUpdateTransform() {
	      main_core_events.EventEmitter.emit(events.INTRANET_USER_MINIPROFILE_CLOSE);
	      main_core_events.EventEmitter.emit(events.HR_DEPARTMENT_MENU_CLOSE);
	    },
	    handleInviteSliderMessage(event) {
	      const [messageEvent] = event.getData();
	      const eventId = messageEvent.getEventId();
	      if (eventId !== 'BX.Intranet.Invitation:onAdd') {
	        return;
	      }
	      const {
	        users
	      } = messageEvent.getData();
	      users.forEach(user => {
	        const invitedUserData = humanresources_companyStructure_utils.getInvitedUserData(user);
	        OrgChartActions.inviteUser(invitedUserData);
	      });
	    },
	    clearChatLists(data) {
	      const nodeIds = Object.keys(data).map(key => Number(key));
	      OrgChartActions.clearNodesChatLists(nodeIds);
	    },
	    onKeyDown(event) {
	      if (!this.initTransitionCompleted) {
	        event.preventDefault();
	      }
	    }
	  },
	  template: `
		<div
			class="humanresources-chart"
			:class="{ '--locked': !initTransitionCompleted }"
			@keydown="onKeyDown"
		>
			<TitlePanel @showWizard="onShowWizard" @locate="onLocate"></TitlePanel>
			<TransformCanvas
				v-if="canvas.shown"
				v-slot="{transform}"
				v-model="canvas.modelTransform"
				@update:modelValue="onUpdateTransform"
				:class="{ '--moving': canvas.moving }"
				@transitionend="onTransitionEnd"
			>
				<Tree
					:canvasZoom="transform.zoom"
					ref="tree"
					@moveTo="onMoveTo"
					@showWizard="onShowWizard"
					@controlDetail="onControlDetail"
				></Tree>
			</TransformCanvas>
			<DetailPanel
				@showWizard="onShowWizard"
				@removeDepartment="onRemoveDepartment"
				v-model="detailPanel.collapsed"
				:preventPanelSwitch="detailPanel.preventSwitch"
			></DetailPanel>
			<TransformPanel
				v-model="canvas.modelTransform"
				@locate="onLocate"
			></TransformPanel>
			<ChartWizard
				v-if="wizard.shown"
				:nodeId="wizard.nodeId"
				:isEditMode="wizard.isEditMode"
				:showEntitySelector="wizard.showEntitySelector"
				:entity="wizard.entity"
				:entityType="wizard.entityType"
				:source="wizard.source"
				:refToFocus="wizard.refToFocus"
				@modifyTree="onModifyTree"
				@close="onWizardClose"
			></ChartWizard>
			<FirstPopup></FirstPopup>
			<div class="humanresources-chart__back"></div>
		</div>
	`
	};

	class UsersTabActionMenu extends AbstractActionMenu {
	  constructor(entityId, analyticSource, role, entityType) {
	    super(entityId);
	    this.analyticSource = analyticSource;
	    this.role = role;
	    this.entityType = entityType;
	    this.items = this.getFilteredItems();
	  }
	  getItems() {
	    return [new AddEmployeeMenuItem(this.entityType, this.role), new EditEmployeesMenuItem(this.entityType, this.role)];
	  }
	}

	class EmptyUsersTabActionMenu extends AbstractActionMenu {
	  constructor(entityId, analyticSource, role, entityType) {
	    super(entityId);
	    this.entityType = entityType;
	    this.analyticSource = analyticSource;
	    this.role = role;
	    this.items = this.getFilteredItems();
	  }
	  getItems() {
	    if (this.entityType === humanresources_companyStructure_utils.EntityTypes.team) {
	      return [new AddEmployeeMenuItem(this.entityType, this.role)];
	    }
	    return [new MoveEmployeeMenuItem(), new UserInviteMenuItem(), new AddEmployeeMenuItem(this.entityType, this.role)];
	  }
	}

	class FireUserFromCompanyMenuItem extends AbstractMenuItem {
	  constructor(isUserInvited) {
	    super({
	      id: MenuActions.fireUserFromCompany,
	      title: isUserInvited ? main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_LIST_ACTION_MENU_DELETE_FROM_COMPANY_TITLE') : main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_LIST_ACTION_MENU_FIRE_FROM_COMPANY_TITLE'),
	      description: main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_LIST_ACTION_MENU_FIRE_FROM_COMPANY_SUBTITLE'),
	      bIcon: {
	        name: ui_iconSet_api_core.Main.PERSONS_DENY,
	        size: 20,
	        color: humanresources_companyStructure_utils.getColorCode('paletteRed40')
	      },
	      permissionAction: isUserInvited ? '' : humanresources_companyStructure_permissionChecker.PermissionActions.employeeFire,
	      dataTestId: 'hr-department-detail-content__user-list_fire-user-from-department'
	    });
	  }
	  hasPermission(permissionChecker, entityId) {
	    return permissionChecker.hasPermissionOfAction(this.permissionAction);
	  }
	}

	class MoveFromDepartmentMenuItem extends AbstractMenuItem {
	  constructor(entityType) {
	    const title = entityType === humanresources_companyStructure_utils.EntityTypes.team ? main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_LIST_ACTION_MENU_MOVE_TO_ANOTHER_TEAM_TITLE') : main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_LIST_ACTION_MENU_MOVE_TO_ANOTHER_DEPARTMENT_TITLE');
	    const description = entityType === humanresources_companyStructure_utils.EntityTypes.team ? main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_LIST_ACTION_MENU_MOVE_TO_ANOTHER_TEAM_SUBTITLE') : main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_LIST_ACTION_MENU_MOVE_TO_ANOTHER_DEPARTMENT_SUBTITLE');
	    super({
	      id: MenuActions.moveUserToAnotherDepartment,
	      title,
	      description,
	      bIcon: {
	        name: ui_iconSet_api_core.Main.PERSON_ARROW_LEFT_1,
	        size: 20,
	        color: humanresources_companyStructure_utils.getColorCode('paletteBlue50')
	      },
	      permissionAction: null,
	      dataTestId: 'hr-department-detail-content__user-list_move-from-department'
	    });
	    this.entityType = entityType;
	  }
	  hasPermission(permissionChecker, entityId) {
	    const permissions = permissionChecker.currentUserPermissions;
	    const addMemberPermissionAction = this.entityType === humanresources_companyStructure_utils.EntityTypes.team ? humanresources_companyStructure_permissionChecker.PermissionActions.teamAddMember : humanresources_companyStructure_permissionChecker.PermissionActions.employeeAddToDepartment;
	    const removeMemberPermissionAction = this.entityType === humanresources_companyStructure_utils.EntityTypes.team ? humanresources_companyStructure_permissionChecker.PermissionActions.teamRemoveMember : humanresources_companyStructure_permissionChecker.PermissionActions.employeeRemoveFromDepartment;
	    const addMemberPermissionValue = this.entityType === humanresources_companyStructure_utils.EntityTypes.team ? permissions.ACTION_TEAM_MEMBER_ADD : permissions.ACTION_EMPLOYEE_ADD_TO_DEPARTMENT;
	    const removeMemberPermissionValue = this.entityType === humanresources_companyStructure_utils.EntityTypes.team ? permissions.ACTION_TEAM_MEMBER_REMOVE : permissions.ACTION_EMPLOYEE_REMOVE_FROM_DEPARTMENT;
	    const moveUserPermission = addMemberPermissionValue < removeMemberPermissionValue ? addMemberPermissionAction : removeMemberPermissionAction;
	    return permissionChecker.hasPermission(moveUserPermission, entityId);
	  }
	}

	class RemoveFromDepartmentMenuItem extends AbstractMenuItem {
	  constructor(entityType) {
	    const title = entityType === humanresources_companyStructure_utils.EntityTypes.team ? main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_LIST_ACTION_MENU_REMOVE_FROM_TEAM_TITLE') : main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_LIST_ACTION_MENU_REMOVE_FROM_DEPARTMENT_TITLE');
	    const description = entityType === humanresources_companyStructure_utils.EntityTypes.team ? main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_LIST_ACTION_MENU_REMOVE_FROM_TEAM_SUBTITLE') : main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_USER_LIST_ACTION_MENU_REMOVE_FROM_DEPARTMENT_SUBTITLE');
	    const color = entityType === humanresources_companyStructure_utils.EntityTypes.team ? humanresources_companyStructure_utils.getColorCode('paletteRed40') : humanresources_companyStructure_utils.getColorCode('paletteBlue50');
	    const permissionAction = entityType === humanresources_companyStructure_utils.EntityTypes.team ? humanresources_companyStructure_permissionChecker.PermissionActions.teamRemoveMember : humanresources_companyStructure_permissionChecker.PermissionActions.employeeRemoveFromDepartment;
	    super({
	      id: MenuActions.removeUserFromDepartment,
	      title,
	      description,
	      bIcon: {
	        name: ui_iconSet_api_core.Main.TRASH_BIN,
	        size: 20,
	        color
	      },
	      permissionAction,
	      dataTestId: 'hr-department-detail-content__user-list_remove-from-department'
	    });
	  }
	}

	class UserListActionMenu extends AbstractActionMenu {
	  constructor(entityId, entityType, isUserInvited) {
	    super(entityId);
	    this.isUserInvited = isUserInvited;
	    this.entityType = entityType;
	    this.items = this.getFilteredItems();
	  }
	  getItems() {
	    if (this.entityType === humanresources_companyStructure_utils.EntityTypes.team) {
	      return [new MoveFromDepartmentMenuItem(this.entityType), new RemoveFromDepartmentMenuItem(this.entityType)];
	    }
	    return [new MoveFromDepartmentMenuItem(this.entityType), new RemoveFromDepartmentMenuItem(this.entityType), new FireUserFromCompanyMenuItem(this.isUserInvited)];
	  }
	}

	let _$1 = t => t,
	  _t$1;
	var _subscribeOnEvents = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("subscribeOnEvents");
	var _getNotConvertedStateScreen = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getNotConvertedStateScreen");
	class NotConvertedState {
	  static async mount(containerId) {
	    const container = document.getElementById(containerId);
	    main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _getNotConvertedStateScreen)[_getNotConvertedStateScreen](), container);
	    babelHelpers.classPrivateFieldLooseBase(this, _subscribeOnEvents)[_subscribeOnEvents]();
	    const updateTimeMs = 30000;
	    this.updateConvertedStatusInterval = setInterval(async () => {
	      try {
	        await chartAPI.getDictionary();
	      } catch (e) {
	        if (e.code === 'STRUCTURE_IS_NOT_CONVERTED') {
	          return;
	        }
	        if (e.code === 'STRUCTURE_ACCESS_DENIED') {
	          clearInterval(this.updateConvertedStatusInterval);
	          window.location.reload();
	        }
	        throw e;
	      }
	      clearInterval(this.updateConvertedStatusInterval);
	      window.location.reload();
	    }, updateTimeMs);
	  }
	}
	function _subscribeOnEvents2() {
	  const onCloseByEsc = event => {
	    const [sidePanelEvent] = event.data;
	    sidePanelEvent.denyAction();
	  };
	  const onClose = () => {
	    main_core_events.EventEmitter.unsubscribe(events.HR_ORG_CHART_CLOSE_BY_ESC, onCloseByEsc);
	    main_core_events.EventEmitter.unsubscribe(events.HR_ORG_CHART_CLOSE, onClose);
	    clearInterval(this.updateConvertedStatusInterval);
	  };
	  main_core_events.EventEmitter.subscribe(events.HR_ORG_CHART_CLOSE_BY_ESC, onCloseByEsc);
	  main_core_events.EventEmitter.subscribe(events.HR_ORG_CHART_CLOSE, onClose);
	}
	function _getNotConvertedStateScreen2() {
	  return main_core.Tag.render(_t$1 || (_t$1 = _$1`
			<div class="humanresources-not-converted-state-screen">
				<div class="humanresources-not-converted-state-screen__icon"></div>
				<div class="humanresources-not-converted-state-screen__title">
					${0}
				</div>
				<div class="humanresources-not-converted-state-screen__description">
					${0}
				</div>
			</div>
		`), main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_NOT_CONVERTED_SCREEN_LOADING_TITLE'), main_core.Loc.getMessage('HUMANRESOURCES_COMPANY_STRUCTURE_NOT_CONVERTED_SCREEN_LOADING_DESCRIPTION'));
	}
	Object.defineProperty(NotConvertedState, _getNotConvertedStateScreen, {
	  value: _getNotConvertedStateScreen2
	});
	Object.defineProperty(NotConvertedState, _subscribeOnEvents, {
	  value: _subscribeOnEvents2
	});

	var _subscribeOnEvents$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("subscribeOnEvents");
	class App {
	  static async mount(containerId) {
	    const container = document.getElementById(containerId);
	    const app = ui_vue3.BitrixVue.createApp(Chart);
	    const store = ui_vue3_pinia.createPinia();
	    app.use(store);
	    babelHelpers.classPrivateFieldLooseBase(App, _subscribeOnEvents$1)[_subscribeOnEvents$1](app);
	    const slider = BX.SidePanel.Instance.getTopSlider();
	    if (slider) {
	      slider.showLoader();
	    }
	    main_core.Dom.addClass(container, 'humanresources-chart__back');
	    await humanresources_companyStructure_permissionChecker.PermissionChecker.init();
	    if (slider) {
	      slider.closeLoader();
	    }
	    main_core.Dom.removeClass(container, 'humanresources-chart__back');
	    app.mount(container);
	  }
	}
	function _subscribeOnEvents2$1(app) {
	  const onCloseByEsc = event => {
	    const [sidePanelEvent] = event.data;
	    sidePanelEvent.denyAction();
	  };
	  const onClose = () => {
	    main_core_events.EventEmitter.unsubscribe(events.HR_ORG_CHART_CLOSE_BY_ESC, onCloseByEsc);
	    main_core_events.EventEmitter.unsubscribe(events.HR_ORG_CHART_CLOSE, onClose);
	    app.unmount();
	  };
	  main_core_events.EventEmitter.subscribe(events.HR_ORG_CHART_CLOSE_BY_ESC, onCloseByEsc);
	  main_core_events.EventEmitter.subscribe(events.HR_ORG_CHART_CLOSE, onClose);
	}
	Object.defineProperty(App, _subscribeOnEvents$1, {
	  value: _subscribeOnEvents2$1
	});

	exports.App = App;
	exports.UsersTabActionMenu = UsersTabActionMenu;
	exports.EmptyUsersTabActionMenu = EmptyUsersTabActionMenu;
	exports.UserListActionMenu = UserListActionMenu;
	exports.MenuActions = MenuActions;
	exports.NotConvertedState = NotConvertedState;

}((this.BX.Humanresources.CompanyStructure = this.BX.Humanresources.CompanyStructure || {}),BX.Vue3,BX.UI,BX.UI,BX.UI.EntitySelector,BX.UI.Dialogs,BX,BX.Humanresources.CompanyStructure,BX.Vue3.Pinia,BX.Humanresources.CompanyStructure,BX.Humanresources.CompanyStructure,BX.Humanresources.CompanyStructure,BX,BX,BX.UI,BX,BX.UI.IconSet,BX.Humanresources.CompanyStructure,BX.Humanresources.CompanyStructure,BX.UI.Analytics,BX,BX.Humanresources.CompanyStructure,BX.Humanresources.CompanyStructure,BX.UI.IconSet,BX.Event,BX));
//# sourceMappingURL=org-chart.bundle.js.map
