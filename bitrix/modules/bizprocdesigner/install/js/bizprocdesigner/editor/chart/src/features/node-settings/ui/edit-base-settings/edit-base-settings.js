import { markRaw } from 'ui.vue3';
import { mapActions, mapState } from 'ui.vue3.pinia';
import { Dom, Type, ajax, Event } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { diagramStore } from '../../../../entities/blocks';
import {
	useNodeSettingsStore,
	EVENT_NAMES,
	getConnectedBlocksContextForConstruction,
} from '../../../../entities/node-settings';
import { editorAPI } from '../../../../shared/api';
import { TITLE_FIELD_NAME } from '../../../../shared/constants';
import { useLoc, usePropertyDialog } from '../../../../shared/composables';
import { Loader } from '../../../../shared/ui';
import { createUniqueId, deepEqual, hasVisibleFieldLabel, isRequiredField } from '../../../../shared/utils';
import { BxControl } from '../../directives/bx-control';
import { FormInputTracker } from '../../directives/form-input-tracker';
import { handleBpSelectorButtonClick, isBpSelectorButtonTarget } from '../../utils/bp-selector-button';
import { closeExpressionBuilder, mountExpressionBuilders } from '../../utils/expression-builder-mount';
import { unmountFormVeneers } from '../../utils/readable-expressions-veneer';

import './style.css';

/**
 * EditBaseSettings — generic scaffold for the BASE_SETTINGS block (UX 935-82879).
 *
 * Renders: chip label + hint + a slot/container for node-specific fields.
 * Concrete fields (e.g. notification MVP) are provided by the owning node scenario
 * via the property-dialog controls mechanism (same as EditExtendedAction).
 *
 * Variant A invariant: base-settings is host-merged, so this component reuses
 * the same getNodeSettingsControls / renderPropertyDialog pipeline as action blocks.
 * The activityData.Properties are written back via changeRuleExpression.
 */

const Status = Object.freeze({
	Loading: 'loading',
	Loaded: 'loaded',
	Error: 'error',
	Empty: 'empty',
});

/**
 * Contract of the ordinary settings panel that activity renderers subscribe to: the base-settings block hosts
 * the very same legacy form, so it raises the event as well and the renderer of the node keeps working here.
 */
const NODE_SETTINGS_SAVING_EVENT = 'Bizproc.NodeSettings:nodeSettingsSaving';

let baseSettingsIdCounter = 0;

// @vue/component
export const EditBaseSettings = {
	name: 'EditBaseSettings',
	components: { Loader },
	directives: { FormInputTracker, BxControl },
	props: {
		/** @type Construction with type === 'base-settings' */
		construction: {
			type: Object,
			required: true,
		},
		documentType: {
			type: Array,
			required: true,
		},
		/** @type DiagramTemplate | null */
		template: {
			type: [Object, null],
			required: true,
		},
		/** @type TRuleCard - the head card this construction belongs to; keys its source context. */
		ruleCard: {
			type: Object,
			required: true,
		},
	},
	setup(): { store: Object; getMessage: () => string; fieldIdPrefix: string; }
	{
		const store = diagramStore();
		const { getMessage } = useLoc();
		baseSettingsIdCounter++;

		return {
			store,
			getMessage,
			fieldIdPrefix: `editor-chart-edit-base-settings-${baseSettingsIdCounter}`,
		};
	},
	data(): { status: string; settingsForm: HTMLFormElement | null; nodeControls: Array | null; renderedControlsMap: Object | null; rendererInstance: Object | null; lastRenderRequestId: number; }
	{
		return {
			status: Status.Empty,
			settingsForm: null,
			nodeControls: null,
			renderedControlsMap: null,
			rendererInstance: null,
			lastRenderRequestId: 0,
		};
	},
	computed: {
		...mapState(useNodeSettingsStore, ['block', 'currentRule', 'nodeSettings', 'currentSettingsItems']),
		Status: () => Status,
		/**
		 * Sources the fields of this form may read: the packages of the ancestors of the node first of
		 * all. Read through the very context builder the action, the condition and the filter of the
		 * same node use, so a base setting is offered what the rest of the node is offered instead of
		 * the bare ancestor walk the value selector falls back to on its own.
		 * The own package of the node is not among them by construction: it is published in execute(),
		 * after the base settings are already computed, so isOwnReturnPropertiesSource() answers for
		 * the action block only.
		 */
		connectedBlocks(): Array<Object>
		{
			if (!this.block || !this.currentRule)
			{
				return [];
			}

			return getConnectedBlocksContextForConstruction(
				this.block,
				this.currentRule.id,
				this.ruleCard,
				this.construction,
				this.currentSettingsItems,
			).allBlocks;
		},
		/** Resolved document type for property-dialog rendering (uses fixed or diagram type). */
		propertiesDialogDocumentType(): Array<string>
		{
			const fixed = this.nodeSettings?.fixedDocumentType;
			if (Array.isArray(fixed) && fixed.length === 3)
			{
				return fixed;
			}

			return this.documentType;
		},
		isDocumentTypeReady(): boolean
		{
			return this.propertiesDialogDocumentType.length === 3;
		},
		activityData(): Object | null
		{
			return this.construction.expression?.activityData ?? null;
		},
	},
	watch: {
		propertiesDialogDocumentType(newVal: Array, oldVal: Array): void
		{
			if (!deepEqual(newVal, oldVal))
			{
				void this.init();
			}
		},
	},
	mounted(): void
	{
		this.registerBaseSettingsFormFlush(this.flushPendingChange);
		void this.init();
	},
	unmounted(): void
	{
		this.lastRenderRequestId++;
		// Unregistered before the flush, so the store never reaches a form that is being torn down.
		// The flush reads the form directly and runs while cleanupFormResources still keeps it.
		this.unregisterBaseSettingsFormFlush(this.flushPendingChange);
		this.unsubscribe();
		try
		{
			// The last edits of the form reach the store instead of dying with the pending debounce.
			this.flushPendingChange();
		}
		catch (error)
		{
			// The teardown below has to run anyway: a failed last commit degrades like a failed flush
			// on the store side.
			console.error(error);
		}
		this.cleanupFormResources();
		this.cancelDebouncedOnChange();
	},
	methods: {
		...mapActions(useNodeSettingsStore, [
			'changeRuleExpression',
			'registerBaseSettingsFormFlush',
			'unregisterBaseSettingsFormFlush',
		]),

		isRenderCancelled(requestId: number): boolean
		{
			return this.lastRenderRequestId !== requestId;
		},

		/**
		 * Resolves the backing activity type whose property-dialog the base-settings form renders.
		 * Priority: the construction's node-action binding (actionId) → the persisted
		 * activityData.Type → the owning node's own type. actionId wins so a node-action-backed
		 * base-settings renders that action's fields deterministically instead of the node's.
		 */
		resolveBackingActivityType(): string | null
		{
			return this.construction.expression?.actionId
				?? this.activityData?.Type
				?? this.block?.activity?.Type
				?? null
			;
		},

		async init(): Promise<void>
		{
			if (!this.isDocumentTypeReady)
			{
				this.status = Status.Empty;
				this.clearForm();
				// Immediate commit: document type not ready means no form data to persist.
				this.commitOnChange();

				return;
			}

			// Determine the backing activity type for the form.
			const backingActivityType = this.resolveBackingActivityType();

			if (!backingActivityType)
			{
				// No backing activity type yet: show empty scaffold without controls.
				this.status = Status.Empty;

				return;
			}

			try
			{
				await this.loadForm(backingActivityType);
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
			// Flush any pending debounced update immediately, then commit synchronously.
			// The returned flag blocks the save of the node, as for every other subscribed form.
			this.onChangeCallback = () => {
				this.cancelDebouncedOnChange();
				this.commitOnChange();

				return this.hasActivityFormError();
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

		/**
		 * Client-side checks the activity owns itself, run through the event the ordinary settings panel
		 * raises before it saves (the CRM field-changed trigger checks its tracked fields there). A renderer
		 * refuses the save by raising, and it flags the offending control on its own, so the raise is turned
		 * into the flag this panel blocks a save with and no message box is raised on top of it. The values
		 * are already committed to the store, so the object handed out is a read of the form, not the payload
		 * of the save.
		 */
		hasActivityFormError(): boolean
		{
			const formData = this.getFormData();
			if (formData === null)
			{
				return false;
			}

			try
			{
				EventEmitter.emit(NODE_SETTINGS_SAVING_EVENT, { formData });
			}
			catch
			{
				return true;
			}

			return false;
		},

		/**
		 * Cancels any pending debounced onChange invocation.
		 * Called on unmount and before immediate flush.
		 */
		cancelDebouncedOnChange(): void
		{
			if (this._debounceTimer !== undefined)
			{
				clearTimeout(this._debounceTimer);
				this._debounceTimer = undefined;
			}
		},

		/**
		 * Commits the uncommitted edits of the form right away. Registered in the store so that a
		 * reader of the committed values (an action being added inherits them) sees what is on screen,
		 * and used on unmount for the same reason.
		 *
		 * "Uncommitted" is decided by the form content, not by a pending debounce: a legacy BP control
		 * writing into its hidden field programmatically raises no input/change event, so it never
		 * schedules one, and the edit would stay uncommitted for as long as no tracked control is
		 * touched. A pending debounce still commits on its own, as a known edit whose values the
		 * comparison may not tell apart. Committing unconditionally instead would write a fresh
		 * rawActivityData on every read and cost one normalization request per read: the store keys the
		 * normalization by that very object.
		 */
		flushPendingChange(): void
		{
			const formData = this.getFormData();
			if (formData === null)
			{
				// No form on screen (still loading, or none for this document type): nothing to read
				// from, and the state committed by the form of this construction has to stay.
				return;
			}

			const hasPendingChange = this._debounceTimer !== undefined;
			this.cancelDebouncedOnChange();

			if (hasPendingChange || !this.isCommittedFormData(formData))
			{
				this.changeRuleExpression(this.construction, { rawActivityData: formData });
			}
		},

		/**
		 * Whether the form data is already the committed state of the construction.
		 * `id` is left out of the comparison: it falls back to a fresh unique id whenever the form
		 * carries no activity_id, so it would differ on every read, while its meaningful source,
		 * activity_id, is part of the compared form data itself.
		 */
		isCommittedFormData(formData: Object): boolean
		{
			const committed = this.construction.expression?.rawActivityData;
			if (!Type.isPlainObject(committed))
			{
				return false;
			}

			return deepEqual({ ...formData, id: null }, { ...committed, id: null });
		},

		/**
		 * Synchronously commits form data to the store.
		 * Used both as the direct flush path (BEFORE_SUBMIT) and the debounce target.
		 */
		commitOnChange(): void
		{
			this.changeRuleExpression(this.construction, {
				rawActivityData: this.getFormData(),
			});
		},

		async loadForm(backingActivityType: string): Promise<void>
		{
			const requestId = ++this.lastRenderRequestId;
			this.clearForm();
			this.status = Status.Loading;

			let activity = this.activityData;
			if (!activity)
			{
				activity = {
					Name: createUniqueId(),
					Type: backingActivityType,
					Activated: 'Y',
					Properties: {},
				};
			}

			const compatibleTemplate = [{ Type: 'NodeWorkflowActivity', Children: [activity], Name: 'Template' }];

			try
			{
				const settingControls = await editorAPI.getNodeSettingsControls({
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
						activity: backingActivityType,
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

		async renderNodeControls(controls: Array, requestId: number, activity: Object): Promise<void>
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

		prepareNodeControls(controls: Array): Array
		{
			const isNewActivity = !this.activityData;

			// Filter out default controls not relevant to base-settings:
			// - 'title' is the node title field shown on the main tab, not here.
			// - Hidden controls are kept (they carry values like MessageType=4 for round-trip)
			//   but are excluded from visible rendering via :class="{ hidden: field.property.Hidden }".
			const BASE_SETTINGS_EXCLUDED_FIELD_NAMES = new Set(['title']);

			return controls
				.filter((control) => !BASE_SETTINGS_EXCLUDED_FIELD_NAMES.has(control.property?.FieldName))
				.map((control) => {
					const property = control.property || {};
					let currentValue = control.value;

					if (isNewActivity && property.Default !== undefined)
					{
						const isEmpty = (
							currentValue === undefined
							|| currentValue === null
							|| currentValue === ''
							|| (Type.isArray(currentValue) && currentValue.length === 0)
						);

						if (isEmpty)
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

		shouldShowRequiredMark(field: Object): boolean
		{
			return (
				isRequiredField(field)
				&& field.fieldName !== TITLE_FIELD_NAME
				&& this.shouldShowFieldLabel(field)
			);
		},

		shouldShowFieldLabel(field: Object): boolean
		{
			return hasVisibleFieldLabel(field);
		},

		getFieldLabelId(field: Object): ?string
		{
			return this.shouldShowFieldLabel(field) ? `${this.fieldIdPrefix}-label-${field.fieldName}` : null;
		},

		getRenderedControlsCollection(): Object
		{
			// Skip both 'custom' type (handled by initRendererInstance) and hidden fields
			// (hidden fields are submitted via native <input type="hidden"> elements,
			// so they do not need an async designer control rendered for them).
			return BX.Bizproc.FieldType.renderControlCollection(
				this.propertiesDialogDocumentType,
				this.nodeControls.filter((f) => f.property.Type !== 'custom' && !f.property.Hidden),
				'designer',
			);
		},

		initRendererInstance(): Object | null
		{
			const backingType = this.resolveBackingActivityType();
			if (!backingType)
			{
				return null;
			}

			const rendererName = `${backingType}Renderer`;
			const RendererClass = Type.isFunction(window[rendererName]) ? window[rendererName] : null;
			if (!RendererClass)
			{
				return null;
			}

			// markRaw: a reactive proxy over the renderer breaks private #field access inside its methods.
			this.rendererInstance = markRaw(new RendererClass());

			return Type.isFunction(this.rendererInstance.getControlRenderers)
				? this.rendererInstance.getControlRenderers()
				: null
			;
		},

		buildRenderedControlsMap(renderedControls: Object, customRenderers: Object | null): Object
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

		async waitForRenderFinished(requestId: number, renderedControls: Object): Promise<void>
		{
			this.cleanupRenderFinishedHandler();

			// If, after excluding hidden/service fields, there are no controls left to render,
			// BX.Bizproc.FieldType.renderControlCollection() returns {} synchronously and never
			// emits onCollectionRenderControlFinished. Waiting for that event in this case would
			// hang loadForm() in Status.Loading forever, so finish immediately via the same
			// completion path used by the event handler below.
			if (Object.keys(renderedControls).length === 0)
			{
				await this.$nextTick();

				if (!this.isRenderCancelled(requestId))
				{
					this.runAfterFormRender();
					this.setRenderedForm(this.$refs.settingsForm);
				}

				return;
			}

			await new Promise((resolve) => {
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
						this.runAfterFormRender();
						this.setRenderedForm(this.$refs.settingsForm);
					}

					resolve();
				};

				this.pendingRenderFinishedHandler = { eventName, handler };
				Event.EventEmitter.subscribe(eventName, handler);
			});
		},

		isCollectionRendered(renderedControls: Object): boolean
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
				this.setRenderedForm(form);
			}
		},

		/**
		 * Hands the rendered form to the renderer of the activity, together with the controls it was built
		 * from: a renderer reads the settings of a field there (the required-value message of the CRM
		 * field-changed trigger among them), so the map is passed exactly as the ordinary settings panel
		 * passes it. Title and comment are left out for the same reason: they belong to the panel, not to
		 * the activity.
		 */
		runAfterFormRender(): void
		{
			if (!this.rendererInstance?.afterFormRender)
			{
				return;
			}

			const activityFields = {};
			(this.nodeControls ?? []).forEach((field) => {
				if (field.fieldName && field.fieldName !== TITLE_FIELD_NAME)
				{
					activityFields[field.fieldName] = field;
				}
			});

			this.rendererInstance.afterFormRender(this.$refs.settingsForm, activityFields);
		},

		/**
		 * Single entry point for every branch that puts a form on screen: both passes below are DOM
		 * post-processing over the rendered controls, so there is nothing to run them on earlier.
		 */
		setRenderedForm(form: HTMLFormElement | null): void
		{
			this.settingsForm = form;
			this.hideHostTitleRow();
			this.observeHostTitleRow();
			this.mountFormExpressionBuilders();
		},

		/**
		 * The legacy dialog wrapper renders its own node-title row (input#bpastitle). Inside
		 * base-settings the node title is edited on the General tab, and the host-merge save
		 * drops the submitted Title anyway, so the row would be a dead duplicate.
		 * The controls path needs no counterpart: prepareNodeControls() excludes 'title'.
		 * The only mechanism that hides the row: a CSS counterpart on `tr:has(#bpastitle)` would
		 * cost a style invalidation over every `tr` of the nested legacy tables on each mutation.
		 */
		hideHostTitleRow(): void
		{
			const titleInput = this.settingsForm?.querySelector('#bpastitle');
			if (!titleInput)
			{
				this.hiddenHostTitleRow = null;

				return;
			}

			// The input sits under several nested tables (the field renderer wraps it in one of
			// its own) while the label lives on the outermost row of the dialog table, so climb
			// to the outermost row within the form and hide that one.
			let row = titleInput.closest('tr');
			let outermostRow = null;
			while (row && this.settingsForm.contains(row))
			{
				outermostRow = row;
				row = row.parentElement?.closest('tr');
			}

			this.hiddenHostTitleRow = outermostRow ?? titleInput;
			Dom.hide(this.hiddenHostTitleRow);
		},

		/**
		 * Keeps the row hidden through the redraws of the legacy form: the hide is an inline style on
		 * a row a control renderer may replace with a fresh, visible one, while the CSS rule it
		 * replaced matched the redrawn row on its own. Watched only when there is a row to keep — the
		 * controls path renders none — and a mutation batch costs one `isConnected` read, plus the
		 * lookup of the input while the row is out of the form.
		 */
		observeHostTitleRow(): void
		{
			this.disconnectHostTitleRowObserver();
			if (!this.settingsForm || !this.hiddenHostTitleRow)
			{
				return;
			}

			this.hostTitleRowObserver = new MutationObserver(() => {
				if (!this.hiddenHostTitleRow?.isConnected)
				{
					this.hideHostTitleRow();
				}
			});
			this.hostTitleRowObserver.observe(this.settingsForm, { childList: true, subtree: true });
		},

		disconnectHostTitleRowObserver(): void
		{
			if (this.hostTitleRowObserver)
			{
				this.hostTitleRowObserver.disconnect();
				this.hostTitleRowObserver = null;
			}
		},

		/**
		 * The node context both entry points of a field read: the value-insert button of the legacy
		 * control (onFormClick) and the expression builder mounted next to it. One reader for the two,
		 * so the sources they offer cannot drift apart.
		 */
		buildNodeContext(): Object
		{
			return {
				block: this.block,
				portId: this.currentRule?.id,
				connectedBlocks: this.connectedBlocks,
			};
		},

		mountFormExpressionBuilders(): void
		{
			mountExpressionBuilders(this.settingsForm, this.buildNodeContext());
		},

		clearForm(): void
		{
			this.cleanupFormResources();
			this.renderedControlsMap = null;
			this.nodeControls = null;

			if (this.$refs.contentContainer)
			{
				this.$refs.contentContainer.innerHTML = '';
			}
		},

		cleanupFormResources(): void
		{
			closeExpressionBuilder();
			unmountFormVeneers(this.$refs.contentContainer);
			this.cleanupRenderFinishedHandler();
			this.disconnectHostTitleRowObserver();
			this.hiddenHostTitleRow = null;
			if (this.rendererInstance && Type.isFunction(this.rendererInstance.destroy))
			{
				this.rendererInstance.destroy();
			}

			this.rendererInstance = null;
			this.settingsForm = null;
		},

		getFormData(): Object | null
		{
			return this.extractFormData(this.settingsForm);
		},

		/**
		 * Debounced handler for form input/change events (300 ms).
		 * Prevents a full form scan + Pinia write on every keystroke.
		 * Before submit, BEFORE_SUBMIT_EVENT flushes via commitOnChange() synchronously.
		 */
		onChange(): void
		{
			this.cancelDebouncedOnChange();
			this._debounceTimer = setTimeout(() => {
				this._debounceTimer = undefined;
				this.commitOnChange();
			}, 300);
		},

		extractFormData(form: HTMLFormElement | null): Object | null
		{
			if (!form)
			{
				return null;
			}

			const formData = ajax.prepareForm(form).data;

			return {
				...formData,
				// The class of the node is not chosen here: the editor sends back the one the node carries,
				// and the server replaces it only by the upgrade the owner module declares for it.
				activityType: this.resolveBackingActivityType() ?? '',
				documentType: this.propertiesDialogDocumentType,
				id: Type.isStringFilled(formData.activity_id) ? formData.activity_id : createUniqueId(),
			};
		},

		onFormClick(event: MouseEvent): void
		{
			// The handler sits on the whole form, and the context of the node walks its ancestors and the
			// constructions of the rule card: build it for a selector click only.
			if (!isBpSelectorButtonTarget(event.target))
			{
				return;
			}

			handleBpSelectorButtonClick(event, {
				...this.buildNodeContext(),
				form: this.settingsForm,
				store: this.store,
				onChange: () => this.onChange(),
			});
		},
	},
	template: `
		<div
			class="editor-chart-node-settings-edit-base-settings"
			:data-test-id="$testId('complexNodeRuleSettingsBaseSettings')"
		>
			<div class="editor-chart-node-settings-edit-base-settings__content node-settings-panel">
				<!-- Live region: announces loading/error status changes to screen readers -->
				<div class="editor-chart-node-settings-edit-base-settings__status" aria-live="polite">
					<Loader v-if="status === Status.Loading" />
					<div
						v-if="status === Status.Error"
						class="editor-chart-node-settings-edit-base-settings__error"
						:data-test-id="$testId('complexNodeRuleSettingsBaseSettingsError')"
					>
						{{ getMessage('BIZPROCDESIGNER_EDITOR_NODE_SETTINGS_BASE_SETTINGS_LOAD_ERROR') }}
					</div>
				</div>
				<form
					v-if="renderedControlsMap"
					id="form-settings-base-settings"
					ref="settingsForm"
					:data-test-id="$testId('complexNodeRuleSettingsBaseSettingsForm')"
					@click.capture="onFormClick"
					v-form-input-tracker="onChange"
				>
					<template v-for="field in nodeControls" :key="field.fieldName">
						<!-- Hidden fields: submit their default/current value but render no visible control -->
						<input
							v-if="field.property.Hidden"
							type="hidden"
							:name="field.fieldName"
							:value="field.value ?? ''"
						/>
						<!-- Visible fields: label + async BP control + optional caption below (mockup 935:29673).
							The legacy control renders asynchronously, so the row is exposed as a named
							group instead of a direct label/control link. -->
						<div
							v-else
							class="node-settings-edit-box"
							:id="'row_' + field.fieldName"
							role="group"
							:aria-labelledby="getFieldLabelId(field)"
							:aria-describedby="field.property.Description ? fieldIdPrefix + '-description-' + field.fieldName : null"
						>
							<div
								v-if="shouldShowFieldLabel(field)"
								class="edit-action-expression-form__label editor-chart-node-settings-edit-base-settings__field-label"
								:class="{ '--required': shouldShowRequiredMark(field) }"
								:id="fieldIdPrefix + '-label-' + field.fieldName"
							>{{ field.property.Name }}</div>
							<div class="field-row" v-bx-control="renderedControlsMap[field.controlId]"></div>
							<div
								v-if="field.property.Description"
								class="editor-chart-node-settings-edit-base-settings__field-description"
								:id="fieldIdPrefix + '-description-' + field.fieldName"
							>
								{{ field.property.Description }}
							</div>
						</div>
					</template>
				</form>
				<!-- Rendered together with the Loader (as in edit-extended-action): the legacy
					fallback of loadForm() writes into contentContainer while status is Loading,
					so the ref must exist during the whole load. -->
				<div
					v-else
					@click.capture="onFormClick"
					v-form-input-tracker="onChange"
					ref="contentContainer"
				></div>
			</div>
		</div>
	`,
};
