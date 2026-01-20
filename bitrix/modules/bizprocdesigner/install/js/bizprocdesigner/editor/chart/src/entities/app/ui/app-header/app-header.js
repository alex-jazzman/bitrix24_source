import './app-header.css';

// @vue/component
export const AppHeader = {
	name: 'AppHeader',
	template: `
		<header class="editor-chart-app-header">
			<div class="editor-chart-app-header__left-column">
				<slot name="left"/>
			</div>
			<div class="editor-chart-app-header__right-column">
				<slot name="right"/>
			</div>
		</header>
	`,
};
