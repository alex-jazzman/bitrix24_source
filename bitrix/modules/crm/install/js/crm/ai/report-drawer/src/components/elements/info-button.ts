import { defineComponent, onBeforeUnmount, onMounted, ref, type PropType } from 'ui.vue3';
import { Loc } from 'main.core';
import { Outline } from 'ui.icon-set.api.core';
import { AirButtonStyle, Button, ButtonIcon, ButtonSize } from 'ui.vue3.components.button';

import { CallInfoPopupContent } from '../popups/call-info-popup-content';
import { OpenLinesInfoPopupContent } from '../popups/open-lines-info-popup-content';
import { PopupController } from '../popups/popup-controller';

import { type InfoPopupData } from '../../types';

export const InfoButton = defineComponent({
	name: 'InfoButton',

	components: {
		Button,
	},

	props: {
		infoPopupData: {
			type: Object as PropType<InfoPopupData>,
			required: true,
		},
	},

	setup(props): Object
	{
		let popup: PopupController | null = null;
		const container = ref(null);

		const initPopup = (bindElement: unknown): void => {
			if (!(bindElement instanceof HTMLElement))
			{
				return;
			}

			const popupComponent = props.infoPopupData.type === 'open-lines'
				? OpenLinesInfoPopupContent
				: CallInfoPopupContent
			;

			popup = new PopupController({
				bindElement,
				trigger: 'hover',
				component: popupComponent,
				props: {
					infoPopupData: props.infoPopupData,
				},
				popupOptions: {
					width: 320,
					className: 'crm-ai-report-drawer__popup-wrapper --info',
				},
			});
		};

		onMounted(() => initPopup(container.value));
		onBeforeUnmount(() => popup?.destroy());

		return {
			AirButtonStyle,
			ButtonIcon,
			ButtonSize,
			Outline,
			container,
		};
	},

	computed: {
		buttonText(): string
		{
			const messageCode = this.infoPopupData.type === 'open-lines'
				? 'CRM_AI_REPORT_DRAWER_INFO_POPUP_BUTTON_OPEN_LINES'
				: 'CRM_AI_REPORT_DRAWER_INFO_POPUP_BUTTON_CALL'
			;

			return Loc.getMessage(messageCode) ?? '';
		},
	},

	template: `
		<div class="crm-ai-report-drawer__toolbar-info-button" ref="container">
			<Button
				:text="buttonText"
				:style="AirButtonStyle.OUTLINE"
				:size="ButtonSize.SMALL"
				:leftIcon="Outline.INFO_CIRCLE"
				class="ui-btn-round"
			/>
		</div>
	`,
});
