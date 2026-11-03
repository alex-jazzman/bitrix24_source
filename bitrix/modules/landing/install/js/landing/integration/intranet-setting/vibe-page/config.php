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
		'landing.ui.a11y',
		'main.core',
		'main.core.events',
		'main.popup',
		'sidepanel',
		'ui.buttons',
		'ui.dialogs.messagebox',
		'ui.form-elements.field',
		'ui.hint',
		'ui.icon.set',
		'ui.section',
	],
	'skip_core' => false,
];
