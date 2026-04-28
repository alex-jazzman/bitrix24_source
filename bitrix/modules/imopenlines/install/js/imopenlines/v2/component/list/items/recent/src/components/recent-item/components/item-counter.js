import type { ImModelChat } from 'im.v2.model';
import type { ImolModelRecentItem } from 'imopenliens.v2.model';

// @vue/component
export const ItemCounter = {
	name: 'ItemCounter',
	props:
	{
		item: {
			type: Object,
			required: true,
		},
	},
	computed:
	{
		recentItem(): ImolModelRecentItem
		{
			return this.item;
		},
		dialog(): ?ImModelChat
		{
			return this.$store.getters['chats/get'](this.item.dialogId);
		},
		counter(): number
		{
			return this.$store.getters['counters/getCounterByChatId'](this.dialog.chatId);
		},
		formattedCounter(): string
		{
			return this.formatCounter(this.counter);
		},
	},
	methods:
	{
		formatCounter(counter: number): string
		{
			return counter > 99 ? '99+' : counter.toString();
		},
	},
	template: `
		<div class="bx-imol-list-recent-item__counter_wrap">
			<div class="bx-imol-list-recent-item__counter_container">
				<div v-if="formattedCounter > 0" class="bx-imol-list-recent-item__counter_number">
					{{ formattedCounter }}
				</div>
			</div>
		</div>
	`,
};
