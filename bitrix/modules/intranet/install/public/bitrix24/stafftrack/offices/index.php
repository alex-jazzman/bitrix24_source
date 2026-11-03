<?php

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var CMain $APPLICATION */
/** @var CUser $USER */

global $APPLICATION, $USER;

$userId = (int)($USER?->GetID() ?? 0);
$isIntranetUser =
	$userId > 0
	&& \Bitrix\Main\Loader::includeModule('intranet')
	&& \Bitrix\Intranet\Util::isIntranetUser($userId)
;

$isPageAvailable =
	$isIntranetUser
	&& \Bitrix\Main\Loader::includeModule('stafftrack')
	&& class_exists(\Bitrix\StaffTrack\Public\Provider\OfficesAvailabilityProvider::class)
	&& (new \Bitrix\StaffTrack\Public\Provider\OfficesAvailabilityProvider())->isAvailable()
;

if (!$isPageAvailable)
{
	LocalRedirect(SITE_DIR);
}

$sectionUrl = (defined('SITE_DIR') ? SITE_DIR : '/') . 'company/';

$request = \Bitrix\Main\Context::getCurrent()->getRequest();
$focusOfficeId = $request->getQuery('office_id');
$focusRouteUserId = $request->getQuery('route_user_id');

$APPLICATION->IncludeComponent(
	'bitrix:ui.sidepanel.wrapper',
	'',
	[
		'POPUP_COMPONENT_NAME' => 'bitrix:stafftrack.offices',
		'POPUP_COMPONENT_TEMPLATE_NAME' => '.default',
		'POPUP_COMPONENT_PARAMS' => [
			'FOCUS_OFFICE_ID' => $focusOfficeId,
			'FOCUS_ROUTE_USER_ID' => $focusRouteUserId,
		],
		'USE_UI_TOOLBAR' => 'Y',
		'PAGE_MODE' => false,
		'PAGE_MODE_OFF_BACK_URL' => $sectionUrl,
	]
);

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');
