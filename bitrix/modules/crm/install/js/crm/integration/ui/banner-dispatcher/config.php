<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/banner-dispatcher.bundle.css',
	'js' => 'dist/banner-dispatcher.bundle.js',
	'rel' => [
		'main.core',
		'ui.auto-launch',
		'ui.banner-dispatcher',
	],
	'skip_core' => false,
];