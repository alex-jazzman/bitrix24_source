export type CrmChangeset = {
	title: ?string,
	link: ?string,
};

// @vue/component
export const CrmElement = {
	props: {
		/** @type CrmChangeset */
		crmItem: {
			type: Object,
			required: true,
		},
	},
	template: `
		<a :href="crmItem?.link">{{ crmItem?.title }}</a>
	`,
};
