<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/ai-bizproc.bundle.css',
	'js' => 'dist/ai-bizproc.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.vue3.components.rich-loc',
		'im.v2.component.message.base',
		'im.v2.component.message.elements',
		'im.v2.lib.helpdesk',
	],
	'skip_core' => true,
];