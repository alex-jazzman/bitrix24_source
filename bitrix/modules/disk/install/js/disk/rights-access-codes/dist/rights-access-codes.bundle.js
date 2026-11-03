/* eslint-disable */
this.BX = this.BX || {};
this.BX.Disk = this.BX.Disk || {};
(function (exports, main_core) {
	'use strict';

	const EntityId = Object.freeze({
		User: 'user',
		Department: 'department',
		ProjectAccessCodes: 'project-access-codes',
		SiteGroups: 'site-groups',
		SpecialAccess: 'disk-special-access'
	});
	const SpecialAccessCode = Object.freeze({
		AllAuthorized: 'AU',
		Creator: 'CR'
	});
	const nonGroupSiteGroupCode = 'G2';
	const numericId = /^\d+$/;
	const flatDepartmentItemId = /^(\d+):F$/;
	const userCode = /^U(\d+)$/;
	const departmentWithChildrenCode = /^DR(\d+)$/;
	const flatDepartmentCode = /^D(\d+)$/;
	const siteGroupCode = /^G(\d+)$/;
	const projectRoleCode = /^SG\d+_[AEK]$/;
	function getAccessCodeByItem(item) {
		const id = String(item.getId());
		switch (item.getEntityId()) {
			case EntityId.User:
				return numericId.test(id) ? `U${id}` : null;
			case EntityId.Department:
				return getDepartmentAccessCode(id);
			case EntityId.ProjectAccessCodes:
				return projectRoleCode.test(id) ? id : null;
			case EntityId.SiteGroups:
				return getSiteGroupAccessCode(id);
			case EntityId.SpecialAccess:
				return isSpecialAccessCode(id) ? id : null;
			default:
				return null;
		}
	}
	function getItemIdByAccessCode(accessCode) {
		if (!main_core.Type.isString(accessCode) || accessCode === nonGroupSiteGroupCode) {
			return null;
		}
		if (isSpecialAccessCode(accessCode)) {
			return [EntityId.SpecialAccess, accessCode];
		}
		if (projectRoleCode.test(accessCode)) {
			return [EntityId.ProjectAccessCodes, accessCode];
		}
		const userMatch = accessCode.match(userCode);
		if (userMatch !== null) {
			return [EntityId.User, userMatch[1]];
		}
		const departmentMatch = accessCode.match(departmentWithChildrenCode);
		if (departmentMatch !== null) {
			return [EntityId.Department, departmentMatch[1]];
		}
		const flatDepartmentMatch = accessCode.match(flatDepartmentCode);
		if (flatDepartmentMatch !== null) {
			return [EntityId.Department, `${flatDepartmentMatch[1]}:F`];
		}
		const siteGroupMatch = accessCode.match(siteGroupCode);
		if (siteGroupMatch !== null) {
			return [EntityId.SiteGroups, siteGroupMatch[1]];
		}
		return null;
	}
	function getDepartmentAccessCode(id) {
		const flatMatch = id.match(flatDepartmentItemId);
		if (flatMatch !== null) {
			return `D${flatMatch[1]}`;
		}
		return numericId.test(id) ? `DR${id}` : null;
	}
	function getSiteGroupAccessCode(id) {
		if (!numericId.test(id)) {
			return null;
		}
		const accessCode = `G${id}`;
		return accessCode === nonGroupSiteGroupCode ? null : accessCode;
	}
	function isSpecialAccessCode(code) {
		return code === SpecialAccessCode.AllAuthorized || code === SpecialAccessCode.Creator;
	}

	function getDialogEntities(isBitrix24) {
		const entities = [{
			id: EntityId.User,
			options: {
				emailUsers: false,
				inviteEmployeeLink: false,
				inviteGuestLink: false
			}
		}, {
			id: EntityId.Department,
			options: {
				selectMode: 'usersAndDepartments',
				allowSelectRootDepartment: true,
				allowFlatDepartments: true
			}
		}, {
			id: EntityId.ProjectAccessCodes
		}, {
			id: EntityId.SpecialAccess,
			dynamicLoad: true
		}];
		if (!isBitrix24) {
			entities.push({
				id: EntityId.SiteGroups,
				dynamicLoad: true,
				dynamicSearch: true
			});
		}
		return entities;
	}

	exports.getAccessCodeByItem = getAccessCodeByItem;
	exports.getDialogEntities = getDialogEntities;
	exports.getItemIdByAccessCode = getItemIdByAccessCode;

})(this.BX.Disk.Rights = this.BX.Disk.Rights || {}, BX);
//# sourceMappingURL=rights-access-codes.bundle.js.map
