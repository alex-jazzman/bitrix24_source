<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/select.bundle.js',
	'css' => './dist/select.bundle.css',
	'rel' => [
		'bizproc.fields',
		'main.core',
		'ui.design-tokens',
		'ui.forms',
		'ui.icon-set.outline',
	],
	'skip_core' => false,
];
