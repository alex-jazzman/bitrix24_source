import { Outline as OutlineIcons } from 'ui.icon-set.api.core';
import { vBTooltip } from 'ui.system.tooltip.vue';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';

import { UploadManager } from 'im.v2.lib.uploading';

// @vue/component
export const AddMoreButton = {
	name: 'AddMoreButton',
	directives: { 'b-tooltip': vBTooltip },
	components: { UiButton },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		// the way in is refused, and the button says so by going out instead of leaving the window
		disabled: {
			type: Boolean,
			default: false,
		},
		// why it is out. Shown in the tooltip and read out as the description of the control
		disabledReason: {
			type: String,
			default: '',
		},
	},
	emits: ['filesSelected'],
	computed:
	{
		OutlineIcons: () => OutlineIcons,
		ButtonSize: () => ButtonSize,
		AirButtonStyle: () => AirButtonStyle,
		acceptAttribute(): string | null
		{
			return this.uploadManager.getAcceptAttribute(this.dialogId);
		},
		// an empty content is what the directive reads as "no tooltip here", so the enabled button carries none
		tooltipContent(): string
		{
			return this.disabled ? this.disabledReason : '';
		},
	},
	created()
	{
		this.uploadManager = new UploadManager();
	},
	methods:
	{
		selectFiles()
		{
			if (this.disabled)
			{
				return;
			}

			this.$refs.fileInput.click();
		},
		// the popup owns the add path of the batch, the button only hands the selection over
		onFileSelect(event: Event)
		{
			const input = event.target;
			const files: File[] = Object.values(input.files);
			// without the reset picking the same file again fires no change event
			input.value = '';

			this.$emit('filesSelected', files);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	// A disabled <button> is out of the tab order and takes no pointer events, so a tooltip on it would
	// never be raised by either of them. So the wrapper answers for the button while it is out: it takes
	// its name, says that it is unavailable and carries the reason - by the cursor and by the focus alike.
	template: `
		<div
			v-b-tooltip="tooltipContent"
			class="bx-im-upload-preview__add-more"
			data-testid="im-upload-preview-add-more"
			:role="disabled ? 'button' : undefined"
			:tabindex="disabled ? 0 : undefined"
			:aria-disabled="disabled ? 'true' : undefined"
			:aria-label="disabled ? loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_ADD_MORE') : undefined"
		>
			<UiButton
				:text="loc('IM_TEXTAREA_UPLOAD_PREVIEW_POPUP_ADD_MORE')"
				:leftIcon="OutlineIcons.ATTACH"
				:size="ButtonSize.SMALL"
				:style="AirButtonStyle.OUTLINE_NO_ACCENT"
				:disabled="disabled"
				:dataset="{ testid: 'im-upload-preview-add-more-btn' }"
				@click="selectFiles"
			/>
			<!-- The input is the mechanism behind the button, not a control of its own: the button carries the
			     name and the Tab stop, the input only opens the system picker. Stated in the markup rather
			     than left to the display: none of the stylesheet, so a keyboard user never lands on a
			     nameless second control if that stylesheet ever loads late or not at all. -->
			<input
				ref="fileInput"
				type="file"
				multiple
				class="bx-im-upload-preview__add-more-input"
				data-testid="im-upload-preview-add-more-input"
				tabindex="-1"
				aria-hidden="true"
				:accept="acceptAttribute || undefined"
				@change="onFileSelect"
			>
		</div>
	`,
};
