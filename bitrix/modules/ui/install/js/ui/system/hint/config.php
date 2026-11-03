<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/hint.bundle.js',
	'css' => './dist/hint.bundle.css',
	'rel' => [
		'main.core',
		'main.core.events',
		'ui.design-tokens.air',
		'ui.icon-set.api.core',
		'ui.icon-set.main',
		'ui.icon-set.outline',
		'ui.system.tooltip',
	],
	'skip_core' => false,
];
