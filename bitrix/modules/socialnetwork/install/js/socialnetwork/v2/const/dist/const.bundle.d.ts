/* eslint-disable */
type IPrivacyType = typeof BX.Socialnetwork.V2.PrivacyType[keyof typeof BX.Socialnetwork.V2.PrivacyType];

declare namespace BX.Socialnetwork.V2 {
	const AutoDeleteMessageDelay: Readonly<{
		Off: 0;
		Hour: 1;
		Day: 24;
		Week: 168;
		Month: 720;
	}>;

	const EntitySelectorEntity: Readonly<{
		AllUser: "all-users";
		Department: "department";
		Group: "group";
		MetaUser: "meta-user";
		Project: "project";
		ProjectTag: "project-tag";
		User: "user";
	}>;

	const EventName: Readonly<{
		CloseProjectWizard: "sonet.v2:close-project-wizard";
		SaveProjectWizard: "sonet.v2:save-project-wizard";
	}>;

	const PrivacyType: Readonly<{
		Closed: "closed";
		Open: "open";
	}>;

	enum ProjectErrorCode {
		GroupNameExist = "ERROR_GROUP_NAME_EXISTS"
	}

	enum AccessRightsBoolKind {
		Yes = "Y",
		No = "N"
	}

	enum AccessRightsRoleKind {
		AllParticipants = "K",
		EmployeesOnly = "J",
		Owner = "A",
		OwnerAndModerators = "E"
	}
}
