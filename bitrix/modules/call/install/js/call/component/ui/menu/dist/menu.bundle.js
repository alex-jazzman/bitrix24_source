/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_vue3, call_component_ui_icon) {
	'use strict';

	const CallMenuItem = ui_vue3.defineComponent({
		name: 'CallMenuItem',
		components: {
			CallIcon: call_component_ui_icon.CallIcon
		},
		props: {
			item: {
				type: Object,
				default: null
			},
			templates: {
				type: Object,
				default: null
			},
			reverse: {
				type: Boolean,
				default: false
			}
		},
		emits: ['click'],
		computed: {
			additionalClasses() {
				const classes = [];
				if (this.reverse) {
					classes.push('--reverse');
				}
				return classes;
			}
		},
		methods: {
			handleClick(event) {
				this.$emit('click', {
					item: this.item,
					event
				});
			}
		},
		template: `
		<li class="call-menu-item" :class="additionalClasses" @click="handleClick">
			<template v-if="!templates.item">
				<CallIcon v-if="item.icon" :icon="item.icon" :size="24"></CallIcon>
				<div class="call-menu-item__label">{{ item.label }}</div>
			</template>
			<component v-else-if="templates.item" :is="templates.item" :item="item"></component>
		</li>
	`
	});

	const CallMenu = ui_vue3.defineComponent({
		name: 'CallMenu',
		components: {
			CallMenuItem
		},
		props: {
			items: {
				type: Array,
				default: null
			},
			reverse: {
				type: Boolean,
				default: false
			}
		},
		emits: ['item:click'],
		computed: {
			additionalClasses() {
				return [];
			}
		},
		methods: {
			handleItemClick(payload) {
				this.$emit('item:click', payload);
			}
		},
		template: `
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
	`
	});

	exports.CallMenu = CallMenu;
	exports.CallMenuItem = CallMenuItem;

})(this.BX.Call.Component.Ui = this.BX.Call.Component.Ui || {}, BX.Vue3, BX.Call.Component.Ui);
//# sourceMappingURL=menu.bundle.js.map
