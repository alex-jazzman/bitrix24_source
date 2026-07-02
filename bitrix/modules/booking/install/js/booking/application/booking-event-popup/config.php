<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/booking-event-popup.bundle.css',
	'js' => 'dist/booking-event-popup.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'booking.component.avatar',
		'booking.component.button',
		'booking.component.mixin.loc-mixin',
		'booking.const',
		'booking.core',
		'booking.lib.side-panel-instance',
		'booking.model.booking-info',
		'booking.provider.service.calendar-data-service',
		'main.loader',
		'main.popup',
		'ui.cnt',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.vue3',
		'ui.vue3.components.counter',
		'ui.vue3.components.rich-loc',
		'ui.vue3.directives.hint',
		'ui.vue3.vuex',
	],
	'skip_core' => true,
];
