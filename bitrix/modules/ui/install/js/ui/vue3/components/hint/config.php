<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/hint.bundle.js',
	],
	'rel' => [
		'main.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.main',
		'ui.icon-set.outline',
		'ui.vue3.directives.hint',
	],
	'skip_core' => false,
];