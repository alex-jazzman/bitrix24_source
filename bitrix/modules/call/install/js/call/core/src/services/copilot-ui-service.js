import { Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { CallAI } from '../call_ai';
import { Provider } from '../engine/engine';

/**
 * Manages Copilot UI interactions: button clicks, confirm modals, popup lifecycle,
 * button state updates, and notify popup show/close.
 *
 * Emits:
 *   - `CopilotUiService::onChangeStateCopilot` — when the user confirms a copilot state change;
 *     data: `{ desiredState: 'enabled' | 'paused' | 'destroyed' }`
 */
export class CopilotUiService extends EventEmitter
{
	/**
	 * @param {object} config
	 * @param {import('call.lib.view-contract').CallView} config.viewPort
	 * @param {HTMLElement} config.container
	 * @param {Function} config.CopilotPopupClass — constructor for the copilot popup (injected to allow test isolation)
	 * @param {Function} [config.onTariffGate] — called when the tariff gate fires
	 * @param {*} [config.callStore]
	 */
	constructor({ viewPort, container, CopilotPopupClass, onTariffGate, callStore })
	{
		super();
		this.setEventNamespace('BX.Call.CopilotUiService');

		this.viewPort = viewPort;
		this.container = container;
		this.copilotPopup = null;
		this.CopilotPopupClass = CopilotPopupClass;
		this.onTariffGate = onTariffGate ?? null;
		this.callStore = callStore ?? null;
	}

	/**
	 * Handles the Copilot button click.
	 * @param {object} copilotState
	 * @param {boolean} copilotState.isCopilotActive
	 * @param {boolean} copilotState.isCopilotFeaturesEnabled
	 * @param {number|string} copilotState.callId
	 */
	onButtonClick({ isCopilotActive, isCopilotFeaturesEnabled, callId })
	{
		if (this.copilotPopup)
		{
			this.copilotPopup.close();

			return;
		}

		if (isCopilotFeaturesEnabled && CallAI.settingsEnabled && !CallAI.tariffAvailable)
		{
			if (this.onTariffGate)
			{
				this.onTariffGate();
			}

			return;
		}

		this.copilotPopup = new this.CopilotPopupClass({
			targetContainer: this.container,
			isCopilotActive,
			isCopilotFeaturesEnabled,
			callId,
			updateCopilotState: () => {
				if (isCopilotActive)
				{
					this.viewPort
						?.showConfirmModal({
							title: Loc.getMessage('CALL_AI_RECORD_STOP_TITLE'),
							message: Loc.getMessage('CALL_AI_RECORD_STOP_MESSAGE'),
							yesButtonText: Loc.getMessage('CALL_AI_RECORD_STOP_YES_BUTTON'),
							noButtonText: Loc.getMessage('CALL_AI_RECORD_STOP_NO_BUTTON'),
						})
						.then((choice) => {
							if (choice === 'yes')
							{
								this.emit('CopilotUiService::onChangeStateCopilot', { desiredState: 'paused' });
							}

							if (choice === 'no')
							{
								this.emit('CopilotUiService::onChangeStateCopilot', { desiredState: 'destroyed' });
							}
						})
						.catch((error) => console.error('Unspecified error in viewPort.showConfirmModal:', error));
				}
				else
				{
					this.emit('CopilotUiService::onChangeStateCopilot', { desiredState: 'enabled' });
				}
			},
			onClose: () => {
				this.copilotPopup = null;
			},
		});

		if (this.copilotPopup)
		{
			this.viewPort?.closeCopilotNotify();
			this.copilotPopup.toggle();
		}
	}

	/**
	 * Updates the Copilot button state and shows or closes the copilot notify popup
	 * to reflect the new Copilot state.
	 *
	 * @param {object} newCopilotState
	 * @param {boolean} newCopilotState.isCopilotActive
	 * @param {number|string} [newCopilotState.callId]
	 */
	updateState({ isCopilotActive, callId })
	{
		if (!this.viewPort)
		{
			return;
		}

		this.viewPort.setButtonActive('copilot', isCopilotActive);

		if (isCopilotActive)
		{
			this.viewPort.showCopilotNotify(callId);

			if (this.callStore)
			{
				this.callStore.addNotification('copilot', { callId });
			}
		}
		else
		{
			this.viewPort.closeCopilotNotify();
		}
	}

	/**
	 * Shows the Copilot notify popup if conditions are met.
	 *
	 * @param {object} params
	 * @param {boolean} params.isCopilotActive
	 * @param {string} params.provider
	 * @param {number|string} params.callId
	 * @param {boolean} [params.force] — show even if copilot is not active
	 * @param {string} [params.errorCode]
	 */
	showNotify({ isCopilotActive, provider, callId, force = false, errorCode = '' })
	{
		if ((isCopilotActive || force) && provider !== Provider.Plain && this.viewPort)
		{
			this.viewPort.showCopilotNotify(callId, errorCode);

			if (this.callStore)
			{
				this.callStore.addNotification('copilot', { callId, errorCode });
			}
		}
	}

	/**
	 * Shows the Copilot result notify popup.
	 */
	showResultNotify()
	{
		if (this.viewPort)
		{
			this.viewPort.showCopilotResultNotify();
		}
	}

	/**
	 * Closes the Copilot notify popup if the viewPort is available.
	 */
	closeNotify()
	{
		if (this.viewPort)
		{
			this.viewPort.closeCopilotNotify();
		}
	}

	/**
	 * Unblocks the copilot toolbar button.
	 * Called when the copilot service becomes available (e.g., after recorder status change).
	 */
	unblockCopilotButton()
	{
		if (this.viewPort)
		{
			this.viewPort.unblockButtons(['copilot']);
		}
	}

	/**
	 * Closes the copilot popup if open and releases all held references.
	 */
	destroy()
	{
		this.callStore = null;

		if (this.copilotPopup !== null)
		{
			this.copilotPopup.close();
			this.copilotPopup = null;
		}

		this.viewPort = null;
		this.container = null;
	}
}
