<?php

use Bitrix\Intranet\Integration\Templates\Air\CollaborationWebMenu;
use Bitrix\Intranet\Integration\Templates\Air\TopMenu;
use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$this->setFrameMode(true);

global $APPLICATION;

if (!is_array($arResult) || empty($arResult) || !Loader::includeModule('intranet'))
{
	return;
}

$items = TopMenu::convertFromFileMenu($arResult);
$menuId = 'top_panel_menu';

// hack for complex component (/company/personal/ pages)
$topMenuSectionDir = $APPLICATION->GetPageProperty('topMenuSectionDir');
if (!empty($topMenuSectionDir))
{
	$arParams['MENU_DIR'] = $topMenuSectionDir;
}

if (isset($arParams['MENU_DIR']) && !empty($arParams['MENU_DIR']))
{
	$menuId = str_replace('/', '_', trim($arParams['MENU_DIR'], '/'));
	$menuId = 'top_menu_id_' . $menuId;
}

$collaborationWebMenu = ($arParams['MENU_DIR'] ?? '') === SITE_DIR . 'collaboration/'
	? CollaborationWebMenu::getMenu('collaboration')
	: null;
if ($collaborationWebMenu !== null)
{
	$items = CollaborationWebMenu::applyActiveState(
		$collaborationWebMenu['ITEMS'],
		array_column($items, null, 'ID'),
	);
	$menuId = $collaborationWebMenu['ID'];
	?>
	<script>
		BX.message(<?= CUtil::PhpToJSObject($collaborationWebMenu['CLIENT_CONFIG']) ?>);
	</script>
	<?php
}

$APPLICATION->IncludeComponent(
	'bitrix:main.interface.buttons',
	'',
	[
		'ID' => $menuId,
		'ITEMS' => $items,
		'THEME' => 'air',
	],
);
