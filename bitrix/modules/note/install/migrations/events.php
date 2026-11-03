<?php

use Bitrix\Main\UpdateSystem\Migration;
use Bitrix\Note\Infrastructure\Connector\Mobile;
use Bitrix\Note\Internal\Integration\Disk\ConnectorListEventHandler;
use Bitrix\Note\Internal\Integration\Im\NotifySchemaHandler;
use Bitrix\Note\Internal\Integration\Intranet\EventHandler\InitSummaryProviders;
use Bitrix\Note\Internal\Integration\Pull\PullSchema;

$event = Migration::getInstance()->event();

$event
	->register('pull', 'onGetDependentModule', '\\' . PullSchema::class, 'onGetDependentModule')
	->register('mobile', 'onMobileMenuStructureBuilt', '\\' . Mobile::class, 'onMobileMenuStructureBuilt')
	// Without this handler note notifications fall into im's generic group (no mail/push, no per-type toggle).
	->register('im', 'OnGetNotifySchema', NotifySchemaHandler::class, 'onGetNotifySchema')
	// Without this handler Disk has no owner entity for a document, so an attachment can neither be
	// created against it nor answer who may read it.
	->register('disk', 'onBuildAdditionalConnectorList', ConnectorListEventHandler::class, 'onBuildAdditionalConnectorList')
	// Note's numbers for the annual summary: without this subscription the intranet agent never
	// collects our provider and the summary rows are simply never written.
	->register('intranet', 'onInitSummaryProviders', InitSummaryProviders::class, 'onInitSummaryProviders')
;
