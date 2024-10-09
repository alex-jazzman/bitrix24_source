<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/widgetvue.bundle.css',
	'js' => 'dist/widgetvue.bundle.js',
	'rel' => [
		'main.core.events',
		'main.loader',
		'ui.vue3',
		'landing.backend',
		'main.core',
	],
	'skip_core' => false,
];