import { mapState } from 'ui.vue3.pinia';
import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { useNodeSettingsStore, PORTLESS_RULE, hasPortlessRulesContainer } from '../../../../entities/node-settings';
import { useLoc } from '../../../../shared/composables';
import { PORT_TYPES, isPortRulesAllowedBlockType } from '../../../../shared/constants';
import { type Block, type Port as TPort } from '../../../../shared/types';
import { ReadableExpressions } from '../../directives/readable-expressions';

import './style.css';

// A row of the rules section as the section and the preview inside it read it: the fields of a port
// (id, type, title) and nothing more. The rules container of a node without input ports is such a row
// too, and it is the store descriptor of that container that stands for it (PORTLESS_RULE): not a
// port, so it stays out of `ports` and adds nothing to the canvas and nothing to the saved template.
type RuleRow = { id: string, type: string, title: string };

/**
 * Rows of the rules section: the input ports of the node, or - for a node whose fixed set of rules
 * lives in the reserved container instead of ports - that single container. Relation ports are never
 * rows of this section: they are served by RelationsBlock.
 * The container is offered under the very condition the store creates it (hasPortlessRulesContainer,
 * resolvePortlessRule), so a row never stands for a rule that does not exist: a node whose rules the
 * user manages by input ports keeps no container after the last of them is deleted, and a node
 * keeping a relation port instead reaches that resolve with no container at all.
 * Exported because the widget walks the ancestor blocks of the previews against the same rows: two
 * readings of what the section renders would leave a row without its blocks.
 */
export function getRulesSectionRows(ports: ?Array<TPort>, block: ?Block): Array<RuleRow>
{
	const nodePorts = ports ?? [];
	const rulePorts = nodePorts.filter((port: TPort) => port.type === PORT_TYPES.input);
	if (rulePorts.length > 0)
	{
		return rulePorts;
	}

	const hasRelationPort = nodePorts.some((port: TPort) => port.type === PORT_TYPES.inputRelation);
	if (hasRelationPort || !hasPortlessRulesContainer(block))
	{
		return [];
	}

	return [PORTLESS_RULE];
}

/**
 * Whether the rules section is laid out at all. A node whose set of rules the user manages keeps the
 * section even while it is empty - that is where the rule is added; a node with a fixed set shows it
 * only while it has rows to show.
 * Exported for the same reason as the rows above: the warning about the references of the node has to
 * know whether the section that would name them is on screen, and a second reading of that condition
 * would let the two disagree - the section hidden, the references named nowhere.
 */
export function isRulesSectionShown(ports: ?Array<TPort>, block: ?Block): boolean
{
	return isPortRulesAllowedBlockType(block?.type) || getRulesSectionRows(ports, block).length > 0;
}

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
		rulePorts(): Array<RuleRow>
		{
			return getRulesSectionRows(this.ports, this.block);
		},
		rulePortsLength(): number
		{
			return this.rulePorts.length;
		},
		// Whether the user may change the set of rules of the node: the add button and the removability
		// of a row. Not what decides the section itself - a node of the unified panel keeps a fixed set
		// of rules and still shows them.
		supportsPortRules(): boolean
		{
			return isPortRulesAllowedBlockType(this.block?.type);
		},
		showRulesSection(): boolean
		{
			return isRulesSectionShown(this.ports, this.block);
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
				<slot name="generalNotice" />
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
				<slot name="rulesNotice" />
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
