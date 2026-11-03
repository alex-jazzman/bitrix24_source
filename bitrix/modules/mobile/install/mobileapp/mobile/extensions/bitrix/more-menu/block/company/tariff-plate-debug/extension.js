/**
 * @module more-menu/block/company/tariff-plate-debug
 *
 * QA showcase behind a feature flag: renders the real TariffPlate over mocked states, stacked in a
 * column and grouped by meaning (title + divider between blocks). No controls. CTA is on everywhere.
 * Ships with the block and follows it into the "My company" section.
 */
jn.define('more-menu/block/company/tariff-plate-debug', (require, exports, module) => {
	const { Color, Indent } = require('tokens');
	const { Text2, Text6 } = require('ui-system/typography/text');
	const { createTestIdGenerator } = require('utils/test');
	const { PropTypes } = require('utils/validation');

	const { TariffPlate } = require('more-menu/block/company/tariff-plate');

	const FAMILY_NAMES = {
		project: 'Бесплатный',
		basic: 'Базовый',
		std: 'Стандартный',
		pro: 'Профессиональный',
		ent: 'Энтерпрайз',
	};

	const GROUPS = [
		{
			// The downgraded portal stands next to the free one on purpose: it carries the very same
			// license family and must be indistinguishable from it, demo offer included.
			title: 'Бесплатный тариф',
			items: [
				{ caption: 'Бесплатный', tariff: { family: 'project', state: 'free' } },
				{ caption: 'Бесплатный + демо тарифа доступно', tariff: { family: 'project', state: 'free', isDemoAvailable: true } },
				{ caption: 'Понижен до бесплатного', tariff: { family: 'project', state: 'downgraded' } },
				{ caption: 'Понижен + демо тарифа доступно', tariff: { family: 'project', state: 'downgraded', isDemoAvailable: true } },
			],
		},
		{
			title: 'Демо тарифа',
			items: [
				{ caption: 'Демо активно', tariff: { family: 'basic', state: 'demo' } },
			],
		},
		{
			title: 'Активный тариф — по семействам',
			items: [
				{ caption: 'Базовый', tariff: { family: 'basic', state: 'active' } },
				{ caption: 'Стандартный', tariff: { family: 'std', state: 'active' } },
				{ caption: 'Профессиональный', tariff: { family: 'pro', state: 'active' } },
				{ caption: 'Энтерпрайз', tariff: { family: 'ent', state: 'active' } },
			],
		},
		{
			title: 'Истекает / истёк',
			items: [
				{ caption: 'Почти истёк', tariff: { family: 'std', state: 'almostExpired', daysLeft: 3 } },
				{ caption: 'Истёк', tariff: { family: 'std', state: 'expired' } },
			],
		},
		{
			title: 'Автоплатёж',
			items: [
				{ caption: 'Autopay', tariff: { family: 'std', state: 'autopay' } },
			],
		},
		{
			title: 'Подписка',
			items: [
				{ caption: 'Демо активно', tariff: { family: 'std', state: 'active' }, subscription: 'demoActive' },
				{ caption: 'После демо — «Купить»', tariff: { family: 'std', state: 'active' }, subscription: 'none' },
				{ caption: 'Куплено', tariff: { family: 'std', state: 'active' }, subscription: 'purchased' },
				{ caption: 'Истекает', tariff: { family: 'std', state: 'active' }, subscription: 'expiring' },
			],
		},
	];

	class TariffPlateDebug extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ prefix: 'tariff-plate-debug' });
		}

		#buildPlate(item)
		{
			const { family, state, daysLeft, isDemoAvailable } = item.tariff;
			const hasSubscription = item.subscription !== undefined;
			const subscriptionState = item.subscription ?? 'none';

			return {
				visible: true,
				tariff: {
					name: FAMILY_NAMES[family] ?? family,
					type: family,
					family,
					state,
					expireText: '18 июля 2027',
					daysLeft: daysLeft ?? 30,
					cta: true,
					isDemoAvailable: isDemoAvailable ?? false,
				},
				subscription: {
					state: subscriptionState,
					expireText: '29 июня 2026',
					isDemoAvailable: false,
					cta: hasSubscription,
				},
			};
		}

		#renderItem(item, groupIndex, itemIndex)
		{
			return View(
				{
					style: {
						marginTop: Indent.M.toNumber(),
					},
				},
				Text6({
					text: item.caption,
					color: Color.base3,
					style: {
						marginBottom: Indent.XS.toNumber(),
					},
				}),
				new TariffPlate({
					layout: this.props.layout,
					tariffPlate: this.#buildPlate(item),
					testId: `tariff-plate-${groupIndex}-${itemIndex}`,
				}),
			);
		}

		#renderGroup(group, groupIndex)
		{
			return View(
				{
					style: {
						marginTop: groupIndex === 0 ? 0 : Indent.XL3.toNumber(),
					},
				},
				Text2({
					text: group.title,
					color: Color.base1,
				}),
				View({
					style: {
						height: 1,
						backgroundColor: Color.base4.toHex(),
						marginTop: Indent.XS.toNumber(),
					},
				}),
				...group.items.map((item, itemIndex) => this.#renderItem(item, groupIndex, itemIndex)),
			);
		}

		render()
		{
			return View(
				{
					testId: this.getTestId('root'),
					style: {
						paddingBottom: Indent.XL3.toNumber(),
					},
				},
				...GROUPS.map((group, groupIndex) => this.#renderGroup(group, groupIndex)),
			);
		}
	}

	TariffPlateDebug.propTypes = {
		layout: PropTypes.object.isRequired,
		testId: PropTypes.string,
	};

	module.exports = { TariffPlateDebug };
});
