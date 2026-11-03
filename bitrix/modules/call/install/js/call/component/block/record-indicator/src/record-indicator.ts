import { defineComponent } from 'ui.vue3';

import './css/record-indicator.css';

import { CallIcon } from 'call.component.ui.icon';

export const CallRecordingIndicator = defineComponent({
	name: 'CallRecordingIndicator',
	components: {
		CallIcon,
	},
	props: {
		time: {
			type: Number,
			default: 0,
		},
	},
	computed: {
		formattedTime(): string
		{
			const seconds = this.time;
			const hours = Math.floor(seconds / 3600);
			const minutes = Math.floor((seconds % 3600) / 60);
			const secs = seconds % 60;

			if (hours > 0)
			{
				return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
			}

			return `${minutes}:${String(secs).padStart(2, '0')}`;
		},
	},
	template: /* HTML */`
		<div class="call-record-indicator">
			<div class="call-record-indicator__icon">
				<CallIcon icon="record-solid" :size="12"/>
			</div>
			<div class="call-record-indicator__time">{{ formattedTime }}</div>
		</div>
	`,
});
