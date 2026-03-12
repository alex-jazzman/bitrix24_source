import './canvas-map-btn.css';
import { computed } from 'ui.vue3';

type CanvasMapBtnSetup = {
	btnStyle: { [string]: string};
	currentIconColor: string;
};

const DEFAULT_ICON_COLOR = 'var(--ui-color-base-4)';
const DEFAULT_CLICKED_ICON_COLOR = 'var(--ui-color-accent-main-primary)';

// @vue/component
export const CanvasMapBtn = {
	name: 'canvas-map-btn',
	props: {
		width: {
			type: Number,
			default: 28,
		},
		height: {
			type: Number,
			default: 32,
		},
		iconColor: {
			type: String,
			default: DEFAULT_ICON_COLOR,
		},
		clickedIconColor: {
			type: String,
			default: DEFAULT_CLICKED_ICON_COLOR,
		},
		isActive: {
			type: Boolean,
			default: false,
		},
	},
	setup(props): CanvasMapBtnSetup
	{
		const btnStyle = computed(() => ({
			width: `${props.width}px`,
			height: `${props.height}px`,
		}));

		const currentIconColor = computed(() => {
			return props.isActive ? props.clickedIconColor : props.iconColor;
		});

		return {
			btnStyle,
			currentIconColor,
		};
	},
	template: `
		<button
			:style="btnStyle"
			class="ui-block-diagram-canvas-map-btn"
		>
			<svg
				width="24"
				height="24"
				class="ui-block-diagram-canvas-map-btn__icon"
				:fill="currentIconColor"
			>
				<path
					d="M9.75 4.5498C9.8674 4.54983 9.97803 4.57878 10.0752 4.62988L14.25 6.7168L18.4365 4.62402C18.6535 4.51553 18.9118 4.52675 19.1182 4.6543C19.3244 4.78187 19.4502 5.00748 19.4502 5.25V16.5C19.4501 16.7651 19.2996 17.0074 19.0625 17.126L14.5752 19.3691C14.4835 19.4174 14.3796 19.4461 14.2695 19.4492C14.263 19.4494 14.2565 19.4502 14.25 19.4502C14.2419 19.4502 14.2337 19.4495 14.2256 19.4492C14.1172 19.4455 14.0143 19.4168 13.9238 19.3691L9.75 17.2822L5.5625 19.376C5.34565 19.4843 5.08807 19.4731 4.88184 19.3457C4.67552 19.2182 4.54987 18.9925 4.5498 18.75V7.5C4.5498 7.23498 4.69956 6.99266 4.93652 6.87402L9.42383 4.62988C9.52111 4.57866 9.63242 4.5498 9.75 4.5498ZM5.9502 7.93262V17.6172L9.0498 16.0674V6.38281L5.9502 7.93262ZM10.4502 16.0674L13.5498 17.6172V7.93262L10.4502 6.38281V16.0674ZM14.9502 7.93262V17.6172L18.0498 16.0674V6.38281L14.9502 7.93262Z"
				/>
			</svg>
		</button>
	`,
};
