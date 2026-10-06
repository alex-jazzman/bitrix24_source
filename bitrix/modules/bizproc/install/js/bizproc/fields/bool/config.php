<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/bool.bundle.js',
	'css' => './dist/bool.bundle.css',
	'rel' => [
		'bizproc.fields',
		'main.core',
		'ui.design-tokens',
		'ui.icon-set.outline',
		'ui.switcher',
	],
	'skip_core' => false,
];
