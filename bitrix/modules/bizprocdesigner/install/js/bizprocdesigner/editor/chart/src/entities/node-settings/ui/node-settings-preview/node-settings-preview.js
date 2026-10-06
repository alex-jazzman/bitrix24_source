import { BIcon } from 'ui.icon-set.api.vue';

import { useLoc } from '../../../../shared/composables';
import { PORT_TYPES } from '../../../../shared/constants';
import { type Block } from '../../../../shared/types';
import { CONSTRUCTION_TYPES, CONSTRUCTION_LABELS } from '../../constants';
import { type ConstructionLabels, type Construction, type Rule, type TRuleCard } from '../../types';
import {
	evaluateConditionExpressionFieldTitle,
	getConditionFieldFailoverTitle,
	getConditionFieldTitleSignature,
	getConnectedBlocksForConstruction,
	getVisibleConditionFieldUnresolvedReason,
} from '../../utils';
// Direct path, not the barrel of the layer: the barrel has already caught a cycle here.
import { ReadableExpressionText } from '../readable-expression-text/readable-expression-text';
import { UnresolvedFieldHint } from '../unresolved-field-hint/unresolved-field-hint';

import './style.css';

// A caption of a picked field belongs to a condition and to nothing else, so the types are listed rather
// than excluded: a construction type added later would otherwise walk into the captions on its own.
const FIELD_TITLE_TYPES = new Set(Object.values(CONSTRUCTION_TYPES.CONDITION));

function isFieldConstruction({ expression, type }: Construction): boolean
{
	return FIELD_TITLE_TYPES.has(type) && Boolean(expression?.field);
}

// @vue/component
export const NodeSettingsPreview = {
	name: 'NodeSettingsPreview',
	components: { BIcon, ReadableExpressionText, UnresolvedFieldHint },
	props:
	{
		/** @type Port */
		port:
		{
			type: Object,
			required: true,
		},
		/** @type Block */
		block:
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
		// The port set of a node translated to the unified panel is fixed: no delete, no reorder.
		fixedPort:
		{
			type: Boolean,
			default: false,
		},
	},
	emits: ['showConstructions', 'deletePreview'],
	setup(): { getMessage: () => string; }
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	data(): Object
	{
		return {
			expressionFields: {},
			isUnmounted: false,
		};
	},
	computed:
	{
		// The collection the port takes its item from. Kept as a computed of its own: the context of a
		// construction is built against the same collection, so both read one source.
		settingsItems(): Map<string, Rule>
		{
			return this.port.type === PORT_TYPES.input
				? this.nodeSettings.rules
				: this.nodeSettings.relations;
		},
		previewItem(): string
		{
			return this.settingsItems.get(this.port.id);
		},
		isFilled(): boolean
		{
			return this.previewItem?.isFilled ?? false;
		},
		constructionLabels(): ConstructionLabels
		{
			return CONSTRUCTION_LABELS;
		},
		groupedConstructionTypes(): { [key: string]: string }
		{
			const { CONDITION, ...rest } = CONSTRUCTION_TYPES;
			const conditionTypes = new Set(Object.values(CONDITION));
			const restTypes = Object.values(rest);

			return [...conditionTypes, ...restTypes].reduce((acc, currentType) => {
				if (conditionTypes.has(currentType))
				{
					return {
						...acc,
						[currentType]: 'condition',
					};
				}

				return {
					...acc,
					[currentType]: currentType,
				};
			}, {});
		},
		ifLabel(): string
		{
			return this.getMessage(CONSTRUCTION_LABELS['condition:if']);
		},
		cards(): Array<TRuleCard>
		{
			return this.previewItem.ruleCards;
		},
		// Each construction together with the card that holds it: the sources of a field are collected per
		// construction, and the card is what the neighbours and the filters are taken from. Read through
		// previewItem rather than through cards(): the watcher below evaluates this on every port,
		// including one without a rule of its own — the port that renders the empty state.
		fieldConstructions(): Array<{ card: TRuleCard, construction: Construction }>
		{
			return (this.previewItem?.ruleCards ?? []).flatMap((card: TRuleCard) => {
				return (card.constructions ?? [])
					.filter((construction: Construction) => isFieldConstruction(construction))
					.map((construction: Construction) => ({ card, construction }));
			});
		},
		/**
		 * The sources of a construction as its own editor sees them — the results of the filters of the card
		 * and the constructions standing before it, not the ancestors of the port alone; otherwise a
		 * reference to a filter result stays technical code on the card while the editor of the same
		 * condition reads it out. Built inside a computed, so the walk over the ancestors is cached until a
		 * dependency changes: the diagram, the cards of the port or the action of a neighbour. A value being
		 * typed in a condition is none of them — the walk reads no `expression.value`.
		 */
		constructionBlocks(): { [string]: Array<Block> }
		{
			return Object.fromEntries(
				this.fieldConstructions.map(({ card, construction }) => [
					construction.id,
					getConnectedBlocksForConstruction(
						this.block,
						this.port.id,
						card,
						construction,
						this.settingsItems,
						// The ancestors of the port are walked once for the whole card: the walk is transitive and
						// reads nothing of a construction, so repeating it per construction only costs the panel.
						this.connectedBlocks,
					),
				]),
			);
		},
		/**
		 * The sources as the editor of the condition reads them: it is rendered without a card of its own, so
		 * it excludes the filters of no card and resolves references this card cannot. A reason that depends
		 * on the set of blocks is decided against this reading, so a source missing here as well is missing
		 * for good.
		 *
		 * One reading for the whole port rather than one per construction: with no card to exclude, neither
		 * the neighbours nor the own package of the node are read — the latter belongs to an action, and only
		 * conditions are signed here — so a construction changes nothing in the answer.
		 */
		widerContextBlocks(): Array<Block>
		{
			return getConnectedBlocksForConstruction(
				this.block,
				this.port.id,
				null,
				null,
				this.settingsItems,
				this.connectedBlocks,
			);
		},
		// The captions depend on the picked fields and on what their sources are named, and on nothing
		// else of a construction, so the rebuild is watched by a signature of exactly that: a deep
		// watcher would fire on every keystroke in a value, and the array of the blocks alone changes
		// its identity on every edit of the diagram. The signature is built here, inside a computed, so
		// that the records of the template data it reads are tracked as dependencies. Each construction is
		// signed against its own sources: the same field reads a different context on a different card.
		// The wider reading is signed as well — the warning is decided by it, and a filter of this very card
		// changing is invisible to the narrower one, so the captions would keep a stale warning behind the
		// `KeepAlive` of the tabs.
		fieldConstructionsSignature(): string
		{
			return this.fieldConstructions
				.map(({ construction }) => [
					construction.id,
					getConditionFieldTitleSignature(
						this.constructionBlocks[construction.id],
						[construction.expression.field],
					),
					getConditionFieldTitleSignature(
						this.widerContextBlocks,
						[construction.expression.field],
					),
				].join('|'))
				.join(';')
			;
		},
	},
	watch:
	{
		fieldConstructionsSignature:
		{
			immediate: true,
			handler: 'rebuildExpressionFields',
		},
	},
	beforeUnmount(): void
	{
		this.isUnmounted = true;
	},
	methods:
	{
		rebuildExpressionFields(): void
		{
			const { fields, pending } = this.evaluateExpressionFields();
			const signature = this.fieldConstructionsSignature;

			this.expressionFields = fields;
			pending?.then(() => this.applyResolvedExpressionFields(signature));
		},
		// Fields of a document arrive after a request: a card changed meanwhile and a component already
		// gone leave the state alone. The signature tells the first apart, exactly as the editor of the
		// condition does: a newer one has already rebuilt the captions and started a pending of its own.
		// The second pass is taken as is — waiting for its own promise would loop over a request that
		// came back without the fields.
		applyResolvedExpressionFields(signature: string): void
		{
			if (this.isUnmounted || this.fieldConstructionsSignature !== signature)
			{
				return;
			}

			this.expressionFields = this.evaluateExpressionFields().fields;
		},
		evaluateExpressionFields(): { fields: Object, pending: Promise<mixed> | null }
		{
			const fields = {};
			const pendings = [];
			for (const { construction } of this.fieldConstructions)
			{
				const { title, pending, unresolved } = evaluateConditionExpressionFieldTitle(
					this.constructionBlocks[construction.id],
					construction.expression.field,
				);

				fields[construction.id] = {
					title,
					unresolved: getVisibleConditionFieldUnresolvedReason(unresolved, {
						field: construction.expression.field,
						nodeSettings: this.nodeSettings,
						widerContextBlocks: this.widerContextBlocks,
					}),
				};
				if (pending)
				{
					pendings.push(pending);
				}
			}

			return {
				fields,
				pending: pendings.length > 0 ? Promise.all(pendings) : null,
			};
		},
		onPreviewClick(): void
		{
			this.$emit('showConstructions');
		},
		onDeletePreview(): void
		{
			this.$emit('deletePreview');
		},
		getExpressionTitle(construction: Construction): string
		{
			const { expression, id, type } = construction;
			if (type === CONSTRUCTION_TYPES.FILTER)
			{
				return this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_FILTER_EXPRESSION_NAME');
			}

			if (type === CONSTRUCTION_TYPES.ACTION)
			{
				if (!expression.actionId)
				{
					return '';
				}

				if (this.nodeSettings.relationAction?.id === expression.actionId)
				{
					return this.nodeSettings.relationAction.title;
				}

				return this.nodeSettings.actions.get(expression.actionId)?.title ?? '';
			}

			if (type === CONSTRUCTION_TYPES.OUTPUT || !expression.field)
			{
				return '';
			}

			// Belt for a construction the map has not caught up with: the raw reference, never a resolve
			// of its own — a request for the fields of a document must not start inside a render.
			return this.expressionFields[id]?.title ?? getConditionFieldFailoverTitle(expression.field);
		},
		getExpressionFieldTitle(construction: Construction): string
		{
			return this.expressionFields[construction.id]?.title ?? '';
		},
		getExpressionUnresolved(construction: Construction): string | null
		{
			return this.expressionFields[construction.id]?.unresolved ?? null;
		},
		getExpressionValue({ expression: { value, title }, type }: Construction): string
		{
			if (type === CONSTRUCTION_TYPES.OUTPUT)
			{
				return title;
			}

			if (type === CONSTRUCTION_TYPES.FILTER)
			{
				return '';
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
				v-if="!fixedPort"
				class="editor-chart-node-settings-preview__dnd-icon"
				:data-test-id="$testId('complexNodeSettingsPreview', port.id, 'drag')"
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
						:class="['--' + groupedConstructionTypes[construction.type]]"
						:data-if-indent="ifLabel"
					>
						<span class="editor-chart-node-settings-preview__construction_type">
							{{ getMessage(constructionLabels[construction.type]) }}
						</span>
						<!-- The caption is cut by the width of the card, and the source is what the ellipsis eats
						first: the full text stays available on hover, exactly as in the select of the editor. -->
						<span
							class="editor-chart-node-settings-preview__expression-part"
							:title="getExpressionTitle(construction)"
							:data-test-id="$testId('complexNodeSettingsPreview', port.id, construction.id, 'title')"
						>
							{{ getExpressionTitle(construction) }}
						</span>
						<!-- Outside the caption: the ellipsis of the caption would cut the warning away. -->
						<UnresolvedFieldHint
							:unresolved="getExpressionUnresolved(construction)"
							:fieldTitle="getExpressionFieldTitle(construction)"
							:testId="$testId('complexNodeSettingsPreview', port.id, construction.id, 'unresolved')"
						/>
						<span
							v-if="construction.expression.operator"
							class="editor-chart-node-settings-preview__expression-part"
						>
							{{ construction.expression.operator }}
						</span>
						<span
							v-if="groupedConstructionTypes[construction.type] !== groupedConstructionTypes.action"
							class="editor-chart-node-settings-preview__expression-part"
						>
							<ReadableExpressionText
								:value="getExpressionValue(construction)"
								:contextBlocks="connectedBlocks"
							/>
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
				<button
					type="button"
					class="editor-chart-node-settings-preview__edit-btn"
					:data-test-id="$testId('complexNodeSettingsPreview', port.id, 'edit')"
					:aria-label="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_PREVIEW_EDIT_ARIA_LABEL')"
					@click.stop="onPreviewClick"
				>
					<BIcon
						:size="20"
						name="edit-m"
						color="currentColor"
						aria-hidden="true"
					/>
				</button>
				<button
					v-if="!fixedPort"
					type="button"
					class="editor-chart-node-settings-preview__delete-btn"
					:aria-label="getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_PREVIEW_DELETE_ARIA_LABEL')"
					:data-test-id="$testId('complexNodeSettingsPreview', port.id, 'delete')"
					@click.stop="onDeletePreview"
				>
					<BIcon
						class="editor-chart-node-settings-preview__close-icon"
						name="cross-m"
						:size="20"
						color="currentColor"
						aria-hidden="true"
					/>
				</button>
			</div>
		</div>
	`,
};
