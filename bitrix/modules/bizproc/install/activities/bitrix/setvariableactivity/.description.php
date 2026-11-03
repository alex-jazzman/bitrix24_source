<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true) die();

use Bitrix\Bizproc\Activity\Enum\ActionArea;
use Bitrix\Bizproc\Activity\Enum\ActionGroup;
use Bitrix\Bizproc\Internal\Config\NodeVariableActionsFeature;

$arActivityDescription = array(
	"NAME" => GetMessage("BPSVA_DESCR_NAME"),
	"DESCRIPTION" => GetMessage("BPSVA_DESCR_DESCR"),
	"TYPE" => NodeVariableActionsFeature::isEnabled() ? array("activity", "node_action") : array("activity"),
	"CLASS" => "SetVariableActivity",
	"JSCLASS" => "BizProcActivity",
	"CATEGORY" => array(
		"ID" => "other",
	),
	"NODE_ACTION_SETTINGS" => array(
		"ACTION_GROUP" => ActionGroup::UPDATE->value,
		"ACTION_AREA" => ActionArea::BIZPROC->value,
		"ACTION_OBJECTS" => array(
			array("id" => "variable", "title" => GetMessage("BPSVA_DESCR_OBJECT_VARIABLE")),
		),
	),
);
?>
