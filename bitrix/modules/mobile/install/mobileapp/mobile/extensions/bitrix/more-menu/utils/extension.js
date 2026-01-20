/**
 * @module more-menu/utils
 */
jn.define('more-menu/utils', (require, exports, module) => {
	const { inAppUrl } = require('in-app-url');
	const { isEmpty } = require('utils/object');
	const { Type } = require('type');
	const { MoreMenuAnalytics } = require('more-menu/analytics');
	const { Tourist } = require('tourist');
	const { selectNewCount } = require('statemanager/redux/slices/whats-new');
	const store = require('statemanager/redux/store');

	/**
	 * @param {array} sections
	 * @param {object} counters
	 * @return {array}
	 */
	const getUpdateSectionsWithCounters = (sections, counters) => {
		if (!Type.isArrayFilled(sections))
		{
			return [];
		}

		if (isEmpty(counters))
		{
			return sections;
		}

		return sections.map((section) => {
			if (section.hidden)
			{
				return section;
			}

			const updatedItems = section.items.map((item) => ({
				...item,
				counterValue: getCounterValue(counters, item),
			}));

			return {
				...section,
				items: updatedItems,
			};
		});
	};

	/**
	 * @param {array} sections
	 * @param {object} counters
	 * @return {number}
	 */
	const calculateTotalCounter = (sections, counters) => {
		if (!Type.isArrayFilled(sections) || isEmpty(counters))
		{
			return 0;
		}

		return (
			sections
				.filter((section) => !section.hidden)
				.flatMap((section) => section.items)
				.reduce((totalCounter, item) => totalCounter + getCounterValue(counters, item), 0)
		);
	};

	/**
	 * @param {object} counters
	 * @param {object} item
	 * @return {number}
	 */
	const getCounterValue = (counters, item) => {
		const counterName = item?.params?.counter;

		if (counterName && counters[counterName] !== undefined)
		{
			return counters[counterName];
		}

		return 0;
	};

	const handleItemClick = (item) => {
		if (!item)
		{
			return;
		}

		const { path, title, params = {} } = item;

		if (params?.analytics && MoreMenuAnalytics.isValidAnalyticsData(params.analytics))
		{
			new MoreMenuAnalytics(params.analytics).send();
		}

		if (path)
		{
			inAppUrl.open(path, { title, ...params });

			return;
		}

		if (params?.onclick)
		{
			// eslint-disable-next-line no-eval
			eval(params.onclick);

			return;
		}

		if (params?.url)
		{
			let backdrop = null;
			if (params?.backdrop && typeof params.backdrop === 'object')
			{
				if (Object.keys(params.backdrop).length > 0)
				{
					backdrop = params.backdrop;
				}
				else
				{
					backdrop = {};
				}
			}

			PageManager.openPage({
				url: params.url,
				useSearchBar: params?.useSearchBar,
				titleParams: { text: title, type: 'section' },
				cache: (params?.cache !== false),
				backdrop,
			});
		}
	};

	const getCountersFromStorage = () => {
		const cachedCounters = Application.sharedStorage().get('userCounters');
		try
		{
			const parsed = cachedCounters ? JSON.parse(cachedCounters) : {};

			return parsed[env.siteId] || {};
		}
		catch (e)
		{
			console.error(e);

			return {};
		}
	};

	const getMenuCounters = (canInvite, passedCounters = null) => {
		const counters = isEmpty(passedCounters) ? getCountersFromStorage() : passedCounters;
		const { total_invitation: totalInvitation } = counters;

		return {
			...counters,
			menu_invite: totalInvitation === 0 && canInvite && Tourist.firstTime('visit_invitations') ? 1 : 0,
			menu_tab_presets: Tourist.firstTime('visited_tab_presets') ? 1 : 0,
		};
	};

	const updateMenuBadgeCounter = (menuList, counters, whatsNewCounter = null) => {
		if (!Array.isArray(menuList) || !counters)
		{
			return;
		}

		try
		{
			const updatedSections = getUpdateSectionsWithCounters(menuList, counters);
			let totalCounter = calculateTotalCounter(updatedSections, counters);

			const { total_invitation, menu_invite, menu_tab_presets } = counters;

			if (Type.isNumber(total_invitation))
			{
				totalCounter += total_invitation;
			}

			if (Type.isNumber(menu_invite))
			{
				totalCounter += menu_invite;
			}

			if (Type.isNumber(menu_tab_presets))
			{
				totalCounter += menu_tab_presets;
			}

			const whatsNewCount = Type.isNumber(whatsNewCounter)
				? whatsNewCounter
				: (selectNewCount(store.getState()) ?? 0);

			if (whatsNewCount > 0)
			{
				totalCounter += whatsNewCount;
			}

			Application.setBadges({ more: totalCounter });
		}
		catch (e)
		{
			console.error(e);
		}
	};

	module.exports = {
		getUpdateSectionsWithCounters,
		calculateTotalCounter,
		handleItemClick,
		getMenuCounters,
		updateMenuBadgeCounter,
	};
});
