<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/document-send.bundle.css',
	'js' => 'dist/document-send.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.date',
		'main.loader',
		'sign.type',
		'sign.v2.api',
		'sign.v2.b2e.hcm-link-party-checker',
		'sign.v2.b2e.reminder-selector',
		'sign.v2.b2e.user-party',
		'sign.v2.datetime-limit-selector',
		'sign.v2.document-summary',
		'sign.v2.helper',
		'sign.v2.lang-selector',
		'sign.v2.sign-settings',
		'sign.v2.ui.notice',
		'ui.entity-selector',
		'ui.progressbar',
	],
	'skip_core' => false,
];