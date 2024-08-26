<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/roles-dialog.bundle.css',
	'js' => 'dist/roles-dialog.bundle.js',
	'rel' => [
		'ai.engine',
		'main.popup',
		'main.core.events',
		'ui.vue3.components.hint',
		'main.core',
		'ui.vue3.pinia',
		'ui.label',
		'ui.icon-set.api.vue',
		'ui.icon-set.api.core',
	],
	'skip_core' => false,
];