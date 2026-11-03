<?php

/**
 * Router for the tariff pages of the bitrix24 module.
 *
 * The pages themselves live in bitrix24/public/settings/order/. The app cannot request them
 * there: /settings/ is outside MobileApplication's scope (mobile/classes/general/mobile_event.php)
 * and the check runs against SCRIPT_NAME, so requiring them from this path keeps the scope intact.
 */

$page = match ((string)($_GET['mode'] ?? 'license_all_mobile')) {
	'license_all_mobile' => '/settings/order/license_all_mobile.php',
	'mobile_checkout_bridge' => '/settings/order/mobile.php',
	default => null,
};

if ($page === null) {
	http_response_code(404);
	exit;
}

unset($_GET['mode'], $_REQUEST['mode']);

require $_SERVER['DOCUMENT_ROOT'] . $page;
