import { Builder, Dictionary } from 'crm.integration.analytics';
import { ajax, Loc } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import { sendData } from 'ui.analytics';
import { UI } from 'ui.notification';
import { defineComponent, markRaw, type PropType } from 'ui.vue3';
import { ActionBar } from '../action-bar/action-bar';
import { ClientTypesCard } from '../client-types-card/client-types-card';
import { DraftCard } from '../draft-card/draft-card';
import { EditorToolbar } from '../editor-toolbar/editor-toolbar';
import { HintCard } from '../hint-card/hint-card';
import { LoadingState } from '../loading-state/loading-state';
import { ScenarioCard } from '../scenario-card/scenario-card';
import { ScriptInfoCard } from '../script-info-card/script-info-card';
import {
	type CallAssessmentV2Events,
	type CallAssessmentV2Settings,
	type Criterion,
	type FilterDescriptor,
	type Mode,
	type MultiFilter,
	type ScriptData,
	type SingleFilter,
} from '../../types';
import './app.css';

const MIN_USER_TEXT_LENGTH = 100;

type SliderCloseHandler = (...args: unknown[]) => unknown;

type SliderCloseLabel = {
	getOnclick: () => SliderCloseHandler | null,
	setOnclick: (handler: SliderCloseHandler | null) => void,
};

type SidePanelSlider = {
	close: () => void,
	getLabel: () => SliderCloseLabel,
	isOpen: () => boolean,
};

const originalCloseHandler = Symbol('originalCloseHandler');
const closeHandlerOwner = Symbol('closeHandlerOwner');

type WrappedCloseHandler = SliderCloseHandler & {
	[originalCloseHandler]: SliderCloseHandler | null,
	[closeHandlerOwner]: object,
};

type AppState = {
	mode: Mode,
	data: ScriptData,
	snapshot: ScriptData,
	userText: string,
	isGenerating: boolean,
	isSaving: boolean,
	criteriaGeneratedByAi: boolean,
	slider: SidePanelSlider | null,
};

export const App = defineComponent({
	name: 'CrmCopilotCallAssessmentV2App',
	components: {
		ActionBar,
		ClientTypesCard,
		DraftCard,
		EditorToolbar,
		HintCard,
		LoadingState,
		ScenarioCard,
		ScriptInfoCard,
	},
	props: {
		initialData: {
			/** @type ScriptData */
			type: Object as PropType<ScriptData>,
			required: true,
		},
		settings: {
			/** @type CallAssessmentV2Settings */
			type: Object as PropType<CallAssessmentV2Settings>,
			required: true,
		},
		events: {
			/** @type CallAssessmentV2Events */
			type: Object as PropType<CallAssessmentV2Events>,
			default: () => ({}),
		},
	},
	data(): AppState
	{
		const isCopy = this.settings.isCopy;
		let initialEditMode: Mode = 'edit';
		if (!isCopy)
		{
			initialEditMode = this.settings.isNewScript ? 'create' : 'view';
		}

		const initialMode: Mode = this.settings.isPendingGeneration ? 'loading' : initialEditMode;

		const data = this.cloneData(this.initialData);
		if (this.settings.isNewScript)
		{
			data.prompt = '';
			data.isHintEnabled = false;
		}

		if (isCopy)
		{
			data.id = null;
		}

		return {
			mode: initialMode,
			data,
			snapshot: this.cloneData(data),
			userText: '',
			isGenerating: this.settings.isPendingGeneration,
			isSaving: false,
			criteriaGeneratedByAi:
				this.settings.isCopy === true
				&& this.initialData.isGeneratedByCopilot === true,
			slider: null,
		};
	},
	computed: {
		title(): string
		{
			return this.data.title;
		},
		description(): string
		{
			return this.data.description;
		},
		filters(): FilterDescriptor[]
		{
			return this.data.filters;
		},
		criteria(): Criterion[]
		{
			return this.data.criteria;
		},
		isEditMode(): boolean
		{
			return this.mode === 'edit';
		},
		isCreateMode(): boolean
		{
			return this.mode === 'create';
		},
		isLoadingMode(): boolean
		{
			return this.mode === 'loading';
		},
		hasUserText(): boolean
		{
			return this.userText.trim() !== '';
		},
		canToggleAi(): boolean
		{
			return Boolean(this.data.id) && !this.settings.readOnly;
		},
	},
	mounted(): void
	{
		if (this.settings.isNewScript || this.settings.isPendingGeneration)
		{
			EventEmitter.subscribe('onPullEvent-crm', this.handlePullEvent);
		}

		const slider = (top as any)?.BX?.SidePanel?.Instance?.getSliderByWindow?.(window) ?? null;
		this.slider = slider ? markRaw(slider) : null;
		if (this.slider)
		{
			this.wrapSliderCloseHandler();
		}
	},
	beforeUnmount(): void
	{
		EventEmitter.unsubscribe('onPullEvent-crm', this.handlePullEvent);

		this.restoreSliderCloseHandler();
	},
	methods: {
		cloneData(source: ScriptData): ScriptData
		{
			const clone = JSON.parse(JSON.stringify(source));

			return {
				...clone,
				prompt: clone.prompt ?? '',
				isHintEnabled: clone.isHintEnabled === true,
			};
		},
		syncHintPrompt(): void
		{
			const hintCard = this.$refs?.hintCard as { syncPrompt: () => string } | undefined;
			if (hintCard)
			{
				this.data.prompt = hintCard.syncPrompt();
			}
		},
		handlePullEvent(event: BaseEvent<[string, { assessmentId?: number }]>): void
		{
			const data = event.getData();
			if (!Array.isArray(data) || data.length < 2)
			{
				return;
			}

			const [command, payload] = data;
			if (command !== 'call_assessment_create_complete')
			{
				return;
			}

			const assessmentId = Number(payload?.assessmentId);
			if (!Number.isFinite(assessmentId) || assessmentId <= 0)
			{
				return;
			}

			const expectedId = Number(this.data.id);
			if (!Number.isFinite(expectedId) || expectedId <= 0 || assessmentId !== expectedId)
			{
				return;
			}

			void this.loadGeneratedScript(assessmentId);
		},
		loadGeneratedScript(assessmentId: number): Promise<void>
		{
			return ajax.runAction('crm.copilot.callassessment.getScriptData', {
				data: { id: assessmentId },
			})
				.then((response: { data?: { data?: ScriptData } }) => {
					const next = response?.data?.data;
					if (!next)
					{
						throw new Error('Empty response');
					}

					this.data = this.cloneData(next);
					this.snapshot = this.cloneData(next);
					this.userText = '';
					this.isGenerating = false;
					this.mode = 'view';
				})
				.catch(() => {
					this.isGenerating = false;
					this.mode = 'view';
					UI.Notification.Center.notify({
						content: Loc.getMessage('CRM_CALL_ASSESSMENT_V2_CREATE_LOAD_GENERATED_ERROR') ?? '',
						autoHideDelay: 5000,
					});
				});
		},
		handleEnterEdit(): void
		{
			sendData(
				Builder.CallAssessment.GridActionsEvent
					.createDefault(Dictionary.ELEMENT_EDIT_BUTTON)
					.setCallAssessmentId(this.data.id || null)
					.buildData(),
			);

			this.snapshot = this.cloneData(this.data);
			this.mode = 'edit';
		},
		handleSave(): void
		{
			if (this.isSaving)
			{
				return;
			}

			this.syncHintPrompt();

			const nonEmptyCriteria = this.data.criteria.filter(
				(criterion: Criterion) => criterion.title.trim() !== '' && criterion.description.trim() !== '',
			);

			if (nonEmptyCriteria.length === 0)
			{
				UI.Notification.Center.notify({
					content: Loc.getMessage('CRM_CALL_ASSESSMENT_V2_MIN_CRITERIA_NOTICE') ?? '',
					autoHideDelay: 5000,
				});

				return;
			}

			const clientFilter = this.data.filters.find((f: FilterDescriptor) => f.code === 'clients');
			const callFilter = this.data.filters.find((f: FilterDescriptor) => f.code === 'calls');

			const clientTypeIds: number[] = clientFilter && clientFilter.multi
				? (clientFilter as MultiFilter).values
				: []
			;
			const callTypeId: number | null = callFilter && !callFilter.multi
				? (callFilter as SingleFilter).value
				: null
			;

			if (clientTypeIds.length === 0)
			{
				UI.Notification.Center.notify({
					content: Loc.getMessage('CRM_CALL_ASSESSMENT_V2_CLIENT_TYPES_REQUIRED') ?? '',
					autoHideDelay: 5000,
				});

				return;
			}

			const payload = {
				id: this.data.id,
				criteriaGeneratedByAi: this.criteriaGeneratedByAi,
				aiGeneratedCriteriaCount: this.criteriaGeneratedByAi
					? nonEmptyCriteria.filter((criterion: Criterion) => criterion.id !== null && criterion.id > 0).length
					: 0,
				data: {
					title: this.data.title,
					description: this.data.description,
					prompt: this.data.prompt,
					isHintEnabled: this.data.isHintEnabled,
					clientTypeIds,
					callTypeId,
					isAiImprovementEnabled: this.data.isAiImprovementEnabled,
				},
				criteria: nonEmptyCriteria.map((criterion: Criterion) => ({
					id: criterion.id,
					title: criterion.title,
					description: criterion.description,
					sort: criterion.sort,
				})),
			};

			this.isSaving = true;

			ajax.runAction('crm.copilot.callassessment.save', {
				data: payload,
				analytics: Builder.CallAssessment.GridActionsEvent
					.createDefault(Dictionary.ELEMENT_SAVE_BUTTON)
					.setCallAssessmentId(this.data.id || null)
					.buildData(),
			})
				.then((response: { data?: { data?: ScriptData } }) => {
					this.criteriaGeneratedByAi = false;
					const next = response?.data?.data;
					if (next)
					{
						this.data = this.cloneData(next);
						this.snapshot = this.cloneData(next);
					}
					else
					{
						this.snapshot = this.cloneData(this.data);
					}
					this.mode = 'view';
					this.isSaving = false;
					this.events.onSave?.(this.cloneData(this.data));
				})
				.catch(() => {
					this.isSaving = false;
					UI.Notification.Center.notify({
						content: Loc.getMessage('CRM_CALL_ASSESSMENT_V2_SAVE_ERROR') ?? '',
						autoHideDelay: 5000,
					});
				});
		},
		handleCancel(): void
		{
			sendData(
				Builder.CallAssessment.GridActionsEvent
					.createDefault(Dictionary.ELEMENT_CANCEL_BUTTON)
					.setCallAssessmentId(this.data.id || null)
					.buildData(),
			);

			this.data = this.cloneData(this.snapshot);
			this.mode = 'view';
			this.events.onCancel?.();
		},
		handleAiToggleChanged(value: boolean): void
		{
			const previous = this.data.isAiImprovementEnabled;
			this.data.isAiImprovementEnabled = value;
			this.snapshot.isAiImprovementEnabled = value;

			if (!this.data.id)
			{
				return;
			}

			ajax.runAction('crm.copilot.callassessment.toggleAutofill', {
				data: {
					id: this.data.id,
					isEnabled: value ? 1 : 0,
				},
				analytics: Builder.CallAssessment.AutoUpdateEvent
					.createDefault(value)
					.setCallAssessmentId(this.data.id)
					.buildData(),
			}).catch(() => {
				this.data.isAiImprovementEnabled = previous;
				this.snapshot.isAiImprovementEnabled = previous;
				UI.Notification.Center.notify({
					content: Loc.getMessage('CRM_CALL_ASSESSMENT_V2_AI_TOGGLE_ERROR') ?? '',
					autoHideDelay: 5000,
				});
			});
		},
		handleClose(): void
		{
			this.slider?.close();
		},
		wrapSliderCloseHandler(): void
		{
			if (!this.slider)
			{
				return;
			}

			const slider = this.slider;
			const label = slider.getLabel();
			const currentHandler = label.getOnclick() as WrappedCloseHandler | null;
			const originalHandler = currentHandler?.[closeHandlerOwner]
				? currentHandler[originalCloseHandler]
				: currentHandler
			;
			const sendCloseButtonAnalytics = (): void => this.sendCloseButtonAnalytics();
			const wrappedHandler = function(this: unknown, ...args: unknown[]): unknown {
				const wasOpen = slider.isOpen();
				const result = originalHandler?.apply(this, args);

				if (wasOpen && !slider.isOpen())
				{
					sendCloseButtonAnalytics();
				}

				return result;
			} as WrappedCloseHandler;
			wrappedHandler[originalCloseHandler] = originalHandler;
			wrappedHandler[closeHandlerOwner] = this;
			label.setOnclick(wrappedHandler);
		},
		restoreSliderCloseHandler(): void
		{
			const label = this.slider?.getLabel();
			const handler = label?.getOnclick() as WrappedCloseHandler | null | undefined;
			if (handler?.[closeHandlerOwner] === this)
			{
				label?.setOnclick(handler[originalCloseHandler]);
			}
		},
		sendCloseButtonAnalytics(): void
		{
			sendData(
				Builder.CallAssessment.GridActionsEvent
					.createDefault(Dictionary.ELEMENT_CLOSE_BUTTON)
					.setCallAssessmentId(this.data.id || null)
					.buildData(),
			);
		},
		handleGenerate(): void
		{
			if (this.isGenerating)
			{
				return;
			}

			if (this.userText.trim().length < MIN_USER_TEXT_LENGTH)
			{
				UI.Notification.Center.notify({
					content: Loc.getMessage('CRM_CALL_ASSESSMENT_V2_CREATE_VALIDATION_MIN_LENGTH', {
						'#MIN#': String(MIN_USER_TEXT_LENGTH),
					}) ?? '',
					autoHideDelay: 5000,
				});
				return;
			}

			const filters = this.data.filters;
			const clientFilter = filters.find((f: FilterDescriptor) => f.code === 'clients');
			const callFilter = filters.find((f: FilterDescriptor) => f.code === 'calls');

			const clientTypeIds: number[] = clientFilter && clientFilter.multi
				? (clientFilter as MultiFilter).values
				: [];

			if (clientTypeIds.length === 0)
			{
				UI.Notification.Center.notify({
					content: Loc.getMessage('CRM_CALL_ASSESSMENT_V2_CLIENT_TYPES_REQUIRED') ?? '',
					autoHideDelay: 5000,
				});
				return;
			}

			const callTypeId: number | null = callFilter && !callFilter.multi
				? (callFilter as SingleFilter).value
				: null;

			this.isGenerating = true;

			ajax.runAction('crm.copilot.callassessment.generateFromDialog', {
				data: {
					userText: this.userText,
					scriptName: this.data.title,
					clientTypeIds,
					callTypeId,
				},
			})
				.then((response: { data?: { jobId?: string, assessmentId?: number } }) => {
					const assessmentId = Number(response?.data?.assessmentId);
					if (Number.isFinite(assessmentId) && assessmentId > 0)
					{
						this.data.id = assessmentId;
					}
					this.mode = 'loading';
				})
				.catch(() => {
					this.isGenerating = false;
					UI.Notification.Center.notify({
						content: Loc.getMessage('CRM_CALL_ASSESSMENT_V2_CREATE_GENERATE_ERROR') ?? '',
						autoHideDelay: 5000,
					});
				});
		},
	},
	template: `
		<div class="crm-call-assessment-v2" data-testid="crm-call-assessment-v2-app">
			<EditorToolbar
				:isEditMode="isEditMode"
				:isCreateMode="isCreateMode"
				:isLoadingMode="isLoadingMode"
				:isAiToggleEnabled="data.isAiImprovementEnabled"
				:canToggleAi="canToggleAi"
				v-model:title="data.title"
				@aiToggleChanged="handleAiToggleChanged"
			/>
			<div class="crm-call-assessment-v2__body">
				<template v-if="isLoadingMode">
					<LoadingState/>
				</template>
				<template v-else-if="isCreateMode">
					<DraftCard v-model="userText"/>
					<ClientTypesCard v-model:filters="data.filters" :minSelected="1"/>
				</template>
				<template v-else>
					<div class="crm-call-assessment-v2__card">
						<ScriptInfoCard
							:isEditMode="isEditMode"
							:assessmentId="data.id"
							:description="data.description"
							:updatedAt="data.updatedAt"
							:processedCallsCount="data.processedCallsCount"
							:isGeneratedByCopilot="data.isGeneratedByCopilot"
							:filters="data.filters"
						/>
						<ScenarioCard
							:isEditMode="isEditMode"
							v-model:criteria="data.criteria"
						/>
					</div>
					<HintCard
						ref="hintCard"
						v-model:prompt="data.prompt"
						v-model:isHintEnabled="data.isHintEnabled"
						:isEditable="isEditMode && !settings.readOnly"
					/>
					<template v-if="isEditMode">
						<ClientTypesCard v-model:filters="data.filters"/>
					</template>
				</template>
			</div>
			<ActionBar
				v-if="isEditMode"
				variant="edit"
				@save="handleSave"
				@cancel="handleCancel"
			/>
			<ActionBar
				v-else-if="isCreateMode"
				variant="create"
				:generateDisabled="!hasUserText"
				@generate="handleGenerate"
				@cancel="handleClose"
			/>
			<ActionBar
				v-else-if="!isLoadingMode && !settings.readOnly"
				variant="view"
				@edit="handleEnterEdit"
			/>
		</div>
	`,
});
