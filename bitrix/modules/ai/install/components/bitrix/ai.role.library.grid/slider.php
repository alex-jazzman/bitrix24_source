<?php

require_once ($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/include/prolog_before.php");

/** @var CMain $APPLICATION */
/** @var array $arResult */
/** @var array $arParams */

global $APPLICATION;

use Bitrix\AI\Container;
use Bitrix\AI\Services\CopilotAccessCheckerService;
use Bitrix\Main\Application;

if (\Bitrix\Main\Loader::includeModule('ai'))
{
	/** @var CopilotAccessCheckerService $copilotAccessCheckerService */
	$copilotAccessCheckerService = Container::init()->getItem(CopilotAccessCheckerService::class);
	$userId = Bitrix\AI\Facade\User::getCurrentUserId();

	if (!$copilotAccessCheckerService->canShowLibrariesInFrontend($userId))
	{
		Application::getInstance()->end();
	}
}

$APPLICATION->IncludeComponent(
	'bitrix:ui.sidepanel.wrapper',
	'',
	array(
		'POPUP_COMPONENT_NAME' => 'bitrix:ai.role.library.grid',
		'POPUP_COMPONENT_TEMPLATE_NAME' => '.default',
		'POPUP_COMPONENT_PARAMS' => [],
		"USE_UI_TOOLBAR" => "Y",
		"CUSTOM_BACKGROUND_STYLE" => 'top left / cover no-repeat url(/bitrix/components/bitrix/ai.role.library/templates/.default/images/background.jpg)',
	)
);

