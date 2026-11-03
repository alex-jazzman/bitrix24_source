<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * Mobile template of the dashboard detail component. The page is opened by the native shell only for a
 * report the server has already called ready (biconnectormobile.Dashboard.getViewState), so the only
 * thing left here is to embed the report and report the outcome over the frame bridge. Preparing the
 * report - installing it and starting the instance up - happens server-side and never from this page.
 * No web chrome.
 *
 * @var array $arResult
 * @var CMain $APPLICATION
 */

use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

Extension::load([
	'biconnector.apache-superset-embedded-loader',
]);

$reason = $arResult['MOBILE_REASON'] ?? null;
$embed = null;

if (($arResult['MOBILE_STATE'] ?? '') === 'preparing')
{
	// The report stopped being ready between the answer of the state action and this request - the
	// instance was frozen, say. `not_ready` is what tells the shell to go back and ask the server again
	// instead of calling the report broken.
	$reason ??= 'not_ready';
}
elseif (
	$reason === null
	&& !empty($arResult['DASHBOARD_UUID'])
	&& !empty($arResult['GUEST_TOKEN'])
	&& !empty($arResult['SUPERSET_DOMAIN'])
)
{
	$embed = [
		'uuid' => $arResult['DASHBOARD_UUID'],
		'guestToken' => $arResult['GUEST_TOKEN'],
		'supersetDomain' => $arResult['SUPERSET_DOMAIN'],
		'nativeFilters' => $arResult['NATIVE_FILTERS'] ?? '',
		// The uri variables of the dashboard, `current_user` among them: without them the report is drawn over
		// the rows of everyone. The web template hands them over the same way.
		'urlParams' => (object)($arResult['URL_PARAMS'] ?? []),
		// The values a select filter of the report is allowed to offer - flows, workflow templates - narrowed to
		// the ones of this user. The frame asks the page for them, and a page that keeps silent leaves the frame
		// with its own list, which is every value of the portal.
		'filters' => (object)($arResult['FILTERS'] ?? []),
	];
}

$frameConfig = [
	'reason' => $embed === null ? ($reason ?? 'superset_unavailable') : null,
	'embed' => $embed,
	'debug' => !empty($arResult['EMBEDDED_DEBUG_MODE']),
	'timeout' => 45000,
	// Superset sends no data mask for a dashboard it failed to draw.
	'renderSignalTimeout' => 10000,
	// A dashboard shorter than the frame cannot be told apart from the spinner of Superset.
	'drawTimeout' => 3000,
	'drawPollInterval' => 100,
];

?>
<style>
	html, body { height: 100%; margin: 0; padding: 0; }
	#dashboard-frame { position: absolute; inset: 0; overflow: hidden; }
	#dashboard-frame iframe { width: 100%; height: 100%; border: 0; display: block; }
	:root[data-color-scheme="dark"], :root[data-color-scheme="dark"] body { background-color: #17181a; }
	:root[data-color-scheme="light"], :root[data-color-scheme="light"] body { background-color: #ffffff; }
</style>

<div id="dashboard-frame"></div>

<script>
	(function() {
		// Frozen contract, shared with the native shell - the extension of the report screen,
		// biconnectormobile/install/mobileapp/biconnectormobile/extensions/biconnector/dashboard-detail/extension.js.
		// Neither side of the bridge changes it alone. INIT comes in (the colour scheme of the app),
		// READY and ERROR go out and are the only outcomes of embedding a report.
		const BridgeEvent = { INIT: 'INIT', READY: 'READY', ERROR: 'ERROR' };
		const config = <?= Json::encode($frameConfig) ?>;

		let dispatched = false;
		const sendReady = () => {
			if (dispatched) { return; }
			dispatched = true;
			BXNativeBridge?.sendEvent?.(BridgeEvent.READY, {});
		};
		const sendError = (reason) => {
			if (dispatched) { return; }
			dispatched = true;
			BXNativeBridge?.sendEvent?.(BridgeEvent.ERROR, { reason });
		};

		const applyTheme = (colorScheme) => {
			const scheme = colorScheme === 'dark' ? 'dark' : 'light';
			document.documentElement.setAttribute('data-color-scheme', scheme);
			document.documentElement.style.colorScheme = scheme;
		};

		const onReceiveEvent = (event) => {
			const { eventType, data = {} } = event || {};
			if (eventType === BridgeEvent.INIT)
			{
				applyTheme(data.colorScheme);
			}
		};

		// A select filter of the report asks the page which values it may offer - the frame has no way of its
		// own to learn what this user is allowed to see. The exchange is the one the web template answers with
		// the same pair of messages; an unanswered request leaves the filter listing the whole portal.
		const answerFilterOptions = (event) => {
			const embed = config.embed;
			if (!embed || event.origin !== embed.supersetDomain)
			{
				return;
			}

			const { type, filterId } = event.data || {};
			if (type !== 'superset-filter-request-options' || !filterId)
			{
				return;
			}

			event.source?.postMessage({
				type: 'superset-filter-options',
				filterId,
				options: embed.filters?.[filterId] ?? [],
			}, event.origin);
		};

		const mountFrame = () => {
			const embed = config.embed;
			const EmbeddedLoader = BX.BIConnector && BX.BIConnector.ApacheSupersetEmbeddedLoader;
			if (!EmbeddedLoader || !embed || !embed.uuid || !embed.supersetDomain)
			{
				sendError('superset_unavailable');

				return;
			}

			window.addEventListener('message', answerFilterOptions);

			const timeoutId = setTimeout(() => sendError('timeout'), config.timeout);

			const loader = new EmbeddedLoader({
				id: embed.uuid,
				supersetDomain: embed.supersetDomain,
				mountPoint: document.getElementById('dashboard-frame'),
				fetchGuestToken: embed.guestToken,
				debug: config.debug === true,
				dashboardUiConfig: {
					hideTitle: true,
					hideTab: true,
					hideChartControls: true,
					emitDataMasks: true,
					filters: {
						expanded: true,
						visible: true,
						nativeFilters: embed.nativeFilters,
					},
					urlParams: embed.urlParams || {},
				},
			});

			loader.embedDashboard()
				.then((dashboard) => {
					let fallbackTimeoutId = null;
					let isHydrated = false;
					const showReport = () => {
						clearTimeout(timeoutId);
						clearTimeout(fallbackTimeoutId);
						sendReady();
					};

					// While Superset shows its spinner, the page in the frame is exactly as tall as the frame.
					const showReportWhenDrawn = () => {
						if (dispatched)
						{
							return;
						}

						dashboard.getScrollSize()
							.then(({ height }) => {
								if (height > document.getElementById('dashboard-frame').clientHeight)
								{
									showReport();

									return;
								}

								setTimeout(showReportWhenDrawn, config.drawPollInterval);
							})
							.catch(showReport);
					};

					dashboard.observeDataMask(() => {
						// A data mask comes on every change of a filter too; only the first one matters here.
						if (isHydrated)
						{
							return;
						}
						isHydrated = true;

						clearTimeout(fallbackTimeoutId);
						fallbackTimeoutId = setTimeout(showReport, config.drawTimeout);
						showReportWhenDrawn();
					});
					fallbackTimeoutId = setTimeout(showReport, config.renderSignalTimeout);
				})
				.catch(() => {
					clearTimeout(timeoutId);
					sendError('superset_unavailable');
				});
		};

		const run = () => {
			if (config.reason)
			{
				sendError(config.reason);

				return;
			}

			mountFrame();
		};

		// Readiness = double signal: BXNativeBridgeReady (bridge up) and BX.ready (loader initialized).
		let readyCount = 0;
		const onBothReady = () => {
			if (++readyCount < 2)
			{
				return;
			}

			BXNativeBridge?.onReceiveEvent?.(onReceiveEvent);
			run();
		};

		document.addEventListener('BXNativeBridgeReady', onBothReady, { once: true });
		BX.ready(onBothReady);
	})();
</script>
