import { UserAvatar, UserAvatarSize } from 'tasks.v2.component.elements.user-avatar';
import type { UserModel } from 'tasks.v2.model.users';

import './user-checkbox.css';

// @vue/component
export const UserCheckbox = {
	name: 'UiUserCheckbox',
	components: {
		UserAvatar,
	},
	props: {
		/** @type UserModel */
		initUser: {
			type: Object,
			required: true,
		},
		number: {
			type: Number,
			required: true,
		},
		checked: {
			type: Boolean,
			default: false,
		},
		ariaLabel: {
			type: String,
			default: '',
		},
		role: {
			type: String,
			default: 'switch',
		},
	},
	emits: [
		'update:checked',
	],
	setup(): Object
	{
		return {
			UserAvatarSize,
		};
	},
	computed: {
		user(): UserModel
		{
			return this.initUser;
		},
		containerClasses(): Object
		{
			return {
				'b24-user-checkbox-container': true,
				'--checked': this.checked,
			};
		},
	},
	methods: {
		toggleCheck()
		{
			this.$emit('update:checked', !this.checked);
		},
		handleKeydown(event: KeyboardEvent): void
		{
			if (event.key === 'Enter' || event.key === ' ')
			{
				event.preventDefault();
				this.toggleCheck();
			}
		},
	},
	template: `
		<div
			:class="containerClasses"
			:role="role"
			:aria-checked="checked ? 'true' : 'false'"
			:aria-label="ariaLabel || null"
			tabindex="0"
			@click="toggleCheck"
			@keydown="handleKeydown"
		>
			<div class="b24-user-checkbox-avatar">
				<UserAvatar
					:key="user.id"
					:id="user.id"
					:src="user.image"
					:type="user.type"
					:size="UserAvatarSize.XS"
					class="b24-user-checkbox-avatar-item"
				/>
			</div>
			<div class="b24-user-checkbox-number">
				{{ number }}
			</div>
		</div>
	`,
};
