<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/timeline.bundle.css',
	'js' => 'dist/timeline.bundle.js',
	'rel' => [
		'ui.notification',
		'main.core.events',
		'currency',
		'pull.client',
		'ui.vue',
		'main.core',
	],
	'skip_core' => false,
];