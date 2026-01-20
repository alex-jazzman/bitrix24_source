import { BIcon } from 'ui.icon-set.api.vue';
import { Outline, Main } from 'ui.icon-set.api.core';
import { BMenu } from 'ui.system.menu.vue';

import { UpdateItemPropertyEventPayload } from '../../types';
import { PRESET_TITLE_ICONS } from '../../constants';

import './title-icon-field.css';

// eslint-disable-next-line no-unused-vars
import type { TitleWithIconItem } from '../../types';
import type { MenuOptions } from 'ui.system.menu';

// @vue/component
export const TitleIconField = {
	name: 'TitleIconField',
	components: {
		BIcon,
		BMenu,
	},
	props: {
		/** @type TitleWithIconItem */
		item: {
			type: Object,
			required: true,
		},
	},
	emits: ['updateItemProperty', 'delete'],
	setup(): { [string]: string }
	{
		return {
			Outline,
			Main,
		};
	},
	data(): { isMenuShown: boolean }
	{
		return {
			isMenuShown: false,
		};
	},
	computed: {
		currentIconCssClass(): string
		{
			return PRESET_TITLE_ICONS[this.item.icon] || PRESET_TITLE_ICONS.IMAGE;
		},
		menuOptions(): MenuOptions
		{
			const menuItems = Object.entries(PRESET_TITLE_ICONS).map(([iconKey, iconClass]) => {
				return {
					icon: iconClass,
					title: ' ',
					onClick: () => this.selectIcon(iconKey),
				};
			});

			return {
				bindElement: this.$refs.iconTrigger,
				cacheable: false,
				angle: true,
				offsetLeft: 25,
				className: 'bizproc-setuptemplateactivity-title-field__icon-menu',
				items: menuItems,
			};
		},
	},
	methods: {
		onInput(event: Event): void
		{
			const payload: UpdateItemPropertyEventPayload = {
				propertyValues: {
					text: event.target.value,
				},
			};
			this.$emit('updateItemProperty', payload);
		},
		selectIcon(iconKey: string): void
		{
			const payload: UpdateItemPropertyEventPayload = {
				propertyValues: {
					icon: iconKey,
				},
			};
			this.$emit('updateItemProperty', payload);
		},
		handleDragStart(event: Event): void
		{
			this.$emit('itemDragStart', {
				event,
				element: this.$el,
			});
		},
	},
	template: `
		<div class="bizproc-setuptemplateactivity-field-wrapper">
			<div
				class="bizproc-setuptemplateactivity-field-drag-icon"
				@mousedown.prevent="handleDragStart"
			>
				<BIcon :name="Main.MORE_POINTS" :size="18"/>
			</div>
			<div class="bizproc-setuptemplateactivity-title-field">
				<div class="ui-ctl-container">
					<div class="ui-ctl-top">
						<div class="ui-ctl-title bizproc-setuptemplateactivity-title-field__label">
							{{ $Bitrix.Loc.getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_JS_ICON_TITLE_ITEM_LABEL') }}
						</div>
					</div>
					<div class="bizproc-setuptemplateactivity-title-field__container">
						<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown bizproc-setuptemplateactivity-title-field__icon-selector"
							 @click="isMenuShown = true"
						>
							<div ref="iconTrigger" class="ui-ctl-element">
								<i class="ui-icon-set --custom" :class="'--' + currentIconCssClass"></i>
								<i class="ui-icon-set --chevron-down-m"></i>
							</div>
						</div>
						<div class="ui-ctl ui-ctl-w100">
							<input
								:value="item.text"
								class="ui-ctl-element"
								type="text"
								@input="onInput"
							/>
						</div>
					</div>
				</div>
				<div class="bizproc-setuptemplateactivity-title-field__controls">
					<BIcon
						:name="Outline.CROSS_L"
						:size="18"
						class="bizproc-setuptemplateactivity-title-field__delete-icon"
						@click="$emit('delete')"
					/>
				</div>
				<BMenu
					v-if="isMenuShown"
					:options="menuOptions"
					@close="isMenuShown = false"
				/>
			</div>
		</div>
	`,
};
