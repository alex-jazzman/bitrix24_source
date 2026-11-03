<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/contact-message.bundle.js',
	'css' => './dist/contact-message.bundle.css',
	'rel' => [
		'main.polyfill.core',
		'im.v2.component.elements.avatar',
		'im.v2.component.message.base',
		'im.v2.component.message.elements',
		'im.v2.const',
		'im.v2.lib.parser',
		'ui.vue3',
		'ui.vue3.directives.lazyload',
	],
	'skip_core' => true,
];
