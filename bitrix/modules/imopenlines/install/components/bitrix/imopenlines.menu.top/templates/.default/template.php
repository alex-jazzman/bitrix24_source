<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

$defaultMenuTarget =  'above_pagetitle';

if(SITE_TEMPLATE_ID === 'bitrix24')
{
	$this->SetViewTarget($defaultMenuTarget, 200);
}

$APPLICATION->IncludeComponent(
	'bitrix:main.interface.buttons',
	'',
	[
		'ID' => $arResult['MENU_ID'],
		'ITEMS' => $arResult['ITEMS'],
		'THEME' => defined('AIR_SITE_TEMPLATE') ? 'air' : null,
	],
	$component,
	['HIDE_ICONS' => true]
);

if(SITE_TEMPLATE_ID === 'bitrix24')
{
	$this->EndViewTarget();
}
?>
