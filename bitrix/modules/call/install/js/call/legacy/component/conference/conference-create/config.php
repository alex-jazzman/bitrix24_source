<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/conference-create.bundle.css',
	'js' => 'dist/conference-create.bundle.js',
	'rel' => [
		'im.lib.clipboard',
		'im.lib.logger',
		'main.core',
		'ui.design-tokens',
		'ui.fonts.opensans',
		'ui.vue',
		'ui.vue.components.hint',
	],
	'skip_core' => false,
];