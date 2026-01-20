import { Loader as UILoader } from 'ui.loader';

const LOADER_TYPE = 'BULLET';

// @vue/component
export const Loader = {
	name: 'EditorChartLoader',
	mounted(): void
	{
		this.loader = new UILoader({
			target: this.$refs['editor-chart-loader'],
			type: LOADER_TYPE,
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
		<div ref="editor-chart-loader"></div>
	`,
};
