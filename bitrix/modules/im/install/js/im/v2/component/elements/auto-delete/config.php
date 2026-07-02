<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/registry.bundle.css',
	'js' => 'dist/registry.bundle.js',
	'rel' => [
		'im.v2.component.elements.popup',
		'im.v2.const',
		'im.v2.lib.auto-delete',
		'im.v2.lib.helpdesk',
		'main.core',
		'main.popup',
		'ui.forms',
	],
	'skip_core' => false,
];
