<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

\Bitrix\Main\UI\Extension::load([
	'ui.icon-set.actions',
	'ui.icon-set.outline',
	'ui.icon-set.main',
]);

if (SITE_TEMPLATE_ID === "bitrix24")
{
	$bodyClass = $APPLICATION->GetPageProperty("BodyClass");
	$APPLICATION->SetPageProperty("BodyClass", ($bodyClass ? $bodyClass." " : "")."top-menu-mode");
}
