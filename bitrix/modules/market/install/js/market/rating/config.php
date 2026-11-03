<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/rating.bundle.css',
	'js' => 'dist/rating.bundle.js',
	'rel' => [
		'main.core',
		'market.rating-review',
		'ui.design-tokens',
		'ui.ears',
		'ui.vue3',
	],
	'skip_core' => false,
];
