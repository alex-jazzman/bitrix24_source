<?php

declare(strict_types=1);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Dto\NodePorts;
use Bitrix\Bizproc\Activity\Dto\NodeSettings;
use Bitrix\Bizproc\Activity\Dto\Port;
use Bitrix\Bizproc\Activity\Dto\PortCollection;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Bizproc\FieldType;
use Bitrix\Bizproc\Internal\Config\OutgoingWebhookNodeFeature;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('BPOWH_DESCR_NAME') ?? '',
	description: Loc::getMessage('BPOWH_DESCR_DESCR') ?? '',
	type: [ ActivityType::NODE->value ],
))
	->setClass('OutgoingWebHookActivity')
	->setExcluded(!OutgoingWebhookNodeFeature::isEnabled())
	->setJsClass('BizProcActivity')
	->setGroups([ ActivityGroup::OTHER_OPERATIONS->value ])
	->setColorIndex(ActivityColorIndex::GREY->value)
	->setIcon(Outline::WEBHOOK->name)
	->setReturn([
		'ResponseBody' => [
			'NAME' => Loc::getMessage('BPOWH_DESCR_RET_BODY') ?? '',
			'TYPE' => FieldType::STRING,
		],
		'ResponseCode' => [
			'NAME' => Loc::getMessage('BPOWH_DESCR_RET_CODE') ?? '',
			'TYPE' => FieldType::INT,
		],
		'ResponseHeaders' => [
			'NAME' => Loc::getMessage('BPOWH_DESCR_RET_HEADERS') ?? '',
			'TYPE' => FieldType::STRING,
		],
		'IsTransportError' => [
			'NAME' => Loc::getMessage('BPOWH_DESCR_RET_IS_TRANSPORT_ERROR') ?? '',
			'TYPE' => FieldType::INT,
		],
		'ErrorMessage' => [
			'NAME' => Loc::getMessage('BPOWH_DESCR_RET_ERROR') ?? '',
			'TYPE' => FieldType::STRING,
		],
	])
	->setNodeSettings(new NodeSettings(
		ports: new NodePorts(
			input: new PortCollection(
				new Port('i0'),
			),
			output: new PortCollection(
				new Port('o0'),
			),
		),
	))
	->toArray()
;
