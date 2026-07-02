import { Popup } from 'main.popup';
import { hint, type HintParams } from 'ui.vue3.directives.hint';

// @vue/component
export const ToolbarHint = {
	name: 'ToolbarHint',
	directives: { hint },
	props: {
		text: {
			type: String,
			required: true,
		},
		hintEnabled: {
			type: Boolean,
			default: true,
		},
	},
	computed: {
		hintOptions(): ?HintParams
		{
			if (!this.hintEnabled)
			{
				return null;
			}

			return {
				text: this.text,
				position: 'top',
				popupOptions: {
					className: 'ui-dialog-tooltip --ui-context-content-light',
					darkMode: false,
					maxWidth: 300,
					angle: {
						offset: 0,
					},
					events: {
						onPopupShow: (popup: Popup) => {
							this.centerPopup(popup);
						},
					},
				},
			};
		},
	},
	methods: {
		centerPopup(popup: Popup): void
		{
			const anchorWidth = popup.bindElement.offsetWidth;
			const popupWidth = popup.getPopupContainer().offsetWidth;
			const angleWidth = popup.angle.element.offsetWidth;
			if (!popupWidth)
			{
				return;
			}

			const angleLeftOffset = Popup.getOption('angleLeftOffset');

			// eslint-disable-next-line no-param-reassign
			popup.offsetLeft = angleLeftOffset + (anchorWidth - popupWidth) / 2;

			// eslint-disable-next-line no-param-reassign
			popup.angle.defaultOffset = (popupWidth - angleWidth) / 2;
		},
	},
	template: `
		<span v-hint="hintOptions">
			<slot />
		</span>
	`,
};