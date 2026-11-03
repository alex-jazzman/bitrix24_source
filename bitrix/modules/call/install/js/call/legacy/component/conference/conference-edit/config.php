<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/conference-edit.bundle.css',
	'js' => 'dist/conference-edit.bundle.js',
	'rel' => [
		'calendar.planner',
		'calendar.util',
		'call.const',
		'im.lib.clipboard',
		'im.lib.logger',
		'main.core',
		'main.core.events',
		'ui.entity-selector',
		'ui.vue',
		'ui.vue.components.hint',
	],
	'skip_core' => false,
];