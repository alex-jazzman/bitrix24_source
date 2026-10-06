<?php

use Bitrix\Booking\Internals\Integration\Catalog\SkuDeleteEventHandler;
use Bitrix\Booking\Internals\Integration\Catalog\SkuTypeChangeEventHandler;
use Bitrix\Booking\Internals\Integration\Crm\EventsHandler as CrmEventsHandler;
use Bitrix\Booking\Internals\Integration\Notifications\EventHandler as NotificationsEventHandler;
use Bitrix\Booking\Internals\Integration\Im\NotifySchema;
use Bitrix\Booking\Rest\V1\Event\RestEventHandler;
use Bitrix\Main\UpdateSystem\Migration;

$event = Migration::getInstance()->event();

$event
	->registerCompatible('im', 'OnGetNotifySchema', '\\' . NotifySchema::class, 'onGetNotifySchema')
	->registerCompatible('iblock', 'OnBeforeIBlockElementDelete', '\\' . SkuDeleteEventHandler::class, 'onBeforeIBlockElementDelete')
	->register('crm', 'OnAfterCrmContactDelete', '\\' . CrmEventsHandler::class, 'onContactDelete')
	->register('crm', 'OnAfterCrmCompanyDelete', '\\' . CrmEventsHandler::class, 'onCompanyDelete')
	->register('crm', 'OnAfterCrmDealDelete', '\\' . CrmEventsHandler::class, 'onDealDelete')
	->register('crm', 'OnCrmBookingFormSubmitted', '\\' . CrmEventsHandler::class, 'onCrmBookingFormFilled')
	->register('crm', 'onCrmDynamicItemDelete', '\\' . CrmEventsHandler::class, 'onDynamicItemDelete')
	->register('rest', 'OnRestServiceBuildDescription', '\\' . RestEventHandler::class, 'onRestServiceBuildDescription')
	->register('catalog', 'onBeforeConvertProductsType', '\\' . SkuTypeChangeEventHandler::class, 'onBeforeConvertProductsType')
	->register('notifications', 'onMessageSuccessfullyUpdated', '\\' . NotificationsEventHandler::class, 'onMessageStatusUpdate')
;
