import './common-node-settings-preview.css';

import { useFeature, useLoc } from '../../../../shared/composables';
import { type ContentBlock, type ContentBlockItem } from '../../../../shared/types';
// Direct path, not the barrel of the layer: the barrel has already caught a cycle here.
import { ReadableExpressionText } from '../../../node-settings/ui/readable-expression-text/readable-expression-text';
// Direct path for the same reason as the import above.
import { SettingsSummary, hasSummaryContent } from '../../../node-settings/ui/settings-summary/settings-summary';

import { FeatureCode } from 'bizprocdesigner.feature';
import { BIcon } from 'ui.icon-set.api.vue';

// @vue/component
export const CommonNodeSettingsPreview = {
	name: 'CommonNodeSettingsPreview',
	components: { BIcon, ReadableExpressionText, SettingsSummary },
	props:
	{
		title:
		{
			type: String,
			required: true,
		},
		/** @type ContentBlock */
		contentBlock:
		{
			type: Object,
			default: null,
		},
		// Whether the representation handed over is a placeholder instead of the state of the node. The
		// place of use knows it: the panel reads the representation stored on the block, while the
		// canvas resolves it through the scope of the diagram.
		isContentBlockPlaceholder:
		{
			type: Boolean,
			default: false,
		},
	},
	emits: ['showRules'],
	setup(): { getMessage: () => string, isFeatureAvailable: (code: string) => boolean; }
	{
		const { getMessage } = useLoc();
		const { isFeatureAvailable } = useFeature();

		return { getMessage, isFeatureAvailable };
	},
	computed:
	{
		previewConstruction(): string
		{
			return this.title || this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_EMPTY');
		},
		isSummaryAvailable(): boolean
		{
			return this.isFeatureAvailable(FeatureCode.rulesSummary);
		},
		// A placeholder says nothing about the settings of the node, so it is not handed to the summary
		// at all: the summary then draws nothing by its own rule, and the row keeps the title alone.
		summaryContentBlock(): ?ContentBlock
		{
			return this.isContentBlockPlaceholder ? null : this.contentBlock;
		},
		summaryItems(): Array<ContentBlockItem>
		{
			return this.summaryContentBlock?.items ?? [];
		},
		summaryText(): string
		{
			return this.summaryContentBlock?.text ?? '';
		},
		// The stub of an unfilled title is the answer to "nothing is known about this node", and it stops
		// being true the moment the summary next to it tells what the node does. The row then drops the
		// title element instead of leading the filled summary with "not filled".
		isTitleShown(): boolean
		{
			if (this.title)
			{
				return true;
			}

			return !this.isSummaryAvailable || !hasSummaryContent(this.summaryItems, this.summaryText);
		},
	},
	template: `
		<div
			class="editor-chart-common-node-settings-preview"
			:class="{ '--with-summary': isSummaryAvailable }"
			:data-test-id="$testId('commonNodeSettingsPreview')"
			@click="$emit('showRules')"
		>
			<!-- The hint appears only while the compression policy of the row may cut the title. -->
			<ReadableExpressionText
				v-if="isTitleShown"
				class="editor-chart-common-node-settings-preview__construction"
				:class="{ '--empty': !title }"
				:value="previewConstruction"
				:withTitle="isSummaryAvailable"
			/>
			<!-- The second part of the row, behind the title it refines. With the flag off nothing is
			mounted and the modifier of the row is off too, so the row stays what it is today. -->
			<SettingsSummary
				v-if="isSummaryAvailable"
				:items="summaryItems"
				:text="summaryText"
			/>
			<BIcon
				:size="20"
				class="editor-chart-common-node-settings-preview__edit-icon"
				name="edit-m"
				color="currentColor"
			/>
		</div>
	`,
};
