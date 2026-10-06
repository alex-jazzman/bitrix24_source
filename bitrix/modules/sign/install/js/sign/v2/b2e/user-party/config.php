<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/user-party.bundle.css',
	'js' => 'dist/user-party.bundle.js',
	'rel' => [
		'main.core',
		'sign.feature-storage',
		'sign.type',
		'sign.v2.api',
		'sign.v2.b2e.user-party-counters',
		'sign.v2.b2e.user-party-popup',
		'sign.v2.b2e.user-party-refused',
		'sign.v2.helper',
		'ui.entity-selector',
		'ui.icon-set.main',
	],
	'skip_core' => false,
];
