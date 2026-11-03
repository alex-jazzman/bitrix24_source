<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => [
		'dist/deliveryselector.bundle.css',
	],
	'js' => 'dist/deliveryselector.bundle.js',
	'rel' => [
		'currency',
		'location.core',
		'location.widget',
		'main.core',
		'main.popup',
		'salescenter.component.stage-block.hint',
		'salescenter.manager',
		'ui.design-tokens',
		'ui.ears',
		'ui.fonts.opensans',
		'ui.notification',
		'ui.vue',
	],
	'skip_core' => false,
];