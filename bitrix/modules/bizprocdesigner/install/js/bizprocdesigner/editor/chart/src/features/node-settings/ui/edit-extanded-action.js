import { Type, ajax } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { ValueSelector } from '../../../entities/common-node-settings';
import { mapActions, mapState } from 'ui.vue3.pinia';
import { diagramStore } from '../../../entities/blocks';

// eslint-disable-next-line no-unused-vars
import type { ActivityData, DiagramTemplate } from '../../../shared/types';
import { createUniqueId } from '../../../shared/utils';
import { Loader } from '../../../shared/ui';
import { usePropertyDialog } from '../../../shared/composables';

// eslint-disable-next-line no-unused-vars
import { useNodeSettingsStore, type Construction } from '../../../entities/node-settings';
import { EVENT_NAMES } from '../../../entities/node-settings/constants/index';

type StatusType = $Values<Status>;
const Status: Record<string, StatusType> = Object.freeze({
	Loading: 'loading',
	Loaded: 'loaded',
	Error: 'error',
});

// @vue/component
export const EditExtandedAction = {
	name: 'action-settings-form',
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
		...mapState(useNodeSettingsStore, ['block', 'currentRuleId']),
		Status: (): Status => Status,
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
			try
			{
				await this.loadForm();
				window.BPAShowSelector = this.showSelector;
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
		async showSelector(id: string): Promise<void>
		{
			const selector = new ValueSelector(
				this.store,
				this.block,
				this.currentRuleId,
			);
			const targetElement = document.getElementById(id);
			try
			{
				const value = await selector.show(targetElement);
				const beforePart = targetElement.value.slice(0, targetElement.selectionEnd);
				const middlePart = value;
				const afterPart = targetElement.value.slice(targetElement.selectionEnd);
				targetElement.value = beforePart + middlePart + afterPart;
				targetElement.selectionEnd = beforePart.length + middlePart.length + 1;
				targetElement.focus();
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
			const formData = ajax.prepareForm(form).data;

			formData.documentType = this.documentType;
			formData.activityType = this.actionId;

			formData.id = Type.isStringFilled(formData.activity_id) ? formData.activity_id : createUniqueId();

			return formData;
		},
		async loadForm(): Promise<void> {
			this.$refs.contentContainer.innerHTML = '';

			this.status = Status.Loading;

			let activity: ActivityData = this.activityData;
			if (!activity)
			{
				activity = {
					Name: createUniqueId(),
					Type: this.actionId,
					Activated: 'Y',
					Properties: {},
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
				documentType: this.documentType,
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
	},
	template: `
		<Loader v-if="status === Status.Loading" />
		<div
			ref="contentContainer"
		></div>
	`,
};
