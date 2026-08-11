import { ControlButton } from 'intranet.control-button';
import { Event, Loc, Type } from 'main.core';
import { SidePanel, type Slider } from 'main.sidepanel';
import { Util } from 'calendar.util';

export class IntranetButton
{
	constructor(params = {})
	{
		this.intranetControllButton = new ControlButton(params.intranetControlButtonParams);
		this.hasChat = params.callbacks.hasChat;
		this.getUsersCount = params.callbacks.getUsersCount;

		if (Type.isElementNode(this.intranetControllButton.button))
		{
			this.openChat = this.intranetControllButton.openChat.bind(this.intranetControllButton);
			this.intranetControllButton.openChat = this.openChatWithConfirm.bind(this);

			this.startVideoCall = this.intranetControllButton.startVideoCall.bind(this.intranetControllButton);
			this.intranetControllButton.startVideoCall = this.startVideoCallWithConfirm.bind(this);

			const chatButton = this.intranetControllButton.button.querySelector('button.ui-btn-main');

			if (params.intranetControlButtonParams.mainItem === 'chat')
			{
				this.setClickListener(chatButton, this.openChatWithConfirm.bind(this));
			}
			else
			{
				this.setClickListener(chatButton, this.startVideoCallFromButton.bind(this));
			}

			// For testing purposes
			this.intranetControllButton.button.setAttribute('data-role', 'videocallButton');
		}
	}

	isProjectCalendarSlider(slider: ?Slider): boolean
	{
		if (Type.isNull(slider))
		{
			return false;
		}

		const sliderUrl = slider.getUrl();
		if (!Type.isStringFilled(sliderUrl))
		{
			return false;
		}

		return /workgroups\/group\/\d+\/calendar\/?/i.test(sliderUrl);
	}

	isCalendarEventSlider(slider: ?Slider): boolean
	{
		if (Type.isNull(slider))
		{
			return false;
		}

		const sliderData = slider.getData();

		return sliderData.get('type') === 'calendar:slider';
	}

	shouldOpenChatSafely(): boolean
	{
		return this.getSlidersToCloseForChat().length > 0;
	}

	openChatWithConfirm()
	{
		const openChatHandler = this.shouldOpenChatSafely() ? this.openChatSafely.bind(this) : this.openChat;

		if (this.shouldNotConfirmOpenChat())
		{
			void openChatHandler();

			return;
		}

		Util.showConfirmPopup(openChatHandler, Loc.getMessage('EC_CREATE_CHAT_CONFIRM_QUESTION'), {
			okCaption: Loc.getMessage('EC_CREATE_CHAT_OK'),
			minWidth: 350,
			maxWidth: 350,
		});
	}

	openChatSafely()
	{
		this.openChat().then(() => {
			this.closeSliders(this.getSlidersToCloseForChat());
		});
	}

	getSlidersToCloseForChat(): Slider[]
	{
		const openSliders = [...SidePanel.Instance.getOpenSliders()];
		const slidersToClose = [];

		for (let index = openSliders.length - 1; index >= 0; index--)
		{
			const slider = openSliders[index];

			if (this.isCalendarEventSlider(slider))
			{
				slidersToClose.push(slider);

				continue;
			}

			if (this.isProjectCalendarSlider(slider))
			{
				slidersToClose.push(slider);

				continue;
			}

			break;
		}

		return slidersToClose;
	}

	closeSliders(sliders: Slider[])
	{
		if (sliders.length === 0)
		{
			return;
		}

		const [slider, ...restSliders] = sliders;

		slider.close(false, () => this.closeSliders(restSliders));
	}

	startVideoCallWithConfirm(videoCallContext = 'context_menu')
	{
		if (this.shouldNotConfirmOpenChat())
		{
			this.startVideoCall(videoCallContext);

			return;
		}

		Util.showConfirmPopup(this.startVideoCall, Loc.getMessage('EC_START_VIDEOCONFERENCE_CONFIRM_QUESTION'), {
			okCaption: Loc.getMessage('EC_START_VIDEOCONFERENCE_OK'),
			minWidth: 350,
			maxWidth: 350,
		});
	}

	startVideoCallFromButton()
	{
		this.startVideoCallWithConfirm('card');
	}

	shouldNotConfirmOpenChat()
	{
		return this.hasChat() || this.getUsersCount() < 10;
	}

	setClickListener(element, handler)
	{
		const clonedNode = element.cloneNode(true);
		Event.bind(clonedNode, 'click', handler);
		element.parentNode.replaceChild(clonedNode, element);
	}

	destroy()
	{
		if (this.intranetControllButton && this.intranetControllButton.destroy)
		{
			this.intranetControllButton.destroy();
			this.intranetControllButton = null;
		}
	}
}
