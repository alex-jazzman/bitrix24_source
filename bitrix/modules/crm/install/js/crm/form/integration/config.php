<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/integration.bundle.css',
	'js' => 'dist/integration.bundle.js',
	'rel' => [
		'crm.form.fields.mapper',
		'crm.form.type',
		'main.core',
		'main.core.ajax',
		'main.core.events',
		'main.loader',
		'seo.ads.login',
		'ui.alerts',
		'ui.buttons',
		'ui.dialogs.messagebox',
		'ui.dropdown',
		'ui.sidepanel-content',
	],
	'skip_core' => false,
];