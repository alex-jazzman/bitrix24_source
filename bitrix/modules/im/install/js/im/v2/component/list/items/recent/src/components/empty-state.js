import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';

import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { InviteManager } from 'im.v2.lib.invite';
import { RecentType } from 'im.v2.const';
import { RecentEmptyState } from 'im.v2.component.list.items.elements.empty-state';

// @vue/component
export const EmptyState = {
	name: 'EmptyState',
	components: { RecentEmptyState, UiButton },
	computed: {
		RecentType: () => RecentType,
		AirButtonStyle: () => AirButtonStyle,
		OutlineIcons: () => OutlineIcons,
		ButtonSize: () => ButtonSize,
		canInviteUsers(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.intranetInviteAvailable);
		},
	},
	methods: {
		onInviteUsersClick(): void
		{
			InviteManager.openInviteSlider();
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<RecentEmptyState
			:title="loc('IM_LIST_RECENT_EMPTY_STATE_TITLE_MSGVER_1')"
			:subtitle="loc('IM_LIST_RECENT_EMPTY_STATE_SUBTITLE_MSGVER_1')"
			:recentSection="RecentType.default"
		>
			<UiButton
				v-if="canInviteUsers"
				:style="AirButtonStyle.FILLED"
				:leftIcon="OutlineIcons.PLUS_L"
				:text="loc('IM_LIST_RECENT_EMPTY_STATE_INVITE_USERS')"
				@click="onInviteUsersClick"
			/>
		</RecentEmptyState>
	`,
};
