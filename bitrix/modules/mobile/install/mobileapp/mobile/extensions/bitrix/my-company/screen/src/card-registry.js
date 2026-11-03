/**
 * @module my-company/screen/src/card-registry
 */
jn.define('my-company/screen/src/card-registry', (require, exports, module) => {
	const { MoreMenuUsers } = require('more-menu/block/company/users');
	const { TariffPlate } = require('more-menu/block/company/tariff-plate');
	const { TariffPlateDebug } = require('more-menu/block/company/tariff-plate-debug');
	const { BitrixAnswers } = require('more-menu/block/company/bitrix-answers');
	const { SupportButton } = require('more-menu/block/company/support');
	const { WhatsNewButton } = require('more-menu/block/company/whats-new');
	const { PersonalAccountSection } = require('more-menu/block/company/personal-account');
	const { PurchasesSection } = require('more-menu/block/company/purchases');
	const { Integrator } = require('more-menu/block/company/integrator');
	const { ImplementationSpecialists } = require('more-menu/block/company/specialists');

	/**
	 * Wraps a card that is a class of its own into the factory the rest of them already are: a card bound
	 * to a store is built by a call and takes no `new` at all. The registry builds every card the same
	 * way, and `new` of the section lives here alone.
	 *
	 * @param {Function} Card
	 * @return {function(object): object}
	 */
	const asFactory = (Card) => (props) => new Card(props);

	/**
	 * Maps a block code of the section onto the card that draws it: the cards come from different owners,
	 * and every one of them is built by a call of its `create`. Every card is a static dependency of the
	 * screen, so the section mounts the whole composition at once.
	 * `toProps` turns the record of the answer into the props of the card: the shape of a card belongs to
	 * the card, so the screen hands the record over without knowing what is in it. A card with no `toProps`
	 * has no data in the answer - it either draws a static view or loads its own.
	 * Locators are spelled out rather than derived from the block code: they are an e2e contract.
	 *
	 * @type {Record<MyCompanyBlockId, MyCompanyCardEntry>}
	 */
	const CARDS = {
		employees: {
			testId: 'employees',
			create: asFactory(MoreMenuUsers),
			toProps: ({ users, totalUsersCount, canInvite, canUseTelephony }) => ({
				employees: { users, totalUsersCount },
				canInvite,
				canUseTelephony,
			}),
		},
		tariff: {
			testId: 'tariff',
			create: asFactory(TariffPlate),
			toProps: (tariffPlate) => ({ tariffPlate }),
		},
		bitrixAnswers: {
			testId: 'bitrix-answers',
			create: asFactory(BitrixAnswers),
			toProps: ({ url, supportBotId, helpdeskUrl, canUseSupport }) => ({
				url,
				supportBotId,
				helpdeskUrl,
				canUseSupport,
			}),
		},
		support: {
			testId: 'support',
			create: asFactory(SupportButton),
			toProps: ({ supportBotId, canUseSupport, helpdeskUrl }) => ({
				supportBotId,
				canUseSupport,
				helpdeskUrl,
			}),
		},
		whatsNew: {
			testId: 'whats-new',
			// the articles of the card are none of the answer of the section: they live in a slice of the
			// whole app, and the card fills itself in from it
			create: WhatsNewButton,
		},
		personalAccount: {
			testId: 'personal-account',
			create: asFactory(PersonalAccountSection),
			toProps: ({ companies }) => ({ companies }),
		},
		purchases: {
			testId: 'purchases',
			create: asFactory(PurchasesSection),
		},
		integrator: {
			testId: 'integrator',
			create: asFactory(Integrator),
			toProps: (integrator) => ({ integrator }),
		},
		implementationSpecialists: {
			testId: 'implementation-specialists',
			create: asFactory(ImplementationSpecialists),
			toProps: (section) => ({ section }),
		},
	};

	/** The code the screen puts in the place of the tariff block while the demo mode of the plate is on. */
	const TARIFF_SHOWCASE_CODE = 'tariffShowcase';

	/**
	 * The showcase of every state of the tariff plate: it draws its own mocked states in the place of the
	 * tariff card and under the locator of that card, so the section keeps its own addressing.
	 * It is kept out of the table on purpose: the server never sends its code, and the screen substitutes
	 * it for the tariff card only when the feature flag is enabled.
	 *
	 * @type {MyCompanyCardEntry}
	 */
	const TARIFF_SHOWCASE_CARD = {
		testId: 'tariff',
		create: asFactory(TariffPlateDebug),
	};

	/**
	 * A block code is a key of the table, so the lookup asks for an own entry only: the names of
	 * `Object.prototype` would otherwise answer as cards without a `create` of their own, and such a
	 * code takes the whole render of the section down instead of being skipped.
	 *
	 * @param {string} code
	 * @return {?MyCompanyCardEntry}
	 */
	function getCardEntry(code)
	{
		if (code === TARIFF_SHOWCASE_CODE)
		{
			return TARIFF_SHOWCASE_CARD;
		}

		return Object.hasOwn(CARDS, code) ? CARDS[code] : null;
	}

	/**
	 * Block codes the registry can draw, in the order the server sent them: the client never re-sorts
	 * the sections.
	 *
	 * @param {string[]} [blocks]
	 * @return {string[]}
	 */
	function getCardCodes(blocks)
	{
		if (!Array.isArray(blocks))
		{
			return [];
		}

		return blocks.filter((code) => getCardEntry(code) !== null);
	}

	/**
	 * Block codes no entry can draw. A card can live in a branch of its own, so such a code is a normal
	 * answer: the section is skipped and the screen reports the codes once per load of its data.
	 *
	 * @param {string[]} [blocks]
	 * @return {string[]}
	 */
	function getUnknownCardCodes(blocks)
	{
		if (!Array.isArray(blocks))
		{
			return [];
		}

		return blocks.filter((code) => getCardEntry(code) === null);
	}

	module.exports = { getCardEntry, getCardCodes, getUnknownCardCodes };
});
