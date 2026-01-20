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
	},
	emits: ['edit', 'remove'],
	template: `
		<div class="tasks-field-users">
			<template v-for="userId in userIds">
				<User
					:taskId
					:userId
					:canAdd
					:inline
					:withClear="!single && !inline && (canRemove || userId === removableUserId)"
					:withMenu="isEdit && (canRemove || removableUserId === userId)"
					@edit="$emit('edit')"
					@remove="$emit('remove', userId)"
				/>
			</template>
		</div>
	`,
};
