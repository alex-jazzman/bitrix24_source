import { Button as UiButton, AirButtonStyle, ButtonSize as UiButtonSize } from 'ui.vue3.components.button';

import 'ui.design-tokens.air';

import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { ChatButton, ButtonSize, ButtonColor } from 'im.v2.component.elements.button';

import './css/button-panel.css';

const PANEL_TEST_ID = 'im-chat-form-button-panel';
const CREATE_BUTTON_TEST_ID = 'im-chat-form-button-panel-create';
const CANCEL_BUTTON_TEST_ID = 'im-chat-form-button-panel-cancel';

// @vue/component
export const ButtonPanel = {
	name: 'ButtonPanel',
	components: { ChatButton, UiButton },
	props:
	{
		isCreating: {
			type: Boolean,
			required: true,
		},
		createButtonTitle: {
			type: String,
			required: true,
		},
		createButtonDisabled: {
			type: Boolean,
			default: false,
		},
		createButtonColorScheme: {
			type: [Object, null],
			required: false,
			default: null,
		},
		// A screen drawn after the switch to the current design system has no legacy look to fall back
		// to: it asks for the buttons of the design system whatever the portal option says.
		forceAirDesign: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['create', 'cancel'],
	setup(): Object
	{
		return { PANEL_TEST_ID, CREATE_BUTTON_TEST_ID, CANCEL_BUTTON_TEST_ID };
	},
	computed:
	{
		ButtonSize: () => ButtonSize,
		ButtonColor: () => ButtonColor,
		UiButtonSize: () => UiButtonSize,
		AirButtonStyle: () => AirButtonStyle,
		isAirDesignEnabled(): boolean
		{
			return this.forceAirDesign || FeatureManager.isFeatureAvailable(Feature.isAirDesignEnabled);
		},
		cancelButtonTitle(): string
		{
			return this.loc('IM_CREATE_CHAT_CANCEL');
		},
	},
	methods:
	{
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	// The container stays the only root node: a consumer testid on the panel replaces the one below.
	// UiButton builds its node with ui.buttons and drops the placeholder it renders first, so the
	// identifier goes through the dataset option instead of a fallthrough attribute.
	// Both buttons keep the default size of the design system, the one the footer of the project
	// wizard stands on: it is the 38px of the layout, while the size above it draws 46px.
	template: `
		<div
			class="bx-im-chat-forms-button-panel__container"
			:class="{ '--air-design': isAirDesignEnabled }"
			:data-testid="PANEL_TEST_ID"
		>
			<template v-if="isAirDesignEnabled">
				<UiButton
					:size="UiButtonSize.LARGE"
					:style="AirButtonStyle.FILLED"
					:text="createButtonTitle"
					:loading="isCreating"
					:disabled="isCreating || createButtonDisabled"
					:dataset="{ testid: CREATE_BUTTON_TEST_ID }"
					class="bx-im-chat-forms-button-panel__create-button"
					@click="$emit('create')"
				/>
				<UiButton
					:size="UiButtonSize.LARGE"
					:style="AirButtonStyle.PLAIN"
					:text="cancelButtonTitle"
					:disabled="isCreating"
					:dataset="{ testid: CANCEL_BUTTON_TEST_ID }"
					@click="$emit('cancel')"
				/>
			</template>
			<template v-else>
				<ChatButton
					:size="ButtonSize.XL"
					:color="ButtonColor.Success"
					:customColorScheme="createButtonColorScheme"
					:text="createButtonTitle"
					:isLoading="isCreating"
					:isDisabled="isCreating || createButtonDisabled"
					:data-testid="CREATE_BUTTON_TEST_ID"
					@click="$emit('create')"
					class="bx-im-chat-forms-button-panel__create-button"
				/>
				<ChatButton
					:size="ButtonSize.XL"
					:color="ButtonColor.Link"
					:text="cancelButtonTitle"
					:isDisabled="isCreating"
					:data-testid="CANCEL_BUTTON_TEST_ID"
					@click="$emit('cancel')"
				/>
			</template>
		</div>
	`,
};
