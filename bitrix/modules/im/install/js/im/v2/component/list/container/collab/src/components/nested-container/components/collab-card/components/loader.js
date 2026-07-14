import { Loader } from 'main.loader';

// @vue/component
export const CardButtonLoader = {
	name: 'CardButtonLoader',
	mounted()
	{
		this.loader = new Loader({
			target: this.$refs['loader-container'],
			size: 18,
			color: '#525c69',
		});

		void this.loader.show();
	},
	beforeUnmount()
	{
		this.loader.destroy();
	},
	template: `
		<div class="bx-im-nested-list-collab-card__button_loader" ref="loader-container"></div>
	`,
};
