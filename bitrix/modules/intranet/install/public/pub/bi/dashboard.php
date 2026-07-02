<?php

define('SKIP_TEMPLATE_AUTH_ERROR', true);
define('NOT_CHECK_PERMISSIONS', true);
define('SKIP_TEMPLATE_WRAPPER', true);
define('BX_PULL_SKIP_INIT', true);

require_once($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/include/prolog_before.php');

if (\Bitrix\Main\Loader::includeModule('biconnector'))
{
	$zone = \Bitrix\BIConnector\Integration\Superset\CultureFormatter::getLanguageCode();
}
else
{
	$iterator = Bitrix\Main\Localization\LanguageTable::getList([
		'select' => ['ID'],
		'filter' => [
			'=DEF' => 'Y',
			'=ACTIVE' => 'Y'
		]
	]);
	$row = $iterator->fetch();
	$zone = $row['ID'];
}

\Bitrix\Main\Localization\Loc::setCurrentLang($zone);

require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_after.php");

global $APPLICATION;

$APPLICATION->AddHeadString('<meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">');

if (\Bitrix\Main\Loader::includeModule('biconnector'))
{
	$APPLICATION->IncludeComponent(
		'bitrix:biconnector.apachesuperset.dashboard.share',
		'',
		[
			'TOKEN' => $_REQUEST['hash'] ?? '',
		],
	);
}

require_once($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/include/epilog_after.php');
