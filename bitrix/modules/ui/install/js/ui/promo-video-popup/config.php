<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/promo-video-popup.bundle.css',
	'js' => 'dist/promo-video-popup.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.buttons',
		'ui.icon-set.api.core',
		'ui.icon-set.main',
	],
	'skip_core' => false,
];