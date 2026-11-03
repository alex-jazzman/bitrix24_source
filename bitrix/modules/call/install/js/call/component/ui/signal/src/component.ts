import { defineComponent } from 'ui.vue3';

import './css/signal.css';

type SignalQuality = 'excellent' | 'good' | 'poor' | 'bad';

export const CallSignal = defineComponent({
	name: 'CallSignal',
	props: {
		dataLoss: {
			type: Number,
			default: 0,
		},
	},
	computed: {
		quality(): SignalQuality
		{
			if (this.dataLoss <= 10)
			{
				return 'excellent';
			}

			if (this.dataLoss > 10 && this.dataLoss <= 20)
			{
				return 'good';
			}

			if (this.dataLoss > 20 && this.dataLoss <= 30)
			{
				return 'poor';
			}

			return 'bad';
		},
		additionalClasses(): string[]
		{
			return [`--${this.quality}`];
		},
	},
	template: /* HTML */`
		<div class="call-signal" :class="additionalClasses">
			<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
				<path d="M0 5.3665C0 4.9799 0.313401 4.6665 0.7 4.6665H1.4C1.7866 4.6665 2.1 4.9799 2.1 5.3665V8.63317C2.1 9.01977 1.7866 9.33317 1.4 9.33317H0.7C0.313401 9.33317 0 9.01977 0 8.63317V5.3665Z"/>
				<path d="M3.6167 3.03325C3.6167 2.64665 3.9301 2.33325 4.3167 2.33325H5.0167C5.4033 2.33325 5.7167 2.64665 5.7167 3.03325V8.63325C5.7167 9.01985 5.4033 9.33325 5.0167 9.33325H4.3167C3.9301 9.33325 3.6167 9.01985 3.6167 8.63325V3.03325Z"/>
				<path d="M7.2334 0.7C7.2334 0.313401 7.5468 0 7.9334 0H8.6334C9.02 0 9.3334 0.313401 9.3334 0.7V8.63333C9.3334 9.01993 9.02 9.33333 8.6334 9.33333H7.9334C7.5468 9.33333 7.2334 9.01993 7.2334 8.63333V0.7Z"/>
			</svg>
		</div>
	`,
});
