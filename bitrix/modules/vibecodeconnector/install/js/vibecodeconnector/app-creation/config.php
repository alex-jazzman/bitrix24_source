<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Loader;
use Bitrix\Vibecodeconnector\Internal\Service\Embed\EmbedCreateGuard;
use Bitrix\Vibecodeconnector\Internal\Service\Embed\EmbedCreateSettings;
use Bitrix\Vibecodeconnector\Internal\Service\Embed\EmbedView;
use Bitrix\Vibecodeconnector\Internal\Service\Endpoint\VibecodeUrlProvider;

$available = false;
$createInIframe = false;
$vibecodeUrl = '';
$fallbackUrl = '';

if (Loader::includeModule('vibecodeconnector'))
{
	$userId = (int)CurrentUser::get()->getId();

	$available = ServiceLocator::getInstance()->get(EmbedCreateGuard::class)
		->isAllowed(EmbedView::ApplicationCreate, $userId)
	;

	if ($available)
	{
		$createInIframe = (new EmbedCreateSettings())->isEnabled();
		$urlProvider = new VibecodeUrlProvider();
		$vibecodeUrl = $urlProvider->getEndpointUrl();
		$fallbackUrl = $urlProvider->getDashboardUrl($userId);
	}
}

return [
	'js' => './dist/app-creation.bundle.js',
	'rel' => [
		'main.core',
		'ui.analytics',
		'ui.notification',
		'vibecodeconnector.embed-create',
		'vibecodeconnector.open-app',
	],
	'skip_core' => false,
	'settings' => [
		'available' => $available,
		'createInIframe' => $createInIframe,
		'vibecodeUrl' => $vibecodeUrl,
		'fallbackUrl' => $fallbackUrl,
	],
];
