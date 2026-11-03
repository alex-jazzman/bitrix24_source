import { ActiveCall } from 'call.widget.active-call';
import { SyncActiveCallsSlot, isSyncActiveCallsEnabled } from 'call.widget.sync-active-calls-slot';

import type { ImModelCallItem } from 'im.v2.model';

import './css/active-call-list.css';

// @vue/component
export const ActiveCallList = {
	name: 'ActiveCallList',
	components: { ActiveCall, SyncActiveCallsSlot },
	inject: {
		avatarsOnly: {
			default: false,
		},
	},
	props: {
		listIsScrolled: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['onCallClick'],
	data(): { syncCallsCount: number }
	{
		return {
			syncCallsCount: 0,
		};
	},
	computed:
		{
			activeCalls(): ImModelCallItem[]
			{
				return this.$store.getters['recent/calls/get'].filter((activeCall) => {
					const dialog = this.$store.getters['chats/get'](activeCall.dialogId, true);

					return Number(dialog.dialogId) !== 0;
				});
			},
			syncActiveCallsEnabled(): boolean
			{
				return isSyncActiveCallsEnabled();
			},
			syncActiveCallsMode(): string
			{
				return this.avatarsOnly ? 'compact' : 'full';
			},
		},
	methods:
		{
			onCallClick({ item, $event })
			{
				this.$emit('onCallClick', { item, $event });
			},
			onSyncCallsCountChange(count: number)
			{
				this.syncCallsCount = count;
			},
		},
	template: `
		<div
			v-if="syncActiveCallsEnabled"
			v-show="activeCalls.length > 0 || syncCallsCount > 0"
			class="bx-im-list-recent__calls_container"
			:class="{'--with-shadow': listIsScrolled}"
		>
			<ActiveCall
				v-for="activeCall in activeCalls"
				:key="activeCall.dialogId"
				:item="activeCall"
				@click="onCallClick"
			/>
			<SyncActiveCallsSlot :mode="syncActiveCallsMode" @countChange="onSyncCallsCountChange" />
		</div>
		<template v-else-if="activeCalls.length > 0">
			<div class="bx-im-list-recent__calls_container" :class="{'--with-shadow': listIsScrolled}">
				<ActiveCall
					v-for="activeCall in activeCalls"
					:key="activeCall.dialogId"
					:item="activeCall"
					@click="onCallClick"
				/>
			</div>
		</template>
	`,
};
