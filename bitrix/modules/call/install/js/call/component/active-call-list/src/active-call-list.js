import { ActiveCall } from 'call.component.active-call';

import type { ImModelCallItem } from 'im.v2.model';

import './css/active-call-list.css';

// @vue/component
export const ActiveCallList = {
	name: 'ActiveCallList',
	components: { ActiveCall },
	props: {
		listIsScrolled: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['onCallClick'],
	computed:
		{
			activeCalls(): ImModelCallItem[]
			{
				return this.$store.getters['recent/calls/get'];
			},
		},
	methods:
		{
			onCallClick({ item, $event })
			{
				this.$emit('onCallClick', { item, $event });
			},
		},
	template: `
		<template v-if="activeCalls.length > 0">
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
