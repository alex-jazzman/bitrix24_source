<?php

use Bitrix\Main\Loader;
use Bitrix\Landing\Mainpage\Manager;
use Bitrix\Landing\Site\Type;
use Bitrix\Intranet\MainPage;

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!CModule::IncludeModule('landing'))
{
	return;
}

/** @var array $arParams */
/** @var array $arResult */
/** @var \CMain $APPLICATION */
/** @var \CBitrixComponent $component */

$request = \Bitrix\Main\HttpContext::getCurrent()->getRequest();

$arParams['PAGE_URL_SITE_EDIT'] = str_replace(
	'#site_edit#',
	0,
	$arParams['PAGE_URL_SITE_EDIT']
);

if (
	!Loader::includeModule('landing')
	|| !(new MainPage\Access())->canEdit()
)
{
	ShowError('Can`t Vibing');

	return;
}

$template = $request->get('tpl');
$notRedirectToEdit = ($request->get('no_redirect') === 'Y') ? 'Y' : 'N';
if ($template)
{
	$manager = new Manager();
	if ($manager->getConnectedSiteId())
	{
		$APPLICATION->includeComponent(
			'bitrix:ui.sidepanel.wrapper',
			'',
			[
				'POPUP_COMPONENT_NAME' => 'bitrix:landing.demo_preview',
				'POPUP_COMPONENT_TEMPLATE_NAME' => '.default',
				'POPUP_COMPONENT_PARAMS' => [
					'CODE' => $template,
					'TYPE' => Type::SCOPE_CODE_MAINPAGE,
					'SITE_ID' => $manager->getConnectedSiteId(),
					'DISABLE_REDIRECT' => $notRedirectToEdit,
					'DONT_LEAVE_FRAME' => 'N',
				],
				'USE_PADDING' => false,
				'PLAIN_VIEW' => true,
				'PAGE_MODE' => false,
				'CLOSE_AFTER_SAVE' => false,
				'RELOAD_GRID_AFTER_SAVE' => false,
				'RELOAD_PAGE_AFTER_SAVE' => true,
			]
		);
	}
}
else
{
	ShowError('Template not found');
}
?>
