<?php

use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Loader;
use Bitrix\Tasks\V2\Internal\DI\Container;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!Loader::includeModule('tasks'))
{
	return [];
}

$configService = Container::getInstance()->getConfigService();
$userId = (int)CurrentUser::get()->getId();

return [
	'css' => 'dist/task-card.bundle.css',
	'js' => 'dist/task-card.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.system.skeleton',
		'tasks.v2.lib.id-utils',
	],
	'settings' => $configService->getTaskCardSettings($userId),
	'skip_core' => false,
];
