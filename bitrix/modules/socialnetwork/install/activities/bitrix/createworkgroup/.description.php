<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true) die();

use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription = array(
	"NAME" => GetMessage("BPCWG_DESCR_NAME2"),
	"DESCRIPTION" => GetMessage("BPCWG_DESCR_DESCR2"),
	"TYPE" => ["activity", "node"],
	"CLASS" => "CreateWorkGroup",
	"JSCLASS" => "BizProcActivity",
	"CATEGORY" => array(
		"ID" => "other",
	),
	"RETURN" => array(
		"GroupId" => array(
			"NAME" => GetMessage("BPCWG_GROUP_ID"),
			"TYPE" => "int",
		),
	),
);

if (class_exists(Outline::class) && class_exists(ActivityColorIndex::class))
{
	$arActivityDescription += [
		'GROUPS' => [
			ActivityGroup::INTERNAL_COMMUNICATION->value,
		],
		'COLOR_INDEX' => ActivityColorIndex::BLUE->value,
		'NODE_ICON' => Outline::GROUP->name,
	];
}