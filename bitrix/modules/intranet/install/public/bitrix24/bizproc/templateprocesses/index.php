<?php

use Bitrix\Bizproc\Integration\Intranet\ToolsManager;
use Bitrix\Main\Application;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Loader;

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');

if (
	Loader::includeModule('bizproc')
	&& class_exists(ToolsManager::class)
	&& (
		!ToolsManager::getInstance()->isBizprocAvailable()
		|| Option::get('bizproc', 'designer_v2', 'N') !== 'Y'
	)
)
{
	LocalRedirect('/');
}

global $APPLICATION;

$request = Application::getInstance()->getContext()->getRequest();

if ($request->get('IFRAME') === 'Y' && $request->get('IFRAME_TYPE') === 'SIDE_SLIDER')
{
	$APPLICATION->IncludeComponent(
		'bitrix:ui.sidepanel.wrapper',
		'',
		[
			'USE_UI_TOOLBAR' => 'Y',
			'POPUP_COMPONENT_NAME' => 'bitrix:bizproc.template.processes',
			'POPUP_COMPONENT_TEMPLATE_NAME' => '',
			'POPUP_COMPONENT_PARAMS' => [],
			'POPUP_COMPONENT_USE_BITRIX24_THEME' => 'Y',
		],
	);
}
else
{
	$APPLICATION->IncludeComponent(
		'bitrix:bizproc.template.processes',
		'.default',
		[],
	);
}

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');