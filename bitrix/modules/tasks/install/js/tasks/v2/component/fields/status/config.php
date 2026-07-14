<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/status.bundle.css',
	'js' => 'dist/status.bundle.js',
	'rel' => [
		'main.core',
		'main.date',
		'tasks.v2.component.elements.hint',
		'tasks.v2.component.elements.hover-pill',
		'tasks.v2.const',
		'tasks.v2.lib.timezone',
		'tasks.v2.provider.service.status-service',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.menu.vue',
		'ui.vue3.directives.hint',
	],
	'skip_core' => false,
];
