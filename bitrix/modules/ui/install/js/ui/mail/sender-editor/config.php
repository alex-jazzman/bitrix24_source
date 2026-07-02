<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/sender-editor.bundle.css',
	'js' => 'dist/sender-editor.bundle.js',
	'rel' => [
		'main.core',
		'ui.alerts',
		'ui.buttons',
		'ui.entity-selector',
		'ui.forms',
		'ui.hint',
		'ui.icon-set.actions',
		'ui.icon-set.main',
		'ui.layout-form',
		'ui.sidepanel.layout',
		'ui.sidepanel-content',
	],
	'skip_core' => false,
];