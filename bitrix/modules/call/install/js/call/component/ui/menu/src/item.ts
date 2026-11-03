import { defineComponent } from 'ui.vue3';

import { CallIcon } from 'call.component.ui.icon';

export interface CallMenuItemData
{
	label: string;
	icon?: string;
	items?: CallMenuItemData[];
	[key: string]: unknown;
}

export const CallMenuItem = defineComponent({
	name: 'CallMenuItem',
	components: {
		CallIcon,
	},
	props: {
		item: {
			type: Object,
			default: null,
		},
		templates: {
			type: Object,
			default: null,
		},
		reverse: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['click'],
	computed: {
		additionalClasses(): string[]
		{
			const classes: string[] = [];

			if (this.reverse)
			{
				classes.push('--reverse');
			}

			return classes;
		},
	},
	methods: {
		handleClick(event: MouseEvent): void
		{
			this.$emit('click', { item: this.item, event });
		},
	},
	template: /* HTML */`
		<li class="call-menu-item" :class="additionalClasses" @click="handleClick">
			<template v-if="!templates.item">
				<CallIcon v-if="item.icon" :icon="item.icon" :size="24"></CallIcon>
				<div class="call-menu-item__label">{{ item.label }}</div>
			</template>
			<component v-else-if="templates.item" :is="templates.item" :item="item"></component>
		</li>
	`,
});
