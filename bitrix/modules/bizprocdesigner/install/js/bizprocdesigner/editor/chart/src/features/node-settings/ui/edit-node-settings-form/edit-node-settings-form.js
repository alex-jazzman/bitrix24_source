import { mapState } from 'ui.vue3.pinia';
import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { FeatureCode } from 'bizprocdesigner.feature';

import { useNodeSettingsStore } from '../../../../entities/node-settings';
import { useLoc, useFeature } from '../../../../shared/composables';
import { PORT_TYPES } from '../../../../shared/constants';
import { type Port as TPort } from '../../../../shared/types';

import './style.css';

// @vue/component
export const EditNodeSettingsForm = {
	name: 'EditNodeSettingsForm',
	components: {
		BIcon,
	},
	setup(): {
		getMessage: () => string;
		isFeatureAvailable: (code: string) => boolean;
		iconSet: typeof Outline;
		}
	{
		const { getMessage } = useLoc();
		const { isFeatureAvailable } = useFeature();

		return {
			getMessage,
			isFeatureAvailable,
			iconSet: Outline,
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
		relationPorts(): Array<TPort>
		{
			return this.ports.filter((port) => port.type === PORT_TYPES.inputRelation);
		},
		rulePortsLength(): number
		{
			return this.rulePorts.length;
		},
		isRelationFeatureAvailable(): boolean
		{
			return this.block.node?.shouldShowAuxPorts !== true
				&& this.isFeatureAvailable(FeatureCode.complexNodeConnections);
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
						<BIcon :name="iconSet.EDIT_M" :size="30"/>
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
						<span class="editor-chart-node-settings-form__label">
							{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_NAME_LABEL_MSGVER_1') }}
						</span>
						<div class="ui-ctl ui-ctl-textbox editor-chart-node-settings-form__node-name-input">
							<input type="text"
								class="ui-ctl-element"
								:placeholder="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_NAME_PLACEHOLDER_MSGVER_1')"
								:value="nodeSettings.title"
								:data-test-id="$testId('complexNodeName')"
								@input="onChangeTitle"
							/>
						</div>
					</div>
					<div class="editor-chart-node-settings-form__node-description">
						<span class="editor-chart-node-settings-form__label">
							{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_DESCRIPTION_LABEL') }}
						</span>
						<div class="ui-ctl ui-ctl-textarea editor-chart-node-settings-form__node-description_textarea">
							<textarea
								rows="1"
								class="ui-ctl-element"
								:placeholder="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_NODE_DESCRIPTION_PLACEHOLDER_MSGVER_1')"
								:value="nodeSettings.description"
								:data-test-id="$testId('complexNodeDescription')"
								@input="onChangeDescription"
							></textarea>
						</div>
					</div>
				</div>
			</div>
			<div class="editor-chart-node-settings-form__section --rules">
				<div class="editor-chart-node-settings-form__section-header">
					<div class="editor-chart-node-settings-form__section-header-main">
						<BIcon :name="iconSet.DATA_READING" :size="26"/>
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
				<slot
					v-for="port in relationPorts"
					:key="port.id"
					:port="port"
					name="preview"
				/>
				<div class="editor-chart-node-settings-form__add-buttons">
					<slot
						:itemType="'rule'"
						:text="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EDIT_RULES_BUTTON')"
						name="addSettingsItem"
					/>
					<slot
						v-if="isRelationFeatureAvailable"
						:itemType="'relation'"
						:text="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_ADD_ENTRY_POINT_BUTTON')"
						name="addSettingsItem"
					/>
				</div>
			</div>
		</div>
	`,
};
