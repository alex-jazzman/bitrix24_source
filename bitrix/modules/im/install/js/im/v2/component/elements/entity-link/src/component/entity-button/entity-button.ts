import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { defineComponent, type PropType } from 'ui.vue3';

import 'im.v2.css.classes';

import { EntityLinkAppearance, type EntityLinkAppearanceItem } from '../../const/appearance';

import './entity-button.css';

// @vue/component
export const EntityButton = defineComponent({
	name: 'ImEntityButton',
	components: { BIcon } as { BIcon: typeof BIcon },
	props: {
		text: {
			type: String,
			required: true,
		},
		url: {
			type: String,
			default: '',
		},
		appearance: {
			type: String as PropType<EntityLinkAppearanceItem>,
			default: EntityLinkAppearance.link,
			validator: (value: string): boolean => (Object.values(EntityLinkAppearance) as string[]).includes(value),
		},
		compactMode: {
			type: Boolean,
			default: false,
		},
		withUnreadBadge: {
			type: Boolean,
			default: false,
		},
		isChatMuted: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['click'],
	computed: {
		chevronIcon(): string
		{
			return OutlineIcons.CHEVRON_RIGHT_M;
		},
		isLinkAppearance(): boolean
		{
			return this.appearance === EntityLinkAppearance.link;
		},
		containerClasses(): Record<string, boolean>
		{
			return {
				'--link': this.isLinkAppearance,
				'--button': !this.isLinkAppearance,
				'--compact': this.compactMode,
			};
		},
	},
	methods: {
		onClick(event: MouseEvent): void
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
			class="bx-im-entity-button"
			:class="containerClasses"
			@click.stop="onClick"
			@keydown.enter.stop
			@keydown.space.stop
		>
			<template v-if="isLinkAppearance">
				<span class="bx-im-entity-button__text --ellipsis">{{ text }}</span>
				<BIcon class="bx-im-entity-button__icon" :name="chevronIcon" />
			</template>
			<template v-else>{{ text }}<span
				v-if="withUnreadBadge"
				:class="{ '--muted': isChatMuted }"
				class="bx-im-entity-button__unread-badge"
			></span></template>
		</a>
	`,
});
