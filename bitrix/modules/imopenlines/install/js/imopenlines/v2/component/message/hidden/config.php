<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/hidden.bundle.css',
	'js' => 'dist/hidden.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.component.message.base',
		'im.v2.component.message.elements',
		'im.v2.component.message.file',
		'im.v2.const',
		'im.v2.lib.date-formatter',
		'im.v2.lib.parser',
		'ui.icon-set.api.vue',
		'ui.vue3.directives.hint',
	],
	'skip_core' => true,
];
