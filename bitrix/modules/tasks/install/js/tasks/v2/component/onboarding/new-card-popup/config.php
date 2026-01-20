<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/new-card-popup.bundle.css',
	'js' => 'dist/new-card-popup.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.buttons',
		'ui.icon-set.api.core',
		'ui.banner-dispatcher',
	],
	'skip_core' => false,
];
