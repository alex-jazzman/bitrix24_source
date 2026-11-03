import { Loc, Reflection, Type } from 'main.core';
import { Controller } from './controller';
import { CallCardReplacementApp } from '../app';

// The call view that requested the card is already on the page; importing im.v2.lib.phone
// would bring the whole messenger v2 into every getCrmCard response.
function getCallView(): ?Object
{
	if (Type.isObject(window.BXDesktopSystem))
	{
		return window.PCW ?? null;
	}

	const PhoneManager = Reflection.getClass('BX.Messenger.v2.Lib.PhoneManager');

	return PhoneManager?.getInstance().getPhoneCallView() ?? null;
}

export class CallCardIntegrator
{
	static async integrate(): ?CallCardReplacementApp
	{
		const callView = getCallView();
		if (!callView)
		{
			return null;
		}

		const callId = callView.callId;
		if (!Type.isStringFilled(callId))
		{
			return null;
		}

		return (new Controller())
			.resolveCallAssessment(callId)
			.then((response): ?CallCardReplacementApp => {
				const {
					callAssessment,
					hasAvailableSelectorItems,
					hintViewMode,
					isCallScoringV2Enabled,
				} = response?.data ?? {};
				if (!callAssessment)
				{
					return null;
				}

				const replacement = new CallCardReplacementApp({
					hasAvailableSelectorItems,
					callAssessment,
					callId,
					hintViewMode,
					isCallScoringV2Enabled: Boolean(isCallScoringV2Enabled),
				});

				const tabTitle = Loc.getMessage('CRM_COPILOT_CALL_CARD_REPLACEMENT_TAB_TITLE');

				return callView
					.addTab(tabTitle)
					.then((tab: Object): CallCardReplacementApp => {
						replacement.mount(tab.getContentContainerId());

						return replacement;
					})
				;
			})
			.catch(() => null)
		;
	}
}
