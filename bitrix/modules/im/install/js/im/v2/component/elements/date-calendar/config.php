<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/date-calendar.bundle.js',
	'rel' => [
		'im.v2.provider.service.date-navigation',
		'main.core',
		'ui.buttons',
		'ui.date-picker',
	],
	'skip_core' => false,
];
