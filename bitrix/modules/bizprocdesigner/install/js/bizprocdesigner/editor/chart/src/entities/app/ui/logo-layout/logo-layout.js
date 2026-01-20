import './logo-layout.css';

// @vue/component
export const LogoLayout = {
	name: 'LogoLayout',
	template: `
		<div class="editor-chart-logo-layout">
			<div class="editor-chart-logo-layout__back-btn">
				<slot name="back-btn"/>
			</div>
			<div class="editor-chart-logo-layout__logo-title">
				<slot name="title"/>
			</div>
		</div>
	`,
};
