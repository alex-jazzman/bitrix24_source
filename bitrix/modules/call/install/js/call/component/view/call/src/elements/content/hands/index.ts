import { defineComponent } from 'ui.vue3';

import { useUsersStore } from 'call.store';
import type { UsersStoreInstance } from 'call.store';
import type { LocFunction } from 'call.plugin.loc';

import { CallAvatar } from 'call.component.ui.avatar';
import { CallIcon } from 'call.component.ui.icon';

import './styles.css';

export interface QueueItem
{
	userId: number;
	userName: string;
	opacity: number;
}

export const CallContentHands = defineComponent({
	name: 'CallContentHands',
	components: {
		CallAvatar,
		CallIcon,
	},
	inject: {
		loc: { default: (): LocFunction => (key: string): string => key },
	},
	setup(): { usersStore: UsersStoreInstance }
	{
		return {
			usersStore: useUsersStore(),
		};
	},
	computed: {
		queueItems(): QueueItem[]
		{
			const maxVisible = 4;
			const ids = this.usersStore.raiseHandQueue.slice(0, maxVisible);

			return ids.map((userId: number, index: number) =>
			{
				const user = this.usersStore.userById(userId);

				return {
					userId,
					userName: user?.name || '',
					opacity: Math.max(0, 1 - index * 0.25),
				};
			}).filter((item: QueueItem): boolean => Boolean(item.userName));
		},
	},
	methods: {
		handleRemove(userId: number): void
		{
			this.usersStore.removeRaiseHand(userId);
		},
		userText(userName: string): string
		{
			return (this.loc as LocFunction)('CALL_RAISE_HAND_QUEUE_WANTS_TO_SPEAK', { '#USER_NAME#': userName });
		},
	},
	template: /* HTML */`
		<transition-group
			tag="div"
			class="call-raise-hand-queue"
			name="call-raise-hand-queue"
		>
				<div
					v-for="item in queueItems"
					:key="item.userId"
					class="call-raise-hand-queue__item"
					:style="{ opacity: item.opacity }"
				>
					<CallAvatar :label="item.userName" :size="20"/>
					<CallIcon icon="stop-hand-solid" :size="20"/>
					<span class="call-raise-hand-queue__text">{{ userText(item.userName) }}</span>
					<CallIcon icon="cross" :size="16" class="call-raise-hand-queue__cross" @click="handleRemove(item.userId)"/>
				</div>
		</transition-group>
	`,
});
