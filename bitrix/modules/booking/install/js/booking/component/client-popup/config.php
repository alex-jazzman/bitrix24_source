<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/client-popup.bundle.css',
	'js' => 'dist/client-popup.bundle.js',
	'rel' => [
		'booking.component.button',
		'booking.component.popup',
		'booking.const',
		'booking.provider.service.client-service',
		'crm.entity-editor.field.phone-number-input',
		'main.core',
		'main.core.events',
		'phone_number',
		'ui.dropdown',
		'ui.icon-set.actions',
		'ui.icon-set.api.vue',
		'ui.icon-set.crm',
		'ui.icon-set.main',
		'ui.notification-manager',
		'ui.vue3',
	],
	'skip_core' => false,
];
