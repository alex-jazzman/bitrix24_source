import { DialogWrapperComponent } from '../common/dialog-wrapper-component';

export const AssignmentTypeSelector = {
	components: {
		DialogWrapperComponent,
	},

	props: {
		currentTypeId: {
			type: Number,
			required: true,
		},
		types: {
			type: Array,
			required: true,
		},
		readOnly: {
			type: Boolean,
			default: false,
		},
	},

	created()
	{
		this.tabs = [
			{ id: 'types', title: '' },
		];
	},

	watch: {
		currentTypeId(typeId: string): void
		{
			this.types.forEach((item) => {
				// eslint-disable-next-line no-param-reassign
				item.selected = (item.id === typeId);
			});
		},
	},

	// language=Vue
	template: `
		<DialogWrapperComponent
			:items="types"
			:tabs="tabs"
			:read-only="readOnly"
			:width=510
		/>
	`,
};
