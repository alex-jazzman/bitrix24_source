<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/rating-review.bundle.css',
	'js' => 'dist/rating-review.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'main.popup',
		'market.rating-stars-input',
		'ui.vue3',
	],
	'skip_core' => true,
];
