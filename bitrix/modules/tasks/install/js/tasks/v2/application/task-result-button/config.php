<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/task-result-button.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'tasks.v2.const',
		'tasks.v2.lib.api-client',
		'ui.icon-set.api.core',
		'ui.notification',
		'ui.system.chip.vue',
		'ui.vue3',
		'ui.vue3.mixins.loc-mixin',
	],
	'skip_core' => false,
];
