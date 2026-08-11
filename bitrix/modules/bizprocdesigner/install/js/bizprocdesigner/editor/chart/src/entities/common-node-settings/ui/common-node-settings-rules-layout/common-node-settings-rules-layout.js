import './common-node-settings-rules-layout.css';

import { Dom } from 'main.core';
import { BIcon } from 'ui.icon-set.api.vue';

import { useLoc } from '../../../../shared/composables';

// @vue/component
export const CommonNodeSettingsRulesLayout = {
	name: 'CommonNodeSettingsRulesLayout',
	components: { BIcon },
	props:
	{
		/** @type HTMLElement */
		ruleForm:
		{
			type: [Object, null],
			required: true,
		},
	},
	emits: ['close'],
	setup(): { getMessage: () => string; }
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	watch:
	{
		ruleForm:
		{
			handler(): void
			{
				if (!this.ruleForm)
				{
					return;
				}

				this.$nextTick(() => {
					this.$refs.layoutContent.innerHTML = '';
					Dom.append(this.ruleForm, this.$refs.layoutContent);
				});
			},
			immediate: true,
		},
	},
	template: `
		<div class="editor-chart-common-node-settings-rules-layout node-settings-panel">
			<div class="editor-chart-common-node-settings-rules-layout__header">
				<BIcon
					:size="20"
					:data-test-id="$testId('commonNodeRuleSettingsClose')"
					name="arrow-left-l"
					color="#828b95"
					class="editor-chart-node-settings-rules-layout__header_back"
					@click="$emit('close')"
				/>
				<span class="editor-chart-common-node-settings-rules-layout__header_label">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULES_LAYOUT_TITLE') }}
				</span>
				<slot name="header-right" />
			</div>
			<div
				class="editor-chart-common-node-settings-rules-layout__content"
				ref="layoutContent"
			>
			</div>
			<div class="editor-chart-common-node-settings-rules-layout__footer node-settings-footer">
				<slot
					name="actions"
					:form="ruleForm"
				/>
			</div>
		</div>
	`,
};
