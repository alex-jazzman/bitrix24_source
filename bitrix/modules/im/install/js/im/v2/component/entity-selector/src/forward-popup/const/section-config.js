import { Loc } from 'main.core';

import { ForwardAllSection, type ForwardSectionId } from 'im.v2.component.search';
import { RecentType } from 'im.v2.const';
import { CopilotManager } from 'im.v2.lib.copilot';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

import { currentUserHasChannels } from '../helpers/current-user';

export type ForwardSectionItem = {
	type: ForwardSectionId,
	getTitle: () => string,
	isAvailable: () => boolean,
};

const getCopilotTitle = () => Loc.getMessage('IM_ENTITY_SELECTOR_FORWARD_TAB_COPILOT', {
	'#COPILOT_NAME#': (new CopilotManager()).getName(),
});

export const ForwardSectionConfig: { [ForwardSectionId]: ForwardSectionItem } = {
	[ForwardAllSection]: {
		type: ForwardAllSection,
		getTitle: () => Loc.getMessage('IM_ENTITY_SELECTOR_FORWARD_TAB_ALL'),
		isAvailable: () => true,
	},
	[RecentType.default]: {
		type: RecentType.default,
		getTitle: () => Loc.getMessage('IM_ENTITY_SELECTOR_FORWARD_TAB_CHATS'),
		isAvailable: () => true,
	},
	[RecentType.taskComments]: {
		type: RecentType.taskComments,
		getTitle: () => Loc.getMessage('IM_ENTITY_SELECTOR_FORWARD_TAB_TASKS'),
		isAvailable: () => true,
	},
	[RecentType.collab]: {
		type: RecentType.collab,
		getTitle: () => {
			return FeatureManager.isFeatureAvailable(Feature.isCollabV2Available)
				? Loc.getMessage('IM_ENTITY_SELECTOR_FORWARD_TAB_COLLABS_V2')
				: Loc.getMessage('IM_ENTITY_SELECTOR_FORWARD_TAB_COLLABS');
		},
		isAvailable: () => true,
	},
	[RecentType.openChannel]: {
		type: RecentType.openChannel,
		getTitle: () => Loc.getMessage('IM_ENTITY_SELECTOR_FORWARD_TAB_CHANNELS'),
		isAvailable: () => currentUserHasChannels(),
	},
	[RecentType.copilot]: {
		type: RecentType.copilot,
		getTitle: getCopilotTitle,
		isAvailable: () => FeatureManager.isFeatureAvailable(Feature.copilotAvailable)
			&& FeatureManager.isFeatureAvailable(Feature.copilotActive),
	},
};
