<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Socialnetwork\V2\Internal\DI\Container;
use Bitrix\Socialnetwork\V2\Internal\Service\ProjectAnalytics;

if (!\Bitrix\Main\Loader::includeModule('socialnetwork'))
{
	return [];
}

$userId = (int)CurrentUser::get()->getId();
$hydration = Container::getInstance()->get(ProjectAnalytics::class)->getHydration($userId);

return [
	'js' => './dist/event-sender.bundle.js',
	'css' => './dist/event-sender.bundle.css',
	'rel' => [
		'main.core',
		'ui.analytics',
	],
	'skip_core' => false,
	'settings' => [
		'isDemo' => $hydration['isDemo'] ?? 'N',
		'userType' => $hydration['userType'] ?? '',
	],
];
