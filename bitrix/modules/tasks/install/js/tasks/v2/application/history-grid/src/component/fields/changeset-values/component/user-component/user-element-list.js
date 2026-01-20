import { UserElement } from './user-element';
import type { UserChangeset } from './user-element';

// @vue/component
export const UserElementList = {
	components: {
		UserElement,
	},
	props: {
		value: {
			type: String,
			default: '',
		},
	},
	computed: {
		users(): UserChangeset[]
		{
			return JSON.parse(this.value);
		},
	},
	template: `
		<template v-for="(user, index) of users" :key="index">
			<UserElement :user/>{{ index < users.length - 1 ? ', ': '' }}
		</template>
	`,
};
