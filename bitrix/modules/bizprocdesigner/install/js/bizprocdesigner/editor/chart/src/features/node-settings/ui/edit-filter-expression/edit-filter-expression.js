import './style.css';

import { Type, Dom } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { MenuManager } from 'main.popup';
import { markRaw } from 'ui.vue3';
import { mapActions, mapState } from 'ui.vue3.pinia';
import { ConditionGroup, ConditionGroupSelector } from 'bizproc.condition';

import { useLoc } from '../../../../shared/composables';
import { Loader } from '../../../../shared/ui';
import { createUniqueId, filterMetadataCache } from '../../../../shared/utils';
import { PROPERTY_TYPES, EVALUATION_STAGE } from '../../../../shared/constants';
import { EditExtendedAction } from '../edit-extended-action';
import { handleBpSelectorButtonClick } from '../../utils/bp-selector-button';
import {
	closeReadableExpressionPopover,
	mountFormVeneers,
	unmountFormVeneers,
} from '../../utils/readable-expressions-veneer';
import { diagramStore } from '../../../../entities/blocks';
import { ValueSelector } from '../../../../entities/common-node-settings';
import {
	useNodeSettingsStore,
	EVENT_NAMES,
	buildFilterMetadataParams,
	getConnectedBlocksContextForConstruction,
	resolveRuleCollection,
	resolveFilterBackingActivityType,
	resolveFilterContextDocumentType,
	resolveFilterFixedEntityTypeId,
} from '../../../../entities/node-settings';
const FILTER_DOCUMENT_PROPERTY_ID = 'Document';
const CorrectDocumentTypeLength = 3;

const Status = Object.freeze({
	Loading: 'loading',
	Loaded: 'loaded',
	Error: 'error',
});

const EMPTY_CONDITIONS = Object.freeze({ items: [] });

// Without a cap the menu grows by its widest item, and a title plus the name of its place overruns the panel.
const ENTITY_TYPE_MENU_MAX_WIDTH = 472;

const BADGE_CLASS = 'editor-chart-node-settings-edit-filter-expression__badge';
const MENU_ITEM_CLASS = 'editor-chart-node-settings-edit-filter-expression__menu-item';
const MENU_ITEM_TITLE_CLASS = 'editor-chart-node-settings-edit-filter-expression__menu-item-title';

// The menu is drawn into the body, outside the root of the component, so the parts of a row are narrowed
// by the type the row stands for, the way the row itself is - see getEntityTypeMenuItems.
const MENU_ITEM_TITLE_TEST_ID = 'filterEntityTypeSelectItemTitle';
const MENU_ITEM_BADGE_TEST_ID = 'filterEntityTypeSelectItemBadge';

/**
 * Content of a menu item that carries a badge: the badge needs an element of its own, which the `text` of an
 * item cannot give, and a string given to `html` instead would reach the item unescaped.
 */
function renderBadgedMenuItemContent(title: string, badge: string, entityTypeId: string): HTMLElement
{
	return Dom.create('span', {
		props: { className: MENU_ITEM_CLASS },
		children: [
			Dom.create('span', {
				props: { className: MENU_ITEM_TITLE_CLASS, title },
				dataset: { testId: `${MENU_ITEM_TITLE_TEST_ID}-${entityTypeId}` },
				text: title,
			}),
			// The gap of the row is no separator to a screen reader: without a space it reads both names as one.
			document.createTextNode(' '),
			Dom.create('span', {
				props: { className: BADGE_CLASS, title: badge },
				dataset: { testId: `${MENU_ITEM_BADGE_TEST_ID}-${entityTypeId}` },
				text: badge,
			}),
		],
	});
}

// @vue/component
export const EditFilterExpression = {
	name: 'EditFilterExpression',
	components: {
		EditExtendedAction,
		Loader,
	},
	props:
	{
		construction:
		{
			type: Object,
			required: true,
		},
		ruleCard:
		{
			type: Object,
			required: true,
		},
		documentType:
		{
			type: Array,
			required: true,
		},
		template:
		{
			type: [Object, null],
			required: true,
		},
		/**
		 * @type Port | PortlessRule
		 * Rule of the section this filter belongs to. Without it the filter works on the single rule the
		 * panel shows: only the all-rules mode has no single one, and there every section names its own.
		 */
		rulePort:
		{
			type: [Object, null],
			default: null,
		},
		/**
		 * True while the rule of the section has been reached (see isSectionLive). The filter asks the
		 * server for its metadata and renders the legacy condition tree, so all of that waits for the
		 * rule; until then the card keeps its header and shows the committed source as plain text.
		 */
		isLive:
		{
			type: Boolean,
			default: true,
		},
	},
	setup(): { getMessage: () => string }
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	data(): {
		status: $Values<typeof Status>,
		entityTypeOptions: Array<{ value: string, title: string }>,
		filterFieldsMap: Map<string, Array<Object>>,
		documentTypeMap: Map<string, Array<string>>,
		entityTypeBadges: Map<string, string>,
		filteringFieldsPrefix: string,
		currentEntityTypeId: string,
		serializedConditions: Object,
		conditionGroup: ConditionGroup | null,
		conditionGroupSelector: ConditionGroupSelector | null,
		isExpanded: boolean,
		isEntityTypeMenuOpen: boolean,
		lastLoadId: number,
		onBeforeSubmitCallback: Function | null,
	}
	{
		return {
			status: Status.Loading,
			entityTypeOptions: [],
			filterFieldsMap: new Map(),
			documentTypeMap: new Map(),
			entityTypeBadges: new Map(),
			filteringFieldsPrefix: 'dynamic_filter_fields_',
			currentEntityTypeId: '',
			serializedConditions: EMPTY_CONDITIONS,
			conditionGroup: null,
			conditionGroupSelector: null,
			isExpanded: true,
			isEntityTypeMenuOpen: false,
			lastLoadId: 0,
			onBeforeSubmitCallback: null,
		};
	},
	computed:
	{
		...mapState(useNodeSettingsStore, ['nodeSettings', 'block', 'currentRule']),
		Status(): typeof Status
		{
			return Status;
		},
		/** Rule this filter works on: the one of its own section, or the single rule the panel shows. */
		targetRulePort(): Object | null
		{
			return this.rulePort ?? this.currentRule;
		},
		/** Id of that rule, as the context builder and the value selector take it. */
		targetRulePortId(): string | null
		{
			return this.targetRulePort?.id ?? null;
		},
		/** Rules collection the target rule lives in - relation rules are the ones kept apart. */
		targetSettingsItems(): Map | null
		{
			return resolveRuleCollection(this.nodeSettings, this.targetRulePort);
		},
		/** Load failure without a fallback editor: shown as a message inside the live region. */
		isUnsupportedDocument(): boolean
		{
			return this.status === Status.Error && !this.isFallbackActionAvailable;
		},
		/** Filter controls are rendered only once the settings have loaded. */
		isFilterReady(): boolean
		{
			return this.status !== Status.Loading && this.status !== Status.Error;
		},
		connectedBlocks(): Array<Object>
		{
			if (!this.block || !this.targetRulePort)
			{
				return [];
			}

			return getConnectedBlocksContextForConstruction(
				this.block,
				this.targetRulePortId,
				this.ruleCard,
				this.construction,
				this.targetSettingsItems,
			).allBlocks;
		},
		fixedEntityTypeId(): number | null
		{
			return resolveFilterFixedEntityTypeId(this.nodeSettings?.fixedDocumentType);
		},
		backingActivityType(): string
		{
			return resolveFilterBackingActivityType(this.getContextDocumentType());
		},
		/**
		 * Whether the legacy settings dialog can be used as the fallback editor. It is keyed by the
		 * activity type, so an empty backing type must never reach it: the dialog would answer with
		 * "Bad activity type!" printed straight into the block.
		 */
		isFallbackActionAvailable(): boolean
		{
			return Type.isStringFilled(this.backingActivityType);
		},
		filterFields(): Array<Object>
		{
			const fields = this.filterFieldsMap.get(this.currentEntityTypeId);
			if (Type.isArray(fields))
			{
				return fields;
			}

			if (Type.isPlainObject(fields))
			{
				return Object.values(fields);
			}

			return [];
		},
		/** Id of the label the source selector is named by: the control is a div, not a `select`. */
		sourceLabelId(): string
		{
			return `editor-chart-node-settings-filter-source-label-${this.construction.id}`;
		},
		sourceValueId(): string
		{
			return `editor-chart-node-settings-filter-source-value-${this.construction.id}`;
		},
		/** Load-bearing order: `aria-labelledby` replaces the accessible name, so the value follows the label. */
		sourceLabelledBy(): string
		{
			return `${this.sourceLabelId} ${this.sourceValueId}`;
		},
		isEntitySelectorVisible(): boolean
		{
			// The source selector belongs to the loaded state alone: picking another source runs
			// the watcher into syncActivityData(), which writes the construction the fallback owns.
			return this.status === Status.Loaded && this.entityTypeOptions.length >= 2;
		},
		hasSelectedEntityType(): boolean
		{
			return Type.isStringFilled(this.currentEntityTypeId);
		},
		currentEntityTypeTitle(): string
		{
			const selectedOption = this.entityTypeOptions.find((option) => option.value === this.currentEntityTypeId);

			return selectedOption?.title
				?? this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_ITEM_NOT_SELECTED')
			;
		},
		currentEntityTypeBadge(): string
		{
			return this.entityTypeBadges.get(this.currentEntityTypeId) ?? '';
		},
		/**
		 * Source of the filter as its committed data names it: the document the filter publishes carries
		 * the title of the entity that was picked (buildReturnProperties), so a section not yet reached
		 * says what the filter works on without asking the server for the metadata of the entity types.
		 */
		committedSourceTitle(): string
		{
			const documentProperty = this.getCurrentActivityData()?.ReturnProperties?.find(
				(property) => property?.Id === FILTER_DOCUMENT_PROPERTY_ID,
			);

			return Type.isStringFilled(documentProperty?.Name)
				? documentProperty.Name
				: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_ITEM_NOT_SELECTED')
			;
		},
		fallbackActionMeta(): Object
		{
			const properties = {
				DynamicFilterFields: this.getCurrentConditions(),
				ReturnFields: ['ID'],
				OnlyDynamicEntities: this.fixedEntityTypeId ? 'N' : 'Y',
			};

			if (this.fixedEntityTypeId)
			{
				properties.DynamicTypeId = this.fixedEntityTypeId;
			}

			return {
				id: this.backingActivityType,
				title: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_FILTER_EXPRESSION_NAME'),
				handlesDocument: false,
				properties,
			};
		},
	},
	watch:
	{
		currentEntityTypeId(newValue: string, oldValue: string): void
		{
			if (newValue === oldValue)
			{
				return;
			}

			const newDynamicTypeId = Number(newValue);
			const shouldKeepCurrentConditions = (
				!Type.isStringFilled(oldValue)
				&& (
					!Number.isFinite(newDynamicTypeId)
					|| this.getCurrentDynamicTypeId() === newDynamicTypeId
				)
			);
			const nextConditions = shouldKeepCurrentConditions
				? this.getCurrentConditions()
				: EMPTY_CONDITIONS
			;

			this.serializedConditions = nextConditions;
			this.conditionGroup = markRaw(new ConditionGroup(nextConditions));
			this.syncActivityData();
			void this.syncConditionSelectorRendering();
		},
		isLive(isLive: boolean): void
		{
			// A section is reached once and stays reached, so this is the one build of the filter.
			if (isLive)
			{
				this.activate();
			}
		},
	},
	created(): void
	{
		// menu instance must stay non-reactive (main.popup Menu)
		this.entityTypeMenu = null;
	},
	mounted(): void
	{
		if (this.isLive)
		{
			this.activate();
		}
	},
	unmounted(): void
	{
		this.lastLoadId++;
		this.unsubscribe();
		this.destroyConditionSelector();
		this.entityTypeMenu?.close();
		// The fields of the filter go away with the editor without a pass of their own, so the
		// popover of a token would be left in `document.body` bound to an anchor no longer there.
		closeReadableExpressionPopover();
	},
	methods:
	{
		...mapActions(useNodeSettingsStore, ['changeRuleExpression']),

		/**
		 * Builds the filter: its metadata is one request per activity type and its condition tree is a
		 * legacy control, so nothing of that happens until the rule of the section has been reached.
		 * The pre-save flush is subscribed here too - there is nothing to flush while no tree exists.
		 */
		activate(): void
		{
			void this.init();
			this.subscribeOnBeforeSubmit();
		},

		async init(): Promise<void>
		{
			const requestId = ++this.lastLoadId;
			this.status = Status.Loading;

			try
			{
				const metadata = await this.loadMetadata();
				if (requestId !== this.lastLoadId)
				{
					return;
				}

				this.applyMetadata(metadata);
				this.serializedConditions = this.getCurrentConditions();
				this.conditionGroup = markRaw(new ConditionGroup(this.serializedConditions));
				this.currentEntityTypeId = this.resolveCurrentEntityTypeId();
				this.isExpanded = this.getCurrentExpandedState();
				this.status = Status.Loaded;

				if (requestId !== this.lastLoadId)
				{
					return;
				}

				await this.syncConditionSelectorRendering();
				this.syncActivityData();
			}
			catch (error)
			{
				if (requestId === this.lastLoadId)
				{
					// The selector is assigned and subscribed before the render, so a throw out of it
					// leaves the selector alive behind the fallback action the error state shows
					// instead. Both would then own the construction on submit - the fallback writing
					// its rawActivityData into it, this component its activityData.
					this.destroyConditionSelector();
					this.status = Status.Error;
					console.error('Complex node filter direct UI init failed', error);
				}
			}
		},

		async loadMetadata(): Promise<Object>
		{
			// Through the cache of the open node: every filter of one activity type asks the very same
			// question, so the rules of a node share one answer instead of one request each. The cache
			// is also warmed at the load of the node, so the first filter reached costs no round trip.
			const metadata = await filterMetadataCache.load(
				buildFilterMetadataParams(
					this.documentType,
					this.nodeSettings?.fixedDocumentType,
					this.block?.activity?.Type ?? null,
				),
			);

			if (!Type.isPlainObject(metadata))
			{
				throw new Error('Complex node filter metadata is not available.');
			}

			return metadata;
		},

		applyMetadata(metadata: Object): void
		{
			const options = Type.isPlainObject(metadata.entityTypeOptions)
				? metadata.entityTypeOptions
				: {}
			;

			this.entityTypeOptions = Object.entries(options).map(([value, title]) => ({
				value: String(value),
				title: String(title),
			}));

			const fieldsMap = Type.isPlainObject(metadata.filterFieldsMap)
				? metadata.filterFieldsMap
				: {}
			;
			const documentTypeMap = Type.isPlainObject(metadata.documentTypeMap)
				? metadata.documentTypeMap
				: {}
			;
			const badges = Type.isPlainObject(metadata.entityTypeBadges)
				? metadata.entityTypeBadges
				: {}
			;

			this.filterFieldsMap = new Map(
				Object.entries(fieldsMap).map(([entityTypeId, fields]) => [String(entityTypeId), fields]),
			);
			this.documentTypeMap = new Map(
				Object.entries(documentTypeMap).map(([entityTypeId, documentType]) => [String(entityTypeId), documentType]),
			);
			// The empty key is the entry back to "no source chosen", which is this component's own and
			// belongs to no entity type: nothing names it, whatever the answer carries.
			this.entityTypeBadges = new Map(
				Object.entries(badges)
					.filter(([entityTypeId, badge]) => (
						entityTypeId !== '' && Type.isStringFilled(badge) && badge.trim() !== ''
					)),
			);
			this.filteringFieldsPrefix = 'dynamic_filter_fields_';
		},

		getContextDocumentType(): Array<string>
		{
			return resolveFilterContextDocumentType(this.documentType, this.nodeSettings?.fixedDocumentType);
		},

		resolveCurrentEntityTypeId(): string
		{
			const currentDynamicTypeId = this.getCurrentDynamicTypeId();
			const currentDynamicTypeIdString = String(currentDynamicTypeId);
			if (
				currentDynamicTypeId > 0
				&& this.entityTypeOptions.some(({ value }) => value === currentDynamicTypeIdString)
			)
			{
				return currentDynamicTypeIdString;
			}

			if (this.fixedEntityTypeId)
			{
				return String(this.fixedEntityTypeId);
			}

			if (this.entityTypeOptions.length === 1)
			{
				return this.entityTypeOptions[0].value;
			}

			return '';
		},

		getCurrentActivityData(): ?Object
		{
			return Type.isPlainObject(this.construction.expression.activityData)
				? this.construction.expression.activityData
				: null
			;
		},

		getCurrentProperties(): Object
		{
			const properties = this.getCurrentActivityData()?.Properties;

			return Type.isPlainObject(properties) ? properties : {};
		},

		getCurrentDynamicTypeId(): number
		{
			const properties = this.getCurrentProperties();
			const dynamicTypeId = Number(properties.DynamicTypeId ?? this.fixedEntityTypeId ?? 0);

			return dynamicTypeId > 0 ? dynamicTypeId : 0;
		},

		getCurrentConditions(): Object
		{
			const properties = this.getCurrentProperties();

			return Type.isPlainObject(properties.DynamicFilterFields)
				? properties.DynamicFilterFields
				: { items: [] }
			;
		},

		getCurrentExpandedState(): boolean
		{
			const properties = this.getCurrentProperties();

			return properties.FilterIsExpanded !== 'N';
		},

		renderConditionSelector(): void
		{
			if (
				this.conditionGroupSelector
				|| !this.$refs.filterFieldsContainer
				|| !this.conditionGroup
				|| !this.hasSelectedEntityType
			)
			{
				return;
			}

			this.conditionGroupSelector = markRaw(new ConditionGroupSelector(this.conditionGroup, {
				fields: this.filterFields,
				fieldPrefix: this.filteringFieldsPrefix,
				documentType: this.getFilterDocumentType(),
				customSelectorFn: this.showFieldSelector.bind(this),
				viewMode: 'new',
				caption: {
					head: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_FILTER_FIELDS'),
					collapsed: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_FILTER_FIELDS_COLLAPSED'),
				},
				isExpanded: this.isExpanded,
			}));

			this.conditionGroupSelector.subscribe('onChange', (event) => {
				this.serializedConditions = event.getData().value;
				this.syncActivityData();
				// A change repaints the value control, and the blocks of the node context may have
				// moved on since the render: the pass covers the new field and refreshes the context.
				mountFormVeneers(this.$refs.filterFieldsContainer, this.connectedBlocks);
			});

			Dom.clean(this.$refs.filterFieldsContainer);
			Dom.append(this.conditionGroupSelector.createNode(), this.$refs.filterFieldsContainer);
			// One pass is enough: the veneer watches the container itself and covers the rows the
			// condition tree adds later — a new condition, another value control after a field change.
			mountFormVeneers(this.$refs.filterFieldsContainer, this.connectedBlocks);
		},

		async syncConditionSelectorRendering(): Promise<void>
		{
			await this.$nextTick();

			if (this.status !== Status.Loaded)
			{
				return;
			}

			if (!this.hasSelectedEntityType)
			{
				this.destroyConditionSelector();

				return;
			}

			this.rebuildConditionSelector();
		},

		rebuildConditionSelector(): void
		{
			this.destroyConditionSelector();
			this.renderConditionSelector();
		},

		destroyConditionSelector(): void
		{
			unmountFormVeneers(this.$refs.filterFieldsContainer);

			if (this.conditionGroupSelector)
			{
				this.conditionGroupSelector.destroy();
				this.conditionGroupSelector = null;
			}

			if (this.$refs.filterFieldsContainer)
			{
				Dom.clean(this.$refs.filterFieldsContainer);
			}
		},

		onShowEntityTypeMenu({ currentTarget }: PointerEvent | KeyboardEvent): void
		{
			// toggle: a second click or key press on the control closes the open list
			if (this.entityTypeMenu)
			{
				this.entityTypeMenu.close();

				return;
			}

			this.entityTypeMenu = MenuManager.create({
				id: `filter-entity-type-menu-${this.construction.id}`,
				bindElement: currentTarget,
				items: this.getEntityTypeMenuItems(),
				maxHeight: 200,
				maxWidth: ENTITY_TYPE_MENU_MAX_WIDTH,
				closeByEsc: true,
				autoHide: true,
				cacheable: false,
				events: {
					onShow: () => {
						this.isEntityTypeMenuOpen = true;
					},
					onClose: () => this.handleEntityTypeMenuClose(),
				},
			});
			this.entityTypeMenu.show();
		},

		handleEntityTypeMenuClose(): void
		{
			this.isEntityTypeMenuOpen = false;
			this.entityTypeMenu = null;
			// return focus to the control unless the user moved it elsewhere
			const active = document.activeElement;
			if (!active || active === document.body)
			{
				this.$refs.entityTypeSelect?.focus();
			}
		},

		getEntityTypeMenuItems(): Array<Object>
		{
			// The empty entry comes first: it is the only way back to «no source chosen».
			const options = [
				{
					value: '',
					title: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_ITEM_NOT_SELECTED'),
				},
				...this.entityTypeOptions,
			];

			return options.map(({ value, title }) => {
				const badge = this.entityTypeBadges.get(value) ?? '';
				// The cap of the menu cuts a long row with an ellipsis, so every row carries its full text: a
				// badged one on the spans of its own, a plain one on the `title` the item puts on itself.
				const content = badge === ''
					? { text: title, title }
					: { html: renderBadgedMenuItemContent(title, badge, value) }
				;

				return {
					id: `filter-entity-type-${value || 'none'}`,
					...content,
					dataset: { testId: `filterEntityTypeSelectItem-${value}` },
					onclick: () => {
						this.currentEntityTypeId = value;
						this.entityTypeMenu?.close();
					},
				};
			});
		},

		showFieldSelector(targetInputId: string): void
		{
			const targetElement = document.getElementById(targetInputId);
			if (!targetElement || !this.block)
			{
				return;
			}

			const selector = new ValueSelector(
				diagramStore(),
				this.block,
				this.targetRulePortId,
				this.connectedBlocks,
				// The results of a filter are published onto the activity of a running workflow, so its
				// fields keep the full set of template sources even under a trigger.
				EVALUATION_STAGE.IN_STARTED_WORKFLOW,
			);

			selector
				.show(targetElement)
				.then((value: string) => {
					if (!Type.isStringFilled(value))
					{
						return;
					}

					const caretPosition = targetElement.selectionEnd ?? targetElement.value.length;
					const beforePart = targetElement.value.slice(0, caretPosition);
					const afterPart = targetElement.value.slice(caretPosition);

					targetElement.value = beforePart + value + afterPart;
					targetElement.selectionEnd = beforePart.length + value.length;
					targetElement.focus();
					targetElement.dispatchEvent(new window.Event('change'));
				})
				.catch((error) => console.error(error))
			;
		},

		/**
		 * Value controls of types without a local renderer are painted by the server, and its markup
		 * carries a selector button whose only handler is the inline global `BPAShowSelector` of the
		 * legacy dialog. That markup arrives after the row has been built, so the row cannot bind to the
		 * button: the click is taken here by delegation, with the context the filter builds its own
		 * selector with.
		 */
		onValueSelectorClick(event: MouseEvent): void
		{
			handleBpSelectorButtonClick(event, {
				form: this.$refs.filterFieldsContainer,
				store: diagramStore(),
				block: this.block,
				portId: this.targetRulePortId,
				connectedBlocks: this.connectedBlocks,
				evaluationStage: EVALUATION_STAGE.IN_STARTED_WORKFLOW,
				onChange: () => this.flushConditions(),
			});
		},

		/** Read the conditions off the block and carry them into the construction. */
		flushConditions(): void
		{
			if (!this.conditionGroupSelector)
			{
				return;
			}

			this.serializedConditions = this.conditionGroupSelector.getValue();
			this.syncActivityData();
		},

		syncActivityData(): void
		{
			if (!this.hasSelectedEntityType)
			{
				this.changeRuleExpression(this.construction, {
					actionId: this.backingActivityType,
					activityData: null,
				});

				return;
			}

			const rawDynamicTypeId = Number(this.currentEntityTypeId);
			this.changeRuleExpression(this.construction, {
				actionId: this.backingActivityType,
				activityData: this.buildActivityData({
					dynamicTypeId: Number.isFinite(rawDynamicTypeId) ? rawDynamicTypeId : 0,
					conditions: this.getSerializedConditions(),
					isExpanded: this.isExpanded,
				}),
			});
		},

		getSerializedConditions(): Object
		{
			if (Type.isPlainObject(this.serializedConditions))
			{
				return this.serializedConditions;
			}

			return Type.isFunction(this.conditionGroup?.serialize)
				? this.conditionGroup.serialize()
				: EMPTY_CONDITIONS
			;
		},

		buildActivityData({
			dynamicTypeId,
			conditions,
			isExpanded,
		}: {
			dynamicTypeId: number,
			conditions: Object,
			isExpanded: boolean,
		}): Object
		{
			const currentActivityData = this.getCurrentActivityData() ?? {};
			const currentProperties = Type.isPlainObject(currentActivityData.Properties)
				? currentActivityData.Properties
				: {}
			;
			const previousDynamicTypeId = Number(currentProperties.DynamicTypeId ?? 0);
			const currentReturnProperties = Type.isArray(currentActivityData.ReturnProperties)
				? currentActivityData.ReturnProperties
				: []
			;

			return {
				...currentActivityData,
				Name: Type.isStringFilled(currentActivityData.Name)
					? currentActivityData.Name
					: createUniqueId(),
				Type: this.backingActivityType,
				Activated: currentActivityData.Activated ?? 'Y',
				Properties: {
					...currentProperties,
					Title: currentProperties.Title ?? this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_FILTER_EXPRESSION_NAME'),
					DynamicTypeId: dynamicTypeId,
					DynamicFilterFields: conditions,
					ReturnFields: Type.isArrayFilled(currentProperties.ReturnFields)
						? currentProperties.ReturnFields
						: ['ID'],
					OnlyDynamicEntities: this.fixedEntityTypeId ? 'N' : 'Y',
					FilterIsExpanded: isExpanded ? 'Y' : 'N',
				},
				ReturnProperties: previousDynamicTypeId === dynamicTypeId && currentReturnProperties.length > 0
					? currentReturnProperties
					: this.buildReturnProperties(dynamicTypeId),
			};
		},

		buildReturnProperties(dynamicTypeId: number): Array<Object>
		{
			const documentType = this.resolveReturnDocumentType(dynamicTypeId);
			if (!Type.isArrayFilled(documentType))
			{
				return [];
			}

			const entityTitle = this.entityTypeOptions
				.find((option) => option.value === this.currentEntityTypeId)?.title
				?? this.getMessage('BIZPROCDESIGNER_EDITOR_DOCUMENT')
			;

			return [{
				Id: FILTER_DOCUMENT_PROPERTY_ID,
				Name: entityTitle,
				Type: PROPERTY_TYPES.DOCUMENT,
				Multiple: false,
				Default: documentType,
			}];
		},

		// Value controls of types without a local renderer are drawn server-side, and the server
		// needs the document type of the entity the filter selects - not the one of the node.
		getFilterDocumentType(): ?Array<string>
		{
			return this.resolveReturnDocumentType(Number(this.currentEntityTypeId));
		},

		resolveReturnDocumentType(dynamicTypeId: number): ?Array<string>
		{
			const currentActivityData = this.getCurrentActivityData();
			const currentProperties = this.getCurrentProperties();
			const previousDynamicTypeId = Number(currentProperties.DynamicTypeId ?? 0);

			if (previousDynamicTypeId === dynamicTypeId)
			{
				const documentProperty = currentActivityData?.ReturnProperties?.find(
					(property) => property?.Id === FILTER_DOCUMENT_PROPERTY_ID && Type.isArrayFilled(property?.Default),
				);
				if (documentProperty)
				{
					return documentProperty.Default;
				}
			}

			if (this.documentTypeMap.has(this.currentEntityTypeId))
			{
				return this.documentTypeMap.get(this.currentEntityTypeId);
			}

			if (this.nodeSettings?.fixedDocumentType?.length === CorrectDocumentTypeLength)
			{
				return this.nodeSettings.fixedDocumentType;
			}

			return Type.isArrayFilled(this.documentType) ? this.documentType : null;
		},

		subscribeOnBeforeSubmit(): void
		{
			this.unsubscribe();
			this.onBeforeSubmitCallback = () => this.flushConditions();
			EventEmitter.subscribe(EVENT_NAMES.BEFORE_SUBMIT_EVENT, this.onBeforeSubmitCallback);
		},

		unsubscribe(): void
		{
			if (this.onBeforeSubmitCallback)
			{
				EventEmitter.unsubscribe(EVENT_NAMES.BEFORE_SUBMIT_EVENT, this.onBeforeSubmitCallback);
			}
		},
	},
	template: `
		<div
			class="editor-chart-node-settings-edit-filter-expression"
			data-testid="bizprocdesigner-filter-expression"
			:data-test-id="$testId('filterSelectionCard')"
		>
			<!--
				Same dropdown as the rest of the node settings panel (edit-condition-expression,
				edit-action-expression): the value is a plain element of the control and the options
				are a main.popup menu - a native select inside the ui-ctl wrapper is drawn by the
				browser and never matches the control it is framed by. What that native select
				gave for free is stated here instead: the role, the place in the tab order, the keys
				that open the list and the label it is named by.
			-->
			<div
				v-if="isEntitySelectorVisible"
				class="editor-chart-node-settings-edit-filter-expression__item"
			>
				<span
					:id="sourceLabelId"
					class="editor-chart-node-settings-edit-filter-expression__label"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_FILTER_SOURCE_LABEL') }}
				</span>
				<div
					ref="entityTypeSelect"
					class="editor-chart-node-settings-edit-filter-expression__source-selector ui-ctl ui-ctl-after-icon ui-ctl-dropdown"
					:data-test-id="$testId('filterEntityTypeSelect')"
					role="button"
					tabindex="0"
					aria-haspopup="true"
					:aria-expanded="isEntityTypeMenuOpen ? 'true' : 'false'"
					:aria-labelledby="sourceLabelledBy"
					@click="onShowEntityTypeMenu"
					@keydown.enter.prevent="onShowEntityTypeMenu"
					@keydown.space.prevent="onShowEntityTypeMenu"
				>
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
					<div
						:id="sourceValueId"
						class="ui-ctl-element editor-chart-node-settings-edit-filter-expression__source-value"
						:class="{ '--with-badge': currentEntityTypeBadge !== '' }"
						:data-test-id="$testId('filterEntityTypeSelectValue')"
					>
						<template v-if="currentEntityTypeBadge !== ''">
							<span
								class="editor-chart-node-settings-edit-filter-expression__source-title"
								:title="currentEntityTypeTitle"
								:data-test-id="$testId('filterEntityTypeSelectTitle')"
							>{{ currentEntityTypeTitle }}</span>{{ ' ' }}<span
								class="editor-chart-node-settings-edit-filter-expression__badge"
								:title="currentEntityTypeBadge"
								:data-test-id="$testId('filterEntityTypeSelectBadge')"
							>{{ currentEntityTypeBadge }}</span>
						</template>
						<template v-else>{{ currentEntityTypeTitle }}</template>
					</div>
				</div>
			</div>
			<!--
				Until the rule of the section is reached the filter itself is not built (see the
				isLive prop): the block shows the source the committed data names, the way a condition
				shows its committed value.
			-->
			<div
				v-if="!isLive"
				class="editor-chart-node-settings-edit-filter-expression__preview"
				data-testid="bizprocdesigner-filter-expression-preview"
				:data-test-id="$testId('filterPreview')"
			>
				<div class="ui-ctl ui-ctl-textbox">
					<div class="ui-ctl-element">{{ committedSourceTitle }}</div>
				</div>
			</div>
			<!--
				Live region: announces loading/error status changes to screen readers. Kept mounted
				across the whole loading-to-error transition, and left out once there is no status
				left to show. The delete control is not one of these branches: it belongs to the
				header of rule-construction, above this area, so a block whose metadata never
				arrived stays removable.
			-->
			<div
				v-else-if="status === Status.Loading || isUnsupportedDocument"
				class="editor-chart-node-settings-edit-filter-expression__status"
				data-testid="bizprocdesigner-filter-expression-status"
				aria-live="polite"
			>
				<div
					v-if="status === Status.Loading"
					class="editor-chart-node-settings-edit-filter-expression__loader"
					data-testid="bizprocdesigner-filter-expression-loader"
				>
					<Loader />
				</div>
				<div
					v-if="isUnsupportedDocument"
					class="editor-chart-node-settings-edit-filter-expression__error"
					data-testid="bizprocdesigner-filter-expression-error"
				>
					{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_FILTER_UNSUPPORTED_DOCUMENT') }}
				</div>
			</div>
			<!--
				The legacy field layout of EditExtendedAction lives under .node-settings-panel: it is
				what puts the selector button and the expression-builder trigger at the right edge of
				the field and reserves the room for them. Same wrapper as the main path in
				edit-action-expression. The __fallback class carries no styles: it is the selector
				of tests/unit/filter-render-failure.test.js.
			-->
			<div
				v-else-if="status === Status.Error && isFallbackActionAvailable"
				class="editor-chart-node-settings-edit-filter-expression__fallback node-settings-panel"
				data-testid="bizprocdesigner-filter-expression-fallback"
			>
				<EditExtendedAction
					:actionId="fallbackActionMeta.id"
					:actionMeta="fallbackActionMeta"
					:activityData="construction.expression.activityData"
					:construction="construction"
					:documentType="documentType"
					:ruleCard="ruleCard"
					:rulePort="targetRulePort"
					:template="template"
				/>
			</div>
			<div
				v-else-if="isFilterReady && hasSelectedEntityType"
				class="editor-chart-node-settings-edit-filter-expression__condition-container"
			>
				<div
					ref="filterFieldsContainer"
					:data-test-id="$testId('filterFieldsContainer')"
					@click.capture="onValueSelectorClick"
				></div>
			</div>
		</div>
	`,
};
