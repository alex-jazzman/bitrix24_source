import { Loader } from 'ui.loader';

// @vue/component
export const InspectorSchemeLoadingView = {
	name: 'InspectorSchemeLoadingView',
	mounted(): void
	{
		this.loader = new Loader({
			target: this.$refs.container,
			type: 'BULLET',
			size: 'XS',
		});
		this.loader.render();
		this.loader.show();
	},
	beforeUnmount(): void
	{
		this.loader?.hide();
		this.loader = null;
	},
	template: `
		<li class="inspector-scheme-view__item">
			<div ref="container"></div>
		</li>
	`,
};
