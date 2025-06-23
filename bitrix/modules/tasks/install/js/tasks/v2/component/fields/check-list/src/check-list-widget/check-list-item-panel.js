import { Dom, Type } from 'main.core';
import type { PopupOptions } from 'main.popup';

import { BIcon } from 'ui.icon-set.api.vue';
import { Outline } from 'ui.icon-set.api.core';

import { Hint } from 'tasks.v2.component.elements.hint';

import { PanelMeta } from './check-list-item-panel-meta';
import type { VisibleSections, VisibleActions, Section, Item } from './check-list-item-panel-meta';
import './check-list-item-panel.css';

// @vue/component
export const CheckListItemPanel = {
	name: 'CheckListItemPanel',
	components: {
		BIcon,
		Hint,
	},
	props: {
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
	setup(): Object
	{
		return {
			Outline,
		};
	},
	data(): Object
	{
		return {
			isHintShown: false,
			currentHintElement: null,
			currentHintText: '',
			hintTimeout: null,
		};
	},
	computed: {
		hintOptions(): PopupOptions
		{
			return {
				offsetLeft: (
					this.currentHintElement
						? -(Dom.getPosition(this.currentHintElement)).width
						: 0
				),
				bindOptions: {
					forceBindPosition: true,
					forceTop: true,
					position: 'top',
				},
				angle: false,
			};
		},
		hasSections(): boolean
		{
			return this.sections.length > 0;
		},
		sections(): VisibleSections
		{
			const visibleActions: VisibleActions = this.visibleActions;

			return PanelMeta.defaultSections
				.filter((section) => this.visibleSections.includes(section.name))
				.map((section) => ({
					...section,
					items: section.items
						.filter((item: Item) => visibleActions.includes(item.action))
						.map((item: Item) => ({
							...item,
							disabled: this.isItemDisabled(item),
							active: this.isItemActive(item),
							hoverable: Type.isUndefined(item.hoverable) ? true : item.hoverable,
						})),
				}))
				.filter((section) => section.items.length > 0)
			;
		},
	},
	methods: {
		isItemDisabled(item: Item): boolean
		{
			if (!Type.isUndefined(item.disabled))
			{
				return item.disabled;
			}

			return this.disabledActions.includes(item.action);
		},
		isItemActive(item: Item): boolean
		{
			if (!Type.isUndefined(item.active))
			{
				return item.active;
			}

			return this.activeActions.includes(item.action);
		},
		getItemIcon(item: Item): string
		{
			return item.active && item.activeIcon ? item.activeIcon : item.icon;
		},
		getItemHint(item: Item): string
		{
			if (item.disabled === true && item.disabledHint)
			{
				return this.loc(item.disabledHint);
			}

			if (item.hint)
			{
				return this.loc(item.hint);
			}

			return '';
		},
		handleItemClick(event: MouseEvent, item: Item): void
		{
			if (!item.disabled)
			{
				this.$emit(
					'action',
					{
						action: item.action,
						node: event.currentTarget,
					},
				);
			}
		},
		showHint(event: MouseEvent, item: Item): void
		{
			const hintText = this.getItemHint(item);
			if (!hintText)
			{
				return;
			}

			if (this.hintTimeout)
			{
				clearTimeout(this.hintTimeout);
				this.hintTimeout = null;
			}

			this.currentHintElement = event.currentTarget;
			this.currentHintText = hintText;

			this.hintTimeout = setTimeout(() => {
				this.isHintShown = true;
			}, 1000);
		},
		hideHint(): void
		{
			if (this.hintTimeout)
			{
				clearTimeout(this.hintTimeout);
				this.hintTimeout = null;
			}

			this.isHintShown = false;
			this.currentHintElement = null;
			this.currentHintText = '';
		},
	},
	template: `
		<div v-if="hasSections" class="check-list-widget-item-panel" @mousedown.prevent>
			<div 
				v-for="section in sections" 
				:key="section.name"
				class="check-list-widget-item-panel-section"
				:class="'--' + section.name"
			>
				<div 
					v-for="item in section.items" 
					:key="item.action" 
					class="check-list-widget-item-panel-section-item"
					:class="{
						'--disabled': item.disabled, 
						'--active': item.active,
						[item.className]: !!item.className
					}"
					@mouseenter="showHint($event, item)"
					@mouseleave="hideHint()"
					@click="handleItemClick($event, item)"
				>
					<BIcon :name="getItemIcon(item)" :hoverable="item.hoverable"/>
					<span v-if="item.label">{{ loc(item.label) }}</span>
				</div>
			</div>
			<Hint
				v-if="isHintShown"
				:bindElement="currentHintElement"
				:options="hintOptions"
			>
				{{ currentHintText }}
			</Hint>
		</div>
	`,
};
