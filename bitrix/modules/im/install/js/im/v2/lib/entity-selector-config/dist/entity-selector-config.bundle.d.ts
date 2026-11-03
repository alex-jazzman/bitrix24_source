/* eslint-disable */
type EntitySelectorConfigOptions = {
	dialogId?: string;
	chatType?: string;
	structureTarget?: string;
	withTeams?: boolean;
	withRecent?: boolean;
	invitationPopup?: boolean;
};

declare namespace BX.Messenger.v2.Lib {
	const StructureTarget: Readonly<{
		chat: "chat";
		collabProject: "collabProject";
	}>;

	const getEntitiesConfig: (options?: EntitySelectorConfigOptions) => BX.UI.EntitySelector.EntityOptions[];

	const offersStructureNodes: (options?: EntitySelectorConfigOptions) => boolean;

	const isPersonEntity: (entityId: string) => boolean;

	const isLinkableNodeEntity: (entityId: string) => boolean;

	const canLinkStructureNodeToChat: (options?: EntitySelectorConfigOptions) => boolean;
}
