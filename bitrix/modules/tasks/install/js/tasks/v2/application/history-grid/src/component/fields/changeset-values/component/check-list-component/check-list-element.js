import './check-list-element.css';

export type CheckListChangeset = {
	title: ?string,
	isChecked: ?boolean,
};

// @vue/component
export const CheckListElement = {
	props: {
		value: {
			type: String,
			default: '',
		},
	},
	computed: {
		checkListItem(): CheckListChangeset
		{
			return JSON.parse(this.value);
		},
	},
	template: `
		<span
			class="tasks-history-grid-checklist-element"
			:class="{ '--checked' : checkListItem?.isChecked }"
		>
			{{ checkListItem?.title }}
		</span>
	`,
};
