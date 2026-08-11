import { EventEmitter } from 'main.core.events';
import { PromoPopup, PromoPopup3D } from '../dialogs/promo_popup';
import { BackgroundDialog } from '../dialogs/background_dialog';
import Util from '../util';

const DOCUMENT_PROMO_CODE = 'im:call-document:16102021:web';
const DOCUMENT_PROMO_DELAY = 5 * 60 * 1000;
const MASK_PROMO_CODE = 'im:mask:06122022:desktop';
const MASK_PROMO_DELAY = 5 * 60 * 1000;

/**
 * Manages promotional popups shown during a call (document promo, mask promo, etc.).
 */
export class PromoService extends EventEmitter
{
	/**
	 * @param {object} config
	 * @param {*} config.viewPort
	 * @param {HTMLElement} config.container
	 * @param {Function} config.isPromoRequired - `(code: string) => boolean`
	 * @param {*} [config.callStore]
	 */
	constructor({ viewPort, container, isPromoRequired, callStore })
	{
		super();
		this.setEventNamespace('BX.Call.PromoService');

		this.viewPort = viewPort;
		this.container = container;
		this.isPromoRequired = isPromoRequired;
		this.callStore = callStore ?? null;

		this.documentPromoPopup = null;
		this.maskPromoPopup = null;
		this.showPromoPopupTimeout = null;
		this.showPromoPopup3dTimeout = null;
	}

	/**
	 * Shows the document feature promo popup near the given bind element.
	 *
	 * @param {HTMLElement|null} bindElement - Element to anchor the popup to.
	 * @param {object} options
	 * @param {boolean} [options.isFolded] - Whether the call window is currently folded.
	 * @returns {false|undefined}
	 */
	showDocumentPromo(bindElement, options = {})
	{
		if (!this.viewPort || !Util.shouldShowDocumentButton())
		{
			return false;
		}

		if (!this.isPromoRequired(DOCUMENT_PROMO_CODE))
		{
			return false;
		}

		if (!bindElement)
		{
			return false;
		}

		this.documentPromoPopup = new PromoPopup({
			bindElement,
			promoCode: DOCUMENT_PROMO_CODE,
			targetContainer: this.container,
			events: {
				onActionClick: () => {
					this.emit('PromoService::onDocumentPromoActionClicked');
				},
				onClose: ({ data }) => {
					this.documentPromoPopup = null;
					if (data.dontShowAgain)
					{
						this.emit('PromoService::onPromoViewed', { code: DOCUMENT_PROMO_CODE });
					}
				},
			},
		});

		this.showPromoPopupTimeout = setTimeout(() => {
			if (options.isFolded)
			{
				return;
			}

			this.documentPromoPopup?.show();
		}, DOCUMENT_PROMO_DELAY);
	}

	/**
	 * Shows the background mask feature promo popup.
	 *
	 * @returns {false|undefined}
	 */
	showMaskPromo()
	{
		if (!this.viewPort || !BackgroundDialog.isMaskAvailable())
		{
			return false;
		}

		if (!this.isPromoRequired(MASK_PROMO_CODE))
		{
			return false;
		}

		this.maskPromoPopup = new PromoPopup3D({
			callView: this.viewPort,
			targetContainer: this.container,
			events: {
				onClose: () => {
					this.emit('PromoService::onPromoViewed', { code: MASK_PROMO_CODE });
					this.maskPromoPopup = null;
				},
			},
		});

		this.showPromoPopup3dTimeout = setTimeout(() => {
			this.maskPromoPopup?.show();
		}, MASK_PROMO_DELAY);
	}

	/**
	 * Closes all open promo popups and clears pending show timers.
	 */
	closeAll()
	{
		if (this.documentPromoPopup)
		{
			this.documentPromoPopup.close();
		}

		if (this.maskPromoPopup)
		{
			this.maskPromoPopup.close();
		}

		clearTimeout(this.showPromoPopupTimeout);
		clearTimeout(this.showPromoPopup3dTimeout);
	}

	/**
	 * Releases all resources and event listeners held by this service.
	 */
	destroy()
	{
		this.callStore = null;

		this.closeAll();

		this.documentPromoPopup = null;
		this.maskPromoPopup = null;
		this.showPromoPopupTimeout = null;
		this.showPromoPopup3dTimeout = null;
		this.viewPort = null;
		this.container = null;
	}
}
