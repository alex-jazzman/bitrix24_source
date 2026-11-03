<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/vacation-auto-reply.bundle.js',
	'css' => './dist/vacation-auto-reply.bundle.css',
	'lang' => 'lang/ru/config.php',
	'rel' => [
		'mail.signature.editor',
		'main.core',
		'main.loader',
		'main.popup',
		'ui.a11y',
		'ui.date-picker',
		'ui.select',
		'ui.switcher',
		'ui.system.alert',
		'ui.system.alert.vue',
		'ui.system.input.vue',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.button',
		'ui.vue3.components.switcher',
	],
	'skip_core' => false,
];
