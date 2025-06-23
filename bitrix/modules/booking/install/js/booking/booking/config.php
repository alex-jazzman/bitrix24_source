<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!\Bitrix\Main\Loader::includeModule('booking'))
{
	return [];
}

return [
	'lang' => BX_ROOT.'/modules/booking/install/components/bitrix/booking/class.php',
	'css' => 'dist/booking.bundle.css',
	'js' => 'dist/booking.bundle.js',
	'rel' => [
		'booking.component.mixin.loc-mixin',
		'main.loader',
		'booking.provider.service.main-page-service',
		'booking.provider.service.dictionary-service',
		'booking.provider.service.calendar-service',
		'main.core.events',
		'ui.counterpanel',
		'ui.cnt',
		'ui.vue3.components.menu',
		'booking.lib.drag',
		'ui.vue3.components.rich-loc',
		'ui.notification-manager',
		'booking.provider.service.booking-actions-service',
		'booking.component.loader',
		'ui.vue3.directives.hint',
		'booking.lib.mouse-position',
		'booking.component.time-selector',
		'booking.component.note-popup',
		'ui.icon-set.api.core',
		'ui.icon-set.animated',
		'booking.component.counter',
		'booking.component.popup',
		'booking.lib.check-booking-intersection',
		'booking.lib.grid',
		'booking.lib.in-interval',
		'booking.lib.range',
		'booking.core',
		'ui.date-picker',
		'booking.lib.is-real-id',
		'booking.component.actions-popup',
		'booking.component.booking',
		'booking.lib.deal-helper',
		'booking.model.bookings',
		'booking.model.clients',
		'booking.provider.service.wait-list-service',
		'booking.lib.remove-booking',
		'booking.lib.remove-wait-list-item',
		'booking.lib.currency-format',
		'booking.component.statistics-popup',
		'ui.dialogs.messagebox',
		'ui.hint',
		'booking.provider.service.resources-service',
		'ui.icon-set.actions',
		'booking.resource-creation-wizard',
		'booking.provider.service.resource-dialog-service',
		'booking.lib.resources',
		'booking.lib.resources-date-cache',
		'main.popup',
		'ui.icon-set.api.vue',
		'ui.icon-set.main',
		'booking.provider.service.option-service',
		'booking.lib.help-desk',
		'booking.lib.busy-slots',
		'ui.entity-selector',
		'booking.lib.limit',
		'booking.provider.service.booking-service',
		'booking.provider.service.client-service',
		'ui.ears',
		'main.date',
		'booking.lib.duration',
		'booking.component.client-popup',
		'booking.component.button',
		'booking.lib.analytics',
		'ui.auto-launch',
		'ui.vue3.vuex',
		'main.core',
		'ui.vue3',
		'ui.banner-dispatcher',
		'booking.lib.resolvable',
		'booking.const',
		'booking.lib.aha-moments',
	],
	'skip_core' => false,
	'settings' => [
		'isAirTemplate' =>
			\Bitrix\Main\Loader::includeModule('intranet')
			&& class_exists(\Bitrix\Intranet\Integration\Templates\Air\AirTemplate::class)
			&& \Bitrix\Intranet\Integration\Templates\Air\AirTemplate::isEnabled()
		,
		'webForms' => [
			'link' => \Bitrix\Booking\Internals\Integration\Crm\WebForm::getCrmFormLink(),
			'presets' => \Bitrix\Booking\Internals\Integration\Crm\WebForm::getCrmFormPresets(),
		],
	],
];
