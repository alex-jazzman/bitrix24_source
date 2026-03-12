import { RecentUnreadList } from 'im.v2.component.list.items.recent';

import './css/container.css';

// @vue/component
export const RecentUnreadListContainer = {
	name: 'RecentUnreadListContainer',
	components: { RecentUnreadList },
	emits: ['chatClick', 'toggleUnreadMode'],
	methods: {
		closeUnreadMode()
		{
			this.$emit('toggleUnreadMode');
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-list-container-recent-unread-slider">
			<div class="bx-im-list-container-recent-unread-slider__header">
				<div class="bx-im-list-container-recent-unread-slider__back-icon" @click="closeUnreadMode"></div>
				<div class="bx-im-list-container-recent-unread-slider__title">{{ loc('IM_LIST_UNREAD_RECENT_SLIDER_TITLE') }}</div>
			</div>
			<div class="bx-im-list-container-recent-unread-slider__content">
				<RecentUnreadList @chatClick="$emit('chatClick', $event)" />
			</div>
		</div>
	`,
};
