<?php
/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage main
 * @copyright 2001-2026 Bitrix
 */

/**
 * @global CMain $APPLICATION
 * @global CUser $USER
 * @global CUserTypeManager $USER_FIELD_MANAGER
 */

use Bitrix\Main\Application;
use Bitrix\Main\Authentication\Policy;
use Bitrix\Main\UserPhoneAuthTable;
use Bitrix\Main\Localization\LanguageTable;

require_once(__DIR__."/../include/prolog_admin_before.php");
define("HELP_FILE", "users/user_edit.php");
$strRedirect_admin = BX_ROOT."/admin/user_admin.php?lang=".LANGUAGE_ID;
$strRedirect = BX_ROOT."/admin/user_edit.php?lang=".LANGUAGE_ID;

$canViewUserList = ($USER->CanDoOperation('view_subordinate_users') || $USER->CanDoOperation('view_all_users') || $USER->CanDoOperation('edit_all_users') || $USER->CanDoOperation('edit_subordinate_users'));

if(!($USER->CanDoOperation('view_own_profile') || $USER->CanDoOperation('edit_own_profile') || $canViewUserList))
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));

$ID = intval($_REQUEST['ID'] ?? 0);
$COPY_ID = intval($_REQUEST["COPY_ID"] ?? 0);

$uid = $USER->GetID();

if($USER->CanDoOperation('edit_own_profile') && !$canViewUserList)
{
	$ID = $uid;
	if($ID <= 0)
		$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));
	$COPY_ID = 0;
}

IncludeModuleLangFile(__FILE__);

$PROPERTY_ID = "USER";
$message = null;
$strError = '';
$res = true;

if($COPY_ID<=0)
{
	$arUserGroups = CUser::GetUserGroup($ID);
}
else
{
	$arUserGroups = array();
	$ID = $COPY_ID;
}

$selfEdit = ($USER->CanDoOperation('edit_own_profile') && $ID == $uid);

$arUserSubordinateGroups = [];
if ($USER->CanDoOperation('edit_subordinate_users') && !$USER->CanDoOperation('edit_all_users'))
{
	$arUserSubordinateGroups = CUser::GetSubordinateGroups();

	if (!empty(array_diff($arUserGroups, $arUserSubordinateGroups)) && !$selfEdit)
	{
		LocalRedirect(BX_ROOT."/admin/user_admin.php?lang=".LANGUAGE_ID);
	}
}

$editable = ($USER->IsAdmin() ||
	$selfEdit ||
	($USER->CanDoOperation('edit_subordinate_users') && !in_array(1, $arUserGroups)) ||
	($USER->CanDoOperation('edit_all_users') && !in_array(1, $arUserGroups))
);

//authorize as user
if (isset($_REQUEST["action"], $_REQUEST["ID"]) && $_REQUEST["action"] == "authorize" && $_REQUEST["ID"] > 0)
{
	if (check_bitrix_sessid() && $USER->CanDoOperation('edit_php'))
	{
		$USER->LoginAs((int)$_REQUEST["ID"]);
		LocalRedirect("user_edit.php?lang=" . LANGUAGE_ID . "&ID=" . (int)$_REQUEST["ID"]);
	}
}

$canSelfEdit = true;
if($ID==$uid && !($USER->CanDoOperation('edit_php') || ($USER->CanDoOperation('edit_all_users') && $USER->CanDoOperation('edit_groups'))))
	$canSelfEdit = false;

$showGroupTabs = (($USER->CanDoOperation('view_subordinate_users') || $USER->CanDoOperation('view_all_users')) && $canSelfEdit);

$aTabs = array();
$aTabs[] = array("DIV" => "edit1", "TAB" => GetMessage("MAIN_USER_TAB1"), "ICON"=>"main_user_edit", "TITLE"=>GetMessage("MAIN_USER_TAB1_TITLE"));

if($showGroupTabs)
{
	$aTabs[] = array("DIV" => "edit2", "TAB" => GetMessage("GROUPS"), "ICON"=>"main_user_edit", "TITLE"=>GetMessage("MAIN_USER_TAB2_TITLE"));
	$aTabs[] = array("DIV" => "edit_policy", "TAB" => GetMessage("main_user_edit_policy"), "ICON"=>"main_user_edit", "TITLE"=>GetMessage("main_user_edit_policy_title"));
}
$aTabs[] = array("DIV" => "edit3", "TAB" => GetMessage("USER_PERSONAL_INFO"), "ICON"=>"main_user_edit", "TITLE"=>GetMessage("USER_PERSONAL_INFO"));
$aTabs[] = array("DIV" => "edit4", "TAB" => GetMessage("MAIN_USER_TAB4"), "ICON"=>"main_user_edit", "TITLE"=>GetMessage("USER_WORK_INFO"));
$aTabs[] = array("DIV" => "edit_rating", "TAB" => GetMessage("USER_RATING_INFO"), "ICON"=>"main_user_edit", "TITLE"=>GetMessage("USER_RATING_INFO"));

$i = 1;
$db_opt_res = CModule::GetList();
while ($opt_res = $db_opt_res->Fetch())
{
	$mdir = $opt_res["ID"];
	if (file_exists($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/".$mdir) && is_dir($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/".$mdir))
	{
		$ofile = $_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/".$mdir."/options_user_settings.php";
		if(file_exists($ofile))
		{
			IncludeModuleLangFile($ofile);
			$mname = str_replace(".", "_", $mdir);
			$aTabs[] = array("DIV" => "edit_".$mname, "TAB" => GetMessage($mname."_TAB"), "ICON"=>"main_user_edit", "TITLE"=>GetMessage($mname."_TAB_TITLE"));
			$i++;
		}
	}
}

if(($editable && $ID!=$USER->GetID()) || $USER->IsAdmin())
	$aTabs[] = array("DIV" => "edit".($i+5), "TAB" => GetMessage("MAIN_USER_TAB5"), "ICON"=>"main_user_edit", "TITLE"=>GetMessage("USER_ADMIN_NOTES"));

//Add user fields tab only when there is fields defined or user has rights for adding new field
if(
	(!empty($USER_FIELD_MANAGER->GetUserFields($PROPERTY_ID))) ||
	($USER_FIELD_MANAGER->GetRights($PROPERTY_ID) >= "W")
)
{
	$aTabs[] = $USER_FIELD_MANAGER->EditFormTab($PROPERTY_ID);
}

$tabControl = new CAdminForm("user_edit", $aTabs);

if(
	$_SERVER["REQUEST_METHOD"]=="POST"
	&& (
		!empty($_POST["save"])
		|| !empty($_POST["apply"])
		|| (isset($_POST["Update"]) && $_POST["Update"]=="Y")
		|| !empty($_POST["save_and_add"])
	)
	&& $editable
	&& check_bitrix_sessid()
)
{
	global $adminSidePanelHelper;

	if(COption::GetOptionString('main', 'use_encrypted_auth', 'N') == 'Y')
	{
		//possible encrypted user password
		$sec = new CRsaSecurity();
		if(($arKeys = $sec->LoadKeys()))
		{
			$sec->SetKeys($arKeys);
			$errno = $sec->AcceptFromForm(array('NEW_PASSWORD', 'NEW_PASSWORD_CONFIRM'));
			if($errno == CRsaSecurity::ERROR_SESS_CHECK)
				$strError .= GetMessage("main_profile_sess_expired").'<br />';
			elseif($errno < 0)
				$strError .= GetMessage("main_profile_decode_err", array("#ERRCODE#"=>$errno)).'<br />';
		}
	}

	$new = null;
	if($strError == '')
	{
		$user = new CUser;

		$arPERSONAL_PHOTO = $_FILES["PERSONAL_PHOTO"];
		$arWORK_LOGO = $_FILES["WORK_LOGO"];

		$arUser = false;
		if($ID > 0 && $COPY_ID <= 0)
		{
			$dbUser = CUser::GetById($ID);
			$arUser = $dbUser->Fetch();
		}

		if($arUser)
		{
			$arPERSONAL_PHOTO["old_file"] = $arUser["PERSONAL_PHOTO"];
			$arPERSONAL_PHOTO["del"] = $_POST["PERSONAL_PHOTO_del"] ?? '';

			$arWORK_LOGO["old_file"] = $arUser["WORK_LOGO"];
			$arWORK_LOGO["del"] = $_POST["WORK_LOGO_del"] ?? '';
		}

		$arFields = array(
			"TITLE" => $_POST["TITLE"] ?? '',
			"NAME" => $_POST["NAME"] ?? '',
			"LAST_NAME" => $_POST["LAST_NAME"] ?? '',
			"SECOND_NAME" => $_POST["SECOND_NAME"] ?? '',
			"EMAIL" => $_POST["EMAIL"] ?? '',
			"LOGIN" => $_POST["LOGIN"] ?? '',
			"PERSONAL_PROFESSION" => $_POST["PERSONAL_PROFESSION"] ?? '',
			"PERSONAL_WWW" => $_POST["PERSONAL_WWW"] ?? '',
			"PERSONAL_ICQ" => $_POST["PERSONAL_ICQ"] ?? '',
			"PERSONAL_GENDER" => $_POST["PERSONAL_GENDER"] ?? '',
			"PERSONAL_BIRTHDAY" => $_POST["PERSONAL_BIRTHDAY"] ?? '',
			"PERSONAL_PHOTO" => $arPERSONAL_PHOTO,
			"PERSONAL_PHONE" => $_POST["PERSONAL_PHONE"] ?? '',
			"PERSONAL_FAX" => $_POST["PERSONAL_FAX"] ?? '',
			"PERSONAL_MOBILE" => $_POST["PERSONAL_MOBILE"] ?? '',
			"PERSONAL_PAGER" => $_POST["PERSONAL_PAGER"] ?? '',
			"PERSONAL_STREET" => $_POST["PERSONAL_STREET"] ?? '',
			"PERSONAL_MAILBOX" => $_POST["PERSONAL_MAILBOX"] ?? '',
			"PERSONAL_CITY" => $_POST["PERSONAL_CITY"] ?? '',
			"PERSONAL_STATE" => $_POST["PERSONAL_STATE"] ?? '',
			"PERSONAL_ZIP" => $_POST["PERSONAL_ZIP"] ?? '',
			"PERSONAL_COUNTRY" => $_POST["PERSONAL_COUNTRY"] ?? '',
			"PERSONAL_NOTES" => $_POST["PERSONAL_NOTES"] ?? '',
			"WORK_COMPANY" => $_POST["WORK_COMPANY"] ?? '',
			"WORK_DEPARTMENT" => $_POST["WORK_DEPARTMENT"] ?? '',
			"WORK_POSITION" => $_POST["WORK_POSITION"] ?? '',
			"WORK_WWW" => $_POST["WORK_WWW"] ?? '',
			"WORK_PHONE" => $_POST["WORK_PHONE"] ?? '',
			"WORK_FAX" => $_POST["WORK_FAX"] ?? '',
			"WORK_PAGER" => $_POST["WORK_PAGER"] ?? '',
			"WORK_STREET" => $_POST["WORK_STREET"] ?? '',
			"WORK_MAILBOX" => $_POST["WORK_MAILBOX"] ?? '',
			"WORK_CITY" => $_POST["WORK_CITY"] ?? '',
			"WORK_STATE" => $_POST["WORK_STATE"] ?? '',
			"WORK_ZIP" => $_POST["WORK_ZIP"] ?? '',
			"WORK_COUNTRY" => $_POST["WORK_COUNTRY"] ?? '',
			"WORK_PROFILE" => $_POST["WORK_PROFILE"] ?? '',
			"WORK_LOGO" => $arWORK_LOGO,
			"WORK_NOTES" => $_POST["WORK_NOTES"] ?? '',
			"AUTO_TIME_ZONE" => (
				isset($_POST["AUTO_TIME_ZONE"]) && ($_POST["AUTO_TIME_ZONE"] == "Y" || $_POST["AUTO_TIME_ZONE"] == "N")
					? $_POST["AUTO_TIME_ZONE"]
					: ""
			),
			"XML_ID" => $_POST["XML_ID"] ?? '',
			"PHONE_NUMBER" => $_POST["PHONE_NUMBER"] ?? '',
			"PASSWORD_EXPIRED" => $_POST["PASSWORD_EXPIRED"] ?? '',
		);

		if(isset($_POST["TIME_ZONE"]))
			$arFields["TIME_ZONE"] = $_POST["TIME_ZONE"];

		if($USER->CanDoOperation('edit_all_users') || $USER->CanDoOperation('edit_subordinate_users'))
		{
			if (!empty($_POST["LID"]))
				$arFields["LID"] = $_POST["LID"];

			if(isset($_POST["LANGUAGE_ID"]))
				$arFields["LANGUAGE_ID"] = $_POST["LANGUAGE_ID"];

			if(isset($_POST['EXTERNAL_AUTH_ID']))
				$arFields['EXTERNAL_AUTH_ID'] = $_POST["EXTERNAL_AUTH_ID"];

			if ($ID == 1 && $COPY_ID <= 0)
			{
				$arFields["ACTIVE"] = "Y";
				$arFields["BLOCKED"] = "N";
			}
			else
			{
				$arFields["ACTIVE"] = $_POST["ACTIVE"] ?? null;
				$arFields["BLOCKED"] = $_POST["BLOCKED"] ?? null;
			}

			if($showGroupTabs && isset($_POST["GROUP_ID_NUMBER"]))
			{
				$GROUP_ID_NUMBER = intval($_POST["GROUP_ID_NUMBER"]);
				$GROUP_ID = array();
				$ind = -1;
				for ($i = 0; $i <= $GROUP_ID_NUMBER; $i++)
				{
					if (isset($_POST["GROUP_ID_ACT_".$i]) && $_POST["GROUP_ID_ACT_".$i] == "Y")
					{
						$gr_id = intval($_POST["GROUP_ID_".$i] ?? 0);

						if($gr_id == 1 && !$USER->IsAdmin())
							continue;

						if ($USER->CanDoOperation('edit_subordinate_users') && !$USER->CanDoOperation('edit_all_users') && !in_array($gr_id, $arUserSubordinateGroups))
							continue;

						$ind++;
						$GROUP_ID[$ind]["GROUP_ID"] = $gr_id;
						$GROUP_ID[$ind]["DATE_ACTIVE_FROM"] = $_POST["GROUP_ID_FROM_".$i];
						$GROUP_ID[$ind]["DATE_ACTIVE_TO"] = $_POST["GROUP_ID_TO_".$i];
					}
				}

				if ($ID == "1" && $COPY_ID<=0)
				{
					$ind++;
					$GROUP_ID[$ind]["GROUP_ID"] = 1;
					$GROUP_ID[$ind]["DATE_ACTIVE_FROM"] = false;
					$GROUP_ID[$ind]["DATE_ACTIVE_TO"] = false;
				}

				$arFields["GROUP_ID"]=$GROUP_ID;
			}

			if ($ID != $USER->GetID() || $USER->IsAdmin())
			{
				$arFields["ADMIN_NOTES"] = $_POST["ADMIN_NOTES"] ?? '';
			}
		}

		if (!empty($_POST["NEW_PASSWORD"]))
		{
			$arFields["PASSWORD"] = $_POST["NEW_PASSWORD"];
			$arFields["CONFIRM_PASSWORD"] = $_POST["NEW_PASSWORD_CONFIRM"] ?? '';
		}

		$USER_FIELD_MANAGER->EditFormAddFields($PROPERTY_ID, $arFields);
		if($ID>0 && $COPY_ID<=0)
		{
			$res = $user->Update($ID, $arFields);
		}
		elseif($USER->CanDoOperation('edit_all_users') || $USER->CanDoOperation('edit_subordinate_users'))
		{
			$ID = $user->Add($arFields);
			$res = ($ID > 0);
			$new = "Y";
		}
		if ($USER->CanDoOperation('edit_ratings') && ($selfEdit || $ID!=$USER->GetID()) && is_array($_POST['RATING_BONUS'] ?? null))
		{
			foreach ($_POST['RATING_BONUS'] as $ratingId => $ratingBonus)
			{
				if ($new == "Y" && $ratingBonus == 0)
				{
					continue;
				}

				$arParam = array(
					'RATING_ID' => $ratingId,
					'ENTITY_ID' => $ID,
					'BONUS' => $ratingBonus,
				);
				CRatings::UpdateRatingUserBonus($arParam);
			}
		}

		$strError .= $user->LAST_ERROR;
		if ($APPLICATION->GetException())
		{
			$err = $APPLICATION->GetException();
			$strError .= $err->GetString();
			$APPLICATION->ResetException();
		}
	}

	if($strError == '' && $ID>0)
	{
		if (!empty($_REQUEST["profile_module_id"]) && is_array($_REQUEST["profile_module_id"]))
		{
			$db_opt_res = CModule::GetList();
			while ($opt_res = $db_opt_res->Fetch())
			{
				if (in_array($opt_res["ID"], $_REQUEST["profile_module_id"]))
				{
					$mdir = $opt_res["ID"];
					if (file_exists($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/".$mdir) && is_dir($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/".$mdir))
					{
						$ofile = $_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/".$mdir."/options_user_settings_set.php";
						if (file_exists($ofile))
						{
							$MODULE_RIGHT = $APPLICATION->GetGroupRight($mdir);
							if ($MODULE_RIGHT>="R")
							{
								include($ofile);
								$mname = str_replace(".", "_", $mdir);
								if(!${$mname."_res"})
								{
									$res = false;
									if($APPLICATION->GetException())
									{
										$err = $APPLICATION->GetException();
										$strError .= $err->GetString();
										$APPLICATION->ResetException();
									}
									else
									{
										$strError .= ${$mname."WarningTmp"};
									}
								}
							}
						}
					}
				}
			}
		}

		if($strError == '' && $res)
		{
			if (isset($_POST["user_info_event"]) && $_POST["user_info_event"] == "Y")
			{
				$arMess = false;
				$res_site = CSite::GetByID($_POST["LID"] ?? '');
				if($res_site_arr = $res_site->Fetch())
					$arMess = IncludeModuleLangFile(__FILE__, $res_site_arr["LANGUAGE_ID"], true);

				if($new == "Y")
				{
					$text = ($arMess !== false? $arMess["ACCOUNT_INSERT"] : GetMessage("ACCOUNT_INSERT"));
				}
				else
				{
					$text = ($arMess !== false? $arMess["ACCOUNT_UPDATE"] : GetMessage("ACCOUNT_UPDATE"));
				}
				CUser::SendUserInfo($ID, $_POST["LID"] ?? '', $text, true);
			}

			if ($adminSidePanelHelper->isAjaxRequest())
			{
				$adminSidePanelHelper->sendSuccessResponse("base", array("ID" => $ID, "COPY_ID" => "0"));
			}
			else
			{
				if($USER->CanDoOperation('edit_all_users') || $USER->CanDoOperation('edit_subordinate_users') || ($USER->CanDoOperation('edit_own_profile') && $ID==$uid))
				{
					if (!empty($_POST["save"]))
						LocalRedirect($strRedirect_admin);
					elseif (!empty($_POST["apply"]))
						LocalRedirect($strRedirect."&ID=".$ID."&".$tabControl->ActiveTabParam());
					elseif (!empty($_POST["save_and_add"]))
						LocalRedirect($strRedirect."&ID=0&".$tabControl->ActiveTabParam());
				}
				elseif($new=="Y")
					LocalRedirect($strRedirect."&ID=".$ID."&".$tabControl->ActiveTabParam());
			}
		}
	}

	if ($strError)
		$adminSidePanelHelper->sendJsonErrorResponse($strError);
}

$showDataFromForm = ($strError != '' || !$res);

$userData = [
	'ACTIVE' => 'Y',
	'BLOCKED' => 'N',
	'LID' => CSite::GetDefSite(),
	'TITLE' => '',
	'NAME' => '',
	'LAST_NAME' => '',
	'SECOND_NAME' => '',
	'EMAIL' => '',
	'LOGIN' => '',
	'DATE_REGISTER' => '',
	'TIMESTAMP_X' => '',
	'LAST_LOGIN' => '',
	'PHONE_NUMBER' => '',
	'PASSWORD_EXPIRED' => 'N',
	'EXTERNAL_AUTH_ID' => '',
	'PERSONAL_PROFESSION' => '',
	'PERSONAL_WWW' => '',
	'PERSONAL_ICQ' => '',
	'PERSONAL_GENDER' => '',
	'PERSONAL_BIRTHDAY' => '',
	'PERSONAL_PHOTO' => '',
	'PERSONAL_PHONE' => '',
	'PERSONAL_FAX' => '',
	'PERSONAL_MOBILE' => '',
	'PERSONAL_PAGER' => '',
	'PERSONAL_COUNTRY' => '',
	'PERSONAL_STATE' => '',
	'PERSONAL_CITY' => '',
	'PERSONAL_ZIP' => '',
	'PERSONAL_STREET' => '',
	'PERSONAL_MAILBOX' => '',
	'PERSONAL_NOTES' => '',
	'WORK_COMPANY' => '',
	'WORK_WWW' => '',
	'WORK_DEPARTMENT' => '',
	'WORK_POSITION' => '',
	'WORK_PROFILE' => '',
	'WORK_LOGO' => '',
	'WORK_PHONE' => '',
	'WORK_FAX' => '',
	'WORK_PAGER' => '',
	'WORK_COUNTRY' => '',
	'WORK_STATE' => '',
	'WORK_CITY' => '',
	'WORK_ZIP' => '',
	'WORK_STREET' => '',
	'WORK_MAILBOX' => '',
	'WORK_NOTES' => '',
	'GROUP_ID' => [],
	'XML_ID' => '',
	'LANGUAGE_ID' => '',
	'AUTO_TIME_ZONE' => '',
	'TIME_ZONE' => '',
	'ADMIN_NOTES' => '',
	'NEW_PASSWORD' => '',
	'NEW_PASSWORD_CONFIRM' => '',
];

$checkboxes = [
	'ACTIVE' => 1,
	'BLOCKED' => 1,
	'PASSWORD_EXPIRED' => 1,
];

$userResult = CUser::GetByID($ID);
if ($userRow = $userResult->Fetch())
{
	foreach ($userData as $key => $value)
	{
		$userData[$key] = $userRow[$key] ?? $value;
	}

	if ($phone = UserPhoneAuthTable::getRowById($ID))
	{
		$userData['PHONE_NUMBER'] = $phone['PHONE_NUMBER'];
	}

	$dbUserGroup = CUser::GetUserGroupList($ID);
	while ($arUserGroup = $dbUserGroup->Fetch())
	{
		$userData['GROUP_ID'][(int)$arUserGroup['GROUP_ID']]['DATE_ACTIVE_FROM'] = $arUserGroup['DATE_ACTIVE_FROM'];
		$userData['GROUP_ID'][(int)$arUserGroup['GROUP_ID']]['DATE_ACTIVE_TO'] = $arUserGroup['DATE_ACTIVE_TO'];
	}
}
else
{
	$ID = 0;
}

if ($COPY_ID > 0)
{
	$userData['PERSONAL_PHOTO'] = '';
	$userData['WORK_LOGO'] = '';
}

if ($showDataFromForm)
{
	foreach ($userData as $key => $value)
	{
		if ($key == 'PERSONAL_PHOTO' || $key == 'WORK_LOGO')
		{
			continue;
		}
		if (isset($_POST[$key]) || isset($checkboxes[$key]))
		{
			$userData[$key] = $_POST[$key] ?? '';
		}
	}

	$GROUP_ID_NUMBER = (int)($_POST['GROUP_ID_NUMBER'] ?? 0);
	$userData['GROUP_ID'] = [];
	for ($i = 0; $i <= $GROUP_ID_NUMBER; $i++)
	{
		if (($_POST['GROUP_ID_ACT_'.$i] ?? '') == 'Y')
		{
			$groupId = (int)($_POST['GROUP_ID_'.$i] ?? 0);
			$userData['GROUP_ID'][$groupId]['DATE_ACTIVE_FROM'] = $_POST['GROUP_ID_FROM_'.$i] ?? '';
			$userData['GROUP_ID'][$groupId]['DATE_ACTIVE_TO'] = $_POST['GROUP_ID_TO_'.$i] ?? '';
		}
	}
}

if($ID>0 && $COPY_ID<=0)
	$APPLICATION->SetTitle(GetMessage("EDIT_USER_TITLE", array("#ID#"=>$ID)));
else
	$APPLICATION->SetTitle(GetMessage("NEW_USER_TITLE"));

require_once ($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/include/prolog_admin_after.php");

$aMenu = array();
if($canViewUserList)
{
	$aMenu[] = array(
		"TEXT"	=> GetMessage("RECORD_LIST"),
		"LINK"	=> "user_admin.php?lang=".LANGUAGE_ID."&set_default=Y",
		"ICON"	=> "btn_list",
		"TITLE"	=> GetMessage("RECORD_LIST_TITLE"),
	);
}

if($USER->CanDoOperation('edit_php') && $ID != $USER->GetID())
{
	$aMenu[] = array(
		"ICON" => "",
		"TEXT" => GetMessage("MAIN_ADMIN_AUTH"),
		"TITLE" => GetMessage("MAIN_ADMIN_AUTH_TITLE"),
		"LINK" => "user_edit.php?lang=".LANGUAGE_ID."&ID=".$ID."&action=authorize&".bitrix_sessid_get()
	);
}

if($USER->CanDoOperation('edit_all_users'))
{
	$aMenu[] = array(
		"ICON" => "",
		"TEXT" => GetMessage("MAIN_USER_EDIT_HISTORY"),
		"TITLE" => GetMessage("MAIN_USER_EDIT_HISTORY_TITLE"),
		"LINK" => "profile_history.php?lang=".LANGUAGE_ID."&find_user_id=".$ID."&set_filter=Y"
	);
	$aMenu[] = array(
		"ICON" => "",
		"TEXT" => GetMessage('main_user_edit_devices'),
		"TITLE" => GetMessage('main_user_edit_devices_title'),
		"LINK" => "user_devices.php?lang=" . LANGUAGE_ID . "&USER_ID=" . $ID . "&apply_filter=Y"
	);
}

if($USER->CanDoOperation('edit_all_users') || $USER->CanDoOperation('edit_subordinate_users'))
{
	if ($ID>0 && $COPY_ID<=0)
	{
		$aMenu[] = array(
			"TEXT"	=> GetMessage("MAIN_NEW_RECORD"),
			"LINK"	=> "user_edit.php?lang=".LANGUAGE_ID,
			"ICON"	=> "btn_new",
			"TITLE"	=> GetMessage("MAIN_NEW_RECORD_TITLE"),
		);
		$aMenu[] = array(
			"TEXT"	=> GetMessage("MAIN_COPY_RECORD"),
			"LINK"	=> "user_edit.php?lang=".LANGUAGE_ID.htmlspecialcharsbx("&COPY_ID=").$ID,
			"ICON"	=> "btn_copy",
			"TITLE"	=> GetMessage("MAIN_COPY_RECORD_TITLE"),
		);

		if ($ID!=1)
		{
			$aMenu[] = array(
				"TEXT"	=> GetMessage("MAIN_DELETE_RECORD"),
				"LINK"	=> "javascript:if(confirm('".GetMessage("MAIN_DELETE_RECORD_CONF")."')) window.location='user_admin.php?action=delete&ID=".$ID."&lang=".LANGUAGE_ID."&".bitrix_sessid_get()."';",
				"ICON"	=> "btn_delete",
				"TITLE"	=> GetMessage("MAIN_DELETE_RECORD_TITLE"),
			);
		}
	}
}

$context = new CAdminContextMenu($aMenu);
$context->Show();

if ($e = $APPLICATION->GetException())
	$message = new CAdminMessage(GetMessage("MAIN_ERROR_SAVING"), $e);
if($message)
	echo $message->Show();
if($strError != '')
{
	$e = new CAdminException(array(array('text' => $strError)));
	$message = new CAdminMessage(GetMessage("MAIN_ERROR_SAVING"), $e);
	echo $message->Show();
	//CAdminMessage::ShowMessage(Array("MESSAGE"=>$strError, "HTML"=>true, "TYPE"=>"ERROR"));
}

//We have to explicitly call calendar and editor functions because
//first output may be discarded by form settings
$tabControl->BeginPrologContent();
if(method_exists($USER_FIELD_MANAGER, 'showscript'))
	echo $USER_FIELD_MANAGER->ShowScript();
CAdminCalendar::ShowScript();
$tabControl->EndPrologContent();
$tabControl->BeginEpilogContent();
?>
<?=bitrix_sessid_post()?>
<input type="hidden" name="Update" value="Y">
<input type="hidden" name="COPY_ID" value=<?= $COPY_ID?>>
<?php
$tabControl->EndEpilogContent();

$limitUsersCount = 0;
$users_cnt = 0;
$formAttributes = '';
if ($ID <= 0)
{
	$license = Application::getInstance()->getLicense();
	$users_cnt = $license->getActiveUsersCount();
	$limitUsersCount = $license->getMaxUsers();

	if ($limitUsersCount > 0 && $limitUsersCount <= $users_cnt)
	{
?>
<script>
function BxCheckUsers(form)
{
	if (form.elements['UF_DEPARTMENT[]'])
	{
		var multiselect = form.elements['UF_DEPARTMENT[]'];
		for (var i in multiselect.options)
		{
			var option = multiselect.options[i];
			if (option.selected && option.value > 0)
			{
				alert('<?=GetMessageJS("USER_EDIT_WARNING_MAX")?>');
				break;
			}
		}
	}
}
</script>
<?php
		$formAttributes = 'onsubmit="BxCheckUsers(this)"';
	}
}

$tabControl->Begin(array(
	"FORM_ACTION" => $APPLICATION->GetCurPage()."?ID=".intval($ID)."&lang=".LANGUAGE_ID,
	"FORM_ATTRIBUTES" => $formAttributes,
));

$tabControl->BeginNextFormTab();

$tabControl->AddViewField('DATE_REGISTER', GetMessage('USER_EDIT_DATE_REGISTER'), ($ID > 0 && $COPY_ID <= 0 ? htmlspecialcharsbx($userData['DATE_REGISTER']) : ''));
$tabControl->AddViewField('LAST_UPDATE', GetMessage('LAST_UPDATE'), ($ID > 0 && $COPY_ID <= 0 ? htmlspecialcharsbx($userData['TIMESTAMP_X']) : ''));
$tabControl->AddViewField('LAST_LOGIN', GetMessage('LAST_LOGIN'), ($ID > 0 && $COPY_ID <= 0 ? htmlspecialcharsbx($userData['LAST_LOGIN']) : ''));

if($ID != 1 || $COPY_ID > 0):
	$tabControl->BeginCustomField("ACTIVE", GetMessage('ACTIVE'));
?>
	<tr>
		<td><?= $tabControl->GetCustomLabelHTML()?></td>
		<td>
		<?php if($canSelfEdit):?>
			<input type="checkbox" name="ACTIVE" value="Y"<?php if ($userData['ACTIVE'] == 'Y') echo ' checked'?>>
		<?php else:?>
			<input type="checkbox" <?php if ($userData['ACTIVE'] == 'Y') echo ' checked'?> disabled>
			<input type="hidden" name="ACTIVE" value="<?= htmlspecialcharsbx($userData['ACTIVE']) ?>">
		<?php endif;?>
	</tr>
<?php
	$tabControl->EndCustomField('ACTIVE', '<input type="hidden" name="ACTIVE" value="'.htmlspecialcharsbx($userData['ACTIVE']).'">');
else:
	$tabControl->HideField('ACTIVE');
endif;

$tabControl->BeginCustomField("BLOCKED", GetMessage("main_user_edit_blocked"));
?>
	<tr>
		<td><?= $tabControl->GetCustomLabelHTML()?></td>
		<td>
		<?php if($canSelfEdit):?>
			<input type="checkbox" name="BLOCKED" value="Y"<?php if ($userData['BLOCKED'] == 'Y') echo ' checked'?>>
		<?php else:?>
			<input type="checkbox" <?php if ($userData['BLOCKED'] == 'Y') echo ' checked'?> disabled>
			<input type="hidden" name="BLOCKED" value="<?= htmlspecialcharsbx($userData['BLOCKED']) ?>">
		<?php endif;?>
		</td>
	</tr>
<?php
$tabControl->EndCustomField('BLOCKED', '<input type="hidden" name="BLOCKED" value="'.htmlspecialcharsbx($userData['BLOCKED']).'">');

$emailRequired = (COption::GetOptionString("main", "new_user_email_required", "Y") != "N");
$phoneRequired = (COption::GetOptionString("main", "new_user_phone_required", "N") == "Y");

$tabControl->AddEditField('TITLE', GetMessage('USER_EDIT_TITLE'), false, ['size' => 30], $userData['TITLE'], true);
$tabControl->AddEditField('NAME', GetMessage('NAME'), false, ['size' => 30], $userData['NAME'], true);
$tabControl->AddEditField('LAST_NAME', GetMessage('LAST_NAME'), false, ['size' => 30], $userData['LAST_NAME'], true);
$tabControl->AddEditField('SECOND_NAME', GetMessage('SECOND_NAME'), false, ['size' => 30], $userData['SECOND_NAME'], true);
$tabControl->AddEditField('EMAIL', GetMessage('EMAIL'), $emailRequired, ['size' => 30], $userData['EMAIL'], true);
$tabControl->AddEditField('LOGIN', GetMessage('LOGIN'), true, ['size' => 30], $userData['LOGIN'], true);
$tabControl->AddEditField('PHONE_NUMBER', GetMessage('main_user_edit_phone_number'), $phoneRequired, ['size' => 30], $userData['PHONE_NUMBER'], true);

$tabControl->BeginCustomField("PASSWORD", GetMessage('NEW_PASSWORD_REQ'), true);

$bSecure = false;
if(!CMain::IsHTTPS() && COption::GetOptionString('main', 'use_encrypted_auth', 'N') == 'Y')
{
	$sec = new CRsaSecurity();
	if(($arKeys = $sec->LoadKeys()))
	{
		$sec->SetKeys($arKeys);
		$sec->AddToForm('user_edit_form', array('NEW_PASSWORD', 'NEW_PASSWORD_CONFIRM'));
		$bSecure = true;
	}
}
?>
	<tr id="bx_pass_row" style="display:<?=($userData['EXTERNAL_AUTH_ID'] != '' ? 'none' : '')?>;"<?php if($ID<=0 || $COPY_ID>0):?> class="adm-detail-required-field"<?php endif?>>
		<td><?= GetMessage('NEW_PASSWORD_REQ')?>:</td>
		<td><input type="password" name="NEW_PASSWORD" size="30" maxlength="255" value="<?= htmlspecialcharsbx($userData['NEW_PASSWORD']) ?>" autocomplete="new-password" style="vertical-align:middle;">
<?php if($bSecure):?>
				<span class="bx-auth-secure" id="bx_auth_secure" title="<?= GetMessage("AUTH_SECURE_NOTE")?>" style="display:none">
					<div class="bx-auth-secure-icon"></div>
				</span>
				<noscript>
				<span class="bx-auth-secure" title="<?= GetMessage("AUTH_NONSECURE_NOTE")?>">
					<div class="bx-auth-secure-icon bx-auth-secure-unlock"></div>
				</span>
				</noscript>
<script>
document.getElementById('bx_auth_secure').style.display = 'inline-block';
</script>
<?php endif?>
		</td>
	</tr>
	<tr id="bx_pass_confirm_row" style="display:<?=($userData['EXTERNAL_AUTH_ID'] != '' ? 'none' : '')?>;"<?php if($ID<=0 || $COPY_ID>0):?> class="adm-detail-required-field"<?php endif?>>
		<td><?= GetMessage('NEW_PASSWORD_CONFIRM')?></td>
		<td><input type="password" name="NEW_PASSWORD_CONFIRM" size="30" maxlength="255" value="<?= htmlspecialcharsbx($userData['NEW_PASSWORD_CONFIRM']) ?>" autocomplete="new-password"></td>
	</tr>
<?php
$tabControl->EndCustomField("PASSWORD");

$tabControl->AddCheckBoxField('PASSWORD_EXPIRED', GetMessage('main_user_edit_pass_expired'), false, ['Y', 'N'], ($userData['PASSWORD_EXPIRED'] == 'Y'));
?>
<?php if($USER->CanDoOperation('view_all_users')):?>
<?php
	$arAuthList = array();
	$rExtAuth = CUser::GetExternalAuthList();
	while($arExtAuth = $rExtAuth->GetNext())
		$arAuthList[$arExtAuth['ID']] = $arExtAuth;

	if ($userData['EXTERNAL_AUTH_ID'] != '' && !array_key_exists($userData['EXTERNAL_AUTH_ID'], $arAuthList))
		$arAuthList[$userData['EXTERNAL_AUTH_ID']] = ['ID' => $userData['EXTERNAL_AUTH_ID'], 'NAME' => $userData['EXTERNAL_AUTH_ID']];

	if(!empty($arAuthList)):

		$tabControl->BeginCustomField("EXTERNAL_AUTH_ID", GetMessage('MAIN_USERED_AUTH_TYPE'));
?>
		<tr>
		<td><?= $tabControl->GetCustomLabelHTML()?></td>
		<td>
<script>
function BXAuthSwitch(val)
{
	BX('bx_user_info_event').disabled = (val != '');
	BX('bx_pass_row').style.display = BX('bx_pass_confirm_row').style.display = (val == ''? '':'none');
}
</script>
			<select id="bx_EXTERNAL_AUTH_ID" name="EXTERNAL_AUTH_ID"<?php if(!$canSelfEdit) echo " disabled"?> onchange="BXAuthSwitch(this.value)">
				<option value=""><?= GetMessage("MAIN_USERED_AUTH_INT")?></option>
				<?php foreach($arAuthList as $arExtAuth):?>
				<option value="<?=$arExtAuth['ID']?>"<?php if ($userData['EXTERNAL_AUTH_ID'] == $arExtAuth['ID']) echo ' selected';?>><?=$arExtAuth['NAME']?></option>
				<?php endforeach;?>
			</select>
		</td>
		</tr>
<?php
		$tabControl->EndCustomField('EXTERNAL_AUTH_ID', '<input type="hidden" name="EXTERNAL_AUTH_ID" value="'.htmlspecialcharsbx($userData['EXTERNAL_AUTH_ID']).'">');

	endif;
endif;

$tabControl->AddEditField('XML_ID', GetMessage('MAIN_USER_EDIT_EXT'), false, ['size' => 30, 'maxlength' => 255], $userData['XML_ID'], true);
?>
<?php
if($USER->CanDoOperation('view_subordinate_users') || $USER->CanDoOperation('view_all_users') || $USER->CanDoOperation('edit_all_users') || $USER->CanDoOperation('edit_subordinate_users')):
	$tabControl->BeginCustomField("LID", GetMessage("MAIN_DEFAULT_SITE"));
?>
	<tr>
		<td><?= $tabControl->GetCustomLabelHTML()?></td>
		<?php
		$dis = '';
		if (!$canSelfEdit)
		{
			$dis = " disabled";
		}
		?>
		<td><?=CSite::SelectBox("LID", $userData['LID'], "", "", "style=\"width:220px\"".$dis);?></td>
	</tr>
<?php
	$tabControl->EndCustomField('LID', '<input type="hidden" name="LID" value="'.htmlspecialcharsbx($userData['LID']).'">');

	$langOptions = array("" => GetMessage("user_edit_lang_not_set"));
	$languages = LanguageTable::getList(array("filter" => array("ACTIVE" => "Y"), "order" => array("SORT" => "ASC", "NAME" => "ASC")));
	while($language = $languages->fetch())
	{
		$langOptions[$language["LID"]] = htmlspecialcharsbx($language["NAME"]);
	}
	$tabControl->AddDropDownField('LANGUAGE_ID', GetMessage('user_edit_lang'), false, $langOptions, $userData['LANGUAGE_ID']);

	$params = array('id="bx_user_info_event"');
	if (!$canSelfEdit || $userData['EXTERNAL_AUTH_ID'] != '')
	{
		$params[] = "disabled";
	}

	$tabControl->AddCheckBoxField(
		"user_info_event",
		GetMessage('INFO_FOR_USER'),
		false,
		"Y",
		(isset($_REQUEST["user_info_event"]) && $_REQUEST["user_info_event"] == "Y"),
		$params
	);
endif;

if(CTimeZone::Enabled())
{
	$tabControl->AddSection("USER_TIME_ZONE", GetMessage("user_edit_time_zones"));
	$tabControl->AddDropDownField('AUTO_TIME_ZONE', GetMessage('user_edit_time_zones_auto'), false, ['' => GetMessage('user_edit_time_zones_auto_def'), 'Y' => GetMessage('user_edit_time_zones_auto_yes'), 'N' => GetMessage('user_edit_time_zones_auto_no')], $userData['AUTO_TIME_ZONE'], ['onchange="this.form.TIME_ZONE.disabled=(this.value != \'N\')"']);
	$tabControl->AddDropDownField('TIME_ZONE', GetMessage('user_edit_time_zones_zones'), false, CTimeZone::GetZones(), $userData['TIME_ZONE'], ($userData['AUTO_TIME_ZONE'] != 'N' ? ['disabled'] : []));
}
?>
<?php
if($showGroupTabs):
	$tabControl->BeginNextFormTab();
	$tabControl->BeginCustomField("GROUP_ID", GetMessage("user_edit_form_groups"));
?>
	<tr>
		<td colspan="2" align="center">
			<table border="0" cellpadding="0" cellspacing="0" class="internal" style="width:80%;">
			<tr class="heading">
				<td colspan="2"><?= GetMessage("TBL_GROUP")?></td>
				<td><?=GetMessage('TBL_GROUP_DATE')?></td>
			</tr>
			<?php
			$ind = -1;
			$dbGroups = CGroup::GetList("c_sort", "asc", array("ANONYMOUS" => "N"));
			while ($arGroups = $dbGroups->Fetch())
			{
				$arGroups["ID"] = intval($arGroups["ID"]);
				if ($arGroups["ID"] == 2)
				{
					continue;
				}
				if (!$USER->CanDoOperation('edit_all_users') && $USER->CanDoOperation('edit_subordinate_users') && !in_array($arGroups["ID"], $arUserSubordinateGroups))
				{
					continue;
				}
				if ($arGroups["ID"] == 1 && !$USER->IsAdmin())
				{
					continue;
				}
				$ind++;
				?>
				<tr>
					<td>
						<input type="hidden" name="GROUP_ID_<?=$ind?>" value="<?=$arGroups["ID"]?>" /><input type="checkbox" name="GROUP_ID_ACT_<?=$ind?>" id="GROUP_ID_ACT_ID_<?=$ind?>" value="Y"<?php
						if (array_key_exists($arGroups["ID"], $userData['GROUP_ID']))
							echo " checked=\"checked\"";
						?> />
					</td>
					<td class="align-left">
						<label for="GROUP_ID_ACT_ID_<?= $ind ?>"><?=htmlspecialcharsbx($arGroups["NAME"])?> [<a href="/bitrix/admin/group_edit.php?ID=<?=$arGroups["ID"]?>&lang=<?=LANGUAGE_ID?>" title="<?=GetMessage("MAIN_VIEW_GROUP")?>"><?= $arGroups["ID"] ?></a>]</label>
					</td>
					<td>
						<?= CalendarDate("GROUP_ID_FROM_".$ind, (array_key_exists($arGroups["ID"], $userData['GROUP_ID']) ? htmlspecialcharsbx($userData['GROUP_ID'][$arGroups["ID"]]["DATE_ACTIVE_FROM"]) : ""), $tabControl->GetFormName(), "22")?>
						<?= CalendarDate("GROUP_ID_TO_".$ind, (array_key_exists($arGroups["ID"], $userData['GROUP_ID']) ? htmlspecialcharsbx($userData['GROUP_ID'][$arGroups["ID"]]["DATE_ACTIVE_TO"]) : ""), $tabControl->GetFormName(), "22")?>
					</td>
				</tr>
				<?php
			}
			?>
		</table><input type="hidden" name="GROUP_ID_NUMBER" value="<?= $ind ?>"></td>
	</tr>
<?php
	$tabControl->EndCustomField("GROUP_ID");

	$tabControl->BeginNextFormTab();

	$tabControl->BeginCustomField("GROUP_POLICY", GetMessage("main_user_edit_policy_field"));

	foreach (CUser::getPolicy($ID) as $rule):
?>
	<tr>
		<td width="50%">
			<?= htmlspecialcharsbx($rule->getTitle()) ?><?php if ($rule->getGroupId() > 0): ?>
				[<a href="group_edit.php?ID=<?= $rule->getGroupId() ?>&amp;lang=<?= LANGUAGE_ID ?>" title="<?= GetMessage("MAIN_VIEW_GROUP")?> "><?= $rule->getGroupId()?></a>]<?php endif ?>:</td>
		<td><b>
			<?php
				if ($rule instanceof Policy\BooleanRule)
				{
					echo ($rule->getValue() ? GetMessage("main_user_edit_policy_yes") : GetMessage("main_user_edit_policy_no"));
				}
				else
				{
					echo htmlspecialcharsbx($rule->getValue());
				}
			?></b>
		</td>
	</tr>
<?php
	endforeach;
	$tabControl->EndCustomField("GROUP_POLICY");
endif;
?>
<?php
$tabControl->BeginNextFormTab();

$tabControl->AddEditField('PERSONAL_PROFESSION', GetMessage('USER_PROFESSION'), false, ['size' => 30, 'maxlength' => 255], $userData['PERSONAL_PROFESSION'], true);
$tabControl->AddEditField('PERSONAL_WWW', GetMessage('USER_WWW'), false, ['size' => 30, 'maxlength' => 255], $userData['PERSONAL_WWW'], true);
$tabControl->AddEditField('PERSONAL_ICQ', GetMessage('USER_ICQ'), false, ['size' => 30, 'maxlength' => 255], $userData['PERSONAL_ICQ'], true);
$tabControl->AddDropDownField('PERSONAL_GENDER', GetMessage('USER_GENDER'), false, ['' => GetMessage('USER_DONT_KNOW'), 'M' => GetMessage('USER_MALE'), 'F' => GetMessage('USER_FEMALE')], $userData['PERSONAL_GENDER']);
$tabControl->AddCalendarField('PERSONAL_BIRTHDAY', GetMessage('USER_BIRTHDAY_DT').':', $userData['PERSONAL_BIRTHDAY']);
$tabControl->AddFileField('PERSONAL_PHOTO', GetMessage('USER_PHOTO'), $userData['PERSONAL_PHOTO'], ['iMaxW' => 150, 'iMaxH' => 150]);

$tabControl->AddSection("USER_PHONES", GetMessage("USER_PHONES"));
$tabControl->AddEditField('PERSONAL_PHONE', GetMessage('USER_PHONE'), false, ['size' => 30, 'maxlength' => 255], $userData['PERSONAL_PHONE'], true);
$tabControl->AddEditField('PERSONAL_FAX', GetMessage('USER_FAX'), false, ['size' => 30, 'maxlength' => 255], $userData['PERSONAL_FAX'], true);
$tabControl->AddEditField('PERSONAL_MOBILE', GetMessage('USER_MOBILE'), false, ['size' => 30, 'maxlength' => 255], $userData['PERSONAL_MOBILE'], true);
$tabControl->AddEditField('PERSONAL_PAGER', GetMessage('USER_PAGER'), false, ['size' => 30, 'maxlength' => 255], $userData['PERSONAL_PAGER'], true);

$tabControl->AddSection("USER_POST_ADDRESS", GetMessage("USER_POST_ADDRESS"));
$tabControl->BeginCustomField("PERSONAL_COUNTRY", GetMessage('USER_COUNTRY'));
?>
	<tr>
		<td><?= $tabControl->GetCustomLabelHTML()?></td>
		<td><?= SelectBoxFromArray("PERSONAL_COUNTRY", GetCountryArray(), $userData['PERSONAL_COUNTRY'], GetMessage("USER_DONT_KNOW"));?></td>
	</tr>
<?php
$tabControl->EndCustomField('PERSONAL_COUNTRY', '<input type="hidden" name="PERSONAL_COUNTRY" value="'.htmlspecialcharsbx($userData['PERSONAL_COUNTRY']).'">');
$tabControl->AddEditField('PERSONAL_STATE', GetMessage('USER_STATE'), false, ['size' => 30, 'maxlength' => 255], $userData['PERSONAL_STATE'], true);
$tabControl->AddEditField('PERSONAL_CITY', GetMessage('USER_CITY'), false, ['size' => 30, 'maxlength' => 255], $userData['PERSONAL_CITY'], true);
$tabControl->AddEditField('PERSONAL_ZIP', GetMessage('USER_ZIP'), false, ['size' => 30, 'maxlength' => 255], $userData['PERSONAL_ZIP'], true);
$tabControl->AddTextField('PERSONAL_STREET', GetMessage('USER_STREET'), $userData['PERSONAL_STREET'], ['cols' => 40, 'rows' => 3], false, true);
$tabControl->AddEditField('PERSONAL_MAILBOX', GetMessage('USER_MAILBOX'), false, ['size' => 30, 'maxlength' => 255], $userData['PERSONAL_MAILBOX'], true);
$tabControl->AddTextField('PERSONAL_NOTES', GetMessage('USER_NOTES'), $userData['PERSONAL_NOTES'], ['cols' => 40, 'rows' => 5], false, true);

$tabControl->BeginNextFormTab();

$tabControl->AddEditField('WORK_COMPANY', GetMessage('USER_COMPANY'), false, ['size' => 30, 'maxlength' => 255], $userData['WORK_COMPANY'], true);
$tabControl->AddEditField('WORK_WWW', GetMessage('USER_WWW'), false, ['size' => 30, 'maxlength' => 255], $userData['WORK_WWW'], true);
$tabControl->AddEditField('WORK_DEPARTMENT', GetMessage('USER_DEPARTMENT'), false, ['size' => 30, 'maxlength' => 255], $userData['WORK_DEPARTMENT'], true);
$tabControl->AddEditField('WORK_POSITION', GetMessage('USER_POSITION'), false, ['size' => 30, 'maxlength' => 255], $userData['WORK_POSITION'], true);
$tabControl->AddTextField('WORK_PROFILE', GetMessage('USER_WORK_PROFILE'), $userData['WORK_PROFILE'], ['cols' => 40, 'rows' => 5], false, true);
$tabControl->AddFileField('WORK_LOGO', GetMessage('USER_LOGO'), $userData['WORK_LOGO'], ['iMaxW' => 150, 'iMaxH' => 150]);

$tabControl->AddSection("USER_WORK_PHONES", GetMessage("USER_PHONES"));
$tabControl->AddEditField('WORK_PHONE', GetMessage('USER_PHONE'), false, ['size' => 30, 'maxlength' => 255], $userData['WORK_PHONE'], true);
$tabControl->AddEditField('WORK_FAX', GetMessage('USER_FAX'), false, ['size' => 30, 'maxlength' => 255], $userData['WORK_FAX'], true);
$tabControl->AddEditField('WORK_PAGER', GetMessage('USER_PAGER'), false, ['size' => 30, 'maxlength' => 255], $userData['WORK_PAGER'], true);

$tabControl->AddSection("USER_WORK_POST_ADDRESS", GetMessage("USER_POST_ADDRESS"));
$tabControl->BeginCustomField("WORK_COUNTRY", GetMessage('USER_COUNTRY'));
?>
	<tr>
		<td><?= $tabControl->GetCustomLabelHTML()?></td>
		<td><?= SelectBoxFromArray("WORK_COUNTRY", GetCountryArray(), $userData['WORK_COUNTRY'], GetMessage("USER_DONT_KNOW"));?></td>
	</tr>
<?php
$tabControl->EndCustomField('WORK_COUNTRY', '<input type="hidden" name="WORK_COUNTRY" value="'.htmlspecialcharsbx($userData['WORK_COUNTRY']).'">');
$tabControl->AddEditField('WORK_STATE', GetMessage('USER_STATE'), false, ['size' => 30, 'maxlength' => 255], $userData['WORK_STATE'], true);
$tabControl->AddEditField('WORK_CITY', GetMessage('USER_CITY'), false, ['size' => 30, 'maxlength' => 255], $userData['WORK_CITY'], true);
$tabControl->AddEditField('WORK_ZIP', GetMessage('USER_ZIP'), false, ['size' => 30, 'maxlength' => 255], $userData['WORK_ZIP'], true);
$tabControl->AddTextField('WORK_STREET', GetMessage('USER_STREET'), $userData['WORK_STREET'], ['cols' => 40, 'rows' => 3], false, true);
$tabControl->AddEditField('WORK_MAILBOX', GetMessage('USER_MAILBOX'), false, ['size' => 30, 'maxlength' => 255], $userData['WORK_MAILBOX'], true);
$tabControl->AddTextField('WORK_NOTES', GetMessage('USER_NOTES'), $userData['WORK_NOTES'], ['cols' => 40, 'rows' => 5], false, true);

$tabControl->BeginNextFormTab();
$tabControl->BeginCustomField("RATING_BOX", GetMessage("USER_RATING_INFO"));
?>
	<tr>
		<td width="100%" colspan="100%">
		<?php
		$i = 1;
		$aTabs2 = array();
		$arRatings = array();
		$rsRatings = CRatings::GetList(array('ID' => 'ASC'), array('ACTIVE' => 'Y', 'ENTITY_ID' => 'USER'));
		$showNote = false;
		while ($arRatingsTmp = $rsRatings->GetNext())
		{
			if ($arRatingsTmp['AUTHORITY'] == 'Y')
				$arRatingsTmp['NAME'] = '<span class="required">[A]</span> '.$arRatingsTmp['NAME'];

			$aTabs2[] = array("DIV"=>"rating_".$i, "TAB" => $arRatingsTmp['NAME'], "TITLE" => GetMessage('RATING_TAB_INFO'));
			$arRatings[$arRatingsTmp['ID']] = $arRatingsTmp;
			$i++;
		}

		if (is_array($arRatings) && !empty($arRatings))
		{
			$ratingWeightType 	 = COption::GetOptionString("main", "rating_weight_type", "auto");
			$authorityRatingId	 = CRatings::GetAuthorityRating();
			$arAuthorityUserProp = CRatings::GetRatingUserPropEx($authorityRatingId, $ID);

			$viewTabControl = new CAdminViewTabControl("tabControlRating", $aTabs2);
			$viewTabControl->Begin();

			foreach($arRatings as $ratingId => $arRating)
			{
				$arRatingResult = CRatings::GetRatingResult($ratingId, $ID);
				$arRatingUserProp = CRatings::GetRatingUserPropEx($ratingId, $ID);

				$viewTabControl->BeginNextTab();
				?>
					<table cellspacing="7" cellpadding="0" border="0" width="100%" class="edit-table">
				<?php
					if ($USER->CanDoOperation('edit_ratings') && ($selfEdit || $ID!=$uid)):
						$showNote = true;
				?>
					<tr>
						<td class="field-name" width="40%"><?=GetMessage('RATING_BONUS')?>:<sup><span class="required">1</span></sup></td>
						<td><?=InputType('text', "RATING_BONUS[$ratingId]", floatval($arRatingUserProp['BONUS']), false, false, '', 'size="5" maxlength="11"')?> <?=($ratingWeightType == 'auto'? 'x '.GetMessage('RATING_NORM_VOTE_WEIGHT'): '')?></td>
					</tr>
				<?php endif; ?>
					<tr>
						<td class="field-name" width="40%"><?=GetMessage('RATING_POSITION')?>:</td>
						<td>
						<?php $APPLICATION->IncludeComponent(
							"bitrix:rating.result", "",
							array(
								"RESULT_TYPE" 			=> 'POSITION',
								"SHOW_RATING_NAME"		=> 'N',
								"RATING_ID" 			=> $arRatingResult['RATING_ID'] ?? null,
								"ENTITY_ID" 			=> $arRatingResult['ENTITY_ID'] ?? null,
								"CURRENT_POSITION" 		=> $arRatingResult['CURRENT_POSITION'] ?? null,
								"PREVIOUS_POSITION" 	=> $arRatingResult['PREVIOUS_POSITION'] ?? null,
							),
							null,
							array("HIDE_ICONS" => "Y")
						);?>
						</td>
					</tr>
					<tr>
						<td class="field-name" width="40%"><?=GetMessage('RATING_CURRENT_VALUE')?>:</td>
						<td><?=floatval($arRatingResult['CURRENT_VALUE'] ?? 0);?></td>
					</tr>
					<tr>
						<td class="field-name" width="40%"><?=GetMessage('RATING_PREVIOUS_VALUE')?>:</td>
						<td><?=floatval($arRatingResult['PREVIOUS_VALUE'] ?? 0);?></td>
					</tr>
					<?php
						if ($arRating['AUTHORITY'] == 'Y')
						{
							if ($ratingWeightType == 'auto')
							{
								$voteWeight = COption::GetOptionString("main", "rating_vote_weight", 1);
								$voteWeightUser = $voteWeight>0? round(floatval($arAuthorityUserProp['VOTE_WEIGHT']/$voteWeight), 4): 0;
								$communitySize = COption::GetOptionString("main", "rating_community_size", 1);
								$communityAuthority = COption::GetOptionString("main", "rating_community_authority", 1);
								$normVoteCount = $voteWeight>0?floor(floatval($arRatingResult['CURRENT_VALUE'] ?? 0)/$voteWeight): 0;
								$sRatingAuthorityWeight = COption::GetOptionString("main", "rating_authority_weight_formula", 'Y');
								if ($sRatingAuthorityWeight == 'Y')
									$voteWeightAuthority = $communityAuthority > 0? round($communitySize*$voteWeightUser/$communityAuthority,4): 0;
								else
									$voteWeightAuthority = 1;
								?>
								<tr>
									<td class="field-name" width="40%"><?=GetMessage('RATING_VOTE_NORM_VOTE')?>:</td>
									<td><?=$normVoteCount?></td>
								</tr>
								<?php
							}
							else
							{
								$voteWeightAuthority = round(floatval($arAuthorityUserProp['VOTE_WEIGHT']), 4);
							}
							?>
							<tr>
								<td class="field-name" width="40%"><?=GetMessage('RATING_VOTE_WEIGHT')?>:</td>
								<td><?=round(floatval($arAuthorityUserProp['VOTE_WEIGHT']), 4)?></td>
							</tr>
							<tr>
								<td class="field-name" width="40%"><?=GetMessage('RATING_VOTE_WEIGHT_AUTHORITY')?>:</td>
								<td><?=$voteWeightAuthority?></td>
							</tr>
							<tr>
								<td class="field-name" width="40%"><?=GetMessage('RATING_VOTE_AUTHORITY_COUNT')?>:</td>
								<td><?=floatval($arRatingUserProp['VOTE_COUNT']);?></td>
							</tr>
							<?php
						}
						?>
					</table>
				<?php
			}
			$viewTabControl->End();
		}
		else
		{
			echo GetMessage('RATING_NOT_AVAILABLE');
		}
		?>
		</td>
	</tr>
<?php
$tabControl->EndCustomField("RATING_BOX");

$db_opt_res = CModule::GetList();
while ($opt_res = $db_opt_res->Fetch())
{
	$mdir = $opt_res["ID"];
	if (file_exists($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/".$mdir) && is_dir($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/".$mdir))
	{
		$ofile = $_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/".$mdir."/options_user_settings.php";
		if (file_exists($ofile))
		{
			$mname = str_replace(".", "_", $mdir);
			$tabControl->BeginNextFormTab();
			$tabControl->BeginCustomField("MODULE_TAB_".$mname, GetMessage($mname."_TAB"));
			include($ofile);
			$tabControl->EndCustomField("MODULE_TAB_".$mname);
		}
	}
}

if (($editable && $ID!=$USER->GetID()) || $USER->IsAdmin()):
	$tabControl->BeginNextFormTab();
	$tabControl->BeginCustomField("ADMIN_NOTES", GetMessage("USER_ADMIN_NOTES"));
?>
	<tr>
		<td align="center" colspan="2"><textarea name="ADMIN_NOTES" cols="50" rows="10" style="width:100%;"><?= htmlspecialcharsbx($userData['ADMIN_NOTES']) ?></textarea></td>
	</tr>
<?php
	$tabControl->EndCustomField('ADMIN_NOTES', '<input type="hidden" name="ADMIN_NOTES" value="'.htmlspecialcharsbx($userData['ADMIN_NOTES']).'">');
endif;

//Add user fields tab only when there is fields defined or user has rights for adding new field
if(
	(!empty($USER_FIELD_MANAGER->GetUserFields($PROPERTY_ID))) ||
	($USER_FIELD_MANAGER->GetRights($PROPERTY_ID) >= "W")
)
{
	$tabControl->BeginNextFormTab();
	$tabControl->ShowUserFields($PROPERTY_ID, $ID, $showDataFromForm);
}

if($canViewUserList)
{
	$tabControl->Buttons(array(
		"disabled" => !$editable,
		"btnSaveAndAdd" => true,
		"back_url" => "user_admin.php?lang=".LANGUAGE_ID,
	));
}
else
{
	$tabControl->Buttons(array(
		"disabled" => !$editable,
		"btnSave" => false,
		"btnCancel" => false,
		"btnSaveAndAdd" => true,
	));
}

$tabControl->Show();

$tabControl->ShowWarnings($tabControl->GetName(), $message);
?>

<?php if ($showNote):?>
<?php if(!defined('BX_PUBLIC_MODE') || BX_PUBLIC_MODE != 1):?>
<?= BeginNote();?>
<span class="required">1</span> <?= GetMessage("RATING_BONUS_NOTICE")?><br>
<?= EndNote();?>
<?php endif;?>
<?php endif;?>

<?php
require_once ($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/include/epilog_admin.php");
