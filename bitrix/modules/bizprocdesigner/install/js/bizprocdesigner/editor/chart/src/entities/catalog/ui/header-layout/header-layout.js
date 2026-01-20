import './header-layout.css';

// @vue/component
export const HeaderLayout = {
	name: 'header-layout',
	props: {
		expanded: {
			type: Boolean,
			default: false,
		},
	},
	template: `
		<header class="editor-chart-catalog-header-layout">
			<div class="editor-chart-catalog-header-layout__switcher-btn">
			<slot name="switcher"/>
		</div>
			<div
				class="editor-chart-catalog-header-layout__logo"
			>
				<slot name="logo"/>
			</div>
		</header>
	`,
};
