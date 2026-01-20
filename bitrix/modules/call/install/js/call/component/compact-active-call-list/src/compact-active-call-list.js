// @vue/component
import { CompactActiveCall } from 'call.component.compact-active-call';
import type { ImModelCallItem } from 'im.v2.model';

import './css/compact-active-call-list.css';

export const CompactActiveCallList = {
	name: 'CompactActiveCallList',
	components: { CompactActiveCall },
	props: {},
	emits: ['click'],
	computed:
		{
			activeCalls(): ImModelCallItem[]
			{
				return this.$store.getters['recent/calls/get'];
			},
		},
	methods:
		{
			onClick(params)
			{
				this.$emit('click', params);
			},
		},
	template: `
		<template v-if="activeCalls.length > 0">
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
