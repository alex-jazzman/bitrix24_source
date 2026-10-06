<?php

declare(strict_types=1);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'script.js',
	'css' => 'style.css',
	'rel' => [
		'main.core',
		'main.core.events',
		'ui.a11y',
		'ui.design-tokens.air',
		'ui.dialogs.messagebox',
		'ui.notification',
	],
	'skip_core' => false,
];
