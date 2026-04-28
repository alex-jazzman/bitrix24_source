<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Bizproc\Activity\Enum\ActivityNodeType;
use Bitrix\Main\Localization\Loc;

$type = [ActivityType::ACTIVITY->value];
if (defined('Bitrix\Bizproc\Dev\ENV'))
{
	$type[] = ActivityType::NODE->value;
}

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('BPAA_DESCR_NAME'),
	description: Loc::getMessage('BPAA_DESCR_DESCR'),
	type: $type,
))
	->setCategory([
		'ID' => 'document',
		'OWN_ID' => 'task',
		'OWN_NAME' => Loc::getMessage('BPAA_DESCR_TASKS'),
	])
	->setClass('ApproveActivity')
	->setJsClass('ApproveActivity')
	->setReturn([
		'TaskId' => [
			'NAME' => 'ID',
			'TYPE' => 'int',
		],
		'Comments' => [
			'NAME' => Loc::getMessage('BPAA_DESCR_CM_1'),
			'TYPE' => 'string',
		],
		'VotedCount' => [
			'NAME' => Loc::getMessage('BPAA_DESCR_VC'),
			'TYPE' => 'int',
		],
		'TotalCount' => [
			'NAME' => Loc::getMessage('BPAA_DESCR_TC'),
			'TYPE' => 'int',
		],
		'VotedPercent' => [
			'NAME' => Loc::getMessage('BPAA_DESCR_VP'),
			'TYPE' => 'int',
		],
		'ApprovedPercent' => [
			'NAME' => Loc::getMessage('BPAA_DESCR_AP'),
			'TYPE' => 'int',
		],
		'NotApprovedPercent' => [
			'NAME' => Loc::getMessage('BPAA_DESCR_NAP'),
			'TYPE' => 'int',
		],
		'ApprovedCount' => [
			'NAME' => Loc::getMessage('BPAA_DESCR_AC'),
			'TYPE' => 'int',
		],
		'NotApprovedCount' => [
			'NAME' => Loc::getMessage('BPAA_DESCR_NAC'),
			'TYPE' => 'int',
		],
		'LastApprover' => [
			'NAME' => Loc::getMessage('BPAA_DESCR_LA'),
			'TYPE' => 'user',
		],
		'LastApproverComment' => [
			'NAME' => Loc::getMessage('BPAA_DESCR_LA_COMMENT_1'),
			'TYPE' => 'string',
		],
		'UserApprovers' => [
			'NAME' => Loc::getMessage('BPAA_DESCR_APPROVERS'),
			'TYPE' => 'user',
		],
		'Approvers' => [
			'NAME' => Loc::getMessage('BPAA_DESCR_APPROVERS_STRING'),
			'TYPE' => 'string',
		],
		'UserRejecters' => [
			'NAME' => Loc::getMessage('BPAA_DESCR_REJECTERS'),
			'TYPE' => 'user',
		],
		'Rejecters' => [
			'NAME' => Loc::getMessage('BPAA_DESCR_REJECTERS_STRING'),
			'TYPE' => 'string',
		],
		'IsTimeout' => [
			'NAME' => Loc::getMessage('BPAA_DESCR_TA1'),
			'TYPE' => 'int',
		],
	])
	->setSort(100)
	->setNodeType(ActivityNodeType::COMPLEX->value)
	->setNodeSettings(new \Bitrix\Bizproc\Activity\Dto\NodeSettings(
		ports: new \Bitrix\Bizproc\Activity\Dto\NodePorts(
			input: new \Bitrix\Bizproc\Activity\Dto\PortCollection(
				new \Bitrix\Bizproc\Activity\Dto\Port('i0'),
			),
			output: new \Bitrix\Bizproc\Activity\Dto\PortCollection(
				new \Bitrix\Bizproc\Activity\Dto\Port('o0', 1, 'yes'),
				new \Bitrix\Bizproc\Activity\Dto\Port('o1', 2, 'no'),
			),
		)
	))
	->toArray()
;
