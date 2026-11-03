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

$sidePanelBindingsEvent = new \Bitrix\Intranet\Public\Event\OnCollectSidePanelBindingsEvent();
$sidePanelBindingsEvent->send();

$rel = array_values(array_unique([...$rel, ...$sidePanelBindingsEvent->getExtensions()]));

return [
	'js' => '/bitrix/js/intranet/sidepanel/bindings/bindings.js',
	'css' => '/bitrix/js/intranet/sidepanel/bindings/mask.css',
	'rel' => $rel,
	'oninit' => function() {
		return [
			'settings' => [
				// The method appears in a later aiassistant release, so either module may ship first.
				'mcpTokenManagementEnabled' => (
					\Bitrix\Main\Loader::includeModule('aiassistant')
					&& method_exists(\Bitrix\AiAssistant\Config\Feature::class, 'isMcpConnectionsPageEnabled')
					&& \Bitrix\AiAssistant\Config\Feature::getInstance()->isMcpConnectionsPageEnabled()
				),
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
