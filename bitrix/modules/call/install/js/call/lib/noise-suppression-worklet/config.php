<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./src/noise-suppression-worklet.js',
	],
	'rel' => [
		'main.polyfill.core',
	],
	'skip_core' => true,
];