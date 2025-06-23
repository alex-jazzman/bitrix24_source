/* eslint-disable */
this.BX = this.BX || {};
this.BX.Humanresources = this.BX.Humanresources || {};
(function (exports,humanresources_companyStructure_api,humanresources_companyStructure_chartStore,humanresources_companyStructure_utils) {
	'use strict';

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

	/* eslint-disable no-constructor-return */
	const PermissionActions = Object.freeze({
	  structureView: 'ACTION_STRUCTURE_VIEW',
	  departmentCreate: 'ACTION_DEPARTMENT_CREATE',
	  departmentDelete: 'ACTION_DEPARTMENT_DELETE',
	  departmentEdit: 'ACTION_DEPARTMENT_EDIT',
	  employeeAddToDepartment: 'ACTION_EMPLOYEE_ADD_TO_DEPARTMENT',
	  employeeRemoveFromDepartment: 'ACTION_EMPLOYEE_REMOVE_FROM_DEPARTMENT',
	  employeeFire: 'ACTION_FIRE_EMPLOYEE',
	  accessEdit: 'ACTION_USERS_ACCESS_EDIT',
	  teamAccessEdit: 'ACTION_TEAM_ACCESS_EDIT',
	  inviteToDepartment: 'ACTION_USER_INVITE',
	  teamView: 'ACTION_TEAM_VIEW',
	  teamCreate: 'ACTION_TEAM_CREATE',
	  teamEdit: 'ACTION_TEAM_EDIT',
	  teamDelete: 'ACTION_TEAM_DELETE',
	  teamAddMember: 'ACTION_TEAM_MEMBER_ADD',
	  teamRemoveMember: 'ACTION_TEAM_MEMBER_REMOVE',
	  teamSettingsEdit: 'ACTION_TEAM_SETTINGS_EDIT'
	});
	const PermissionLevels = Object.freeze({
	  fullCompany: 30,
	  selfAndSub: 20,
	  self: 10,
	  none: 0
	});
	var _isTeamAction = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isTeamAction");
	var _hasPermissionOfTeamAction = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hasPermissionOfTeamAction");
	var _hasPermissionOfDepartmentAction = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hasPermissionOfDepartmentAction");
	var _hasPermissionOfTeamActionByTeamPermission = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hasPermissionOfTeamActionByTeamPermission");
	var _hasPermissionOfTeamActionByDepartmentPermission = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hasPermissionOfTeamActionByDepartmentPermission");
	class PermissionCheckerClass {
	  constructor() {
	    Object.defineProperty(this, _hasPermissionOfTeamActionByDepartmentPermission, {
	      value: _hasPermissionOfTeamActionByDepartmentPermission2
	    });
	    Object.defineProperty(this, _hasPermissionOfTeamActionByTeamPermission, {
	      value: _hasPermissionOfTeamActionByTeamPermission2
	    });
	    Object.defineProperty(this, _hasPermissionOfDepartmentAction, {
	      value: _hasPermissionOfDepartmentAction2
	    });
	    Object.defineProperty(this, _hasPermissionOfTeamAction, {
	      value: _hasPermissionOfTeamAction2
	    });
	    Object.defineProperty(this, _isTeamAction, {
	      value: _isTeamAction2
	    });
	    if (!PermissionCheckerClass.instance) {
	      this.currentUserPermissions = {};
	      this.permissionVariablesDictionary = [];
	      this.isTeamsAvailable = false;
	      this.isInitialized = false;
	      PermissionCheckerClass.instance = this;
	    }
	    return PermissionCheckerClass.instance;
	  }
	  getInstance() {
	    return PermissionCheckerClass.instance;
	  }
	  async init() {
	    if (this.isInitialized) {
	      return;
	    }
	    const {
	      currentUserPermissions,
	      permissionVariablesDictionary,
	      teamsAvailable
	    } = await chartAPI.getDictionary();
	    this.currentUserPermissions = currentUserPermissions;
	    this.permissionVariablesDictionary = permissionVariablesDictionary;
	    this.isTeamsAvailable = teamsAvailable;
	    this.isInitialized = true;
	  }
	  hasPermission(action, departmentId, minLevel = PermissionLevels.none) {
	    const permissionLevel = this.currentUserPermissions[action];
	    if (!permissionLevel || departmentId === 0) {
	      return false;
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isTeamAction)[_isTeamAction](action)) {
	      if (!this.isTeamsAvailable) {
	        return false;
	      }
	      return babelHelpers.classPrivateFieldLooseBase(this, _hasPermissionOfTeamAction)[_hasPermissionOfTeamAction](permissionLevel, departmentId, action);
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _hasPermissionOfDepartmentAction)[_hasPermissionOfDepartmentAction](permissionLevel, departmentId, action, minLevel);
	  }
	  hasPermissionWithAnyNode(action) {
	    const permissionLevel = this.currentUserPermissions[action];
	    if (!permissionLevel) {
	      return false;
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isTeamAction)[_isTeamAction](action)) {
	      if (!this.isTeamsAvailable) {
	        return false;
	      }
	      return permissionLevel.TEAM > PermissionLevels.none || permissionLevel.DEPARTMENT > PermissionLevels.none;
	    }
	    return permissionLevel > PermissionLevels.none;
	  }
	  hasPermissionOfAction(action) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isTeamAction)[_isTeamAction](action)) {
	      return this.hasPermissionWithAnyNode(action);
	    }
	    return this.currentUserPermissions[action] !== undefined && this.currentUserPermissions[action] !== null && this.currentUserPermissions[action] !== PermissionLevels.none;
	  }
	}
	function _isTeamAction2(action) {
	  const teamActions = [PermissionActions.teamView, PermissionActions.teamCreate, PermissionActions.teamEdit, PermissionActions.teamDelete, PermissionActions.teamAddMember, PermissionActions.teamRemoveMember, PermissionActions.teamSettingsEdit];
	  return teamActions.includes(action);
	}
	function _hasPermissionOfTeamAction2(permissionValue, nodeId, action) {
	  if (permissionValue.TEAM === PermissionLevels.fullCompany) {
	    const departments = humanresources_companyStructure_chartStore.useChartStore().departments;
	    const currentNode = departments.get(nodeId);
	    if (action === PermissionActions.teamCreate && currentNode.entityType === humanresources_companyStructure_utils.EntityTypes.department) {
	      return this.hasPermission(PermissionActions.structureView, currentNode.id);
	    }
	    return true;
	  }
	  if (babelHelpers.classPrivateFieldLooseBase(this, _hasPermissionOfTeamActionByTeamPermission)[_hasPermissionOfTeamActionByTeamPermission](nodeId, permissionValue.TEAM)) {
	    return true;
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _hasPermissionOfTeamActionByDepartmentPermission)[_hasPermissionOfTeamActionByDepartmentPermission](nodeId, permissionValue.DEPARTMENT, action);
	}
	function _hasPermissionOfDepartmentAction2(permissionLevel, departmentId, action, minLevel) {
	  const permissionObject = this.permissionVariablesDictionary.find(item => item.id === permissionLevel);
	  if (!permissionObject) {
	    return false;
	  }
	  const departments = humanresources_companyStructure_chartStore.useChartStore().departments;
	  if (action === PermissionActions.departmentDelete) {
	    const rootId = [...departments.values()].find(department => department.parentId === 0).id;
	    if (departmentId === rootId) {
	      return false;
	    }
	  }
	  const userDepartments = humanresources_companyStructure_chartStore.useChartStore().currentDepartments;
	  if (permissionObject.id < minLevel) {
	    return false;
	  }
	  switch (permissionObject.id) {
	    case PermissionLevels.fullCompany:
	      return true;
	    case PermissionLevels.selfAndSub:
	      {
	        if (userDepartments.includes(departmentId)) {
	          return true;
	        }
	        let currentDepartment = departments.get(departmentId);
	        while (currentDepartment) {
	          if (userDepartments.includes(currentDepartment.id)) {
	            return true;
	          }
	          currentDepartment = departments.get(currentDepartment.parentId);
	        }
	        return false;
	      }
	    case PermissionLevels.self:
	      return userDepartments.includes(departmentId);
	    case PermissionLevels.none:
	    default:
	      return false;
	  }
	}
	function _hasPermissionOfTeamActionByTeamPermission2(nodeId, level = PermissionLevels.none) {
	  if (level === PermissionLevels.none) {
	    return false;
	  }
	  const userDepartments = humanresources_companyStructure_chartStore.useChartStore().currentDepartments;
	  if (userDepartments.includes(nodeId)) {
	    return true;
	  }
	  if (level === PermissionLevels.self) {
	    return false;
	  }
	  const nodes = humanresources_companyStructure_chartStore.useChartStore().departments;
	  let currentDepartment = nodes.get(nodeId);
	  while (currentDepartment) {
	    if (currentDepartment.entityType === humanresources_companyStructure_utils.EntityTypes.department) {
	      return false;
	    }
	    if (userDepartments.includes(currentDepartment.id)) {
	      return true;
	    }
	    currentDepartment = nodes.get(currentDepartment.parentId);
	  }
	  return false;
	}
	function _hasPermissionOfTeamActionByDepartmentPermission2(nodeId, level = PermissionLevels.none, action = '') {
	  if (level === PermissionLevels.none) {
	    return false;
	  }
	  const userDepartments = humanresources_companyStructure_chartStore.useChartStore().currentDepartments;
	  if (userDepartments.includes(nodeId)) {
	    return true;
	  }
	  const nodes = humanresources_companyStructure_chartStore.useChartStore().departments;
	  let currentDepartment = nodes.get(nodeId);
	  while (currentDepartment) {
	    if (userDepartments.includes(currentDepartment.id)) {
	      return true;
	    }
	    if (level === PermissionLevels.self && currentDepartment.type === humanresources_companyStructure_utils.EntityTypes.department) {
	      if (action === PermissionActions.teamCreate) {
	        return this.hasPermission(PermissionActions.structureView, currentDepartment.id) && userDepartments.includes(currentDepartment.id);
	      }
	      return false;
	    }
	    currentDepartment = nodes.get(currentDepartment.parentId);
	  }
	  return false;
	}
	const PermissionChecker = new PermissionCheckerClass();

	exports.PermissionActions = PermissionActions;
	exports.PermissionLevels = PermissionLevels;
	exports.PermissionCheckerClass = PermissionCheckerClass;
	exports.PermissionChecker = PermissionChecker;

}((this.BX.Humanresources.CompanyStructure = this.BX.Humanresources.CompanyStructure || {}),BX.Humanresources.CompanyStructure,BX.Humanresources.CompanyStructure,BX.Humanresources.CompanyStructure));
//# sourceMappingURL=checker.bundle.js.map
