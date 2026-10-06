<?php

use Bitrix\Crm\Service\Container;
use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$createTimeAliases = [];

if (Loader::includeModule('crm'))
{
	$container = Container::getInstance();
	$map = $container->getTypesMap();
	foreach ($map->getFactories() as $factory)
	{
		$createTimeAliases[$factory->getEntityTypeId()] =
			$factory->getEntityFieldNameByMap(\Bitrix\Crm\Item::FIELD_NAME_CREATED_TIME)
		;
	}
}

return [
	'css' => 'dist/settings-button-extender.bundle.css',
	'js' => 'dist/settings-button-extender.bundle.js',
	'rel' => [
		'crm.activity.todo-notification-skip-menu',
		'crm.activity.todo-ping-settings-menu',
		'crm.ai.name-service',
		'crm.kanban.restriction',
		'crm.kanban.sort',
		'main.core',
		'main.core.events',
		'main.popup',
	],
	'skip_core' => false,
	'settings' => [
		'createTimeAliases' => $createTimeAliases,
	],
];
