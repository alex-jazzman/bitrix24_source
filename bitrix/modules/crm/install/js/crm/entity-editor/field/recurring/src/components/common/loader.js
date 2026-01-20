import { Loader as UiLoader } from 'ui.loader';

const LOADER_SIZE = 'xs';
const LOADER_TYPE = 'BULLET';

// @vue/component
export const Loader = {
	mounted(): void
	{
		this.loader = new UiLoader({
			target: this.$refs.loader,
			type: LOADER_TYPE,
			size: LOADER_SIZE,
		});
		this.loader.render();
		this.loader.show();
	},

	beforeUnmount(): void
	{
		this.loader.hide();
		this.loader = null;
	},

	template: `
		<div class="crm-entity-widget-content-block-recurring-loader" ref="loader"></div>
	`,
};
