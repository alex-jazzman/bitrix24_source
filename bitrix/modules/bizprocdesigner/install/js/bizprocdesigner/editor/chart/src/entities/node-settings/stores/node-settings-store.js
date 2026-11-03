import { defineStore } from 'ui.vue3.pinia';
import { Loc, Runtime, Type } from 'main.core';

import { Feature, FeatureCode } from 'bizprocdesigner.feature';

import { editorAPI } from '../../../shared/api';
import {
	PORT_TYPES,
	PORTLESS_RULE_TYPE,
	COMPLEX_NODE_PORT_LABELS,
	NODE_SETTINGS_TABS,
	isPortRulesAllowedBlockType,
} from '../../../shared/constants';
import { type Block, type PortId, type Port, type PortTypes, type ActivityData } from '../../../shared/types';

import {
	baseSettingsFieldsMemory,
	createUniqueId,
	parsePortTitle,
	deepEqual,
	documentFieldsCache,
	filterMetadataCache,
} from '../../../shared/utils';
import { diagramStore } from '../../blocks';
import { useCatalogStore } from '../../catalog/stores';
import { complexNodeApi, PORTLESS_RULES_KEY } from '../api';
import { CONSTRUCTION_TYPES, CRM_FILTER_BACKING_ACTIVITY_TYPE, FIELD_OBJECT_TYPES } from '../constants';
import { NODE_BLOCK_TYPES, normalizeAvailableBlocks } from '../block-registry';

import {
	type ActionPrefill,
	type CapabilityCatalog,
	type CatalogActionArea,
	type CatalogActionEntry,
	type CatalogActionGroup,
	type CatalogActionObject,
	type Construction,
	type TRuleCard,
	type NodeSettings,
	type OrderPayload,
	type OutputConstruction,
	type Rule,
} from '../types';
// Direct paths, not the barrel of the layer: the barrel reads the store back through the tokens of a
// readable expression, and a store importing it closes a cycle over the whole entity.
import { buildFilterMetadataParams } from '../utils/filter-metadata';
import { generateNextInputPortId } from '../utils/port-ids';
import { settingsFormRequestCache } from '../utils/settings-form-request-cache';
import {
	findConstructionInsertIndex,
	findGroupRuleCardForType,
	findHeadRuleCard,
	findHeadRuleCardInsertIndex,
	isHeadConstructionType,
	sortConstructionsCanonically,
	sortRuleCardConstructionsCanonically,
} from '../utils/rules-surface';
import {
	findEntryByActionId,
	getActionGroups,
	getAreasByGroup,
	getObjectsByArea,
	getSourcesFor,
	isFullyClassifiedCatalog,
	normalizeActionCode,
	resolveActionId,
} from '../utils/action-catalog';
import {
	carriesAuxPortReference,
	getActionAuxPortIdsFromActivity,
	getActionAuxPortIdsFromRules,
	getActionAuxPortsFromRules,
} from '../utils/action-aux-ports';
import { getNextGroupIndex } from '../utils/group-title';

type AutofillSnapshot = {
	values: Object,
	auto: Array<string>,
	autofillMap?: Record<string, string>,
	autofillRequiredFields?: Array<string>,
	autofillConflicts?: Array<Object>,
};

// What a mounted "Create" form knows about its required fields: the codes the backend declared
// required and whether any of them was empty when the form last looked. Tagged with the action it
// describes, so a row that has picked another action since never answers off it.
// What a base-settings form says about itself (see setBaseSettingsFormCheck).
type BaseSettingsFormCheck = {
	hasFillableFields: boolean,
	isFilled: boolean,
};

type RequiredFieldsCheck = {
	actionId: string,
	fields: Array<string>,
	hasEmptyRequired: boolean,
	hasAutofillConflict?: boolean,
	autofillRequiredFields?: Array<string>,
	autofillConflicts?: Array<Object>,
};

// A row of an action that blocked one press of the save button: the construction the row shows, the
// action it names and the rule it belongs to. Several rules of a node are on screen at once, so one
// press can block several rows, and they report here instead of each leading the user to itself (see
// reportRequiredFieldsBlock). The rule is what the panel opens when the row is in a section the
// current mode hides (NodeSettings.revealBlockedRow).
type RequiredFieldsBlock = {
	constructionId: string,
	actionTitle?: string,
	rulePort: RulePort | null,
	hasAutofillConflict?: boolean,
	// Set on a record built from a refusal of the server, absent on a record of the pre-save check of
	// the panel. The one thing it decides is whether the block is announced aloud: the phrase of the
	// announcement speaks of empty required fields, and a refusal of the server reaches the same
	// approach for reasons of another nature (NodeSettings.leadToRequiredFieldsBlock).
	isServerReported?: boolean,
};

// The rules container of a node without input ports as the panel selects it: the same fields it reads
// off a port (id, type, title), with a type of its own (see PORTLESS_RULE).
type PortlessRule = {
	id: PortId,
	type: string,
	title: string,
};

// A rule of a node as the panel and its operations address it: an input port, a relation port or the
// reserved container of a node without input ports.
type RulePort = Port | PortlessRule;

// Where a construction lives, as the consumers of resolveConstructionLocation address it: the
// collection holding it, its rule as a real descriptor, the group card showing it and its place in
// the traversal order of the node.
type ConstructionLocation = {
	collection: Map<PortId, Rule>,
	rulePort: RulePort,
	ruleCardId: string,
	order: number,
};

type NodesSettingsState = {
	isLoading: boolean;
	isShown: boolean;
	shouldShowWithTransition: boolean;
	// The rule the panel shows on its own, or null for the all-rules mode: the panel then shows every
	// rule of the node at once and the operations name the rule they work on themselves.
	currentRule: RulePort | null;
	// Rule the add panel works on while the node is shown in the all-rules mode (see toolbarRulePort).
	selectedRulePortId: PortId | null;
	nodeSettings: NodeSettings | null;
	// References of the node leading nowhere, exactly as the server writes them: a map of a
	// reference to itself (see requestNodeBrokenLinks).
	brokenLinks: { [key: string]: string },
	block: Block | null,
	lastFetchId: number,
	autofillSnapshots: { [constructionId: string]: AutofillSnapshot },
	autofillRequests: { [constructionId: string]: boolean },
	requiredFieldsChecks: { [constructionId: string]: RequiredFieldsCheck },
	baseSettingsFormChecks: { [constructionId: string]: BaseSettingsFormCheck },
	// Rows that blocked the save press being handled right now (see reportRequiredFieldsBlock).
	requiredFieldsBlocks: Array<RequiredFieldsBlock>,
	// Whether the rules tab shows the relations of the node instead of the rules of its inputs. The
	// two are separate surfaces of one tab: a relation is not a rule of an input and never stands in
	// the same list (see isRelationsSurfaceShown).
	isRelationsSurface: boolean,
	// Rules standing open on the rules tab. Seeded with every input port as the node loads
	// (see fetchNodeSettings); a rule the user creates joins it right away (see addRule), and the
	// relations join it when their own surface is entered (see setCurrentRule). Collapsing is what
	// takes a rule out of the list.
	expandedRulePortIds: Array<PortId>,
	// Group cards the user has collapsed - the inverse of the rules above, and deliberately so:
	// expanding an input opens its groups with it, so what has to be remembered is the collapsing.
	// Flat, without a per-rule split: a card id comes from createUniqueId() and is unique in the node.
	collapsedRuleCardIds: Array<string>,
	// Rules the panel has led the user into by address (see expandConstruction).
	revealedRulePortIds: Array<PortId>,
};

type FetchNodeSettingsOptions = {
	withTransition?: boolean;
};

type SyncOutputPorts = {
	outputPortsToAdd: Map<PortId, Object>,
	outputPortsToDelete: Set<PortId>,
};

type SyncAuxPort = {
	portId: PortId,
	title: ?string,
};

type SyncAuxPorts = {
	auxPortsToAdd: Map<PortId, SyncAuxPort>,
	auxPortsToActivate: Set<PortId>,
	auxPortsToDeactivate: Set<PortId>,
};

type PortParams = {
	portId: PortId,
	type: PortTypes,
	label: string,
	portTitle?: string,
};

// The current rule of a node without input ports. Shared and frozen: it names the reserved container
// and carries no state of its own, so every node served by the unified panel selects this very
// descriptor. It never joins this.ports: the container is not a port of the node.
// Exported because the rules section of the basic tab lays that container out as a row of its own
// (getRulesSectionRows): two descriptors of one container would be two sources of truth.
export const PORTLESS_RULE: PortlessRule = Object.freeze({
	id: PORTLESS_RULES_KEY,
	type: PORTLESS_RULE_TYPE,
	title: '',
});

// Whether the rules of the node live in the reserved container: a node the unified panel serves with
// a fixed set of rules, and no other. A node whose rules the user manages by input ports keeps them
// there even when none is left - deleting the last one leaves it without rules, and a container built
// for it would stand for a rule it does not have.
// One answer for the store that creates the container (resolvePortlessRule) and for the rules section
// that lays it out as a row (getRulesSectionRows): a row of a container nobody creates leads nowhere.
export const hasPortlessRulesContainer = (block: ?Block): boolean => {
	return block?.node?.servedByUnifiedPanel === true && !isPortRulesAllowedBlockType(block?.type);
};

// Rules collection a rule port addresses: a relation port reads the relations of the node, and every
// other kind of rule reads its rules - an input port and the reserved container of a node without
// input ports alike, the same collection the transport carries both in.
// The one place a rules collection is resolved, and exported for that reason: every consumer - the
// store itself, the rules layout, the preview row of a rule and the editors of a card - names the rule
// it works on and reads the answer off here, because in the all-rules mode there is no single current
// rule to fall back on.
export const resolveRuleCollection = (nodeSettings: ?NodeSettings, rulePort: ?RulePort): ?Map<PortId, Rule> => {
	if (!nodeSettings)
	{
		return null;
	}

	return rulePort?.type === PORT_TYPES.inputRelation ? nodeSettings.relations : nodeSettings.rules;
};

// The rules of a node in the order their sections stand on screen: the input ports of the node, then
// the reserved container of a node without input ports, then its relation ports - the same source the
// layout builds its sections from (NodeSettingsRulesLayout.rulesSections / relationsSections).
// The order of the keys of a rules collection is not that order and cannot stand in for it:
// addRulePort() inserts a port by the number in its title while the rule is appended to the end of
// the collection, and a loaded payload keys its rules in whatever order the server sent them.
// The container of a node without input ports never joins this.ports (see PORTLESS_RULE), so it is
// named by its own descriptor instead of being looked up among them.
const orderRulePorts = (nodeSettings: ?NodeSettings, ports: ?Array<Port>): Array<RulePort> => {
	const portsOfType = (type: string): Array<Port> => {
		return (ports ?? []).filter((port: Port) => port.type === type);
	};

	return [
		...portsOfType(PORT_TYPES.input),
		...(nodeSettings?.rules?.has(PORTLESS_RULES_KEY) ? [PORTLESS_RULE] : []),
		...portsOfType(PORT_TYPES.inputRelation),
	];
};

// The rule an editing operation works on: the one the caller named by its port, or, when it named
// none, the rule the addressed card belongs to. The card is what makes the rule explicit there - the
// panel shows every rule of the node at once (currentRule === null), so an operation must never fall
// back on whichever rule happens to be selected.
// A card belonging to no rule (already deleted, or built by the caller) resolves to nothing, so the
// operation stays a no-op instead of reaching into another rule.
const resolveOperationRule = (
	nodeSettings: ?NodeSettings,
	rulePort: ?RulePort,
	ownsCard: (ruleCard: TRuleCard) => boolean,
): Rule | null => {
	if (rulePort)
	{
		return resolveRuleCollection(nodeSettings, rulePort)?.get(rulePort.id) ?? null;
	}

	for (const collection of [nodeSettings?.rules, nodeSettings?.relations])
	{
		for (const rule of collection?.values() ?? [])
		{
			if ((rule.ruleCards ?? []).some((ruleCard) => ownsCard(ruleCard)))
			{
				return rule;
			}
		}
	}

	return null;
};

// The NodeSettings a node starts from, before its payload is loaded: structurally the same state, with
// every collection empty. Nothing left from the node shown before it is readable here - that is what
// the emptiness says - and a reader of a collection gets an empty one instead of a missing member.
// "Loaded" is answered by the committed block alone (see isCurrentBlock and
// BlockMediator.areSettingsLoadedForBlock), never by the presence of a member.
const createEmptyNodeSettings = (block: Block) => {
	return {
		title: '',
		description: '',
		actions: new Map(),
		relationAction: null,
		rules: new Map(),
		relations: new Map(),
		blockId: block.id,
		filterSupported: false,
		availableBlocks: {},
	};
};

// A saved condition addressing the document the node publishes. Its title is the one reader taking the
// fields off the cache without fetching them itself (evaluateConditionExpressionFieldTitle), so such a
// payload is the only one worth a warm-up. A construction carrying a field is a condition by
// construction: an action, a filter and base settings hold activity data instead.
const hasDocumentConditionExpression = (loaded: Object): boolean => {
	const items = [...Object.values(loaded?.rules ?? {}), ...Object.values(loaded?.relations ?? {})];

	return items.some((item: Object) => (item?.ruleCards ?? []).some(
		(ruleCard: TRuleCard) => (ruleCard?.constructions ?? []).some(
			(construction: Construction) => construction?.expression?.field?.object === FIELD_OBJECT_TYPES.DOCUMENT,
		),
	));
};

// The document a node publishes is known from the response only (fixedDocumentType), so its fields can
// only be warmed after the load — and only for a payload with a saved document condition: the other
// reader, the document source of the condition field selector, waits for the cache itself when it opens,
// so a panel without such a condition spends no request on fields nothing would read.
// The warm-up is started and not awaited: the panel would otherwise pay a second round trip in a row for
// a node whose own document type differs from the workflow one (a trigger reacting to another document),
// and the cache is a reactive source, so the previews fill their field names in as soon as it lands.
// A document type already fetched costs nothing: the cache is shared by the whole editor.
const withWarmDocumentFields = async (loading: Promise<Object>): Promise<Object> => {
	const loaded = await loading;
	if (
		Type.isArrayFilled(loaded?.fixedDocumentType)
		&& hasDocumentConditionExpression(loaded)
	)
	{
		void documentFieldsCache.fetchFields(loaded.fixedDocumentType);
	}

	return loaded;
};

// Metadata of the filter is a server request of its own that used to start when the filter was
// drawn, so the wait landed on a click. Not awaited: the filter editor joins this very request
// through the cache instead of starting a second one.
const withWarmFilterMetadata = async (
	loading: Promise<Object>,
	workflowDocumentType: Array<string>,
	contextActivityType: ?string,
): Promise<Object> => {
	const loaded = await loading;
	if (loaded?.filterSupported)
	{
		const params = buildFilterMetadataParams(
			workflowDocumentType,
			loaded.fixedDocumentType,
			contextActivityType,
		);
		// A document with no filter-result resolver has no metadata to ask for.
		if (params.activityType)
		{
			void filterMetadataCache.load(params);
		}
	}

	return loaded;
};

// The references of a node leading nowhere, counted by the server against the host activity of the
// node - the whole activity, the rules property included, because the rules of a complex node are
// written in it.
//
// Straight to the transport, past settingsControlsMemory and settingsFormRequestCache. The memory is
// out on both sides: an early return of the controller answers a rememberable `controls: null`, and
// the memory key of a node with host-merged settings is that very same activity type, so an empty
// answer remembered here would silence the base-settings form of the same node. Nothing of the legacy
// dialog is published on `window` either: `window.rootActivity` is defined in one place of the whole
// frontend, and the nested forms of this panel read the memory by its presence.
//
// The list is counted only for a named activity found inside the template it was given, and a miss
// answers an empty list indistinguishable from "nothing is broken" - so the host itself joins the
// widest possible slice: the node and all of its ancestors, over every input port, the relation port
// included. The parameters of the template are read defensively: this request starts earlier than the
// form the slice is copied from, and an empty diagram store would hand `JSON.stringify` an undefined.
const requestNodeBrokenLinks = async (block: Block): Promise<{ [key: string]: string }> => {
	const diagram = diagramStore();
	const compatibleTemplate = [{
		Type: 'NodeWorkflowActivity',
		Name: 'Template',
		Children: [
			block.activity,
			...diagram.getAllBlockAncestors(block, null).map(({ block: ancestor }) => ancestor.activity),
		],
	}];

	const settingsControls = await editorAPI.getNodeSettingsControls({
		documentType: diagram.documentType,
		activity: block.activity,
		workflow: {
			workflowParameters: JSON.stringify(diagram.template?.PARAMETERS ?? {}),
			workflowVariables: JSON.stringify(diagram.template?.VARIABLES ?? {}),
			workflowTemplate: JSON.stringify(compatibleTemplate),
			workflowConstants: JSON.stringify(diagram.template?.CONSTANTS ?? {}),
		},
		options: {
			templateId: diagram.templateId,
			draftId: diagram.draftId,
		},
	});

	// The controls of the response describe a form nobody here builds: only the list is read.
	return settingsControls?.brokenLinks ?? {};
};

// A loaded rule or relation as the form holds it. The construction order of the payload is kept
// as is: the canonical order is applied later, after the saved-state snapshot.
const toLoadedSettingsItem = (item: Object): Object => {
	const ruleCards = (item.ruleCards ?? []).map((ruleCard: TRuleCard) => ({
		...ruleCard,
		constructions: ruleCard.constructions ?? [],
	}));

	return {
		...item,
		ruleCards,
		isFilled: ruleCards.some((ruleCard: TRuleCard) => ruleCard.constructions.length > 0),
	};
};

// First base-settings construction of the given rule collections together with the port that holds
// it, or null. Scans the whole node regardless of the active port, so the lookup behaves the same
// from an input and a relation port — and therefore the construction found does not necessarily
// belong to the current port, which is why its owner comes back with it. The owner is the collection
// key: rules and relations are keyed by port id both when loaded and when added.
const findBaseSettingsConstruction = (
	collections: Array<?Map<PortId, Rule>>,
): { construction: Construction, portId: PortId } | null => {
	for (const collection of collections)
	{
		if (!collection)
		{
			continue;
		}

		for (const [portId, rule] of collection.entries())
		{
			for (const ruleCard of rule.ruleCards)
			{
				const construction = ruleCard.constructions.find(
					(item: Construction) => item.type === CONSTRUCTION_TYPES.BASE_SETTINGS,
				);
				if (construction)
				{
					return { construction, portId };
				}
			}
		}
	}

	return null;
};

// A normalization of the base settings belongs to one exact form state: the same construction and
// the very rawActivityData object the form committed. Every commit writes a fresh object
// (extractFormData), so an edited form never reads the normalization of the previous one.
const matchesBaseSettingsState = (entry: ?Object, state: Object): boolean => {
	return Boolean(entry)
		&& entry.constructionId === state.constructionId
		&& entry.rawActivityData === state.rawActivityData;
};

// Host metadata SaveCommandHandler injects into the Properties of every activity, base settings
// included: it describes the host node and not its settings, so an action pre-filled from those
// settings must not inherit it. The server strips the same keys on its own side
// (BaseSettingsPayload::HOST_METADATA_PROPERTIES); Title is then written from the action
// dictionary (see buildDefaultActionExpression).
const BASE_SETTINGS_EXCLUDED_PROPERTIES = Object.freeze(['Title', 'EditorComment']);

// Properties that belong to the unified panel and not to the settings form of the node it serves: the
// panel keeps its own bookkeeping among the properties of that very activity and re-writes it after every
// save (ConvertRuleCommand::execute), so a node saved through the panel carries all of them. None is a
// state of the form: the form neither shows them nor may be built against them as the context of its
// property map, and a state holding nothing but these is a state with nothing to inherit.
// The list mirrors the whole server-side set (UnifiedPanelDescriptorProvider::getServicePropertyNames()),
// which a client cannot ask for here, the NotFilled mark included: it is the verdict of the panel over its
// own cards, written by the very save that left one unfinished (Complex::markActivityFilled), so a node
// whose cards were never finished carries the mark and nothing of the form - and a form seeded from it
// would be taken for a saved one, losing the defaults of its property map.
const NODE_SERVICE_PROPERTIES = Object.freeze([
	'Rules',
	'NodeCondition',
	'FilterSettings',
	'FilterReturnPropertiesMap',
	'RelationReturnPropertiesMap',
	'Links',
	'InputNames',
	'OutputNames',
	'Relations',
	'NotFilled',
]);

// Cap on the whole wait of an action prefill: the normalization of the base settings and the
// capability catalog together (see resolveActionPrefill). Without it a request that never answers
// keeps the add surface and the save button of the panel disabled until the node is reopened.
const ACTION_PREFILL_TIMEOUT = 10000;

// What the timeout branch of that wait resolves to. The other branch always resolves to an array,
// so a prefill that ran out of time is never mistaken for one that landed.
const ACTION_PREFILL_TIMED_OUT = Symbol('actionPrefillTimedOut');

// Cascade classification of a catalog entry: the area, and the object within it, in the very shape
// the action editor writes on a manual pick. Only an unambiguous entry states the classification of
// the action itself, so a single area (and a single object of that area) is taken and anything else
// stays null: the pair is cross-checked against this same entry on save
// (ValidateSingleRuleCommand::validateActionAreaObject), which allows a missing one.
const findActionClassification = (entry: ?CatalogActionEntry): { area: ?string, object: ?string } => {
	const areas = entry?.areas ?? [];
	const area = areas.length === 1 ? (areas[0]?.id ?? null) : null;
	if (!Type.isStringFilled(area))
	{
		return { area: null, object: null };
	}

	const objects = (entry.objects ?? []).filter((object) => object?.area === area);
	const object = objects.length === 1 ? (objects[0]?.id ?? null) : null;

	return { area, object: Type.isStringFilled(object) ? object : null };
};

// The part of the properties of a host-merged activity that is really inherited: the host metadata
// stays behind (BASE_SETTINGS_EXCLUDED_PROPERTIES), so a state holding nothing else means there is
// nothing to inherit. One helper for every reader of that rule — the decision to inherit
// (resolveActionPrefill) and the expression built from it (buildDefaultActionExpression).
// The copy is shallow: a nested value is still the one the state of the node holds, so a caller reads
// it and hands it no further without a copy of its own (see toPropertyMapContext).
const toInheritedProperties = (baseProperties: ?Object): Object => {
	const properties = { ...baseProperties };
	BASE_SETTINGS_EXCLUDED_PROPERTIES.forEach((key: string) => {
		delete properties[key];
	});

	return properties;
};

/**
 * The properties the form of a host-merged base settings is built against: the saved state of the host
 * node, brought to what the form of that node owns (EditBaseSettings.buildFallbackActivity).
 *
 * Two independent rules meet here, and the read side deliberately starts from the save-side one: metadata
 * the base settings may not write on the host is no state of its form either. They part as soon as the
 * save side excludes a key for a reason of its own — that it must not be written back — while the property
 * map needs that key as its context: such a key is then kept here instead of following the save side.
 *
 * The copy is deep because the result leaves the store for good: it is serialized into the property-map
 * request and handed to the renderers of the form, so no nested value of it is the one the state holds.
 */
export const toPropertyMapContext = (baseProperties: ?Object): Object => {
	const properties = toInheritedProperties(baseProperties);
	NODE_SERVICE_PROPERTIES.forEach((key: string) => {
		delete properties[key];
	});

	return Runtime.clone(properties);
};

// Keys the extractor of the base-settings form adds to every snapshot of its own accord: they name
// the node and the form, not anything the user filled in (see EditBaseSettings.extractFormData).
// A snapshot holding nothing besides them is the snapshot of an untouched form - and one is left
// behind by every base-settings form the panel unmounts, a tab switch included.
const BASE_SETTINGS_FORM_SERVICE_KEYS = Object.freeze(['activityType', 'documentType', 'id', 'activity_id']);

// Whether a value of a form snapshot or of an activity property map says anything. An empty string,
// an empty list and a map of empty values are what an untouched control leaves behind, so a filled
// value has to be looked for down the nesting and not counted by the presence of the key.
const hasFilledValue = (value: mixed): boolean => {
	if (Type.isArray(value))
	{
		return value.some(hasFilledValue);
	}

	if (Type.isPlainObject(value))
	{
		return Object.values(value).some(hasFilledValue);
	}

	if (Type.isString(value))
	{
		return value.trim() !== '';
	}

	return value !== null && value !== undefined && value !== false;
};

/**
 * Whether anything in a property map or in a form snapshot was filled in by a person. Three kinds of
 * value are not that, and none of them can be told by its own contents:
 *
 * - service keys of the panel and of the form extractor - the bookkeeping of the panel, the id of the
 *   activity, the type of the document (NODE_SERVICE_PROPERTIES, BASE_SETTINGS_FORM_SERVICE_KEYS);
 * - properties the node carries out of the palette, while they still hold the very value the palette
 *   gave them: they say which node this is (the class of a trigger, the entity of an event), and a
 *   node has them from the moment it is dropped. Changed by hand, they count as filled again;
 * - a value that is simply empty.
 *
 * What is left uncovered here is a hidden field of the form holding a default of its own
 * (`message_type` of a notification): it is a value of the form and not of the node, and only the
 * form knows it is hidden. That is what the verdict of the form itself answers
 * (baseSettingsFormChecks); this reading is the fallback for a form that has never been built.
 */
const hasFilledProperty = (
	source: ?Object,
	serviceKeys: $ReadOnlyArray<string>,
	paletteProperties: ?Object = null,
): boolean => {
	return Object.entries(toInheritedProperties(source)).some(([key, value]: [string, mixed]) => {
		if (serviceKeys.includes(key) || NODE_SERVICE_PROPERTIES.includes(key))
		{
			return false;
		}

		if (paletteProperties && key in paletteProperties && deepEqual(paletteProperties[key], value))
		{
			return false;
		}

		return hasFilledValue(value);
	});
};

/**
 * Activity whose property map the base-settings form of a construction renders: the node-action it is
 * bound to, the type its own state carries, or the node itself. One chain for the form that asks the
 * server for those controls (EditBaseSettings.resolveBackingActivityType) and for every reader that
 * has to name the same activity - the page-level memory of the fields is keyed by it.
 */
export const resolveBaseSettingsBackingType = (
	construction: ?Construction,
	block: ?Block,
): string | null => {
	const expression = construction?.expression ?? null;

	return expression?.actionId ?? expression?.activityData?.Type ?? block?.activity?.Type ?? null;
};

/**
 * True while a base-settings block carries a state of its own: a form state already committed in this
 * session, the properties of the action it is bound to, or - a host-merged one - the properties of the
 * host node itself, brought to what the form of that node owns (see toPropertyMapContext).
 *
 * Read by the short form of the panel, which never mounts that form: it therefore knows neither the
 * names of its fields nor what their values read as, and can only answer whether anything was filled
 * in at all. That answer is given by the values and never by the keys: a form leaves a snapshot of
 * all its fields behind whether they were filled in or not, so counting keys called every node with
 * a base-settings form filled as soon as the panel had shown that form once.
 */
const hasBaseSettingsState = (construction: ?Construction, block: ?Block): boolean => {
	const expression = construction?.expression ?? null;
	if (!expression)
	{
		return false;
	}

	const paletteProperties = useCatalogStore().getCatalogProperties(block?.activity);

	if (hasFilledProperty(expression.rawActivityData, BASE_SETTINGS_FORM_SERVICE_KEYS, paletteProperties))
	{
		return true;
	}

	// The very source the form of the base settings reads and the save writes back from: the state of
	// the block lives in its own activityData whenever it has one, whether it is bound to a node-action
	// or merged into the host (EditBaseSettings.loadForm, ConvertRuleCommand::mergeBaseSettingsProperties).
	// Only a construction without one falls back to the properties of the host node, and only while it
	// is host-merged - that is the fallback the form builds for itself (buildFallbackActivity).
	const properties = expression.activityData?.Properties
		?? (Type.isStringFilled(expression.actionId) ? null : block?.activity?.Properties)
	;

	return hasFilledProperty(properties, NODE_SERVICE_PROPERTIES, paletteProperties);
};

export const useNodeSettingsStore = defineStore('bizprocdesigner-editor-node-settings', {
	state: (): NodesSettingsState => ({
		isLoading: false,
		isSaving: false,
		isShown: false,
		shouldShowWithTransition: false,
		currentRule: null,
		selectedRulePortId: null,
		prevSavedNodeSettings: null,
		ports: null,
		nodeSettings: null,
		// references of the node the server reported as leading nowhere, as its map of a reference to
		// itself. Filled by a request of its own that the panel never waits for, so it stays empty
		// while the panel is already open (see requestNodeBrokenLinks).
		brokenLinks: {},
		block: null,
		lastFetchId: 0,
		selectedTabId: NODE_SETTINGS_TABS.basic,
		// Full action catalog (areas/objects/sources). Lazily loaded on first open of the action
		// editor and on the first action added to a node with base settings; kept separate from the
		// flat loadSettings actions.
		capabilityCatalog: null,
		capabilityCatalogType: null,
		// the catalog request in flight, tagged with the activity type it was started for:
		// concurrent callers share it instead of each paying for a round trip of its own.
		// { id, activityType, promise }
		capabilityCatalogRequest: null,
		// session-only snapshots of "Create" action forms, keyed by construction.id.
		// Never serialized to the server; cleared when the node settings are reset.
		autofillSnapshots: {},
		// one-shot autofill requests raised by an explicit "Create" selection, keyed by
		// construction.id. Consumed once the form is mounted; a plain node open never sets one.
		autofillRequests: {},
		// required-fields state of the "Create" forms of the node, keyed by construction.id and written
		// by the form itself. The form is hidden while its row is collapsed, and never built at all in a
		// rule the user has not reached, so this is what the row answers the pre-save check with
		// (EditActionExpression.onBeforeSubmit).
		requiredFieldsChecks: {},
		// what the base-settings form of a construction says about itself - whether it has any field to
		// fill in, and whether anything in it is filled - keyed by construction.id and written by that
		// form: only it knows which of its fields are shown and which are hidden carriers of defaults.
		// Kept after the form leaves the screen, so the row of the short form keeps the answer for as
		// long as the node is open (see isBaseSettingsFilled).
		baseSettingsFormChecks: {},
		// rows that blocked the save press being handled, in the order they answered. Lives for one
		// press: the panel opens it, the rows report into it and the panel then leads to the first of
		// them (see reportRequiredFieldsBlock).
		requiredFieldsBlocks: [],
		// last normalization of the node's base settings and the request currently producing one,
		// both tagged with the form state they describe (see matchesBaseSettingsState).
		// { constructionId, rawActivityData, properties } / { constructionId, rawActivityData, promise }
		baseSettingsProperties: null,
		baseSettingsPropertiesRequest: null,
		// action additions currently resolving their prefill (see resolveActionPrefill), keyed by
		// request id and holding the node generation (lastFetchId) they were started in.
		// Records and not a counter: the toolbar and the cards are separate controls, so two presses
		// of the same tick may both be in flight and each has to release its own record, and the
		// generation is what keeps a wait tied to its node — closing the panel or switching the node
		// advances it and the records left behind stop counting at once.
		actionPrefillRequests: {},
		// synchronous flush of the mounted base-settings form, registered by the form itself
		// (see registerBaseSettingsFormFlush). Null while no such form is on screen.
		baseSettingsFormFlush: null,
		// the rules tab shows the relations of the node, not the rules of its inputs (see setCurrentRule)
		isRelationsSurface: false,
		// expanded rules of the rules tab. Filled with every input port when the node loads: an input
		// opens expanded and the user collapses it by hand (see fetchNodeSettings)
		expandedRulePortIds: [],
		// groups are open inside an expanded input, so this holds the ones collapsed by hand
		collapsedRuleCardIds: [],
		// rules the panel has led the user into by address (see expandConstruction): expanding such a
		// rule is not enough, the forms of its blocks have to be mounted for the row to exist at all
		revealedRulePortIds: [],
	}),
	getters:
	{
		/**
		 * Whether the base settings of a construction hold anything a person filled in - the question the
		 * row of the short form asks, and the one it can never answer for itself: it neither mounts that
		 * form nor may pay for a request of its own.
		 *
		 * The form answers it while it is on screen and its answer outlives it for as long as the node is
		 * open. Before any form of this construction has been built - and for a form the server hands no
		 * described controls for - the answer is read off the data, where the identity of the node and the
		 * bookkeeping of the panel are told apart from the values of a person (hasBaseSettingsState).
		 */
		isBaseSettingsFilled: (state: NodesSettingsState) => (
			construction: ?Construction,
			block: ?Block,
		): boolean => {
			const reported = state.baseSettingsFormChecks[construction?.id]?.isFilled;

			return Type.isBoolean(reported) ? reported : hasBaseSettingsState(construction, block);
		},
		/**
		 * Document type the base settings of the node are read against: the one the node fixes, or the
		 * one of the template. The very choice the form makes (EditBaseSettings.propertiesDialogDocumentType),
		 * so a reader keys the remembered fields of an activity the way the form wrote them.
		 */
		baseSettingsDocumentType: (state: NodesSettingsState): Array<string> => {
			const fixed = state.nodeSettings?.fixedDocumentType;

			return Array.isArray(fixed) && fixed.length === 3 ? fixed : (diagramStore().documentType ?? []);
		},
		/**
		 * Whether the base settings of a construction have anything to fill in. A node the unified panel
		 * serves may carry nothing but service properties - a manual-start trigger has no field of its
		 * own - and then both forms say so instead of showing an empty one.
		 *
		 * Answered by the form while it is on screen; then by what this node answered as it loaded, and
		 * only after that by what a form of the same activity type reported earlier on this page - an
		 * approximation of the answer of this node, since the property map of an activity is built against
		 * its own properties as the context (baseSettingsFieldsMemory tells the two apart). Unknown counts
		 * as "has fields": that is what every node looked like before the question was asked at all.
		 */
		hasBaseSettingsFillableFields(state: NodesSettingsState): (?Construction, ?Block) => boolean {
			return (construction: ?Construction, block: ?Block): boolean => {
				const reported = state.baseSettingsFormChecks[construction?.id]?.hasFillableFields;
				if (Type.isBoolean(reported))
				{
					return reported;
				}

				const remembered = baseSettingsFieldsMemory.get(
					resolveBaseSettingsBackingType(construction, block),
					this.baseSettingsDocumentType,
					block?.id ?? null,
				);

				return Type.isBoolean(remembered) ? remembered : true;
			};
		},
		/**
		 * Rule the add panel works on, and the one every operation left without an explicit rule port
		 * falls back to (ALG-02).
		 * The panel showing a single rule has no choice to make - that rule is the target. In the
		 * all-rules mode the target is the rule whose card header the user picked last, and the last
		 * created input port until they pick one: a node opened in that mode still has one rule the
		 * toolbar adds to, and the newest one is the one just built by the user.
		 * The pick is re-checked against the ports of the node on every read, so deleting the target
		 * rule moves the target to the last of the remaining ones instead of leaving it dangling.
		 */
		toolbarRulePort(): RulePort | null
		{
			if (this.currentRule)
			{
				return this.currentRule;
			}

			// The surface the tab really shows decides what the toolbar may add to, and the raw flag does
			// not: the last relation deleted takes the surface back to the rules of the inputs
			// (see isRelationsSurfaceShown). A relation is not a rule of an input, so neither the pick of
			// the user nor the fallback crosses from one list to the other - a pick made on the surface
			// left behind is dropped instead of pointing the add panel at a rule nobody sees.
			const targetType = this.isRelationsSurfaceShown ? PORT_TYPES.inputRelation : PORT_TYPES.input;
			const targetPorts = (this.ports ?? []).filter((port: Port) => port.type === targetType);
			const selectedPort = this.selectedRulePortId === null
				? null
				: targetPorts.find((port: Port) => port.id === this.selectedRulePortId) ?? null
			;

			return selectedPort ?? targetPorts[targetPorts.length - 1] ?? null;
		},
		inputPorts: (state: NodesSettingsState): Array<Port> => {
			return state.ports.filter((port) => port.type === PORT_TYPES.input
				|| port.type === PORT_TYPES.inputRelation);
		},
		/** Relation ports of the node, in the order the panel lists them. */
		relationPorts: (state: NodesSettingsState): Array<Port> => {
			return (state.ports ?? []).filter((port) => port.type === PORT_TYPES.inputRelation);
		},
		/**
		 * True while the rules tab lays out the relations of the node. The last relation deleted takes
		 * the surface with it: there is nothing to lay out, and the tab goes back to the rules of the
		 * inputs instead of showing an empty list of relations.
		 */
		isRelationsSurfaceShown(): boolean {
			return this.isRelationsSurface && this.relationPorts.length > 0;
		},
		/**
		 * Returns the map of available blocks from the node descriptor.
		 * Returns an empty object when nodeSettings is absent.
		 */
		availableBlockTypes: (state: NodesSettingsState): Object => {
			return state.nodeSettings?.availableBlocks ?? {};
		},
		/**
		 * Checks block availability by type.
		 * Read-only: the getter does not call the store.
		 */
		isBlockAvailable(): (type: string) => boolean
		{
			return (type: string): boolean => {
				const blocks = this.availableBlockTypes;

				return blocks[type]?.available === true;
			};
		},
		relationsMaxItems(): ?number
		{
			const maxItems = this.availableBlockTypes[NODE_BLOCK_TYPES.RELATIONS]
				?.constraints?.maxItems
			;

			return Number.isInteger(maxItems) && maxItems > 0 ? maxItems : null;
		},
		relationRuleCardsCount: (state: NodesSettingsState): number => {
			const relations = state.nodeSettings?.relations;
			if (!relations)
			{
				return 0;
			}

			return [...relations.values()].reduce((count, relation) => {
				return count + Math.max(1, Array.isArray(relation?.ruleCards) ? relation.ruleCards.length : 0);
			}, 0);
		},
		canAddRelation(): boolean
		{
			return this.relationsMaxItems === null
				|| this.relationRuleCardsCount < this.relationsMaxItems
			;
		},
		/**
		 * The base-settings construction of the node (input-port rules and relation rules alike)
		 * together with the id of the port that holds it, or null when the node has none.
		 * The port is what the normalization payload of those settings describes: the construction may
		 * belong to another port than the active one (a node with several input ports).
		 */
		baseSettingsLocation(): { construction: Construction, portId: PortId } | null
		{
			if (!this.nodeSettings)
			{
				return null;
			}

			return findBaseSettingsConstruction([this.nodeSettings.rules, this.nodeSettings.relations]);
		},
		/**
		 * The base-settings construction of the node, or null when it has none.
		 * Source of the values a new action inherits.
		 */
		baseSettingsConstruction(): Construction | null
		{
			return this.baseSettingsLocation?.construction ?? null;
		},
		/**
		 * Returns true when a base-settings construction exists anywhere in the node —
		 * scanning both input-port rules and relation rules.
		 * Covers the full state regardless of the surface the tab shows,
		 * so the uniqueness guard works while the relations are the ones on screen.
		 * Used by add-construction to hide/show the re-add pane.
		 */
		hasBaseSettings(): boolean
		{
			return this.baseSettingsConstruction !== null;
		},
		/**
		 * Action dictionary key of the node's preset base-settings action (Properties.BaseSettingsAction),
		 * or null when the node declares none or the preset is outside the dictionary.
		 * The preset is a plain string while the dictionary is keyed by the raw activity class and read
		 * case-sensitively, so the match goes through the normalized code, and the key, not the preset,
		 * is what the save pipeline and the previews expect.
		 */
		baseSettingsActionId(): string | null
		{
			const presetAction = this.block?.activity?.Properties?.BaseSettingsAction ?? null;
			if (!Type.isStringFilled(presetAction))
			{
				return null;
			}

			const normalizedPreset = normalizeActionCode(presetAction);
			const actionKeys = this.nodeSettings?.actions ? [...this.nodeSettings.actions.keys()] : [];

			return actionKeys.find((key) => normalizeActionCode(key) === normalizedPreset) ?? null;
		},
		/**
		 * True when a newly added action may inherit the node's base settings: the target port of the
		 * add panel is an input one (a relation port keeps its own binding, see addConstruction), the
		 * block is available, the construction exists and its action is part of the node's action
		 * catalog (an action outside it fails the server-side catalog membership check and marks the
		 * node as not filled). The port belongs to the condition: without it a relation port would
		 * resolve, and pay for, a normalization whose result it then drops.
		 */
		canInheritBaseSettings(): boolean
		{
			return this.toolbarRulePort?.type === PORT_TYPES.input
				&& this.isBlockAvailable(NODE_BLOCK_TYPES.BASE_SETTINGS)
				&& this.baseSettingsConstruction !== null
				&& this.baseSettingsActionId !== null;
		},
		/**
		 * True while an action being added is resolving its prefill — the normalization of the base
		 * settings and the capability catalog alike: the add control of the action waits for it
		 * instead of starting a second identical insertion, and the save button waits for it too,
		 * because saving now would close the panel and drop the pending insertion on its context check.
		 * Raised by that path only (resolveActionPrefill): a catalog the action form loads for itself
		 * in the background dims nothing, and every other construction is added synchronously.
		 * Only a wait of the current node counts: one left behind by a closed panel or a node switched
		 * away from describes an insertion that is already rejected, so it must not disable anything.
		 */
		isResolvingActionPrefill: (state: NodesSettingsState): boolean => {
			return Object.values(state.actionPrefillRequests).includes(state.lastFetchId);
		},
		/** Action entries of the loaded capability catalog (empty when absent). */
		catalogActionEntries: (state: NodesSettingsState): Array<CatalogActionEntry> => {
			return state.capabilityCatalog?.actions ?? [];
		},
		/** True when the whole catalog is classified, so the intent-first cascade applies. */
		isActionCatalogFullyClassified(): boolean
		{
			return isFullyClassifiedCatalog(this.catalogActionEntries);
		},
		/** Universal actions (intents) offered by the catalog, in enum order. */
		actionGroupOptions(): Array<CatalogActionGroup>
		{
			return getActionGroups(this.catalogActionEntries);
		},
		/** Catalog entry for an actionId (raw flat key or normalized), or null. */
		catalogEntryByActionId(): (actionId: ?string) => CatalogActionEntry | null
		{
			return (actionId: ?string): CatalogActionEntry | null => {
				return findEntryByActionId(this.catalogActionEntries, actionId);
			};
		},
		/** Distinct areas offered by a group's classified actions. */
		actionAreasByGroup(): (group: ?string) => Array<CatalogActionArea>
		{
			return (group: ?string): Array<CatalogActionArea> => {
				return getAreasByGroup(this.catalogActionEntries, group);
			};
		},
		/** Distinct objects of a group within an area. */
		actionObjectsByArea(): (group: ?string, areaId: ?string) => Array<CatalogActionObject>
		{
			return (group: ?string, areaId: ?string): Array<CatalogActionObject> => {
				return getObjectsByArea(this.catalogActionEntries, group, areaId);
			};
		},
		/** Supported sources for a (group, area[, object]) selection, or null. */
		actionSourcesByObject(): (group: ?string, areaId: ?string, objectId: ?string) => Array<string> | null
		{
			return (group: ?string, areaId: ?string, objectId: ?string = null): Array<string> | null => {
				return getSourcesFor(this.catalogActionEntries, group, areaId, objectId);
			};
		},
		/** Resolves a (group, area[, object]) selection to a persistable actionId. */
		resolveCatalogActionId(): (group: ?string, areaId: ?string, objectId: ?string) => string | null
		{
			return (group: ?string, areaId: ?string, objectId: ?string = null): string | null => {
				const actionKeys = [...(this.nodeSettings?.actions?.keys() ?? [])];

				return resolveActionId(this.catalogActionEntries, actionKeys, group, areaId, objectId);
			};
		},
		/**
		 * Single frontend feature gate for relation autofill (consumer side): the feature is
		 * subordinate to node connections, so this tracks complexNodeConnections only — there is no
		 * separate autofill rollout code. It decides that relation sources are collected and sent with
		 * loadSettings. Actual activation is content-driven: the backend gates the returned autofillMap
		 * behind complexNodeConnections plus CreateWorkflow rights, so an empty map is a no-op by itself.
		 */
		isRelationAutofillEnabled(): boolean
		{
			return Feature.instance().isAvailable(FeatureCode.complexNodeConnections);
		},
	},
	actions:
	{
		async fetchNodeSettings(
			block: Block,
			defaultTitlePromise: Promise<string> = Promise.resolve(''),
			options: FetchNodeSettingsOptions = {},
		): Promise<void>
		{
			const fetchId = ++this.lastFetchId;
			// Set before the load, because the panel plays the transition the moment isLoading drops
			// and the content becomes visible. The flag describes this one show: the panel drops it as
			// soon as the fade has played (finishShowTransition), and a show that passes no options
			// turns it off anyway.
			this.shouldShowWithTransition = options.withTransition === true;
			this.nodeSettings = createEmptyNodeSettings(block);
			// The snapshot left from the previously opened node does not describe this form:
			// drop it so "snapshot exists" always means "the form relates to it".
			this.prevSavedNodeSettings = null;
			// The rule picked in the previously opened node names nothing here either: the ports are
			// local to a node, so the same id would silently point the add panel at another rule.
			this.selectedRulePortId = null;
			// the base settings of the previously opened node describe nothing here either
			this.resetBaseSettingsProperties();
			// The required fields of the forms of the previous node say nothing about this one: a record
			// left behind must never answer the pre-save check of a row shown here, and a row of that
			// node must never be the one a press here leads to.
			this.requiredFieldsChecks = {};
			this.baseSettingsFormChecks = {};
			this.requiredFieldsBlocks = [];
			// A rule of the previous node the panel led the user into is not a rule of this one: the
			// ports are local to a node, so the same id would mount the forms of an unrelated rule.
			this.revealedRulePortIds = [];
			// The references of the previous node point at places inside that node: this one starts
			// from an empty list, until its own answer lands.
			this.brokenLinks = {};
			// The forms of the previous node ask other questions than the ones of this one, and a request
			// of its own may still be in flight: the remembered answers go with the node they describe.
			settingsFormRequestCache.reset();
			// Neither does its filter metadata. A direct switch between two complex nodes replaces the
			// panel state without going through reset(), so the load is what bounds the cache.
			filterMetadataCache.clear();
			this.isLoading = true;
			// Deliberately outside the Promise.all below: the panel opens without the list and shows the
			// warning once it lands. A floating promise needs a catch of its own - a list that did not
			// arrive leaves the panel as it is and reaches the user in no other way.
			requestNodeBrokenLinks(block)
				.then((brokenLinks) => {
					if (this.lastFetchId === fetchId)
					{
						this.brokenLinks = brokenLinks;
					}
				})
				.catch(() => {})
			;
			const workflowDocumentType = diagramStore().documentType;
			const [loaded, defaultTitle] = await Promise.all([
				withWarmFilterMetadata(
					withWarmDocumentFields(complexNodeApi.loadSettings(block.activity, [], workflowDocumentType)),
					workflowDocumentType,
					block.activity.Type,
				),
				defaultTitlePromise,
				// warm document fields cache so condition previews resolve field names synchronously.
				// Awaited unlike the warm-up of the node's own type: this one runs next to the load and
				// costs no round trip of its own, so the common case renders its names right away.
				Type.isArrayFilled(workflowDocumentType)
					? documentFieldsCache.fetchFields(workflowDocumentType)
					: Promise.resolve([]),
			]);
			const {
				actions,
				rules,
				relations,
				relationAction,
				fixedDocumentType,
				fixedDocumentTypeSigned,
				filterSupported,
				title: loadedTitle,
				description,
				availableBlocks: loadedAvailableBlocks,
				baseSettingsHasFillableFields,
			} = loaded;

			if (this.lastFetchId !== fetchId || !this.nodeSettings)
			{
				return;
			}

			// The answer of the server about the fields of the base settings joins the very memory the form
			// of those settings writes into, so the row of the short form reads one source either way and is
			// right from the first render - without a request of its own (see baseSettingsFieldsMemory).
			// Written as the answer of this node and not of its type: the server computed it against the
			// properties of this very node, so it is the exact answer here and only an approximation for the
			// next node of the same type - which is how the memory keeps the two.
			// A response without the answer leaves the memory alone: the form still fills it in.
			if (Type.isBoolean(baseSettingsHasFillableFields))
			{
				baseSettingsFieldsMemory.rememberForNode(
					block.id,
					block.activity?.Type,
					Type.isArrayFilled(fixedDocumentType) ? fixedDocumentType : workflowDocumentType,
					baseSettingsHasFillableFields,
				);
			}

			if (Type.isStringFilled(loadedTitle) && loadedTitle !== defaultTitle)
			{
				this.nodeSettings.title = loadedTitle;
			}

			const complexNodeConnectionsAvailable = Feature.instance().isAvailable(
				FeatureCode.complexNodeConnections,
			);

			this.nodeSettings = {
				...this.nodeSettings,
				actions: new Map(Object.entries(actions)),
				relationAction: relationAction ?? null,
				rules: new Map(
					Object.entries(rules).map(([id, rule]) => [id, toLoadedSettingsItem(rule)]),
				),
				relations: new Map(
					Object.entries(relations ?? {}).map(([id, relation]) => [id, toLoadedSettingsItem(relation)]),
				),
				fixedDocumentType,
				fixedDocumentTypeSigned,
				description,
				filterSupported,
				availableBlocks: normalizeAvailableBlocks(loadedAvailableBlocks, {
					filterSupported,
					complexNodeConnections: complexNodeConnectionsAvailable,
				}),
			};
			this.ports = block.ports.map((port) => ({ ...port })).sort((a, b) => {
				const { id: aId } = parsePortTitle(a.title) ?? { id: 0 };
				const { id: bId } = parsePortTitle(b.title) ?? { id: 0 };

				return aId - bId;
			});
			const rulesIds = new Set(this.nodeSettings.rules.keys());
			const relationsIds = new Set(this.nodeSettings.relations.keys());
			this.ports.forEach((port) => {
				if (port.type === PORT_TYPES.input)
				{
					if (!rulesIds.has(port.id))
					{
						this.addRule(port.id);
					}

					return;
				}

				if (port.type === PORT_TYPES.inputRelation && !relationsIds.has(port.id))
				{
					this.addRelation(port.id);
				}
			});
			// A node with input ports opens in the all-rules mode: the panel shows the rules of all of
			// them at once, so no single one is the current rule. A node with no input port of any kind
			// opens on the reserved container where it keeps one (see resolvePortlessRule) - that
			// container is then the one rule the node has - and in the all-rules mode otherwise.
			// Another node starts on the rules of its inputs: a direct switch between two nodes replaces
			// the state of the panel without going through reset().
			this.isRelationsSurface = false;
			this.setCurrentRule(this.inputPorts.length > 0 ? null : this.resolvePortlessRule(block));

			// Every input opens expanded: what is set up in the node is on screen without a click. What
			// an expanded input costs is its markup and nothing else - the forms of its blocks are
			// mounted once the input has been reached (see isSectionLive), so a node with many inputs
			// does not turn opening the panel into a request per rule. The relations are not touched
			// here: they are opened when their own surface is (see setCurrentRule), so a node opened on
			// its rules pays nothing for a list nobody is looking at.
			this.ports
				.filter((port: Port) => port.type === PORT_TYPES.input)
				.forEach((port: Port) => this.expandRule(port.id))
			;

			// Auto-initialize an empty base-settings construction on first open
			// if the node declares base-settings as available and none exists yet.
			// block.activity is the node's initial payload — the source of a preset-provided
			// node-action binding (Properties.BaseSettingsAction).
			this.initBaseSettingsIfNeeded(block);

			// A saved payload is the third source of the construction order next to the toolbar
			// insertion and the manual move, and the only one that predates the fixed section order.
			this.applyCanonicalConstructionOrder();

			// Snapshot last of all: after every auto-created structure (port rules, base-settings) and
			// after the normalisation of the order. Opening a node therefore never marks it as modified
			// (neither auto-creation nor normalisation reads as an unsaved change), and the stored
			// payload keeps its old order until the user really saves the node.
			this.prevSavedNodeSettings = Runtime.clone(this.nodeSettings);

			this.block = block;

			this.isLoading = false;
		},
		/**
		 * Current rule of a node without input ports: the reserved container the transport keys by
		 * PORTLESS_RULES_KEY, created when the loaded payload carries none (a node opened for the first
		 * time). Null for a node that keeps no such container (hasPortlessRulesContainer) - a node the
		 * unified panel does not serve has no rules surface at all, and a node managing its rules by
		 * input ports has just lost its last one and is left with no rules instead.
		 * The container is not a port: it lands in nodeSettings.rules only, never in this.ports, so it
		 * adds no port to the canvas and none to the saved template.
		 */
		resolvePortlessRule(block: Block): PortlessRule | null
		{
			if (!hasPortlessRulesContainer(block))
			{
				return null;
			}

			if (!this.nodeSettings.rules.has(PORTLESS_RULES_KEY))
			{
				this.addRule(PORTLESS_RULES_KEY);
			}

			return PORTLESS_RULE;
		},
		/**
		 * Puts the constructions of every card of every rule and relation in the canonical order.
		 * Runs on a loaded payload only, and before the prevSavedNodeSettings snapshot: the server turns
		 * the stored order into the node graph, so the new order reaches the template with the first
		 * real save of the node and a plain open changes the graph of a published template with nothing.
		 */
		applyCanonicalConstructionOrder(): void
		{
			if (!this.nodeSettings)
			{
				return;
			}

			[this.nodeSettings.rules, this.nodeSettings.relations].forEach((collection) => {
				if (!collection)
				{
					return;
				}

				[...collection.entries()].forEach(([id, item]) => {
					collection.set(id, {
						...item,
						ruleCards: sortRuleCardConstructionsCanonically(item.ruleCards),
					});
				});
			});
		},
		/**
		 * Lazily loads the full action catalog for the current node (Q-AFC-3).
		 * Called on first open of the action editor and by the action being added to a node with base
		 * settings — the classification of a pre-filled action lives in this catalog, so that path
		 * awaits the returned promise. Keyed by the node's activity type: reuses a catalog already
		 * loaded for the same type, and a request in flight is shared instead of duplicated, so the
		 * form and the insertion racing each other cost one round trip and both wait for it.
		 * Never rejects: on failure the action editor degrades to the flat selector and a pre-filled
		 * action stays unclassified, exactly as one the catalog classifies ambiguously.
		 */
		ensureCapabilityCatalog(): Promise<void>
		{
			const activity = this.block?.activity;
			const activityType = activity?.Type ?? null;
			if (!activityType)
			{
				return Promise.resolve();
			}

			if (this.capabilityCatalog && this.capabilityCatalogType === activityType)
			{
				return Promise.resolve();
			}

			// Only a request for this very type is what this call is waiting for: one left in flight
			// for the type the panel showed before describes another node and is replaced below. It
			// releases nothing then (the slot is no longer its own) and writes nothing (the response
			// is dropped on the type check), so the two never fight over the state.
			if (this.capabilityCatalogRequest?.activityType === activityType)
			{
				return this.capabilityCatalogRequest.promise;
			}

			// The slot is claimed before the request starts, so that the request releases only the slot
			// it finds itself in (same reason as in resolveBaseSettingsProperties). It is recognized by
			// its id and not by identity: the state of the store is a reactive proxy, so the object read
			// back from the slot is never the very object written into it.
			const request = { id: createUniqueId(), activityType, promise: null };
			this.capabilityCatalogRequest = request;
			request.promise = this.loadCapabilityCatalog(activity, request);

			return request.promise;
		},
		/**
		 * Loads the catalog of one activity type and stores it. Never rejects (see
		 * ensureCapabilityCatalog): a failure is logged and leaves the catalog absent.
		 */
		async loadCapabilityCatalog(activity: ActivityData, request: Object): Promise<void>
		{
			const requestedType = request.activityType;
			try
			{
				const documentType = diagramStore().documentType;
				const catalog: CapabilityCatalog | null = await complexNodeApi.getCapabilityCatalog(
					activity,
					documentType,
				);

				// Ignore a response that arrives after the node switched to another type.
				if (this.block?.activity?.Type === requestedType)
				{
					this.capabilityCatalog = catalog;
					this.capabilityCatalogType = requestedType;
				}
			}
			catch (e)
			{
				console.error(e);
			}
			finally
			{
				if (this.capabilityCatalogRequest?.id === request.id)
				{
					this.capabilityCatalogRequest = null;
				}

				// The node may have switched to another type while this request was in flight:
				// its own load shared this request instead of starting one, so restart it now.
				const currentType = this.block?.activity?.Type ?? null;
				if (currentType && currentType !== requestedType && this.capabilityCatalogType !== currentType)
				{
					void this.ensureCapabilityCatalog();
				}
			}
		},
		isCurrentBlock(blockId: string): boolean
		{
			return this.nodeSettings?.blockId === blockId;
		},
		reset(): void
		{
			this.currentRule = null;
			this.selectedRulePortId = null;
			this.shouldShowWithTransition = false;
			this.nodeSettings = null;
			this.brokenLinks = {};
			this.prevSavedNodeSettings = null;
			this.block = null;
			this.ports = null;
			this.selectedTabId = NODE_SETTINGS_TABS.basic;
			this.capabilityCatalog = null;
			this.capabilityCatalogType = null;
			// A catalog request in flight describes the node being closed: the next one starts its own
			// instead of waiting for a response that will be dropped anyway.
			this.capabilityCatalogRequest = null;
			this.autofillSnapshots = {};
			this.autofillRequests = {};
			this.requiredFieldsChecks = {};
			this.baseSettingsFormChecks = {};
			this.requiredFieldsBlocks = [];
			this.expandedRulePortIds = [];
			this.collapsedRuleCardIds = [];
			this.revealedRulePortIds = [];
			this.isRelationsSurface = false;
			this.resetBaseSettingsProperties();
			// The remembered form answers belong to the node being closed (see fetchNodeSettings).
			settingsFormRequestCache.reset();
			// Advancing the generation past every fetch and every action prefill in flight: the panel
			// is closed, so their records describe nothing on screen. Without it a prefill that has
			// not landed yet would keep the add surface and the save button of the next node disabled
			// (isResolvingActionPrefill), and a late loadSettings could still hydrate it.
			this.lastFetchId += 1;
			// The filter metadata is shared by the constructions of one open panel only: a later
			// opening asks again instead of drawing fields the entity may no longer have.
			filterMetadataCache.clear();
		},
		/**
		 * stores a session snapshot of a "Create" action form (auto + manual values
		 * plus the auto-filled field list), keyed by the stable construction.id.
		 */
		saveAutofillSnapshot(constructionId: string, snapshot: AutofillSnapshot): void
		{
			if (!Type.isStringFilled(constructionId))
			{
				return;
			}

			this.autofillSnapshots[constructionId] = snapshot;
		},
		/**
		 * Returns the session snapshot for a construction, or null when there is none.
		 */
		getAutofillSnapshot(constructionId: string): AutofillSnapshot | null
		{
			return this.autofillSnapshots[constructionId] ?? null;
		},
		/**
		 * marks that the user explicitly selected the "Create" sub-action of a construction,
		 * so the form (once mounted) may apply autofill. Raised only on a user action switch.
		 */
		requestAutofillApply(constructionId: string): void
		{
			if (!Type.isStringFilled(constructionId))
			{
				return;
			}

			this.autofillRequests[constructionId] = true;
		},
		/**
		 * Returns and clears the one-shot autofill request for a construction. Returns false when the
		 * form load was not triggered by a user selection (plain open/reload), so autofill stays a no-op.
		 */
		consumeAutofillRequest(constructionId: string): boolean
		{
			if (this.autofillRequests[constructionId] !== true)
			{
				return false;
			}

			delete this.autofillRequests[constructionId];

			return true;
		},
		/**
		 * Records what the mounted "Create" form of a construction knows about its required fields. The
		 * form writes it on every validation pass and once more before it leaves the screen, so the row
		 * it belongs to can answer the pre-save check while the form is unmounted (collapsed row, rule
		 * not reached).
		 */
		setRequiredFieldsCheck(constructionId: string, check: RequiredFieldsCheck): void
		{
			if (!Type.isStringFilled(constructionId))
			{
				return;
			}

			this.requiredFieldsChecks[constructionId] = check;
		},
		/**
		 * Returns the recorded required-fields state of a construction, or null while no form of it has
		 * been mounted for the open node.
		 */
		getRequiredFieldsCheck(constructionId: string): RequiredFieldsCheck | null
		{
			return this.requiredFieldsChecks[constructionId] ?? null;
		},
		/**
		 * Forgets what the forms of these constructions recorded: a construction the user deleted has no
		 * row left to answer the pre-save check, so its record would sit in the map until the panel loads
		 * another node. Called from every path that drops constructions - one of them, a card, a rule.
		 */
		forgetRequiredFieldsChecks(constructions: ?Array<Construction>): void
		{
			(constructions ?? []).forEach((construction: Construction) => {
				delete this.requiredFieldsChecks[construction.id];
				delete this.baseSettingsFormChecks[construction.id];
			});
		},
		/**
		 * The verdict of a base-settings form over itself: whether any field it shows holds a value.
		 * Written by the form, because only the form is told by the server which of its fields are shown
		 * and which are hidden carriers of a default or of the identity of the node
		 * (EditBaseSettings.reportFilledState). A form built against controls the server does not
		 * describe records nothing and leaves the row reading the data instead.
		 */
		setBaseSettingsFormCheck(constructionId: string, check: BaseSettingsFormCheck): void
		{
			if (!Type.isStringFilled(constructionId))
			{
				return;
			}

			this.baseSettingsFormChecks[constructionId] = check;
		},
		/**
		 * Opens a pass of the pre-save check: the rows that block report into it while the panel asks
		 * them, and the rows that blocked the previous press must not be among them.
		 */
		beginRequiredFieldsBlockPass(): void
		{
			this.requiredFieldsBlocks = [];
		},
		/**
		 * A row that blocked the press being handled. Every blocked row expands itself, because that is
		 * where its inline errors show, but bringing a row into view and announcing the block are done
		 * once for the whole press: several rules of a node are on screen at once, so N rows each leading
		 * the user to itself would leave them at the last one and queue N announcements of one meaning.
		 * The panel reads this collection and leads to the first of the rows (NodeSettings.onSave).
		 */
		reportRequiredFieldsBlock(block: RequiredFieldsBlock): void
		{
			if (!Type.isStringFilled(block?.constructionId))
			{
				return;
			}

			this.requiredFieldsBlocks.push(block);
		},
		toggleVisibility(isShown: boolean): void
		{
			this.isShown = isShown;
			if (!isShown)
			{
				this.shouldShowWithTransition = false;
			}
		},
		/**
		 * Drops the transition flag once the panel has played the fade it was asked for. The flag
		 * belongs to that one show: left standing it would also fade in every later render of the
		 * content — a tab switch of the node above all, and that is the node the user works with
		 * right after a series of agent-driven shows.
		 */
		finishShowTransition(): void
		{
			this.shouldShowWithTransition = false;
		},
		/**
		 * Selects the rule the panel shows on its own, or null for the all-rules mode.
		 */
		setCurrentRule(port: ?RulePort): void
		{
			// The surface follows the rule shown: a relation belongs to the relations of the node, any
			// other rule to the rules of its inputs. Null shows everything of the surface already on
			// screen - all rules, or all relations - so it changes nothing here.
			if (port)
			{
				this.isRelationsSurface = port.type === PORT_TYPES.inputRelation;
			}

			this.currentRule = port;
			// Picking one rule shows it open, and it stays open on the way back to the whole list:
			// the choice of the user is what the list then shows too.
			if (port)
			{
				this.expandRule(port.id);
			}

			// Entering the relations opens all of them, the way loading a node opens all its inputs:
			// the list the selector leads back to ("all relations") is then open, a single relation
			// included.
			if (this.isRelationsSurface)
			{
				this.relationPorts.forEach((relationPort: Port) => this.expandRule(relationPort.id));
			}
		},
		/** Surface of the rules tab: the relations of the node, or the rules of its inputs. */
		setRelationsSurface(isRelations: boolean): void
		{
			this.isRelationsSurface = isRelations;
		},
		/**
		 * Expansion of the rules tab. A node opens with every input expanded and the user collapses what
		 * they do not need: nothing here closes or opens anything on its own afterwards.
		 * The state lives in the store and not in the layout because the save flow expands a blocked
		 * row through here (see NodeSettings.revealBlockedRow); mounting the forms of that row is a
		 * separate matter and is asked for separately (see revealRule).
		 */
		isRuleExpanded(portId: PortId): boolean
		{
			return this.expandedRulePortIds.includes(portId);
		},
		expandRule(portId: PortId): void
		{
			if (!this.expandedRulePortIds.includes(portId))
			{
				this.expandedRulePortIds.push(portId);
			}
		},
		collapseRule(portId: PortId): void
		{
			this.expandedRulePortIds = this.expandedRulePortIds.filter((id) => id !== portId);
		},
		toggleRule(portId: PortId): void
		{
			if (this.isRuleExpanded(portId))
			{
				this.collapseRule(portId);

				return;
			}

			this.expandRule(portId);
		},
		/**
		 * Where the construction lives: the collection holding it, its rule as the panel addresses it,
		 * the group card showing it and its place in the traversal order of the node. Null for a
		 * construction the node does not hold and for a rule whose port the node no longer has.
		 * The one traversal of the rules of a node, and the one definition of "first": the save flow
		 * picks the refusal to lead to by the order counted here (NodeSettings.saveRules), and
		 * expandConstruction() opens what it names. That order is the order of the sections on screen
		 * (orderRulePorts) - a construction of the input standing higher answers first.
		 * The rule is a real descriptor and never a synthesized one: the panel reads its type to pick
		 * the surface and the collection, and a rule without a type would send it to the other list.
		 */
		resolveConstructionLocation(constructionId: string): ConstructionLocation | null
		{
			let order = 0;
			for (const rulePort of orderRulePorts(this.nodeSettings, this.ports))
			{
				const collection = resolveRuleCollection(this.nodeSettings, rulePort);
				const rule = collection?.get(rulePort.id);
				for (const ruleCard of rule?.ruleCards ?? [])
				{
					for (const construction of ruleCard.constructions ?? [])
					{
						if (construction.id === constructionId)
						{
							return { collection, rulePort, ruleCardId: ruleCard.id, order };
						}

						order += 1;
					}
				}
			}

			return null;
		},
		/**
		 * Opens whatever hides the construction: its rule and the group card holding it. Used by the
		 * save flow to lead the user to a row blocked by required fields - a row of a collapsed rule
		 * is not merely scrolled past, it is not in the DOM at all until its rule is expanded.
		 * Expanding is not the whole of it: the forms of the blocks of a rule are mounted only once
		 * the rule has been reached (see isSectionLive), and a rule never reached in this session
		 * keeps no row of its own to lead to - hence the rule is named as revealed as well, which
		 * mounts its forms whether the user has ever been there or not.
		 */
		expandConstruction(constructionId: string): void
		{
			const location = this.resolveConstructionLocation(constructionId);
			if (!location)
			{
				return;
			}

			this.expandRule(location.rulePort.id);
			this.expandRuleCard(location.ruleCardId);
			this.revealRule(location.rulePort.id);
		},
		/**
		 * Names a rule the panel has led the user into: its forms are mounted from here on, and they
		 * stay mounted for as long as the node is open - the row led to holds the error being read.
		 */
		revealRule(portId: PortId): void
		{
			if (!this.revealedRulePortIds.includes(portId))
			{
				this.revealedRulePortIds.push(portId);
			}
		},
		/**
		 * A group is open unless the user has closed it: expanding an input shows what is inside it,
		 * and a group closed by hand stays closed for as long as the node is open.
		 */
		isRuleCardExpanded(ruleCardId: string): boolean
		{
			return !this.collapsedRuleCardIds.includes(ruleCardId);
		},
		expandRuleCard(ruleCardId: string): void
		{
			this.collapsedRuleCardIds = this.collapsedRuleCardIds.filter((id) => id !== ruleCardId);
		},
		collapseRuleCard(ruleCardId: string): void
		{
			if (!this.collapsedRuleCardIds.includes(ruleCardId))
			{
				this.collapsedRuleCardIds.push(ruleCardId);
			}
		},
		toggleRuleCard(ruleCardId: string): void
		{
			if (this.isRuleCardExpanded(ruleCardId))
			{
				this.collapseRuleCard(ruleCardId);

				return;
			}

			this.expandRuleCard(ruleCardId);
		},
		/**
		 * Names the rule the add panel works on in the all-rules mode (a click on a card header).
		 * Only an input port can host it: that mode lists the rules of the node and never its
		 * relations, so anything else is refused instead of silently pointing the panel at them.
		 * Null gives the choice back to the default (see toolbarRulePort).
		 */
		setSelectedRulePort(portId: ?PortId): void
		{
			if (portId === null)
			{
				this.selectedRulePortId = null;

				return;
			}

			// A port of the surface the tab shows, and only it: naming a relation as the target while the
			// rules of the inputs are on screen would point the toolbar at a list nobody is looking at.
			// The surface shown is what decides, the same way the toolbar target does (toolbarRulePort).
			const targetType = this.isRelationsSurfaceShown ? PORT_TYPES.inputRelation : PORT_TYPES.input;
			const isTargetPort = (this.ports ?? []).some(
				(port) => port.id === portId && port.type === targetType,
			);
			if (isTargetPort)
			{
				this.selectedRulePortId = portId;
			}
		},
		/**
		 * On first open, auto-initialize an empty base-settings construction if:
		 *   - base-settings block is declared available by the node descriptor
		 *   - no base-settings construction exists yet
		 *   - the node has no saved constructions at all (a configured node without
		 *     base-settings means the user removed the block deliberately)
		 * Inserts the construction at position 0 of the head rule card of the first rule.
		 * If no rule card exists yet, adds one.
		 * The expression seeding rules are described in buildBaseSettingsExpression().
		 */
		initBaseSettingsIfNeeded(block: Block): void
		{
			if (!this.nodeSettings?.availableBlocks?.[NODE_BLOCK_TYPES.BASE_SETTINGS]?.available)
			{
				return;
			}

			if (this.hasBaseSettings)
			{
				return;
			}

			// Empty cards are never persisted, so any saved construction marks the node
			// as configured: auto-init would resurrect a deliberately removed block.
			const isConfigured = [this.nodeSettings.rules, this.nodeSettings.relations].some(
				(collection) => [...collection.values()].some(
					(rule) => rule.ruleCards.some((ruleCard) => ruleCard.constructions.length > 0),
				),
			);
			if (isConfigured)
			{
				return;
			}

			// Rule hosting the base-settings construction: the first input one, or the reserved
			// container of a node without input ports: it is the only entry of the collection there.
			const firstRule = this.nodeSettings.rules.values().next().value;
			if (!firstRule)
			{
				return;
			}

			const ruleCard = this.resolveHeadRuleCardForRule(firstRule);

			// Insert base-settings at position 0 so it always appears first.
			ruleCard.constructions.splice(0, 0, {
				id: createUniqueId(),
				type: CONSTRUCTION_TYPES.BASE_SETTINGS,
				expression: this.buildBaseSettingsExpression(block),
			});
		},
		/**
		 * Builds the expression for a base-settings construction.
		 * When the node declares a target node-action (Properties.BaseSettingsAction), the expression
		 * is seeded with that action as its backing type (activityData.Type) and binding (actionId).
		 * Without BaseSettingsAction the construction stays host-merged (activityData: null).
		 */
		buildBaseSettingsExpression(block: Block): Object
		{
			const baseSettingsAction = block?.activity?.Properties?.BaseSettingsAction ?? null;

			return Type.isStringFilled(baseSettingsAction)
				? {
					rawActivityData: null,
					activityData: {
						Name: createUniqueId(),
						Type: baseSettingsAction,
						Activated: 'Y',
						Properties: {},
					},
					actionId: baseSettingsAction,
				}
				: {
					rawActivityData: null,
					activityData: null,
				}
			;
		},
		/**
		 * Builds the expression of an action construction pre-filled from the node's base settings:
		 * the same node-action and the properties passed in (see resolveBaseSettingsProperties()).
		 * Name is always a fresh one: the child activity of the base settings keeps its own, and a
		 * duplicate would break the activity links of the node. rawActivityData stays null: the copied
		 * properties are internal already, so the save pipeline must not internalize them a second time.
		 * The host metadata of the settings is not part of them and stays behind
		 * (BASE_SETTINGS_EXCLUDED_PROPERTIES), so a state carrying nothing else counts as nothing to
		 * inherit. Without properties to inherit only the action binding is seeded, and the form fills
		 * itself with the catalog defaults as it does for any other new action.
		 * The binding carries the classification the catalog gives the action (area/object): the
		 * intent-first cascade renders from those persisted fields, so without them a filled form
		 * would sit under a step reading "not selected" whose only way to be completed
		 * (EditActionExpression.onSelectArea/onSelectObject) drops the inherited values. That is why
		 * an action whose cascade the catalog leaves unfinished never reaches here carrying values:
		 * resolveActionPrefill refuses the whole prefill then. With nothing to inherit both fields
		 * simply stay null.
		 */
		buildDefaultActionExpression(actionId: string, baseProperties: ?Object): Object
		{
			const { area, object } = findActionClassification(this.catalogEntryByActionId(actionId));
			const expression = {
				title: '',
				valueId: '',
				value: {},
				actionId,
				area,
				object,
				rawActivityData: null,
				activityData: null,
				document: null,
			};

			// The document of the base settings does not carry over either: it is a sibling of
			// Properties, so expression.document above (null) is what keeps the new action
			// selecting its own.
			const properties = toInheritedProperties(baseProperties);

			if (Object.keys(properties).length === 0)
			{
				return expression;
			}

			expression.activityData = {
				Name: createUniqueId(),
				Type: actionId,
				Activated: 'Y',
				Properties: {
					...properties,
					// The title of the base settings is host metadata (stripped above), and non-empty
					// activityData stops the action form from seeding the property defaults: without this
					// the child activity would be saved untitled.
					Title: this.nodeSettings?.actions?.get(actionId)?.title || '',
				},
			};

			return expression;
		},
		/**
		 * Registers the synchronous flush of the mounted base-settings form. The store reads what the
		 * form has committed, and the form commits with a debounce, so every reader of those values
		 * flushes it first (see resolveBaseSettingsProperties).
		 */
		registerBaseSettingsFormFlush(flush: Function): void
		{
			this.baseSettingsFormFlush = flush;
		},
		/**
		 * Drops the registration made by this very form: a form unmounted after its replacement has
		 * already registered must not leave the store without a flush.
		 */
		unregisterBaseSettingsFormFlush(flush: Function): void
		{
			if (this.baseSettingsFormFlush === flush)
			{
				this.baseSettingsFormFlush = null;
			}
		},
		/**
		 * Everything an action being added inherits, as one frozen descriptor: whether it inherits at
		 * all, the node action it is bound to and the values to copy.
		 * The decision is taken on the press and is never re-read afterwards. It survives a round trip
		 * during which the base settings are deleted (the delete button stays live on purpose), so the
		 * user gets the action they asked for instead of an empty one added silently.
		 * The capability catalog is awaited next to the normalization, not after it: the classification
		 * of the pre-filled action comes from the catalog (buildDefaultActionExpression), and without
		 * it the filled form would sit under an area reading "not selected". The classification, and
		 * not the wait being over, is what the inheritance is gated on: a catalog that failed to load
		 * (loadCapabilityCatalog swallows the failure) and an entry classified ambiguously both end in
		 * that same state, so values are inherited only together with a cascade the form shows as
		 * complete — the area, and the object too whenever that step is rendered. A group offering no
		 * areas renders no cascade at all, and an action of one inherits as it always did. A node with
		 * nothing to normalize resolves the properties synchronously, so the catalog is the only wait
		 * left there.
		 * The wait is capped (ACTION_PREFILL_TIMEOUT): what is on the other side is the whole add
		 * surface and the save button of the panel, and neither may hang on a request that never answers.
		 */
		async resolveActionPrefill(): Promise<ActionPrefill>
		{
			if (!this.canInheritBaseSettings)
			{
				return { canInherit: false, actionId: null, properties: null };
			}

			const actionId = this.baseSettingsActionId;
			const requestId = createUniqueId();
			this.actionPrefillRequests[requestId] = this.lastFetchId;
			let timeoutId = null;
			try
			{
				const resolved = await Promise.race([
					Promise.all([
						this.resolveBaseSettingsProperties(),
						this.ensureCapabilityCatalog(),
					]),
					new Promise((resolve) => {
						timeoutId = setTimeout(() => resolve(ACTION_PREFILL_TIMED_OUT), ACTION_PREFILL_TIMEOUT);
					}),
				]);

				// A wait that ran out degrades to a plain empty action and never to a half-filled one:
				// properties without the classification of the catalog are exactly the state whose area
				// reads "not selected", and filling that area in afterwards wipes the inherited values.
				if (resolved === ACTION_PREFILL_TIMED_OUT)
				{
					return { canInherit: false, actionId: null, properties: null };
				}

				const [properties] = resolved;

				// Same loss as the timeout, reached the other way: any step of the cascade left
				// unfinished renders as "not selected", and completing it wipes the inherited values
				// (EditActionExpression.onSelectArea/onSelectObject). Judged step by step against the
				// cascade the form actually renders, and from the same sources it renders it from
				// (isCascadeAvailable, isObjectStepShown) rather than from the entry alone: a group
				// offering no areas keeps the flat selector, so a null area is a finished
				// classification there and not an unfinished one. An action missing from the catalog
				// stays a refusal — that is where a catalog that failed to load ends up.
				// Only values are at stake, so a node with nothing to inherit keeps its binding as before.
				const entry = this.catalogEntryByActionId(actionId);
				const { area, object } = findActionClassification(entry);
				const group = entry?.group ?? this.nodeSettings?.actions?.get(actionId)?.group ?? null;
				const areaOptions = this.actionAreasByGroup(group);
				const objectOptions = Type.isStringFilled(area)
					? this.actionObjectsByArea(group, area)
					: []
				;
				const hasIncompleteClassification = entry === null || (
					areaOptions.length > 0
					&& (
						!Type.isStringFilled(area)
						|| (objectOptions.length > 0 && !Type.isStringFilled(object))
					)
				);
				const hasInheritedValues = Object.keys(toInheritedProperties(properties)).length > 0;
				if (hasIncompleteClassification && hasInheritedValues)
				{
					return { canInherit: false, actionId: null, properties: null };
				}

				return { canInherit: true, actionId, properties };
			}
			finally
			{
				// The record goes away on the timeout as well, not when the request finally lands: it is
				// what holds the add surface and the save button. The requests themselves are left to
				// run — both cache their result, so the next addition gets it for free.
				clearTimeout(timeoutId);
				delete this.actionPrefillRequests[requestId];
			}
		},
		/**
		 * Current values of the node's base settings as internal properties, or null when there is
		 * nothing to inherit. Unsaved edits of the base-settings form live as printable form data
		 * (rawActivityData) only, so they are normalized through the rule-save endpoint, a pure
		 * normalizer that writes nothing to the template.
		 * The normalization of a form state is requested once: further adds read the stored result,
		 * and adds racing the request in flight share it, so one form state never costs more than one
		 * round trip.
		 */
		resolveBaseSettingsProperties(): Promise<Object | null>
		{
			if (!this.canInheritBaseSettings)
			{
				return Promise.resolve(null);
			}

			// The form commits its edits with a debounce, so the last input may still live in the DOM
			// only: without the flush an action added within that window inherits the previous state.
			try
			{
				this.baseSettingsFormFlush?.();
			}
			catch (e)
			{
				// A throwing flush degrades like a failed normalization: the last internal values,
				// nothing cached and no request. The callers do not handle a rejection here, and one
				// would silently cost them the action being added.
				console.error(e);

				const committedExpression = this.baseSettingsConstruction.expression;

				return Promise.resolve(committedExpression?.activityData?.Properties ?? null);
			}

			const { construction, portId } = this.baseSettingsLocation;
			const { expression } = construction;
			const internalProperties = expression?.activityData?.Properties ?? null;
			const rawActivityData = expression?.rawActivityData ?? null;
			if (!Type.isPlainObject(rawActivityData) || Object.keys(rawActivityData).length === 0)
			{
				return Promise.resolve(internalProperties);
			}

			const { id: constructionId } = construction;
			const formState = { constructionId, rawActivityData };
			if (matchesBaseSettingsState(this.baseSettingsProperties, formState))
			{
				return Promise.resolve(this.baseSettingsProperties.properties);
			}

			if (matchesBaseSettingsState(this.baseSettingsPropertiesRequest, formState))
			{
				return this.baseSettingsPropertiesRequest.promise;
			}

			// The slot is claimed before the request starts: the request releases only the slot it finds
			// itself in, so a failure on its synchronous part would otherwise leave the slot occupied
			// for good and the whole add surface disabled until the node is reopened.
			const request = { ...formState, promise: null };
			this.baseSettingsPropertiesRequest = request;
			request.promise = this.normalizeBaseSettingsProperties(
				construction,
				portId,
				internalProperties,
				formState,
			);

			return request.promise;
		},
		/**
		 * Normalizes the base settings through the rule-save endpoint and stores the result for the
		 * form state it describes. Never rejects: a failed normalization degrades to the last internal
		 * values instead of blocking the action being added, and is not stored, so the next add retries.
		 */
		async normalizeBaseSettingsProperties(
			construction: Construction,
			portId: PortId,
			internalProperties: ?Object,
			formState: Object,
		): Promise<Object | null>
		{
			try
			{
				// The command mutates the expression it is given (it resets rawActivityData), so the
				// construction goes to the server as a clone. Built inside the try: a failure here must
				// release the request slot like any other one.
				const rulePayload = {
					// The port of the construction being normalized, not the active one: the two differ
					// on a node whose base settings live on another input port.
					portId,
					ruleCards: [{
						id: createUniqueId(),
						groupTitle: '',
						constructions: [Runtime.clone(construction)],
					}],
				};

				const normalizedRule = await complexNodeApi.saveRuleSettings(
					rulePayload,
					diagramStore().documentType,
				);
				const normalizedProperties = normalizedRule
					?.ruleCards?.[0]
					?.constructions?.[0]
					?.expression
					?.activityData
					?.Properties
				;

				if (!Type.isPlainObject(normalizedProperties))
				{
					return internalProperties;
				}

				// Symmetric to the release of the slot below: only the request that is still the current
				// one writes the cache. A late answer of a superseded request would otherwise overwrite
				// the normalization of a newer form state with its own, and the next add would miss the
				// cache and pay for another round trip. The awaiting caller gets its own result either way.
				if (matchesBaseSettingsState(this.baseSettingsPropertiesRequest, formState))
				{
					this.baseSettingsProperties = { ...formState, properties: normalizedProperties };
				}

				return normalizedProperties;
			}
			catch (e)
			{
				console.error(e);

				return internalProperties;
			}
			finally
			{
				// Only the request that is still the current one releases the slot: a form edited
				// mid-flight has already replaced it with its own.
				if (matchesBaseSettingsState(this.baseSettingsPropertiesRequest, formState))
				{
					this.baseSettingsPropertiesRequest = null;
				}
			}
		},
		/**
		 * Drops the stored normalization of the base settings together with the request in flight.
		 * Called when the form the normalization describes is gone (another node, closed panel).
		 */
		resetBaseSettingsProperties(): void
		{
			this.baseSettingsProperties = null;
			this.baseSettingsPropertiesRequest = null;
		},
		/**
		 * Adds a RuleCard to a specific rule (not necessarily currentRule).
		 * Shared implementation for addRuleCard() and initBaseSettingsIfNeeded(),
		 * which runs before currentRule is set.
		 * A head card (host of base-settings and filters) goes above the groups and stays untitled:
		 * it is never rendered as a group, so it must not consume a group number.
		 */
		addRuleCardToRule(rule: Object, isHeadCard: boolean = false): Object
		{
			let groupTitle = '';
			if (!isHeadCard)
			{
				// Default group title 'Group N': max(existing N) + 1, duplicate-free
				const groupIndex = getNextGroupIndex(rule.ruleCards, Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_GROUP_TITLE'));
				groupTitle = Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_GROUP_TITLE', { '#N#': groupIndex });
			}

			const ruleCard = {
				id: createUniqueId(),
				constructions: [],
				groupTitle,
			};

			// A group card goes last; a head card takes the position findHeadRuleCardInsertIndex picks,
			// so a newly added head block never renders above the ones already there.
			const position = isHeadCard
				? findHeadRuleCardInsertIndex(rule.ruleCards)
				: rule.ruleCards.length
			;
			rule.ruleCards.splice(position, 0, ruleCard);

			// Return the reactive proxy from the array (not the raw literal) so that
			// subsequent mutations on .constructions trigger Vue3 reactive effects.
			return rule.ruleCards[position];
		},
		/**
		 * Card hosting base-settings and filters for a rule, created when absent.
		 * These blocks are rendered above the groups, so they never go to a group card.
		 */
		resolveHeadRuleCardForRule(rule: Object): TRuleCard
		{
			return findHeadRuleCard(rule.ruleCards) ?? this.addRuleCardToRule(rule, true);
		},
		/**
		 * Head card of the given rule, the target rule of the add panel by default
		 * (see resolveHeadRuleCardForRule, toolbarRulePort).
		 * Null when that rule has no entry: nothing to add the construction to.
		 */
		resolveHeadRuleCard(rulePort: ?RulePort = this.toolbarRulePort): TRuleCard | null
		{
			const rule = resolveRuleCollection(this.nodeSettings, rulePort)?.get(rulePort?.id);
			if (!rule)
			{
				return null;
			}

			return this.resolveHeadRuleCardForRule(rule);
		},
		/**
		 * Group card a toolbar chip adds a construction to: the last group while it holds no
		 * construction of that group yet, otherwise a freshly created group.
		 * Null when the target rule has no entry (see resolveHeadRuleCard).
		 */
		resolveGroupRuleCard(constructionType: string, rulePort: ?RulePort = this.toolbarRulePort): TRuleCard | null
		{
			const rule = resolveRuleCollection(this.nodeSettings, rulePort)?.get(rulePort?.id);
			if (!rule)
			{
				return null;
			}

			return findGroupRuleCardForType(rule.ruleCards, constructionType) ?? this.addRuleCardToRule(rule);
		},
		/**
		 * Adds a rule, for the given port or for a newly numbered one.
		 * A rule created without a port id is one the user just asked for, so it opens expanded - the
		 * same reason an addition into a rule opens it (see addConstruction): a new input rendered
		 * collapsed among expanded neighbours would look like the press did nothing. A rule created for
		 * a port the node already has comes from the load path, which decides expansion on its own
		 * (see fetchNodeSettings).
		 */
		addRule(portId: ?PortId): PortId
		{
			const nextPortId = portId ?? generateNextInputPortId(this.inputPorts);
			this.nodeSettings.rules.set(nextPortId, {
				isFilled: false,
				portId: nextPortId,
				ruleCards: [],
			});

			if (!portId)
			{
				this.expandRule(nextPortId);
			}

			return nextPortId;
		},
		/**
		 * Adds a relation, or refuses once the node holds as many cards as it may (see canAddRelation).
		 * Expansion of a new one follows addRule().
		 */
		addRelation(portId: ?PortId): ?PortId
		{
			if (!this.canAddRelation)
			{
				return null;
			}

			const nextPortId = portId ?? generateNextInputPortId(this.inputPorts);
			this.nodeSettings.relations.set(nextPortId, {
				isFilled: false,
				portId: nextPortId,
				ruleCards: [],
			});

			if (!portId)
			{
				this.expandRule(nextPortId);
			}

			return nextPortId;
		},
		/**
		 * Adds a construction to a card and returns it (null when it was rejected).
		 * actionPrefill pre-fills an action added to an input port from the node's base settings. It is
		 * resolved by the caller (resolveActionPrefill()) because the action form renders from the store
		 * and does not follow later activityData writes, and it is read as given: the decision it holds
		 * was taken before the round trip and must not be recomputed from a state that changed during it.
		 * rulePort is the rule the card belongs to, the target rule of the add panel by default: it is
		 * what tells an action of a relation port from one of an input port (see below).
		 */
		addConstruction(
			ruleCard: TRuleCard,
			constructionType: string,
			actionPrefill: ?ActionPrefill = null,
			rulePort: ?RulePort = this.toolbarRulePort,
		): Construction | null
		{
			// Frontend uniqueness guard for base-settings:
			// a second base-settings construction must not be added.
			if (constructionType === CONSTRUCTION_TYPES.BASE_SETTINGS && this.hasBaseSettings)
			{
				return null;
			}

			const newConstruction = {
				id: createUniqueId(),
				type: constructionType,
				expression: {
					title: '',
					valueId: '',
					value: '',
				},
			};

			if (
				constructionType === CONSTRUCTION_TYPES.ACTION
				|| constructionType === CONSTRUCTION_TYPES.FILTER
			)
			{
				newConstruction.expression.value = {};
				newConstruction.expression.actionId = constructionType === CONSTRUCTION_TYPES.FILTER
					? CRM_FILTER_BACKING_ACTIVITY_TYPE
					: ''
				;
				newConstruction.expression.rawActivityData = null;
				newConstruction.expression.activityData = null;
				newConstruction.expression.document = null;

				if (
					constructionType === CONSTRUCTION_TYPES.ACTION
					&& rulePort?.type === PORT_TYPES.inputRelation
					&& this.nodeSettings?.relationAction
				)
				{
					newConstruction.expression.actionId = this.nodeSettings.relationAction.id;
				}
				else if (constructionType === CONSTRUCTION_TYPES.ACTION && actionPrefill?.canInherit === true)
				{
					// An input-port action starts as a copy of the node's base settings; a relation port
					// keeps its own binding (relationAction above) instead. That the port has not changed
					// since the resolve is checked by the caller (isInsertionTargetAlive), not here.
					newConstruction.expression = this.buildDefaultActionExpression(
						actionPrefill.actionId,
						actionPrefill.properties,
					);
				}
			}
			else if (constructionType === CONSTRUCTION_TYPES.BASE_SETTINGS)
			{
				newConstruction.expression = this.buildBaseSettingsExpression(this.block);
			}
			else
			{
				newConstruction.expression.operator = '';
				newConstruction.expression.field = null;
			}

			if (constructionType === CONSTRUCTION_TYPES.OUTPUT)
			{
				newConstruction.expression = {
					portId: null,
					title: null,
				};
			}

			// base-settings always renders first in the card (mockup 935:82879) — same position the
			// auto-init path (initBaseSettingsIfNeeded) uses. Every other block lands on the position
			// of its own section, so the saved order of the constructions (the one the server turns
			// into the node graph) matches the order the card renders them in.
			const pos = constructionType === CONSTRUCTION_TYPES.BASE_SETTINGS
				? 0
				: findConstructionInsertIndex(ruleCard.constructions, constructionType);
			ruleCard.constructions.splice(pos, 0, newConstruction);

			// What was just added has to be on screen: the rule and the group it landed in are opened,
			// and the rule is reached, so the form of the new block is mounted instead of waiting for
			// the user to reach a rule they are already working in.
			// An input a user had collapsed by hand is therefore opened again by an addition into it.
			if (rulePort)
			{
				this.expandRule(rulePort.id);
				this.revealRule(rulePort.id);
			}
			this.expandRuleCard(ruleCard.id);

			return newConstruction;
		},
		/**
		 * Removes a construction from a card, and the card with it once it holds nothing.
		 * rulePort names the rule of the card; without it the rule is the one the card belongs to
		 * (see resolveOperationRule), which is what the delete button of a card rendered in the
		 * all-rules mode relies on.
		 */
		deleteConstruction(ruleCard: TRuleCard, construction: Construction, rulePort: ?RulePort = null): void
		{
			const auxPortId = construction.type === CONSTRUCTION_TYPES.ACTION
				? construction.expression?.auxPortId
				: null
			;
			// A construction of another card (or an already removed one) must not delete the last block
			// here: indexOf returns -1 and splice(-1, 1) would drop the tail of this card.
			const constructionIndex = ruleCard.constructions.indexOf(construction);
			if (constructionIndex === -1)
			{
				return;
			}

			ruleCard.constructions.splice(constructionIndex, 1);
			this.forgetRequiredFieldsChecks([construction]);
			if (ruleCard.constructions.length === 0)
			{
				this.deleteRuleCard(ruleCard, rulePort);
			}

			this.deactivateAuxPortIfUnused(auxPortId);
		},
		deleteRuleSettings(ruleId: string): SyncOutputPorts | null
		{
			const isRule = this.nodeSettings.rules.has(ruleId);
			const settingsItems = isRule ? this.nodeSettings.rules : this.nodeSettings.relations;
			(settingsItems.get(ruleId)?.ruleCards ?? []).forEach((ruleCard: TRuleCard) => {
				this.forgetRequiredFieldsChecks(ruleCard.constructions);
			});
			settingsItems.delete(ruleId);

			const portType = isRule ? PORT_TYPES.input : PORT_TYPES.inputRelation;

			return this.syncOutputPortsWithRules(portType);
		},
		selectBooleanType(construction: Construction, type: string): void
		{
			Object.assign(construction, { type });
		},
		changeRuleExpression(construction: Construction, props: Object): void
		{
			Object.assign(construction.expression, props);
		},
		/**
		 * Removes a group card of a rule (see deleteConstruction for the rulePort contract).
		 */
		deleteRuleCard(ruleCard: TRuleCard, rulePort: ?RulePort = null): void
		{
			const rule = resolveOperationRule(this.nodeSettings, rulePort, (card) => card === ruleCard);
			if (!rule)
			{
				return;
			}

			// A card of another rule (or an already removed one) must not delete the last card here:
			// indexOf returns -1 and splice(-1, 1) would drop the tail of the current rule.
			const cardIndex = rule.ruleCards.indexOf(ruleCard);
			if (cardIndex === -1)
			{
				return;
			}

			// A mixed legacy card renders its head constructions (base-settings, filter) in the head
			// area while the rest of the card shows as a group: the delete button of that group must
			// not drop the head blocks the user still sees. The card stays holding the head blocks
			// only, so it leaves the group surface but keeps feeding the head area. Its group title
			// is cleared so getNextGroupIndex() no longer counts the hidden card as a group.
			const headConstructions = (ruleCard.constructions ?? []).filter(
				(construction: Construction) => isHeadConstructionType(construction.type),
			);
			if (headConstructions.length > 0)
			{
				this.forgetRequiredFieldsChecks(
					(ruleCard.constructions ?? []).filter(
						(construction: Construction) => !isHeadConstructionType(construction.type),
					),
				);
				Object.assign(ruleCard, {
					constructions: headConstructions,
					groupTitle: '',
				});

				return;
			}

			this.forgetRequiredFieldsChecks(ruleCard.constructions);
			rule.ruleCards.splice(cardIndex, 1);
		},
		/**
		 * Adds a group card to a rule, the target rule of the add panel by default.
		 * Null when that rule has no entry (see resolveHeadRuleCard).
		 */
		addRuleCard(rulePort: ?RulePort = this.toolbarRulePort): TRuleCard | null
		{
			const rule = resolveRuleCollection(this.nodeSettings, rulePort)?.get(rulePort?.id);
			if (!rule)
			{
				return null;
			}

			const ruleCard = this.addRuleCardToRule(rule);
			// A group added from the "more" menu is empty, so only its own row would show it: it opens
			// together with its rule, otherwise the menu item would look like it did nothing.
			if (rulePort)
			{
				this.expandRule(rulePort.id);
			}
			this.expandRuleCard(ruleCard.id);

			return ruleCard;
		},
		/**
		 * Renames a RuleCard group. Falls back to the default title when the new title is empty.
		 * Does nothing while the card belongs to no rule (see deleteConstruction for the rulePort
		 * contract).
		 */
		renameRuleCard(ruleCard: TRuleCard, title: string, rulePort: ?RulePort = null): void
		{
			const rule = resolveOperationRule(this.nodeSettings, rulePort, (card) => card === ruleCard);
			if (!rule)
			{
				return;
			}

			// Empty rename falls back to the next free default index among the OTHER
			// cards — the renamed card's own current title must not occupy its number.
			const otherCards = rule.ruleCards.filter((card) => card !== ruleCard);
			const groupIndex = getNextGroupIndex(otherCards, Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_GROUP_TITLE'));
			const defaultTitle = Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_GROUP_TITLE', { '#N#': groupIndex });
			const groupTitle = title.trim() === '' ? defaultTitle : title.trim();
			Object.assign(ruleCard, { groupTitle });
		},
		/**
		 * Moves a construction inside its card, or a card inside its rule.
		 * rulePort names the rule of the move; without it the rule is the one holding the card the
		 * payload addresses - the dragged item itself when whole cards are moved. The payload names
		 * that card by id (it comes from the DOM), so the match is by id here and not by identity.
		 */
		reorder(payload: OrderPayload, rulePort: ?RulePort = null): void
		{
			const { draggedId, targetId, insertion, ruleCardId } = payload;
			const draggedCardId = ruleCardId ?? draggedId;
			const rule = resolveOperationRule(
				this.nodeSettings,
				rulePort,
				(card) => card.id === draggedCardId,
			);
			if (!rule)
			{
				return;
			}

			let collection = rule.ruleCards;
			let draggedRuleCard = null;
			if (ruleCardId)
			{
				draggedRuleCard = rule.ruleCards.find((currentRuleCard) => currentRuleCard.id === ruleCardId);
				if (!draggedRuleCard)
				{
					return;
				}

				collection = draggedRuleCard.constructions;
			}

			const draggedIndex = collection.findIndex((item) => item.id === draggedId);
			const targetIndex = collection.findIndex((item) => item.id === targetId);
			// Both items must belong to the collection of the dragged one: head constructions of
			// different cards are DOM siblings, so a drop can address a target outside it, and splicing
			// at index -1 would then move the block to an arbitrary position of its own card.
			if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex)
			{
				return;
			}

			const [draggedItem] = collection.splice(draggedIndex, 1);
			const newTargetIndex = collection.findIndex((item) => item.id === targetId);
			const newDraggedIndex = insertion === 'over' ? newTargetIndex : newTargetIndex + 1;
			collection.splice(newDraggedIndex, 0, draggedItem);

			if (draggedRuleCard)
			{
				// The card renders its sections in a fixed order, so a manual move keeps the payload
				// canonical too — same invariant the insertion path holds (findConstructionInsertIndex).
				draggedRuleCard.constructions = sortConstructionsCanonically(draggedRuleCard.constructions);
			}
		},
		async savePortRule(ruleId: string, documentType: Array<string>): Promise<SyncOutputPorts | null>
		{
			const rule = this.nodeSettings.rules.get(ruleId);
			if (!rule)
			{
				return null;
			}

			// Empty groups are not persisted — cards without constructions are dropped
			// from the save payload (a base-settings construction counts as content,
			// so its card is kept). They are merged back below so they do not vanish
			// from the panel right after save; a reopen shows only persisted cards.
			const rulePayload = {
				...rule,
				ruleCards: rule.ruleCards.filter((ruleCard) => ruleCard.constructions.length > 0),
			};

			const transformedPortRule = await complexNodeApi.saveRuleSettings(rulePayload, documentType);
			if (!transformedPortRule)
			{
				throw new Error(`Failed to save port rule: ${ruleId}`);
			}

			// The response contains only the persisted cards in the order they were sent:
			// restore local empty cards at their original positions.
			const savedRuleCards = [...transformedPortRule.ruleCards];
			const mergedRuleCards = rule.ruleCards.map((ruleCard) => (
				ruleCard.constructions.length > 0 ? (savedRuleCards.shift() ?? ruleCard) : ruleCard
			));
			mergedRuleCards.push(...savedRuleCards);

			const mergedPortRule = {
				...transformedPortRule,
				ruleCards: mergedRuleCards,
				isFilled: mergedRuleCards.some((ruleCard) => {
					return ruleCard.constructions?.length > 0;
				}),
			};
			this.nodeSettings.rules.set(ruleId, mergedPortRule);
			// The snapshot is absent while another node is still loading: nothing to mark as saved.
			this.prevSavedNodeSettings?.rules.set(ruleId, Runtime.clone(mergedPortRule));

			return this.syncOutputPortsWithRules(PORT_TYPES.input);
		},
		/**
		 * Output ports the rules of one input kind ask for, against the ones the node has.
		 * The kind is always given by the caller: the rules of the whole node are on screen at once,
		 * so there is no single current one to read it off.
		 */
		syncOutputPortsWithRules(type: string): SyncOutputPorts | null
		{
			if (!this.block)
			{
				return null;
			}

			const settingsItems = type === PORT_TYPES.input
				? this.nodeSettings.rules
				: this.nodeSettings.relations
			;

			const outputConstructions = [...settingsItems.values()].flatMap((r) => {
				return r.ruleCards.flatMap((ruleCard) => {
					return ruleCard.constructions.filter((construction) => construction.type === CONSTRUCTION_TYPES.OUTPUT);
				});
			});

			const outputType = type === PORT_TYPES.input
				? PORT_TYPES.output
				: PORT_TYPES.outputRelation
			;

			const allExistingOutputPortIds = new Set(
				this.ports
					.filter((port) => port.type === outputType)
					.map((port) => port.id),
			);

			const toDeletePortIds = new Set(allExistingOutputPortIds);
			const toAddPortsMap: Map<string, { portId: string, title: string }> = new Map();

			outputConstructions.forEach((construction: OutputConstruction) => {
				const { portId, title } = construction.expression;
				if (!portId || !title)
				{
					return;
				}

				const isPortExist = allExistingOutputPortIds.has(portId);
				if (!isPortExist)
				{
					toAddPortsMap.set(portId, { portId, title });
				}

				toDeletePortIds.delete(portId);
			});

			return {
				outputPortsToAdd: toAddPortsMap,
				outputPortsToDelete: toDeletePortIds,
			};
		},
		async saveRule(ruleId: string, documentType: Array<string>): Promise<void>
		{
			const { outputPortsToAdd } = await this.savePortRule(ruleId, documentType);
			outputPortsToAdd.forEach(({ portId, title }) => {
				this.addRulePort(portId, PORT_TYPES.output, title);
			});
		},
		syncAuxPorts(): void
		{
			const auxSync = this.syncAuxPortsWithActions();
			auxSync?.auxPortsToAdd.forEach(({ portId, title }) => {
				this.addAuxPort(portId, title);
			});
			auxSync?.auxPortsToActivate?.forEach((portId) => {
				this.activatePort(portId);
			});
			auxSync?.auxPortsToDeactivate?.forEach((portId) => {
				this.deletePort(portId);
				diagramStore().deleteConnectionByBlockIdAndPortId(this.block.id, portId);
			});
		},
		// No network call here: server normalizes relation activity settings inside saveSettingsAction().
		syncRelation(relationId: string): void
		{
			const rule = this.nodeSettings.relations.get(relationId);
			if (!rule)
			{
				return;
			}

			rule.isFilled = rule.ruleCards?.some((ruleCard) => {
				return ruleCard.constructions?.length > 0;
			}) ?? false;
			// The snapshot is absent while another node is still loading: nothing to mark as saved.
			this.prevSavedNodeSettings?.relations.set(relationId, Runtime.clone(rule));

			const { outputPortsToAdd, outputPortsToDelete } = this.syncOutputPortsWithRules(PORT_TYPES.inputRelation);
			outputPortsToAdd.forEach(({ portId, title }) => {
				this.addRelationPort(portId, PORT_TYPES.outputRelation, title);
			});
			outputPortsToDelete.forEach((portId) => {
				this.deletePort(portId);
				diagramStore().deleteConnectionByBlockIdAndPortId(this.block.id, portId);
			});
		},
		async saveForm(documentType: string, defaultTitle: string = ''): Promise<ActivityData>
		{
			try
			{
				const nodeSettingsToSave = {
					...this.nodeSettings,
					title: Type.isStringFilled(this.nodeSettings.title)
						? this.nodeSettings.title
						: defaultTitle,
				};

				return await complexNodeApi.saveSettings(
					nodeSettingsToSave,
					this.block.activity,
					documentType,
				);
			}
			catch (e)
			{
				console.error(e);
				throw e;
			}
		},
		discardFormSettings(): void
		{
			// Without a snapshot there is nothing to revert to; keep the form instead of wiping it.
			if (!this.prevSavedNodeSettings)
			{
				return;
			}

			this.nodeSettings = Runtime.clone(this.prevSavedNodeSettings);
		},
		createPort(ports: Array<Port>, { portId, type, label, portTitle }: PortParams): Port
		{
			const lastPort = ports[ports.length - 1] ?? null;
			const [, count] = (lastPort?.title?.split(label) ?? []);
			const title = portTitle ?? `${label}${Number(count ?? 0) + 1}`;

			return {
				id: portId,
				title,
				type,
			};
		},
		addRulePort(portId: string, type: PortTypes, portTitle: ?string): void
		{
			if (![PORT_TYPES.input, PORT_TYPES.output].includes(type))
			{
				return;
			}

			const currentPorts = this.ports.filter((port) => port.type === type);
			const label = type === PORT_TYPES.input
				? COMPLEX_NODE_PORT_LABELS.inputRule
				: COMPLEX_NODE_PORT_LABELS.outputRule
			;

			const port = this.createPort(currentPorts, { portId, type, label, portTitle });
			const addedPortId = parsePortTitle(port.title).id;
			for (let i = currentPorts.length - 1; i >= 0; i--)
			{
				const currentPortId = parsePortTitle(currentPorts[i].title).id;
				if (currentPortId < addedPortId)
				{
					this.ports.splice(this.ports.indexOf(currentPorts[i]) + 1, 0, port);

					return;
				}
			}

			this.ports.unshift(port);
		},
		addRelationPort(portId: ?string, type: PortTypes, portTitle: ?string): void
		{
			if (!portId || ![PORT_TYPES.inputRelation, PORT_TYPES.outputRelation].includes(type))
			{
				return;
			}

			const relationPorts = type === PORT_TYPES.inputRelation
				? this.ports.filter((port) => port.type === PORT_TYPES.inputRelation)
				: this.ports.filter((port) => port.type === PORT_TYPES.outputRelation)
			;
			const port = this.createPort(relationPorts, {
				portId,
				type,
				label: COMPLEX_NODE_PORT_LABELS.relation,
				portTitle,
			});
			this.ports.push({ ...port });
		},
		deletePort(portId: string): void
		{
			const deletedPort = this.ports.find((port) => port.id === portId);
			if (!deletedPort)
			{
				return;
			}

			if (deletedPort.type === PORT_TYPES.aux)
			{
				deletedPort.isActive = false;
				this.resetAuxPortReferencesInRules(portId);

				return;
			}

			this.ports.splice(this.ports.indexOf(deletedPort), 1);
			// The current rule is already null once its own port has been deleted, so a second
			// deletion must not read the id off it.
			if (portId === this.currentRule?.id)
			{
				this.setCurrentRule(null);
			}

			// The add panel picks its target anew (the last of the remaining rules): port ids are
			// reused once the highest port of a node is deleted, so a pick left behind would come
			// back to life on the next port added.
			if (portId === this.selectedRulePortId)
			{
				this.setSelectedRulePort(null);
			}
		},
		activatePort(portId: string): void
		{
			const port = this.ports.find((p) => p.id === portId);
			if (port)
			{
				port.isActive = true;
			}
		},
		resetAuxPortReferencesInRules(portId: string): void
		{
			if (!this.nodeSettings?.rules)
			{
				return;
			}

			this.nodeSettings.rules.forEach((rule) => {
				rule.ruleCards.forEach((ruleCard) => {
					ruleCard.constructions.forEach((construction) => {
						if (
							carriesAuxPortReference(construction)
							&& construction.expression?.auxPortId === portId
						)
						{
							Object.assign(construction.expression, {
								auxPortId: null,
								auxPortTitle: null,
							});
						}
					});
				});
			});
		},
		isAuxPortUsedByActions(portId: PortId): boolean
		{
			return getActionAuxPortIdsFromRules(this.nodeSettings?.rules ?? null).has(portId);
		},
		deactivateAuxPortIfUnused(portId: ?PortId): void
		{
			if (!Type.isStringFilled(portId) || this.isAuxPortUsedByActions(portId))
			{
				return;
			}

			const port = this.ports.find((item) => item.id === portId && item.type === PORT_TYPES.aux);
			if (port)
			{
				port.isActive = false;
			}
		},
		syncAuxPortsWithActions(): SyncAuxPorts | null
		{
			if (!this.block)
			{
				return null;
			}

			const existingAuxPorts = new Map(
				this.ports
					.filter((port) => port.type === PORT_TYPES.aux)
					.map((port) => [port.id, port]),
			);

			const toAddPortsMap: Map<PortId, SyncAuxPort> = new Map();
			const toActivatePortIds: Set<PortId> = new Set();
			const actionAuxPorts: Map<PortId, SyncAuxPort> = getActionAuxPortsFromRules(this.nodeSettings.rules);
			const actionAuxPortIds: Set<PortId> = new Set(actionAuxPorts.keys());
			const savedActionAuxPortIds: Set<PortId> = getActionAuxPortIdsFromActivity(this.block.activity);
			const toDeactivatePortIds: Set<PortId> = new Set(
				[...existingAuxPorts.values()]
					.filter((port) => {
						return savedActionAuxPortIds.has(port.id) && !actionAuxPortIds.has(port.id);
					})
					.map((port) => port.id),
			);

			actionAuxPorts.forEach(({ portId, title }) => {
				if (!portId || !title)
				{
					return;
				}

				const existingPort = existingAuxPorts.get(portId);
				if (!existingPort)
				{
					toAddPortsMap.set(portId, { portId, title });

					return;
				}

				if (existingPort.isActive === false)
				{
					toActivatePortIds.add(portId);
				}
			});

			return {
				auxPortsToAdd: toAddPortsMap,
				auxPortsToActivate: toActivatePortIds,
				auxPortsToDeactivate: toDeactivatePortIds,
			};
		},
		addAuxPort(portId: string, portTitle: ?string): void
		{
			const auxPorts = this.ports.filter((port) => port.type === PORT_TYPES.aux);
			const label = COMPLEX_NODE_PORT_LABELS.aux;
			const port = this.createPort(auxPorts, { portId, type: PORT_TYPES.aux, label, portTitle });
			this.ports.push(port);
		},
	},
});
