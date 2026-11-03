<?php

use Bitrix\BIConnector\Internal\Integration\AiAssistant\AiAgentsSection;
use Bitrix\Iblock\Component\Tools;
use Bitrix\Main\Loader;

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');
global $APPLICATION;

// The class check keeps the page safe on a portal whose biconnector is older than this file: the module loads,
// but the section code is not there yet, and without the section there is no page.
if (
	!Loader::includeModule('biconnector')
	|| !class_exists(AiAgentsSection::class)
	|| !AiAgentsSection::isAvailable()
)
{
	Tools::process404('', true, true, true);
}
else
{
	$APPLICATION->IncludeComponent(
		'bitrix:biconnector.ai.agents',
		'',
		[]
	);
}

require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');
