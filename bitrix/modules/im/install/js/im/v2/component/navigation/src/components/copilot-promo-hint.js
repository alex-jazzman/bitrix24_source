import { PopupOptions } from 'main.popup';

import { Messenger } from 'im.public';
import { PromoId } from 'im.v2.const';
import { PromoManager } from 'im.v2.lib.promo';
import { CopilotService } from 'im.v2.provider.service.copilot';
import { MessengerPopup } from 'im.v2.component.elements.popup';
import { Spinner, SpinnerSize, SpinnerColor } from 'im.v2.component.elements.loader';

import '../css/copilot-promo-hint.css';

const POPUP_ID = 'im-copilot-promo-hint-popup';
const UNIVERSAL_ROLE_CODE = 'copilot_assistant';

// @vue/component
export const CopilotPromoHint = {
	name: 'CopilotPromoHint',
	components: { MessengerPopup, Spinner },
	props:
	{
		bindElement: {
			type: Object,
			required: true,
		},
	},
	emits: ['close'],
	data(): { isCreatingChat: boolean }
	{
		return {
			isCreatingChat: false,
		};
	},
	computed:
	{
		SpinnerSize: () => SpinnerSize,
		SpinnerColor: () => SpinnerColor,
		POPUP_ID: () => POPUP_ID,
		config(): PopupOptions
		{
			return {
				darkMode: true,
				bindElement: this.bindElement,
				angle: true,
				width: 346,
				closeIcon: true,
				className: 'bx-im-copilot-promo-hint__scope',
				contentBorderRadius: 0,
				offsetTop: 9,
			};
		},
	},
	methods:
	{
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
		async close(): void
		{
			await PromoManager.getInstance().markAsWatched(PromoId.copilotInRecentTab);
			this.$emit('close');
		},
		async createCopilot(): Promise<void>
		{
			this.isCreatingChat = true;
			const newDialogId = await this.getCopilotService().createChat({ roleCode: UNIVERSAL_ROLE_CODE })
				.catch(() => {
					this.isCreatingChat = false;
				});

			this.isCreatingChat = false;
			await this.close();
			void Messenger.openChat(newDialogId);
		},
		getCopilotService(): CopilotService
		{
			if (!this.copilotService)
			{
				this.copilotService = new CopilotService();
			}

			return this.copilotService;
		},
	},
	template: `
		<MessengerPopup
			:config="config"
			:id="POPUP_ID"
			@close="close"
		>
			<div class="bx-im-copilot-promo-hint__title">
				{{ loc('IM_CONTENT_COPILOT_PROMO_HINT_TITLE') }}
			</div>
			<div class="bx-im-copilot-promo-hint__description">
				{{ loc('IM_CONTENT_COPILOT_PROMO_HINT_DESCRIPTION') }}
			</div>
			<button
				class="bx-im-copilot-promo-hint__action"
				@click="createCopilot"
			>
				<Spinner
					v-if="isCreatingChat"
					:size="SpinnerSize.XS"
					:color="SpinnerColor.copilot"
				/>
				<span v-else>
					{{ loc('IM_CONTENT_COPILOT_PROMO_HINT_ACTION') }}
				</span>
			</button>
		</MessengerPopup>
	`,
};
