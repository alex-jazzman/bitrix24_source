import { ModeOption } from './mode-option';

export type LabelOptions = {
	value: string,
	text: string,
}

const FeatureLabel = {
	clients: 'clients',
	tasks: 'tasks',
	other: 'other',
	documents: 'documents',
	channels: 'channels',
	chats: 'chats',
	calls: 'calls',
};

const ONE_WINDOW_CARD_CLASS = '--one-window';
const TWO_WINDOW_CARD_CLASS = '--two-window';

// @vue/component
export const ModeOptionList = {
	name: 'ModeOptionList',
	components: { ModeOption },
	props: {
		isTwoWindowModeSelected: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['twoWindowClick', 'oneWindowClick'],
	computed: {
		OneWindowCardClass: () => ONE_WINDOW_CARD_CLASS,
		TwoWindowCardClass: () => TWO_WINDOW_CARD_CLASS,
		twoWindowModeLabels(): LabelOptions[]
		{
			return [
				{
					value: FeatureLabel.clients,
					text: this.loc('IM_DESKTOP_MODE_SELECTION_BANNER_LABEL_CLIENTS'),
				},
				{
					value: FeatureLabel.tasks,
					text: this.loc('IM_DESKTOP_MODE_SELECTION_BANNER_LABEL_TASKS'),
				},
				{
					value: FeatureLabel.other,
					text: this.loc('IM_DESKTOP_MODE_SELECTION_BANNER_LABEL_OTHER'),
				},
				{
					value: FeatureLabel.documents,
					text: this.loc('IM_DESKTOP_MODE_SELECTION_BANNER_LABEL_DOCUMENTS'),
				},
				{
					value: FeatureLabel.channels,
					text: this.loc('IM_DESKTOP_MODE_SELECTION_BANNER_LABEL_CHANNELS'),
				},
				{
					value: FeatureLabel.chats,
					text: this.loc('IM_DESKTOP_MODE_SELECTION_BANNER_LABEL_CHATS'),
				},
				{
					value: FeatureLabel.calls,
					text: this.loc('IM_DESKTOP_MODE_SELECTION_BANNER_LABEL_CALLS'),
				},
			];
		},
		oneWindowModeLabels(): LabelOptions[]
		{
			return [
				{
					value: FeatureLabel.channels,
					text: this.loc('IM_DESKTOP_MODE_SELECTION_BANNER_LABEL_CHANNELS'),
				},
				{
					value: FeatureLabel.chats,
					text: this.loc('IM_DESKTOP_MODE_SELECTION_BANNER_LABEL_CHATS'),
				},
				{
					value: FeatureLabel.calls,
					text: this.loc('IM_DESKTOP_MODE_SELECTION_BANNER_LABEL_CALLS'),
				},
			];
		},
	},
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<ul class="bx-im-desktop-mode-selection-banner__mode-option-list">
			<ModeOption
				:isSelected="isTwoWindowModeSelected"
				:labels="twoWindowModeLabels"
				:class="TwoWindowCardClass"
				:descriptionTitle="loc('IM_DESKTOP_MODE_SELECTION_BANNER_TITLE_TWO_WINDOW')"
				:descriptionText="loc('IM_DESKTOP_MODE_SELECTION_BANNER_DESCRIPTION_TWO_WINDOW')"
				@click="$emit('twoWindowClick')"
			/>
			<ModeOption
				:isSelected="!isTwoWindowModeSelected"
				:labels="oneWindowModeLabels"
				:class="OneWindowCardClass"
				:descriptionTitle="loc('IM_DESKTOP_MODE_SELECTION_BANNER_TITLE_ONE_WINDOW')"
				:descriptionText="loc('IM_DESKTOP_MODE_SELECTION_BANNER_DESCRIPTION_ONE_WINDOW')"
				@click="$emit('oneWindowClick')"
			>
				<template #extra-information>
					<span class="bx-im-desktop-mode-selection-banner__extra-information">{{ loc('IM_DESKTOP_MODE_SELECTION_BANNER_NOTE') }}</span>
				</template>
			</ModeOption>
		</ul>
	`,
};
