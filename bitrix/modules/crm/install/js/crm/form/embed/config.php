<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/embed.bundle.css',
	'js' => 'dist/embed.bundle.js',
	'rel' => [
		'landing.ui.field.color',
		'main.core',
		'main.core.events',
		'main.loader',
		'main.qrcode',
		'popup',
		'ui.alerts',
		'ui.design-tokens',
		'ui.feedback.form',
		'ui.fonts.opensans',
		'ui.notification',
		'ui.sidepanel.layout',
		'ui.stepbystep',
		'ui.switcher',
	],
	'skip_core' => false,
];
