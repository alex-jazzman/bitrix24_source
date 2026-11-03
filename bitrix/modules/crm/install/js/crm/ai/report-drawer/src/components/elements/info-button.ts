import { defineComponent, nextTick, onBeforeUnmount, onMounted, ref, type PropType } from 'ui.vue3';
import { Loc } from 'main.core';
import { Outline } from 'ui.icon-set.api.core';
import { AirButtonStyle, Button, ButtonIcon, ButtonSize } from 'ui.vue3.components.button';

import { CallInfoPopupContent } from '../popups/call-info-popup-content';
import { EmailInfoPopupContent } from '../popups/email-info-popup-content';
import { OpenLinesInfoPopupContent } from '../popups/open-lines-info-popup-content';
import {
	resolveInfoPopupButtonMessageCode,
	resolveInfoPopupTypeConfig,
} from '../../lib/info-popup-type-config';
import { PopupController } from '../../lib/popup-controller';

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

			const button = bindElement.querySelector('button');
			if (!(button instanceof HTMLButtonElement))
			{
				return;
			}

			const config = resolveInfoPopupTypeConfig(props.infoPopupData.type);
			const ariaLabel = Loc.getMessage(config.messageCode) ?? '';
			const component = {
				call: CallInfoPopupContent,
				email: EmailInfoPopupContent,
				'open-lines': OpenLinesInfoPopupContent,
			}[props.infoPopupData.type];

			popup = new PopupController({
				bindElement: button,
				trigger: config.trigger,
				component,
				props: {
					infoPopupData: props.infoPopupData,
				},
				popupOptions: {
					width: 320,
					className: 'crm-ai-report-drawer__popup-wrapper --info',
					ariaLabel,
					role: 'dialog',
					closeByEsc: true,
					focusTrap: config.trigger === 'click'
						? { initialFocus: 'first-tabbable', restoreFocus: true }
						: false,
				},
			});
		};

		onMounted(() => {
			void nextTick(() => initPopup(container.value));
		});
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
			const messageCode = resolveInfoPopupButtonMessageCode(this.infoPopupData.type);

			return Loc.getMessage(messageCode) ?? '';
		},
	},

	template: `
		<div
			class="crm-ai-report-drawer__toolbar-info-button"
			data-testid="crm-ai-report-drawer-info-button"
			ref="container"
		>
			<Button
				:text="buttonText"
				:style="AirButtonStyle.OUTLINE"
				:size="ButtonSize.SMALL"
				:leftIcon="Outline.INFO_CIRCLE"
				class="ui-btn-round"
				:dataset="{ testid: 'crm-ai-report-drawer-info-button-trigger' }"
			/>
		</div>
	`,
});
