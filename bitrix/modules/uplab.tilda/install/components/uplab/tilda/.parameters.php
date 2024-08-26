<?php

use Uplab\Tilda\Common;

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();

if (!CModule::IncludeModule("uplab.tilda")) {
	ShowError(GetMessage("CC_UPT_NOT_INSTALLED"));
	return false;
}

$projectsList = Common::getAssocProjectsList();
$currentProject = $arCurrentValues["PROJECT"] ?: key($projectsList);

if (!$projectsList || !$currentProject) {
	echo "<script>alert('" . GetMessage("UPT_NO_PROJECTS") . "');</script>";
	return false;
}

$arComponentParameters = array(
	"GROUPS" => array(),
	"PARAMETERS" => array(
		"PROJECT" => array(
			"NAME" => GetMessage("UPT_SELECT_PROJECT"),
			"TYPE" => "LIST",
			"DEFAULT" => '',
			"PARENT" => "BASE",
			"REFRESH" => "Y",
			"VALUES" => $projectsList
		),

		"PAGE" => array(
			"NAME" => GetMessage("UPT_SELECT_PAGE"),
			"TYPE" => "LIST",
			"DEFAULT" => '',
			"PARENT" => "BASE",
			"REFRESH" => "Y",
			"VALUES" => Common::getAssocPagesList($currentProject),
		),

		"STOP_CACHE" => array(
			"NAME" => GetMessage("UPT_STOP_CACHE"),
			"TYPE" => "CHECKBOX",
			"DEFAULT" => 'N',
			"PARENT" => "BASE",
			"VALUES" => ""
		),

		"NOJQ" => array(
			"NAME" => GetMessage("UPT_NO_JQ"),
			"TYPE" => "CHECKBOX",
			"DEFAULT" => 'N',
			"PARENT" => "BASE",
			"VALUES" => ""
		),
	),
);