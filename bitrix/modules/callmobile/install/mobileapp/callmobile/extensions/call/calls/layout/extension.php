<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;

Loc::loadMessages(__DIR__ . '/lang/' . LANGUAGE_ID . '/extension.php');

$copilotName = 'CoPilot';
if (Loader::includeModule('call'))
{
	$copilotName = \Bitrix\Call\Integration\AI\CallAISettings::getCopilotName();
}

$replace = ['#COPILOT_NAME#' => $copilotName];

return [
	'PHRASES' => [
		'MOBILE_CALL_COPILOT_TITLE_MSGVER_1' => Loc::getMessage('MOBILE_CALL_COPILOT_TITLE_MSGVER_1', $replace),
		'MOBILE_CALL_COPILOT_MESSAGE_MSGVER_1' => Loc::getMessage('MOBILE_CALL_COPILOT_MESSAGE_MSGVER_1', $replace),
		'MOBILE_CALL_COPILOT_DRAWER_TITLE_MSGVER_1' => Loc::getMessage('MOBILE_CALL_COPILOT_DRAWER_TITLE_MSGVER_1', $replace),
		'MOBILE_CALL_COPILOT_DRAWER_MESSAGE_MSGVER_1' => Loc::getMessage('MOBILE_CALL_COPILOT_DRAWER_MESSAGE_MSGVER_1', $replace),
	],
];
