import { Text } from 'main.core';
import { Vue as RadioButtonVue, RadioButtonSize } from 'ui.system.radiobutton';
import { TextMd, TextXs } from 'ui.system.typography.vue';

import 'ui.design-tokens.air';

import { Feature, FeatureManager } from 'im.v2.lib.feature';

import './css/radio.css';

export type RadioOptionItem = {
	value: OptionValue,
	text: string,
	selected: boolean,
	subtext?: string,
	html?: boolean,
};

type OptionValue = string | number | boolean;

type PreparedRadioOption = RadioOptionItem & {
	controlId: string,
	subtextId: string,
	testId: string | null,
};

// @vue/component
export const RadioOption = {
	name: 'RadioOption',
	components: { RadioButton: RadioButtonVue.RadioButton, TextMd, TextXs },
	props:
	{
		items: {
			type: Array,
			required: true,
		},
		name: {
			type: String,
			default: '',
		},
	},
	emits: ['change'],
	setup(): Object
	{
		return { RadioButtonSize };
	},
	data(): { groupName: string }
	{
		return {
			groupName: Text.getRandom(),
		};
	},
	computed:
	{
		isAirDesignEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAirDesignEnabled);
		},
		options(): PreparedRadioOption[]
		{
			return this.items.map((item: RadioOptionItem) => {
				const controlId = `im-chat-forms-radio-${this.groupName}-${String(item.value)}`;

				return {
					...item,
					controlId,
					subtextId: `${controlId}-subtext`,
					testId: this.name === '' ? null : `field-${this.name}-option-${String(item.value)}`,
				};
			});
		},
	},
	methods:
	{
		onInput(option: RadioOptionItem): void
		{
			this.$emit('change', option.value);
		},
		// The control and the caption are labels, so a click on either of them switches the option
		// on its own; the rest of the row comes here. The chosen option reports nothing, the way
		// a checked radio fires no change of its own.
		onRowClick(option: RadioOptionItem, event: MouseEvent): void
		{
			const isLabelClick = event.target instanceof HTMLElement && event.target.closest('label') !== null;
			if (option.selected || isLabelClick)
			{
				return;
			}

			this.onInput(option);
		},
	},
	// RadioButton has no caption slot and renders a label of its own, so the caption goes
	// next to it and gets tied to the control by for/id.
	template: `
		<div v-if="isAirDesignEnabled" class="bx-im-chat-forms-radio" role="radiogroup">
			<div
				v-for="option in options"
				:key="option.controlId"
				:class="['bx-im-chat-forms-radio__option', { '--selected': option.selected }]"
				:data-testid="option.testId"
				@click="onRowClick(option, $event)"
			>
				<span class="bx-im-chat-forms-radio__control">
					<RadioButton
						:id="option.controlId"
						:group="groupName"
						:size="RadioButtonSize.Sm"
						:modelValue="option.selected"
						:aria-describedby="option.subtext ? option.subtextId : null"
						@update:modelValue="onInput(option)"
					/>
				</span>
				<div class="bx-im-chat-forms-radio__text">
					<TextMd tag="label" :for="option.controlId" className="bx-im-chat-forms-radio__title">
						<span v-if="option.html" v-html="option.text"></span>
						<template v-else>{{ option.text }}</template>
					</TextMd>
					<TextXs
						v-if="option.subtext"
						tag="div"
						:id="option.subtextId"
						className="bx-im-chat-forms-radio__subtitle"
					>
						<span v-if="option.html" v-html="option.subtext"></span>
						<template v-else>{{ option.subtext }}</template>
					</TextXs>
				</div>
			</div>
		</div>
		<div v-else class="bx-im-content-create-chat-radio__container" role="radiogroup">
			<label
				v-for="option in options"
				:key="option.controlId"
				class="bx-im-content-create-chat-radio__item ui-ctl ui-ctl-radio"
				:data-testid="option.testId"
			>
				<input type="radio" class="ui-ctl-element" :name="groupName" :checked="option.selected" @input="onInput(option)">
				<div class="ui-ctl-label-text">
					<!-- Text -->
					<div v-if="option.html" class="bx-im-content-create-chat-radio__label_title" v-html="option.text"></div>
					<div v-else class="bx-im-content-create-chat-radio__label_title">{{ option.text }}</div>
					<!-- Subtext -->
					<template v-if="option.subtext">
						<div v-if="option.html" class="bx-im-content-create-chat-radio__label_subtitle" v-html="option.subtext"></div>
						<div v-else class="bx-im-content-create-chat-radio__label_subtitle">{{ option.subtext }}</div>
					</template>
				</div>
			</label>
		</div>
	`,
};
