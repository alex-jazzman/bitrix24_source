<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/progressround.bundle.css',
	'js' => 'dist/progressround.bundle.js',
	'rel' => [
		'main.core',
		'ui.design-tokens.air',
		'ui.fonts.opensans',
		'ui.system.typography',
	],
	'skip_core' => false,
];
