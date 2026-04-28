<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/vibe-page.bundle.css',
	'js' => 'dist/vibe-page.bundle.js',
	'rel' => [
		'landing.metrika',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.buttons',
		'ui.icon.set',
		'ui.section',
		'ui.form-elements.field',
		'sidepanel',
	],
	'skip_core' => false,
];
