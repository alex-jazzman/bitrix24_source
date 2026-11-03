<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/date-navigation.bundle.js',
	'rel' => [
		'im.v2.const',
		'im.v2.lib.rest',
		'main.core',
		'main.date',
	],
	'skip_core' => false,
];
