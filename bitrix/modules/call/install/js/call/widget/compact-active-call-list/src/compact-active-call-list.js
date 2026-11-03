// @vue/component
import { CompactActiveCall } from 'call.widget.compact-active-call';
import { SyncActiveCallsSlot, isSyncActiveCallsEnabled } from 'call.widget.sync-active-calls-slot';
import type { ImModelCallItem } from 'im.v2.model';

import './css/compact-active-call-list.css';

export const CompactActiveCallList = {
	name: 'CompactActiveCallList',
	components: { CompactActiveCall, SyncActiveCallsSlot },
	props: {},
	emits: ['click'],
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
				return this.$store.getters['recent/calls/get'];
			},
			syncActiveCallsEnabled(): boolean
			{
				return isSyncActiveCallsEnabled();
			},
		},
	methods:
		{
			onClick(params)
			{
				this.$emit('click', params);
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
			class="bx-im-list-recent-compact__calls_container"
		>
			<CompactActiveCall
				v-for="activeCall in activeCalls"
				:key="activeCall.dialogId"
				:item="activeCall"
				@click="onClick"
			/>
			<SyncActiveCallsSlot mode="compact" @countChange="onSyncCallsCountChange" />
		</div>
		<template v-else-if="activeCalls.length > 0">
			<div class="bx-im-list-recent-compact__calls_container">
				<CompactActiveCall
					v-for="activeCall in activeCalls"
					:key="activeCall.dialogId"
					:item="activeCall"
					@click="onClick"
				/>
			</div>
		</template>
	`,
};
