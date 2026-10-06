import { NameService } from 'crm.ai.name-service';
import { Loc } from 'main.core';
import { UI } from 'ui.notification';
import { Draggable } from 'ui.draganddrop.draggable';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { HeadlineSm, TextMd } from 'ui.system.typography.vue';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { Hint } from 'ui.vue3.components.hint';
import { hint } from 'ui.vue3.directives.hint';
import { defineComponent, markRaw, type PropType, TransitionGroup } from 'ui.vue3';
import { ScenarioStepEdit } from '../scenario-step-edit/scenario-step-edit';
import { ScenarioStepView } from '../scenario-step-view/scenario-step-view';
import { type Criterion } from '../../types';
import { createCalloutHint } from '../../utils/callout-hint';
import './scenario-card.css';

const SORT_STEP = 100;

let newCriterionCounter = 0;

type ScenarioCardData = {
	draggable: Draggable | null,
};

const getCriterionKey = (criterion: Criterion): string => (
	criterion.id !== null ? `id-${criterion.id}` : `tmp-${criterion.tempKey}`
);

export const ScenarioCard = defineComponent({
	name: 'CrmCopilotCallAssessmentV2ScenarioCard',
	directives: {
		hint,
	},
	components: {
		BIcon,
		HeadlineSm,
		Hint,
		ScenarioStepEdit,
		ScenarioStepView,
		TextMd,
		TransitionGroup,
		UiButton,
	},
	props: {
		isEditMode: {
			type: Boolean,
			default: false,
		},
		criteria: {
			type: Array as PropType<Criterion[]>,
			required: true,
		},
	},
	emits: [
		'update:criteria',
	],
	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonSize,
			Outline,
			getCriterionKey,
		};
	},
	data(): ScenarioCardData
	{
		return {
			draggable: null,
		};
	},
	computed: {
		sortedCriteria(): Criterion[]
		{
			return [...this.criteria].sort((a: Criterion, b: Criterion) => a.sort - b.sort);
		},
		headingHint(): Object
		{
			const copilotReplacement = { '#COPILOT_NAME#': NameService.copilotName() };

			return createCalloutHint({
				variant: 'step',
				title: this.loc('CRM_CALL_ASSESSMENT_V2_CRITERIA_HINT_TITLE'),
				description: this.loc('CRM_CALL_ASSESSMENT_V2_CRITERIA_HINT_DESCRIPTION', copilotReplacement),
			});
		},
	},
	watch: {
		isEditMode(value: boolean): void
		{
			if (value)
			{
				void this.$nextTick(() => this.initDraggable());
			}
			else
			{
				this.destroyDraggable();
			}
		},
	},
	mounted(): void
	{
		if (this.isEditMode)
		{
			void this.$nextTick(() => this.initDraggable());
		}
	},
	beforeUnmount(): void
	{
		this.destroyDraggable();
	},
	methods: {
		initDraggable(): void
		{
			const container = this.$refs.list as HTMLElement | undefined;
			if (this.draggable || !container)
			{
				return;
			}

			this.draggable = markRaw(new Draggable({
				container,
				draggable: '.crm-call-assessment-v2-step-edit',
				dragElement: '.crm-call-assessment-v2-step-edit__handle',
				type: Draggable.MOVE,
			} as ConstructorParameters<typeof Draggable>[0]));
			this.draggable.subscribe('end', () => this.handleDrop());
		},
		destroyDraggable(): void
		{
			this.draggable?.destroy();
			this.draggable = null;
		},
		handleDrop(): void
		{
			const list = this.$refs.list as HTMLElement | undefined;
			if (!list)
			{
				return;
			}

			const nodes = Array.from(list.querySelectorAll<HTMLElement>('[data-criterion-key]'));
			const next: Criterion[] = nodes
				.map((node: HTMLElement, index: number): Criterion | null => {
					const key = node.dataset.criterionKey;
					const criterion = this.criteria.find((item: Criterion) => getCriterionKey(item) === key);
					if (!criterion)
					{
						return null;
					}

					return { ...criterion, sort: (index + 1) * SORT_STEP };
				})
				.filter((item): item is Criterion => item !== null);

			this.$emit('update:criteria', next);
		},
		handleStepUpdate(key: string, patch: Partial<Criterion>): void
		{
			const next = this.criteria.map((item: Criterion) => (
				getCriterionKey(item) === key ? { ...item, ...patch } : item
			));
			this.$emit('update:criteria', next);
		},
		handleStepRemove(key: string): void
		{
			if (this.criteria.length <= 1)
			{
				UI.Notification.Center.notify({
					content: Loc.getMessage('CRM_CALL_ASSESSMENT_V2_MIN_CRITERIA_NOTICE') ?? '',
					autoHideDelay: 5000,
				});

				return;
			}

			const next = this.criteria.filter((item: Criterion) => getCriterionKey(item) !== key);
			this.$emit('update:criteria', next);
		},
		handleAddCriterion(position: 'top' | 'bottom' = 'bottom'): void
		{
			let nextSort: number;
			if (this.criteria.length === 0)
			{
				nextSort = SORT_STEP;
			}
			else if (position === 'top')
			{
				nextSort = Math.min(...this.criteria.map((item: Criterion) => item.sort)) - SORT_STEP;
			}
			else
			{
				nextSort = Math.max(...this.criteria.map((item: Criterion) => item.sort)) + SORT_STEP;
			}

			newCriterionCounter += 1;
			this.$emit('update:criteria', [
				...this.criteria,
				{
					id: null,
					tempKey: `new-${newCriterionCounter}`,
					title: '',
					description: '',
					sort: nextSort,
				},
			]);
		},
	},
	template: `
		<section class="crm-call-assessment-v2-scenario-card">
			<header v-if="isEditMode" class="crm-call-assessment-v2-scenario-card__header">
				<div class="crm-call-assessment-v2-scenario-card__header-text">
					<div class="crm-call-assessment-v2-scenario-card__heading-row">
						<HeadlineSm class="crm-call-assessment-v2-scenario-card__heading" tag="h2" accent>
							{{ loc('CRM_CALL_ASSESSMENT_V2_CRITERIA_HEADING') }}
						</HeadlineSm>
						<BIcon
							class="crm-call-assessment-v2-scenario-card__heading-info"
							:name="Outline.INFO_CIRCLE"
							:size="20"
							v-hint="headingHint"
						/>
					</div>
					<TextMd class="crm-call-assessment-v2-scenario-card__subtitle" tag="p">
						{{ loc('CRM_CALL_ASSESSMENT_V2_CRITERIA_SUBTITLE') }}
					</TextMd>
				</div>
				<UiButton
					v-if="isEditMode"
					class="crm-call-assessment-v2-scenario-card__add"
					:text="loc('CRM_CALL_ASSESSMENT_V2_ADD_CRITERION')"
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.OUTLINE"
					:leftIcon="Outline.PLUS_M"
					@click="handleAddCriterion('top')"
				/>
			</header>
			<div v-if="isEditMode" ref="list" class="crm-call-assessment-v2-scenario-card__list">
				<TransitionGroup name="crm-call-assessment-v2-scenario-card-step">
					<ScenarioStepEdit
						v-for="criterion in sortedCriteria"
						:key="getCriterionKey(criterion)"
						:criterionKey="getCriterionKey(criterion)"
						:title="criterion.title"
						:description="criterion.description"
						@update:title="handleStepUpdate(getCriterionKey(criterion), { title: $event })"
						@update:description="handleStepUpdate(getCriterionKey(criterion), { description: $event })"
						@remove="handleStepRemove(getCriterionKey(criterion))"
					/>
				</TransitionGroup>
				<UiButton
					class="crm-call-assessment-v2-scenario-card__add-bottom"
					:text="loc('CRM_CALL_ASSESSMENT_V2_ADD_CRITERION')"
					:size="ButtonSize.LARGE"
					:style="AirButtonStyle.OUTLINE"
					:leftIcon="Outline.PLUS_M"
					@click="handleAddCriterion('bottom')"
				/>
			</div>
			<div v-else class="crm-call-assessment-v2-scenario-card__list">
				<ScenarioStepView
					v-for="(criterion, index) in sortedCriteria"
					:key="getCriterionKey(criterion)"
					:index="index + 1"
					:title="criterion.title"
					:description="criterion.description"
				/>
			</div>
		</section>
	`,
});
