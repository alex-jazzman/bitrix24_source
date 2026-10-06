import { Type, ajax, Event, Loc, Dom, Tag, Text, Runtime } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { ref, inject } from 'ui.vue3';
import { mapActions, mapState } from 'ui.vue3.pinia';

import { diagramStore } from '../../../entities/blocks';
import {
	useNodeSettingsStore,
	getConnectedBlocksContextForConstruction,
	evaluateActionExpressionDocumentType, type ActionDictEntry,
} from '../../../entities/node-settings';
import { EVENT_NAMES } from '../../../entities/node-settings/constants/index';
import {
	CorrectDocumentTypeLength,
	resolvePropertyDialogDocumentType,
} from '../../../entities/node-settings/utils/property-dialog-document-type';
import { complexNodeApi, type RelationSource } from '../../../entities/node-settings/api';
import { editorAPI } from '../../../shared/api';
import { TITLE_FIELD_NAME, PROPERTY_TYPES, EVALUATION_STAGE } from '../../../shared/constants';
import { usePropertyDialog } from '../../../shared/composables';
import { type ActivityData, type Block, type SettingsControls } from '../../../shared/types';
import { Loader } from '../../../shared/ui';
import { createUniqueId, deepEqual, hasVisibleFieldLabel, isRequiredField } from '../../../shared/utils';
import { BxControl } from '../directives/bx-control';
import { FormInputTracker } from '../directives/form-input-tracker';
import { handleBpSelectorButtonClick } from '../utils/bp-selector-button';
import { closeExpressionBuilder, mountExpressionBuilders } from '../utils/expression-builder-mount';
import { unmountFormVeneers } from '../utils/readable-expressions-veneer';
import { fillEmptyFields, snapshotValues, isFieldEmpty, setFieldValue, locateField } from '../utils/autofill-form';

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

// @vue/component
export const EditExtendedAction = {
	name: 'edit-extended-action',
	components: { Loader },
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
	},
	setup(): { store: diagramStore; isActionFormLoading: { value: boolean }; }
	{
		const store: diagramStore = diagramStore();
		const isActionFormLoading = inject('isActionFormLoading', ref(false));

		return { store, isActionFormLoading };
	},
	data(): {
		status: StatusType,
		settingsForm: HTMLFormElement | null,
		nodeControls: NodeControl[] | null,
		renderedControlsMap: RenderedControlsMap | null,
		rendererInstance: RendererInstance | null,
		lastRenderRequestId: number,
		autofillMap: Record<string, string> | null,
		}
	{
		return {
			status: '',
			settingsForm: null,
			nodeControls: null,
			renderedControlsMap: null,
			rendererInstance: null,
			lastRenderRequestId: 0,
			autofillMap: null,
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
			'currentSettingsItems',
			'isRelationAutofillEnabled',
			'autofillRequests',
		]),
		Status: (): Status => Status,
		action(): ?ActionDictEntry
		{
			if (this.nodeSettings.relationAction?.id === this.actionId)
			{
				return this.nodeSettings.relationAction;
			}

			return this.actionMeta ?? this.nodeSettings.actions.get(this.actionId);
		},
		propertiesDialogDocumentType(): Array<string>
		{
			return this.getPropertyDialogDocumentType(this.selectedDocument);
		},
		connectedBlocksContext(): Object
		{
			return getConnectedBlocksContextForConstruction(
				this.block,
				this.currentRule.id,
				this.ruleCard,
				this.construction,
				this.currentSettingsItems,
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
	},
	mounted(): void
	{
		this.init();
	},
	unmounted(): void
	{
		// Drops a debounced recompute that would otherwise fire after teardown (into a detached form).
		this.isUnmounted = true;
		this.lastRenderRequestId++;
		this.unsubscribe();
		this.cleanupFormResources();
	},
	methods: {
		...mapActions(useNodeSettingsStore, [
			'changeRuleExpression',
			'saveAutofillSnapshot',
			'getAutofillSnapshot',
			'consumeAutofillRequest',
		]),

		isRenderCancelled(requestId: number): boolean
		{
			return this.lastRenderRequestId !== requestId;
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
			if (!this.isPropertiesDialogDocumentTypeReady)
			{
				this.isActionFormLoading = false;
				this.clearForm();
				this.onChange();

				return;
			}

			try
			{
				await this.loadForm();

				this.subscribeOnBeforeSubmit();
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
			this.onChangeCallback = () => {
				this.onChange();

				return this.revalidateRequiredFields(true);
			};
			EventEmitter.subscribe(EVENT_NAMES.BEFORE_SUBMIT_EVENT, this.onChangeCallback);
		},

		unsubscribe(): void
		{
			if (this.onChangeCallback)
			{
				EventEmitter.unsubscribe(EVENT_NAMES.BEFORE_SUBMIT_EVENT, this.onChangeCallback);
			}
		},

		async loadForm(): Promise<void>
		{
			const requestId = ++this.lastRenderRequestId;
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
				const settingControls: SettingsControls = await editorAPI.getNodeSettingsControls({
					documentType: this.propertiesDialogDocumentType,
					activity,
					workflow: {
						workflowParameters: JSON.stringify(this.template?.PARAMETERS ?? {}),
						workflowVariables: JSON.stringify(this.template?.VARIABLES ?? {}),
						workflowTemplate: JSON.stringify(compatibleTemplate),
						workflowConstants: JSON.stringify(this.template?.CONSTANTS ?? {}),
					},
					options: { hideEditorComment: true },
				});

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
				// The backend authorizes autofill against the server-resolved target type, so no document
				// type is sent. Returns the map instead of assigning this.autofillMap here, so a stale
				// response cannot overwrite a newer one — the caller assigns it under its own guard.
				const loaded = await complexNodeApi.loadSettings(this.block.activity, sources);
				if (this.isRenderCancelled(requestId) || !loaded)
				{
					return null;
				}

				return Type.isPlainObject(loaded.autofillMap) ? loaded.autofillMap : {};
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
			if (this.autofillRequests?.[constructionId] !== true)
			{
				return;
			}

			const snapshot = this.getAutofillSnapshot(constructionId);
			if (snapshot)
			{
				// return: fully synchronous, so consume now — no await can drop the request here. Restore
				// the session values (auto + manual) into still-empty fields and the recorded auto list.
				// The map is NOT re-applied, so a field the user cleared before leaving stays empty. The
				// snapshot's auto list is assigned outright (replace), not a union.
				this.consumeAutofillRequest(constructionId);
				fillEmptyFields(this.settingsForm, snapshot.values);
				this.store.setAutoFilledFields(this.block.id, constructionId, snapshot.auto ?? []);
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

					this.autofillMap = map;
				}

				// Form is ready and current: consume the one-shot request and write the direct matches.
				this.consumeAutofillRequest(constructionId);
				const filled = fillEmptyFields(this.settingsForm, this.autofillMap);
				this.store.mergeAutoFilledFields(this.block.id, constructionId, filled);
			}

			this.revalidateRequiredFields(true);
		},

		/**
		 * snapshots the current "Create" form (auto + manual values plus the auto-filled field
		 * list) before the user switches to another action, so it can be restored on return. The
		 * snapshot is session-only and keyed by the stable construction.id.
		 */
		captureAutofillSnapshotOnLeave(leavingActionId: string): void
		{
			if (!this.isRelationAutofillEnabled || !this.settingsForm)
			{
				return;
			}

			const leavingAction = this.actionMeta ?? this.nodeSettings.actions.get(leavingActionId);
			if (!leavingAction?.isRelationCreate)
			{
				return;
			}

			this.saveAutofillSnapshot(this.construction.id, {
				values: snapshotValues(this.settingsForm),
				auto: this.block.node?.autoFilledFields?.[this.construction.id] ?? [],
			});
		},

		/**
		 * recompute: after the user changes the relation source/edge of an already-mounted
		 * "Create" form, re-applies the freshly loaded autofill map. Touches ONLY previously auto-filled
		 * fields (autoFilledFields[constructionId]) and still-empty fields; manual and manually-cleared
		 * values are preserved. An auto-value that vanished from the new map is cleared
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

			this.autofillMap = map;
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
		 */
		revalidateRequiredFields(shouldFocus: boolean = false): boolean
		{
			if (
				!this.action?.isRelationCreate
				|| !this.isRelationAutofillEnabled
				|| !this.settingsForm
			)
			{
				return false;
			}

			this.clearRequiredFieldErrors();

			// One prepareForm snapshot for the whole required-field pass (nothing is written here).
			const snapshot = snapshotValues(this.settingsForm);
			let hasErrors = false;
			this.collectRequiredFields().forEach(({ fieldCode, name }) => {
				if (isFieldEmpty(this.settingsForm, fieldCode, snapshot))
				{
					this.showRequiredFieldError(fieldCode, name, shouldFocus);
					hasErrors = true;
				}
			});

			return hasErrors;
		},

		/**
		 * Required fields of the "Create" form, taken from the rendered controls metadata (the title
		 * field is excluded, same rule as shouldShowRequiredMark). Empty when controls came from the
		 * legacy property dialog, which exposes no per-field Required metadata to the client here.
		 */
		collectRequiredFields(): Array<{ fieldCode: string, name: string }>
		{
			if (!Type.isArray(this.nodeControls))
			{
				return [];
			}

			return this.nodeControls.reduce((acc, field) => {
				if (this.shouldShowRequiredMark(field) && Type.isStringFilled(field.fieldName))
				{
					acc.push({ fieldCode: field.fieldName, name: field.property.Name });
				}

				return acc;
			}, []);
		},

		showRequiredFieldError(fieldCode: string, name: string, shouldFocus: boolean = false): void
		{
			const input = this.locateFieldInput(fieldCode);
			if (!input)
			{
				return;
			}

			// Focus the first empty required field of a pass, but only on an explicit "Create" apply
			// (shouldFocus). A background recompute from an off-form relation edit still flags the field
			// inline yet must not pull focus into the form (WCAG 3.2.x). clearRequiredFieldErrors()
			// empties the list before the pass, so an empty list here means this is the first flagged field.
			const isFirstError = this.requiredErrorHandlers.length === 0;

			Dom.addClass(input, 'has-error');
			// property.Name is an author-controlled document field title; Tag.render treats string
			// interpolations as raw HTML, so encode it before it reaches the alert (XSS).
			const message = Loc.getMessage('BIZPROCDESIGNER_EDITOR_REQUIRED_FIELD_ERROR', {
				'#FIELD#': Text.encode(name),
			});
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
			input.after(alert);

			Dom.attr(input, { 'aria-invalid': 'true', 'aria-describedby': alertId });

			const clear = () => {
				Dom.removeClass(input, 'has-error');
				Dom.attr(input, { 'aria-invalid': null, 'aria-describedby': null });
				Dom.remove(alert);
				Event.unbind(input, 'input', clear);
				Event.unbind(input, 'change', clear);
			};
			Event.bind(input, 'input', clear);
			Event.bind(input, 'change', clear);
			this.requiredErrorHandlers.push({ input, clear });

			if (isFirstError && shouldFocus)
			{
				input.focus();
			}
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

				const documentProperty = returnProperties.find(
					(property) => property.Type === PROPERTY_TYPES.DOCUMENT && Type.isArrayFilled(property.Default),
				);
				if (!documentProperty)
				{
					return sources;
				}

				sources.push({
					blockId: block.id,
					documentType: documentProperty.Default,
					outputs: returnProperties.map((property) => property.Id),
					documentOutput: documentProperty.Id,
				});

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
							portId: this.currentRule.id,
							connectedBlocks: this.connectedBlocks,
							// An action is executed by a workflow that has already started, so its
							// fields keep the full set of template sources even under a trigger.
							evaluationStage: EVALUATION_STAGE.IN_STARTED_WORKFLOW,
						});
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
			const form = await renderPropertyDialog(this.$refs.contentContainer, formData);
			if (form)
			{
				this.settingsForm = form;
				mountExpressionBuilders(this.settingsForm, {
					block: this.block,
					portId: this.currentRule.id,
					connectedBlocks: this.connectedBlocks,
					evaluationStage: EVALUATION_STAGE.IN_STARTED_WORKFLOW,
				});
			}
		},

		clearForm(): void
		{
			this.cleanupFormResources();
			this.renderedControlsMap = null;
			this.nodeControls = null;
			this.autofillMap = null;

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
			if (this.rendererInstance && Type.isFunction(this.rendererInstance.destroy))
			{
				this.rendererInstance.destroy();
			}
			this.rendererInstance = null;
			this.settingsForm = null;
		},

		getFormData(): ExtractedFormData | null
		{
			return this.extractFormData(this.settingsForm);
		},

		onChange(): void
		{
			this.changeRuleExpression(this.construction, {
				rawActivityData: this.getFormData(),
			});
		},

		extractFormData(form: HTMLFormElement | null): ExtractedFormData | null
		{
			if (!form)
			{
				return null;
			}

			const formData = ajax.prepareForm(form).data;

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
				fixedDocumentType: this.nodeSettings.fixedDocumentType,
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
				portId: this.currentRule.id,
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
			v-form-input-tracker="onChange"
		>
			<div
				v-for="field in nodeControls"
				:key="field.fieldName"
				class="node-settings-edit-box"
				:class="{ hidden: field.property.Hidden }"
				:id="'row_' + field.fieldName"
			>
				<div
					v-if="shouldShowFieldLabel(field)"
					class="edit-action-expression-form__label"
					:class="{ '--required': shouldShowRequiredMark(field) }"
				>
					{{ field.property.Name }}
				</div>
				<div class="field-row" v-bx-control="renderedControlsMap[field.controlId]"></div>
			</div>
		</form>
		<div
			v-else
			@click.capture="onFormClick"
			v-form-input-tracker="onChange"
			ref="contentContainer"
		></div>
	`,
};
