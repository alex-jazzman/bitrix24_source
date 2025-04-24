<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/task.bundle.js',
	'css' => 'dist/task.bundle.css',
	'rel' => [
		'main.polyfill.core',
		'im.v2.application.core',
		'im.v2.lib.logger',
		'im.v2.provider.service',
		'im.v2.component.content.elements',
		'im.v2.component.textarea',
	],
	'skip_core' => true,
];