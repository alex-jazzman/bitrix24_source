import { Dom } from 'main.core';
import { AirButtonStyle, type BaseButton, ButtonSize, SplitButton, type SplitButtonOptions } from 'ui.buttons';
import type { Switcher as UISwitcher } from 'ui.switcher';
import { defineComponent, markRaw } from 'ui.vue3';

type HintToggleData = {
	splitButton: SplitButton | null,
	switcher: UISwitcher | null,
};

// The hint toggle drawn as an AIR split button: the caption on the left, the switch after the divider.
// Same contract as ui.vue3.components.switcher (isChecked in, check/uncheck out), so HintCard keeps its
// handlers. The `switcher` field mirrors that wrapper too — HintCard reads it to put the test id on the node.
export const HintToggle = defineComponent({
	name: 'CrmCopilotCallAssessmentV2HintToggle',
	props: {
		text: {
			type: String,
			required: true,
		},
		isChecked: {
			type: Boolean,
			required: true,
		},
		isDisabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['check', 'uncheck'],
	data(): HintToggleData
	{
		return {
			splitButton: null,
			switcher: null,
		};
	},
	mounted(): void
	{
		const options: Partial<SplitButtonOptions> = {
			text: this.text,
			size: ButtonSize.LARGE,
			useAirDesign: true,
			style: AirButtonStyle.OUTLINE,
			mainButton: {
				onclick: (button: BaseButton, event: MouseEvent): {} => {
					event.preventDefault();
					if (!this.isDisabled)
					{
						this.switcher?.toggle(event);
					}

					return {};
				},
			},
			switcher: {
				checked: this.isChecked,
				disabled: this.isDisabled,
				accessible: true,
				ariaLabel: this.text,
				handlers: {
					toggled: (): void => {
						this.$emit(this.switcher?.isChecked() ? 'check' : 'uncheck');
					},
				},
			},
		};
		this.splitButton = markRaw(new SplitButton(options as SplitButtonOptions));

		const container = this.splitButton.render();
		// One tab stop for one setting: the keyboard goes to the switch, which carries role="switch" and
		// the label. The caption stays a mouse shortcut to the same switch.
		const main = this.splitButton.getMainButton().getContainer();
		Dom.attr(main, { tabindex: -1, 'aria-hidden': 'true' });

		const switcher = this.splitButton.getSwitcher();
		this.switcher = switcher ? markRaw(switcher) : null;
		Dom.append(container, this.$refs.container as HTMLElement);
	},
	beforeUnmount(): void
	{
		this.switcher?.destroy();
		this.switcher = null;
		this.splitButton = null;
	},
	watch: {
		isChecked(value: boolean): void
		{
			if (this.switcher && this.switcher.isChecked() !== value)
			{
				this.switcher.check(value, false);
			}
		},
		isDisabled(value: boolean): void
		{
			this.switcher?.disable(value, false);
		},
	},
	template: `
		<span ref="container" class="crm-call-assessment-v2-hint-toggle"></span>
	`,
});
