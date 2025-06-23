import { ChatButton, ButtonSize, ButtonColor } from 'im.v2.component.elements.button';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { InviteManager } from 'im.v2.lib.invite';

import '../css/empty-state.css';

// @vue/component
export const EmptyState = {
	name: 'EmptyState',
	components: { ChatButton },
	computed:
	{
		ButtonSize: () => ButtonSize,
		ButtonColor: () => ButtonColor,
		canInviteUsers(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.intranetInviteAvailable);
		},
	},
	methods:
	{
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
		<div class="bx-im-list-recent-empty-state__container">
			<div class="bx-im-list-recent-empty-state__image"></div>
			<div class="bx-im-list-recent-empty-state__title">{{ loc('IM_LIST_RECENT_EMPTY_STATE_TITLE') }}</div>
			<div class="bx-im-list-recent-empty-state__subtitle">{{ loc('IM_LIST_RECENT_EMPTY_STATE_SUBTITLE') }}</div>
			<div v-if="canInviteUsers" class="bx-im-list-recent-empty-state__button">
				<ChatButton
					:size="ButtonSize.L"
					:isRounded="true"
					:text="loc('IM_LIST_RECENT_EMPTY_STATE_INVITE_USERS')"
					@click="onInviteUsersClick"
				/>
			</div>
		</div>
	`,
};
