import { Loc } from 'main.core';
import type { PopupOptions } from 'main.popup';
import { markRaw } from 'ui.vue3';
import 'ui.hint';

import { Popup } from 'booking.component.popup';
import { Button as UiButton, AirButtonStyle, ButtonColor, ButtonSize, ButtonStyle } from 'booking.component.button';
import { UiTabs } from 'booking.component.ui-tabs';
import { UiResourceWizardItem } from 'booking.component.ui-resource-wizard-item';

import './ui-popup-tabs.css';
import type { popupTabsOptions } from './types';

export type { popupTabsOptions };

// @vue/component
export const PopupTabs = {
	name: 'UiPopupTabs',
	components: {
		Popup,
		UiButton,
		UiTabs,
		UiResourceWizardItem,
	},
	props: {
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			default: null,
		},
		hintText: {
			type: String,
			default: null,
		},
		/**
		 * @type {popupTabsOptions}
		 */
		popupTabsOptions: {
			type: Array,
			default: null,
		},
		buttonSave: {
			type: String,
			default: Loc.getMessagePlural('BOOKING_POPUP_TWO_TABS_SAVE'),
		},
		buttonCansel: {
			type: String,
			default: Loc.getMessagePlural('BOOKING_POPUP_TWO_TABS_CANSEL'),
		},
	},
	emits: ['cancel', 'save'],
	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonColor,
			ButtonSize,
			ButtonStyle,
		};
	},
	data(): Object
	{
		return {
			activeComponent: "UiButton",
			popupTab: [
				{
					title: "Услуги",
					// active: true,
					componentName: "UiButton",
				},
				{
					title: "Ресурсы",
					// active: false,
					componentName: "UiResourceWizardItem"
				},
			],
		};
	},
	computed: {
		config(): PopupOptions
		{
			return markRaw({
				className: 'booking-popup-tabs',
				padding: 14,
				height: 598,
				width: 706,
				closeIcon: true,
				borderRadius: 'var(--ui-border-radius-3xl)',
			});
		},
	},
	created(): void
	{
		this.hint = BX.UI.Hint.createInstance({
			popupParameters: {},
		});
	},
	mounted(): void
	{
		this.hint.init();
	},
	methods: {
		save(): void
		{
			this.$refs.tabsComponent.switchActiveTab('UiButton');
			// this.$emit('save');
		},
		cancel(): void
		{
			this.$refs.tabsComponent.switchActiveTab('UiResourceWizardItem');
			// this.$emit('cancel');
		},
		closePopup(): void
		{
			this.$emit('cancel');
		},
		makeTabActive(activeTab: string): void
		{
			this.activeComponent = activeTab;
		},
	},
	template: `
		<Popup
			ref="popup"
			id="booking-popup-tabs"
			:config
			@close="closePopup"
		>
		
<!--		<UiTabs-->
<!--			:tabsOptions="popupTab"-->
<!--			:activeComponent="activeComponent"-->
<!--			@update:activeComponent="makeTabActive"-->
<!--		>-->
<!--			<template-->
<!--				#hint-->
<!--			>-->
<!--				<span :data-hint="hintText"></span>-->
<!--			</template>-->

<!--			<template #UiButton>-->
<!--				<UiButton-->
<!--					:text="buttonSave"-->
<!--					:size="ButtonSize.LARGE"-->
<!--					:color="ButtonColor.PRIMARY"-->
<!--					noCaps-->
<!--					useAirDesign-->
<!--				/>-->
<!--			</template>-->

<!--			<template #UiResourceWizardItem>-->
<!--				<UiResourceWizardItem-->
<!--					#UiResourceWizardItem-->
<!--					:title="title"-->
<!--					iconType="registration-on-site"-->
<!--				></UiResourceWizardItem>-->
<!--			</template>-->
<!--		</UiTabs>-->
		
			<div class="booking-popup-tabs__wrapper">
				<div class="booking-popup-tabs__title">
					{{ title }}
				</div>
				<div class="booking-popup-tabs__description">
					{{ description }}
				</div>
				<div class="booking-popup-tabs__nav">
					<div class="booking-popup-tabs__nav_tabs">
						<div 
							v-for="tab of popupTabsOptions"
							:key="tab.componentName"
							:id="tab.componentName"
							class="booking-popup-tabs__nav_tab"
							:class="{'--active': tab.componentName === activeComponent}"
							@click="makeTabActive"
						>
							{{ tab.title }}
						</div>
					</div>
					<span :data-hint="hintText"></span>
				</div>
				<slot :tab="activeComponent"/>
				{{ activeComponent }}
				<div class="booking-popup-tabs__footer">
					<UiButton
						:text="buttonSave"
						:size="ButtonSize.LARGE"
						:color="ButtonColor.PRIMARY"
						@click="save"
						noCaps
						useAirDesign
					/>
					<UiButton
						:text="buttonCansel"
						:style="AirButtonStyle.OUTLINE"
						:size="ButtonSize.LARGE"
						@click="cancel"
						noCaps
						useAirDesign
					/>
				</div>
			</div>
		</Popup>
	`,
};
