import { ajax, Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { UI } from 'ui.notification';
import { defineComponent, type PropType } from 'ui.vue3';
import { ActionBar } from '../action-bar/action-bar';
import { ClientTypesCard } from '../client-types-card/client-types-card';
import { DraftCard } from '../draft-card/draft-card';
import { EditorToolbar } from '../editor-toolbar/editor-toolbar';
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

export const App = defineComponent({
	name: 'CrmCopilotCallAssessmentV2App',
	components: {
		ActionBar,
		ClientTypesCard,
		DraftCard,
		EditorToolbar,
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
	data(): { mode: Mode, data: ScriptData, snapshot: ScriptData, userText: string, isGenerating: boolean, isSaving: boolean }
	{
		const isCopy = this.settings.isCopy;
		let initialEditMode: Mode = 'edit';
		if (!isCopy)
		{
			initialEditMode = this.settings.isNewScript ? 'create' : 'view';
		}

		const initialMode: Mode = this.settings.isPendingGeneration ? 'loading' : initialEditMode;

		const data = this.cloneData(this.initialData);
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
	},
	beforeUnmount(): void
	{
		EventEmitter.unsubscribe('onPullEvent-crm', this.handlePullEvent);
	},
	methods: {
		cloneData(source: ScriptData): ScriptData
		{
			return JSON.parse(JSON.stringify(source));
		},
		handlePullEvent(event: { data: [string, { assessmentId?: number }] }): void
		{
			const data = event?.data;
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
			this.snapshot = this.cloneData(this.data);
			this.mode = 'edit';
		},
		handleSave(): void
		{
			if (this.isSaving)
			{
				return;
			}

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
				data: {
					title: this.data.title,
					description: this.data.description,
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

			ajax.runAction('crm.copilot.callassessment.save', { data: payload })
				.then((response: { data?: { data?: ScriptData } }) => {
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
			const sidePanel = (top as any)?.BX?.SidePanel?.Instance;
			sidePanel?.close();
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
		<div class="crm-call-assessment-v2">
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
