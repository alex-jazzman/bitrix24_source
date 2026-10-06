<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/text.bundle.js',
	'css' => './dist/text.bundle.css',
	'rel' => [
		'bizproc.fields',
		'main.core',
		'ui.design-tokens',
		'ui.icon-set.outline',
	],
	'skip_core' => false,
];
