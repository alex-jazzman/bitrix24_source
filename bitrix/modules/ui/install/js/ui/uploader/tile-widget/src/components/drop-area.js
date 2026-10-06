import { Loc, Text } from 'main.core';

import { SettingsButton } from './settings-button';

import type { BitrixVueComponentProps } from 'ui.vue3';

export const DropArea: BitrixVueComponentProps = {
	inject: ['uploader', 'widgetOptions', 'emitter'],
	components: {
		SettingsButton,
	},
	setup(): Object
	{
		return {
			inputId: `ui-tile-uploader-drop-input-${Text.getRandom().toLowerCase()}`,
			keyboardHintId: `ui-tile-uploader-drop-hint-${Text.getRandom().toLowerCase()}`,
		};
	},
	mounted(): void
	{
		// a real input given to assignBrowse works natively: Tab stop, Enter and Space
		// open the system dialog (the button pattern), multiple and accept are set by
		// the uploader itself
		this.uploader.assignBrowse(this.$refs.fileInput);
	},
	computed: {
		dropLabel(): string
		{
			return Loc.getMessage('TILE_UPLOADER_DROP_FILES_HERE');
		},
		keyboardHint(): ?string
		{
			return Loc.getMessage('TILE_UPLOADER_DROP_KEYBOARD_HINT');
		},
	},
	methods: {
		handleSettingsClick()
		{
			this.emitter.emit('onSettingsButtonClick', { button: this.$refs['ui-tile-uploader-settings'] });
		},
	},
	// language=Vue
	template: `
		<div class="ui-tile-uploader-drop-area">
			<div class="ui-tile-uploader-drop-box">
				<!--
					tabindex is explicit on purpose: Safari with "Press Tab to highlight each item
					on a webpage" off walks only the elements that carry a tabindex, so without it
					the field drops out of the Tab order and the file cannot be picked from the
					keyboard. Value 0 keeps the document order.
				-->
				<input
					type="file"
					class="ui-tile-uploader-drop-input"
					data-testid="ui-tile-uploader-drop-input"
					tabindex="0"
					:id="inputId"
					:aria-describedby="keyboardHint ? keyboardHintId : null"
					ref="fileInput"
				/>
				<label class="ui-tile-uploader-drop-label" :for="inputId">{{dropLabel}}</label>
				<!--
					the hint is a description, not a part of the accessible name: the label stays the
					only name of the input. A locale without the phrase renders no span, so
					aria-describedby must not point at it either.
				-->
				<span
					v-if="keyboardHint"
					class="ui-tile-uploader-visually-hidden"
					:id="keyboardHintId"
				>{{keyboardHint}}</span>
				<SettingsButton v-if="widgetOptions.showSettingsButton" />
			</div>
		</div>
	`,
};
