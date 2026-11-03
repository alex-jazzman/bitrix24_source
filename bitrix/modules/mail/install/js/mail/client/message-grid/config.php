<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
    die();
}

return [
    'js' => './dist/message-grid.bundle.js',
    'css' => './dist/message-grid.bundle.css',
    'rel' => [
		'mail.favorites-filter-state',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.a11y',
		'ui.actionpanel',
		'ui.buttons',
		'ui.design-tokens',
		'ui.fonts.opensans',
		'ui.system.checkbox',
		'ui.vue3',
		'ui.vue3.pinia',
	],
    'skip_core' => false,
];
