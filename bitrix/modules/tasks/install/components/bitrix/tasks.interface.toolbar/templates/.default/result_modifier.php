<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true) die();

// create template controller with js-dependency injections
$arResult['HELPER'] = $helper = require(__DIR__.'/helper.php');
$arParams =& $helper->getComponent()->arParams; // make $arParams the same variable as $this->__component->arParams, as it really should be

if($helper->checkHasFatals())
{
	return;
}

$arResult['TEMPLATE_DATA'] = [];
$arResult['JS_DATA'] = [
	'userId' => $arResult['USER_ID'] ?? null,
	'ownerId' => $arResult['OWNER_ID'] ?? null,
	'groupId' => $arParams['GROUP_ID'] ?? null,
	'filterId' => $arParams['FILTER_ID'] ?? null,
	'roleId' => $arResult['ROLE'] ?? null,
	'showCounters' => $arResult['SHOW_COUNTERS'] ?? null,
	'project_mode'	=> (isset($arParams['GROUP_ID']) && $arParams['GROUP_ID'] > 0),
];
