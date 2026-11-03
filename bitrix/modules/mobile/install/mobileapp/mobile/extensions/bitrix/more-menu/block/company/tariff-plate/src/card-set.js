/**
 * @module more-menu/block/company/tariff-plate/src/card-set
 */
jn.define('more-menu/block/company/tariff-plate/src/card-set', (require, exports, module) => {
	const { TariffPlateStateEnum } = require('more-menu/block/company/tariff-plate/src/enum/tariff-plate-state-enum');

	/**
	 * The state is asked through `fromCode`, not compared as a string: `downgraded` resolves into FREE
	 * there, and a downgraded portal must offer the demo exactly as a free one does.
	 *
	 * @param {TariffData|DemoTariffData} [tariff]
	 * @return {boolean}
	 */
	const isDemoOffered = (tariff) => (
		Boolean(tariff?.isDemoAvailable) && TariffPlateStateEnum.fromCode(tariff?.state) === TariffPlateStateEnum.FREE
	);

	/**
	 * A subscription that is already running or paid gets a card of its own, no matter the purchase
	 * CTA; `none` and `expired` - nothing runs in either - get one only while a purchase is really on
	 * offer. Three rights make that up: `canBuy` is the right of the portal, which a region without the
	 * subscription denies, `cta` is the right of the platform, and the purchase rule of the client has
	 * the last word - where a purchase is not allowed, the card would advertise one nobody can make.
	 * `DEMO_AVAILABLE` is left out on purpose: the demo promo lives in a floating banner, not in this
	 * block.
	 *
	 * @param {SubscriptionData} [subscription]
	 * @param {typeof SubscriptionPlateStateEnum} SubscriptionState
	 * @param {boolean} isPurchaseAllowed
	 * @return {boolean}
	 */
	const isSubscriptionOffered = (subscription, SubscriptionState, isPurchaseAllowed) => {
		const state = SubscriptionState.fromCode(subscription?.state);

		if (state === SubscriptionState.NONE || state === SubscriptionState.EXPIRED)
		{
			return Boolean(subscription?.cta && subscription?.canBuy && isPurchaseAllowed);
		}

		return state === SubscriptionState.DEMO_ACTIVE
			|| state === SubscriptionState.PURCHASED
			|| state === SubscriptionState.EXPIRING;
	};

	/**
	 * The single rule of what the block draws: the tariff card wherever the block is drawn, the
	 * demo and the subscription cards on their own conditions. The state enum and the purchase verdict
	 * come from the caller: the rule belongs to the block, the enum to the subscription card, and the
	 * purchase rule to `utils/store`, which this file does not require - it is inlined into a test suite
	 * and has to stay free of native modules.
	 * The rule reads the same two fields of the tariff wherever it is called, so the narrow tariff of the
	 * menu payload needs no branch of its own; a missing subscription is read through `?.` and
	 * answers as no subscription offered.
	 *
	 * @param {TariffPlateData} [tariffPlate]
	 * @param {typeof SubscriptionPlateStateEnum} SubscriptionState
	 * @param {boolean} [isPurchaseAllowed] whether a purchase call may be drawn at all - the store of the
	 *   build or the forced flag of the server. Left out by a caller that mounts the demo card alone:
	 *   without it no subscription is offered, and the demo answer does not depend on the purchase rule
	 * @return {{tariff: boolean, demo: boolean, subscription: boolean}}
	 */
	const resolveCardSet = (tariffPlate, SubscriptionState, isPurchaseAllowed) => {
		if (!tariffPlate || !tariffPlate.visible)
		{
			return { tariff: false, demo: false, subscription: false };
		}

		const { tariff, subscription } = tariffPlate;

		return {
			tariff: true,
			demo: isDemoOffered(tariff),
			subscription: isSubscriptionOffered(subscription, SubscriptionState, isPurchaseAllowed),
		};
	};

	module.exports = { resolveCardSet };
});
