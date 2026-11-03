import { Type } from 'main.core';
import { BIcon } from 'ui.icon-set.api.vue';
import { mapState } from 'ui.vue3.pinia';

import { useLoc } from '../../../../shared/composables';
import { isPortRulesAllowedBlockType } from '../../../../shared/constants';
import { type Block } from '../../../../shared/types';
import { NODE_BLOCK_TYPES } from '../../block-registry/types';
// Direct paths, not the barrels of those layers: a barrel re-exports the UI of its layer along with
// the stores, and the neighbour of this row (readable-expression-text) reads the diagram the same way.
import { diagramStore } from '../../../blocks/stores/diagram';
import { isContentBlockPlaceholder } from '../../../blocks/utils/content-block-scope';
import { useCatalogStore } from '../../../catalog/stores/catalog';
import { CONSTRUCTION_TYPES, CONSTRUCTION_LABELS } from '../../constants';
// Direct path, not the barrel of the layer: the barrel has already caught a cycle here.
import { useNodeSettingsStore, resolveRuleCollection } from '../../stores/node-settings-store';
import { type ConstructionLabels, type Construction, type Rule, type TRuleCard } from '../../types';
import {
	evaluateConditionExpressionFieldTitle,
	getConditionFieldFailoverTitle,
	getConditionFieldTitleSignature,
	getConnectedBlocksForConstruction,
	getFilterEntityTitle,
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

/**
 * What the row of an action says about the activity nested in it: the representation the activity
 * declares about itself, and an empty string when it declares none worth showing.
 *
 * The rule asks nothing about the type of the activity - a declaration is drawn whoever made it - and
 * nothing about the substitutions inside the value, which the provider of the declaration has already
 * cleaned. Exported as a function of its own rather than kept in the component: the choice of what the
 * row shows is what the tests of the row are about, while mounting it drags in the whole panel.
 *
 * An empty answer means no element at all rather than an empty one, so a blank declaration - a
 * placeholder of the canvas among them - leaves the row exactly as it is today.
 */
export function getActionContentBlockText(
	construction: Construction,
	contentBlockScope: Object,
	contentBlockProducers: Map<string, Object>,
	contentBlockConsumers: Map<string, Object>,
): string
{
	const activity = construction?.expression?.activityData;
	if (!activity)
	{
		return '';
	}

	if (isContentBlockPlaceholder({ activity }, contentBlockScope, contentBlockProducers, contentBlockConsumers))
	{
		return '';
	}

	// Brought to a string as the other readers of the same key do: the value arrives in the payload,
	// and a number reaching a string method would throw inside the render of the panel.
	return String(activity.ContentBlock?.text ?? '').trim();
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
	setup(): { getMessage: () => string, store: Object }
	{
		const { getMessage } = useLoc();

		// The store itself and not a mapped getter: the verdict over the base settings is asked per
		// construction, and a mapped getter of that shape reads no better here than the store does.
		return { getMessage, store: useNodeSettingsStore() };
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
		// Read here rather than handed over by a place of use: the row has two of them, and a value the
		// other one does not pass would take the resolve of a placeholder down with it.
		...mapState(diagramStore, ['contentBlockScope']),
		...mapState(useCatalogStore, ['contentBlockProducers', 'contentBlockConsumers']),
		// The collection the row takes its item from, resolved by the port through the one reading of it
		// there is (resolveRuleCollection): the settings of a relation for a relation port, the rules of
		// the node for everything else - an input port and the reserved rules container of a node without
		// input ports alike, which the transport keeps inside that very collection. Kept as a computed of
		// its own: the context of a construction is built against the same collection, so both read one
		// source.
		settingsItems(): ?Map<string, Rule>
		{
			return resolveRuleCollection(this.nodeSettings, this.port);
		},
		previewItem(): string
		{
			return this.settingsItems?.get(this.port.id);
		},
		/**
		 * True while the rule holds at least one block. Counted off the cards themselves and not off
		 * Rule.isFilled: that flag is a snapshot taken when the payload is loaded and when a save is
		 * merged back, so a node whose settings have never been saved reads as empty and the row of
		 * a node with base settings would show nothing at all.
		 */
		hasContent(): boolean
		{
			return (this.previewItem?.ruleCards ?? []).some(
				(card: TRuleCard) => (card.constructions ?? []).length > 0,
			);
		},
		/**
		 * A node with base settings is named by them and not by the port it keeps them on: the row
		 * shows "Общие настройки" the way it shows a condition or an action, and the caption of the
		 * input would say nothing next to it.
		 */
		hasBaseSettingsBlock(): boolean
		{
			return this.nodeSettings?.availableBlocks?.[NODE_BLOCK_TYPES.BASE_SETTINGS]?.available === true;
		},
		/**
		 * Whether the row names an input and lists what its rule holds. Only a node whose settings the
		 * row stands for as a whole gives that up for the state of its base settings - there the caption
		 * of the input says nothing next to them. A universal node keeps the caption: its rows are its
		 * inputs, and its base settings are one construction inside one of those rules, listed as any
		 * other construction is.
		 */
		namesInput(): boolean
		{
			return this.managesInputs || !this.hasBaseSettingsBlock;
		},
		/**
		 * True while the node declares base settings that have not been added to the rule yet - and only
		 * where the row stands for the settings of the node. A universal node declares them once and
		 * keeps them in one of its rules, so the rows of its other inputs are not missing anything.
		 */
		isBaseSettingsMissing(): boolean
		{
			if (!this.hasBaseSettingsBlock || this.managesInputs)
			{
				return false;
			}

			return !this.cards.some((card: TRuleCard) => (card.constructions ?? []).some(
				(construction: Construction) => construction.type === CONSTRUCTION_TYPES.BASE_SETTINGS,
			));
		},
		/**
		 * Whether the inputs of the node are a list the user works with: only there is the row of a rule
		 * about an input, everywhere else it is about the settings of the node itself.
		 */
		managesInputs(): boolean
		{
			return isPortRulesAllowedBlockType(this.block?.type);
		},
		/**
		 * What a row with nothing in it says. A node the row stands for as a whole has no settings at
		 * all - it declares no base-settings block, so there is nothing to fill in, and "not filled in"
		 * would promise a form that does not exist. An input of a universal node says the very phrase
		 * the full form says of it.
		 */
		emptyRowText(): string
		{
			return this.managesInputs
				? this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_ROW_NO_RULES')
				: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_PREVIEW_NO_SETTINGS')
			;
		},
		baseSettingsLabel(): string
		{
			return this.getMessage(CONSTRUCTION_LABELS[CONSTRUCTION_TYPES.BASE_SETTINGS]);
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
		// The caption of every action of the port, read once for a row instead of twice: the markup asks
		// for it to decide the element and then to fill it. Keyed by construction, as the sources of a
		// construction below.
		actionValues(): { [string]: string }
		{
			return Object.fromEntries(
				(this.previewItem?.ruleCards ?? [])
					.flatMap((card: TRuleCard) => card.constructions ?? [])
					.filter(({ type }: Construction) => type === CONSTRUCTION_TYPES.ACTION)
					.map((construction: Construction) => [construction.id, this.getActionValue(construction)]),
			);
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
				// The entity the filter selects, not the word "Объект" the label already says. It is read
				// off the committed data of the filter, so nothing is asked of the server for it; a filter
				// with nothing picked yet names nothing and the row says so.
				return getFilterEntityTitle(construction);
			}

			if (type === CONSTRUCTION_TYPES.ACTION)
			{
				if (!expression.actionId)
				{
					return '';
				}

				if (this.nodeSettings?.relationAction?.id === expression.actionId)
				{
					return this.nodeSettings.relationAction.title;
				}

				return this.nodeSettings?.actions?.get(expression.actionId)?.title ?? '';
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
		isBaseSettingsConstruction({ type }: Construction): boolean
		{
			return type === CONSTRUCTION_TYPES.BASE_SETTINGS;
		},
		/**
		 * What the row says about the base settings of the node: whether anything is filled in, and
		 * not what. The values of that form are known to the form alone - it is rendered against the
		 * controls the server hands it, and the short form neither mounts it nor may pay for a request
		 * of its own - so the row answers the one question it can answer from the data.
		 */
		baseSettingsSummary(construction: Construction): string
		{
			// A node with nothing to fill in is neither filled nor unfilled, and the row says so: the
			// phrase answers instead of both.
			if (!this.store.hasBaseSettingsFillableFields(construction, this.block))
			{
				return this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BASE_SETTINGS_PREVIEW_NO_FIELDS');
			}

			return this.isBaseSettingsFilled(construction)
				? this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BASE_SETTINGS_PREVIEW_FILLED')
				: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_EMPTY');
		},
		isBaseSettingsFilled(construction: Construction): boolean
		{
			return this.store.isBaseSettingsFilled(construction, this.block);
		},
		/**
		 * True for a construction that names nothing yet: the label of its type is on the row, and
		 * without this the row would end right after it and read as a glitch rather than as work left
		 * to do.
		 */
		isExpressionEmpty(construction: Construction): boolean
		{
			return !Type.isStringFilled(this.getExpressionTitle(construction))
				&& !Type.isStringFilled(construction.expression?.operator)
				&& !Type.isStringFilled(this.getExpressionValue(construction))
			;
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
		getActionValue(construction: Construction): string
		{
			return getActionContentBlockText(
				construction,
				this.contentBlockScope,
				this.contentBlockProducers,
				this.contentBlockConsumers,
			);
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
			<span
				v-if="namesInput"
				class="editor-chart-node-settings-preview__title"
			>
				<slot />
			</span>
			<!-- Declared but never added: the row still names the block, so the node reads as one with
			base settings left to fill in rather than as one with nothing at all -->
			<div
				v-if="isBaseSettingsMissing"
				class="editor-chart-node-settings-preview__construction --base-settings"
				:data-test-id="$testId('complexNodeSettingsPreview', port.id, 'base-settings')"
			>
				<span class="editor-chart-node-settings-preview__construction_type">
					{{ baseSettingsLabel }}
				</span>
				<span class="editor-chart-node-settings-preview__expression-part --not-selected">
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_RULE_EMPTY') }}
				</span>
			</div>
			<div
				v-else-if="hasContent"
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
						<!-- Base settings name no expression of their own: the row tells whether they are
						filled in at all (baseSettingsSummary) -->
						<span
							v-if="isBaseSettingsConstruction(construction)"
							class="editor-chart-node-settings-preview__expression-part"
							:class="{ '--not-selected': !isBaseSettingsFilled(construction) }"
							:data-test-id="$testId('complexNodeSettingsPreview', port.id, construction.id, 'base-settings')"
						>
							{{ baseSettingsSummary(construction) }}
						</span>
						<span
							v-else-if="isExpressionEmpty(construction)"
							class="editor-chart-node-settings-preview__expression-part --not-selected"
							:data-test-id="$testId('complexNodeSettingsPreview', port.id, construction.id, 'empty')"
						>
							{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_PREVIEW_NOT_SELECTED') }}
						</span>
						<span
							v-else
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
								:contextBlocks="constructionBlocks[construction.id] ?? connectedBlocks"
							/>
						</span>
						<!-- The other half of the row of an action: the caption the nested activity gives itself.
						Plain markup rather than the readable text of an expression - the value of a declaration
						carries no substitutions by the contract of its provider. Cut by the width of the card
						exactly as the caption above, so the tail the ellipsis ate is read in the hint. -->
						<span
							v-else-if="actionValues[construction.id]"
							class="editor-chart-node-settings-preview__expression-part"
							:title="actionValues[construction.id]"
							:data-test-id="$testId('complexNodeSettingsPreview', port.id, construction.id, 'value')"
						>
							{{ actionValues[construction.id] }}
						</span>
					</div>
				</div>
			</div>
			<span
				class="editor-chart-node-settings-preview__construction --empty"
				v-else-if="namesInput"
			>
				{{ emptyRowText }}
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
