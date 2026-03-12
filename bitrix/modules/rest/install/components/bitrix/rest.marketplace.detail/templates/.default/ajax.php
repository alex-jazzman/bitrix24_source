<?

use Bitrix\Main\Localization\Loc;

define("NOT_CHECK_PERMISSIONS", true);
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_before.php");
IncludeModuleLangFile(__FILE__);


if ($_SERVER["REQUEST_METHOD"]=="POST" && $_POST["action"] <> '' && check_bitrix_sessid())
{
	if (isset($_POST["site_id"]) && trim($_POST["site_id"]))
	{
		$siteID = trim($_POST["site_id"]);
	}
	else
	{
		$dbSite = \CSite::GetList("sort", "desc", array("DEFAULT"=>"Y"));
		if ($arSite = $dbSite->Fetch())
		{
			$siteID = $arSite["LID"];
		}
	}

	$arJsonData = array();
	$error = "";

	switch ($_POST["action"])
	{
		case "sendInstallRequest":

			if (!\Bitrix\Main\Loader::includeModule("im"))
				break;

			if (!isset($_POST["appName"]))
				break;

			$userName = \CUser::FormatName("#NAME# #LAST_NAME#", array(
				"NAME" => $USER->GetFirstName(),
				"LAST_NAME" => $USER->GetLastName(),
				"SECOND_NAME" => $USER->GetSecondName(),
				"LOGIN" => $USER->GetLogin()
			));

			$arAdmins = \CRestUtil::getAdministratorIdList();
			foreach($arAdmins as $id)
			{
				$arMessageFields = array(
					"TO_USER_ID" => $id,
					"FROM_USER_ID" => $USER->GetID(),
					"NOTIFY_TYPE" => IM_NOTIFY_CONFIRM,
					"NOTIFY_MODULE" => "rest",
					"NOTIFY_EVENT" => "admin_notification",
					"NOTIFY_TAG" => "REST|APP_INSTALL_REQUEST|".$USER->GetID()."|TO|".$id,
					"NOTIFY_SUB_TAG" => "REST|APP_INSTALL_REQUEST",
					"NOTIFY_MESSAGE" => Loc::getMessage('REST_APP_INSTALL_REQUEST_MESSAGE', ['#APP_NAME#' => $_POST['appName']]),
					"NOTIFY_BUTTONS" => Array(
						array('TITLE' => GetMessage("REST_APP_INSTALL_REQUEST_ACCEPT"), 'VALUE' => 'Y', 'TYPE' => 'accept', 'APP_URL' => "/marketplace/detail/".$_POST["appCode"]."/", 'APP_NAME' => $_POST["appName"]),
						array('TITLE' => GetMessage("REST_APP_INSTALL_REQUEST_CANCEL"), 'VALUE' => 'N', 'TYPE' => 'cancel'),
					),
					"PARAMS" => [
						'COMPONENT_ID' => 'DefaultEntity',
						'COMPONENT_PARAMS' => [
							'SUBJECT' => Loc::getMessage('REST_APP_INSTALL_REQUEST_NOTIFY_SUBJECT', ['#APP_NAME#' => $_POST['appName']]),
							'PLAIN_TEXT' => Loc::getMessage('REST_APP_INSTALL_REQUEST_NOTIFY_PLAIN_TEXT'),
						],
					],
				);
				\CIMNotify::Add($arMessageFields);
			}
			$res = true;

			break;
	}

	if (!empty($error))
		$arJsonData["error"] = $error;

	$APPLICATION->RestartBuffer();
	echo \Bitrix\Main\Web\Json::encode($arJsonData);
	die();
}