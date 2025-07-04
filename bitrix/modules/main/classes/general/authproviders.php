<?php

/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage main
 * @copyright 2001-2025 Bitrix
 */

use Bitrix\Main\Application;
use Bitrix\Main\Type\DateTime;
use Bitrix\Main\UserGroupTable;

IncludeModuleLangFile(__FILE__);

class CAuthProvider
{
	protected $id;

	public function DeleteByUser($USER_ID)
	{
		CAccess::RecalculateForUser($USER_ID, $this->id);
	}

	public function DeleteAll()
	{
		CAccess::RecalculateForProvider($this->id);
	}

	public function AddCode($userId, $code)
	{
		CAccess::AddCode($userId, $this->id, $code);
	}

	public function RemoveCode($userId, $code)
	{
		CAccess::RemoveCode($userId, $this->id, $code);
	}
}

interface IProviderInterface
{
	public function GetFormHtml($arParams=false);
	public function GetNames($arCodes);
}

class CGroupAuthProvider extends CAuthProvider implements IProviderInterface
{
	const ID = 'group';

	public function __construct()
	{
		$this->id = self::ID;
	}

	public function UpdateCodes($USER_ID)
	{
		global $DB;

		$USER_ID = intval($USER_ID);

		$connection = Application::getConnection();
		$helper = $connection->getSqlHelper();

		$sql = $helper->getInsertIgnore(
			'b_user_access',
			'(USER_ID, PROVIDER_ID, ACCESS_CODE)',
			"SELECT UG.USER_ID, '".$DB->ForSQL($this->id)."', ".$DB->Concat("'G'", "UG.GROUP_ID")."
				FROM b_user_group UG, b_group G 
				WHERE UG.USER_ID=".$USER_ID."
					AND G.ID=UG.GROUP_ID
					AND G.ACTIVE='Y'
					AND ((UG.DATE_ACTIVE_FROM IS NULL) OR (UG.DATE_ACTIVE_FROM <= ".$DB->CurrentTimeFunction().")) 
					AND ((UG.DATE_ACTIVE_TO IS NULL) OR (UG.DATE_ACTIVE_TO >= ".$DB->CurrentTimeFunction().")) 
				UNION 
				SELECT ID, '".$DB->ForSQL($this->id)."', 'G2' 
				FROM b_user
				WHERE ID=".$USER_ID
		);

		$DB->Query($sql);
	}

	public static function OnAfterSetUserGroup($USER_ID, $groups)
	{
		$dates = [];
		foreach ($groups as $group)
		{
			if ($group['DATE_ACTIVE_FROM'] !== null)
			{
				$dates[(string)$group['DATE_ACTIVE_FROM']] = $group['DATE_ACTIVE_FROM'];
			}
			if ($group['DATE_ACTIVE_TO'] !== null)
			{
				$dates[(string)$group['DATE_ACTIVE_TO']] = $group['DATE_ACTIVE_TO'];
			}
		}

		CAccess::RecalculateForUser($USER_ID, self::ID);

		foreach ($dates as $date)
		{
			CAccess::RecalculateForUser($USER_ID, self::ID, $date);
		}
	}

	public static function RecalculateForGroup($ID, $checkTime = true)
	{
		$users = UserGroupTable::getList([
			'filter' => ['=GROUP_ID' => $ID],
			'cache' => ['ttl' => 3600],
		]);

		while ($user = $users->fetch())
		{
			if (($user['DATE_ACTIVE_FROM'] == '' && $user['DATE_ACTIVE_TO'] == '') || !$checkTime)
			{
				CAccess::RecalculateForUser($user["USER_ID"], self::ID);
			}
			else
			{
				if ($user['DATE_ACTIVE_FROM'] != '')
				{
					CAccess::RecalculateForUser($user["USER_ID"], self::ID, $user['DATE_ACTIVE_FROM']);
				}
				if ($user['DATE_ACTIVE_TO'] != '')
				{
					CAccess::RecalculateForUser($user["USER_ID"], self::ID, $user['DATE_ACTIVE_TO']);
				}
			}
		}
	}

	public function AjaxRequest()
	{
		global $USER;
		if(!$USER->CanDoOperation('view_groups'))
			return false;

		$elements = "";
		$arFinderParams = array(
			"PROVIDER" => $this->id,
			"TYPE" => 1,
		);

		$search = urldecode($_REQUEST['search']);

		$dbRes = CGroup::GetList('sort', 'asc', array("ANONYMOUS"=>"N", "NAME"=>$search));
		$dbRes->NavStart(13);
		while ($arGroup = $dbRes->NavNext(false))
		{
			$arItem = array(
				"ID" => "G".$arGroup["ID"],
				"NAME" => $arGroup["NAME"],
			);

			$elements .= CFinder::GetFinderItem($arFinderParams, $arItem);
		}
		return $elements;
	}

	public function GetFormHtml($arParams=false)
	{
		global $USER;

		if (isset($arParams["groups"]) && is_array($arParams["groups"]) && $arParams["groups"]["disabled"] == "true")
		{
			return false;
		}

		if(!$USER->CanDoOperation('view_groups'))
			return false;

		$elements = $last = "";
		$arFinderParams = array(
			"PROVIDER" => $this->id,
			"TYPE" => 1,
		);

		$arLRU = CAccess::GetLastRecentlyUsed($this->id);

		$res = CGroup::GetList('sort', 'asc', array("ANONYMOUS"=>"N"));
		while($arGroup = $res->Fetch())
		{
			$arItem = array(
				"ID" => "G".$arGroup["ID"],
				"NAME" => $arGroup["NAME"],
			);

			$element = CFinder::GetFinderItem($arFinderParams, $arItem);
			$elements .= $element;

			if(in_array($arItem["ID"], $arLRU))
				$last .= $element;
		}

		$arPanels = array(
			array(
				"NAME" => GetMessage("authprov_last"),
				"ELEMENTS" => $last,
			),
			array(
				"NAME" => GetMessage("authprov_all_groups"),
				"ELEMENTS" => $elements,
			),
			array(
				"NAME" => GetMessage("authprov_search"),
				"ELEMENTS" => CFinder::GetFinderItem(array("TYPE" => "text"), array("TEXT" => GetMessage("authprov_group_name"))),
				"SEARCH" => "Y",
			),
		);
		$html = CFinder::GetFinderAppearance($arFinderParams, $arPanels);

		return array("HTML"=>$html);
	}

	public function GetNames($arCodes)
	{
		$aID = array();
		foreach($arCodes as $code)
			if(preg_match('/^G[0-9]+$/', $code))
				$aID[] = substr($code, 1);

		if(!empty($aID))
		{
			$arResult = array();
			$res = CGroup::GetList('id', 'asc', array("ANONYMOUS"=>"N", "ID"=>implode("|", $aID)));
			while($arGroup = $res->Fetch())
			{
				$arResult["G".$arGroup["ID"]] = array("provider" => GetMessage("authprov_group_prov"), "name"=>$arGroup["NAME"]);
			}

			return $arResult;
		}
		return false;
	}
}

class CUserAuthProvider extends CAuthProvider implements IProviderInterface
{
	const ID = 'user';

	public function __construct()
	{
		$this->id = self::ID;
	}

	public function UpdateCodes($USER_ID)
	{
		global $DB;

		$USER_ID = intval($USER_ID);

		$connection = Application::getConnection();
		$helper = $connection->getSqlHelper();

		$sql = $helper->getInsertIgnore(
			'b_user_access',
			'(user_id, provider_id, access_code)',
			"select ID, '".$DB->ForSQL($this->id)."', 'U".$USER_ID."'
				from b_user
				where id=".$USER_ID
		);

		$DB->Query($sql);
	}

	public function AjaxRequest()
	{
		global $USER;
		if(!$USER->CanDoOperation('view_all_users'))
			return false;

		$search = urldecode($_REQUEST['search']);
		$elements = "";
		$arFinderParams = array(
			"PROVIDER" => $this->id,
			"TYPE" => 2,
		);

		$nameFormat = CSite::GetNameFormat(false);

		$arFilter = array(
			'ACTIVE' => 'Y',
			'NAME_SEARCH' => $search,
			'!EXTERNAL_AUTH_ID' => \Bitrix\Main\UserTable::getExternalUserTypes(),
		);

		if (
			IsModuleInstalled('intranet')
			|| COption::GetOptionString("main", "new_user_registration_email_confirmation", "N") == "Y"
		)
		{
			$arFilter['CONFIRM_CODE'] = false;
		}

		//be careful with field list because of CUser::FormatName()
		$dbRes = CUser::GetList('last_name', 'asc',
			$arFilter,
			array(
				"FIELDS" => array('ID', 'NAME', 'LAST_NAME', 'SECOND_NAME', 'LOGIN', 'EMAIL'),
				'NAV_PARAMS' => array('nTopCount' => 20),
			)
		);
		while ($arUser = $dbRes->NavNext(false))
		{
			$arItem = array(
				"ID" => "U".$arUser["ID"],
				"NAME" => CUser::FormatName($nameFormat, $arUser, true, false),
			);
			$elements .= CFinder::GetFinderItem($arFinderParams, $arItem);
		}
		return $elements;
	}

	public function GetFormHtml($arParams=false)
	{
		global $USER;

		if (isset($arParams["user"]) && is_array($arParams["user"]) && $arParams["user"]["disabled"] == "true")
		{
			return false;
		}

		if(!$USER->CanDoOperation('view_all_users'))
			return false;

		$elements = "";
		$arFinderParams = array(
			"PROVIDER" => $this->id,
			"TYPE" => 2,
		);

		$arLRU = CAccess::GetLastRecentlyUsed($this->id);
		if(!empty($arLRU))
		{
			foreach($arLRU as $i=>$val)
				$arLRU[$i] = substr($val, 1);

			$nameFormat = CSite::GetNameFormat(false);

			//be careful with field list because of CUser::FormatName()
			$res = CUser::GetList("LAST_NAME", "asc",
				array("ID" => implode("|", $arLRU)),
				array("FIELDS" => array('ID', 'NAME', 'LAST_NAME', 'SECOND_NAME', 'LOGIN', 'EMAIL'))
			);
			while($arUser = $res->Fetch())
			{
				$arItem = array(
					"ID" => "U".$arUser["ID"],
					"NAME" => CUser::FormatName($nameFormat, $arUser, true, false),
				);
				$elements .= CFinder::GetFinderItem($arFinderParams, $arItem);
			}
		}

		$arPanels = array(
			array(
				"NAME" => GetMessage("authprov_last"),
				"ELEMENTS" => $elements,
			),
			array(
				"NAME" => GetMessage("authprov_search"),
				"ELEMENTS" => CFinder::GetFinderItem(array("TYPE" => "text"), array("TEXT" => GetMessage("authprov_user"))),
				"SEARCH" => "Y",
			),
		);
		$html = CFinder::GetFinderAppearance($arFinderParams, $arPanels);

		return array("HTML"=>$html);
	}

	public function GetNames($arCodes)
	{
		$aID = array();
		foreach($arCodes as $code)
		{
			if(!isset($aID[$code]) && preg_match('/^U[0-9]+$/', $code))
			{
				$aID[$code] = substr($code, 1);
			}
		}

		if(!empty($aID))
		{
			$nameFormat = CSite::GetNameFormat(false);

			$arResult = array();
			//be careful with field list because of CUser::FormatName()
			$res = CUser::GetList('id', 'asc',
				array("ID" => implode("|", $aID)),
				array("FIELDS" => array('ID', 'NAME', 'LAST_NAME', 'SECOND_NAME', 'LOGIN', 'EMAIL'))
			);
			while($arUser = $res->Fetch())
			{
				$arResult["U".$arUser["ID"]] = array(
					"provider" => GetMessage("authprov_user1"),
					"name" => CUser::FormatName($nameFormat, $arUser, true, false),
				);
			}

			return $arResult;
		}
		return false;
	}
}

class COtherAuthProvider implements IProviderInterface
{
	public function GetFormHtml($arParams=false)
	{
		global $USER;

		if (isset($arParams["other"]) && is_array($arParams["other"]) && $arParams["other"]["disabled"] == "true")
		{
			return false;
		}

		$elements = "";
		$arFinderParams = array(
			"PROVIDER" => "other",
			"TYPE" => 3,
		);

		$arItem = array(
			"ID" => "U".$USER->GetID(),
			"AVATAR" => "/bitrix/js/main/core/images/access/avatar-user-auth.png",
			"NAME" => (($s = trim($USER->GetFormattedName(false, false))) <> ''? $s : $USER->GetLogin()),
			"DESC" => GetMessage("authprov_user_curr"),
		);
		$elements .= CFinder::GetFinderItem($arFinderParams, $arItem);

		if(!isset($arParams["other"]) || !is_array($arParams["other"]) || $arParams["other"]["disabled_cr"] != "true")
		{
			$arItem = array(
				"ID" => "CR",
				"AVATAR" => "/bitrix/js/main/core/images/access/avatar-user-author.png",
				"NAME" => GetMessage("authprov_author"),
				"DESC" => GetMessage("authprov_author_desc"),
			);
			$elements .= CFinder::GetFinderItem($arFinderParams, $arItem);
		}

		if(!isset($arParams["other"]) || !is_array($arParams["other"]) || $arParams["other"]["disabled_g2"] != "true")
		{
			$arItem = array(
				"ID" => "G2",
				"AVATAR" => "/bitrix/js/main/core/images/access/avatar-user-everyone.png",
				"NAME" => GetMessage("authprov_all"),
				"DESC" => GetMessage("authprov_all_desc"),
			);
			$elements .= CFinder::GetFinderItem($arFinderParams, $arItem);
		}

		if(!isset($arParams["other"]["disabled_au"]) || $arParams["other"]["disabled_au"] != "true")
		{
			$arItem = array(
				"ID" => "AU",
				"AVATAR" => "/bitrix/js/main/core/images/access/avatar-user-auth.png",
				"NAME" => GetMessage("authprov_authorized"),
				"DESC" => GetMessage("authprov_authorized_desc"),
			);
			$elements .= CFinder::GetFinderItem($arFinderParams, $arItem);
		}

		$arPanels = array(
			array(
				"NAME" => GetMessage("authprov_other"),
				"ELEMENTS" => $elements,
				"SELECTED" => "Y",
			),
		);
		$html = CFinder::GetFinderAppearance($arFinderParams, $arPanels);

		return array("HTML"=>$html);
	}

	public function GetNames($arCodes)
	{
		return array(
			"CR" => array("provider"=>"", "name"=>GetMessage("authprov_author")),
			"G2" => array("provider"=>"", "name"=>GetMessage("authprov_all")),
			"AU" => array("provider"=>"", "name"=>GetMessage("authprov_authorized")),
		);
	}
}
