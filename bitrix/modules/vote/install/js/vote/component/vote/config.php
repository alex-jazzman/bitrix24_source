<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/vote.bundle.css',
	'js' => 'dist/vote.bundle.js',
	'rel' => [
		'ui.notification',
		'vote.provider.service',
		'vote.component.loader',
		'main.core',
		'ui.icon-set.animated',
		'vote.application',
		'main.popup',
		'ui.vue3.components.popup',
	],
	'skip_core' => false,
];

