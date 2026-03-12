import { User } from '../user/user';

// @vue/component
export const Users = {
	components: {
		User,
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		isEdit: {
			type: Boolean,
			default: false,
		},
		userIds: {
			type: Array,
			required: true,
		},
		canAdd: {
			type: Boolean,
			default: false,
		},
		canRemove: {
			type: Boolean,
			default: false,
		},
		removableUserId: {
			type: Number,
			default: 0,
		},
		single: {
			type: Boolean,
			default: false,
		},
		inline: {
			type: Boolean,
			default: false,
		},
		showMenu: {
			type: Boolean,
			default: true,
		},
		forceEdit: {
			type: Boolean,
			default: false,
		},
		fromPopup: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['edit', 'remove'],
	computed: {
		isSafari(): boolean
		{
			return BX.browser.IsSafari();
		},
	},
	template: `
		<div
			class="tasks-field-users"
			:class="{
				'--safari': isSafari,
				'--overflow': fromPopup,
			}"
		>
			<template v-for="userId in userIds">
				<User
					:taskId
					:userId
					:forceEdit
					:canAdd="canAdd && single"
					:withClear="!single && !inline && (canRemove || userId === removableUserId)"
					:withMenu="showMenu && isEdit && (canRemove || removableUserId === userId)"
					@edit="$emit('edit')"
					@remove="$emit('remove', userId)"
				/>
			</template>
		</div>
	`,
};
