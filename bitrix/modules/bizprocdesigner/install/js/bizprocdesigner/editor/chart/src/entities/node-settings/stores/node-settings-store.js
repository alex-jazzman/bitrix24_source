import { defineStore } from 'ui.vue3.pinia';
import { Loc, Runtime, Type } from 'main.core';

import { Feature, FeatureCode } from 'bizprocdesigner.feature';

import {
	PORT_TYPES,
	PORTLESS_RULE_TYPE,
	COMPLEX_NODE_PORT_LABELS,
	NODE_SETTINGS_TABS,
} from '../../../shared/constants';
import { type Block, type PortId, type Port, type PortTypes, type ActivityData } from '../../../shared/types';

import { createUniqueId, parsePortTitle, documentFieldsCache } from '../../../shared/utils';
import { diagramStore } from '../../blocks';
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
import { generateNextInputPortId } from '../utils';
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
import { getNextGroupIndex } from '../utils/group-title';

type AutofillSnapshot = {
	values: Object,
	auto: Array<string>,
};

// The rules container of a node without input ports as the panel selects it: the same fields it reads
// off a port (id, type, title), with a type of its own (see PORTLESS_RULE).
type PortlessRule = {
	id: PortId,
	type: string,
	title: string,
};

type NodesSettingsState = {
	isLoading: boolean;
	isShown: boolean;
	shouldShowWithTransition: boolean;
	currentRule: Port | PortlessRule;
	nodeSettings: NodeSettings | null;
	block: Block | null,
	lastFetchId: number,
	autofillSnapshots: { [constructionId: string]: AutofillSnapshot },
	autofillRequests: { [constructionId: string]: boolean },
};

type FetchNodeSettingsOptions = {
	withTransition?: boolean;
};

type SyncOutputPorts = {
	outputPortsToAdd: Map<PortId, Partial<Port>>,
	outputPortsToDelete: Set<PortId>,
};

type SyncAuxPort = {
	portId: PortId,
	title: string,
};

type SyncAuxPorts = {
	auxPortsToAdd: Map<PortId, SyncAuxPort>,
	auxPortsToActivate: Set<PortId>,
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
const PORTLESS_RULE: PortlessRule = Object.freeze({
	id: PORTLESS_RULES_KEY,
	type: PORTLESS_RULE_TYPE,
	title: '',
});

// Shared read-only fallback of currentSettingsItems: nothing writes through the getter, rules are
// always added to nodeSettings.rules / .relations directly.
const EMPTY_SETTINGS_ITEMS: Map<PortId, Rule> = new Map();

// The subset of NodeSettings the form of a node starts from, before its payload is loaded. Everything
// the payload brings is absent here on purpose: while the load is in flight the form must read nothing
// left from the node shown before it.
const createEmptyNodeSettings = (block: Block) => {
	return {
		title: '',
		description: '',
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
// (ConvertRuleCommand::BASE_SETTINGS_EXCLUDED_PROPERTIES); Title is then written from the action
// dictionary (see buildDefaultActionExpression).
const BASE_SETTINGS_EXCLUDED_PROPERTIES = Object.freeze(['Title', 'EditorComment']);

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

// The part of the base settings an action really inherits: the host metadata stays behind
// (BASE_SETTINGS_EXCLUDED_PROPERTIES), so a state holding nothing else means there is nothing to
// inherit. One helper for both readers of that rule — the decision to inherit
// (resolveActionPrefill) and the expression built from it (buildDefaultActionExpression).
const toInheritedProperties = (baseProperties: ?Object): Object => {
	const properties = { ...(baseProperties ?? {}) };
	BASE_SETTINGS_EXCLUDED_PROPERTIES.forEach((key: string) => {
		delete properties[key];
	});

	return properties;
};

export const useNodeSettingsStore = defineStore('bizprocdesigner-editor-node-settings', {
	state: (): NodesSettingsState => ({
		isLoading: false,
		isSaving: false,
		isShown: false,
		shouldShowWithTransition: false,
		currentRule: null,
		prevSavedNodeSettings: null,
		ports: null,
		nodeSettings: null,
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
	}),
	getters:
	{
		/**
		 * Rules of the current port kind: relation rules for a relation port, plain rules otherwise,
		 * for an input port and for the container of a node without input ports alike (PORTLESS_RULE),
		 * which the transport carries inside the very same collection.
		 * An empty map while the panel holds no port or no loaded node (closed panel, port removed
		 * with the panel open): every consumer already treats a map without the current rule as
		 * "nothing to work on", so this degrades instead of throwing.
		 */
		currentSettingsItems: (state: NodesSettingsState): Map<PortId, Rule> => {
			if (!state.currentRule || !state.nodeSettings)
			{
				return EMPTY_SETTINGS_ITEMS;
			}

			return state.currentRule.type === PORT_TYPES.inputRelation
				? state.nodeSettings.relations
				: state.nodeSettings.rules;
		},
		inputPorts: (state: NodesSettingsState): Array<Port> => {
			return state.ports.filter((port) => port.type === PORT_TYPES.input
				|| port.type === PORT_TYPES.inputRelation);
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
		 * Covers the full state regardless of which port is currently active,
		 * so the uniqueness guard works even when currentRule is an inputRelation port.
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
		 * True when a newly added action may inherit the node's base settings: the current port is an
		 * input one (a relation port keeps its own binding, see addConstruction), the block is
		 * available, the construction exists and its action is part of the node's action catalog (an
		 * action outside it fails the server-side catalog membership check and marks the node as not
		 * filled). The port belongs to the condition: without it a relation port would resolve, and
		 * pay for, a normalization whose result it then drops.
		 */
		canInheritBaseSettings(): boolean
		{
			return this.currentRule?.type === PORT_TYPES.input
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
			return Object.values(state.actionPrefillRequests).some(
				(fetchId: number) => fetchId === state.lastFetchId,
			);
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
				const actionKeys = this.nodeSettings ? [...this.nodeSettings.actions.keys()] : [];

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
			// the base settings of the previously opened node describe nothing here either
			this.resetBaseSettingsProperties();
			this.isLoading = true;
			const workflowDocumentType = diagramStore().documentType;
			const [loaded, defaultTitle] = await Promise.all([
				withWarmDocumentFields(complexNodeApi.loadSettings(block.activity, [], workflowDocumentType)),
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
				filterSupported,
				title: loadedTitle,
				description,
				availableBlocks: loadedAvailableBlocks,
			} = loaded;

			if (this.lastFetchId !== fetchId || !this.nodeSettings)
			{
				return;
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
			let firstRulePort = null;
			this.ports.forEach((port) => {
				if (port.type === PORT_TYPES.input)
				{
					if (!rulesIds.has(port.id))
					{
						this.addRule(port.id);
					}

					if (!firstRulePort)
					{
						firstRulePort = port;
					}

					return;
				}

				if (port.type === PORT_TYPES.inputRelation && !relationsIds.has(port.id))
				{
					this.addRelation(port.id);
				}
			});
			// A node with no input port of any kind keeps its rules in the reserved container instead
			// (see resolvePortlessRule); a node that has them keeps selecting its first input port.
			this.setCurrentRule(this.inputPorts.length > 0 ? firstRulePort : this.resolvePortlessRule(block));

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
		 * time). Null for a node the unified panel does not serve: such a node has no rules surface at
		 * all, and the marker of that comes with the block and is never derived from its type or its
		 * properties.
		 * The container is not a port: it lands in nodeSettings.rules only, never in this.ports, so it
		 * adds no port to the canvas and none to the saved template.
		 */
		resolvePortlessRule(block: Block): PortlessRule | null
		{
			if (block?.node?.servedByUnifiedPanel !== true)
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
			this.shouldShowWithTransition = false;
			this.nodeSettings = null;
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
			this.resetBaseSettingsProperties();
			// Advancing the generation past every fetch and every action prefill in flight: the panel
			// is closed, so their records describe nothing on screen. Without it a prefill that has
			// not landed yet would keep the add surface and the save button of the next node disabled
			// (isResolvingActionPrefill), and a late loadSettings could still hydrate it.
			this.lastFetchId += 1;
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
		setCurrentRule(port: Port): void
		{
			this.currentRule = port;
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

			const formState = { constructionId: construction.id, rawActivityData };
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
		 * Head card of the current rule (see resolveHeadRuleCardForRule).
		 * Null when the current rule has no entry: nothing to add the construction to.
		 */
		resolveHeadRuleCard(): TRuleCard | null
		{
			const rule = this.currentSettingsItems.get(this.currentRule?.id);
			if (!rule)
			{
				return null;
			}

			return this.resolveHeadRuleCardForRule(rule);
		},
		/**
		 * Group card a toolbar chip adds a construction to: the last group while it holds no
		 * construction of that group yet, otherwise a freshly created group.
		 * Null when the current rule has no entry (see resolveHeadRuleCard).
		 */
		resolveGroupRuleCard(constructionType: string): TRuleCard | null
		{
			const rule = this.currentSettingsItems.get(this.currentRule?.id);
			if (!rule)
			{
				return null;
			}

			return findGroupRuleCardForType(rule.ruleCards, constructionType) ?? this.addRuleCardToRule(rule);
		},
		addRule(portId: ?PortId): PortId
		{
			const nextPortId = portId ?? generateNextInputPortId(this.inputPorts);
			this.nodeSettings.rules.set(nextPortId, {
				isFilled: false,
				portId: nextPortId,
				ruleCards: [],
			});

			return nextPortId;
		},
		addRelation(portId: ?PortId): PortId
		{
			const nextPortId = portId ?? generateNextInputPortId(this.inputPorts);
			this.nodeSettings.relations.set(nextPortId, {
				isFilled: false,
				portId: nextPortId,
				ruleCards: [],
			});

			return nextPortId;
		},
		/**
		 * Adds a construction to a card and returns it (null when it was rejected).
		 * actionPrefill pre-fills an action added to an input port from the node's base settings. It is
		 * resolved by the caller (resolveActionPrefill()) because the action form renders from the store
		 * and does not follow later activityData writes, and it is read as given: the decision it holds
		 * was taken before the round trip and must not be recomputed from a state that changed during it.
		 */
		addConstruction(
			ruleCard: TRuleCard,
			constructionType: string,
			actionPrefill: ?ActionPrefill = null,
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
					&& this.currentRule?.type === PORT_TYPES.inputRelation
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

			return newConstruction;
		},
		deleteConstruction(ruleCard: TRuleCard, construction: Construction): void
		{
			// A construction of another card (or an already removed one) must not delete the last block
			// here: indexOf returns -1 and splice(-1, 1) would drop the tail of this card.
			const constructionIndex = ruleCard.constructions.indexOf(construction);
			if (constructionIndex === -1)
			{
				return;
			}

			ruleCard.constructions.splice(constructionIndex, 1);
			if (ruleCard.constructions.length === 0)
			{
				this.deleteRuleCard(ruleCard);
			}
		},
		deleteRuleSettings(ruleId: string): SyncOutputPorts | null
		{
			const isRule = this.nodeSettings.rules.has(ruleId);
			const settingsItems = isRule ? this.nodeSettings.rules : this.nodeSettings.relations;
			settingsItems.delete(ruleId);

			const portType = isRule ? PORT_TYPES.input : PORT_TYPES.inputRelation;

			return this.syncOutputPortsWithRules(portType);
		},
		selectBooleanType(construction: Construction, type: string): void
		{
			Object.assign(construction, { type });
		},
		changeRuleExpression(construction: Construction, props: Partial<Construction['expression']>): void
		{
			Object.assign(construction.expression, props);
		},
		deleteRuleCard(ruleCard: TRuleCard): void
		{
			const rule = this.currentSettingsItems.get(this.currentRule?.id);
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
				ruleCard.constructions = headConstructions;
				ruleCard.groupTitle = '';

				return;
			}

			rule.ruleCards.splice(cardIndex, 1);
		},
		/**
		 * Adds a group card to the current rule.
		 * Null when the current rule has no entry (see resolveHeadRuleCard).
		 */
		addRuleCard(): TRuleCard | null
		{
			const rule = this.currentSettingsItems.get(this.currentRule?.id);
			if (!rule)
			{
				return null;
			}

			return this.addRuleCardToRule(rule);
		},
		/**
		 * Renames a RuleCard group. Falls back to the default title when the new title is empty.
		 * Does nothing while the current rule has no entry (see resolveHeadRuleCard).
		 */
		renameRuleCard(ruleCard: TRuleCard, title: string): void
		{
			const rule = this.currentSettingsItems.get(this.currentRule?.id);
			if (!rule)
			{
				return;
			}

			// Empty rename falls back to the next free default index among the OTHER
			// cards — the renamed card's own current title must not occupy its number.
			const otherCards = rule.ruleCards.filter((card) => card !== ruleCard);
			const groupIndex = getNextGroupIndex(otherCards, Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_GROUP_TITLE'));
			const defaultTitle = Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_GROUP_TITLE', { '#N#': groupIndex });
			ruleCard.groupTitle = title.trim() !== '' ? title.trim() : defaultTitle;
		},
		reorder(payload: OrderPayload): void
		{
			const { draggedId, targetId, insertion, ruleCardId } = payload;
			const rule = this.currentSettingsItems.get(this.currentRule?.id);
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
		syncOutputPortsWithRules(portType?: string): SyncOutputPorts | null
		{
			if (!this.block)
			{
				return null;
			}

			const type = portType ?? this.currentRule?.type;
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

			const auxSync = this.syncAuxPortsWithActions();
			auxSync?.auxPortsToAdd.forEach(({ portId, title }) => {
				this.addAuxPort(portId, title);
			});
			auxSync?.auxPortsToActivate?.forEach((portId) => {
				this.activatePort(portId);
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
		addRelationPort(portId: string, type: PortTypes, portTitle: ?string): void
		{
			if (![PORT_TYPES.inputRelation, PORT_TYPES.outputRelation].includes(type))
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
							construction.type === CONSTRUCTION_TYPES.ACTION
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
		syncAuxPortsWithActions(): SyncAuxPorts | null
		{
			if (!this.block)
			{
				return null;
			}

			const actionConstructions = [...this.nodeSettings.rules.values()].flatMap((r) => {
				return r.ruleCards.flatMap((ruleCard) => {
					return ruleCard.constructions.filter(
						(construction) => construction.type === CONSTRUCTION_TYPES.ACTION
							&& construction.expression.auxPortId,
					);
				});
			});

			const existingAuxPorts = new Map(
				this.ports
					.filter((port) => port.type === PORT_TYPES.aux)
					.map((port) => [port.id, port]),
			);

			const toAddPortsMap: Map<PortId, SyncAuxPort> = new Map();
			const toActivatePortIds: Set<PortId> = new Set();

			actionConstructions.forEach((construction) => {
				const { auxPortId, auxPortTitle } = construction.expression;
				if (!auxPortId || !auxPortTitle)
				{
					return;
				}

				const existingPort = existingAuxPorts.get(auxPortId);
				if (!existingPort)
				{
					toAddPortsMap.set(auxPortId, { portId: auxPortId, title: auxPortTitle });

					return;
				}

				if (existingPort.isActive === false)
				{
					toActivatePortIds.add(auxPortId);
				}
			});

			return {
				auxPortsToAdd: toAddPortsMap,
				auxPortsToActivate: toActivatePortIds,
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
