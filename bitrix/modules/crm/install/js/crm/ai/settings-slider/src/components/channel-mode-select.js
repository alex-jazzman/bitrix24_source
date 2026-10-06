import { LabelStyle } from 'ui.system.label';
import { UiLabel } from 'ui.system.label.vue';
import { BMenu } from 'ui.system.menu.vue';

import { buildChannelModeOptions, DISABLED_MODE_CODE, getSelectedChannelModeOption } from '../store/helpers';

const MODE_SECTION_CODE = 'modes';

// @vue/component
export const ChannelModeSelect = {
	name: 'ChannelModeSelect',
	components: {
		BMenu,
		UiLabel,
	},
	emits: ['change'],
	props: {
		channel: {
			type: Object,
			required: true,
		},
	},
	data()
	{
		return {
			isMenuShown: false,
		};
	},
	computed: {
		blockedLabelStyle(): string
		{
			return LabelStyle.FILLED_WARNING_INVERTED;
		},

		options(): Array
		{
			return buildChannelModeOptions(this.channel, this.getMessage.bind(this));
		},

		selectedOption(): Object
		{
			return getSelectedChannelModeOption(this.channel, this.getMessage.bind(this));
		},

		iconClass(): string
		{
			if (this.channel.code === 'call')
			{
				return '--o-phone-up';
			}

			if (this.channel.code === 'chat')
			{
				return '--o-chats';
			}

			if (this.channel.code === 'email')
			{
				return '--o-mail';
			}

			return '';
		},

		menuOptions(): Object
		{
			return {
				bindElement: this.$refs.button,
				sections: [{ code: MODE_SECTION_CODE }],
				items: this.options.map((option) => ({
					id: option.code,
					title: option.title,
					sectionCode: option.code === DISABLED_MODE_CODE ? undefined : MODE_SECTION_CODE,
					isSelected: option.code === this.selectedOption.code,
					onClick: () => this.selectOption(option),
				})),
				closeOnItemClick: true,
			};
		},
	},
	methods: {
		getMessage(messageKey, replacements = {}): string
		{
			return this.$Bitrix.Loc.getMessage(messageKey, replacements);
		},

		toggleMenu(): void
		{
			if (this.channel.isBlocked)
			{
				return;
			}

			this.isMenuShown = !this.isMenuShown;
		},

		selectOption(option): void
		{
			this.$emit('change', {
				channelCode: this.channel.code,
				option,
			});
		},

		closeMenu(): void
		{
			this.isMenuShown = false;
		},
	},
	// language=Vue
	template: `
		<div class="crm-ai-settings-slider__channel-mode">
			<div class="crm-ai-settings-slider__channel-mode-title">
				<span
					v-if="iconClass"
					:class="['ui-icon-set', iconClass, 'crm-ai-settings-slider__channel-mode-icon']"
				></span>
				<span>{{ channel.title }}</span>
			</div>
			<button
				ref="button"
				type="button"
				:class="[
					'crm-ai-settings-slider__mode-button',
					{ '--open': isMenuShown },
				]"
				:disabled="channel.isBlocked"
				@click="toggleMenu"
			>
				<span class="crm-ai-settings-slider__mode-button-label">{{ selectedOption.title }}</span>
				<span class="crm-ai-settings-slider__mode-button-right" aria-hidden="true">
					<span class="crm-ai-settings-slider__mode-button-divider"></span>
					<span class="crm-ai-settings-slider__mode-button-chevron"></span>
				</span>
			</button>
			<BMenu
				v-if="isMenuShown"
				:options="menuOptions"
				@close="closeMenu"
			/>
			<div
				v-if="channel.isBlocked"
				class="crm-ai-settings-slider__channel-blocked"
			>
				<UiLabel
					:style="blockedLabelStyle"
					size="sm"
					:value="$Bitrix.Loc.getMessage('CRM_AI_AUTOMATION_SLIDER_REASON_TRANSCRIPTION_DISABLED')"
				/>
			</div>
		</div>
	`,
};
