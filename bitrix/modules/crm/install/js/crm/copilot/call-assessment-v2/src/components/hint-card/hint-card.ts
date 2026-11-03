import { BIcon } from 'ui.icon-set.api.vue';
import { HeadlineSm, TextMd } from 'ui.system.typography.vue';
import { BitrixVue, defineComponent } from 'ui.vue3';
import { HintToggle } from './hint-toggle';
import './hint-card.css';

type TextEditor = {
	getText: () => string,
	setText: (text: string) => void,
};

type TextEditorComponentRef = {
	editor: TextEditor,
};

type SwitcherComponentRef = {
	switcher?: {
		getNode: () => HTMLElement,
	},
};

type HintCardData = {
	editorEvents: {
		onChange: () => void,
	},
};

const editorToolbar = [
	'bold',
	'italic',
	'underline',
	'strikethrough',
	'|',
	'numbered-list',
	'bulleted-list',
	'|',
	'link',
];

const TextEditorComponent = BitrixVue.defineAsyncComponent('ui.text-editor', 'TextEditorComponent');

export const HintCard = defineComponent({
	name: 'CrmCopilotCallAssessmentV2HintCard',
	components: {
		BIcon,
		HeadlineSm,
		HintToggle,
		TextEditorComponent,
		TextMd,
	},
	props: {
		prompt: {
			type: String,
			default: '',
		},
		isHintEnabled: {
			type: Boolean,
			default: false,
		},
		isEditable: {
			type: Boolean,
			default: false,
		},
	},
	emits: [
		'update:prompt',
		'update:isHintEnabled',
	],
	data(): HintCardData
	{
		return {
			editorEvents: {
				onChange: (): void => this.handleEditorChange(),
			},
		};
	},
	computed: {
		editorOptions(): Record<string, unknown>
		{
			return {
				ariaLabel: this.loc('CRM_CALL_ASSESSMENT_V2_HINT_HEADING'),
				content: this.prompt,
				editable: this.isEditable,
				minHeight: 180,
				maxHeight: 500,
				toolbar: this.isEditable ? editorToolbar : [],
				floatingToolbar: this.isEditable ? editorToolbar : [],
				hideToolbar: !this.isEditable,
				visualOptions: {
					borderRadius: 'var(--ui-border-radius-lg)',
				},
			};
		},
	},
	watch: {
		prompt(value: string): void
		{
			const editor = this.getEditor();
			if (editor && editor.getText() !== value)
			{
				editor.setText(value);
			}
		},
	},
	mounted(): void
	{
		this.setHintSwitcherTestId();
	},
	updated(): void
	{
		this.setHintSwitcherTestId();
	},
	methods: {
		setHintSwitcherTestId(): void
		{
			const component = this.$refs.hintSwitcher as SwitcherComponentRef | undefined;
			const node = component?.switcher?.getNode();
			if (node)
			{
				node.dataset.testid = 'crm-call-assessment-v2-hint-toggle';
			}
		},
		getEditor(): TextEditor | null
		{
			const component = this.$refs.editor as TextEditorComponentRef | undefined;

			return component?.editor ?? null;
		},
		syncPrompt(): string
		{
			const prompt = this.getEditor()?.getText() ?? this.prompt;
			if (prompt !== this.prompt)
			{
				this.$emit('update:prompt', prompt);
			}

			return prompt;
		},
		handleEditorChange(): void
		{
			this.syncPrompt();
		},
		handleCheck(): void
		{
			this.$emit('update:isHintEnabled', true);
		},
		handleUncheck(): void
		{
			this.syncPrompt();
			this.$emit('update:isHintEnabled', false);
		},
	},
	template: `
		<section
			v-if="isEditable || isHintEnabled"
			class="crm-call-assessment-v2__card crm-call-assessment-v2-hint-card"
			data-testid="crm-call-assessment-v2-hint-card"
		>
			<header class="crm-call-assessment-v2-hint-card__header">
				<div class="crm-call-assessment-v2-hint-card__heading">
					<div class="crm-call-assessment-v2-hint-card__title-row">
						<BIcon class="crm-call-assessment-v2-hint-card__title-icon" name="o-message" :size="24"/>
						<HeadlineSm tag="h2" accent>
							{{ loc('CRM_CALL_ASSESSMENT_V2_HINT_HEADING') }}
						</HeadlineSm>
					</div>
					<TextMd v-if="isHintEnabled" tag="p">
						{{ loc('CRM_CALL_ASSESSMENT_V2_HINT_DESCRIPTION') }}
					</TextMd>
				</div>
				<div
					v-if="isEditable"
					class="crm-call-assessment-v2-hint-card__toggle"
				>
					<HintToggle
						ref="hintSwitcher"
						:text="loc('CRM_CALL_ASSESSMENT_V2_HINT_TOGGLE')"
						:isChecked="isHintEnabled"
						:isDisabled="!isEditable"
						@check="handleCheck"
						@uncheck="handleUncheck"
					/>
				</div>
			</header>
			<div
				v-if="isHintEnabled"
				class="crm-call-assessment-v2-hint-card__editor"
				data-testid="crm-call-assessment-v2-hint-editor"
			>
				<TextEditorComponent
					:key="isEditable ? 'editable' : 'read-only'"
					ref="editor"
					:editorOptions="editorOptions"
					:events="editorEvents"
					:editable="isEditable"
				/>
			</div>
		</section>
	`,
});
