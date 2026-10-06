<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Grid\Component\ComponentParams;
use Bitrix\Main\UI\Extension;

$this->getComponent()->addTopPanel($this);
$this->getComponent()->addToolbar($this);

Extension::load([
	'crm.router',
	'main.core',
	'ui.icons',
	'ui.sidepanel',
	'ui.design-tokens',
	'ui.design-tokens.air',
	'ui.hint',
	'ui.tooltip',
	'ui.entity-selector',
]);

/** @var array $arResult */
global $APPLICATION;
$APPLICATION->SetTitle($arResult['TITLE']);

$APPLICATION->IncludeComponent(
	'bitrix:main.ui.grid',
	'',
	ComponentParams::get($arResult['GRID']),
);
