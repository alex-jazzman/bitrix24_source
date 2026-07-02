<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/side-panel.bundle.css',
	'js' => 'dist/side-panel.bundle.js',
	'rel' => [
		'clipboard',
		'main.core',
		'main.core.cache',
		'main.core.events',
		'main.core.z-index-manager',
		'main.popup',
		'ui.a11y',
		'ui.design-tokens.air',
		'ui.icon-set.actions',
		'ui.icon-set.main',
		'ui.icon-set.outline',
		'ui.system.skeleton',
	],
	'skip_core' => false,
];
