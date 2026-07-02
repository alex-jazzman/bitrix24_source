<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/sign-link.bundle.css',
	'js' => 'dist/sign-link.bundle.js',
	'rel' => [
		'main.core',
		'main.date',
		'sign.v2.api',
		'sign.v2.b2e.signing-frame-event-handler',
		'ui.buttons',
		'ui.design-tokens',
		'ui.sidepanel-content',
	],
	'skip_core' => false,
];