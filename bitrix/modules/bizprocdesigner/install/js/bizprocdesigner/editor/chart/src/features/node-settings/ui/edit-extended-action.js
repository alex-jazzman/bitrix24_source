import { Type, ajax } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { ValueSelector } from '../../../entities/common-node-settings';
import { mapActions, mapState } from 'ui.vue3.pinia';
import { diagramStore } from '../../../entities/blocks';

// eslint-disable-next-line no-unused-vars
import type { ActivityData, DiagramTemplate, Block } from '../../../shared/types';
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
import { EVENT_NAMES } from '../../../entities/node-settings/constants/index';

type StatusType = $Values<Status>;
const Status: Record<string, StatusType> = Object.freeze({
	Loading: 'loading',
	Loaded: 'loaded',
	Error: 'error',
});

const CorrectDocumentTypeLength = 3;

// @vue/component
export const EditExtendedAction = {
	name: 'edit-extended-action',
	components: { Loader },
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
	setup(): { getMessage: () => string; }
	{
		const store: diagramStore = diagramStore();

		return { store };
	},
	data(): { status: StatusType, settingsForm: { [key: string]: any } | null }
	{
		return {
			status: '',
			settingsForm: null,
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
		this.unsubscribe();
	},
	methods: {
		...mapActions(useNodeSettingsStore, ['changeRuleExpression']),
		async init(): void
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
				window.BPAShowSelector = () => {};
				window.HideShow = this.hideShow;
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
		async showSelector(targetElement: HTMLElement): Promise<void>
		{
			const props = targetElement.getAttribute('data-bp-selector-props');
			const controlId = (JSON.parse(props))?.controlId ?? null;
			if (!controlId)
			{
				return;
			}

			const inputElement = this.settingsForm.querySelector(`#${CSS.escape(controlId)}`);
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
				const beforePart = inputElement.value.slice(0, inputElement.selectionEnd);
				const middlePart = value;
				const afterPart = inputElement.value.slice(inputElement.selectionEnd);
				inputElement.value = beforePart + middlePart + afterPart;
				inputElement.selectionEnd = beforePart.length + middlePart.length + 1;
				inputElement.focus();
			}
			catch (error)
			{
				console.error(error);
			}
		},
		getFormData(): { [key: string]: any }
		{
			return this.extractFormData(this.settingsForm);
		},
		onChange(): void
		{
			this.changeRuleExpression(this.construction, {
				rawActivityData: this.getFormData(),
			});
		},
		extractFormData(form: HTMLElement): { [key: string]: any }
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
		async loadForm(): Promise<void> {
			this.clearForm();

			this.status = Status.Loading;

			let activity: ActivityData = this.activityData;
			if (!activity)
			{
				activity = {
					Name: createUniqueId(),
					Type: this.actionId,
					Activated: 'Y',
					Properties: {
						Title: this.action.title,
						...this.action.properties,
					},
				};
			}

			const compatibleTemplate = [{ Type: 'NodeWorkflowActivity', Children: [], Name: 'Template' }];
			compatibleTemplate[0].Children.push(
				activity,
				...this.store.getAllBlockAncestors(this.block, this.currentRuleId).map((b) => b.activity),
			);

			if (window.CreateActivity)
			{
				window.arAllId = {};
				window.arWorkflowTemplate = compatibleTemplate;
				window.rootActivity = window.CreateActivity(compatibleTemplate[0]);
			}

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

			this.status = Status.Loaded;
		},

		async renderPropertyDialog(formData: FormData): Promise<void>
		{
			const { renderPropertyDialog } = usePropertyDialog();
			const form = await renderPropertyDialog(this.$refs.contentContainer, formData);
			if (!form)
			{
				this.hasSettings = false;

				return;
			}

			this.settingsForm = form;
			this.hasSettings = true;
		},
		clearForm(): void
		{
			this.$refs.contentContainer.innerHTML = '';
			this.settingsForm = null;
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
				void this.showSelector(target);
			}
		},
		isSelectorButton(element: HTMLElement): boolean
		{
			return element.getAttribute('data-role') === 'bp-selector-button';
		},
	},
	template: `
		<Loader v-if="status === Status.Loading" />
		<div
			@click="onFormClick"
			ref="contentContainer"
		></div>
	`,
};
