<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/massconnect-notification.bundle.css',
	'js' => 'dist/massconnect-notification.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.banner-dispatcher',
	],
	'skip_core' => false,
];
