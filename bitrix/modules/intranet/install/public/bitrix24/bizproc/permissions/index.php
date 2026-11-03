<?php

use Bitrix\Bizproc\Integration\Intranet\ToolsManager;
use Bitrix\Bizproc\Public\Service\TemplateAccessService;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Loader;

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');

// TemplateAccessService ships together with the rights page: an older bizproc has neither
$isPageAvailable =
	Loader::includeModule('bizproc')
	&& Option::get('bizproc', 'designer_v2', 'N') === 'Y'
	&& class_exists(TemplateAccessService::class)
	&& class_exists(ToolsManager::class)
	&& ToolsManager::getInstance()->isBizprocAvailable()
;

if (!$isPageAvailable)
{
	LocalRedirect('/');
}

global $APPLICATION;
$APPLICATION->IncludeComponent(
	'bitrix:ui.sidepanel.wrapper',
	'',
	[
		'POPUP_COMPONENT_NAME' => 'bitrix:bizproc.config.permissions',
		'POPUP_COMPONENT_TEMPLATE_NAME' => '.default',
		'POPUP_COMPONENT_PARAMS' => [],
		'USE_UI_TOOLBAR' => 'Y',
		'USE_PADDING' => false,
		'PLAIN_VIEW' => false,
		'PAGE_MODE' => false,
		'PAGE_MODE_OFF_BACK_URL' => '/bizproc/userprocesses/',
	],
);

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');

