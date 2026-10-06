import { EventEmitter } from 'main.core.events';
import { type PopupOptions } from 'main.popup';

import { MessengerPopup } from 'im.v2.component.elements.popup';
import { EventType } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { Notifier } from 'im.v2.lib.notifier';

import { GuestService } from './classes/guest-service';
import { GuestNameContent } from './components/guest-name-content/guest-name-content';

const POPUP_ID = 'im-guest-invite-modal';

// @vue/component
export const GuestNamePopup = {
	name: 'GuestNamePopup',
	components: { MessengerPopup, GuestNameContent },
	props: {
		dialogId: {
			type: String,
			default: '',
		},
	},
	emits: ['close'],
	data(): { isSubmitting: boolean }
	{
		return {
			isSubmitting: false,
		};
	},
	computed: {
		POPUP_ID: () => POPUP_ID,
		config(): PopupOptions
		{
			return {
				closeIcon: false,
				targetContainer: document.body,
				fixed: true,
				draggable: false,
				padding: 0,
				autoHide: false,
				contentPadding: 0,
				overlay: { opacity: 50 },
			};
		},
	},
	mounted()
	{
		Analytics.getInstance().guest.onShowGuestNamePopup(this.dialogId);
	},
	beforeUnmount()
	{
		EventEmitter.emit(EventType.guest.onAfterGuestNamePopupClose, {
			dialogId: this.dialogId,
		});
	},
	methods: {
		async onSubmit(name: string)
		{
			if (this.isSubmitting)
			{
				return;
			}

			this.isSubmitting = true;
			try
			{
				await new GuestService().setName(name);
				this.$emit('close');
			}
			catch
			{
				Notifier.onDefaultError();
			}
			finally
			{
				this.isSubmitting = false;
			}
		},
	},
	template: `
		<MessengerPopup
			:id="POPUP_ID"
			:config="config"
			@close="$emit('close')"
		>
			<GuestNameContent
				:dialogId="dialogId"
				:isLoading="isSubmitting"
				@submit="onSubmit"
				@close="$emit('close')"
			/>
		</MessengerPopup>
	`,
};
