<?php

use Bitrix\Main\Loader;
use Bitrix\Landing;
use Bitrix\Landing\Site\Type;

/** @var array $arParams */
/** @var array $arResult */
/** @var \CMain $APPLICATION */
/** @var \CBitrixComponent $component */

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!Loader::includeModule('landing'))
{
	LocalRedirect('/');
}

$APPLICATION->IncludeComponent(
	'bitrix:landing.start',
	'.default',
	[
		'COMPONENT_TEMPLATE' => '.default',
		'SEF_FOLDER' => Landing\Vibe\Integration\Intranet\Page::getSefFolder(),
		'STRICT_TYPE' => 'Y',
		'SEF_MODE' => 'Y',
		'TYPE' => Type::SCOPE_CODE_VIBE,
		'DRAFT_MODE' => 'Y',
		'EDIT_FULL_PUBLICATION' => 'Y',
		'EDIT_PANEL_LIGHT_MODE' => 'Y',
		'EDIT_DONT_LEAVE_FRAME' => 'Y',
		'SEF_URL_TEMPLATES' => Landing\Vibe\Integration\Intranet\Page::getSefTemplates(),
	],
	false
);

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');
