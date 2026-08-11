import { useCallStore } from 'call.store';
import { UserTile } from './user-tile';

// @vue/component
export const VideoGrid = {
	name: 'call-video-grid',
	components: {
		UserTile,
	},
	inject: {
		callActionBridge: {
			default: () => ({ emit: () => {} }),
		},
	},
	setup()
	{
		const callStore = useCallStore();

		return { callStore };
	},
	computed: {
		users()
		{
			return this.callStore.users;
		},
		pinnedUserId()
		{
			return this.callStore.pinnedUserId;
		},
		layout()
		{
			return this.callStore.layout;
		},
		localUserId()
		{
			return this.callStore.localUserId;
		},
		localStreamVersion()
		{
			return this.callStore.localStreamVersion;
		},
		layoutModifier()
		{
			return '--layout-' + String(this.layout).toLowerCase();
		},
		sortedUserIds()
		{
			const ids = Object.keys(this.users)
				.map(Number)
				.filter((id) => id !== this.localUserId);

			return ids.sort((a, b) =>
			{
				if (a === this.pinnedUserId)
				{
					return -1;
				}

				if (b === this.pinnedUserId)
				{
					return 1;
				}

				return a - b;
			});
		},
	},
	methods: {
		onUserClick(userId)
		{
			this.callActionBridge.emit('onSetCentralUser', { userId });
		},
	},
	template: /* HTML */`
		<div class="call-video-grid" :class="layoutModifier">
			<UserTile
				v-if="localUserId"
				:userId="localUserId"
				:isLocal="true"
				:localStreamVersion="localStreamVersion"
				key="local"
			/>
			<UserTile
				v-for="userId in sortedUserIds"
				:key="userId"
				:userId="userId"
				@click="onUserClick(userId)"
			/>
		</div>
	`,
};
