<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/entity-card.bundle.css',
	'js' => 'dist/entity-card.bundle.js',
	'rel' => [
		'catalog.tool-availability-manager',
		'main.core',
		'main.core.events',
		'main.popup',
		'translit',
		'ui.design-tokens',
		'ui.entity-editor',
		'ui.feedback.form',
		'ui.fonts.opensans',
		'ui.hint',
		'ui.notification',
	],
	'skip_core' => false,
];