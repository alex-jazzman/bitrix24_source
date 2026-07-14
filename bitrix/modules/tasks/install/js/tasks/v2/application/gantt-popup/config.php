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
		'tasks.v2.const',
		'tasks.v2.core',
		'tasks.v2.lib.relation-error',
		'tasks.v2.lib.relation-tasks-dialog',
		'tasks.v2.provider.service.relation-service',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.input.vue',
		'ui.system.menu.vue',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.button',
		'ui.vue3.components.popup',
		'ui.vue3.components.rich-loc',
		'ui.vue3.mixins.loc-mixin',
	],
	'skip_core' => true,
];
