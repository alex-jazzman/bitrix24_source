/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
(function (exports) {
	'use strict';

	const AutoDeleteMessageDelay = Object.freeze({
		Off: 0,
		Hour: 1,
		Day: 24,
		Week: 168,
		Month: 720
	});

	const EntitySelectorEntity = Object.freeze({
		AllUser: 'all-users',
		Department: 'department',
		Group: 'group',
		MetaUser: 'meta-user',
		Project: 'project',
		ProjectTag: 'project-tag',
		User: 'user'
	});

	const EventName = Object.freeze({
		CloseProjectWizard: 'sonet.v2:close-project-wizard',
		SaveProjectWizard: 'sonet.v2:save-project-wizard'
	});

	const PrivacyType = Object.freeze({
		Closed: 'closed',
		Open: 'open'
	});

	exports.ProjectErrorCode = void 0;
	(function (ProjectErrorCode) {
		ProjectErrorCode["GroupNameExist"] = "ERROR_GROUP_NAME_EXISTS";
	})(exports.ProjectErrorCode || (exports.ProjectErrorCode = {}));

	exports.AccessRightsRoleKind = void 0;
	(function (AccessRightsRoleKind) {
		AccessRightsRoleKind["AllParticipants"] = "K";
		AccessRightsRoleKind["EmployeesOnly"] = "J";
		AccessRightsRoleKind["Owner"] = "A";
		AccessRightsRoleKind["OwnerAndModerators"] = "E";
	})(exports.AccessRightsRoleKind || (exports.AccessRightsRoleKind = {}));
	exports.AccessRightsBoolKind = void 0;
	(function (AccessRightsBoolKind) {
		AccessRightsBoolKind["Yes"] = "Y";
		AccessRightsBoolKind["No"] = "N";
	})(exports.AccessRightsBoolKind || (exports.AccessRightsBoolKind = {}));

	exports.AutoDeleteMessageDelay = AutoDeleteMessageDelay;
	exports.EntitySelectorEntity = EntitySelectorEntity;
	exports.EventName = EventName;
	exports.PrivacyType = PrivacyType;

})(this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {});
//# sourceMappingURL=const.bundle.js.map
