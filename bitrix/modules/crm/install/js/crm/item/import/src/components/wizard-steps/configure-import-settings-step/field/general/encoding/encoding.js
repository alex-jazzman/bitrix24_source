import { BitrixVueComponentProps } from 'ui.vue3';
import { BaseEvent } from 'main.core.events';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { Popup } from 'ui.vue3.components.popup';
import { ImportSettings } from '../../../../../../lib/model/import-settings';

import { TagSelector } from '../../../../../layout';

import './encoding.css';

export const Encoding: BitrixVueComponentProps = {
	name: 'Encoding',

	content: null,

	components: {
		TagSelector,
		UiButton,
		Popup,
	},

	props: {
		model: {
			type: ImportSettings,
			required: true,
		},
		encodings: {
			type: Array,
			required: true,
		},
	},

	data(): Object
	{
		return {
			AirButtonStyle,
			ButtonSize,
			isDetectEncodingPopupShow: false,
			encodingItems: [],
			isEncodingsLoading: false,
			isDetectEncodingEnabled: this.model.get('importFileIdBinary') !== null,
		};
	},

	mounted(): void
	{
		this.model.subscribeValueChanged('importFileIdDetectedEncoding', this.onEncodingDetected);
		this.model.subscribeValueChanged('importFileIdBinary', this.onFileBinaryUploaded);
	},

	unmounted(): void
	{
		this.model.unsubscribeValueChanged('importFileIdDetectedEncoding', this.onEncodingDetected);
		this.model.unsubscribeValueChanged('importFileIdBinary', this.onFileBinaryUploaded);
	},

	methods: {
		onEncodingDetected(event: BaseEvent): void
		{
			const detectedEncoding = event.getData().newValue;
			this.model.set('encoding', detectedEncoding);
		},

		onFileBinaryUploaded(event: BaseEvent): void
		{
			this.isDetectEncodingEnabled = event.getData().newValue !== null;
		},

		selectEncoding(encodingItem): void
		{
			this.model.set('encoding', encodingItem.value);
			this.isDetectEncodingPopupShow = false;
		},

		showDetectEncodePopup(): void
		{
			this.encodingItems = [];
			this.isEncodingsLoading = true;

			const content = this.model.get('importFileIdBinary');
			if (content === null)
			{
				return;
			}

			const chunk = content.slice(0, Math.min(8192, content.size));

			const promises = [];

			this.encodings.forEach((encoding) => {
				const decoder = new TextDecoder(encoding.value);
				const promise = new Promise((resolve) => {
					void chunk.arrayBuffer()
						.then((arrayBuffer) => {
							this.encodingItems.push({
								example: decoder.decode(arrayBuffer),
								title: encoding.title,
								value: encoding.value,
							});

							resolve();
						});
				});

				promises.push(promise);
			});

			void Promise
				.all(promises)
				.then(() => {
					this.isDetectEncodingPopupShow = true;
					this.isEncodingsLoading = false;
				})
			;
		},
	},

	template: `
		<TagSelector
			field-name="encoding"
			class="--encoding"
			:model="model"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_ENCODING')"
			:options="encodings"
		>
			<template #afterInput>
				<UiButton
					class="crm-item-import__open-detect-encoding-popup-button"
					:text="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_ENCODING_DETECT_ENCODING_BUTTON_TITLE')"
					@click="showDetectEncodePopup"
					:disabled="!isDetectEncodingEnabled"
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.FILLED"
					:loading="isEncodingsLoading"
				/>
			</template>
		</TagSelector>
		<Popup
			v-if="isDetectEncodingPopupShow"
			@close="isDetectEncodingPopupShow = false"
			:options="{
				titleBar: this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_ENCODING_DETECT_ENCODING_POPUP_TITLE'),
				width: 700,
				disableScroll: true,
				overlay: {
					blur: '70',
				},
			}"
		>
			<div class="crm-item-import__detect-encoding-popup">
				<div class="crm-item-import__detect-encoding-popup-encoding-list">
					<div class="crm-item-import__detect-encoding-popup-encoding-item" v-for="encodingItem in encodingItems" @click="selectEncoding(encodingItem)">
						<div class="crm-item-import__detect-encoding-popup-encoding-value">{{ encodingItem.title }}</div>
						<div class="crm-item-import__detect-encoding-popup-encoding-preview">{{ encodingItem.example }}</div>
					</div>
				</div>
			</div>
		</Popup>
	`,
};
