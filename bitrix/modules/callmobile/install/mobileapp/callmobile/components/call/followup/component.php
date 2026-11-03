<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;

Loc::loadMessages(__DIR__ . '/lang/' . LANGUAGE_ID . '/component.php');

$copilotName = 'CoPilot';
if (Loader::includeModule('call'))
{
	$copilotName = \Bitrix\Call\Integration\AI\CallAISettings::getCopilotName();
}

$replace = ['#COPILOT_NAME#' => $copilotName];

return [
	'PHRASES' => [
		'CALL_COMPONENT_EFFICIENCY_RECOMMENDATIONS_MSGVER_1' => Loc::getMessage('CALL_COMPONENT_EFFICIENCY_RECOMMENDATIONS_MSGVER_1', $replace),
		'CALL_COMPONENT_FOLLOWUP_AUDIO_TITLE_MSGVER_1' => Loc::getMessage('CALL_COMPONENT_FOLLOWUP_AUDIO_TITLE_MSGVER_1', $replace),
	],
];
