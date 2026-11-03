/**
 * @module more-menu/block/company/tariff-plate/subscription/plate/src/enum/subscription-plate-state-enum
 */
jn.define('more-menu/block/company/tariff-plate/subscription/plate/src/enum/subscription-plate-state-enum', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Loc } = require('loc');
	const { BaseEnum } = require('utils/enums/base');
	const { makeLibraryImagePath } = require('asset-manager');
	const {
		SubscriptionPlateCtaEnum,
	} = require('more-menu/block/company/tariff-plate/subscription/plate/src/enum/subscription-plate-cta-enum');

	const SUBSCRIPTION_IMAGE_URI = makeLibraryImagePath('gpt-market.png', 'more-menu/tariff');

	// named rather than typed in place: the character itself is indistinguishable from a plain space in
	// the source
	const NON_BREAKING_SPACE = '\u00A0';

	/**
	 * The date arrives ready to print, and the card is narrow enough for it to wrap - with the year
	 * left alone on a line of its own. Held together by non-breaking spaces it wraps as a whole, before
	 * the date rather than inside it.
	 *
	 * @param {string} expireText
	 * @return {string}
	 */
	const keepDateTogether = (expireText) => expireText.replaceAll(' ', NON_BREAKING_SPACE);

	/** Nothing is running, so the card carries the purchase: never started and expired look alike. */
	const PURCHASABLE = {
		imageUri: SUBSCRIPTION_IMAGE_URI,
		cta: SubscriptionPlateCtaEnum.BUY,
	};

	/** A paid subscription looks the same whether it is running out or not: graphic, expiry line, nothing to buy. */
	const PAID_SUBSCRIPTION = {
		imageUri: SUBSCRIPTION_IMAGE_URI,
		subtitle: {
			color: Color.base2,
			format: ({ expireText }) => (
				expireText
					? Loc.getMessage('M_TARIFF_PLATE_SUBSCRIPTION_PAID_UNTIL', { '#VALUE#': keepDateTogether(expireText) })
					: null
			),
		},
	};

	/**
	 * Card composition per subscription state: graphic, expiry line and purchase CTA.
	 * Whether the card is shown at all is decided by the orchestrator.
	 *
	 * @extends {BaseEnum<SubscriptionPlateStateEnum>}
	 */
	class SubscriptionPlateStateEnum extends BaseEnum
	{
		static NONE = new SubscriptionPlateStateEnum('none', PURCHASABLE);

		// draws nothing: the demo promo lives in a floating banner now (separate task).
		// the state itself must stay, otherwise fromCode() falls back to NONE and offers a purchase
		static DEMO_AVAILABLE = new SubscriptionPlateStateEnum('demoAvailable', {});

		static DEMO_ACTIVE = new SubscriptionPlateStateEnum('demoActive', {
			imageUri: SUBSCRIPTION_IMAGE_URI,
			subtitle: {
				// the same grey the paid states use: a line of the same meaning is not told apart by colour,
				// and blue in the app reads as something to tap. The demo is named by its own word instead
				color: Color.base2,
				format: ({ expireText }) => (
					expireText
						? Loc.getMessage('M_TARIFF_PLATE_SUBSCRIPTION_DEMO_UNTIL', { '#VALUE#': keepDateTogether(expireText) })
						: null
				),
			},
			cta: SubscriptionPlateCtaEnum.BUY,
		});

		static PURCHASED = new SubscriptionPlateStateEnum('purchased', PAID_SUBSCRIPTION);

		static EXPIRING = new SubscriptionPlateStateEnum('expiring', PAID_SUBSCRIPTION);

		// the term is over, whether it was a demo or a paid one: the same offer as a subscription never started
		static EXPIRED = new SubscriptionPlateStateEnum('expired', PURCHASABLE);

		/**
		 * Resolves the backend state code (e.g. 'demoActive') into the enum instance.
		 *
		 * @param {string} code
		 * @return {SubscriptionPlateStateEnum}
		 */
		static fromCode(code)
		{
			return this.getEnums().find((item) => item.getName() === code) ?? this.NONE;
		}

		getImageUri()
		{
			return this.getValue().imageUri ?? null;
		}

		/**
		 * @param {{expireText: ?string}} data
		 * @return {{text: string, color: object}|null}
		 */
		getSubtitle(data = {})
		{
			const { subtitle } = this.getValue();
			const text = subtitle ? subtitle.format(data) : null;

			if (!text)
			{
				return null;
			}

			return { text, color: subtitle.color };
		}

		/**
		 * @return {SubscriptionPlateCtaEnum|null}
		 */
		getCta()
		{
			return this.getValue().cta ?? null;
		}
	}

	module.exports = { SubscriptionPlateStateEnum: SubscriptionPlateStateEnum.export() };
});
