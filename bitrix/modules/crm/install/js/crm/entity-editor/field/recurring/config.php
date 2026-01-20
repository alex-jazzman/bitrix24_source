<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/recurring.bundle.css',
	'js' => 'dist/recurring.bundle.js',
	'rel' => [
		'ui.vue3',
		'crm.timeline.tools',
		'main.date',
		'main.popup',
		'ui.date-picker',
		'ui.loader',
		'ui.mail.provider-showcase',
		'ui.sidepanel',
		'main.core.events',
		'ui.entity-selector',
		'main.core',
	],
	'skip_core' => false,
];
