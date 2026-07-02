import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import './css/entity-button.css';

// @vue/component
export const EntityButton = {
	name: 'EntityButton',
	components: { BIcon },
	props: {
		text: {
			type: String,
			required: true,
		},
		url: {
			type: String,
			default: '',
		},
		compactMode: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['click'],
	computed: {
		OutlineIcons: () => OutlineIcons,
	},
	methods: {
		onClick(event: PointerEvent)
		{
			if (!this.url)
			{
				event.preventDefault();
			}

			this.$emit('click');
		},
	},
	template: `
		<a
			:href="url"
			class="bx-im-chat-header-entity-button__container"
			:class="{'--compact': compactMode}"
			@click="onClick"
		>
			<div class="bx-im-chat-header-entity-button__text --ellipsis">{{ text }}</div>
			<BIcon class="bx-im-chat-header-entity-button__icon" :name="OutlineIcons.CHEVRON_RIGHT_M" />
		</a>
	`,
}