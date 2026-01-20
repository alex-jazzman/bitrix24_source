import { Event, Type, Loc, Extension } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { MessageBox } from 'ui.dialogs.messagebox';

export class SigningFrameEventHandler
{
	#signingStart: boolean = false;
	#frameEventHandler: (event: Object) => void = null;
	#isListening: boolean = false;
	#skipCloseConfirmation: boolean = false;
	#stopSigningConfirmPopup: ?MessageBox = null;
	#closeEventHandler: Function = null;

	constructor()
	{
		this.#frameEventHandler = this.#handleSigningEvent.bind(this);
	}

	startListening(): void
	{
		if (!this.#isListening)
		{
			Event.bind(top, 'message', this.#frameEventHandler);
			this.#isListening = true;
		}
	}

	stopListening(): void
	{
		if (this.#isListening)
		{
			Event.unbind(top, 'message', this.#frameEventHandler);
			this.#isListening = false;
		}

		if (this.#closeEventHandler)
		{
			EventEmitter.unsubscribe('SidePanel.Slider:onClose', this.#closeEventHandler);
			this.#closeEventHandler = null;
		}

		if (this.#stopSigningConfirmPopup)
		{
			this.#stopSigningConfirmPopup.close();
			this.#stopSigningConfirmPopup = null;
		}
	}

	subscribeSliderCloseEvent(sliderUrl: string = 'sign:stub:sign-link'): void
	{
		if (!sliderUrl)
		{
			return;
		}

		if (this.#closeEventHandler)
		{
			EventEmitter.unsubscribe('SidePanel.Slider:onClose', this.#closeEventHandler);
		}

		this.#closeEventHandler = (event) => {
			const [eventDataItem] = event.getData();
			const slider = eventDataItem?.getSlider();
			if (slider.getUrl() !== sliderUrl)
			{
				return;
			}

			if (this.#isNeedShowCloseConfirm())
			{
				eventDataItem.denyAction();
				this.#showCloseSigningConfirm(slider);

				return;
			}

			this.#signingStart = false;
			this.#cleanup();
		};

		const context = this.#getContext();
		context.BX.Event.EventEmitter.subscribe('SidePanel.Slider:onClose', this.#closeEventHandler);
	}

	#getServiceAddress(): string
	{
		const settings = Extension.getSettings('sign.v2.b2e.signing-frame-event-handler');

		return settings.get('serviceAddress');
	}

	#cleanup(): void
	{
		if (this.#closeEventHandler)
		{
			const context = this.#getContext();
			context.BX.Event.EventEmitter.unsubscribe('SidePanel.Slider:onClose', this.#closeEventHandler);
			this.#closeEventHandler = null;
		}

		if (this.#stopSigningConfirmPopup)
		{
			this.#stopSigningConfirmPopup.close();
			this.#stopSigningConfirmPopup = null;
		}

		this.stopListening();
	}

	#isNeedShowCloseConfirm(): boolean
	{
		return !this.#skipCloseConfirmation && this.#signingStart;
	}

	#showCloseSigningConfirm(slider): void
	{
		if (this.#stopSigningConfirmPopup)
		{
			this.#stopSigningConfirmPopup.close();
		}

		const context = this.#getContext();
		this.#stopSigningConfirmPopup = new context.BX.UI.Dialogs.MessageBox({
			message: Loc.getMessage('IFRAME_EVENT_HANDLER_CLOSE_SIGNING_CONFIRM_POPUP_MESSAGE'),
			buttons: context.BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
			okCaption: Loc.getMessage('IFRAME_EVENT_HANDLER_CLOSE_SIGNING_CONFIRM_POPUP_OK_BUTTON'),
			onOk: (messageBox: MessageBox): void => {
				messageBox.close();
				this.#stopSigningConfirmPopup = null;
				this.#skipCloseConfirmation = true;
				slider.close();
				this.#skipCloseConfirmation = false;
				this.#signingStart = false;
				this.#cleanup();
			},
			onCancel: (messageBox: MessageBox): void => {
				messageBox.close();
				this.#stopSigningConfirmPopup = null;
			},
		});

		this.#stopSigningConfirmPopup.show();
	}

	#getContext(): Window
	{
		return window === top ? window : top;
	}

	#handleSigningEvent(event): void
	{
		if (event.origin !== this.#getServiceAddress())
		{
			return;
		}

		const message = { type: '', data: undefined };
		if (Type.isString(event?.data))
		{
			message.type = event.data;
		}

		if (message.type === 'BX:Sign:signingStart')
		{
			this.#signingStart = true;
			this.#emitEvent('signingStart');
		}

		if (message.type === 'BX:Sign:signingEnd')
		{
			this.#signingStart = false;
			this.#emitEvent('signingEnd');
			this.#cleanup();
		}
	}

	#emitEvent(eventName: string): void
	{
		EventEmitter.emit(this, `IframeEventHandler:${eventName}`, {
			isSigningInProgress: this.#signingStart,
		});
	}
}
