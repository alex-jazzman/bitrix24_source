<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/copilot-answer.bundle.css',
	'js' => 'dist/copilot-answer.bundle.js',
	'rel' => [
		'im.v2.component.message.base',
		'im.v2.component.message.elements',
		'im.v2.lib.copilot',
		'im.v2.lib.helpdesk',
		'im.v2.lib.notifier',
		'im.v2.lib.parser',
		'im.v2.lib.utils',
		'main.core',
	],
	'skip_core' => false,
];
