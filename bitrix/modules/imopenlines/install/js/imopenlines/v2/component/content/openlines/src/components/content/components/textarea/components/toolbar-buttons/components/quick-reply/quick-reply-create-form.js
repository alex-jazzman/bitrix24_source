import { type JsonObject } from 'main.core';
import { MenuManager } from 'main.popup';
import { Chip, ChipDesign, ChipSize } from 'ui.system.chip.vue';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';

import { ALL_SECTIONS_ID } from 'imopenlines.v2.lib.quick-reply';

import './css/quick-reply-create-form.css';

const TEXTAREA_ROWS_COUNT = 4;
const MAX_TEXT_LENGTH = 10000;
const SECTION_MENU_ID = 'imol-quick-reply-section-menu';

// @vue/component
export const QuickReplyCreateForm = {
	name: 'QuickReplyCreateForm',
	components: { Chip, UiButton },
	inject: ['disableAutoHide', 'enableAutoHide'],
	props: {
		sections: {
			type: Array,
			default: () => [],
		},
		editReply: {
			type: Object,
			default: null,
		},
		defaultSectionId: {
			type: Number,
			default: ALL_SECTIONS_ID,
		},
		isSaving: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['close', 'save'],
	data(): JsonObject
	{
		return {
			text: this.editReply?.text ?? '',
			selectedSectionId: this.editReply?.sectionId ?? this.defaultSectionId,
		};
	},
	computed:
	{
		ChipDesign: () => ChipDesign,
		ChipSize: () => ChipSize,
		AirButtonStyle: () => AirButtonStyle,
		ButtonSize: () => ButtonSize,
		TEXTAREA_ROWS_COUNT: () => TEXTAREA_ROWS_COUNT,
		MAX_TEXT_LENGTH: () => MAX_TEXT_LENGTH,
		isEditMode(): boolean
		{
			return this.editReply !== null;
		},
		selectedSectionName(): string
		{
			const selectedSection = this.sections.find((section) => section.id === this.selectedSectionId);

			return selectedSection?.name ?? '';
		},
		sectionLabel(): string
		{
			return this.isEditMode
				? this.loc('IMOL_CONTENT_TEXTAREA_QUICK_REPLY_EDIT_SECTION_LABEL')
				: this.loc('IMOL_CONTENT_TEXTAREA_QUICK_REPLY_CREATE_SECTION_LABEL');
		},
		saveButtonText(): string
		{
			return this.isEditMode
				? this.loc('IMOL_CONTENT_TEXTAREA_QUICK_REPLY_EDIT_SAVE')
				: this.loc('IMOL_CONTENT_TEXTAREA_QUICK_REPLY_CREATE_SAVE');
		},
		canSave(): boolean
		{
			return !this.isSaving && this.text.trim().length > 0;
		},
	},
	mounted()
	{
		const replyInput = this.$refs.replyInput;
		replyInput.focus();
		if (this.isEditMode)
		{
			const cursorEndPosition = replyInput.value.length;
			replyInput.setSelectionRange(cursorEndPosition, cursorEndPosition);
		}
	},
	beforeUnmount()
	{
		this.sectionMenu?.destroy();
	},
	methods:
	{
		openSectionMenu(): void
		{
			this.disableAutoHide();
			this.sectionMenu = MenuManager.create({
				id: SECTION_MENU_ID,
				bindElement: this.$refs.sectionSelector.$el,
				bindOptions: { position: 'bottom' },
				offsetTop: 4,
				items: this.sections.map((section) => ({
					text: section.name,
					onclick: () => {
						this.selectedSectionId = section.id;
						this.sectionMenu.close();
					},
				})),
				events: {
					onClose: () => {
						this.sectionMenu.destroy();
						this.sectionMenu = null;
						this.enableAutoHide();
					},
				},
			});
			this.sectionMenu.show();
		},
		onSave(): void
		{
			if (!this.canSave)
			{
				return;
			}

			this.$emit('save', {
				id: this.editReply?.id ?? 0,
				text: this.text.trim(),
				sectionId: this.selectedSectionId,
			});
		},
		onClose(): void
		{
			this.$emit('close');
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-imol-quick-reply-create">
			<div class="bx-imol-quick-reply-create__section-row">
				<span class="bx-imol-quick-reply-create__section-label">
					{{ sectionLabel }}
				</span>
				<Chip
					ref="sectionSelector"
					:text="selectedSectionName"
					:size="ChipSize.Sm"
					:design="ChipDesign.Outline"
					:dropdown="true"
					@click="openSectionMenu"
				/>
			</div>
			<div class="bx-imol-quick-reply-create__divider"></div>
			<div class="bx-imol-quick-reply-create__input">
				<textarea
					ref="replyInput"
					v-model="text"
					:placeholder="loc('IMOL_CONTENT_TEXTAREA_QUICK_REPLY_CREATE_PLACEHOLDER')"
					:rows="TEXTAREA_ROWS_COUNT"
					:maxlength="MAX_TEXT_LENGTH"
					class="bx-imol-quick-reply-create__textarea"
				/>
			</div>
			<div class="bx-imol-quick-reply-create__actions">
				<UiButton
					:text="loc('IMOL_CONTENT_TEXTAREA_QUICK_REPLY_FORM_CLOSE')"
					:style="AirButtonStyle.PLAIN"
					:size="ButtonSize.MEDIUM"
					@click="onClose"
				/>
				<UiButton
					:text="saveButtonText"
					:style="AirButtonStyle.FILLED"
					:size="ButtonSize.MEDIUM"
					:disabled="!canSave"
					:loading="isSaving"
					@click="onSave"
				/>
			</div>
		</div>
	`,
};
