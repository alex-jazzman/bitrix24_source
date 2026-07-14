import { CloseIcon } from './components/close-icon';

import './css/list-slider.css';

// @vue/component
export const RecentListSlider = {
	name: 'RecentListSlider',
	components: { CloseIcon },
	props: {
		compactMode: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['close'],
	computed: {
		containerClasses(): Record<string, boolean>
		{
			return { '--compact-mode': this.compactMode };
		},
	},
	methods: {
		onClose()
		{
			this.$emit('close');
		},
	},
	template: `
		<div class="bx-im-list-container-slider" :class="containerClasses">
			<div class="bx-im-list-container-slider__header">
				<div class="bx-im-list-container-slider__header_content">
					<CloseIcon @click="onClose" />
					<slot name="header"></slot>
				</div>
				<div v-if="$slots['subheader']" class="bx-im-list-container-slider__subheader_content">
					<slot name="subheader"></slot>
				</div>
			</div>
			<div class="bx-im-list-container-slider__content">
				<slot name="content"></slot>
			</div>
		</div>
	`,
};
