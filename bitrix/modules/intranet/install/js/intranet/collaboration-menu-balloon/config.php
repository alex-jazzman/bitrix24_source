<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/collaboration-menu-balloon.bundle.js',
	'css' => 'dist/collaboration-menu-balloon.bundle.css',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.banner-dispatcher',
		'ui.buttons',
		'ui.icon-set.outline',
		'ui.system.highlighter',
		'ui.system.typography',
	],
	'skip_core' => false,
];
