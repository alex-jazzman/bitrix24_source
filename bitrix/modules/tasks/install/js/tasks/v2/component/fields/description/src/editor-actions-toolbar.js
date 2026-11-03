import { FocusZone, FocusKeys } from 'ui.a11y';

// @vue/component
export const EditorActionsToolbar = {
	props: {
		ariaLabel: {
			type: String,
			default: '',
		},
	},
	mounted(): void
	{
		this.focusZone = new FocusZone(this.$refs.toolbar, {
			bindKeys: FocusKeys.ArrowHorizontal | FocusKeys.HomeAndEnd,
		});
		this.focusZone.activate();
	},
	beforeUnmount(): void
	{
		this.focusZone?.deactivate();
		this.focusZone = null;
	},
	methods: {
		refreshElements(): void
		{
			this.focusZone?.refreshElements();
		},
	},
	template: `
		<div ref="toolbar" role="toolbar" :aria-label="ariaLabel || null">
			<slot/>
		</div>
	`,
};
