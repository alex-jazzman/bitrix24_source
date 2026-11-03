/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_vue3, call_component_ui_popup, call_component_ui_button, call_component_ui_icon) {
	'use strict';

	const ITEMS = {
		cloud: {
			key: 'cloud',
			icon: 'cloud'
		},
		like: {
			key: 'like',
			icon: 'like'
		},
		computer: {
			key: 'computer',
			icon: 'screen-phone'
		}
	};
	const TRANSLATION_KEYS = {
		main: {
			title: 'CALL_BLOCK_CLOUD_RECORD_POPUP_MAIN_TITLE',
			description: 'CALL_BLOCK_CLOUD_RECORD_POPUP_MAIN_DESCRIPTION',
			items: {
				cloud: 'CALL_BLOCK_CLOUD_RECORD_POPUP_MAIN_ITEM_CLOUD',
				like: 'CALL_BLOCK_CLOUD_RECORD_POPUP_MAIN_ITEM_LIKE',
				computer: 'CALL_BLOCK_CLOUD_RECORD_POPUP_MAIN_ITEM_COMPUTER'
			},
			button: 'CALL_BLOCK_CLOUD_RECORD_POPUP_MAIN_BUTTON'
		},
		tariff: {
			title: 'CALL_BLOCK_CLOUD_RECORD_POPUP_TARIFF_TITLE',
			description: 'CALL_BLOCK_CLOUD_RECORD_POPUP_TARIFF_DESCRIPTION',
			items: {
				like: 'CALL_BLOCK_CLOUD_RECORD_POPUP_TARIFF_ITEM_LIKE',
				computer: 'CALL_BLOCK_CLOUD_RECORD_POPUP_TARIFF_ITEM_COMPUTER',
				cloud: 'CALL_BLOCK_CLOUD_RECORD_POPUP_TARIFF_ITEM_CLOUD'
			},
			button: 'CALL_BLOCK_CLOUD_RECORD_POPUP_TARIFF_BUTTON'
		}
	};
	const CallCloudRecordCard = ui_vue3.defineComponent({
		name: 'CallCloudRecordCard',
		components: {
			CallIcon: call_component_ui_icon.CallIcon,
			CallButton: call_component_ui_button.CallButton
		},
		inject: {
			loc: {
				default: () => key => key
			}
		},
		props: {
			tariff: {
				type: Boolean,
				default: false
			}
		},
		emits: ['startRecord'],
		computed: {
			translation() {
				return this.tariff ? TRANSLATION_KEYS.tariff : TRANSLATION_KEYS.main;
			},
			items() {
				return this.tariff ? [ITEMS.like, ITEMS.computer, ITEMS.cloud] : [ITEMS.cloud, ITEMS.like, ITEMS.computer];
			}
		},
		methods: {
			handleClick() {
				this.$emit('startRecord');
			}
		},
		template: `
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
	`
	});

	const CallCloudRecordPopup = ui_vue3.defineComponent({
		name: 'CallCloudRecordPopup',
		components: {
			CallPopup: call_component_ui_popup.CallPopup,
			CallCloudRecordCard
		},
		props: {
			tariff: {
				type: Boolean,
				default: false
			}
		},
		emits: ['startRecord', 'hidden'],
		methods: {
			show(target) {
				this.$refs.popup?.show(target);
			},
			hide() {
				this.$refs.popup?.hide();
			},
			toggle(target) {
				this.$refs.popup?.toggle(target);
			},
			handleStartRecord() {
				this.$emit('startRecord');
			}
		},
		template: `
		<CallPopup ref="popup" class-name="call-cloud-record-popup" @hidden="$emit('hidden')">
			<CallCloudRecordCard :tariff="tariff" @startRecord="handleStartRecord" />
		</CallPopup>
	`
	});

	exports.CallCloudRecordCard = CallCloudRecordCard;
	exports.CallCloudRecordPopup = CallCloudRecordPopup;

})(this.BX.Call.Component.Block = this.BX.Call.Component.Block || {}, BX.Vue3, BX.Call.Component.UI, BX.Call.Component.Ui, BX.Call.Component.Ui);
//# sourceMappingURL=cloud-record-popup.bundle.js.map
