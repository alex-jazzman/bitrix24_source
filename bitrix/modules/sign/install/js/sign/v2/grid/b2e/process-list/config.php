<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/index.bundle.js',
	'rel' => [
		'main.core',
		'main.sidepanel',
		'sign.v2.api',
		'ui.a11y',
		'ui.system.tooltip',
	],
	'skip_core' => false,
];
