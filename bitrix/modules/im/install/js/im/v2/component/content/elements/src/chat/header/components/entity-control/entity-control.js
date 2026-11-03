import { Type } from 'main.core';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { HeaderAction, HeaderActionShape, HeaderControlKey } from '../header-action/header-action';

import './css/entity-control.css';

// @vue/component
export const EntityControl = {
	name: 'EntityControl',
	components: { BIcon, HeaderAction },
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
		expanded: {
			type: Boolean,
			default: null,
		},
	},
	emits: ['click'],
	computed: {
		OutlineIcons: () => OutlineIcons,
		HeaderActionShape: () => HeaderActionShape,
		// An address leads to the entity itself; without one the control only opens a card of its own.
		controlKey(): string
		{
			return Type.isStringFilled(this.url) ? HeaderControlKey.entity : HeaderControlKey.taskCard;
		},
	},
	template: `
		<HeaderAction
			:controlKey="controlKey"
			:href="url"
			:expanded="expanded"
			:shape="HeaderActionShape.rounded"
			class="bx-im-chat-header-entity-button__container"
			:class="{'--compact': compactMode}"
			@click="$emit('click')"
		>
			<div class="bx-im-chat-header-entity-button__text --ellipsis">{{ text }}</div>
			<BIcon
				class="bx-im-chat-header-entity-button__icon"
				:name="OutlineIcons.CHEVRON_RIGHT_M"
				aria-hidden="true"
			/>
		</HeaderAction>
	`,
};
