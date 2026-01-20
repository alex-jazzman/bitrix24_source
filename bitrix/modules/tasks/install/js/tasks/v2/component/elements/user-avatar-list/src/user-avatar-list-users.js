import 'ui.tooltip';

import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import { UserLabel } from 'tasks.v2.component.elements.user-label';

import './user-avatar-list-users.css';

// @vue/component
export const UserAvatarListUsers = {
	components: {
		HoverPill,
		UserLabel,
	},
	props: {
		users: {
			type: Array,
			required: true,
		},
		readonly: {
			type: Boolean,
			default: false,
		},
		removableUserId: {
			type: Number,
			default: 0,
		},
		activeUserId: {
			type: Number,
			default: 0,
		},
		compact: {
			type: Boolean,
			default: false,
		},
		withoutClear: {
			type: Boolean,
			default: false,
		},
	},
	emits: [
		'onUserClick',
		'onUserCrossClick',
	],
	methods: {
		getNode(userId: number): ?HTMLElement
		{
			return this.$refs[`user_${userId}`]?.[0].$el;
		},
	},
	template: `
		<template v-for="user in users" :key="user.id">
			<HoverPill
				class="b24-user-avatar-list-user"
				:compact
				:withClear="!withoutClear && (!readonly || user.id === removableUserId) && !compact"
				:active="activeUserId === user.id"
				@click.stop="$emit('onUserClick', user.id)"
				@clear="$emit('onUserCrossClick', user.id)"
			>
				<UserLabel :user :ref="'user_' + user.id" :avatarOnly="compact"/>
			</HoverPill>
		</template>
	`,
};
