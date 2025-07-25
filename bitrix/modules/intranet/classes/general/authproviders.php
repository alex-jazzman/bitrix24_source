<?php

/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage intranet
 * @copyright 2001-2023 Bitrix
 */

use Bitrix\Main\Application;

IncludeModuleLangFile(__FILE__);

class CIntranetAuthProvider extends CAuthProvider implements IProviderInterface
{
	const ID = 'intranet';

	public function __construct()
	{
		$this->id = self::ID;
	}

	public function UpdateCodes($USER_ID)
	{
		global $DB;

		$USER_ID = intval($USER_ID);

		if (!\Bitrix\Main\Loader::includeModule('humanresources'))
		{
			return;
		}

		$companyStructure = \Bitrix\HumanResources\Util\StructureHelper::getDefaultStructure();
		if ($companyStructure)
		{
			$userDepartments = \Bitrix\HumanResources\Service\Container::getNodeService()
				->getNodesByUserId($USER_ID)
				->filter(fn($node) => $node->type === \Bitrix\HumanResources\Type\NodeEntityType::DEPARTMENT)
			;

			if (!$userDepartments->empty())
			{
				$connection = Application::getConnection();
				$helper = $connection->getSqlHelper();

				$nodeIds = array_map(
					fn($node) => $node->id,
					iterator_to_array($userDepartments),
				);

				if (!empty($nodeIds))
				{
					//user's department ('D') and all departments above ('DR')
					$sql = $helper->getInsertIgnore(
						'b_user_access',
						'(USER_ID, PROVIDER_ID, ACCESS_CODE)',
						"SELECT " . $USER_ID . ", '" . $DB->ForSQL($this->id) . "', BAC.AC 
						FROM (
							SELECT DISTINCT bac.ACCESS_CODE as AC
FROM b_hr_structure_node sn
	     INNER JOIN b_hr_structure_node_backward_access_code bac on sn.ID = bac.NODE_ID
WHERE sn.ID IN (" . implode(',', $nodeIds) . ")
  AND sn.GLOBAL_ACTIVE = 'Y' AND sn.TYPE = 'DEPARTMENT'
UNION
SELECT REPLACE(bac.ACCESS_CODE, 'D', 'DR') as AC
FROM b_hr_structure_node sn
	     INNER JOIN b_hr_structure_node_path np ON np.CHILD_ID = sn.ID
	     INNER JOIN b_hr_structure_node_backward_access_code bac on np.PARENT_ID = bac.NODE_ID
WHERE sn.ID IN (" . implode(',', $nodeIds) . ") AND sn.GLOBAL_ACTIVE = 'Y' AND sn.TYPE = 'DEPARTMENT'
						) BAC",
					);
					$DB->Query($sql);
				}

				//intranet user himself ('IU')
				$sql = $helper->getInsertIgnore(
					'b_user_access',
					'(USER_ID, PROVIDER_ID, ACCESS_CODE)',
					"VALUES (" . $USER_ID . ", '" . $DB->ForSQL($this->id) . "', 'IU" . $USER_ID . "')",
				);
				$DB->Query($sql);

				$headRoleId = \Bitrix\HumanResources\Service\Container::getRoleHelperService()->getHeadRoleId();

				if (!$headRoleId)
				{
					return;
				}

				//if the user is a boss let's add all his subordinates ('IU')
				$sql = $helper->getInsertIgnore(
					'b_user_access',
					'(USER_ID, PROVIDER_ID, ACCESS_CODE)',
					"SELECT DISTINCT " . $USER_ID . ", '" . $DB->ForSQL($this->id) . "', " . $DB->Concat(
						"'IU'",
						"hsnm.ENTITY_ID",
					) . "
FROM b_hr_structure_node_member hsnm
	     JOIN b_hr_structure_node_member_role hsnmr
	          ON hsnm.ID = hsnmr.MEMBER_ID
	     JOIN b_hr_structure_node_path hsnmp
	          ON hsnmp.CHILD_ID = hsnm.NODE_ID
	     JOIN b_hr_structure_node_member hsnm2
	          ON hsnmp.PARENT_ID = hsnm2.NODE_ID AND hsnm2.ACTIVE = 'Y'
	     JOIN b_hr_structure_node_member_role hsnmr2
	          ON hsnm2.ID = hsnmr2.MEMBER_ID AND hsnmr2.ROLE_ID = " . $headRoleId . "
WHERE hsnm2.ENTITY_ID = " . $USER_ID . "
  AND hsnm2.ENTITY_TYPE = 'user'
  AND hsnm.ENTITY_TYPE = 'user'
  AND hsnm.ENTITY_ID <> " . $USER_ID,
				);

				$DB->Query($sql);
			}
		}
	}

	public static function OnSearchCheckPermissions()
	{
		global $USER;

		$res = CAccess::GetUserCodes($USER->GetID(), array("PROVIDER_ID"=>"intranet"));
		$arResult = array();
		while(($arr = $res->Fetch()))
			$arResult[] = $arr["ACCESS_CODE"];

		return $arResult;
	}

	public function AjaxRequest($arParams=false)
	{
		global $USER;
		if (
			!$USER->IsAuthorized()
//			|| CModule::IncludeModule('extranet') && !CExtranet::IsIntranetUser($arParams["SITE_ID"])
		)
			return false;

		$elements = "";
		if ($_REQUEST['action'] == 'structure-item')
		{
			$arFinderParams = Array(
				"PROVIDER" => $this->id,
				"TYPE" => 'structure-item',
			);
			//be careful with field list because of CUser::FormatName()
			if (
				CModule::IncludeModule('extranet')
				&& !CExtranet::IsIntranetUser($arParams["SITE_ID"])
			)
			{
				$arExtranetUsers = CExtranet::GetMyGroupsUsersFull(CExtranet::GetExtranetSiteID());
				$dbRes = new CDBResult;
				$dbRes->InitFromArray($arExtranetUsers);
			}
			else
			{
				$arFilter = array(
					'ACTIVE' => 'Y',
					'CONFIRM_CODE' => false,
					'UF_DEPARTMENT' => intval($_REQUEST['item']),
					'!EXTERNAL_AUTH_ID' => \Bitrix\Main\UserTable::getExternalUserTypes()
				);

				$dbRes = CUser::GetList(
					'last_name',
					'asc',
					$arFilter,
					array(
						"FIELDS" => array('ID', 'NAME', 'LAST_NAME', 'SECOND_NAME', 'LOGIN', 'EMAIL', 'PERSONAL_PHOTO', 'PERSONAL_GENDER', 'WORK_POSITION', 'PERSONAL_PROFESSION')
					)
				);
			}

			while ($arUser = $dbRes->Fetch())
			{
				$arPhoto = static::getUserPhoto((int)$arUser['PERSONAL_PHOTO'], (string)$arUser['PERSONAL_GENDER']);

				$arItem = Array(
					"ID" => "IU".$arUser["ID"],
					"NAME" => CUser::FormatName(CSite::GetNameFormat(false), $arUser, true, false),
					"AVATAR" => $arPhoto['CACHE']['src'] ?? '',
					"DESC" => $arUser['WORK_POSITION'] ?: $arUser['PERSONAL_PROFESSION'],
				);
				$elements .= CFinder::GetFinderItem($arFinderParams, $arItem);
			}
		}
		else
		{
			$search = urldecode($_REQUEST['search']);

			if (
				!CModule::IncludeModule('extranet')
				|| CExtranet::IsIntranetUser($arParams["SITE_ID"])
			)
			{
				$arFinderParams = Array(
					"PROVIDER" => $this->id,
					"TYPE" => 4,
				);

				$departmentRepository = \Bitrix\Intranet\Service\ServiceContainer::getInstance()
					->departmentRepository();
				$departments = $departmentRepository->getDepartmentsByName($search, 7);
				/** @var \Bitrix\Intranet\Entity\Department $department */
				foreach ($departments as $department)
				{
					$arItem = Array(
						"ID" => $department->getId(),
						"AVATAR" => "/bitrix/js/main/core/images/access/avatar-user-everyone.png",
						"NAME" => $department->getName(),
						"DESC" => GetMessage("authprov_group"),
						"CHECKBOX" => array(
							"D#ID#" => GetMessage("authprov_check_d"),
							"DR#ID#" => GetMessage("authprov_check_dr"),
						),
					);
					$elements .= CFinder::GetFinderItem($arFinderParams, $arItem);
				}
			}

			$arFinderParams = Array(
				"PROVIDER" => $this->id,
				"TYPE" => 3,
			);

			$arFilter = array(
				"ACTIVE" => "Y",
				"CONFIRM_CODE" => false,
				"NAME_SEARCH" => $search
			);

			$arExternalAuthId = array();
			if (IsModuleInstalled('socialservices'))
			{
				$arExternalAuthId[] = 'replica';
			}
			if (IsModuleInstalled('mail'))
			{
				$arExternalAuthId[] = 'email';
			}
			if (IsModuleInstalled('im'))
			{
				$arExternalAuthId[] = 'bot';
			}
			if (IsModuleInstalled('imconnector'))
			{
				$arExternalAuthId[] = 'imconnector';
			}
			if (!empty($arExternalAuthId))
			{
				$arFilter["!EXTERNAL_AUTH_ID"] = $arExternalAuthId;
			}

			if (
				CModule::IncludeModule('extranet')
				&& !CExtranet::IsIntranetUser($arParams["SITE_ID"])
			)
			{
				$arExtranetUsersId = CExtranet::GetMyGroupsUsers($arParams["SITE_ID"]);
				if (count($arExtranetUsersId) > 0)
				{
					$arFilter["ID"] = implode('|', $arExtranetUsersId);
				}
				else
				{
					$arFilter = false;
				}
			}
			else
			{
				$arFilter['!UF_DEPARTMENT'] = false;
			}

			if ($arFilter)
			{
				//be careful with field list because of CUser::FormatName()
				$dbRes = CUser::GetList('last_name', 'asc',
					$arFilter,
					array(
						"FIELDS" => array('ID', 'NAME', 'LAST_NAME', 'SECOND_NAME', 'LOGIN', 'EMAIL', 'PERSONAL_PHOTO', 'PERSONAL_GENDER', 'WORK_POSITION', 'PERSONAL_PROFESSION'),
						"NAV_PARAMS" => Array("nTopCount" => 7)
					)
				);
				while ($arUser = $dbRes->Fetch())
				{
					$arPhoto = static::getUserPhoto((int)$arUser['PERSONAL_PHOTO'], (string)$arUser['PERSONAL_GENDER']);

					$arItem = Array(
						"ID" => "IU".$arUser["ID"],
						"NAME" => CUser::FormatName(CSite::GetNameFormat(false), $arUser, true, false),
						"AVATAR" => $arPhoto['CACHE']['src'],
						"DESC" => $arUser['WORK_POSITION'] ?: $arUser['PERSONAL_PROFESSION'],
					);
					$elements .= CFinder::GetFinderItem($arFinderParams, $arItem);
				}
			}
		}

		return $elements;
	}

	public function GetFormHtml($arParams=false)
	{
		global $USER;
		if(
			!$USER->IsAuthorized()
//			|| CModule::IncludeModule('extranet') && !CExtranet::IsIntranetUser($arParams["SITE_ID"])
		)
			return false;

		$elements = '';
		$arElement = array();
		$arElements = array();
		$departmentRepository = \Bitrix\Intranet\Service\ServiceContainer::getInstance()
			->departmentRepository();

		$arLRU = CAccess::GetLastRecentlyUsed($this->id);
		if(!empty($arLRU))
		{
			$arFinderParams = Array(
				'PROVIDER' => $this->id,
				'TYPE' => 3,
			);
			$arLast = array();
			$arLastID = array();
			foreach($arLRU as $val)
			{
				if (mb_substr($val, 0, 2) == 'DR')
				{
					$id = mb_substr($val, 2);
					$arLast['DR'][] = $id;
					$arLastID[$id] = $id;
				}
				else if (mb_substr($val, 0, 1) == 'D')
				{
					$id = mb_substr($val, 1);
					$arLast['D'][] = $id;
					$arLastID[$id] = $id;
				}
				else if (mb_substr($val, 0, 2) == 'IU')
					$arLast['U'][] = mb_substr($val, 2);
			}

			$departments = $departmentRepository->findAllByIds($arLastID);
			/** @var \Bitrix\Intranet\Entity\Department $department */
			foreach ($departments as $department)
			{
				$adapter = [
					'ID' => (string)$department->getId(),
					'NAME' => $department->getName(),
				];
				$arElement[$adapter['ID']] = $adapter;
			}
			if (!empty($arLast['DR']))
			{
				foreach ($arLast['DR'] as $value)
				{
					$arItem = Array(
						"ID" => 'DR'.$arElement[$value]['ID'],
						"NAME" => $arElement[$value]['NAME'].': '.GetMessage("authprov_check_dr"),
						"AVATAR" => '/bitrix/js/main/core/images/access/avatar-user-everyone.png',
					);
					$arElements['DR'.$value] = CFinder::GetFinderItem($arFinderParams, $arItem);
				}
			}
			if (!empty($arLast['D']))
			{
				foreach ($arLast['D'] as $value)
				{
					$arItem = Array(
						"ID" => 'D'.$arElement[$value]['ID'],
						"NAME" => $arElement[$value]['NAME'].': '.GetMessage("authprov_check_d"),
						"AVATAR" => '/bitrix/js/main/core/images/access/avatar-user-everyone.png',
					);
					$arElements['D'.$value] = CFinder::GetFinderItem($arFinderParams, $arItem);
				}
			}
			if (!empty($arLast['U']))
			{
				//be careful with field list because of CUser::FormatName()
				$res = CUser::GetList("LAST_NAME", "asc",
					array("ID"=>implode("|", $arLast['U'])),
					array("FIELDS" => array('ID', 'NAME', 'LAST_NAME', 'SECOND_NAME', 'LOGIN', 'EMAIL', 'PERSONAL_PHOTO', 'PERSONAL_GENDER', 'WORK_POSITION', 'PERSONAL_PROFESSION'))
				);
				while($arUser = $res->Fetch())
				{
					$arPhoto = static::getUserPhoto((int)$arUser['PERSONAL_PHOTO'], (string)$arUser['PERSONAL_GENDER']);

					$arItem = Array(
						"ID" => "IU".$arUser["ID"],
						"NAME" => CUser::FormatName(CSite::GetNameFormat(false), $arUser, true, false),
						"AVATAR" => $arPhoto['CACHE']['src'],
						"DESC" => $arUser['WORK_POSITION'] ?: $arUser['PERSONAL_PROFESSION'],
					);
					$elements .= CFinder::GetFinderItem($arFinderParams, $arItem);
				}
			}

			foreach($arLRU as $val)
			{
				$elements .= $arElements[$val] ?? '';
			}
		}

		$arFinderParams = Array(
			'PROVIDER' => 'intranet',
			'TYPE' => 'structure',
		);
		$obCache = new CPHPCache();
		$IBlockID = COption::GetOptionInt('intranet', 'iblock_structure');
		$arSecFilter = array('IBLOCK_ID' => $IBlockID);
		$arStructure = array();
		$arSections = array();

		if (!CModule::IncludeModule('extranet') || CExtranet::IsIntranetUser())
		{
			$cache_id = md5(serialize($arSecFilter));
			$cacheDir = '/intranet';
			if($obCache->InitCache(30*86400, $cache_id, $cacheDir))
			{
				$vars = $obCache->GetVars();
				$arSections = $vars["SECTIONS"];
				$arStructure = $vars["STRUCTURE"];
			}
			elseif ($obCache->StartDataCache())
			{
				$departmentCollection = $departmentRepository->getAllTree();
				foreach ($departmentCollection as $department)
				{
					$iblockSectionID = $department->getParentId() ?? 0;

					if (!isset($arStructure[$iblockSectionID]) || !is_array($arStructure[$iblockSectionID]))
					{
						$arStructure[$iblockSectionID] = [$department->getId()];
					}
					else
					{
						$arStructure[$iblockSectionID][] = $department->getId();
					}

					$arSections[$department->getId()] = $department->toIblockArray();
				}
				global $CACHE_MANAGER;
				$CACHE_MANAGER->StartTagCache($cacheDir);
				$CACHE_MANAGER->RegisterTag("iblock_id_".$IBlockID);

				$CACHE_MANAGER->EndTagCache();
				$obCache->EndDataCache(array("SECTIONS" => $arSections, "STRUCTURE" => $arStructure));
			}
		}

		$arItem = self::InEmployeeDrawStructure($arStructure, $arSections, 0);
		$elementsStructure = CFinder::GetFinderItem($arFinderParams, $arItem);

		$arPanels = Array(
			Array(
				"NAME" => GetMessage("authprov_panel_last"),
				"ELEMENTS" => $elements,
			),
			Array(
				"NAME" => GetMessage("authprov_panel_group"),
				"ELEMENTS" => $elementsStructure,
			),
			Array(
				"NAME" => GetMessage("authprov_panel_search"),
				"ELEMENTS" => CFinder::GetFinderItem(Array("TYPE" => "text"), Array("TEXT" => GetMessage("authprov_panel_search_text"))),
				"SEARCH" => "Y",
			),
		);
		$html = CFinder::GetFinderAppearance($arFinderParams, $arPanels);

		return array("HTML"=>$html);
	}

	public function GetNames($arCodes)
	{
		$arID = array();
		foreach($arCodes as $code)
		{
			if(preg_match('/^IU([0-9]+)$/', $code, $match))
				$arID['U'][] = $match[1];
			else if(preg_match('/^(D|DR)([0-9]+)$/', $code, $match))
				$arID['D'][] = $match[2];
		}

		$arResult = array();
		if(!empty($arID['D']))
		{
			$departmentRepository = \Bitrix\Intranet\Service\ServiceContainer::getInstance()
				->departmentRepository();
			$departments = $departmentRepository->findAllByIds($arID['D']);
			/** @var \Bitrix\Intranet\Entity\Department $department */
			foreach($departments as $department)
			{
				$arResult["D".$department->getId()] = [
					"provider" => GetMessage("authprov_name_out_group"),
					"name" => $department->getName().": ".GetMessage("authprov_check_d")
				];
				$arResult["DR".$department->getId()] = [
					"provider" => GetMessage("authprov_name_out_group"),
					"name" => $department->getName().": ".GetMessage("authprov_check_dr")
				];
			}
		}
		if(!empty($arID['U']))
		{
			$res = CUser::GetList("id", '', array("ID"=>implode("|", $arID['U'])), array("FIELDS"=>array('ID', 'EMAIL', 'LOGIN', 'SECOND_NAME', 'LAST_NAME', 'NAME')));
			while($arUser = $res->Fetch())
				$arResult["IU".$arUser["ID"]] = array("provider"=>GetMessage("authprov_name_out_user1"), "name"=>CUser::FormatName(CSite::GetNameFormat(false), $arUser, true, false));
		}
		return !empty($arResult)? $arResult: false;
	}

	private static function InEmployeeDrawStructure($arStructure, $arSections, $key)
	{
		$bOpen = $key == 0;
		$bHideItem = $key == 0;
		$arItems = Array();
		foreach ($arStructure[$key] as $ID)
		{
			$arRes = $arSections[$ID];

			$arItem = Array(
				'TYPE' => 'category',
				'ID' => $arRes['ID'],
				'NAME' => $arRes['NAME'],
				'OPEN' => $ID != 'extranet'? $bOpen: false,
				'HIDE_ITEM' => $bHideItem,
				'CHECKBOX' => array(
					"D#ID#" => GetMessage("authprov_check_d"),
					"DR#ID#" => GetMessage("authprov_check_dr"),
				),
			);
			if (isset($arStructure[$ID]) && is_array($arStructure[$ID]))
			{
				$arItem['CHILD'] = self::InEmployeeDrawStructure($arStructure, $arSections, $ID);
			}
			$arItems[] = $arItem;
		}

		return $arItems;
	}

	public static function OnBeforeUserUpdate($arFields)
	{
		if (isset($arFields["UF_DEPARTMENT"]) && is_array($arFields["UF_DEPARTMENT"]))
		{
			// compare with the old data
			$user = CUser::GetByID($arFields["ID"]);
			if($userData = $user->Fetch())
			{
				if (!is_array($userData["UF_DEPARTMENT"]))
				{
					$userData["UF_DEPARTMENT"] = [];
				}

				// get rid of empty values
				$arFields["UF_DEPARTMENT"] = array_filter($arFields["UF_DEPARTMENT"]);

				// we need sort for arrays comparison
				sort($arFields["UF_DEPARTMENT"]);
				sort($userData["UF_DEPARTMENT"]);

				if ($arFields["UF_DEPARTMENT"] != $userData["UF_DEPARTMENT"])
				{
					// recalculate for user himself
					CAccess::RecalculateForUser($arFields["ID"], self::ID);

					// new and old departments differ - recalculate both sets of departments
					static::RecalculateManagers($userData["UF_DEPARTMENT"], $arFields["ID"]);
					static::RecalculateManagers($arFields["UF_DEPARTMENT"], $arFields["ID"]);
				}
			}
		}
	}

	public static function OnAfterUserAdd($arFields)
	{
		if (isset($arFields["UF_DEPARTMENT"]) && isset($arFields["ID"]))
		{
			// recalculate for user himself
			CAccess::RecalculateForUser($arFields["ID"], self::ID);

			// recalculate for users' managers
			static::RecalculateManagers($arFields["UF_DEPARTMENT"], $arFields["ID"]);
		}
	}

	protected static function RecalculateManagers($departments, $userId)
	{
		$managers = CIntranetUtils::GetDepartmentManager($departments, $userId, true);
		foreach ($managers as $manager)
		{
			CAccess::RecalculateForUser($manager["ID"], self::ID);
		}
	}

	/**
	 * @Deprecated
	 *
	 * Will be deleted after transferring department data to the "humanresources" module
	 *
	 * @param $arParams
	 * @return false|void
	 */
	public static function OnBeforeIBlockSectionUpdate($arFields)
	{
		if(COption::GetOptionString('intranet', 'iblock_structure', '') == $arFields['IBLOCK_ID'])
		{
			if(isset($arFields["IBLOCK_SECTION_ID"]) || isset($arFields["ACTIVE"]) || isset($arFields["UF_HEAD"]))
			{
				$res = CIBlockSection::GetList(
					array(),
					array('IBLOCK_ID' => $arFields['IBLOCK_ID'], 'ID' => $arFields['ID']),
					false,
					array('IBLOCK_SECTION_ID', 'ACTIVE', 'UF_HEAD')
				);
				if($arSect = $res->Fetch())
				{
					if(
						isset($arFields["IBLOCK_SECTION_ID"]) && $arSect["IBLOCK_SECTION_ID"] <> intval($arFields["IBLOCK_SECTION_ID"])
						|| isset($arFields["ACTIVE"]) && $arSect["ACTIVE"] <> $arFields["ACTIVE"]
					)
					{
						//departments structure's been changed
						CAccess::RecalculateForProvider(self::ID);
					}
					elseif(isset($arFields["UF_HEAD"]) && $arSect["UF_HEAD"] <> intval($arFields["UF_HEAD"]))
					{
						//department boss has been changed
						CAccess::RecalculateForUser($arFields["UF_HEAD"], self::ID);
						CAccess::RecalculateForUser($arSect["UF_HEAD"], self::ID);
					}
				}
			}
		}
		return true;
	}

	public static function OnAfterIBlockSectionDelete($arFields)
	{
		if(COption::GetOptionString('intranet', 'iblock_structure', '') == $arFields['IBLOCK_ID'])
		{
			//departments structure's been changed
			CAccess::RecalculateForProvider(self::ID);
		}
	}

	public static function GetProviders()
	{
		return array(
			array(
				"ID" => "intranet",
				"NAME" => GetMessage("authprov_name"),
				"PROVIDER_NAME" => "",
				"PREFIXES" => array(
					array(
						"pattern" => '^IU([0-9]+)$',
						"prefix" => GetMessage("authprov_name_out_user1"),
					),
					array(
						"pattern" => '^(D|DR)([0-9]+)$',
						"prefix" => GetMessage("authprov_name_out_group"),
					),
				),
				"SORT" => 300,
				"CLASS" => "CIntranetAuthProvider",
			),
		);
	}

	/**
	 * @param int $photo
	 * @param string $gender
	 * @return array
	 */
	protected static function getUserPhoto(int $photo, string $gender): array
	{
		$arPhoto = ['IMG' => ''];

		if (!$photo)
		{
			switch ($gender)
			{
				case "M":
					$suffix = "male";
					break;
				case "F":
					$suffix = "female";
					break;
				default:
					$suffix = "unknown";
			}
			$photo = COption::GetOptionInt("socialnetwork", "default_user_picture_" . $suffix, false, SITE_ID);
		}

		if ($photo > 0)
		{
			$arPhoto = CIntranetUtils::InitImage($photo, 30);
		}

		return $arPhoto;
	}
}
