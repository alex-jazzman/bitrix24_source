<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\AI\Agreement;
use Bitrix\AI\Container;
use Bitrix\AI\Facade\User;
use Bitrix\AI\Facade\Bitrix24;
use Bitrix\AI\Services\CopilotAccessCheckerService;
use Bitrix\Main\Loader;
use Bitrix\Ui\Public\Services\Copilot\CopilotNameService;

$isShowAgreementPopup = false;
$isRestrictByEula = false;
$userHasAccessToLibrary = false;
$isSupportResponseFormatting = true;
$copilotName = (new CopilotNameService())->getCopilotName();

if (Loader::includeModule('ai'))
{
	$userId = User::getCurrentUserId();

	if (Bitrix24::shouldUseB24() === false)
	{
		$isShowAgreementPopup = !Agreement::get('AI_BOX_AGREEMENT')->isAcceptedByUser($userId);
	}

	if (Bitrix24::isFeatureEnabled('ai_available_by_version') === false)
	{
		$isRestrictByEula = true;
	}

	$copilotAccessCheckerService = Container::init()->getItem(CopilotAccessCheckerService::class);
	$userHasAccessToLibrary = $copilotAccessCheckerService->canShowLibrariesInFrontend($userId);
}

return [
	'css' => 'dist/copilot.bundle.css',
	'js' => 'dist/copilot.bundle.js',
	'rel' => [
		'ai.ajax-error-handler',
		'ai.copilot',
		'ai.copilot.copilot-text-controller',
		'ai.engine',
		'ai.speech-converter',
		'main.core',
		'main.core.events',
		'main.loader',
		'main.popup',
		'ui.design-tokens',
		'ui.feedback.form',
		'ui.hint',
		'ui.icon-set.actions',
		'ui.icon-set.api.core',
		'ui.icon-set.crm',
		'ui.icon-set.editor',
		'ui.icon-set.main',
		'ui.label',
		'ui.lottie',
	],
	'skip_core' => false,
	'settings' => [
		'isRestrictByEula' => $isRestrictByEula,
		'isShowAgreementPopup' => $isShowAgreementPopup,
		'isLibraryVisible' => $userHasAccessToLibrary,
		'copilotName' => $copilotName,
		'isSupportResponseFormatting' => $isSupportResponseFormatting
	]
];
