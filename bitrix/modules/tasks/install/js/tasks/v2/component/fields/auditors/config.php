<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/auditors.bundle.js',
	'rel' => [
		'main.core',
		'tasks.v2.component.elements.participants',
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.lib.analytics',
		'tasks.v2.lib.field-highlighter',
		'tasks.v2.lib.id-utils',
		'tasks.v2.lib.show-limit',
		'tasks.v2.lib.user-selector-dialog',
		'tasks.v2.provider.service.task-service',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.chip.vue',
	],
	'skip_core' => false,
];
