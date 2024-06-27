<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/timeline.bundle.css',
	'js' => 'dist/timeline.bundle.js',
	'rel' => [
		'rest.client',
		'ui.analytics',
		'main.date',
		'main.loader',
		'ui.vue3',
		'ui.buttons',
		'ui.hint',
		'crm.field.color-selector',
		'main.core.events',
		'ui.vue3.directives.hint',
		'main.popup',
		'ui.label',
		'ui.cnt',
		'ui.notification',
		'crm.timeline.item',
		'main.core',
		'crm.timeline.tools',
	],
	'skip_core' => false,
];
