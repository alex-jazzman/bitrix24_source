<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

$rel = ['sidepanel'];

if (\Bitrix\Main\ModuleManager::isModuleInstalled('crm'))
{
	$rel[] = 'crm.sidepanel.bindings';
}

return [
	'js' => '/bitrix/js/intranet/sidepanel/bindings/bindings.js',
	'css' => '/bitrix/js/intranet/sidepanel/bindings/mask.css',
	'rel' => $rel,
	'oninit' => function() {
		return [
			'settings' => [
				'tasks' => [
					'isV2Form' => (
						\Bitrix\Main\Loader::includeModule('tasks')
						&& \Bitrix\Tasks\V2\FormV2Feature::isOn()
					),
					'allowedGroups' => \Bitrix\Main\Loader::includeModule('tasks')
						? \Bitrix\Tasks\V2\FormV2Feature::getAllowedGroups()
						: [],
					'isOldFormEnabled' => (
						\Bitrix\Main\Loader::includeModule('tasks')
						&& \Bitrix\Tasks\V2\FormV2Feature::isOn('old_form')
					),
				],
			],
		];
	},
];
