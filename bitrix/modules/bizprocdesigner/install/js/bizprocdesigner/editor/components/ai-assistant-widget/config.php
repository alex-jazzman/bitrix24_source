<?php

use Bitrix\AiAssistant\Trigger\Service\RunnerService;
use Bitrix\AiAssistant\Widget\Service\HintService;
use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Engine\CurrentUser;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$settings = [];
$userId = CurrentUser::get()->getId();
if (CModule::IncludeModule('aiassistant') && $userId)
{
	$url = \Bitrix\Main\Application::getInstance()->getContext()->getRequest()->getRequestUri();
	ServiceLocator::getInstance()->get(RunnerService::class)?->registerBackgroundTriggerActivation($url);
	$martaParams = ServiceLocator::getInstance()->get(HintService::class)->init($userId);
	$sessionHint = $martaParams['hint'] ?? null;
	if ($sessionHint)
	{
		$sessionHint['url'] = $url;
	}
	$settings['params'] = [
		'botId' => (string)$martaParams['botId'],
		'botAvatarUrl' => $martaParams['botAvatarUrl'],
		'moduleName' => 'bizprocdesigner',
		'currentUrl' => $url,
		'params' => $sessionHint,
	];
}

return [
	'css' => 'dist/ai-assistant-widget.bundle.css',
	'js' => 'dist/ai-assistant-widget.bundle.js',
	'rel' => [
		'main.core',
	],
	'skip_core' => false,
	'settings' => $settings,
];
