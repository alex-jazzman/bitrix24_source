<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/debugger.bundle.css',
	'js' => 'dist/debugger.bundle.js',
	'rel' => [
		'bizproc.automation',
		'bizproc.condition',
		'bizproc.debugger',
		'bizproc.local-settings',
		'bp_field_type',
		'main.core',
		'main.core.events',
		'main.date',
		'main.loader',
		'main.popup',
		'pull.client',
		'ui.buttons',
		'ui.buttons.icons',
		'ui.design-tokens',
		'ui.dialogs.messagebox',
		'ui.entity-selector',
		'ui.fonts.opensans',
		'ui.fonts.robotomono',
		'ui.hint',
		'ui.icon-set.outline',
		'ui.layout-form',
		'ui.tour',
	],
	'skip_core' => false,
];