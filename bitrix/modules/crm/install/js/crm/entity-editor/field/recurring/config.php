<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/recurring.bundle.css',
	'js' => 'dist/recurring.bundle.js',
	'rel' => [
		'crm.timeline.tools',
		'main.core',
		'main.core.events',
		'main.date',
		'main.popup',
		'ui.date-picker',
		'ui.entity-selector',
		'ui.loader',
		'ui.mail.provider-showcase',
		'ui.sidepanel',
		'ui.vue3',
	],
	'skip_core' => false,
];
