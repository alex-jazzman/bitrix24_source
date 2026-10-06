import { Loc } from 'main.core';
import { Guide } from 'ui.tour';
import { BannerDispatcher } from 'ui.banner-dispatcher';

import { isOnboardingDismissed, markOnboardingDismissed } from './dismissed-flag';

const DISMISSED_KEY = 'bizprocdesigner_connect_agent_onboarding_dismissed';
const BANNER_ID = 'bizprocdesigner_connect_agent_onboarding';

export class ConnectAgentOnboarding
{
	static show(): void
	{
		new ConnectAgentOnboarding().showOnboarding();
	}

	showOnboarding(): void
	{
		if (this.#isDismissed())
		{
			return;
		}

		const target: ?HTMLElement = document.querySelector('.bp-connect-agent-button');
		if (!target)
		{
			return;
		}

		const guide = new Guide({
			id: BANNER_ID,
			overlay: false,
			simpleMode: true,
			onEvents: true,
			steps: [
				{
					target,
					text: Loc.getMessage('BIZPROCDESIGNER_CONNECT_AGENT_ONBOARDING_TEXT'),
					position: 'bottom',
					condition: {
						top: true,
						bottom: false,
						color: 'primary',
					},
				},
			],
		});

		BannerDispatcher.normal.toQueue((onDone) => {
			if (!target.offsetWidth)
			{
				onDone();

				return;
			}

			const guidePopup = guide.getPopup();

			guidePopup.setAutoHide(true);
			guidePopup.setAngle({ offset: target.offsetWidth / 2 });

			let closed = false;
			const onClose = () => {
				if (closed)
				{
					return;
				}

				closed = true;
				this.#markDismissed();
				onDone();
			};

			guidePopup.subscribe('onClose', onClose);
			guidePopup.subscribe('onDestroy', onClose);

			guide.start();
		}, { id: BANNER_ID });
	}

	#isDismissed(): boolean
	{
		return isOnboardingDismissed(DISMISSED_KEY);
	}

	#markDismissed(): void
	{
		markOnboardingDismissed(DISMISSED_KEY);
	}
}
