<?php

use Bitrix\Tasks\Flow\FlowFeature;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$isFeatureTriable = FlowFeature::isFeatureEnabledByTrial();

return [
	'css' => 'dist/flow.bundle.css',
	'js' => 'dist/flow.bundle.js',
	'rel' => [
		'main.sidepanel',
		'ui.system.menu.vue',
		'tasks.v2.component.elements.hover-pill',
		'tasks.v2.component.elements.field-add',
		'main.core',
		'tasks.v2.core',
		'tasks.v2.lib.entity-selector-dialog',
		'tasks.v2.provider.service.group-service',
		'ui.system.chip.vue',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'tasks.v2.const',
		'tasks.v2.lib.field-highlighter',
		'tasks.v2.provider.service.flow-service',
		'tasks.v2.provider.service.task-service',
	],
	'skip_core' => false,
	'settings' => [
		'isFeatureTriable' => $isFeatureTriable,
	],
];
