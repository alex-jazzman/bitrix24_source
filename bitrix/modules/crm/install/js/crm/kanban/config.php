<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => [
		'css/kanban.css',
	],
	'js' => [
		'dist/kanban.js',
	],
	'lang' => '/bitrix/modules/crm/kanban.php',
	'rel' => [
		'crm.activity.adding-popup',
		'crm.autorun',
		'crm.badge',
		'crm.dialog',
		'crm.integration.analytics',
		'crm.kanban.restriction',
		'crm.kanban.sort',
		'crm.toolbar-component',
		'crm_activity_planner',
		'currency.currency-core',
		'ls',
		'main.core',
		'main.date',
		'main.kanban',
		'main.loader',
		'main.popup',
		'main.sidepanel',
		'pull.queuemanager',
		'ui.analytics',
		'ui.buttons',
		'ui.design-tokens',
		'ui.entity-selector',
		'ui.fonts.opensans',
		'ui.hint',
		'ui.notification',
		'ui.system.label',
		'ui.tour',
	],
	'skip_core' => false,
];
