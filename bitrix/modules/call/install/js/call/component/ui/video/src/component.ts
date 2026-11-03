import { defineComponent } from 'ui.vue3';

import './css/video.css';

export const CallVideo = defineComponent({
	name: 'CallVideo',
	props: {
		testId: {
			type: String,
			default: null,
		},
		srcObject: {
			type: Object,
			default: null,
		},
		mirrored: {
			type: Boolean,
			default: false,
		},
		muted: {
			type: Boolean,
			default: true,
		},
		objectFit: {
			type: String,
			default: 'cover',
			validator: (value: string): boolean => ['cover', 'contain'].includes(value),
		},
	},
	computed: {
		additionalClasses(): string[]
		{
			const classes: string[] = [`--fit-${this.objectFit}`];

			if (this.mirrored)
			{
				classes.push('--mirror');
			}

			return classes;
		},
	},
	template: /* HTML */`
		<video
			:data-testid="testId"
			:data-test-state="muted ? 'muted' : 'unmuted'"
			class="call-video"
			:class="additionalClasses"
			:srcObject.prop="srcObject"
			:muted="muted"
			autoplay
			playsinline
		/>
	`,
});
