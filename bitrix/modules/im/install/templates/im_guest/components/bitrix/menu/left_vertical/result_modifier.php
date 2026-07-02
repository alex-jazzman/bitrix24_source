<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

// Take raw menu items from bitrix:menu component
$menuItems = $arResult;

// Load counter values for current user
$counters = \CUserCounter::GetValues($GLOBALS['USER']->GetID(), SITE_ID);
$counters = is_array($counters) ? $counters : [];

// Build simplified result — all items visible, no hide section
$showItems = [];
foreach ($menuItems as $item)
{
	if (!isset($item['PARAMS']['menu_item_id']))
	{
		continue;
	}

	$showItems[] = $item;
}

$arResult = [
	'ITEMS' => [
		'show' => $showItems,
	],
	'COUNTERS' => $counters,
];
