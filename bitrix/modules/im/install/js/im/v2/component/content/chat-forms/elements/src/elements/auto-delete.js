import { Text, type JsonObject } from 'main.core';
import { Switcher } from 'ui.vue3.components.switcher';
import { AirSwitcherStyle, SwitcherSize, type SwitcherOptions } from 'ui.switcher';
import { TextMd, TextXs } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { BMenu, type MenuOptions } from 'ui.system.menu.vue';

import 'ui.design-tokens.air';
import 'ui.icon-set.outline';

import { AutoDeleteDelay } from 'im.v2.const';
import { Feature, FeatureManager, TariffManager } from 'im.v2.lib.feature';
import { AutoDeleteManager } from 'im.v2.lib.auto-delete';
import { Toggle, ToggleSize } from 'im.v2.component.elements.toggle';
import { ChatHint } from 'im.v2.component.elements.hint';
import { AutoDeleteDropdown, AutoDeletePopup } from 'im.v2.component.elements.auto-delete';

import './css/auto-delete.css';

// @vue/component
export const AutoDelete = {
	name: 'AutoDelete',
	components: { Toggle, Switcher, TextMd, TextXs, BIcon, BMenu, ChatHint, AutoDeleteDropdown, AutoDeletePopup },
	props: {
		initialDelay: {
			type: Number,
			default: 0,
		},
	},
	emits: ['delayChange'],
	setup(): Object
	{
		return { Outline };
	},
	data(): JsonObject
	{
		return {
			delay: this.initialDelay,
			showPopup: false,
			isDelayMenuShown: false,
			titleId: `bx-im-chat-forms-auto-delete-title-${Text.getRandom()}`,
		};
	},
	computed:
	{
		ToggleSize: () => ToggleSize,
		title(): string
		{
			return this.loc('IM_CREATE_CHAT_SETTINGS_SECTION_MESSAGES_AUTO_DELETE_TITLE');
		},
		hintText(): string
		{
			return this.loc('IM_CREATE_CHAT_SETTINGS_SECTION_MESSAGES_AUTO_DELETE_HINT');
		},
		isAirDesignEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAirDesignEnabled);
		},
		isEnabled(): boolean
		{
			return this.delay !== AutoDeleteDelay.Off;
		},
		isFeatureEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.messagesAutoDeleteEnabled);
		},
		switcherOptions(): SwitcherOptions
		{
			return {
				size: SwitcherSize.extraSmall,
				style: AirSwitcherStyle.SOLID,
				showStateTitle: false,
				useAirDesign: true,
			};
		},
		delayText(): string
		{
			return AutoDeleteManager.getStatusText(this.delay);
		},
		delayMenuOptions(): MenuOptions
		{
			return {
				bindElement: this.$refs.delayTrigger.$el,
				closeOnItemClick: false,
				items: Object.values(AutoDeleteDelay).map((delay: number) => {
					return {
						title: AutoDeleteManager.getStatusText(delay),
						isSelected: delay === this.delay,
						onClick: () => this.selectDelay(delay),
					};
				}),
			};
		},
	},
	watch:
	{
		delay(newValue: number)
		{
			this.$emit('delayChange', newValue);
		},
	},
	methods:
	{
		onChangeAutoDeleteState()
		{
			if (!this.isFeatureEnabled)
			{
				TariffManager.messagesAutoDelete.openFeatureSlider();

				return;
			}

			if (this.isEnabled)
			{
				this.delay = AutoDeleteDelay.Off;
			}
			else
			{
				this.showPopup = true;
			}
		},
		onDelayChange(delay: number)
		{
			this.delay = delay;
		},
		openDelayMenu()
		{
			this.isDelayMenuShown = true;
		},
		selectDelay(delay: number)
		{
			this.isDelayMenuShown = false;
			this.onDelayChange(delay);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	// Switcher gives the raw control without switch semantics, so role, state and keyboard
	// toggling live on the wrapper; check/uncheck both go through the same handler because
	// turning auto-delete on has to pass the tariff gate and ask for a delay first.
	// The period lives under the caption: a plain status while auto-delete is off and a text
	// dropdown once it is on, both lined up with the caption by an empty switcher column.
	template: `
		<div class="bx-im-chat-forms-auto-delete__container" data-testid="im-chat-form-auto-delete">
			<template v-if="isAirDesignEnabled">
				<div class="bx-im-chat-forms-auto-delete__row --caption">
					<div
						class="bx-im-chat-forms-auto-delete__switcher"
						role="switch"
						tabindex="0"
						data-testid="im-chat-form-auto-delete-switcher"
						:aria-checked="isEnabled ? 'true' : 'false'"
						:aria-labelledby="titleId"
						@keydown.space.prevent="onChangeAutoDeleteState"
						@keydown.enter.prevent="onChangeAutoDeleteState"
					>
						<Switcher
							:isChecked="isEnabled"
							:options="switcherOptions"
							@check="onChangeAutoDeleteState"
							@uncheck="onChangeAutoDeleteState"
						/>
					</div>
					<div class="bx-im-chat-forms-auto-delete__caption">
						<TextMd tag="span" :id="titleId">{{ title }}</TextMd>
						<ChatHint :text="hintText" />
					</div>
				</div>
				<div class="bx-im-chat-forms-auto-delete__row">
					<div class="bx-im-chat-forms-auto-delete__spacer"></div>
					<TextXs
						v-if="isEnabled"
						ref="delayTrigger"
						tag="button"
						type="button"
						className="bx-im-chat-forms-auto-delete__delay"
						data-testid="im-chat-form-auto-delete-delay"
						@click="openDelayMenu"
					>
						{{ delayText }}
						<BIcon
							:class="['bx-im-chat-forms-auto-delete__chevron', { '--open': isDelayMenuShown }]"
							:name="Outline.CHEVRON_DOWN_S"
							color="var(--ui-color-base-3)"
						/>
					</TextXs>
					<TextXs
						v-else
						tag="span"
						className="bx-im-chat-forms-auto-delete__status"
						data-testid="im-chat-form-auto-delete-delay"
					>{{ delayText }}</TextXs>
				</div>
				<BMenu
					v-if="isDelayMenuShown"
					:options="delayMenuOptions"
					@close="isDelayMenuShown = false"
				/>
			</template>
			<template v-else>
				<Toggle
					:size="ToggleSize.M"
					:isEnabled="isEnabled"
					data-testid="im-chat-form-auto-delete-switcher"
					@click="onChangeAutoDeleteState"
					class="bx-im-chat-forms-auto-delete__toggle"
				/>
				<div class="bx-im-chat-forms-auto-delete__label">
					<div class="bx-im-chat-forms-auto-delete__title">
						{{ title }}
						<ChatHint :text="hintText" class="bx-im-chat-forms-auto-delete__hint" />
					</div>
					<AutoDeleteDropdown
						:currentDelay="delay"
						data-testid="im-chat-form-auto-delete-delay"
						@delayChange="onDelayChange"
					/>
				</div>
			</template>
			<AutoDeletePopup
				v-if="showPopup"
				:autoDeleteDelay="delay"
				@close="showPopup = false"
				@autoDeleteDelayChange="onDelayChange"
			/>
		</div>
	`,
};
