<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/rating-stars-input.bundle.css',
	'js' => 'dist/rating-stars-input.bundle.js',
	'rel' => [
		'main.core',
	],
	'skip_core' => false,
];
