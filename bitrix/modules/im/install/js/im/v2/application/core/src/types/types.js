import type { RawSettings } from 'im.v2.const';
import type { ImModelUser, ImModelAnchor, ImModelCallItem, ImModelTariffRestrictions, ImModelCopilotAIModel } from 'im.v2.model';
import type { RawUser } from 'im.v2.provider.pull';

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
	},
};

export type PreloadedEntityType = {
	users: ImModelUser[],
	legacyCurrentUser: RawUser,
};
