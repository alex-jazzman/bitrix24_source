<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/relink-superset-popup.bundle.js',
	'rel' => [
		'biconnector.card-select-popup',
		'biconnector.error-message',
		'main.core',
		'ui.notification',
	],
	'skip_core' => false,
];
