<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/reaction-picker.bundle.css',
	'js' => 'dist/reaction-picker.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.core.z-index-manager',
		'main.popup',
		'ui.a11y',
		'ui.design-tokens',
		'ui.design-tokens.air',
		'ui.icon-set.api.core',
		'ui.icon-set.outline',
		'ui.reaction.item',
	],
	'skip_core' => false,
];
