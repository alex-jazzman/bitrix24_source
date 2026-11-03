import { defineComponent } from 'ui.vue3';

import { CallMenuItem } from './item';
import type { CallMenuItemData } from './item';

import './css/menu.css';

export const CallMenu = defineComponent({
	name: 'CallMenu',
	components: {
		CallMenuItem,
	},
	props: {
		items: {
			type: Array,
			default: null,
		},
		reverse: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['item:click'],
	computed: {
		additionalClasses(): string[]
		{
			return [];
		},
	},
	methods: {
		handleItemClick(payload: { item: CallMenuItemData; event: MouseEvent }): void
		{
			this.$emit('item:click', payload);
		},
	},
	template: /* HTML */`
		<div class="call-menu">
			<div v-if="$slots.start" class="call-menu__start">
				<slot name="start"></slot>
			</div>
			<ul class="call-menu-list">
				<template v-for="(item, i) in items" :key="i">
					<template v-if="item.items">
						<li class="call-menu-submenu">
							<slot name="submenu" :item="item">{{ item.label }}</slot>
						</li>

						<template v-for="(child, j) in item.items" :key="j" class="call-menu-item">
							<CallMenuItem :item="child" :templates="$slots" :reverse="reverse" @click="handleItemClick" />
						</template>
					</template>
					<CallMenuItem v-else :item="item" :templates="$slots" :reverse="reverse" @click="handleItemClick" />
				</template>
			</ul>
			<div v-if="$slots.end" class="call-menu__end">
				<slot name="end"></slot>
			</div>
		</div>
	`,
});
