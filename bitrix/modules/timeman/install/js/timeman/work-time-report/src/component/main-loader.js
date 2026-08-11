// @vue/component
export const MainLoader = {
	name: 'MainLoader',
	props: {
		size: {
			type: Number,
			default: 48,
		},
	},
	computed: {
		wrapperStyle(): Object
		{
			return {
				width: `${this.size}px`,
				height: `${this.size}px`,
			};
		},
	},
	template: `
		<div
			class="main-ui-loader main-ui-loader-inline main-ui-show"
			:style="wrapperStyle"
		>
			<svg class="main-ui-loader-svg" viewBox="25 25 50 50">
				<circle class="main-ui-loader-svg-circle" cx="50" cy="50" r="20" fill="none" stroke-miterlimit="10"></circle>
			</svg>
		</div>
	`,
};
