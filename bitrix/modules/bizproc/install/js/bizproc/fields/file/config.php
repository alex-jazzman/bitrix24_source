<?php

declare(strict_types=1);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/file.bundle.js',
	'css' => './dist/file.bundle.css',
	'rel' => [
		'bizproc.fields',
		'main.core',
		'ui.design-tokens',
		'ui.icon-set.outline',
		'ui.uploader.core',
		'ui.uploader.tile-widget',
	],
	'skip_core' => false,
];
