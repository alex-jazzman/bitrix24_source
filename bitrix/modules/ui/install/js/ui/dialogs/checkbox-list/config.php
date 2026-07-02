<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/bundle.css',
	'js' => 'dist/bundle.js',
	'rel' => [
		'checkbox-list.css',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.design-tokens',
		'ui.forms',
		'ui.switcher',
		'ui.vue3',
	],
	'skip_core' => false,
];