<?php

$event = \Bitrix\Main\UpdateSystem\Migration::getInstance()->event();

$event
	/** @see \Bitrix\MessageService\Queue::run */
	->registerCompatible('main', 'OnAfterEpilog', '\Bitrix\MessageService\Queue', 'run')
	/** @see \Bitrix\MessageService\RestService::onRestServiceBuildDescription */
	->registerCompatible('rest', 'OnRestServiceBuildDescription', '\Bitrix\MessageService\RestService', 'onRestServiceBuildDescription')
	/** @see \Bitrix\MessageService\RestService::onRestAppDelete */
	->registerCompatible('rest', 'OnRestAppDelete', '\Bitrix\MessageService\RestService', 'onRestAppDelete')
	/** @see \Bitrix\MessageService\RestService::onRestAppUpdate */
	->registerCompatible('rest', 'OnRestAppUpdate', '\Bitrix\MessageService\RestService', 'onRestAppUpdate')
	/** @see \Bitrix\MessageService\Sender\Sms\Wazzup::onReceivedStatusRead */
	->register('imconnector', 'OnReceivedStatusReading', '\Bitrix\MessageService\Sender\Sms\Wazzup', 'onReceivedStatusRead')
	/** @see \Bitrix\MessageService\Sender\Sms\Wazzup::onReceivedStatusDelivered */
	->register('imconnector', 'onReceivedStatusDelivery', '\Bitrix\MessageService\Sender\Sms\Wazzup', 'onReceivedStatusDelivered')
;
