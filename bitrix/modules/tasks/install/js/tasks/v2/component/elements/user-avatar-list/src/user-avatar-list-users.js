import { BIcon } from 'ui.icon-set.api.vue';
import { Outline } from 'ui.icon-set.api.core';
import 'ui.icon-set.outline';
import 'ui.tooltip';

import { UserAvatar } from 'tasks.v2.component.elements.user-avatar';

import './user-avatar-list-users.css';

// @vue/component
export const UserAvatarListUsers = {
	components: {
		BIcon,
		UserAvatar,
	},
	props: {
		users: {
			type: Array,
			required: true,
		},
		withCross: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['onClick', 'onCrossClick'],
	setup(): Object
	{
		return {
			Outline,
		};
	},
	methods: {
		getNode(userId: number): ?HTMLElement
		{
			return this.$refs[`user_${userId}`]?.[0];
		},
	},
	template: `
		<template v-for="(user, index) of users" :key="user.id">
			<div class="b24-user-avatar-list-user-container" :data-user-id="user.id">
				<div class="b24-user-avatar-list-user" :ref="'user_' + user.id" :class="'--' + user.type">
					<div
						class="b24-user-avatar-list-user-label"
						:bx-tooltip-user-id="user.id"
						bx-tooltip-context="b24"
						@click="$emit('onClick', user.id)"
					>
						<span class="b24-user-avatar-list-user-image">
							<UserAvatar :src="user.image" :type="user.type"/>
						</span>
						<span class="b24-user-avatar-list-user-title">{{ user.name }}</span>
					</div>
					<BIcon
						v-if="withCross"
						class="b24-user-avatar-list-user-cross"
						:name="Outline.CROSS_L"
						@click="$emit('onCrossClick', user.id)"
					/>
				</div>
				<slot v-if="index === 0" name="addButton"></slot>
			</div>
		</template>
	`,
};
