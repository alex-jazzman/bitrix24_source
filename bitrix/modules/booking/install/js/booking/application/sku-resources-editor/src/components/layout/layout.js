import './layout.css';

// @vue/component
export const SkuResourcesEditorLayout = {
	name: 'SkuResourcesEditorLayout',
	template: `
		<div class="booking-sre-app__layout">
			<div class="booking-sre-app__wrapper">
				<slot name="header"/>
				<div class="booking-sre-app__content">
					<slot/>
				</div>
			</div>
			<slot name="footer"/>
		</div>
	`,
};
