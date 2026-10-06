<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'script.css',
	'js' => 'script.js',
	'rel' => [
		'ui.icon-set.api.core',
		'ui.alerts',
		'bp_field_type',
		'ui.forms',
		'main.date',
		'sidepanel',
		'main.core.events',
		'bizproc.a11y',
		'ui.a11y',
		'ui.buttons',
		'main.core',
		'ui.dialogs.messagebox',
	],
	'skip_core' => false,
];
