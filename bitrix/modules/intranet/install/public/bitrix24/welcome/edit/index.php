<?php

use Bitrix\Landing\Site\Type;
use Bitrix\Main\Loader;
use Bitrix\Landing;

/** @var array $arParams */
/** @var array $arResult */
/** @var \CMain $APPLICATION */
/** @var \CBitrixComponent $component */

$isSlider = isset($_REQUEST['IFRAME']) && $_REQUEST['IFRAME'] === 'Y';
if ($isSlider)
{
	define('SITE_TEMPLATE_ID', 'landing24');
}

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
?>

<?php require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php'); ?>
