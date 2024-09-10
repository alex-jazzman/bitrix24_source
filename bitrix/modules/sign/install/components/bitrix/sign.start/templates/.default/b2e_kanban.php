<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;

/** @var SignStartComponent $component */
$component->setMenuIndex('sign_b2e_kanban');

/** @var CMain $APPLICATION */
/** @var array $arParams */

$APPLICATION->IncludeComponent(
	'bitrix:ui.sidepanel.wrapper',
	'',
	[
		'POPUP_COMPONENT_NAME' => 'bitrix:sign.b2e.kanban',
		'POPUP_COMPONENT_PARAMS' => [],
		'USE_UI_TOOLBAR' => 'Y',
	],
	$this->getComponent(),
);

$APPLICATION->setTitle(Loc::getMessage('SIGN_CMP_START_TPL_DOCS_TITLE_B2E'));
