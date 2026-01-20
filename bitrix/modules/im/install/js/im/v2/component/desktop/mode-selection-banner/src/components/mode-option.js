import type { LabelOptions } from './mode-option-list';

// @vue/component
export const ModeOption = {
	name: 'ModeOption',
	props: {
		isSelected: {
			type: Boolean,
			required: true,
		},
		labels: {
			type: Object,
			required: true,
		},
		descriptionTitle: {
			type: String,
			required: true,
		},
		descriptionText: {
			type: String,
			required: true,
		},
	},
	emits: ['click'],
	computed: {
		labelsCollection(): LabelOptions[]
		{
			return this.labels;
		},
	},
	template: `
		<li @click="$emit('click')" class="bx-im-desktop-mode-selection-banner__mode-option" :class="{'--selected': isSelected}">
			<div class="bx-im-desktop-mode-selection-banner__selected-icon"></div>
			<div class="bx-im-desktop-mode-selection-banner__image_container">
				<span class="bx-im-desktop-mode-selection-banner__image"></span>
				<ul class="bx-im-desktop-mode-selection-banner__label-list">
					<li v-for="label in labelsCollection" :class="['bx-im-desktop-mode-selection-banner__label-item', '--' + label.value]">
						{{ label.text }}
					</li>
				</ul>
				<slot name="extra-information"></slot>
			</div>
			<div class="bx-im-desktop-mode-selection-banner__description_container">
				<h2 class="bx-im-desktop-mode-selection-banner__description_title">
					{{ descriptionTitle }}
				</h2>
				<p class="bx-im-desktop-mode-selection-banner__description_text">
					{{ descriptionText }}
				</p>
			</div>
		</li>
	`,
};
