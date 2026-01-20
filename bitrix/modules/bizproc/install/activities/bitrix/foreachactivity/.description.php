<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Bizproc\Activity\Enum\ActivityNodeType;
use Bitrix\Main\Localization\Loc;

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('BPFEA_DESCR_NAME'),
	description: Loc::getMessage('BPFEA_DESCR_DESCR'),
	type: [ ActivityType::ACTIVITY->value, ActivityType::NODE->value ],
))
	->setCategory([
		'ID' => 'logic',
	])
	->setClass('ForEachActivity')
	->setJsClass('ForEachActivity')
	->setReturn([
		'Key' => [
			'NAME' => Loc::getMessage('BPFEA_DESCR_RETURN_KEY'),
			'TYPE' => 'string',
		],
		'Value' => [
			'NAME' => Loc::getMessage('BPFEA_DESCR_RETURN_VALUE'),
			'TYPE' => 'mixed',
		],
	])
	->setNodeType(ActivityNodeType::COMPLEX->value)
	->setNodeSettings(new \Bitrix\Bizproc\Activity\Dto\NodeSettings(
		width: 230,
		height: 46,
		ports: new \Bitrix\Bizproc\Activity\Dto\NodePorts(
			input: new \Bitrix\Bizproc\Activity\Dto\PortCollection(
				new \Bitrix\Bizproc\Activity\Dto\Port('i0', 1, 'in'),
				new \Bitrix\Bizproc\Activity\Dto\Port('i1', 2, '->>'),
			),
			output: new \Bitrix\Bizproc\Activity\Dto\PortCollection(
				new \Bitrix\Bizproc\Activity\Dto\Port('o1', 1, 'out'),
				new \Bitrix\Bizproc\Activity\Dto\Port('o0', 2, '->>'),
			),
		)
	))
	->toArray()
;
