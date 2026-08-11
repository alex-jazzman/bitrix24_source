<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/helpdesk.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.lib.helpdesk',
	],
	'skip_core' => true,
];
