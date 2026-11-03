<?php

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Page\Asset;

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_before.php');

Loc::loadMessages(__DIR__ . '/component.php');
$APPLICATION->SetTitle((string)Loc::getMessage('CRM_FIELDS_ENTITY_LIST'));

Asset::getInstance()->addCss('/bitrix/js/crm/css/crm.css');
Asset::getInstance()->addCss('/bitrix/themes/.default/crm-entity-show.css');

$APPLICATION->IncludeComponent(
	'bitrix:ui.sidepanel.wrapper',
	'',
	[
		'POPUP_COMPONENT_NAME' => 'bitrix:crm.config.status',
		'POPUP_COMPONENT_TEMPLATE_NAME' => '',
		'POPUP_COMPONENT_PARAMS' => [
			'ENABLE_CONTROL_PANEL' => false,
		],
		'USE_UI_TOOLBAR' => 'Y',
	],
);
