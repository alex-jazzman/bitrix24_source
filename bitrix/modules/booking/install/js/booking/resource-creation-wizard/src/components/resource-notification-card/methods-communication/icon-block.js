import { BIcon as Icon, Outline } from 'ui.icon-set.api.core';
import { Communication } from 'booking.const';

// @vue/component
export const IconBlock = {
	name: 'IconBlock',
	components: {
		Icon,
	},
	props: {
		senderCode: {
			type: String,
			required: true,
		},
		isActive: {
			type: Boolean,
			required: true,
		},
	},
	setup(): { Outline: typeof Outline, Communication: typeof Communication }
	{
		return {
			Communication,
			Outline,
		};
	},
	computed: {
		iconColor(): string
		{
			return this.isActive ? 'var(--ui-color-accent-main-primary)' : 'var(--ui-color-base-4)';
		},
	},
	template: `
		<div v-if="senderCode ===  Communication.AiCall"
			class="resource-notification-card-communication-item-icon --ai_call"
		>
		</div>
		<div v-else class="resource-notification-card-communication-item-icon --bitrix" >
			<Icon
				:name="Outline.CHATS"
				:color="iconColor"
			/>
		</div>
	`,
};
