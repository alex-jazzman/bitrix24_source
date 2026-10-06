import { Dom } from 'main.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { BInput, InputDesign, InputSize } from 'ui.system.input.vue';
import { HeadlineSm } from 'ui.system.typography.vue';
import { AirButtonStyle, Button as UiButton, ButtonSize } from 'ui.vue3.components.button';
import { UI } from 'ui.notification';
import { defineComponent } from 'ui.vue3';
import { adjustTextareaHeight } from '../../utils/autosize-textarea';
import './draft-card.css';

const DRAFT_TEXTAREA_MIN_HEIGHT = 178;
const DRAFT_TEXTAREA_MAX_HEIGHT = 480;

export const DraftCard = defineComponent({
	name: 'CrmCopilotCallAssessmentV2DraftCard',
	components: {
		BIcon,
		BInput,
		HeadlineSm,
		UiButton,
	},
	props: {
		modelValue: {
			type: String,
			required: true,
		},
	},
	emits: [
		'update:modelValue',
	],
	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonSize,
			InputDesign,
			InputSize,
			Outline,
		};
	},
	computed: {
		isPasteDisabled(): boolean
		{
			return this.modelValue.trim() !== '';
		},
	},
	watch: {
		modelValue(): void
		{
			void this.$nextTick(() => this.adjustHeight());
		},
	},
	mounted(): void
	{
		const textarea = this.findTextarea();
		if (textarea)
		{
			Dom.style(textarea, 'minHeight', `${DRAFT_TEXTAREA_MIN_HEIGHT}px`);
		}

		void this.$nextTick(() => this.adjustHeight());
	},
	methods: {
		findTextarea(): HTMLTextAreaElement | null
		{
			const inputComponent = this.$refs.input as { $el?: HTMLElement } | undefined;

			return inputComponent?.$el?.querySelector('textarea') ?? null;
		},
		adjustHeight(): void
		{
			adjustTextareaHeight(
				this.$refs.input as { $el?: HTMLElement } | undefined,
				DRAFT_TEXTAREA_MAX_HEIGHT,
			);
		},
		async handlePasteFromClipboard(): Promise<void>
		{
			if (!navigator.clipboard?.readText)
			{
				UI.Notification.Center.notify({
					content: this.loc('CRM_CALL_ASSESSMENT_V2_CREATE_PASTE_UNSUPPORTED'),
					autoHideDelay: 5000,
				});
				return;
			}

			try
			{
				const text = await navigator.clipboard.readText();
				if (text)
				{
					this.$emit('update:modelValue', text);
				}
			}
			catch (error)
			{
				UI.Notification.Center.notify({
					content: this.loc('CRM_CALL_ASSESSMENT_V2_CREATE_PASTE_FAILED'),
					autoHideDelay: 5000,
				});
			}
		},
	},
	template: `
		<section class="crm-call-assessment-v2-draft-card">
			<HeadlineSm class="crm-call-assessment-v2-draft-card__heading" tag="h2" accent>
				{{ loc('CRM_CALL_ASSESSMENT_V2_CREATE_DRAFT_HEADING') }}
			</HeadlineSm>
			<div class="crm-call-assessment-v2-draft-card__inner">
				<UiButton
					class="crm-call-assessment-v2-draft-card__paste"
					:text="loc('CRM_CALL_ASSESSMENT_V2_CREATE_PASTE_BUTTON')"
					:size="ButtonSize.LARGE"
					:style="AirButtonStyle.FILLED"
					:leftIcon="Outline.COPY"
					:disabled="isPasteDisabled"
					@click="handlePasteFromClipboard"
				/>
				<BInput
					ref="input"
					class="crm-call-assessment-v2-draft-card__input"
					:modelValue="modelValue"
					:design="InputDesign.Primary"
					:size="InputSize.Lg"
					:rowsQuantity="6"
					resize="none"
					:placeholder="loc('CRM_CALL_ASSESSMENT_V2_CREATE_DRAFT_PLACEHOLDER')"
					stretched
					@update:modelValue="$emit('update:modelValue', $event)"
				/>
			</div>
		</section>
	`,
});
