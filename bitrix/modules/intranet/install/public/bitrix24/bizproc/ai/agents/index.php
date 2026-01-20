<?php

use Bitrix\Bizproc\Integration\Intranet\ToolsManager;

require($_SERVER["DOCUMENT_ROOT"] . "/bitrix/header.php");

if (
	\Bitrix\Main\Loader::includeModule('bizproc')
	&& Bitrix\Main\Config\Option::get('bizproc', 'feature_ai_agents', 'N') === 'N'
)
{
	localRedirect('/');
	return;
}

if (
	\Bitrix\Main\Loader::includeModule('bizproc')
	&& class_exists(ToolsManager::class)
	&& !ToolsManager::getInstance()->isBizprocAvailable()
)
{
	echo ToolsManager::getInstance()->getBizprocUnavailableContent();
}
else
{
	$APPLICATION->IncludeComponent(
		"bitrix:bizproc.ai.agents",
		"",
		[
		]
	);
}

require($_SERVER["DOCUMENT_ROOT"] . "/bitrix/footer.php");
