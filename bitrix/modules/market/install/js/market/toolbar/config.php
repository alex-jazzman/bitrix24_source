<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/toolbar.bundle.css',
	'js' => 'dist/toolbar.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'market.market-links',
		'market.rating-stars',
		'ui.design-tokens',
		'ui.forms',
	],
	'skip_core' => false,
];