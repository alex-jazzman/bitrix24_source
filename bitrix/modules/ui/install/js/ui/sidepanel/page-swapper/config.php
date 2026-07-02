<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/page-swapper.bundle.css',
	'js' => 'dist/page-swapper.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.loader',
		'ui.icon-set.actions',
		'ui.icon-set.api.core',
	],
	'skip_core' => false,
];