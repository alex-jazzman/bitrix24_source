<?php

use Bitrix\BIConnectorMobile\Service\ScopeVisibilityService;
use Bitrix\Main\Context;
use Bitrix\Main\Loader;
use Bitrix\Main\Web\Json;

require($_SERVER['DOCUMENT_ROOT'] . '/mobile/headers.php');
require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');

/**
 * Mobile detail frame page: a thin shell around the real web detail component rendered with its
 * `mobile` template (IS_MOBILE). The component owns the full lifecycle - access, dashboard install,
 * instance unfreeze wait, skeleton, credentials - and the mobile template turns the result into a
 * bridge signal (READY / PREPARING / ERROR) for the native shell (biconnectormobile).
 *
 * The feature flag is the page's own business, the same border as MobileBIFeatureAccess draws for the
 * controllers: without it a saved link or a remembered id would open a report while the feature is off.
 * Rights, tool and tariff stay with the component.
 */

$dashboardId = (int)Context::getCurrent()->getRequest()->get('dashboardId');

global $APPLICATION;

$errorReason = null;
if (!Loader::includeModule('biconnectormobile') || !ScopeVisibilityService::isFeatureEnabled())
{
	// `no_access` is the reason the native shell already knows for "the feature is not yours to open";
	// the list screen groups FEATURE_DISABLED with the no-access codes in the same way.
	$errorReason = 'no_access';
}
elseif (!Loader::includeModule('biconnector'))
{
	$errorReason = 'superset_unavailable';
}

if ($errorReason === null)
{
	// Template dir is .default; the component selects the `mobile` PAGE (mobile.php) itself via
	// includeComponentTemplate('mobile') because IS_MOBILE is set - same pattern as the `startup` page.
	$APPLICATION->IncludeComponent(
		'bitrix:biconnector.apachesuperset.dashboard.detail',
		'',
		[
			'DASHBOARD_ID' => $dashboardId,
			'IS_MOBILE' => true,
		],
	);
}
else
{
	?>
	<script>
		(function() {
			const reason = <?= Json::encode($errorReason) ?>;
			const send = () => window.BXNativeBridge?.sendEvent?.('ERROR', { reason });
			document.addEventListener('BXNativeBridgeReady', send, { once: true });
			if (window.BX && BX.ready)
			{
				BX.ready(send);
			}
		})();
	</script>
	<?php
}

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');
