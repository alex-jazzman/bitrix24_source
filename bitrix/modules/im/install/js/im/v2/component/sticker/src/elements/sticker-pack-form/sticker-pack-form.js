import { Loc, Tag } from 'main.core';
import { SidePanel } from 'main.sidepanel';
import { Layout } from 'ui.sidepanel.layout';
import { BInput, InputDesign } from 'ui.system.input.vue';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';

import { StickerPackType } from 'im.v2.const';
import { Notifier } from 'im.v2.lib.notifier';
import { StickerService } from 'im.v2.provider.service.sticker';

import { StickerPackFormHeader } from './components/header/header';
import { UploadButton } from './components/upload-button/upload-button';
import { UploaderWidget } from './components/uploader-widget';

import './css/sticker-pack-form.css';

import type { JsonObject } from 'main.core';

const SLIDER_ID = 'im:sticker-pack-form';
const SLIDER_WIDTH = 700;

// @vue/component
export const StickerPackForm = {
	name: 'StickerPackForm',
	components: { BInput, UiButton, StickerPackFormHeader, UploaderWidget, UploadButton },
	props: {
		pack: {
			type: Object,
			default: () => {},
		},
	},
	emits: ['close'],
	data(): JsonObject
	{
		return {
			uploadedFileIds: [],
			packName: this.pack?.name || '',
		};
	},
	computed: {
		InputDesign: () => InputDesign,
		AirButtonStyle: () => AirButtonStyle,
		ButtonSize: () => ButtonSize,
		hasUploadedFiles(): boolean
		{
			return this.uploadedFileIds.length > 0;
		},
		isUpdateMode(): boolean
		{
			return Boolean(this.pack);
		},
		saveButtonName(): string
		{
			if (this.isUpdateMode)
			{
				return this.loc('IM_STICKER_PACK_FORM_BUTTON_SAVE');
			}

			return this.loc('IM_STICKER_PACK_FORM_BUTTON_CREATE');
		},
		contentContainer(): HTMLElement
		{
			return Tag.render`<div></div>`;
		},
		footerContainer(): HTMLElement
		{
			return Tag.render`<div></div>`;
		},
		title(): string
		{
			if (this.isUpdateMode)
			{
				return Loc.getMessage('IM_STICKER_PACK_FORM_UPDATE_TITLE');
			}

			return Loc.getMessage('IM_STICKER_PACK_FORM_CREATE_TITLE');
		},
		description(): string
		{
			return Loc.getMessage('IM_STICKER_PACK_FORM_DESCRIPTION');
		},
	},
	created()
	{
		this.openSlider();
	},
	beforeUnmount()
	{
		this.closeSlider();
	},
	methods: {
		openSlider()
		{
			SidePanel.Instance.open(SLIDER_ID, {
				cacheable: false,
				width: SLIDER_WIDTH,
				contentCallback: () => {
					return this.createLayoutContent();
				},
				events: {
					onCloseComplete: () => {
						this.$emit('close');
					},
				},
			});
		},
		closeSlider()
		{
			const slider = SidePanel.Instance.getSlider(SLIDER_ID);
			if (!slider)
			{
				return;
			}

			slider.close();
		},
		createLayoutContent(): HTMLElement
		{
			return Layout.createContent({
				title: this.title,
				design: {
					section: false,
					alignButtonsLeft: true,
				},
				content: () => this.contentContainer,
				buttons: () => [this.footerContainer],
			});
		},
		onUploadedFiles(ids: string[])
		{
			this.uploadedFileIds = ids;
		},
		onSave()
		{
			if (this.isUpdateMode)
			{
				void this.updatePack();

				return;
			}

			void this.createPack();
		},
		async createPack()
		{
			await StickerService.getInstance().createPack({
				uuids: this.uploadedFileIds,
				type: StickerPackType.custom,
				name: this.packName,
			});
			Notifier.sticker.onCreatePackComplete();
			this.$emit('close');
		},
		async updatePack()
		{
			await StickerService.getInstance().updatePack({
				uuids: this.uploadedFileIds,
				id: this.pack.id,
				type: this.pack.type,
				name: this.packName,
			});

			Notifier.sticker.onUpdatePackComplete();
			this.$emit('close');
		},
		loc(phraseCode: string): string
		{
			return Loc.getMessage(phraseCode);
		},
	},
	template: `
		<Teleport :to="contentContainer">
			<div class="bx-im-sticker-pack-form__section">
				<StickerPackFormHeader />
				<UploaderWidget @uploadedFiles="onUploadedFiles" />
			</div>
			<div
				v-if="hasUploadedFiles || isUpdateMode"
				class="bx-im-sticker-pack-form__section"
			>
				<div class="bx-im-sticker-pack-form__pack-title">
					{{ loc('IM_STICKER_PACK_FORM_PACK_NAME') }}
				</div>
				<BInput v-model.trim="packName" :design="InputDesign.Primary" />
			</div>
		</Teleport>
		<Teleport :to="footerContainer">
			<div class="bx-im-sticker-pack-form__buttons">
				<UiButton
					:size="ButtonSize.MEDIUM"
					:text="saveButtonName"
					@click="onSave"
				/>
				<UiButton
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.PLAIN"
					:text="loc('IM_STICKER_PACK_FORM_BUTTON_CANCEL')"
					@click="$emit('close');"
				/>
			</div>
		</Teleport>
	`,
};
