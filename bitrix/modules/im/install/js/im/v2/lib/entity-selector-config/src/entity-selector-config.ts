import { type EntityOptions } from 'ui.entity-selector';

import { ActionByRole, ActionByUserType, ChatType, SelectorEntity } from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { PermissionManager } from 'im.v2.lib.permission';

// What the chosen org structure gets linked to. A chat keeps the link on itself; a collab
// invitation puts it on the project behind the chat.
export const StructureTarget = Object.freeze({
	chat: 'chat',
	collabProject: 'collabProject',
});

export type EntitySelectorConfigOptions = {
	dialogId?: string,
	chatType?: string,
	structureTarget?: string,
	withTeams?: boolean,
	withRecent?: boolean,
	invitationPopup?: boolean,
};

const CHAT_TYPES_ACCEPTING_NODES: Set<string> = new Set([
	ChatType.chat,
	ChatType.open,
	ChatType.channel,
	ChatType.openChannel,
]);

const PERSON_ENTITIES: Set<string> = new Set([SelectorEntity.user, SelectorEntity.bot]);

const NODE_ENTITIES: Set<string> = new Set([SelectorEntity.department, SelectorEntity.structureNode]);

const TEAM_BASE_OPTIONS = {
	includedNodeEntityTypes: ['team'],
	useMultipleTabs: true,
	visual: {
		avatarMode: 'node',
		tagStyle: 'none',
	},
};

const TEAM_PROJECT_OPTIONS = {
	...TEAM_BASE_OPTIONS,
	restricted: 'view',
};

// What the messenger recent provider is asked for. The store filter below reads the same rule,
// so the two can never disagree about who belongs in the tab.
const MESSENGER_RECENT_OPTIONS = {
	fillDialogByRecent: true,
	includeOnly: ['users'],
	excludeGuests: true,
	excludeCurrentUser: true,
};

const DEPARTMENT_SELECT_OPTIONS = {
	selectMode: 'usersAndDepartments',
	allowFlatDepartments: true,
	allowSelectRootDepartment: true,
};

export const getEntitiesConfig = (options: EntitySelectorConfigOptions = {}): EntityOptions[] => {
	const entities: EntityOptions[] = [];
	const withMessengerRecent = options.withRecent === true;

	if (withMessengerRecent)
	{
		entities.push(getMessengerRecentEntity());
	}

	entities.push(getUserEntity(withMessengerRecent));

	if (offersBots(options))
	{
		entities.push(getBotEntity());
	}

	const withDepartmentSelect = offersDepartmentSelect(options);
	if (offersDepartmentEntity(options))
	{
		entities.push(getDepartmentEntity(withDepartmentSelect));
	}

	if (offersTeams(options))
	{
		const teamOptions = linksToCollabProject(options) ? TEAM_PROJECT_OPTIONS : TEAM_BASE_OPTIONS;
		const withTeamSelect = withDepartmentSelect || linksToCollabProject(options);

		entities.push({
			id: SelectorEntity.structureNode,
			options: withTeamSelect
				? { ...teamOptions, ...DEPARTMENT_SELECT_OPTIONS }
				: { ...teamOptions },
		});
	}

	return entities;
};

const getMessengerRecentEntity = (): EntityOptions => {
	return {
		id: SelectorEntity.recent,
		dynamicLoad: true,
		searchable: false,
		options: { ...MESSENGER_RECENT_OPTIONS },
	};
};

// Both switches are named on purpose. The bot entity carries defaults of its own (im.entity-selector,
// config.php), and dynamic load is on among them: left unnamed it fills the recent tab with every bot
// of the portal, the hidden ones included. The window answers a search with bots and nothing else.
const getBotEntity = (): EntityOptions => {
	return {
		id: SelectorEntity.bot,
		dynamicLoad: false,
		dynamicSearch: true,
	};
};

const getDepartmentEntity = (withSelectOptions: boolean): EntityOptions => {
	if (withSelectOptions)
	{
		return { id: SelectorEntity.department, options: { ...DEPARTMENT_SELECT_OPTIONS } };
	}

	return { id: SelectorEntity.department };
};

const getUserEntity = (withMessengerRecent: boolean): EntityOptions => {
	if (withMessengerRecent)
	{
		return { id: SelectorEntity.user, options: { fillDialog: false } };
	}

	return { id: SelectorEntity.user };
};

// Whether the window puts any node of the org structure up for linking. It reads the rules the tabs
// above are built from, so the hint under the field can never disagree with what the window offers.
export const offersStructureNodes = (options: EntitySelectorConfigOptions = {}): boolean => {
	return offersDepartmentSelect(options) || offersTeams(options);
};

// The department entity answers two questions. As a way to reach people through the org structure
// tree it belongs to every employee, which is how the chat forms have always carried it; the
// options that also make a department itself selectable go on top only where it can be linked.
//
// The invitation popup of a chat keeps the two together: there the tree stands to be linked, so a
// caller that cannot choose a department is offered none at all. That covers the right of the caller
// - linking belongs to the owner of the chat, adding people does not (AC-002, AC-003b) - and the
// chat type as well: a chat no node is ever linked to would get a tab leading nowhere.
//
// The one to one chat is out of scope of both: its "+" builds a group chat (AC-003f).
const offersDepartmentEntity = (options: EntitySelectorConfigOptions): boolean => {
	if (!isEmployee() || options.chatType === ChatType.user)
	{
		return false;
	}

	// The invitation of a collab stays as it was: a department there is offered to walk to people by
	// even where the portal has no org structure to link (P8.T1, AC-025).
	if (options.invitationPopup !== true || linksToCollabProject(options))
	{
		return true;
	}

	return canChooseDepartment(options);
};

const offersDepartmentSelect = (options: EntitySelectorConfigOptions): boolean => {
	return offersDepartmentEntity(options) && canChooseDepartment(options);
};

const canChooseDepartment = (options: EntitySelectorConfigOptions): boolean => {
	return canLinkDepartments(options) && FeatureManager.isFeatureAvailable(Feature.chatDepartments);
};

// A bot belongs to the invitation popup alone: the chat forms send the server pairs of entity and id,
// and the pair of a bot is dropped there without a word.
//
// The copilot chat is left out: the server drops bots from the ones being added silently, so a bot
// offered there would promise an addition that never happens (invite-bots AC-007).
const offersBots = (options: EntitySelectorConfigOptions): boolean => {
	return options.invitationPopup === true && options.chatType !== ChatType.copilot;
};

const offersTeams = (options: EntitySelectorConfigOptions): boolean => {
	return options.withTeams === true
		&& canOfferTeams(options)
		&& FeatureManager.isFeatureAvailable(Feature.teamsInStructureAvailable);
};

// Whether the identifier of an item is the portal user id itself. A person of the portal and a bot
// share one space of identifiers, so for both the id is read as the number the server is sent.
// Adding a member is a wider question than this one: an item of the recent tab adds a member as well,
// yet it is identified by a dialog id and keeps the user id in its custom data.
export const isPersonEntity = (entityId: string): boolean => {
	return PERSON_ENTITIES.has(entityId);
};

// Which node of the org structure a made selection may carry to the target. A chat and the project
// behind a collab take the same ones, so the target the selection lands on does not enter the answer.
export const isLinkableNodeEntity = (entityId: string): boolean => {
	return NODE_ENTITIES.has(entityId);
};

export const canLinkStructureNodeToChat = (options: EntitySelectorConfigOptions = {}): boolean => {
	return isEmployee() && acceptsStructureNodes(options.chatType) && canLinkStructureNode(options.dialogId);
};

const canLinkDepartments = (options: EntitySelectorConfigOptions): boolean => {
	// A project takes departments from anyone allowed to invite into it, the server checks nothing else.
	if (linksToCollabProject(options))
	{
		return true;
	}

	return acceptsStructureNodes(options.chatType) && canLinkStructureNode(options.dialogId);
};

const canOfferTeams = (options: EntitySelectorConfigOptions): boolean => {
	if (linksToCollabProject(options))
	{
		return isEmployee();
	}

	return canLinkStructureNodeToChat(options);
};

const linksToCollabProject = (options: EntitySelectorConfigOptions): boolean => {
	return options.structureTarget === StructureTarget.collabProject;
};

const isEmployee = (): boolean => {
	return PermissionManager.getInstance().canPerformActionByUserType(ActionByUserType.linkStructureNode);
};

const acceptsStructureNodes = (chatType?: string): boolean => {
	return chatType === undefined || CHAT_TYPES_ACCEPTING_NODES.has(chatType);
};

const canLinkStructureNode = (dialogId?: string): boolean => {
	if (dialogId === undefined)
	{
		return true;
	}

	return PermissionManager.getInstance().canPerformActionByRole(ActionByRole.linkStructureNode, dialogId);
};
