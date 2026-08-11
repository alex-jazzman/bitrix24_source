<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/public-v2.bundle.css',
	'js' => 'dist/public-v2.bundle.js',
	'rel' => [
		'calendar.util',
		'main.core',
		'main.core.events',
		'main.date',
		'main.popup',
		'ui.avatar',
		'ui.bottomsheet',
		'ui.design-tokens',
		'ui.icon-set.actions',
		'ui.icons.b24',
	],
	'skip_core' => false,
];
