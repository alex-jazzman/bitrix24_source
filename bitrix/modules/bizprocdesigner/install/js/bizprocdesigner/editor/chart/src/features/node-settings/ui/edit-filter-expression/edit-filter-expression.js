import './style.css';

import { Type, Dom, Event, Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { markRaw } from 'ui.vue3';
import { mapActions, mapState } from 'ui.vue3.pinia';
import {
	Context,
	ConditionGroup,
	ConditionGroupSelector,
	Document,
	tryGetGlobalContext,
	setGlobalContext,
} from 'bizproc.automation';

import { useLoc } from '../../../../shared/composables';
import { editorAPI } from '../../../../shared/api';
import { Loader } from '../../../../shared/ui';
import { createUniqueId, deepEqual } from '../../../../shared/utils';
import { PROPERTY_TYPES } from '../../../../shared/constants';
import { EditExtendedAction } from '../edit-extended-action';
import {
	useNodeSettingsStore,
	EVENT_NAMES,
	NODE_FILTER_BACKING_ACTIVITY_TYPES,
} from '../../../../entities/node-settings';
const FILTER_DOCUMENT_PROPERTY_ID = 'Document';
const CorrectDocumentTypeLength = 3;

const Status = Object.freeze({
	Loading: 'loading',
	Loaded: 'loaded',
	Error: 'error',
});

const CRM_ENTITY_TYPE_IDS = Object.freeze({
	LEAD: 1,
	DEAL: 2,
	CONTACT: 3,
	COMPANY: 4,
	QUOTE: 7,
	SMART_INVOICE: 31,
});

const EMPTY_CONDITIONS = Object.freeze({ items: [] });

const queueMicrotaskSafe = (callback: () => void): void => {
	if (Type.isFunction(window.queueMicrotask))
	{
		window.queueMicrotask(callback);

		return;
	}

	void Promise.resolve().then(callback);
};

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
	},
	setup(): { getMessage: () => string; }
	{
		const { getMessage } = useLoc();

		return { getMessage };
	},
	data(): {
		status: $Values<typeof Status>,
		entityTypeOptions: Array<{ value: string, title: string }>,
		filterFieldsMap: Map<string, Array<Object>>,
		documentTypeMap: Map<string, Array<string>>,
		documentFields: Array<Object>,
		documentName: string,
		filteringFieldsPrefix: string,
		currentEntityTypeId: string,
		serializedConditions: Object,
		conditionGroup: ConditionGroup | null,
		conditionGroupSelector: ConditionGroupSelector | null,
		isExpanded: boolean,
		lastLoadId: number,
		selectorInteractionHandler: Function | null,
		selectorStateObserver: MutationObserver | null,
		isSelectorStateSyncQueued: boolean,
		onBeforeSubmitCallback: Function | null,
	}
	{
		return {
			status: Status.Loading,
			entityTypeOptions: [],
			filterFieldsMap: new Map(),
			documentTypeMap: new Map(),
			documentFields: [],
			documentName: '',
			filteringFieldsPrefix: 'dynamic_filter_fields_',
			currentEntityTypeId: '',
			serializedConditions: EMPTY_CONDITIONS,
			conditionGroup: null,
			conditionGroupSelector: null,
			isExpanded: true,
			lastLoadId: 0,
			selectorInteractionHandler: null,
			selectorStateObserver: null,
			isSelectorStateSyncQueued: false,
			onBeforeSubmitCallback: null,
		};
	},
	computed:
	{
		...mapState(useNodeSettingsStore, ['nodeSettings']),
		Status(): typeof Status
		{
			return Status;
		},
		fixedEntityTypeId(): number | null
		{
			const fixedDocumentType = this.nodeSettings?.fixedDocumentType ?? [];
			const entityCode = fixedDocumentType?.[2] ?? '';

			return CRM_ENTITY_TYPE_IDS[entityCode] ?? null;
		},
		backingActivityType(): string
		{
			const documentType = this.getContextDocumentType();
			const moduleId = Type.isArrayFilled(documentType) ? String(documentType[0]) : '';

			return NODE_FILTER_BACKING_ACTIVITY_TYPES[moduleId] ?? '';
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
		isEntitySelectorVisible(): boolean
		{
			return !this.fixedEntityTypeId && this.entityTypeOptions.length !== 1;
		},
		hasSelectedEntityType(): boolean
		{
			return Type.isStringFilled(this.currentEntityTypeId);
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
	},
	mounted(): void
	{
		void this.init();
		this.subscribeOnBeforeSubmit();
	},
	unmounted(): void
	{
		this.lastLoadId++;
		this.unsubscribe();
		this.destroyConditionSelector();
	},
	methods:
	{
		...mapActions(useNodeSettingsStore, ['changeRuleExpression']),

		async init(): Promise<void>
		{
			const requestId = ++this.lastLoadId;
			this.status = Status.Loading;

			try
			{
				this.initWorkflowGlobals();
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
				this.initAutomationContext();
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
					this.status = Status.Error;
					console.error('Complex node filter direct UI init failed', error);
				}
			}
		},

		async loadMetadata(): Promise<Object>
		{
			const documentType = this.getContextDocumentType();
			const metadata = await editorAPI.getNodeFilterMetadata({
				activityType: this.backingActivityType,
				documentType,
				onlyDynamicEntities: !this.fixedEntityTypeId,
			});

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

			this.filterFieldsMap = new Map(
				Object.entries(fieldsMap).map(([entityTypeId, fields]) => [String(entityTypeId), fields]),
			);
			this.documentTypeMap = new Map(
				Object.entries(documentTypeMap).map(([entityTypeId, documentType]) => [String(entityTypeId), documentType]),
			);
			this.documentFields = Type.isArray(metadata.documentFields) ? metadata.documentFields : [];
			this.documentName = Type.isStringFilled(metadata.documentName) ? metadata.documentName : '';
			this.filteringFieldsPrefix = 'dynamic_filter_fields_';
		},

		getContextDocumentType(): Array<string>
		{
			if (!Type.isArrayFilled(this.nodeSettings?.fixedDocumentType))
			{
				return this.documentType;
			}

			return this.nodeSettings.fixedDocumentType.length < CorrectDocumentTypeLength
				? this.documentType
				: this.nodeSettings.fixedDocumentType
			;
		},

		resolveCurrentEntityTypeId(): string
		{
			if (this.fixedEntityTypeId)
			{
				return String(this.fixedEntityTypeId);
			}

			const currentDynamicTypeId = this.getCurrentDynamicTypeId();
			if (currentDynamicTypeId > 0)
			{
				return String(currentDynamicTypeId);
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

		initAutomationContext(): void
		{
			const contextDocumentType = this.getContextDocumentType();

			const currentContext = tryGetGlobalContext();
			const currentDocument = currentContext?.document ?? null;
			const isSameDocument = (
				currentDocument
				&& deepEqual(currentDocument.rawDocumentType, contextDocumentType)
				&& deepEqual(currentDocument.documentFields, this.documentFields)
			);

			if (!isSameDocument)
			{
				const document = new Document({
					rawDocumentType: contextDocumentType,
					documentFields: this.documentFields,
					title: this.documentName,
				});
				const contextValues = currentContext?.getValues?.() ?? {};
				setGlobalContext(new Context({
					...contextValues,
					document,
				}));
			}

			if (
				BX?.Bizproc?.Automation?.API
				&& !deepEqual(BX.Bizproc.Automation.API.documentType, contextDocumentType)
			)
			{
				BX.Bizproc.Automation.API.documentType = contextDocumentType;
			}
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
				onOpenMenu: this.onOpenFilterFieldsMenu,
				customSelector: Type.isFunction(window.BPAShowSelector)
					? this.showFieldSelector
					: null,
				caption: {
					head: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_FILTER_FIELDS'),
					collapsed: this.getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_FILTER_FIELDS_COLLAPSED'),
				},
				isExpanded: this.isExpanded,
			}));

			this.conditionGroupSelector.subscribe('onToggleGroupViewClick', (event) => {
				this.isExpanded = event.getData().isExpanded;
				this.syncActivityData();
			});

			Dom.clean(this.$refs.filterFieldsContainer);
			Dom.append(this.conditionGroupSelector.createNode(), this.$refs.filterFieldsContainer);
			this.bindSelectorStateTracking();
			this.observeConditionSelectorState();
			this.queueSelectorStateSync();
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
			this.unbindSelectorStateTracking();
			this.disconnectConditionSelectorObserver();
			this.isSelectorStateSyncQueued = false;

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

		bindSelectorStateTracking(): void
		{
			if (!this.$refs.filterFieldsContainer)
			{
				return;
			}

			this.selectorInteractionHandler ??= () => {
				this.queueSelectorStateSync();
			};

			Event.bind(this.$refs.filterFieldsContainer, 'input', this.selectorInteractionHandler);
			Event.bind(this.$refs.filterFieldsContainer, 'change', this.selectorInteractionHandler);
		},

		unbindSelectorStateTracking(): void
		{
			if (!this.$refs.filterFieldsContainer || !this.selectorInteractionHandler)
			{
				return;
			}

			Event.unbind(this.$refs.filterFieldsContainer, 'input', this.selectorInteractionHandler);
			Event.unbind(this.$refs.filterFieldsContainer, 'change', this.selectorInteractionHandler);
		},

		observeConditionSelectorState(): void
		{
			if (!this.$refs.filterFieldsContainer)
			{
				return;
			}

			this.disconnectConditionSelectorObserver();
			this.selectorStateObserver = new MutationObserver(() => {
				this.queueSelectorStateSync();
			});

			this.selectorStateObserver.observe(this.$refs.filterFieldsContainer, {
				subtree: true,
				childList: true,
			});
		},

		disconnectConditionSelectorObserver(): void
		{
			if (this.selectorStateObserver)
			{
				this.selectorStateObserver.disconnect();
				this.selectorStateObserver = null;
			}
		},

		queueSelectorStateSync(): void
		{
			if (this.isSelectorStateSyncQueued)
			{
				return;
			}

			this.isSelectorStateSyncQueued = true;
			queueMicrotaskSafe(() => {
				this.isSelectorStateSyncQueued = false;

				if (!this.conditionGroupSelector)
				{
					return;
				}

				this.syncSelectorStateFromDom();
			});
		},

		showFieldSelector(targetInputId: string): void
		{
			window.BPAShowSelector(targetInputId, 'string', '');
		},

		initWorkflowGlobals(): void
		{
			window.arWorkflowParameters = this.template?.PARAMETERS ?? {};
			window.arWorkflowVariables = this.template?.VARIABLES ?? {};
			window.arWorkflowConstants = this.template?.CONSTANTS ?? {};
		},

		onOpenFilterFieldsMenu(event: Object): void
		{
			this.addBPFields(event.getData().selector);
		},

		addBPFields(selector: Object): void
		{
			const getSelectorProperties = ({ properties, objectName, expressionPrefix }): Array<Object> => {
				if (Type.isObject(properties))
				{
					return Object.entries(properties).map(([id, property]) => ({
						id,
						title: property.Name,
						customData: {
							field: {
								Id: id,
								Type: property.Type,
								Name: property.Name,
								ObjectName: objectName,
								SystemExpression: `{=${objectName}:${id}}`,
								Expression: expressionPrefix
									? `{{${expressionPrefix}:${id}}}`
									: `{=${objectName}:${id}}`,
							},
						},
					}));
				}

				return [];
			};
			const getGlobalSelectorProperties = ({ properties, visibilityNames, objectName }): Array<Object> => {
				if (Type.isObject(properties))
				{
					return Object.entries(properties).map(([id, property]) => {
						const field = {
							id,
							Type: property.Type,
							title: property.Name,
							ObjectName: objectName,
							SystemExpression: `{=${objectName}:${id}}`,
							Expression: `{=${objectName}:${id}}`,
						};

						if (property.Visibility && visibilityNames[property.Visibility])
						{
							field.Expression = `{{${visibilityNames[property.Visibility]}: ${property.Name}}}`;
						}

						return {
							id,
							title: property.Name,
							supertitle: visibilityNames[property.Visibility],
							customData: { field },
						};
					});
				}

				return [];
			};

			selector.addGroup('workflowParameters', {
				id: 'workflowParameters',
				title: Loc.getMessage('BIZPROC_WFEDIT_MENU_PARAMS'),
				children: [
					{
						id: 'parameters',
						title: Loc.getMessage('BIZPROC_AUTOMATION_CMP_PARAMETERS_LIST'),
						children: getSelectorProperties({
							properties: window.arWorkflowParameters || {},
							objectName: 'Template',
							expressionPrefix: '~*',
						}),
					},
					{
						id: 'variables',
						title: Loc.getMessage('BIZPROC_AUTOMATION_CMP_GLOB_VARIABLES_LIST_1'),
						children: getSelectorProperties({
							properties: window.arWorkflowVariables || {},
							objectName: 'Variable',
						}),
					},
					{
						id: 'constants',
						title: Loc.getMessage('BIZPROC_AUTOMATION_CMP_CONSTANTS_LIST'),
						children: getSelectorProperties({
							properties: window.arWorkflowConstants || {},
							objectName: 'Constant',
							expressionPrefix: '~&',
						}),
					},
				],
			});

			if (window.arWorkflowGlobalVariables && window.wfGVarVisibilityNames)
			{
				selector.addGroup('globalVariables', {
					id: 'globalVariables',
					title: Loc.getMessage('BIZPROC_AUTOMATION_CMP_GLOB_VARIABLES_LIST'),
					children: getGlobalSelectorProperties({
						properties: window.arWorkflowGlobalVariables || {},
						visibilityNames: window.wfGVarVisibilityNames || {},
						objectName: 'GlobalVar',
					}),
				});
			}

			selector.addGroup('globalConstants', {
				id: 'globalConstants',
				title: Loc.getMessage('BIZPROC_AUTOMATION_CMP_GLOB_CONSTANTS_LIST'),
				children: getGlobalSelectorProperties({
					properties: window.arWorkflowGlobalConstants || {},
					visibilityNames: window.wfGConstVisibilityNames || {},
					objectName: 'GlobalConst',
				}),
			});
		},

		syncSelectorStateFromDom(force: boolean = false): void
		{
			const nextConditions = this.readConditionsFromSelectorDom();

			if (!force && deepEqual(this.serializedConditions, nextConditions))
			{
				return;
			}

			this.serializedConditions = nextConditions;
			this.syncActivityData();
		},

		readConditionsFromSelectorDom(): Object
		{
			const container = this.$refs.filterFieldsContainer;
			if (!container)
			{
				return this.getSerializedConditions();
			}

			const formFields = {};
			const elements = container.querySelectorAll('input[name], select[name], textarea[name]');

			elements.forEach((element) => {
				if (element.disabled || !Type.isStringFilled(element.name))
				{
					return;
				}

				if (
					(element.type === 'checkbox' || element.type === 'radio')
					&& !element.checked
				)
				{
					return;
				}

				const isMultiple = element.name.endsWith('[]');
				const fieldName = isMultiple ? element.name.slice(0, -2) : element.name;

				if (isMultiple)
				{
					if (!Type.isArray(formFields[fieldName]))
					{
						formFields[fieldName] = [];
					}

					formFields[fieldName].push(element.value);
				}
				else
				{
					formFields[fieldName] = element.value;
				}
			});

			return Object.keys(formFields).length > 0
				? ConditionGroup.createFromForm(formFields, this.filteringFieldsPrefix).serialize()
				: EMPTY_CONDITIONS
			;
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

			const entityTitle = this.entityTypeOptions.find((option) => option.value === String(dynamicTypeId))?.title
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

			if (this.nodeSettings?.fixedDocumentType?.length === CorrectDocumentTypeLength)
			{
				return this.nodeSettings.fixedDocumentType;
			}

			if (this.documentTypeMap.has(String(dynamicTypeId)))
			{
				return this.documentTypeMap.get(String(dynamicTypeId));
			}

			return Type.isArrayFilled(this.documentType) ? this.documentType : null;
		},

		subscribeOnBeforeSubmit(): void
		{
			this.unsubscribe();
			this.onBeforeSubmitCallback = () => this.syncSelectorStateFromDom(true);
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
		<div class="editor-chart-node-settings-edit-filter-expression">
			<div
				v-if="status === Status.Loading"
				class="editor-chart-node-settings-edit-filter-expression__loader"
			>
				<Loader />
			</div>
			<div
				v-else-if="status === Status.Error"
			>
				<EditExtendedAction
					:actionId="fallbackActionMeta.id"
					:actionMeta="fallbackActionMeta"
					:activityData="construction.expression.activityData"
					:construction="construction"
					:documentType="documentType"
					:ruleCard="ruleCard"
					:template="template"
				/>
			</div>
			<template v-else>
				<div
					v-if="isEntitySelectorVisible"
					class="editor-chart-node-settings-edit-filter-expression__item"
				>
					<span class="editor-chart-node-settings-edit-filter-expression__label">
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_FILTER_ENTITY_TYPE') }}
					</span>
					<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown">
						<div class="ui-ctl-after ui-ctl-icon-angle"></div>
						<select
							v-model="currentEntityTypeId"
							class="ui-ctl-element"
						>
							<option value="">
								{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_EXPRESSION_ITEM_NOT_SELECTED') }}
							</option>
							<option
								v-for="option in entityTypeOptions"
								:key="option.value"
								:value="option.value"
							>
								{{ option.title }}
							</option>
						</select>
					</div>
				</div>
				<div
					v-if="hasSelectedEntityType"
					class="editor-chart-node-settings-edit-filter-expression__item"
				>
					<div ref="filterFieldsContainer"></div>
				</div>
			</template>
		</div>
	`,
};
