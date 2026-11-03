<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/task-result-button.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.component.textarea',
		'im.v2.const',
		'im.v2.lib.feature',
		'main.core.events',
		'tasks.v2.application.task-result-button',
	],
	'skip_core' => true,
];
