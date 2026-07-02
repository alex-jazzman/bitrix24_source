<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/field.bundle.css',
	'js' => 'dist/field.bundle.js',
	'lang' => '/bitrix/modules/main/date_format.php',
	'rel' => [
		'booking.component.mixin.loc-mixin',
		'booking.const',
		'booking.lib.segments',
		'booking.lib.slot-ranges',
		'main.core',
		'main.date',
		'main.loader',
		'ui.date-picker',
	],
	'skip_core' => false,
	'options' => [
		'webpacker' => [
			'useAllLangs' => true,
		],
	],
];
