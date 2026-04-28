import { Type, ajax, Dom, Event } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { ValueSelector } from '../../../entities/common-node-settings';
import { mapActions, mapState } from 'ui.vue3.pinia';
import { diagramStore } from '../../../entities/blocks';

import type {
	ActivityData,
	// eslint-disable-next-line no-unused-vars
	DiagramTemplate,
	Block, SettingsControls,
} from '../../../shared/types';
import { createUniqueId, deepEqual } from '../../../shared/utils';
import { Loader } from '../../../shared/ui';
import { usePropertyDialog } from '../../../shared/composables';

import {
	useNodeSettingsStore,
	// eslint-disable-next-line no-unused-vars
	type Construction,
	ActionDictEntry,
	evaluateActionExpressionDocumentType,
} from '../../../entities/node-settings';
import { editorAPI } from '../../../shared/api';
import { EVENT_NAMES } from '../../../entities/node-settings/constants/index';

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

const CorrectDocumentTypeLength = 3;

const formInputTrackerHandlers: WeakMap<HTMLElement, () => void> = new WeakMap();

const vFormInputTracker = {
	mounted(el: HTMLElement, binding: { value: () => void }): void
	{
		const handler = () => binding.value();
		formInputTrackerHandlers.set(el, handler);
		Event.bind(el, 'input', handler);
	},
	beforeUnmount(el: HTMLElement): void
	{
		const handler = formInputTrackerHandlers.get(el);
		if (handler)
		{
			Event.unbind(el, 'input', handler);
			formInputTrackerHandlers.delete(el);
		}
	},
};

const vBxControl = {
	mounted(el: HTMLElement, binding: { value: HTMLElement | null }): void
	{
		if (binding.value)
		{
			Dom.append(binding.value, el);
		}
	},
};

// @vue/component
export const EditExtendedAction = {
	name: 'edit-extended-action',
	components: { Loader },
	directives: { FormInputTracker: vFormInputTracker, BxControl: vBxControl },
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
			required: true,
		},
		selectedDocument: {
			type: [String, null],
			required: false,
			default: null,
		},
	},
	setup(): { store: diagramStore; }
	{
		const store: diagramStore = diagramStore();

		return { store };
	},
	data(): {
		status: StatusType,
		settingsForm: HTMLFormElement | null,
		nodeControls: NodeControl[] | null,
		renderedControlsMap: RenderedControlsMap | null,
		rendererInstance: RendererInstance | null,
		lastRenderRequestId: number,
		}
	{
		return {
			status: '',
			settingsForm: null,
			nodeControls: null,
			renderedControlsMap: null,
			rendererInstance: null,
			lastRenderRequestId: 0,
		};
	},
	computed: {
		...mapState(useNodeSettingsStore, ['block', 'currentRuleId', 'nodeSettings']),
		Status: (): Status => Status,
		action(): ?ActionDictEntry
		{
			return this.nodeSettings.actions.get(this.actionId);
		},
		propertiesDialogDocumentType(): Array<string>
		{
			return this.getPropertyDialogDocumentType(this.selectedDocument);
		},
		connectedBlocks(): Array<Block>
		{
			return this.store.getAllBlockAncestors(this.block, this.currentRuleId);
		},
		isPropertiesDialogDocumentTypeReady(): boolean
		{
			return this.propertiesDialogDocumentType.length === CorrectDocumentTypeLength;
		},
	},
	watch: {
		actionId(newVal: string, oldVal: string): void
		{
			if (newVal === oldVal)
			{
				return;
			}

			this.init();
		},
		selectedDocument(newVal: ?string, oldVal: ?string): void
		{
			if (newVal === oldVal)
			{
				return;
			}

			const newPropertyDialogDocumentType = this.getPropertyDialogDocumentType(newVal);
			const oldPropertyDialogDocumentType = this.getPropertyDialogDocumentType(oldVal);
			if (!deepEqual(newPropertyDialogDocumentType, oldPropertyDialogDocumentType))
			{
				this.init();
			}
		},
	},
	mounted(): void
	{
		this.init();
	},
	unmounted(): void
	{
		this.lastRenderRequestId++;
		this.unsubscribe();
		this.cleanupFormResources();
	},
	methods: {
		...mapActions(useNodeSettingsStore, ['changeRuleExpression']),

		isRenderCancelled(requestId: number): boolean
		{
			return this.lastRenderRequestId !== requestId;
		},

		async init(): Promise<void>
		{
			if (!this.isPropertiesDialogDocumentTypeReady)
			{
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

			this.onChangeCallback = () => this.onChange();
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
				const defaultProps = Type.isPlainObject(this.action.properties)
					? { ...this.action.properties }
					: {}
				;

				activity = {
					Name: createUniqueId(),
					Type: this.actionId,
					Activated: 'Y',
					Properties: {
						Title: this.action.title,
						...defaultProps,
					},
				};
			}

			const compatibleTemplate = [{ Type: 'NodeWorkflowActivity', Children: [], Name: 'Template' }];
			compatibleTemplate[0].Children.push(
				activity,
				...this.store.getAllBlockAncestors(this.block, this.currentRuleId).map((b) => b.activity),
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
			}
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
			if (!this.action)
			{
				return [];
			}

			if (!Type.isArrayFilled(this.nodeSettings.fixedDocumentType))
			{
				return this.documentType;
			}

			if (!this.action.handlesDocument)
			{
				return this.nodeSettings.fixedDocumentType.length < CorrectDocumentTypeLength
					? this.documentType
					: this.nodeSettings.fixedDocumentType
				;
			}

			if (!selectedDocument)
			{
				return [];
			}

			if (this.nodeSettings.fixedDocumentType.length === CorrectDocumentTypeLength)
			{
				return this.nodeSettings.fixedDocumentType;
			}

			return evaluateActionExpressionDocumentType(this.connectedBlocks, selectedDocument);
		},

		onFormClick(event: MouseEvent): void
		{
			const { target } = event;
			if (!target || !(target instanceof HTMLElement))
			{
				return;
			}

			if (this.isSelectorButton(target))
			{
				event.stopPropagation();

				void this.showSelector(target);
			}
		},

		isSelectorButton(element: HTMLElement): boolean
		{
			return element.getAttribute('data-role') === 'bp-selector-button';
		},

		async showSelector(targetElement: HTMLElement): Promise<void>
		{
			let inputElement = null;
			const propsAttr = targetElement.getAttribute('data-bp-selector-props');

			if (propsAttr)
			{
				const controlId = (JSON.parse(propsAttr))?.controlId ?? null;
				if (controlId)
				{
					inputElement = this.settingsForm.querySelector(`#${CSS.escape(controlId)}`);
				}
			}

			if (!inputElement)
			{
				inputElement = targetElement.closest('.field-row')?.querySelector('input[type="text"], textarea');
			}

			if (!inputElement)
			{
				return;
			}

			const selector = new ValueSelector(
				this.store,
				this.block,
				this.currentRuleId,
			);

			try
			{
				const value = await selector.show(targetElement);
				const beforePart = inputElement.value.slice(0, inputElement.selectionEnd || 0);
				const middlePart = value;
				const afterPart = inputElement.value.slice(inputElement.selectionEnd || 0);

				inputElement.value = beforePart + middlePart + afterPart;
				inputElement.selectionEnd = beforePart.length + middlePart.length;
				inputElement.focus();

				inputElement.dispatchEvent(new window.Event('change'));
				this.onChange();
			}
			catch (error)
			{
				console.error(error);
			}
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
				<div class="edit-action-expression-form__label">{{ field.property.Name }}</div>
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
