<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/condition.bundle.css',
	'js' => 'dist/condition.bundle.js',
	'rel' => [
		'bp_field_type',
		'main.core',
		'main.core.events',
		'main.date',
		'main.popup',
		'ui.buttons',
		'ui.draganddrop.draggable',
		'ui.forms',
		'ui.hint',
		'ui.icon-set.actions',
		'ui.icon-set.main',
	],
	'skip_core' => false,
];