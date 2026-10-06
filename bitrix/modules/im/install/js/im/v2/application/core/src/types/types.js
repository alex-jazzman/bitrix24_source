import { type RawSettings } from 'im.v2.const';
import {
	type ImModelUser,
	type ImModelAnchor,
	type ImModelCallItem,
	type ImModelTariffRestrictions,
	type ImModelCopilotAIModel,
	type ImModelCounter,
	type ImModelFolder,
} from 'im.v2.model';
import { type RawUser } from 'im.v2.provider.pull';

export type ApplicationData = {
	isCurrentUserAdmin: boolean,
	activeCalls: ImModelCallItem[],
	anchors: ImModelAnchor[],
	loggerConfig: { [key: string]: boolean },
	settings: RawSettings,
	tariffRestrictions: ImModelTariffRestrictions,
	preloadedEntities: PreloadedEntityType,
	copilot: {
		availableEngines: ImModelCopilotAIModel[],
		botName: string,
		agentName: string,
	},
	counters: ImModelCounter[],
	notificationCounter: number,
	folders: ImModelFolder[],
	folderLimits: FolderLimits,
	isGuestWelcome?: boolean,
	videoCallsTermsUrl?: string,
};

export type FolderLimits = {
	maxFolders: number,
	maxChatsPerFolder: number,
	maxTitleLength: number,
};

export type PreloadedEntityType = {
	users: ImModelUser[],
	legacyCurrentUser: RawUser,
};
