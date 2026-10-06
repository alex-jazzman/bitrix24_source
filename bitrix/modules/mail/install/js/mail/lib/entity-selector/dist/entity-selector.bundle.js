/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
this.BX.Mail.Lib = this.BX.Mail.Lib || {};
(function (exports) {
	'use strict';

	const FLAT_DEPARTMENT_ITEM_ID = /^(\d+):F$/;
	const NUMERIC_ITEM_ID = /^\d+$/;
	function parseSelectorTag(tag) {
		const entity = tag.getEntityId();
		const itemId = String(tag.getId());
		if (entity === 'department') {
			const flatMatch = itemId.match(FLAT_DEPARTMENT_ITEM_ID);
			if (flatMatch) {
				return {
					entity,
					id: Number(flatMatch[1]),
					isFlat: true
				};
			}
			if (NUMERIC_ITEM_ID.test(itemId)) {
				return {
					entity,
					id: Number(itemId),
					isFlat: false
				};
			}
			return null;
		}
		if ((entity === 'user' || entity === 'mail_mailbox') && NUMERIC_ITEM_ID.test(itemId)) {
			return {
				entity,
				id: Number(itemId),
				isFlat: false
			};
		}
		return null;
	}
	function buildDepartmentItemId(id, isFlat) {
		return isFlat ? `${id}:F` : String(id);
	}

	function getSelectorItemByAccessCode(code) {
		const userMatch = code.match(/^U(\d+)$/);
		if (userMatch) {
			return ['user', userMatch[1]];
		}
		const recursiveDepartmentMatch = code.match(/^DR(\d+)$/);
		if (recursiveDepartmentMatch) {
			return ['department', buildDepartmentItemId(Number(recursiveDepartmentMatch[1]), false)];
		}
		const flatDepartmentMatch = code.match(/^D(\d+)$/);
		if (flatDepartmentMatch) {
			return ['department', buildDepartmentItemId(Number(flatDepartmentMatch[1]), true)];
		}
		return null;
	}
	function getAccessCodeBySelectorTag(tag) {
		const parsed = parseSelectorTag(tag);
		if (parsed?.entity === 'user') {
			return `U${parsed.id}`;
		}
		if (parsed?.entity === 'department') {
			return parsed.isFlat ? `D${parsed.id}` : `DR${parsed.id}`;
		}
		return null;
	}

	function getIntranetUserSelectorOptions() {
		return {
			intranetUsersOnly: true,
			emailUsers: false,
			inviteEmployeeLink: false,
			inviteGuestLink: false
		};
	}
	function getUserDepartmentEntities(userOptions = getIntranetUserSelectorOptions()) {
		return [{
			id: 'user',
			dynamicLoad: true,
			dynamicSearch: true,
			options: {
				...userOptions
			}
		}, {
			id: 'department',
			dynamicLoad: true,
			dynamicSearch: true,
			options: {
				selectMode: 'usersAndDepartments',
				allowSelectRootDepartment: true,
				allowFlatDepartments: true,
				userOptions: {
					...userOptions
				}
			}
		}];
	}

	exports.buildDepartmentItemId = buildDepartmentItemId;
	exports.getAccessCodeBySelectorTag = getAccessCodeBySelectorTag;
	exports.getIntranetUserSelectorOptions = getIntranetUserSelectorOptions;
	exports.getSelectorItemByAccessCode = getSelectorItemByAccessCode;
	exports.getUserDepartmentEntities = getUserDepartmentEntities;
	exports.parseSelectorTag = parseSelectorTag;

})(this.BX.Mail.Lib.EntitySelector = this.BX.Mail.Lib.EntitySelector || {});
//# sourceMappingURL=entity-selector.bundle.js.map
