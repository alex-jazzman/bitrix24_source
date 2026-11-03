// @vue/component
export const ReferenceRow = {
	name: 'ReferenceRow',
	props:
	{
		action: {
			type: String,
			required: true,
		},
		cells: {
			type: Array,
			required: true,
		},
	},
	template: `
		<div class="bx-im-settings-hotkey-reference__row" role="row">
			<span class="bx-im-settings-hotkey-reference__action" role="rowheader">{{ action }}</span>
			<span
				v-for="(cell, index) in cells"
				:key="index"
				class="bx-im-settings-hotkey-reference__cell"
				role="cell"
			>{{ cell }}</span>
		</div>
	`,
};
