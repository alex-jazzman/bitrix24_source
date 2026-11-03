<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var SignStartComponent $component */
/** @var array $arParams */
/** @var CMain $APPLICATION */

// the tab is a view of the personnel documents, so the section keeps its place in the left menu
$component->setMenuIndex('sign_b2e_kanban');

$APPLICATION->IncludeComponent(
	'bitrix:ui.sidepanel.wrapper',
	'',
	[
		'POPUP_COMPONENT_NAME' => 'bitrix:sign.b2e.process.list',
		'POPUP_COMPONENT_PARAMS' => [
			'CREATE_PROCESS_URL' => $component->getCreateProcessUrl(),
			'PROCESS_CATALOG_URL' => $arParams['PAGE_URL_B2E_PROCESS_CATALOG'] ?? '',
		],
		'USE_UI_TOOLBAR' => 'Y',
	],
	$this->getComponent(),
);
