import './user-element.css';

export type UserChangeset = {
	name: ?string,
	link: ?string,
	type: ?string,
};

// @vue/component
export const UserElement = {
	props: {
		/** @type UserChangeset */
		user: {
			type: Object,
			required: true,
		},
	},
	computed: {
		isCollaber(): boolean
		{
			return this.user?.type === 'collaber';
		},
	},
	template: `
		<a
			:href="user?.link"
			class="tasks-history-grid-user-element"
			:class="{ '--collaber': isCollaber }"
		>
			{{ user?.name }}
		</a>
	`,
};
