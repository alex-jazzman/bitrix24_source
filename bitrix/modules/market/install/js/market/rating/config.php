<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/rating.bundle.css',
	'js' => 'dist/rating.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.ears',
		'ui.design-tokens',
		'ui.vue3',
		'market.rating-review',
	],
	'skip_core' => true,
];
