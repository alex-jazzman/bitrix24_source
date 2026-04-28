<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/enable-feature.bundle.css',
	'js' => 'dist/enable-feature.bundle.js',
	'rel' => [
		'im.v2.component.elements.button',
		'main.core',
		'im.v2.lib.analytics',
		'im.v2.lib.helpdesk',
		'im.v2.lib.copilot',
		'im.v2.component.message.supervisor.base',
		'stafftrack.user-statistics-link',
	],
	'skip_core' => false,
];
