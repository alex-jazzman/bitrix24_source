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
		'im.v2.component.message.base',
		'im.v2.component.message.elements',
		'im.v2.lib.helpdesk',
		'ui.vue3.components.rich-loc',
	],
	'skip_core' => true,
];