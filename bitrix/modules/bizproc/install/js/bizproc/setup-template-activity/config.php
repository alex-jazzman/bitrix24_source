<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/setup-template-activity.bundle.css',
	'js' => 'dist/setup-template-activity.bundle.js',
	'rel' => [
		'bizproc.setup-template',
		'main.core',
		'main.core.events',
		'main.sidepanel',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.system.menu.vue',
		'ui.vue3',
		'ui.vue3.components.button',
	],
	'skip_core' => false,
];
