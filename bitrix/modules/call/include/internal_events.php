<?php

use Bitrix\Main\Event;
use Bitrix\Main\EventManager;
use Bitrix\Main\EventResult;
use Bitrix\Call\Track\TrackService;

$eventManager = EventManager::getInstance();

$eventManager->addEventHandler(
	'call',
	'onCallTrackDownloadCompleted',
	static fn (Event $event): EventResult
		=> TrackService::getInstance()->onCallTrackDownloadCompleted($event)
);
