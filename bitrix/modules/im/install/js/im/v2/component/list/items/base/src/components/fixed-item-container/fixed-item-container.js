import './css/fixed-item-container.css';

// @vue/component
export const FixedItemContainer = {
	name: 'FixedItemContainer',
	template: `
		<div class="bx-im-list-base__fixed_container">
			<slot></slot>
		</div>
	`,
};
