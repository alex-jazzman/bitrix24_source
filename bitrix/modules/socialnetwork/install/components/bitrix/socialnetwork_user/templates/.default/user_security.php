<?php

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)
	die();

use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Loader;
use Bitrix\Main\Web\Uri;

$pageId = "user";
include("util_menu.php");

if (isset($arResult["VARIABLES"]["user_id"]) && $USER->GetID() !== $arResult["VARIABLES"]["user_id"])
{
	ShowError(GetMessage("SONET_PASS_ACCESS_ERROR"));
	return;
}

$userId = (int)$arResult["VARIABLES"]["user_id"];
$serviceLocator = ServiceLocator::getInstance();

if (
	Loader::includeModule('intranet')
	&& $serviceLocator->has('intranet.service.otp.scenario')
	&& $serviceLocator->get('intranet.service.otp.scenario')->isPushOtpScenario($userId)
)
{
	$otpComponentName = "bitrix:intranet.user.otp.connected";
	$otpComponentParams = array(
		"USER_ID" => $userId,
	);
}
else
{
	$path = CComponentEngine::MakePathFromTemplate($arResult["PATH_TO_USER"], array("user_id" => $arResult["VARIABLES"]["user_id"]));
	$path = (string)(new Uri($path))->addParams(["otp" => "Y"]);

	$otpComponentName = "bitrix:security.user.otp.init";
	$otpComponentParams = array(
		"SUCCESSFUL_URL" => $path,
	);
}

if (
	\Bitrix\Main\ModuleManager::isModuleInstalled("intranet")
	&& (SITE_TEMPLATE_ID == "bitrix24" || SITE_TEMPLATE_ID === 'air')
	&& \Bitrix\Main\Context::getCurrent()->getRequest()->get('IFRAME') === 'Y'
)
{
	$APPLICATION->IncludeComponent(
		"bitrix:ui.sidepanel.wrapper",
		"",
		array(
			'POPUP_COMPONENT_NAME' => $otpComponentName,
			"POPUP_COMPONENT_TEMPLATE_NAME" => "",
			"POPUP_COMPONENT_PARAMS" => $otpComponentParams,
			"POPUP_COMPONENT_PARENT" => $this->getComponent()
		)
	);
}
else
{
	$APPLICATION->IncludeComponent($otpComponentName, "", $otpComponentParams);
}
