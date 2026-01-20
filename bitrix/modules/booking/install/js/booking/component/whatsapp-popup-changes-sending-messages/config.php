<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/whatsApp-popup-changes-sending-messages.bundle.css',
	'js' => 'dist/whatsApp-popup-changes-sending-messages.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.vue3.components.button',
		'ui.vue3.vuex',
		'booking.const',
		'booking.component.popup',
		'booking.provider.service.option-service',
	],
	'skip_core' => true,
];
