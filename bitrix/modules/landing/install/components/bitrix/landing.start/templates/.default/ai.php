<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true)
{
	die();
}

use \Bitrix\Main\Localization\Loc;
Loc::loadMessages(__FILE__);
?>

<?$APPLICATION->IncludeComponent(
	'bitrix:landing.site_copilot',
	'.default',
	array(
		'TYPE' => $arParams['TYPE'],
		'PAGE_URL_SITES' => $arParams['PAGE_URL_SITES'],
	),
	$component
);?>
