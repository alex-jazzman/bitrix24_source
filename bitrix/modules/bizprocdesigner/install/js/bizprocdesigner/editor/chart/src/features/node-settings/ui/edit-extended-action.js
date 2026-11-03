import { Type, ajax, Event, Loc, Dom, Tag, Text, Runtime } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { ref, inject, markRaw } from 'ui.vue3';
import { mapActions, mapState } from 'ui.vue3.pinia';
import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { diagramStore } from '../../../entities/blocks';
import {
	useNodeSettingsStore,
	getConnectedBlocksContextForConstruction,
	resolveRuleCollection,
	evaluateActionExpressionDocumentType,
	settingsFormRequestCache,
	type ActionDictEntry,
} from '../../../entities/node-settings';
import { EVENT_NAMES } from '../../../entities/node-settings/constants/index';
import {
	CorrectDocumentTypeLength,
	resolvePropertyDialogDocumentType,
} from '../../../entities/node-settings/utils/property-dialog-document-type';
import {
	complexNodeApi,
	type RelationPackageEntry,
	type RelationSource,
} from '../../../entities/node-settings/api';
import {
	TITLE_FIELD_NAME,
	PROPERTY_TYPES,
	EVALUATION_STAGE,
	RELATION_PACKAGE_SETTINGS_KEY,
	RELATION_PACKAGE_ROLES,
} from '../../../shared/constants';
import { usePropertyDialog } from '../../../shared/composables';
import { type ActivityData, type Block, type SettingsControls } from '../../../shared/types';
import { Loader } from '../../../shared/ui';
import {
	createUniqueId,
	deepEqual,
	hasVisibleFieldLabel,
	isRequiredField,
	settingsControlsMemory,
} from '../../../shared/utils';
import { BxControl } from '../directives/bx-control';
import { FormInputTracker } from '../directives/form-input-tracker';
import { handleBpSelectorButtonClick } from '../utils/bp-selector-button';
import { closeExpressionBuilder, mountExpressionBuilders } from '../utils/expression-builder-mount';
import { DeletedProjectFieldStateMixin } from '../utils/deleted-project-field-state-mixin';
import { unmountFormVeneers } from '../utils/readable-expressions-veneer';
import {
	fillEmptyFields,
	snapshotValues,
	isFieldEmpty,
	setFieldValue,
	locateField,
	locateValueTarget,
} from '../utils/autofill-form';

import './edit-extended-action.css';

type StatusType = $Values<Status>;
const Status: Record<string, StatusType> = Object.freeze({
	Loading: 'loading',
	Loaded: 'loaded',
	Error: 'error',
});

type NodeControlProperty = {
	Name: string,
	Type: string,
	Required?: boolean,
	Hidden?: boolean,
	FieldName?: string,
	Default?: any,
	CustomType?: string,
	Options?: Object,
	Settings?: Object,
};

type RawNodeControl = {
	property: NodeControlProperty,
	value: any,
};

type NodeControl = {
	property: NodeControlProperty,
	value: any,
	fieldName: string | null,
	controlId: string | null,
};

type RenderedControlsMap = { [controlId: string]: HTMLElement };

type CustomRenderers = { [customType: string]: (field: NodeControl) => HTMLElement };

type RendererInstance = {
	getControlRenderers?: () => CustomRenderers,
	afterFormRender?: (form: HTMLFormElement) => void,
	destroy?: () => void,
};

type ExtractedFormData = {
	activityType: string,
	documentType: Array<string>,
	id: string,
	[key: string]: any,
};

// Diagram edits can arrive in bursts (multi-edge changes); recompute autofill once per burst.
const RELATION_RECOMPUTE_DEBOUNCE_MS = 300;

// Stands in the record (autoFilledValues) for a field the user has typed in: it can never equal what
// the control carries, so a field left with the very expression autofill wrote still counts as edited
// by hand (AC-04). A value autofill owns is always a string, so the two never collide.
const MANUAL_EDIT = Symbol('manual edit');

// Identity of an inline error: the field it flags plus everything its message is built from. Two
// errors sharing a key render the same alert, which is what lets a pass keep the one already shown.
const requiredFieldErrorKey = (
	{ fieldCode, name, conflictCode }: { fieldCode: string, name: string, conflictCode: ?string },
): string => {
	return JSON.stringify([fieldCode, name, conflictCode ?? null]);
};

// The message of a conflict names no field: the hint stands beside the control it is about and is tied
// to it by aria-describedby, while a "Create" form of the legacy property dialog publishes no title to
// name the field by at all - the code of the field is all that would be left, and it says nothing.
const CONFLICT_MESSAGE_KEYS = {
	ambiguous_source: 'BIZPROCDESIGNER_EDITOR_AUTOFILL_CONFLICT_AMBIGUOUS_SOURCE',
	target_not_empty: 'BIZPROCDESIGNER_EDITOR_AUTOFILL_CONFLICT_TARGET_NOT_EMPTY',
};

/**
 * The test id of an inline alert: what the message is about and the field it flags. A conflict of the
 * autofill and an empty required field share the alert node, so an e2e scenario tells them apart by
 * this id instead of by the text of the message.
 */
const alertTestId = ({ fieldCode, conflictCode }: { fieldCode: string, conflictCode: ?string }): string => {
	const kind = conflictCode
		? `autofill-conflict-${conflictCode.replaceAll('_', '-')}`
		: 'required-field-error'
	;

	return `bizprocdesigner-${kind}-${fieldCode}`;
};

/**
 * The control an inline error is put next to: a conflict flags the control that carries the expression
 * autofill writes into, an empty required field flags the field itself. A field the form renders no
 * control for has none — the save stays blocked and the row announces it, but there is nowhere in the
 * form to show the message.
 */
const locateErrorInput = (
	form: ?HTMLFormElement,
	{ fieldCode, conflictCode }: { fieldCode: string, conflictCode: ?string },
): HTMLElement | null => {
	const input = conflictCode ? locateValueTarget(form, fieldCode) : locateField(form, fieldCode);

	return input ?? null;
};

/**
 * The title a message names a field by — the one its control was rendered with. A field the form
 * renders no control for keeps its code: there is nothing else to name it by.
 */
const resolveFieldName = (controls: ?Array<Object>, fieldCode: string): string => {
	const control = (controls ?? []).find((field) => field.fieldName === fieldCode);

	return Type.isStringFilled(control?.property?.Name) ? control.property.Name : fieldCode;
};

type RelationPackageMarker = {
	role?: string,
	fieldId?: string,
	targetDocumentType?: Array<string>,
	required?: boolean,
};

const getRelationPackageMarker = (property: Object): ?RelationPackageMarker => {
	const marker = property?.Settings?.[RELATION_PACKAGE_SETTINGS_KEY];

	return Type.isPlainObject(marker) ? marker : null;
};

const isDocumentRelationProperty = (property: Object): boolean => {
	return property.Type === PROPERTY_TYPES.DOCUMENT && Type.isArrayFilled(property.Default);
};

const isSourceDocumentRelationProperty = (property: Object): boolean => {
	return isDocumentRelationProperty(property)
		&& getRelationPackageMarker(property)?.role === RELATION_PACKAGE_ROLES.SOURCE_DOCUMENT
	;
};

const collectRelationPackage = (returnProperties: Array<Object>): Array<RelationPackageEntry> => {
	const packageEntries: Array<RelationPackageEntry> = [];

	returnProperties.forEach((property: Object) => {
		const marker = getRelationPackageMarker(property);
		if (marker?.role !== RELATION_PACKAGE_ROLES.TARGET_FIELD)
		{
			return;
		}

		packageEntries.push({
			id: property.Id,
			fieldId: marker.fieldId,
			targetDocumentType: marker.targetDocumentType,
			...(Type.isBoolean(marker.required) ? { required: marker.required } : {}),
		});
	});

	return packageEntries;
};

// @vue/component
export const EditExtendedAction = {
	name: 'edit-extended-action',
	mixins: [DeletedProjectFieldStateMixin],
	components: { BIcon, Loader },
	directives: { FormInputTracker, BxControl },
	props: {
		/** @type Construction */
		construction: {
			type: Object,
			required: true,
		},
		actionId: {
			type: String,
			required: true,
		},
		actionMeta: {
			type: [Object, null],
			required: false,
			default: null,
		},
		/** @type DiagramTemplate | null */
		template: {
			type: [Object, null],
			required: true,
		},
		documentType: {
			type: Array,
			required: true,
		},
		/** @type ActivityData | null */
		activityData: {
			type: [Object, null],
			required: false,
			default: null,
		},
		selectedDocument: {
			type: [String, null],
			required: false,
			default: null,
		},
		ruleCard: {
			type: [Object, null],
			required: false,
			default: null,
		},
		/**
		 * @type Port | PortlessRule
		 * Rule of the row this action form belongs to. Without it the form works on the single rule the
		 * panel shows: only the all-rules mode has no single one, and there every row names its own.
		 */
		rulePort: {
			type: [Object, null],
			default: null,
		},
	},
	setup(): {
		iconSet: typeof Outline;
		store: diagramStore;
		isActionFormLoading: { value: boolean };
		isActionFormSubmitReady: { value: boolean };
	}
	{
		const store: diagramStore = diagramStore();
		const isActionFormLoading = inject('isActionFormLoading', ref(false));
		// Tells the row of the action whether this form answers the pre-save check of the required
		// fields: it does so from the subscription on, and the row answers for it until then.
		const isActionFormSubmitReady = inject('isActionFormSubmitReady', ref(false));

		return { iconSet: Outline, store, isActionFormLoading, isActionFormSubmitReady };
	},
	data(): {
		status: StatusType,
		settingsForm: HTMLFormElement | null,
		nodeControls: NodeControl[] | null,
		renderedControlsMap: RenderedControlsMap | null,
		rendererInstance: RendererInstance | null,
		lastRenderRequestId: number,
		settingsControlsRequest: ?XMLHttpRequest,
		autofillMap: Record<string, string> | null,
		autofillRequiredFields: Array<string>,
		autofillConflicts: Array<Object>,
		isReapplyingRelationFields: boolean,
		projectFieldStateObservers: Array<MutationObserver>,
		}
	{
		return {
			status: '',
			settingsForm: null,
			nodeControls: null,
			renderedControlsMap: null,
			rendererInstance: null,
			lastRenderRequestId: 0,
			settingsControlsRequest: null,
			autofillMap: null,
			autofillRequiredFields: [],
			autofillConflicts: [],
			isReapplyingRelationFields: false,
			projectFieldStateObservers: [],
			// Generation counter for relation recompute: a debounced burst can start two recomputes with the
			// same lastRenderRequestId (which only changes on a form re-render), so a stale network response
			// is discarded by comparing this instead. Bumped at the start of each runRelationRecompute.
			recomputeGeneration: 0,
		};
	},
	computed: {
		...mapState(useNodeSettingsStore, [
			'block',
			'currentRule',
			'nodeSettings',
			'isRelationAutofillEnabled',
			'autofillRequests',
		]),
		Status: (): Status => Status,
		/** Rule this form works on: the one of its own row, or the single rule the panel shows. */
		targetRulePort(): Object | null
		{
			return this.rulePort ?? this.currentRule;
		},
		/** Id of that rule, as the context builder and the expression builder take it. */
		targetRulePortId(): string | null
		{
			return this.targetRulePort?.id ?? null;
		},
		/** Rules collection the target rule lives in - relation rules are the ones kept apart. */
		targetSettingsItems(): Map | null
		{
			return resolveRuleCollection(this.nodeSettings, this.targetRulePort);
		},
		action(): ?ActionDictEntry
		{
			if (this.nodeSettings?.relationAction?.id === this.actionId)
			{
				return this.nodeSettings.relationAction;
			}

			return this.actionMeta ?? this.nodeSettings?.actions?.get(this.actionId) ?? null;
		},
		propertiesDialogDocumentType(): Array<string>
		{
			return this.getPropertyDialogDocumentType(this.selectedDocument);
		},
		connectedBlocksContext(): Object
		{
			return getConnectedBlocksContextForConstruction(
				this.block,
				this.targetRulePortId,
				this.ruleCard,
				this.construction,
				this.targetSettingsItems,
			);
		},
		connectedBlocks(): Array<Block>
		{
			return this.connectedBlocksContext.allBlocks;
		},
		isPropertiesDialogDocumentTypeReady(): boolean
		{
			return this.propertiesDialogDocumentType.length === CorrectDocumentTypeLength;
		},
		/**
		 * a stable signature of the relation sources feeding this "Create" form. It is derived
		 * from the node's relation ancestors (reactive via connectedBlocksContext -> diagram graph), so
		 * it changes exactly when the user adds/removes/re-points a relation edge. The gate keeps it
		 * constant ('') for non-"Create" actions and when the feature is off, so the watcher below only
		 * ever reacts for a live "Create" form (on any port, not just a relation input port).
		 */
		relationSourcesSignature(): string
		{
			if (!this.action?.isRelationCreate || !this.isRelationAutofillEnabled)
			{
				return '';
			}

			return JSON.stringify(this.collectRelationSources());
		},
	},
	watch: {
		actionId(newVal: string, oldVal: string): void
		{
			if (newVal === oldVal)
			{
				return;
			}

			this.captureAutofillSnapshotOnLeave(oldVal);
			this.init();
		},
		propertiesDialogDocumentType(newVal: Array<string>, oldVal: Array<string>): void
		{
			if (!deepEqual(newVal, oldVal))
			{
				this.init();
			}
		},
		status(newVal: StatusType): void
		{
			this.isActionFormLoading = (newVal === Status.Loading);
		},
		/**
		 * react to a relation source/edge change on an already-mounted "Create" form only.
		 * While the form is (re)loading (status !== Loaded) the fresh sources are already fetched by
		 * loadForm, so recompute stays a no-op there and never double-applies with apply-on-select.
		 */
		relationSourcesSignature(newVal: string, oldVal: string): void
		{
			if (newVal === oldVal || this.status !== Status.Loaded || !this.settingsForm)
			{
				return;
			}

			this.debouncedRecompute();
		},
	},
	created(): void
	{
		// Bound once; the debounce collapses a burst of diagram edits into a single recompute.
		this.debouncedRecompute = Runtime.debounce(this.runRelationRecompute, RELATION_RECOMPUTE_DEBOUNCE_MS, this);
		// Non-reactive registry of per-field required-error clear handlers (unbound on re-validate/unmount).
		this.requiredErrorHandlers = [];
		// Runtime.debounce has no cancel handle, so a late recompute is gated by this flag instead.
		this.isUnmounted = false;
		// The form load in flight, awaited by the submit handler (see subscribeOnBeforeSubmit).
		this.formLoad = null;
		// Non-reactive record of what autofill last wrote into each field, so an edit by the user can
		// be told from the value autofill owns (see dropManuallyEditedAutoFields).
		this.autoFilledValues = {};
	},
	mounted(): void
	{
		this.init();
	},
	beforeUnmount(): void
	{
		// The form writes into the panel state only while that state still describes its own node. It
		// goes away with the whole panel, which resets the state before the teardown reaches the forms
		// (NodeSettings.hideSettings), and it goes away on a switch straight to another complex node,
		// where the state already carries the placeholder of the node being opened. Neither leaves
		// anything of this node to write to.
		if (!this.areSettingsLoaded())
		{
			return;
		}

		// The row outlives the form (a collapsed row, a rule not reached), and with the form goes its
		// pre-save check: what the form knows about its required fields right now is what the row
		// answers that check with (see EditActionExpression.onBeforeSubmit).
		this.recordRequiredFieldsCheck();

		// The form can go away instead of being handed the new actionId: picking an action that needs a
		// document it has not got drops the whole value section (EditActionExpression.isActionFormMounted),
		// and the watcher above never runs for it.
		this.captureAutofillSnapshotOnLeave(this.actionId);
	},
	unmounted(): void
	{
		// Drops a debounced recompute that would otherwise fire after teardown (into a detached form).
		this.isUnmounted = true;
		this.lastRenderRequestId++;
		this.settingsControlsRequest?.abort();
		this.settingsControlsRequest = null;
		this.unsubscribe();
		this.cleanupFormResources();
	},
	methods: {
		...mapActions(useNodeSettingsStore, [
			'changeRuleExpression',
			'saveAutofillSnapshot',
			'getAutofillSnapshot',
			'consumeAutofillRequest',
			'setRequiredFieldsCheck',
			'getRequiredFieldsCheck',
			'isCurrentBlock',
		]),

		isRenderCancelled(requestId: number): boolean
		{
			return this.lastRenderRequestId !== requestId;
		},

		/**
		 * True while the panel state is the committed one and false inside a load window:
		 * fetchNodeSettings() replaces the state with the placeholder of the node being opened and
		 * commits the block only after the load. It says nothing about which node the form itself
		 * belongs to, but a form is mounted from the content of the panel, which the load takes down,
		 * so the committed state is always the state of its own node. The criterion is the one of the
		 * store (the same BlockMediator.areSettingsLoadedForBlock() goes by): it compares nodes and not
		 * render generations, so a remount of the form inside one node stays owned by it.
		 */
		areSettingsLoaded(): boolean
		{
			return Boolean(this.block) && this.isCurrentBlock(this.block.id);
		},

		shouldShowRequiredMark(field: Object): boolean
		{
			return (
				isRequiredField(field)
				&& field.fieldName !== TITLE_FIELD_NAME
			);
		},

		shouldShowFieldLabel(field: Object): boolean
		{
			return hasVisibleFieldLabel(field);
		},

		async init(): Promise<void>
		{
			// Subscribed before the form is loaded, not after it: the click that commits a document typed
			// by hand is the very click that saves the node, so a save can start while the form is still
			// on its way. An unsubscribed form lets the node be saved without its activity data.
			// Subscribing is not the same as answering the pre-save check for the required fields: a form
			// that is (re)building its controls has none to read, so the row keeps answering that check
			// until the load below raises isActionFormSubmitReady.
			this.subscribeOnBeforeSubmit();

			if (!this.isPropertiesDialogDocumentTypeReady)
			{
				this.isActionFormLoading = false;
				this.formLoad = null;
				this.clearForm();
				this.onChange();

				return;
			}

			try
			{
				this.formLoad = this.loadForm();
				await this.formLoad;

				// The controls are there: from here the form answers the pre-save check itself and flags
				// its empty required fields inline, so the row stops answering for it.
				this.isActionFormSubmitReady = true;
				this.restoreRequiredFieldErrors();
			}
			catch (error)
			{
				this.status = Status.Error;
				console.error(error);
			}
		},

		subscribeOnBeforeSubmit(): void
		{
			this.unsubscribe();

			// Flush the DOM form into the store, then re-run required pre-validation and report whether the
			// "Create" form still has empty required fields. NodeSettings.saveRules reads this to block the
			// save if the user cleared a required field after its inline alert was dismissed.
			// The save waits for the form still being loaded (emitAsync awaits what a handler returns), so
			// it flushes a form that is there instead of persisting the node without the action parameters.
			// A load that failed breaks the save with it: onChange() would write rawActivityData: null, the
			// server skips such an expression and keeps the activityData the rule had - the previous action
			// document included - while the panel closes as after a successful save and the new document is
			// lost. The rejection reaches NodeSettings.onSave, which voices it and keeps the panel open.
			this.onChangeCallback = async () => {
				await this.formLoad;
				if (this.isUnmounted)
				{
					return false;
				}

				this.onChange();

				return this.revalidateRequiredFields(true);
			};
			EventEmitter.subscribe(EVENT_NAMES.BEFORE_SUBMIT_EVENT, this.onChangeCallback);
		},

		unsubscribe(): void
		{
			this.isActionFormSubmitReady = false;
			if (this.onChangeCallback)
			{
				EventEmitter.unsubscribe(EVENT_NAMES.BEFORE_SUBMIT_EVENT, this.onChangeCallback);
			}
		},

		// Through the cache of the open node: the very same form is asked for again on every remount
		// of this row (rule switch, section reached, form expanded again).
		async requestSettingsControls(
			activity: ActivityData,
			compatibleTemplate: Array<Object>,
		): Promise<?SettingsControls>
		{
			let request = null;
			try
			{
				return await settingsFormRequestCache.getNodeSettingsControls(
					{
						documentType: this.propertiesDialogDocumentType,
						activity,
						workflow: {
							workflowParameters: JSON.stringify(this.template?.PARAMETERS ?? {}),
							workflowVariables: JSON.stringify(this.template?.VARIABLES ?? {}),
							workflowTemplate: JSON.stringify(compatibleTemplate),
							workflowConstants: JSON.stringify(this.template?.CONSTANTS ?? {}),
						},
						options: {
							templateId: this.store.templateId,
							draftId: this.store.draftId,
							hideEditorComment: true,
						},
					},
					{
						onRequestStart: (xhr) => {
							request = markRaw(xhr);
							this.settingsControlsRequest = request;
						},
					},
				);
			}
			finally
			{
				if (this.settingsControlsRequest === request)
				{
					this.settingsControlsRequest = null;
				}
			}
		},

		async loadForm(): Promise<void>
		{
			const requestId = ++this.lastRenderRequestId;
			// The id is bumped before the abort, so the rejection of the superseded request is dropped
			// by isRenderCancelled instead of being reported to the user as a failure.
			this.settingsControlsRequest?.abort();
			this.settingsControlsRequest = null;
			this.clearForm();
			this.status = Status.Loading;

			let activity: ActivityData = this.activityData;
			if (!activity)
			{
				const defaultProps = Type.isPlainObject(this.action?.properties)
					? { ...this.action.properties }
					: {}
				;

				activity = {
					Name: createUniqueId(),
					Type: this.actionId,
					Activated: 'Y',
					Properties: {
						Title: this.action?.title ?? '',
						...defaultProps,
					},
				};
			}

			const compatibleTemplate = [{ Type: 'NodeWorkflowActivity', Children: [], Name: 'Template' }];
			compatibleTemplate[0].Children.push(
				activity,
				...this.connectedBlocks.map((block) => block.activity),
			);

			try
			{
				// The memory only answers when the legacy dialog behind an empty response is really
				// available, so a hit can never leave the user without a form.
				const isFallbackAvailable = !Type.isUndefined(window.rootActivity);
				let settingControls: SettingsControls = isFallbackAvailable
					? settingsControlsMemory.get(activity.Type, this.propertiesDialogDocumentType)
					: null
				;

				if (!settingControls)
				{
					settingControls = await this.requestSettingsControls(activity, compatibleTemplate);
					settingsControlsMemory.remember(activity.Type, this.propertiesDialogDocumentType, settingControls);
				}

				if (this.isRenderCancelled(requestId))
				{
					return;
				}

				if (Type.isArray(settingControls?.controls))
				{
					await this.renderNodeControls(settingControls.controls, requestId, activity);
				}
				else
				{
					const { createFormData } = usePropertyDialog();
					const formData = createFormData({
						id: activity.Name,
						documentType: this.propertiesDialogDocumentType,
						activity: this.actionId,
						workflow: {
							parameters: this.template?.PARAMETERS ?? [],
							variables: this.template?.VARIABLES ?? [],
							template: compatibleTemplate,
							constants: this.template?.CONSTANTS ?? [],
						},
					});
					formData.append('options[hideEditorComment]', 'Y');
					formData.append('options[templateId]', String(this.store.templateId ?? 0));
					formData.append('options[draftId]', String(this.store.draftId ?? 0));
					await this.renderPropertyDialog(formData);
				}

				this.status = Status.Loaded;
				await this.applyRelationAutofill(requestId);
			}
			catch (e)
			{
				if (!this.isRenderCancelled(requestId))
				{
					this.status = Status.Error;
					throw e;
				}
			}
		},

		/**
		 * Relation autofill transport: fetches the autofill package for a relation "Create" sub-action
		 * fed by relation ancestors and exposes it to the mounted form. Best-effort — it must never block
		 * or break form loading. Writing the map into empty fields is done by applyRelationAutofill().
		 */
		async loadRelationAutofill(requestId: number): Promise<?Object>
		{
			if (!this.action?.isRelationCreate || !this.isRelationAutofillEnabled)
			{
				return null;
			}

			const sources = this.collectRelationSources();
			if (sources.length === 0)
			{
				return null;
			}

			try
			{
				// The caller assigns the result under its own stale-response guard.
				const loaded = await complexNodeApi.loadSettings(
					this.block.activity,
					sources,
					this.store.documentType,
					this.store.templateId,
				);
				if (this.isRenderCancelled(requestId) || !loaded)
				{
					return null;
				}

				return loaded;
			}
			catch (error)
			{
				console.error(error);

				return null;
			}
		},

		/**
		 * Applies relation autofill to the mounted "Create" form. It first restores
		 * the session snapshot recorded when this action was last left, then writes the direct
		 * field matches from the autofill package. Both steps only ever write empty fields, so
		 * manual and manually-cleared values are preserved. Runs only
		 * when the user actively selected the "Create" sub-action and under the feature gate; other
		 * actions and plain node opens are untouched. The autofill map is
		 * fetched lazily here (only the first-selection branch needs it), so plain open/reload, snapshot
		 * restore and document-type switches never spend the round-trip.
		 */
		async applyRelationAutofill(requestId: number): Promise<void>
		{
			if (this.isRenderCancelled(requestId))
			{
				return;
			}

			// Guard form readiness before touching the one-shot request: a not-yet-ready or superseded
			// form must leave the request intact so the live/reloaded form can still apply it.
			if (
				!this.action?.isRelationCreate
				|| !this.isRelationAutofillEnabled
				|| !this.settingsForm
			)
			{
				return;
			}

			const constructionId = this.construction.id;

			// Peek WITHOUT consuming: only a user-initiated "Create" selection raises a request. Plain
			// open/reload has none → no-op, and (crucially) spends no autofill round-trip. The request is
			// consumed below only once the form is confirmed ready and the apply actually runs, so a form
			// reload mid-fetch never burns it irrecoverably.
			const snapshot = this.getAutofillSnapshot(constructionId);
			if (snapshot?.autofillMap)
			{
				this.setRelationAutofillResult(snapshot);
				(snapshot.auto ?? []).forEach((fieldCode) => {
					this.autoFilledValues[fieldCode] = snapshot.values[`${fieldCode}_text`] ?? snapshot.values[fieldCode];
				});
			}
			if (this.autofillRequests?.[constructionId] !== true)
			{
				if (snapshot?.autofillMap)
				{
					this.revalidateRequiredFields(false);
				}

				return;
			}

			if (snapshot)
			{
				// return: fully synchronous, so consume now — no await can drop the request here. Restore
				// the session values (auto + manual) into still-empty fields and the recorded auto list.
				// The map is NOT re-applied, so a field the user cleared before leaving stays empty. The
				// snapshot's auto list is assigned outright (replace), not a union.
				this.consumeAutofillRequest(constructionId);
				fillEmptyFields(this.settingsForm, snapshot.values);
				const restoredAuto = snapshot.auto ?? [];
				this.store.setAutoFilledFields(this.block.id, constructionId, restoredAuto);
				this.rememberAutoFilledValues(restoredAuto);
			}
			else
			{
				// first selection: this is the only consumer of the map, so fetch it now.
				// null means it was never loaded for this form; a superseded load is discarded by the guard.
				if (this.autofillMap === null)
				{
					const map = await this.loadRelationAutofill(requestId);
					// A reload mid-fetch (document-type switch → lastRenderRequestId++) or a torn-down
					// form must NOT consume the request: leaving it lets the reloaded form apply autofill
					// instead of losing it irrecoverably.
					if (this.isRenderCancelled(requestId) || !this.settingsForm)
					{
						return;
					}

					this.setRelationAutofillResult(map);
				}

				// Form is ready and current: consume the one-shot request and write the direct matches.
				this.consumeAutofillRequest(constructionId);
				const filled = fillEmptyFields(this.settingsForm, this.autofillMap);
				this.store.mergeAutoFilledFields(this.block.id, constructionId, filled);
				this.rememberAutoFilledValues(filled);
				this.updateAutofillConflicts();
			}

			this.revalidateRequiredFields(true);
		},

		/**
		 * Snapshots this "Create" form (auto + manual values plus the auto-filled field list) at the
		 * moment the user leaves the action, so it can be restored on return. Session-only and keyed by
		 * the stable construction.id. A form is left in two ways and both end here: the row hands it the
		 * new actionId (the watcher), or the row drops the whole value section and tears the form down
		 * (beforeUnmount) - the second one never reaches the watcher, and with no snapshot a field the
		 * user cleared on purpose comes back filled from the autofill map.
		 */
		captureAutofillSnapshotOnLeave(leavingActionId: string): void
		{
			// The ownership of the panel state is checked here and not only in the teardown hook: the
			// watcher of the action leads here as well.
			if (
				!this.areSettingsLoaded()
				|| !this.isRelationAutofillEnabled
				|| !this.settingsForm
			)
			{
				return;
			}

			const leavingAction = this.actionMeta ?? this.nodeSettings?.actions?.get(leavingActionId);
			if (!leavingAction?.isRelationCreate)
			{
				return;
			}

			const constructionId = this.construction.id;

			this.saveAutofillSnapshot(constructionId, {
				values: snapshotValues(this.settingsForm),
				auto: this.block.node?.autoFilledFields?.[constructionId] ?? [],
				...(this.autofillRequiredFields?.length || this.autofillConflicts?.length ? {
					autofillMap: this.autofillMap,
					autofillRequiredFields: this.autofillRequiredFields,
					autofillConflicts: this.autofillConflicts,
				} : {}),
			});
		},

		setRelationAutofillResult(result: ?Object): void
		{
			this.autofillMap = Type.isPlainObject(result?.autofillMap) ? result.autofillMap : {};
			this.autofillRequiredFields = Type.isArray(result?.autofillRequiredFields)
				? result.autofillRequiredFields : [];
			this.autofillConflicts = Type.isArray(result?.autofillConflicts) ? result.autofillConflicts : [];
		},

		updateAutofillConflicts(knownSnapshot: ?Object = null): void
		{
			const conflicts = (this.autofillConflicts ?? []).filter(({ code }) => code === 'ambiguous_source');
			const owned = this.block.node?.autoFilledFields?.[this.construction.id] ?? [];
			const values = knownSnapshot ?? snapshotValues(this.settingsForm);
			(this.autofillRequiredFields ?? []).forEach((fieldId) => {
				if (Type.isString(this.autofillMap?.[fieldId])
					&& !owned.includes(fieldId) && !isFieldEmpty(this.settingsForm, fieldId, values)
					&& !conflicts.some((conflict) => conflict.fieldId === fieldId))
				{
					conflicts.push({ fieldId, code: 'target_not_empty', sourceBlockIds: [] });
				}
			});
			this.autofillConflicts = conflicts;
		},

		hasBlockingAutofillConflict(): boolean
		{
			return (this.autofillConflicts ?? []).some(({ fieldId }) => {
				return (this.autofillRequiredFields ?? []).includes(fieldId);
			});
		},

		/**
		 * Returns the snapshot of the form that is still valid when the pass ends, so the caller reads
		 * the form once for the whole keystroke instead of once per step.
		 */
		reapplyClearedRelationFields(knownSnapshot: ?Object = null): Object
		{
			let snapshot = knownSnapshot ?? snapshotValues(this.settingsForm);

			const values = {};
			(this.autofillConflicts ?? []).forEach(({ fieldId, code }) => {
				if (code === 'target_not_empty' && Type.isString(this.autofillMap?.[fieldId]))
				{
					values[fieldId] = this.autofillMap[fieldId];
				}
			});

			const filled = fillEmptyFields(this.settingsForm, values, snapshot);
			if (filled.length > 0)
			{
				// the pass wrote into the form, so everything below judges the form as it is now
				snapshot = snapshotValues(this.settingsForm);
			}

			this.store.mergeAutoFilledFields(this.block.id, this.construction.id, filled);
			this.rememberAutoFilledValues(filled);
			this.updateAutofillConflicts(snapshot);
			this.revalidateRequiredFields(false, snapshot);

			return snapshot;
		},

		/**
		 * Value autofill owns for a field: what it wrote into the control that carries the expression.
		 */
		readAutoFilledValue(fieldCode: string): ?string
		{
			return locateValueTarget(this.settingsForm, fieldCode)?.value ?? null;
		},

		/**
		 * Records what an autofill pass just wrote, so a later edit by the user can be told from it.
		 */
		rememberAutoFilledValues(fields: Array<string>): void
		{
			fields.forEach((fieldCode) => {
				this.autoFilledValues[fieldCode] = this.readAutoFilledValue(fieldCode);
			});
		},

		/**
		 * Marks the field the user is typing in as edited by hand. The value alone cannot tell that
		 * apart: a user who clears an auto-filled expression and retypes it character for character
		 * leaves the control exactly as autofill left it, yet the field is his from then on (AC-04).
		 * Only an event the user raised counts - autofill notifies the form with synthetic events of
		 * its own (autofill-form.js), and those carry no isTrusted.
		 */
		onFormValueEvent(event: Event): void
		{
			if (!event.isTrusted || !this.isRelationAutofillEnabled)
			{
				return;
			}

			const editedField = Object.keys(this.autoFilledValues).find((fieldCode) => {
				return locateValueTarget(this.settingsForm, fieldCode) === event.target;
			});

			if (editedField !== undefined)
			{
				this.autoFilledValues[editedField] = MANUAL_EDIT;
			}
		},

		/**
		 * A field the user edited after autofill wrote it stops counting as auto-filled: the recompute
		 * of a source change may neither overwrite nor clear what the user typed (AC-04). An edit shows
		 * either as a value the record does not own or as the MANUAL_EDIT mark of onFormValueEvent (the
		 * user left the auto value in place). Only a field this form actually wrote is judged - one
		 * restored by another form instance carries no record and is left to the list it came with.
		 */
		dropManuallyEditedAutoFields(): boolean
		{
			if (
				!this.action?.isRelationCreate
				|| !this.isRelationAutofillEnabled
				|| !this.settingsForm
			)
			{
				return false;
			}

			const constructionId = this.construction.id;
			const auto = this.block?.node?.autoFilledFields?.[constructionId] ?? [];
			if (auto.length === 0)
			{
				return false;
			}

			const kept = auto.filter((fieldCode) => {
				return !(fieldCode in this.autoFilledValues)
					|| this.readAutoFilledValue(fieldCode) === this.autoFilledValues[fieldCode]
				;
			});

			if (kept.length === auto.length)
			{
				return false;
			}

			auto.forEach((fieldCode) => {
				if (!kept.includes(fieldCode))
				{
					delete this.autoFilledValues[fieldCode];
				}
			});
			this.store.setAutoFilledFields(this.block.id, constructionId, kept);

			return true;
		},

		/**
		 * recompute: after the user changes the relation source/edge of an already-mounted
		 * "Create" form, re-applies the freshly loaded autofill map. Touches ONLY previously auto-filled
		 * fields (autoFilledFields[constructionId]) and still-empty fields; manual and manually-cleared
		 * values are preserved - a field the user typed over has already left the auto list by then
		 * (dropManuallyEditedAutoFields). An auto-value that vanished from the new map is cleared
		 * and dropped from the list. Runs only on an explicit relation edit, never on save.
		 */
		recomputeRelationAutofill(): void
		{
			if (
				!this.action?.isRelationCreate
				|| !this.isRelationAutofillEnabled
				|| !this.settingsForm
			)
			{
				return;
			}

			this.dropManuallyEditedAutoFields();
			const constructionId = this.construction.id;
			const newAutofillMap = Type.isPlainObject(this.autofillMap) ? this.autofillMap : {};
			const previousAuto = this.block.node?.autoFilledFields?.[constructionId] ?? [];

			// 1. Clear auto-values missing from the new map and drop them from the list.
			const auto = [];
			let dirty = false;
			previousAuto.forEach((fieldCode) => {
				if (fieldCode in newAutofillMap)
				{
					auto.push(fieldCode);

					return;
				}

				dirty = setFieldValue(this.settingsForm, fieldCode, '') || dirty;
			});

			// 2. (Re)fill only auto fields and still-empty fields. One prepareForm snapshot for the whole
			// pass: step 1 only touched fields absent from newAutofillMap, so the emptiness of the fields
			// checked below is unchanged and a single snapshot avoids the per-field O(controls) rescan.
			const snapshot = snapshotValues(this.settingsForm);
			Object.entries(newAutofillMap).forEach(([fieldCode, expr]) => {
				const isAuto = auto.includes(fieldCode);
				if (!isAuto && !isFieldEmpty(this.settingsForm, fieldCode, snapshot))
				{
					return;
				}

				if (setFieldValue(this.settingsForm, fieldCode, expr))
				{
					dirty = true;
					if (!isAuto)
					{
						auto.push(fieldCode);
					}
				}
			});

			this.store.setAutoFilledFields(this.block.id, constructionId, auto);
			// Before onChange: what this pass wrote is the value autofill owns from now on, and a field
			// it dropped keeps no record at all (see dropManuallyEditedAutoFields).
			previousAuto.forEach((fieldCode) => {
				if (!auto.includes(fieldCode))
				{
					delete this.autoFilledValues[fieldCode];
				}
			});
			this.rememberAutoFilledValues(auto);
			this.updateAutofillConflicts();
			// setFieldValue now fires only a local change, so wake the form-level reactivity once for
			// the whole recompute pass (keeps rawActivityData in sync without O(fields) prepareForm
			// parses). Only when something actually changed, matching the pre-batch behaviour.
			if (dirty)
			{
				this.onChange();
			}

			// Background recompute (off-form relation edit): show the inline error but never steal
			// focus into the form — see revalidateRequiredFields.
			this.revalidateRequiredFields(false);
		},

		/**
		 * Reloads the autofill map for the current relation sources, then re-applies it.
		 * Guarded by lastRenderRequestId so a form reload mid-flight (action/document switch) discards
		 * this stale run instead of writing into a different form.
		 */
		async runRelationRecompute(): Promise<void>
		{
			// A debounced burst may resolve after the form was torn down; drop it then.
			if (this.isUnmounted)
			{
				return;
			}

			if (
				!this.action?.isRelationCreate
				|| !this.isRelationAutofillEnabled
				|| !this.settingsForm
			)
			{
				return;
			}

			// Own generation for this recompute: two debounced runs share lastRenderRequestId (it only
			// changes on a form re-render), so a slower earlier response is discarded by comparing this.
			const generation = ++this.recomputeGeneration;
			const requestId = this.lastRenderRequestId;

			let map;
			// When the last relation source was removed there is nothing to fetch; the map becomes empty
			// so recompute clears every previously auto-filled value.
			if (this.collectRelationSources().length === 0)
			{
				map = {};
			}
			else
			{
				map = await this.loadRelationAutofill(requestId);
				if (this.isRenderCancelled(requestId) || generation !== this.recomputeGeneration)
				{
					// A newer recompute (or a form reload) superseded this run: leave its map untouched.
					return;
				}

				map = map ?? {};
			}

			this.setRelationAutofillResult(map);
			this.recomputeRelationAutofill();
		},

		/**
		 * client-side pre-validation of the "Create" form's required fields, run after
		 * apply/recompute/restore. Required flags come from the backend controls metadata
		 * (property.Required). Every empty required field is flagged inline (not just the first) — the
		 * alert is inserted as the legacy input's immediate sibling so `.has-error + .node-settings-alert-text`
		 * applies; typing clears it. Server-side validation stays the final barrier.
		 * shouldFocus moves focus to the first empty field ONLY on an explicit "Create" apply; a
		 * background recompute (off-form relation edit) shows the same inline error but must not steal
		 * focus into the form (WCAG 3.2.x). Returns whether any required field is still empty, so the
		 * submit path (onChangeCallback) can block saving a node with empty required fields.
		 * The pass runs on every keystroke while a conflict is shown, so a verdict identical to the one
		 * already on screen leaves the DOM alone: an alert carries role="alert", and re-rendering it
		 * makes a screen reader repeat it character after character.
		 */
		revalidateRequiredFields(shouldFocus: boolean = false, knownSnapshot: ?Object = null): boolean
		{
			if (!this.isRequiredFieldsCheckApplicable())
			{
				return false;
			}

			const emptyFields = this.collectEmptyRequiredFields(knownSnapshot);
			// Only the errors the form has a control for: one without it renders no alert, and counting it
			// among the shown ones would make every pass tear the alerts down and build them again.
			const errors = [
				...emptyFields.map(({ fieldCode, name }) => ({ fieldCode, name, conflictCode: null })),
				...(this.autofillConflicts ?? []).map(({ fieldId, code }) => ({
					fieldCode: fieldId,
					name: '',
					conflictCode: code,
				})),
			]
				.map((error) => ({ ...error, input: locateErrorInput(this.settingsForm, error) }))
				.filter(({ input }) => input !== null)
			;

			if (shouldFocus || !this.areRequiredFieldErrorsShown(errors))
			{
				this.clearRequiredFieldErrors();
				errors.forEach(({ fieldCode, name, conflictCode, input }) => {
					this.showRequiredFieldError(fieldCode, name, shouldFocus, conflictCode, input);
				});
			}

			this.recordRequiredFieldsCheck(emptyFields);

			return emptyFields.length > 0 || this.hasBlockingAutofillConflict();
		},

		/**
		 * True while the inline errors on screen are exactly the given ones, in the same order.
		 */
		areRequiredFieldErrorsShown(errors: Array<Object>): boolean
		{
			const shown = this.requiredErrorHandlers ?? [];
			if (shown.length !== errors.length)
			{
				return false;
			}

			return errors.every((error, index) => {
				return shown[index].key === requiredFieldErrorKey(error) && shown[index].alert.isConnected;
			});
		},

		/**
		 * True while this form is the one the required-fields check applies to: a "Create" form of the
		 * relation autofill contour that has actually rendered its controls.
		 */
		isRequiredFieldsCheckApplicable(): boolean
		{
			return this.action?.isRelationCreate === true
				&& this.isRelationAutofillEnabled
				&& Boolean(this.settingsForm)
			;
		},

		/**
		 * The required fields of the form that are still empty, off one prepareForm snapshot for the
		 * whole pass (nothing is written here).
		 */
		collectEmptyRequiredFields(knownSnapshot: ?Object = null): Array<{ fieldCode: string, name: string }>
		{
			const snapshot = knownSnapshot ?? snapshotValues(this.settingsForm);

			return this.collectRequiredFields().filter(
				({ fieldCode }) => isFieldEmpty(this.settingsForm, fieldCode, snapshot)
					&& !(this.autofillConflicts ?? []).some(({ fieldId }) => fieldId === fieldCode),
			);
		},

		/**
		 * Hands the row the required-fields state of this form: the codes the backend declared required
		 * and the verdict on them. The row is the one on screen while the form is not, and the pre-save
		 * check of an unmounted form is answered off this record. A caller that has just taken the empty
		 * fields hands them over instead of paying for a second pass.
		 */
		recordRequiredFieldsCheck(emptyFields: ?Array<{ fieldCode: string, name: string }> = null): void
		{
			if (!this.isRequiredFieldsCheckApplicable())
			{
				return;
			}

			this.setRequiredFieldsCheck(this.construction.id, {
				actionId: this.actionId,
				fields: this.collectRequiredFields().map(({ fieldCode }) => fieldCode),
				hasEmptyRequired: (emptyFields ?? this.collectEmptyRequiredFields()).length > 0,
				hasAutofillConflict: this.hasBlockingAutofillConflict(),
				autofillRequiredFields: this.autofillRequiredFields ?? [],
				autofillConflicts: this.autofillConflicts ?? [],
			});
		},

		/**
		 * Flags the empty required fields a reopened form was left with. The pre-save check of the row
		 * blocks the save and expands the row for exactly this reason, so the inline errors have to be
		 * back with the form. Focus stays where the user put it (WCAG 3.2.x), and a form that has never
		 * been validated has no record, so a freshly picked action never opens with errors on it.
		 */
		restoreRequiredFieldErrors(): void
		{
			const check = this.getRequiredFieldsCheck(this.construction.id);
			if (check?.actionId === this.actionId && (check.hasEmptyRequired || check.hasAutofillConflict))
			{
				this.autofillRequiredFields = check.autofillRequiredFields ?? this.autofillRequiredFields ?? [];
				this.autofillConflicts = check.autofillConflicts ?? this.autofillConflicts ?? [];
				this.revalidateRequiredFields(false);
			}
		},

		/**
		 * Required fields of the "Create" form, taken from the rendered controls metadata (the title
		 * field is excluded, same rule as shouldShowRequiredMark). Empty when controls came from the
		 * legacy property dialog, which exposes no per-field Required metadata to the client here.
		 */
		collectRequiredFields(): Array<{ fieldCode: string, name: string }>
		{
			const controls = this.nodeControls ?? [];
			const fields = controls.reduce((acc, field) => {
				if (this.shouldShowRequiredMark(field) && Type.isStringFilled(field.fieldName))
				{
					acc.push({ fieldCode: field.fieldName, name: field.property.Name });
				}

				return acc;
			}, []);
			(this.autofillRequiredFields ?? []).forEach((fieldCode) => {
				if (fields.some((field) => field.fieldCode === fieldCode))
				{
					return;
				}

				// The document itself does not require such a field, so the pass above never collected its
				// title and the error message would name the field code. The code answers only for a field
				// the form renders no control for.
				fields.push({ fieldCode, name: resolveFieldName(controls, fieldCode) });
			});

			return fields;
		},

		showRequiredFieldError(
			fieldCode: string,
			name: string,
			shouldFocus: boolean = false,
			conflictCode: ?string = null,
			knownInput: ?HTMLElement = null,
		): void
		{
			const input = knownInput ?? locateErrorInput(this.settingsForm, { fieldCode, conflictCode });
			if (!input)
			{
				return;
			}

			// Focus the first empty required field of a pass, but only on an explicit "Create" apply
			// (shouldFocus) and only while the form is on screen: a background recompute from an off-form
			// relation edit still flags the field inline yet must not pull focus into the form
			// (WCAG 3.2.x), and a hidden form has no field to put the focus on. clearRequiredFieldErrors()
			// empties the list before the pass, so an empty list here means this is the first flagged field.
			const isFirstError = this.requiredErrorHandlers.length === 0;

			Dom.addClass(input, 'has-error');
			const conflictMessageKey = CONFLICT_MESSAGE_KEYS[conflictCode] ?? null;
			// property.Name is an author-controlled document field title; Tag.render treats string
			// interpolations as raw HTML, so encode it before it reaches the alert (XSS).
			const message = conflictMessageKey === null
				? Loc.getMessage('BIZPROCDESIGNER_EDITOR_REQUIRED_FIELD_ERROR', { '#FIELD#': Text.encode(name) })
				: Loc.getMessage(conflictMessageKey)
			;
			const alertId = `bizprocdesigner-required-field-error-${createUniqueId()}`;
			const alert = Tag.render`
				<div
					class="node-settings-alert-text"
					data-role="required-field-error"
					data-test-id="createActionRequiredFieldError"
					id="${alertId}"
					role="alert"
					aria-live="assertive"
				>${message}</div>
			`;
			// Set on the node rather than interpolated into the template: a field code reaches the alert
			// from the server, and Tag.render treats an interpolation as raw HTML.
			Dom.attr(alert, { 'data-testid': alertTestId({ fieldCode, conflictCode }) });
			if (conflictCode)
			{
				// The shared style of the panel hides `node-settings-alert-text` outright, and the rule that
				// shows it next to a flagged control carries no priority of its own; the modifier is what
				// brings the hint of a conflict onto the screen (edit-extended-action.css).
				Dom.addClass(alert, 'editor-chart-node-settings-autofill-conflict');
			}
			input.after(alert);

			Dom.attr(input, { 'aria-invalid': 'true', 'aria-describedby': alertId });

			// An empty required field is answered by the typing itself, so its error goes away as the user
			// types. A conflict is answered by the recompute the same edit triggers: the alert stays where
			// it is until that pass decides on it, instead of being torn down and rebuilt on every symbol
			// (a rebuilt role="alert" is re-announced by a screen reader).
			const clear = () => {
				if (conflictCode)
				{
					this.onChange();

					return;
				}

				Dom.removeClass(input, 'has-error');
				Dom.attr(input, { 'aria-invalid': null, 'aria-describedby': null });
				Dom.remove(alert);
				Event.unbind(input, 'input', clear);
				Event.unbind(input, 'change', clear);
			};
			Event.bind(input, 'input', clear);
			Event.bind(input, 'change', clear);
			this.requiredErrorHandlers.push({
				key: requiredFieldErrorKey({ fieldCode, name, conflictCode }),
				input,
				alert,
				clear,
			});

			if (isFirstError && shouldFocus && this.isFieldInputOnScreen(input))
			{
				input.focus();
			}
		},

		/**
		 * True while a control of this form is really on screen. The form of a collapsed row stays mounted
		 * and is only hidden (v-show), and it answers the pre-save check from there: focusing a control of
		 * a hidden form would send the focus nowhere at all. The row is the one that expands itself and
		 * brings those errors into view (EditActionExpression.blockSaveOnRequiredFields).
		 */
		isFieldInputOnScreen(input: HTMLElement): boolean
		{
			return input.offsetParent !== null;
		},

		clearRequiredFieldErrors(): void
		{
			if (Type.isArray(this.requiredErrorHandlers))
			{
				this.requiredErrorHandlers.forEach(({ input, clear }) => {
					Dom.removeClass(input, 'has-error');
					// Mirror the aria state set by showRequiredFieldError so it is cleared on a bulk pass too.
					Dom.attr(input, { 'aria-invalid': null, 'aria-describedby': null });
					Event.unbind(input, 'input', clear);
					Event.unbind(input, 'change', clear);
				});
				this.requiredErrorHandlers = [];
			}

			this.settingsForm
				?.querySelectorAll('[data-role="required-field-error"]')
				.forEach((node) => Dom.remove(node));
		},

		locateFieldInput(fieldCode: string): HTMLElement | null
		{
			// Single source of the field lookup (autofill-form.locateField) — same name/name[] match.
			return locateField(this.settingsForm, fieldCode);
		},

		/**
		 * Builds the relation source package from the node's relation ancestors: one entry per ancestor
		 * block that exposes a document output. `outputs` are the ancestor's ReturnProperties codes (the
		 * same ones ValueSelector uses to build {=blockId:propertyId}); the backend prefers them over its
		 * own documentType-based fallback. `documentOutput` is the code of that document output, through
		 * which the linked entity id is reached as an accessor (`documentOutput.propertyId`).
		 */
		collectRelationSources(): Array<RelationSource>
		{
			return this.connectedBlocksContext.ancestorBlocks.reduce((sources: Array<RelationSource>, block: Block) => {
				const returnProperties = Type.isArray(block?.activity?.ReturnProperties)
					? block.activity.ReturnProperties
					: [];

				const documentProperty = returnProperties.find((property) => isSourceDocumentRelationProperty(property))
					?? returnProperties.find((property) => isDocumentRelationProperty(property))
				;
				if (!documentProperty)
				{
					return sources;
				}

				const source: RelationSource = {
					blockId: block.id,
					documentType: documentProperty.Default,
					outputs: returnProperties.map((property) => property.Id),
					documentOutput: documentProperty.Id,
				};
				const packageEntries = collectRelationPackage(returnProperties);
				if (packageEntries.length > 0)
				{
					source.package = packageEntries;
				}

				sources.push(source);

				return sources;
			}, []);
		},

		async renderNodeControls(controls: RawNodeControl[], requestId: number, activity: ActivityData): Promise<void>
		{
			this.nodeControls = this.prepareNodeControls(controls);
			const renderedControls = this.getRenderedControlsCollection();

			if (this.isRenderCancelled(requestId))
			{
				return;
			}

			const customRenderers = this.initRendererInstance();
			this.renderedControlsMap = this.buildRenderedControlsMap(renderedControls, customRenderers);

			await this.waitForRenderFinished(requestId, renderedControls);
		},

		prepareNodeControls(controls: RawNodeControl[]): NodeControl[]
		{
			const isNewActivity = !this.activityData;

			return controls.map((control: RawNodeControl) => {
				const property = control.property || {};
				let currentValue = control.value;

				if (isNewActivity && property.Default !== undefined)
				{
					const isValueEmpty = (
						currentValue === undefined
						|| currentValue === null
						|| currentValue === ''
						|| (Type.isArray(currentValue) && currentValue.length === 0)
					);

					if (isValueEmpty)
					{
						currentValue = property.Default;
					}
				}

				return {
					...control,
					value: currentValue,
					fieldName: property.FieldName || null,
					controlId: property.FieldName || null,
				};
			});
		},

		getRenderedControlsCollection(): RenderedControlsMap
		{
			return BX.Bizproc.FieldType.renderControlCollection(
				this.propertiesDialogDocumentType,
				this.nodeControls.filter((field) => field.property.Type !== 'custom'),
				'designer',
			);
		},

		initRendererInstance(): CustomRenderers | null
		{
			const rendererName = `${this.actionId}Renderer`;
			const RendererClass = Type.isFunction(window[rendererName]) ? window[rendererName] : null;

			if (!RendererClass)
			{
				return null;
			}

			this.rendererInstance = new RendererClass();

			return Type.isFunction(this.rendererInstance.getControlRenderers)
				? this.rendererInstance.getControlRenderers()
				: null
			;
		},

		buildRenderedControlsMap(
			renderedControls: RenderedControlsMap,
			customRenderers: CustomRenderers | null,
		): RenderedControlsMap
		{
			const map = {};

			this.nodeControls.forEach((field) => {
				let control = renderedControls[field.controlId];

				if (field.property.Type === 'custom' && this.rendererInstance && customRenderers)
				{
					const renderer = customRenderers[field.property.CustomType];
					if (Type.isFunction(renderer))
					{
						control = renderer(field);
					}
				}

				if (control)
				{
					map[field.controlId] = control;
				}
			});

			return map;
		},

		waitForRenderFinished(requestId: number, renderedControls: RenderedControlsMap): Promise<void>
		{
			this.cleanupRenderFinishedHandler();

			return new Promise((resolve) => {
				const eventName = 'BX.Bizproc.FieldType.onCollectionRenderControlFinished';
				const handler = async () => {
					if (!this.isCollectionRendered(renderedControls))
					{
						return;
					}

					this.cleanupRenderFinishedHandler();

					await this.$nextTick();

					if (!this.isRenderCancelled(requestId))
					{
						if (this.rendererInstance?.afterFormRender)
						{
							this.rendererInstance.afterFormRender(this.$refs.settingsForm);
						}

						this.settingsForm = this.$refs.settingsForm;
						mountExpressionBuilders(this.settingsForm, {
							block: this.block,
							portId: this.targetRulePortId,
							connectedBlocks: this.connectedBlocks,
							// An action is executed by a workflow that has already started, so its
							// fields keep the full set of template sources even under a trigger.
							evaluationStage: EVALUATION_STAGE.IN_STARTED_WORKFLOW,
						});
						this.syncDeletedProjectFields();
					}

					resolve();
				};

				this.pendingRenderFinishedHandler = { eventName, handler };
				Event.EventEmitter.subscribe(eventName, handler);
			});
		},

		isCollectionRendered(renderedControls: RenderedControlsMap): boolean
		{
			return Object.values(renderedControls).every(
				(node: HTMLElement) => node.childElementCount > 0 || node.textContent !== '...',
			);
		},

		cleanupRenderFinishedHandler(): void
		{
			if (this.pendingRenderFinishedHandler)
			{
				const { eventName, handler } = this.pendingRenderFinishedHandler;
				Event.EventEmitter.unsubscribe(eventName, handler);
				this.pendingRenderFinishedHandler = null;
			}
		},

		async renderPropertyDialog(formData: FormData): Promise<void>
		{
			const { renderPropertyDialog } = usePropertyDialog();
			const form = await renderPropertyDialog(this.$refs.contentContainer, formData, this.store.isWriteLocked);
			if (form)
			{
				this.settingsForm = form;
				mountExpressionBuilders(this.settingsForm, {
					block: this.block,
					portId: this.targetRulePortId,
					connectedBlocks: this.connectedBlocks,
					evaluationStage: EVALUATION_STAGE.IN_STARTED_WORKFLOW,
				});
				this.syncDeletedProjectFields();
			}
		},

		clearForm(): void
		{
			this.cleanupFormResources();
			this.renderedControlsMap = null;
			this.nodeControls = null;
			this.autofillMap = null;
			this.autofillRequiredFields = [];
			this.autofillConflicts = [];
			// The record belongs to the form that is going away: the same component instance serves the
			// next action and the next document type, where the very same field code means another field.
			this.autoFilledValues = {};

			if (this.$refs.contentContainer)
			{
				this.$refs.contentContainer.innerHTML = '';
			}
		},

		cleanupFormResources(): void
		{
			closeExpressionBuilder();
			unmountFormVeneers(this.$refs.contentContainer);
			this.clearRequiredFieldErrors();
			this.cleanupRenderFinishedHandler();
			this.disconnectProjectFieldStateObservers();
			if (this.rendererInstance && Type.isFunction(this.rendererInstance.destroy))
			{
				this.rendererInstance.destroy();
			}
			this.rendererInstance = null;
			this.settingsForm = null;
		},

		getFormData(knownSnapshot: ?Object = null): ExtractedFormData | null
		{
			return this.extractFormData(this.settingsForm, knownSnapshot);
		},

		/**
		 * Runs on every keystroke in any control of the form, so the whole pass reads the form once: the
		 * snapshot travels through the steps below and is retaken only where one of them writes.
		 */
		onChange(): void
		{
			const hasManuallyEditedAutoFields = this.dropManuallyEditedAutoFields();

			let snapshot = null;
			if (
				(hasManuallyEditedAutoFields || this.autofillConflicts?.length)
				&& !this.isReapplyingRelationFields
			)
			{
				this.isReapplyingRelationFields = true;
				try
				{
					snapshot = this.reapplyClearedRelationFields();
				}
				finally
				{
					this.isReapplyingRelationFields = false;
				}
			}

			this.changeRuleExpression(this.construction, {
				rawActivityData: this.getFormData(snapshot),
			});
		},

		extractFormData(form: HTMLFormElement | null, knownSnapshot: ?Object = null): ExtractedFormData | null
		{
			if (!form)
			{
				return null;
			}

			const formData = knownSnapshot ?? ajax.prepareForm(form).data;

			return {
				...formData,
				activityType: this.actionId,
				documentType: this.propertiesDialogDocumentType,
				id: Type.isStringFilled(formData.activity_id) ? formData.activity_id : createUniqueId(),
			};
		},

		getPropertyDialogDocumentType(selectedDocument: ?string): Array<string>
		{
			return resolvePropertyDialogDocumentType({
				action: this.action,
				fixedDocumentType: this.nodeSettings?.fixedDocumentType,
				workflowDocumentType: this.documentType,
				selectedDocument,
				resolveSelectedDocumentType: () => {
					return evaluateActionExpressionDocumentType(this.connectedBlocks, selectedDocument);
				},
			});
		},

		onFormClick(event: MouseEvent): void
		{
			handleBpSelectorButtonClick(event, {
				form: this.settingsForm,
				store: this.store,
				block: this.block,
				portId: this.targetRulePortId,
				connectedBlocks: this.connectedBlocks,
				evaluationStage: EVALUATION_STAGE.IN_STARTED_WORKFLOW,
				onChange: () => this.onChange(),
			});
		},
	},
	template: `
		<Loader v-if="status === Status.Loading"/>
		<form
			v-if="renderedControlsMap"
			id="form-settings-extended"
			ref="settingsForm"
			@click.capture="onFormClick"
			@input.capture="onFormValueEvent"
			@change.capture="onFormValueEvent"
			v-form-input-tracker="onChange"
		>
			<div
				v-for="field in nodeControls"
				:key="field.fieldName"
				class="node-settings-edit-box"
				:class="{ hidden: field.property.Hidden }"
				:id="'row_' + field.fieldName"
				:data-testid="'bizprocdesigner-action-field-row-' + field.fieldName"
			>
				<div
					v-if="shouldShowFieldLabel(field)"
					class="edit-action-expression-form__label"
					:class="{
						'--required': shouldShowRequiredMark(field) && !isDeletedProjectSelected(field),
						'--project-deleted': isDeletedProjectSelected(field),
					}"
					data-role="project-field-caption"
				>
					<span>{{ field.property.Name }}</span>
					<span
						v-if="isDeletedProjectSelected(field) && shouldShowRequiredMark(field)"
						class="node-settings-edit-caption-required"
					>*</span>
					<span
						v-if="isDeletedProjectSelected(field)"
						class="node-settings-project-warning"
						:title="getProjectDeletedHint()"
						:aria-label="getProjectDeletedHint()"
						role="img"
						data-test-id="bizproc-node-settings-project-deleted-warning"
					>
						<BIcon
							:name="iconSet.ALERT_ACCENT"
							:size="16"
							color="var(--ui-color-accent-main-warning)"
						/>
					</span>
				</div>
				<div class="field-row" v-bx-control="renderedControlsMap[field.controlId]"></div>
			</div>
		</form>
		<div
			v-else
			@click.capture="onFormClick"
			@input.capture="onFormValueEvent"
			@change.capture="onFormValueEvent"
			v-form-input-tracker="onChange"
			ref="contentContainer"
		></div>
	`,
};
