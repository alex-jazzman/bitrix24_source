<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;

/** @var \CMain $APPLICATION */
/** @var array $arResult */

// The slider takes its accessible name from the title of the page it holds, and without one the screen
// opens as a nameless dialog.
$APPLICATION->SetTitle(Loc::getMessage('MAIL_CLIENT_SCHEDULED_VIEW_TITLE'));

$APPLICATION->IncludeComponent('bitrix:ui.sidepanel.wrapper', '', [
	'POPUP_COMPONENT_NAME' => 'bitrix:mail.client.scheduled.view',
	'POPUP_COMPONENT_PARAMS' => $arResult,
	'USE_PADDING' => false,
	'HIDE_TOOLBAR' => true,
	'PLAIN_VIEW' => true,
	'PAGE_MODE' => false,
	'PAGE_MODE_OFF_BACK_URL' => '/mail/',
]);
