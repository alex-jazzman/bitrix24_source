<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/setup-template-activity.bundle.css',
	'js' => 'dist/setup-template-activity.bundle.js',
	'rel' => [
		'main.sidepanel',
		'ui.vue3',
		'main.core.events',
		'main.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.api.core',
		'ui.system.menu.vue',
		'ui.vue3.components.button',
		'bizproc.setup-template',
	],
	'skip_core' => false,
];
