import { HotkeyCombination, Settings } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { Utils } from 'im.v2.lib.utils';
import { SettingsService } from 'im.v2.provider.service.settings';

import { RadioOption, type RadioOptionItem } from '../elements/radio';
import { ReferenceBlock } from './hotkey/reference-block';
import { getHotkeyReference, type HotkeyReferenceBlock } from './hotkey/reference';

// @vue/component
export const HotkeySection = {
	name: 'HotkeySection',
	components: { RadioOption, ReferenceBlock },
	computed:
	{
		sendByEnter(): boolean
		{
			return this.$store.getters['application/settings/get'](Settings.hotkey.sendByEnter);
		},
		sendCombinationItems(): RadioOptionItem[]
		{
			const { sendMessage, newLine } = HotkeyCombination;

			return [
				{
					value: true,
					text: Utils.key.getCombinationText(sendMessage.byEnter),
					subtext: this.newLineSubtext(newLine.byShiftEnter),
					selected: this.sendByEnter === true,
				},
				{
					value: false,
					text: Utils.key.getCombinationText(sendMessage.byCtrlEnter),
					subtext: this.newLineSubtext(newLine.byEnter),
					selected: this.sendByEnter === false,
				},
			];
		},
		referenceBlocks(): HotkeyReferenceBlock[]
		{
			return getHotkeyReference(this.sendByEnter);
		},
	},
	mounted(): void
	{
		Analytics.getInstance().settings.onOpenHotkeySection();
	},
	methods:
	{
		newLineSubtext(combination: string): string
		{
			return this.loc('IM_CONTENT_SETTINGS_OPTION_HOTKEY_NEW_LINE_MSGVER_1', {
				'#HOTKEY#': Utils.key.getCombinationText(combination),
			});
		},
		onSendByEnterChange(newValue: boolean)
		{
			this.getSettingsService().changeSetting(Settings.hotkey.sendByEnter, newValue);
		},
		getSettingsService(): SettingsService
		{
			if (!this.settingsService)
			{
				this.settingsService = new SettingsService();
			}

			return this.settingsService;
		},
		loc(phraseCode: string, replacements: {[string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<div class="bx-im-settings-section-content__body">
			<div class="bx-im-settings-section-content__block">
				<div class="bx-im-settings-section-content__block_title">
					{{ loc('IM_CONTENT_SETTINGS_OPTION_HOTKEY_SEND_COMBINATION') }}
				</div>
				<RadioOption
					:items="sendCombinationItems"
					@change="onSendByEnterChange"
				/>
			</div>
		</div>
		<ReferenceBlock
			v-for="block in referenceBlocks"
			:key="block.id"
			:block="block"
		/>
	`,
};
