import { type JsonObject } from 'main.core';
import { BIcon, Outline as OutlineIcons } from 'ui.icon-set.api.vue';

import { QuickCommandPopup } from './quick-command-popup';

// @vue/component
export const QuickCommand = {
	name: 'QuickCommand',
	components: { BIcon, QuickCommandPopup },
	emits: ['selectCommand'],
	data(): JsonObject
	{
		return {
			selectorElement: null,
			showPopup: false,
		};
	},
	computed: {
		OutlineIcons: () => OutlineIcons,
	},
	mounted()
	{
		this.selectorElement = this.$refs.quickCommandButton;
	},
	methods:
	{
		togglePopup(): void
		{
			this.showPopup = !this.showPopup;
		},
		closePopup(): void
		{
			this.showPopup = false;
		},
		selectCommandAndClosePopup(text: string, options: { replace: boolean, withNewLine: boolean }): void
		{
			this.closePopup();
			this.$nextTick(() => {
				this.$emit('selectCommand', text, options);
			});
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<span ref="quickCommandButton">
			<BIcon
				:name="OutlineIcons.COMMANDS"
				:title="loc('IMOL_CONTENT_TEXTAREA_QUICK_COMMAND')"
				class="bx-imol-textarea-icon"
				:class="{ '--active': showPopup }"
				@click="togglePopup"
			/>
		</span>
		<QuickCommandPopup
			v-if="showPopup"
			:bindElement="selectorElement"
			@selectCommand="selectCommandAndClosePopup"
			@close="closePopup"
		/>
	`,
};
