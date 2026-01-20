<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/gantt-popup.bundle.css',
	'js' => 'dist/gantt-popup.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'main.popup',
		'ui.vue3',
		'ui.vue3.mixins.loc-mixin',
		'tasks.v2.core',
		'ui.vue3.components.rich-loc',
		'ui.vue3.components.button',
		'ui.system.input.vue',
		'ui.system.typography.vue',
		'tasks.v2.const',
		'tasks.v2.lib.relation-error',
		'tasks.v2.lib.relation-tasks-dialog',
		'tasks.v2.provider.service.relation-service',
		'ui.system.menu.vue',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.vue3.components.popup',
	],
	'skip_core' => true,
];
