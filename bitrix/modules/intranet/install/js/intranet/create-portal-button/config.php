<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

global $APPLICATION;
$APPLICATION->SetPageProperty('HeaderClass', 'intranet-header--with-controls');

return [
	'css' => 'dist/create-portal-button.bundle.css',
	'js' => 'dist/create-portal-button.bundle.js',
	'rel' => [
		'main.core',
		'main.core.cache',
		'ui.buttons',
	],
	'skip_core' => false,
];
