import { defineComponent } from 'ui.vue3';

import { CallButton } from 'call.component.ui.button';
import { CallIcon } from 'call.component.ui.icon';

import type { LocFunction } from 'call.plugin.loc';

import './css/card.css';

type CardItemKey = 'cloud' | 'like' | 'computer';

export interface CardItem
{
	key: CardItemKey;
	icon: string;
}

const ITEMS: Record<CardItemKey, CardItem> = {
	cloud: { key: 'cloud', icon: 'cloud' },
	like: { key: 'like', icon: 'like' },
	computer: { key: 'computer', icon: 'screen-phone' },
};

export interface TranslationKeys
{
	title: string;
	description: string;
	items: Record<CardItemKey, string>;
	button: string;
}

const TRANSLATION_KEYS: Record<string, TranslationKeys> = {
	main: {
		title: 'CALL_BLOCK_CLOUD_RECORD_POPUP_MAIN_TITLE',
		description: 'CALL_BLOCK_CLOUD_RECORD_POPUP_MAIN_DESCRIPTION',
		items: {
			cloud: 'CALL_BLOCK_CLOUD_RECORD_POPUP_MAIN_ITEM_CLOUD',
			like: 'CALL_BLOCK_CLOUD_RECORD_POPUP_MAIN_ITEM_LIKE',
			computer: 'CALL_BLOCK_CLOUD_RECORD_POPUP_MAIN_ITEM_COMPUTER',
		},
		button: 'CALL_BLOCK_CLOUD_RECORD_POPUP_MAIN_BUTTON',
	},
	tariff: {
		title: 'CALL_BLOCK_CLOUD_RECORD_POPUP_TARIFF_TITLE',
		description: 'CALL_BLOCK_CLOUD_RECORD_POPUP_TARIFF_DESCRIPTION',
		items: {
			like: 'CALL_BLOCK_CLOUD_RECORD_POPUP_TARIFF_ITEM_LIKE',
			computer: 'CALL_BLOCK_CLOUD_RECORD_POPUP_TARIFF_ITEM_COMPUTER',
			cloud: 'CALL_BLOCK_CLOUD_RECORD_POPUP_TARIFF_ITEM_CLOUD',
		},
		button: 'CALL_BLOCK_CLOUD_RECORD_POPUP_TARIFF_BUTTON',
	},
};

// @vue/component
export const CallCloudRecordCard = defineComponent({
	name: 'CallCloudRecordCard',
	components: { CallIcon, CallButton },
	inject: {
		loc: { default: (): LocFunction => (key: string): string => key },
	},
	props: {
		tariff: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['startRecord'],
	computed: {
		translation(): TranslationKeys
		{
			return this.tariff ? TRANSLATION_KEYS.tariff : TRANSLATION_KEYS.main;
		},
		items(): CardItem[]
		{
			return this.tariff
				? [ITEMS.like, ITEMS.computer, ITEMS.cloud]
				: [ITEMS.cloud, ITEMS.like, ITEMS.computer];
		},
	},
	methods: {
		handleClick(): void
		{
			this.$emit('startRecord');
		},
	},
	template: /* HTML */`
		<div class="call-cloud-record-card" data-testid="call-cloud-record-card">
			<div class="call-cloud-record-card__logo" />
			<div class="call-cloud-record-card__label">
				<div class="call-cloud-record-card__title" data-testid="call-cloud-record-card-title">{{ loc(translation.title) }}</div>
				<div class="call-cloud-record-card__description" data-testid="call-cloud-record-card-description">{{ loc(translation.description) }}</div>
			</div>
			<ul class="call-cloud-record-card-list" data-testid="call-cloud-record-card-list">
				<li
					v-for="item in items"
					:key="item.key"
					class="call-cloud-record-card-list__item"
					:data-testid="'call-cloud-record-card-list-item-' + item.key"
				>
					<div class="call-cloud-record-card-list__icon">
						<CallIcon :icon="item.icon" :size="26" />
					</div>
					<div class="call-cloud-record-card-list__text">{{ loc(translation.items[item.key]) }}</div>
				</li>
			</ul>
			<div class="call-cloud-record-card__action">
				<CallButton
					test-id="call-cloud-record-card-button"
					:test-meta="tariff ? 'tariff' : ''"
					:size="38"
					:color="tariff ? 'gradient' : 'blue'"
					:animated="tariff"
					:border="!tariff"
					:label="loc(translation.button)"
					@click="handleClick"
				>
					<template v-if="tariff" #prepend>
						<CallIcon icon="rocket" :size="28" />
					</template>
				</CallButton>
			</div>
		</div>
	`,
});
