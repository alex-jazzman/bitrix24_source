<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/copilot-answer.bundle.css',
	'js' => 'dist/copilot-answer.bundle.js',
	'rel' => [
		'im.v2.application.core',
		'im.v2.component.message.base',
		'im.v2.component.message.elements',
		'im.v2.const',
		'im.v2.lib.copilot',
		'im.v2.lib.feature',
		'im.v2.lib.feedback',
		'im.v2.lib.helpdesk',
		'im.v2.lib.logger',
		'im.v2.lib.notifier',
		'im.v2.lib.parser',
		'im.v2.lib.rest',
		'im.v2.lib.utils',
		'main.core',
		'ui.icon-set.api.vue',
	],
	'skip_core' => false,
];
