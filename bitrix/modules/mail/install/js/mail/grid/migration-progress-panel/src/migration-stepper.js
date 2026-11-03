import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { BTooltip } from 'ui.system.tooltip.vue';
import { defineComponent } from 'ui.vue3';

export type MigrationStep = {
	label: string,
	title: string,
	description: string,
	state: 'past' | 'current' | 'reached' | 'future',
	selected: boolean,
};

// @vue/component
export const MigrationStepper = defineComponent({
	name: 'MailMigrationStepper',
	components: { BIcon, BTooltip },
	props: {
		steps: {
			type: Array,
			required: true,
		},
	},
	emits: ['select'],
	data(): { tooltipTarget: ?HTMLElement, tooltipStepIndex: ?number }
	{
		return {
			tooltipTarget: null,
			tooltipStepIndex: null,
		};
	},
	setup()
	{
		return { checkIcon: Outline.CHECK_M };
	},
	methods: {
		tooltip(step: MigrationStep): string
		{
			return `${step.title}\n${step.description}`;
		},
		activateTooltip(index: number, event: Event): void
		{
			this.tooltipTarget = event.currentTarget;
			this.tooltipStepIndex = index;
		},
		select(index: number, step: MigrationStep): void
		{
			if (step.state !== 'future')
			{
				this.$emit('select', index);
			}
		},
	},
	template: `
		<ol class="mail-migration-progress__steps" :aria-label="$Bitrix.Loc.getMessage('MAIL_MIGRATION_PROGRESS_STEPS_LABEL')">
			<li
				v-for="(step, index) in steps"
				:key="index"
				class="mail-migration-progress__step"
				:data-state="step.state"
				:data-selected="step.selected"
				:aria-current="step.state === 'current' ? 'step' : null"
			>
				<button
					class="mail-migration-progress__step-button"
					type="button"
					:aria-label="step.state === 'future' ? tooltip(step) : (step.selected ? step.label + '. ' + $Bitrix.Loc.getMessage('MAIL_MIGRATION_PROGRESS_SELECTED_STAGE') : step.label)"
					:aria-disabled="step.state === 'future' ? 'true' : null"
					:aria-pressed="step.state === 'future' ? null : step.selected"
					:data-testid="'mail-migration-progress-step-' + index"
					@pointerenter="activateTooltip(index, $event)"
					@focusin="activateTooltip(index, $event)"
					@click="select(index, step)"
				>
					<span class="mail-migration-progress__step-dot" aria-hidden="true">
						<BIcon
							v-if="step.state === 'past' || step.state === 'reached'"
							class="mail-migration-progress__step-check"
							:name="checkIcon"
							:size="12"
						/>
						<span v-else>{{ index + 1 }}</span>
					</span>
					<span class="mail-migration-progress__step-label">{{ step.label }}</span>
				</button>
			</li>
		</ol>
		<BTooltip
			:target="tooltipTarget"
			:text="tooltipStepIndex === null ? '' : tooltip(steps[tooltipStepIndex])"
		/>
	`,
});
