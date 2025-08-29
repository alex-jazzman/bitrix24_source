import { hint, type HintParams } from 'ui.vue3.directives.hint';
import { BIcon } from 'ui.icon-set.api.vue';
import 'tasks.v2.component.elements.hint';

import { PanelMeta } from './check-list-item-panel-meta';
// eslint-disable-next-line no-unused-vars
import type { VisibleSections, VisibleActions, Section, Item } from './check-list-item-panel-meta';

import './check-list-item-panel.css';

// @vue/component
export const CheckListItemPanel = {
	name: 'CheckListItemPanel',
	components: {
		BIcon,
	},
	directives: { hint },
	props: {
		/** @type VisibleActions */
		visibleSections: {
			type: Array,
			default: () => PanelMeta.defaultSections.map((section: Section) => section.name),
		},
		visibleActions: {
			type: Array,
			default: () => [],
		},
		disabledActions: {
			type: Array,
			default: () => [],
		},
		activeActions: {
			type: Array,
			default: () => [],
		},
	},
	emits: ['action'],
	data(): Object
	{
		return {
			currentHintElement: null,
			currentHintText: '',
		};
	},
	computed: {
		sections(): VisibleSections
		{
			return PanelMeta.defaultSections
				.filter((section) => this.visibleSections.includes(section.name))
				.map((section) => ({
					...section,
					items: section.items
						.filter((item: Item) => this.visibleActions.includes(item.action))
						.map((item: Item) => ({
							...item,
							disabled: this.isItemDisabled(item),
							active: this.isItemActive(item),
							hoverable: item.hoverable ?? true,
						})),
				}))
				.filter((section) => section.items.length > 0)
			;
		},
		tooltip(): Function
		{
			return (): HintParams => ({
				text: this.currentHintText,
				timeout: 500,
				popupOptions: {
					className: 'tasks-hint',
					background: 'var(--ui-color-bg-content-inapp)',
					darkMode: false,
					offsetLeft: -(this.currentHintElement?.offsetWidth ?? 0),
					padding: 6,
					bindOptions: {
						forceBindPosition: true,
						forceTop: true,
						position: 'top',
					},
					targetContainer: document.body,
				},
			});
		},
	},
	methods: {
		isItemDisabled(item: Item): boolean
		{
			return item.disabled ?? this.disabledActions.includes(item.action);
		},
		isItemActive(item: Item): boolean
		{
			return item.active ?? this.activeActions.includes(item.action);
		},
		getItemIcon(item: Item): string
		{
			return (item.active && item.activeIcon) ? item.activeIcon : item.icon;
		},
		handleItemClick(event: MouseEvent, item: Item): void
		{
			if (!item.disabled)
			{
				this.$emit('action', {
					action: item.action,
					node: event.currentTarget,
				});
			}
		},
		handleItemMouseEnter(event: MouseEvent, item: Item): void
		{
			this.currentHintElement = event.currentTarget;
			this.currentHintText = item.hint ? this.loc(item.hint) : null;
		},
	},
	template: `
		<div v-if="sections.length > 0" class="check-list-widget-item-panel" @mousedown.prevent>
			<template v-for="section in sections" :key="section.name">
				<div class="check-list-widget-item-panel-section" :class="'--' + section.name">
					<template v-for="item in section.items" :key="item.action" >
						<div
							v-hint="tooltip"
							class="check-list-widget-item-panel-section-item"
							:class="{
								'--disabled': item.disabled,
								'--active': item.active,
								[item.className]: Boolean(item.className),
							}"
							@click="handleItemClick($event, item)"
							@mouseenter="handleItemMouseEnter($event, item)"
						>
							<BIcon :name="getItemIcon(item)" :hoverable="item.hoverable"/>
							<span v-if="item.label">{{ loc(item.label) }}</span>
						</div>
					</template>
				</div>
			</template>
		</div>
	`,
};
