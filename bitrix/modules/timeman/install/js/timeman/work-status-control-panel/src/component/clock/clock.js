import './clock.css';

// @vue/component
export const Clock = {
	components: {
	},
	props: {
		time: {
			type: Number,
			required: true,
		},
		isHourShown: {
			type: Boolean,
			default: true,
		},
		isMinuteShown: {
			type: Boolean,
			default: true,
		},
		isSecondShown: {
			type: Boolean,
			default: true,
		},
	},
	emits: [
	],
	setup(): Object
	{
		return {
		};
	},
	data(): Object
	{
		return {
		};
	},
	mounted(): void
	{
	},
	updated(): void
	{
	},
	methods: {

		convertMillisecondsToHrMinSec(time: number): any
		{
			const timeFullSeconds = Math.floor(time / 1000);
			const hours = Math.floor(timeFullSeconds / 3600);
			const minutes = Math.floor(timeFullSeconds / 60) - (hours * 60);
			const seconds = timeFullSeconds - (minutes * 60) - (hours * 3600);

			return {
				hours,
				minutes,
				seconds,
			};
		},

		timeNumToDoubleDigitString(num): string
		{
			return num > 9 ? String(num) : ('00' + num).slice(-2);
		},

		// handlers

		// handlers end

	},
	template: `
		<p class="bui-clock">
			<span
				v-if="isHourShown"
				class="bui-clock__value bui-clock__value_hours"
			>{{
				timeNumToDoubleDigitString(convertMillisecondsToHrMinSec(time).hours)
			}}</span>
			<span
          		v-if="isMinuteShown"
				class="bui-clock__value bui-clock__value_minutes"
			>{{
				timeNumToDoubleDigitString(convertMillisecondsToHrMinSec(time).minutes)
			}}</span>
			<span
				v-if="isSecondShown"
				class="bui-clock__value bui-clock__value_seconds"
			>{{
					timeNumToDoubleDigitString(convertMillisecondsToHrMinSec(time).seconds)
				}}</span>
		</p>
	`,
};
