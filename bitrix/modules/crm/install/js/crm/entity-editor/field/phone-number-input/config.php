<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/phone-number-input.bundle.css',
	'js' => 'dist/phone-number-input.bundle.js',
	'rel' => [
		'crm.entity-selector',
		'main.core',
		'phone_number',
		'ui.design-tokens',
	],
	'skip_core' => false,
];
