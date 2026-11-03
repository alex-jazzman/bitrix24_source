/**
 * @module im/messenger/lib/integration/mobile/vibecode
 *
 * Integration point for the vibecodeconnector (cloud) team.
 *
 * This file is the isolated area for free modification. immobile only renders
 * the button and invokes onClick. Badge value is delivered to the native badge
 * registry by code (`vibecode`) via Application.setBadges. All click handling,
 * popup opening, navigation, instrumentation, etc. is supposed to live here.
 *
 * Contract:
 * - onClick(): invoked when the user taps the button.
 * - recount(): fetches the actual number of new apps and pushes it to the
 *   native badge registry when it changed (see ALG-01). Triggered on messenger
 *   activation (app active) and when the catalog view is shown again after an
 *   app opened over it. A no-op while the badge is withdrawn: with the app chats
 *   on, the messenger folder announces the new apps instead
 *   (Feature.isVibecodeNewAppsBadgeAvailable, decided by the connector).
 */
jn.define('im/messenger/lib/integration/mobile/vibecode', (require, exports, module) => {
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Feature } = require('im/messenger/lib/feature');
	const { ChatEntityType, EventType } = require('im/messenger/const');
	const { Loc } = require('im/messenger/loc');
	const { getLogger } = require('im/messenger/lib/logger');
	const { requireLazy } = require('require-lazy');
	const { showErrorToast } = require('toast/error');
	const { RunActionExecutor } = require('rest/run-action-executor');

	const logger = getLogger('integration--vibecode');

	const BadgeCode = 'vibecode';
	const GET_NEW_APPS_COUNT_ACTION = 'vibecodeconnector.Catalog.getNewAppsCount';

	/**
	 * Single-flight guard for the recent item button: catalog item IDs whose open is
	 * already running. Row selection is throttled by the select service, the button tap
	 * is not, so without this a double tap opens the app twice and records two opens.
	 * @type {Set<number>}
	 */
	const openingCatalogItemIds = new Set();

	/**
	 * @param {*} value
	 * @return {?number}
	 */
	function normalizePositiveInteger(value)
	{
		const normalizedValue = Number(value);

		return Number.isFinite(normalizedValue) && Number.isInteger(normalizedValue) && normalizedValue > 0
			? normalizedValue
			: null
		;
	}

	/**
	 * @param {string} itemId
	 * @return {?RecentWidgetItemButton}
	 */
	function getRecentItemButton(itemId)
	{
		if (
			!Feature.isRecentItemButtonAvailable
			|| !Feature.isVibecodeButtonAvailable
			|| !Feature.isVibecodeRecentActionAvailable
		)
		{
			return null;
		}

		const store = serviceLocator.get('core')?.getStore();
		const dialog = store?.getters?.['dialoguesModel/getById']?.(itemId);
		if (!dialog || dialog.entityType !== ChatEntityType.vibecodeApp)
		{
			return null;
		}

		if (normalizePositiveInteger(dialog.entityId) === null)
		{
			return null;
		}

		return createRecentItemButton();
	}

	/**
	 * @param {string} itemId
	 * @param {function(): Promise<{VibeCodeAppOpener: Object}>} [loadAppOpener]
	 * @return {Promise<void>}
	 */
	async function handleRecentItemButtonTap(
		itemId,
		loadAppOpener = () => requireLazy('vibecode/app-opener'),
	)
	{
		if (
			!Feature.isRecentItemButtonAvailable
			|| !Feature.isVibecodeButtonAvailable
			|| !Feature.isVibecodeRecentActionAvailable
		)
		{
			return;
		}

		if (typeof itemId !== 'string' || itemId.length === 0)
		{
			logger.error('handleRecentItemButtonTap: invalid itemId', itemId);

			return;
		}

		const store = serviceLocator.get('core')?.getStore();
		const dialog = store?.getters?.['dialoguesModel/getById']?.(itemId);
		if (!dialog || dialog.entityType !== ChatEntityType.vibecodeApp)
		{
			logger.error('handleRecentItemButtonTap: invalid dialog', itemId);

			return;
		}

		const catalogItemId = normalizePositiveInteger(dialog.entityId);
		if (catalogItemId === null)
		{
			logger.error('handleRecentItemButtonTap: invalid catalog item ID', dialog.entityId);

			return;
		}

		if (openingCatalogItemIds.has(catalogItemId))
		{
			logger.log('handleRecentItemButtonTap: open is already in flight', catalogItemId);

			return;
		}

		openingCatalogItemIds.add(catalogItemId);
		try
		{
			const { VibeCodeAppOpener } = await loadAppOpener();
			await VibeCodeAppOpener.open({ catalogItemId });
		}
		catch (error)
		{
			logger.error('handleRecentItemButtonTap: failed to open vibecode app', error);
		}
		finally
		{
			openingCatalogItemIds.delete(catalogItemId);
		}
	}

	/**
	 * @return {RecentWidgetItemButton}
	 */
	function createRecentItemButton()
	{
		return Object.freeze({
			id: 'open',
			text: Loc.getMessage('IMMOBILE_ELEMENT_RECENT_VIBECODE_OPEN'),
			size: 'm',
			design: 'primary',
			mode: 'solid',
			rounded: true,
			viewId: 'chat_recent_open_app_button',
		});
	}

	/** @type {number|null} */
	let newAppsCount = null;
	let recountInFlight = false;
	let recountPending = false;

	/**
	 * Button tap handler.
	 * @return {Promise<void>}
	 */
	async function onClick()
	{
		const parentWidget = serviceLocator.get('recent-manager')?.recentGetter?.getCurrentRecent() ?? PageManager;

		try
		{
			const { VibeCodeCatalogOpener } = await requireLazy('vibecode/catalog/opener');
			const widget = await VibeCodeCatalogOpener.open({ parentWidget });

			if (!widget)
			{
				logger.error('onClick: failed to open vibecode catalog');
				showErrorToast({}, parentWidget);

				return;
			}

			// Returning from an app opened over the catalog fires neither app-active nor
			// a reliable view.show, so recount on view.close (catalog dismissed) to refresh
			// the messenger badge; view.show still covers other re-show cases.
			widget.on?.(EventType.view.show, () => {
				void recount();
			});
			widget.on?.(EventType.view.close, () => {
				void recount();
			});
		}
		catch (error)
		{
			logger.error('onClick: failed to open vibecode catalog', error);
			showErrorToast({}, parentWidget);
		}
	}

	/**
	 * ALG-01 badge lifecycle decision. Pure: no network or native side effects.
	 * @param {number|null} previousCount
	 * @param {number} count
	 * @return {{ shouldSetBadge: boolean, count: number }}
	 */
	function resolveBadgeUpdate(previousCount, count)
	{
		if (count === previousCount)
		{
			return { shouldSetBadge: false, count };
		}

		return { shouldSetBadge: true, count };
	}

	/**
	 * Fetches the actual new apps count, bypassing cache.
	 * @return {Promise<number>}
	 */
	async function fetchNewAppsCount()
	{
		const response = await (new RunActionExecutor(GET_NEW_APPS_COUNT_ACTION, {})).call(false);
		const errors = Array.isArray(response?.errors) ? response.errors : [];
		if (errors.length > 0)
		{
			throw response;
		}

		const count = Number(response?.data?.count);

		return (Number.isInteger(count) && count > 0 ? count : 0);
	}

	/**
	 * The badge lives only on a shown button and only while the connector lets the button carry
	 * the counter: with the app chats on, the messenger folder announces the new apps itself.
	 * @return {boolean}
	 */
	function isBadgeAvailable()
	{
		return Feature.isVibecodeButtonAvailable && Feature.isVibecodeNewAppsBadgeAvailable;
	}

	/**
	 * ALG-01: recount and push to the native badge registry if the value changed.
	 * @return {Promise<void>}
	 */
	async function recount()
	{
		if (!isBadgeAvailable())
		{
			return;
		}

		if (recountInFlight)
		{
			// A recount is running with a value read before the latest event; defer one
			// more pass so the last trigger is reflected instead of being dropped.
			recountPending = true;

			return;
		}

		recountInFlight = true;
		recountPending = false;
		try
		{
			const count = await fetchNewAppsCount();
			const { shouldSetBadge } = resolveBadgeUpdate(newAppsCount, count);
			if (shouldSetBadge)
			{
				newAppsCount = count;
				Application.setBadges({ [BadgeCode]: count });
			}
		}
		catch (error)
		{
			logger.error('recount: failed to update vibecode badge', error);
		}
		finally
		{
			// Re-run when an event arrived mid-flight, including after a failed request,
			// so the latest trigger is not dropped.
			const shouldRecount = recountPending;
			recountInFlight = false;
			recountPending = false;

			if (shouldRecount)
			{
				void recount();
			}
		}
	}

	if (isBadgeAvailable())
	{
		BX.addCustomEvent(EventType.app.active, () => {
			void recount();
		});
		// Pull-to-refresh (and resume/reconnect refreshes) complete with this event,
		// so recount to keep the messenger badge in sync with the catalog.
		BX.addCustomEvent(EventType.messenger.afterRefreshSuccess, () => {
			void recount();
		});
		void recount();
	}

	module.exports = {
		normalizePositiveInteger,
		getRecentItemButton,
		handleRecentItemButtonTap,
		onClick,
		recount,
		resolveBadgeUpdate,
	};
});
