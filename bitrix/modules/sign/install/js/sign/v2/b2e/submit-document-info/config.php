<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/submit-document-info.bundle.css',
	'js' => 'dist/submit-document-info.bundle.js',
	'rel' => [
		'main.core',
		'main.core.cache',
		'main.core.events',
		'main.date',
		'sign.type',
		'sign.v2.api',
		'sign.v2.b2e.sign-link',
		'ui.date-picker',
		'ui.form-elements.view',
		'ui.forms',
	],
	'skip_core' => false,
];