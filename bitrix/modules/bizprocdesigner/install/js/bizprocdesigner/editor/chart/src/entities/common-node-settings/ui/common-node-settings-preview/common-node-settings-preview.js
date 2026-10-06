import './common-node-settings-preview.css';

import { useLoc } from '../../../../shared/composables';
// Direct path, not the barrel of the layer: the barrel has already caught a cycle here.
import { ReadableExpressionText } from '../../../node-settings/ui/readable-expression-text/readable-expression-text';

import { BIcon } from 'ui.icon-set.api.vue';

// @vue/component
export const CommonNodeSettingsPreview = {
	name: 'CommonNodeSettingsPreview',
	components: { BIcon, ReadableExpressionText },
	props:
	{
		title:
		{
			type: String,
			required: true,
		},
	},
	emits: ['showRules'],
	setup(): { getMessage: () => string; }
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	computed:
	{
		previewConstruction(): string
		{
			return this.title || this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_EMPTY');
		},
	},
	template: `
		<div
			class="editor-chart-common-node-settings-preview"
			:data-test-id="$testId('commonNodeSettingsPreview')"
			@click="$emit('showRules')"
		>
			<span
				class="editor-chart-common-node-settings-preview__construction"
				:class="{ '--empty': !title }"
			>
				<ReadableExpressionText :value="previewConstruction" />
			</span>
			<BIcon
				:size="20"
				class="editor-chart-common-node-settings-preview__edit-icon"
				name="edit-m"
				color="currentColor"
			/>
		</div>
	`,
};
