<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\AI\Container;
use Bitrix\AI\Facade\User;
use Bitrix\AI\Services\CopilotAccessCheckerService;
use Bitrix\AiAssistant\Config\Feature;
use Bitrix\Main\Loader;
use Bitrix\Ui\Public\Services\Copilot\CopilotNameService;

$copilotName = (new CopilotNameService())->getCopilotName();
if (Loader::includeModule('ai'))
{
	$copilotAccessCheckerService = Container::init()->getItem(CopilotAccessCheckerService::class);
	$userHasAccessToLibrary = $copilotAccessCheckerService->canShowLibrariesInFrontend(User::getCurrentUserId());
	$isBitrixGptV2Available = Loader::includeModule('aiassistant')
		&& Feature::getInstance()->isBitrixGptV2Available();
}

return [
	'css' => 'dist/roles-dialog.bundle.css',
	'js' => 'dist/roles-dialog.bundle.js',
	'rel' => [
		'ai.engine',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.icon-set.animated',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.label',
		'ui.notification',
		'ui.vue3.components.hint',
		'ui.vue3.pinia',
	],
	'skip_core' => false,
	'settings' => [
		'isLibraryVisible' => $userHasAccessToLibrary ?? false,
		'copilotName' => $copilotName,
		'isBitrixGptV2Available' => $isBitrixGptV2Available ?? false,
	]
];
