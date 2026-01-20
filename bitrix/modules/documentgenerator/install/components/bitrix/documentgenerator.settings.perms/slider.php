<?php

use Bitrix\Main\Localization\Loc;

$siteId = '';
if (isset($_REQUEST['site_id']) && is_string($_REQUEST['site_id']))
{
	$siteId = mb_substr(preg_replace('/[^a-z0-9_]/i', '', $_REQUEST['site_id']), 0, 2);
}

if ($siteId)
{
	define('SITE_ID', $siteId);
}

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');

global $APPLICATION;

Loc::loadMessages(__DIR__ . '/class.php');
$APPLICATION->SetTitle(Loc::getMessage('DOCGEN_SETTINGS_PERMS_TITLE'));

$APPLICATION->IncludeComponent(
	'bitrix:ui.sidepanel.wrapper',
	'',
	[
		'POPUP_COMPONENT_NAME' => 'bitrix:documentgenerator.settings.perms',
		'POPUP_COMPONENT_TEMPLATE_NAME' => '',
		'POPUP_COMPONENT_PARAMS' => [],
		'USE_UI_TOOLBAR' => 'Y',
		'PAGE_MODE' => false,
		'USE_PADDING' => false,
	]
);

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');
