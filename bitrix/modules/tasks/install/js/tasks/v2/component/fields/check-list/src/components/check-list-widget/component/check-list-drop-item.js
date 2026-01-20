// @vue/component
export const CheckListDropItem = {
	name: 'CheckListDropItem',
	props: {
		dropOffset: {
			type: String,
			default: '0',
		},
	},
	template: `
		<div class="check-list-widget-drop-item" :style="{ marginLeft: dropOffset }"/>
	`,
};
