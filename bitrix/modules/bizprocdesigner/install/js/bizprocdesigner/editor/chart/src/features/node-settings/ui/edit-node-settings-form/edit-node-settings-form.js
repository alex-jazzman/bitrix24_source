import { mapState } from 'ui.vue3.pinia';
import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { useNodeSettingsStore } from '../../../../entities/node-settings';
import { useLoc } from '../../../../shared/composables';
import { PORT_TYPES, isPortRulesAllowedBlockType } from '../../../../shared/constants';
import { type Port as TPort } from '../../../../shared/types';
import { ReadableExpressions } from '../../directives/readable-expressions';

import './style.css';

let formIdCounter = 0;

// @vue/component
export const EditNodeSettingsForm = {
	name: 'EditNodeSettingsForm',
	components: {
		BIcon,
	},
	directives: { ReadableExpressions },
	setup(): {
		getMessage: () => string;
		iconSet: typeof Outline;
		titleFieldId: string;
		descriptionFieldId: string;
		}
	{
		const { getMessage } = useLoc();
		formIdCounter++;

		return {
			getMessage,
			iconSet: Outline,
			titleFieldId: `editor-chart-node-settings-form-title-${formIdCounter}`,
			descriptionFieldId: `editor-chart-node-settings-form-description-${formIdCounter}`,
		};
	},
	computed:
	{
		...mapState(useNodeSettingsStore, ['block', 'ports', 'nodeSettings']),
		rulePorts(): Array<TPort>
		{
			return this.ports
				.filter((port) => port.type === PORT_TYPES.input)
			;
		},
		rulePortsLength(): number
		{
			return this.rulePorts.length;
		},
		supportsPortRules(): boolean
		{
			return isPortRulesAllowedBlockType(this.block?.type);
		},
		showRulesSection(): boolean
		{
			return this.supportsPortRules || this.rulePortsLength > 0;
		},
	},
	watch:
	{
		rulePortsLength(): void
		{
			this.$nextTick(() => {
				const { scrollHeight, clientHeight } = this.$el;
				if (scrollHeight > clientHeight)
				{
					this.$el.scrollTop = scrollHeight - clientHeight;
				}
			});
		},
	},
	methods:
	{
		onChangeTitle({ target: { value: title } }: InputEvent): void
		{
			this.nodeSettings.title = title;
		},
		onChangeDescription({ target: { value: description } }: InputEvent): void
		{
			this.nodeSettings.description = description;
		},
	},
	template: `
		<div class="editor-chart-node-settings-form">
			<div class="editor-chart-node-settings-form__section">
				<div class="editor-chart-node-settings-form__section-header">
					<div class="editor-chart-node-settings-form__section-header-main">
						<BIcon :name="iconSet.EDIT_M" :size="24"/>
						<span class="editor-chart-node-settings-form__section-title">
							{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_GENERAL_SECTION_TITLE') }}
						</span>
					</div>
					<span class="editor-chart-node-settings-form__section-description">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_GENERAL_SECTION_DESCRIPTION') }}
					</span>
				</div>
				<div class="editor-chart-node-settings-form__fields">
					<div>
						<label class="editor-chart-node-settings-form__label" :for="titleFieldId">
							{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_NAME_LABEL_MSGVER_1') }}
						</label>
						<div class="ui-ctl ui-ctl-textbox editor-chart-node-settings-form__node-name-input">
							<input type="text"
								v-readable-expressions
								class="ui-ctl-element"
								:id="titleFieldId"
								:placeholder="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_NAME_PLACEHOLDER_MSGVER_1')"
								:value="nodeSettings.title"
								:data-test-id="$testId('complexNodeName')"
								@input="onChangeTitle"
							/>
						</div>
					</div>
					<div class="editor-chart-node-settings-form__node-description">
						<label class="editor-chart-node-settings-form__label" :for="descriptionFieldId">
							{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_DESCRIPTION_LABEL') }}
						</label>
						<div class="ui-ctl ui-ctl-textarea editor-chart-node-settings-form__node-description_textarea">
							<textarea
								v-readable-expressions
								rows="1"
								class="ui-ctl-element"
								:id="descriptionFieldId"
								:placeholder="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_DESCRIPTION_PLACEHOLDER_MSGVER_1')"
								:value="nodeSettings.description"
								:data-test-id="$testId('complexNodeDescription')"
								@input="onChangeDescription"
							></textarea>
						</div>
					</div>
				</div>
			</div>
			<slot name="storages" />
			<div
				v-if="showRulesSection"
				class="editor-chart-node-settings-form__section --rules"
				:data-test-id="$testId('complexNodeRulesSection')"
			>
				<div class="editor-chart-node-settings-form__section-header">
					<div class="editor-chart-node-settings-form__section-header-main">
						<BIcon :name="iconSet.DATA_READING" :size="24"/>
						<span class="editor-chart-node-settings-form__section-title">
							{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_SECTION_TITLE') }}
						</span>
					</div>
					<span class="editor-chart-node-settings-form__section-description">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_SECTION_DESCRIPTION_MSGVER_1') }}
					</span>
				</div>
				<slot
					v-for="port in rulePorts"
					:key="port.id"
					:port="port"
					name="preview"
				/>
				<div
					v-if="supportsPortRules"
					class="editor-chart-node-settings-form__add-buttons"
					:data-test-id="$testId('complexNodeRulesAddButtons')"
				>
					<slot
						:itemType="'rule'"
						:text="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ADD_EXPERT_SETTINGS_BUTTON')"
						name="addSettingsItem"
					/>
				</div>
			</div>
			<slot />
		</div>
	`,
};
