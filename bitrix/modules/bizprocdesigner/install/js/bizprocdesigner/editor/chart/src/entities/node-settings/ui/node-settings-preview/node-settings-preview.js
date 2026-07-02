import './style.css';

import { BIcon } from 'ui.icon-set.api.vue';

import { PORT_TYPES } from '../../../../shared/constants';
import { useLoc } from '../../../../shared/composables';

import { CONSTRUCTION_LABELS, GENERAL_CONSTRUCTION_TYPES } from '../../constants';
import { evaluateConditionExpressionFieldTitle } from '../../utils';

import type {
	GeneralConstructionTypes,
	ConstructionLabels,
	Construction,
	TRuleCard,
} from '../../types';

// @vue/component
export const NodeSettingsPreview = {
	name: 'NodeSettingsPreview',
	components: { BIcon },
	props:
	{
		/** @type Port */
		port:
		{
			type: Object,
			required: true,
		},
		/** @type NodeSettings */
		nodeSettings:
		{
			type: Object,
			required: true,
		},
		/** @type Array<Block> */
		connectedBlocks:
		{
			type: Array,
			required: true,
		},
	},
	emits: ['showConstructions', 'deletePreview'],
	setup(): { getMessage: () => string; }
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	computed:
	{
		previewItem(): string
		{
			return this.port.type === PORT_TYPES.input
				? this.nodeSettings.rules.get(this.port.id)
				: this.nodeSettings.relations.get(this.port.id);
		},
		isFilled(): boolean
		{
			return this.previewItem?.isFilled ?? false;
		},
		constructionLabels(): ConstructionLabels
		{
			return CONSTRUCTION_LABELS;
		},
		generalConstructionTypes(): GeneralConstructionTypes
		{
			return GENERAL_CONSTRUCTION_TYPES;
		},
		ifLabel(): string
		{
			return this.getMessage(CONSTRUCTION_LABELS['condition:if']);
		},
		cards(): Array<TRuleCard>
		{
			return this.previewItem.ruleCards;
		},
	},
	methods:
	{
		onPreviewClick(): void
		{
			this.$emit('showConstructions');
		},
		onDeletePreview(): void
		{
			this.$emit('deletePreview');
		},
		getExpressionTitle({ expression, type }: Construction): string
		{
			if (type === GENERAL_CONSTRUCTION_TYPES.action)
			{
				if (!expression.actionId)
				{
					return '';
				}

				return this.nodeSettings.actions.get(expression.actionId).title;
			}

			if (type === GENERAL_CONSTRUCTION_TYPES.output || !expression.field)
			{
				return '';
			}

			return evaluateConditionExpressionFieldTitle(this.connectedBlocks, expression.field);
		},
		getExpressionValue({ expression: { value, title }, type }: Construction): string
		{
			if (type === GENERAL_CONSTRUCTION_TYPES.output)
			{
				return title;
			}

			return value;
		},
	},
	template: `
		<div
			class="editor-chart-node-settings-preview"
			:data-test-id="$testId('complexNodeSettingsPreview', port.id)"
			@click="onPreviewClick"
		>
			<BIcon
				class="editor-chart-node-settings-preview__dnd-icon"
				:size="20"
				name="drag-m"
				color="#828b95"
			/>
			<span class="editor-chart-node-settings-preview__title">
				<slot />
			</span>
			<div
				v-if="isFilled"
				class="editor-chart-node-settings-preview__card-container"
			>
				<div
					v-for="card in cards"
					:key="card.id"
					class="editor-chart-node-settings-preview__card"
				>
					<div
						v-for="construction in card.constructions"
						:key="construction.id"
						class="editor-chart-node-settings-preview__construction"
						:class="['--' + generalConstructionTypes[construction.type]]"
						:data-if-indent="ifLabel"
					>
						<span class="editor-chart-node-settings-preview__construction_type">
							{{ getMessage(constructionLabels[construction.type]) }}
						</span>
						<span class="editor-chart-node-settings-preview__expression-part">
							{{ getExpressionTitle(construction) }}
						</span>
						<span
							v-if="construction.expression.operator"
							class="editor-chart-node-settings-preview__expression-part"
						>
							{{ construction.expression.operator }}
						</span>
						<span
							v-if="generalConstructionTypes[construction.type] !== generalConstructionTypes.action"
							class="editor-chart-node-settings-preview__expression-part"
						>
							{{ getExpressionValue(construction) }}
						</span>
					</div>
				</div>
			</div>
			<span
				class="editor-chart-node-settings-preview__construction --empty"
				v-else
			>
				{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_EMPTY') }}
			</span>
			<div class="editor-chart-node-settings-preview__actions">
				<BIcon
					:size="20"
					class="editor-chart-node-settings-preview__edit-icon"
					name="edit-m"
					color="#c9ccd0"
				/>
				<BIcon
					class="editor-chart-node-settings-preview__close-icon"
					name="cross-m"
					:size="20"
					:data-test-id="$testId('complexNodeSettingsPreview', port.id, 'delete')"
					color="#c9ccd0"
					@click.stop="onDeletePreview"
				/>
			</div>
		</div>
	`,
};
