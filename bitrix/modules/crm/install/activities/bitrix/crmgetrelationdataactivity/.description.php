<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Crm\Integration\BizProc\Document\Dynamic;
use Bitrix\Main\Localization\Loc;

$arActivityDescription =
	(new ActivityDescription(
		name: Loc::getMessage('CRM_GRDA_NAME'),
		description: Loc::getMessage('CRM_GRDA_DESC'),
		type: [
			ActivityType::NODE_ACTION->value,
		],
	))
	->setClass('CrmGetRelationDataActivity')
	->setJsClass('BizProcActivity')
	->setCategory([
		'ID' => 'document',
		'OWN_ID' => 'crm',
		'OWN_NAME' => 'CRM',
	])
	->setFilter([
		'INCLUDE' => [
			['crm', Dynamic::class],
		],
	])
	->setNodeActionSettings([
		'HANDLES_DOCUMENT' => true,
	])
	->setAdditionalResult(['SourceDocumentProperties', 'RelationTargetFields'])
	->toArray()
;
