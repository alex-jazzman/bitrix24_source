import { SlideAnimation } from 'im.v2.component.animation';

import { RecentUnreadListContainer } from './components/container';

// @vue/component
export const RecentUnreadListSlider = {
	name: 'RecentUnreadListSlider',
	components: { RecentUnreadListContainer, SlideAnimation },
	props: {
		unreadOnlyMode: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['chatClick', 'toggleUnreadMode'],
	template: `
		<SlideAnimation>
			<RecentUnreadListContainer 
				v-if="unreadOnlyMode"
				@chatClick="$emit('chatClick', $event)" 
				@toggleUnreadMode="$emit('toggleUnreadMode')"
			/>
		</SlideAnimation>
	`,
};
