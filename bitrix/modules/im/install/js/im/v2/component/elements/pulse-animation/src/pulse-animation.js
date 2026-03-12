import './css/pulse-animation.css';

const RING_COUNT = 3;

// @vue/component
export const PulseAnimation = {
	name: 'PulseAnimation',
	props: {
		showPulse: {
			type: Boolean,
			default: true,
		},
		color: {
			type: String,
			default: null,
		},
		innerSize: {
			type: Number,
			default: null,
		},
		outerSize: {
			type: Number,
			default: null,
		},
	},
	computed: {
		rings(): number[]
		{
			if (!this.showPulse)
			{
				return [];
			}

			return Array.from({ length: RING_COUNT });
		},
		inlineInnerSize(): string
		{
			return this.innerSize ? `--im-pulse-animation__size_ring-inner: ${this.innerSize}px;` : '';
		},
		inlineOuterSize(): string
		{
			return this.outerSize ? `--im-pulse-animation__size_ring-outer: ${this.outerSize}px;` : '';
		},
		inlineColor(): string
		{
			return this.color ? `--im-pulse-animation__border-color_ring: ${this.color};` : '';
		},
		inlineStyle(): string
		{
			return this.inlineInnerSize + this.inlineOuterSize + this.inlineColor;
		},
	},
	template: `
		<div class="bx-im-pulse-animation__container" :style="inlineStyle">
			<slot />
			<div class="bx-im-pulse-animation__rings">
				<div
					v-for="ring in rings"
					:key="ring"
					class="bx-im-pulse-animation__ring"
				></div>
			</div>
		</div>
	`,
};
