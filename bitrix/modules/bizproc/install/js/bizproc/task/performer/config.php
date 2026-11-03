<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/performer.bundle.js',
    'css' => './dist/performer.bundle.css',
    'rel' => [
		'bizproc.a11y',
		'main.core',
		'main.core.events',
		'main.popup',
		'sidepanel',
		'ui.buttons',
		'ui.notification',
		'ui.system.checkbox',
		'ui.system.dialog',
		'ui.system.illustration',
		'ui.system.typography',
	],
    'skip_core' => false,
];
