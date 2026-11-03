<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var SignStartComponent $component */
/** @var CMain $APPLICATION */

$APPLICATION->IncludeComponent(
	'bitrix:ui.sidepanel.wrapper',
	'',
	[
		'POPUP_COMPONENT_NAME' => 'bitrix:sign.b2e.process.catalog',
		'POPUP_COMPONENT_PARAMS' => [
			'CREATE_PROCESS_URL' => $component->getCreateProcessUrl(),
		],
		'USE_UI_TOOLBAR' => 'Y',
	],
	$this->getComponent(),
);
