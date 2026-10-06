<?php

use Bitrix\Main\UpdateSystem\Migration;
use Bitrix\Note\Infrastructure\Connector\Mobile;
use Bitrix\Note\Internal\Integration\Im\NotifySchemaHandler;
use Bitrix\Note\Internal\Integration\Pull\PullSchema;

$event = Migration::getInstance()->event();

$event
	->register('pull', 'onGetDependentModule', '\\' . PullSchema::class, 'onGetDependentModule')
	->register('mobile', 'onMobileMenuStructureBuilt', '\\' . Mobile::class, 'onMobileMenuStructureBuilt')
	// Without this handler note notifications fall into im's generic group (no mail/push, no per-type toggle).
	->register('im', 'OnGetNotifySchema', NotifySchemaHandler::class, 'onGetNotifySchema')
;
