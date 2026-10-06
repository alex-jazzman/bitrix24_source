<?php

IncludeModuleLangFile(__FILE__);

if (class_exists('lists'))
{
	return;
}

Class lists extends CModule
{
	var $MODULE_ID = "lists";
	var $MODULE_VERSION;
	var $MODULE_VERSION_DATE;
	var $MODULE_NAME;
	var $MODULE_DESCRIPTION;
	var $MODULE_CSS;
	var $MODULE_GROUP_RIGHTS = "N";

	var $errors = false;

	public function __construct()
	{
		$arModuleVersion = array();

		include(__DIR__.'/version.php');

		$this->MODULE_VERSION = $arModuleVersion["VERSION"];
		$this->MODULE_VERSION_DATE = $arModuleVersion["VERSION_DATE"];

		$this->MODULE_NAME = GetMessage("LISTS_MODULE_NAME");
		$this->MODULE_DESCRIPTION = GetMessage("LISTS_MODULE_DESCRIPTION");
	}

	function InstallDB($arParams = array())
	{
		/** @global CMain $APPLICATION */
		global $APPLICATION;

		$this->errors = false;

		$migrationResult = $this->installMigrations();
		if (!$migrationResult->isSuccess())
		{
			$this->errors = $migrationResult->getErrorMessages();
			$APPLICATION->ThrowException(implode("<br>", $this->errors));
			return false;
		}

		RegisterModule("lists");
		CModule::IncludeModule("lists");

		if (isset($arParams["INSTALL_DEMO_DATA"]) && $arParams["INSTALL_DEMO_DATA"] == "Y")
		{
			$this->installDemoData();
		}

		return true;
	}

	function installDemoData()
	{
		if(!CModule::IncludeModule("iblock"))
			return;

		$currentPermissions = CLists::GetPermission();
		unset($currentPermissions["bitrix_processes"]);
		unset($currentPermissions["lists"]);

		$socnet_iblock_type_id = COption::GetOptionString("lists", "socnet_iblock_type_id");
		$isSocnetInstalled = IsModuleInstalled('socialnetwork');

		$arTypes = array();
		if (empty($currentPermissions))
		{
			$arTypes[] = array(
				"ID" => "lists",
				"SECTIONS" => "Y",
				"IN_RSS" => "N",
				"SORT" => 80,
				"LANG" => array(),
			);
			$arTypes[] = array(
				"ID" => "bitrix_processes",
				"SECTIONS" => "Y",
				"IN_RSS" => "N",
				"SORT" => 90,
				"LANG" => array(),
			);
		}

		if ($isSocnetInstalled && $socnet_iblock_type_id == '')
		{
			$arTypes[] = array(
				"ID" => "lists_socnet",
				"SECTIONS" => "Y",
				"IN_RSS" => "N",
				"SORT" => 83,
				"LANG" => array(),
			);
		}

		$arLanguages = array();
		if (!empty($arTypes))
		{
			$rsLanguage = CLanguage::GetList();
			while ($arLanguage = $rsLanguage->Fetch())
			{
				$arLanguages[] = $arLanguage["LID"];
			}
		}

		foreach ($arTypes as $arType)
		{
			$dbType = CIBlockType::GetList(array(), array("=ID" => $arType["ID"]));
			if (!$dbType->Fetch())
			{
				foreach($arLanguages as $languageID)
				{
					IncludeModuleLangFile(__FILE__, $languageID);
					$code = mb_strtoupper($arType["ID"]);
					$arType["LANG"][$languageID]["NAME"] = GetMessage($code."_TYPE_NAME");
					$arType["LANG"][$languageID]["ELEMENT_NAME"] = GetMessage($code."_ELEMENT_NAME");
					if ($arType["SECTIONS"] == "Y")
						$arType["LANG"][$languageID]["SECTION_NAME"] = GetMessage($code."_SECTION_NAME");
				}
				$iblockType = new CIBlockType;
				$iblockType->Add($arType);
			}
		}

		if (empty($currentPermissions))
		{
			CLists::SetPermission('lists', array(1));
			CLists::SetPermission('bitrix_processes', array(1));
		}

		$defaultLang = "en";
		if(IsModuleInstalled("bitrix24"))
		{
			$gr = COption::GetOptionString("main", "~controller_group_name", "");
			if($gr != "")
				$defaultLang = mb_substr($gr, 0, 2);
			if($defaultLang == "ua")
				$defaultLang = "ru";
		}
		else
		{
			$defaultSiteId = CSite::GetDefSite();
			$siteObject = CSite::GetByID($defaultSiteId);
			$site = $siteObject->fetch();
			$defaultLang = $site ? $site['LANGUAGE_ID'] : "en";
			if($defaultLang == "ua")
				$defaultLang = "ru";
		}
		\Bitrix\Lists\Importer::installProcesses($defaultLang);
		\Bitrix\Main\Config\Option::set("lists", "livefeed_url", "/bizproc/processes/");

		if ($isSocnetInstalled && $socnet_iblock_type_id == '')
		{
			COption::SetOptionString("lists", "socnet_iblock_type_id", "lists_socnet");
			CLists::EnableSocnet(true);
		}
	}

	function UnInstallDB($arParams = array())
	{
		/** @global CMain $APPLICATION */
		global $APPLICATION;

		$this->errors = false;

		$dropTables = !array_key_exists("savedata", $arParams) || $arParams["savedata"] != "Y";

		$migrationResult = $this->uninstallMigrations($dropTables);
		if (!$migrationResult->isSuccess())
		{
			$this->errors = $migrationResult->getErrorMessages();
		}

		UnRegisterModule("lists");

		if($this->errors !== false)
		{
			$APPLICATION->ThrowException(implode("<br>", $this->errors));
			return false;
		}

		return true;
	}

	function InstallEvents()
	{
		return true;
	}

	function UnInstallEvents()
	{
		return true;
	}

	function InstallFiles($arParams = array())
	{
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/lists/install/admin", $_SERVER["DOCUMENT_ROOT"]."/bitrix/admin", true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/lists/install/components", $_SERVER["DOCUMENT_ROOT"]."/bitrix/components", True, True);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/lists/install/images", $_SERVER["DOCUMENT_ROOT"]."/bitrix/images/lists", True, True);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/lists/install/js", $_SERVER["DOCUMENT_ROOT"]."/bitrix/js", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/lists/install/activities", $_SERVER["DOCUMENT_ROOT"]."/bitrix/activities", true, true);
		return true;
	}

	function UnInstallFiles()
	{
		DeleteDirFilesEx("/bitrix/images/lists/");
		DeleteDirFilesEx("/bitrix/js/lists/");
		return true;
	}

	function DoInstall()
	{
		global $APPLICATION, $USER;
		$step = (int)($_REQUEST['step'] ?? 0);

		if(!$USER->IsAdmin())
			return;

		if(!CBXFeatures::IsFeatureEditable("Lists"))
		{
			$this->errors = array(GetMessage("MAIN_FEATURE_ERROR_EDITABLE"));
			$APPLICATION->ThrowException(implode("<br>", $this->errors));

			$GLOBALS["errors"] = $this->errors;
			$APPLICATION->IncludeAdminFile(GetMessage("LISTS_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/lists/install/step2.php");
		}
		elseif($step < 2)
		{
			$APPLICATION->IncludeAdminFile(GetMessage("LISTS_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/lists/install/step1.php");
		}
		elseif($step==2)
		{
			$this->InstallDB(array());
			$this->InstallFiles(array());
			CBXFeatures::SetFeatureEnabled("Lists", true);

			$GLOBALS["errors"] = $this->errors;
			$APPLICATION->IncludeAdminFile(GetMessage("LISTS_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/lists/install/step2.php");
		}
	}

	function DoUninstall()
	{
		global $APPLICATION, $USER;
		$step = (int)($_REQUEST['step'] ?? 0);
		if($USER->IsAdmin())
		{
			if($step < 2)
			{
				$APPLICATION->IncludeAdminFile(GetMessage("LISTS_UNINSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/lists/install/unstep1.php");
			}
			elseif($step == 2)
			{
				$this->UnInstallDB(array(
					"savedata" => $_REQUEST["savedata"],
				));
				$this->UnInstallFiles();
				CBXFeatures::SetFeatureEnabled("Lists", false);
				$GLOBALS["errors"] = $this->errors;
				$APPLICATION->IncludeAdminFile(GetMessage("LISTS_UNINSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/lists/install/unstep2.php");
			}
		}
	}

	public static function OnGetTableSchema()
	{
		return array(
			"iblock" => array(
				"b_iblock_type" => array(
					"ID" => array(
						"b_lists_permission" => "IBLOCK_TYPE_ID",
					)
				),
				"b_iblock" => array(
					"ID" => array(
						"b_lists_field" => "IBLOCK_ID",
						"b_lists_socnet_group" => "IBLOCK_ID",
						"b_lists_url" => "IBLOCK_ID",
					)
				),
			),
			"main" => array(
				"b_group" => array(
					"ID" => array(
						"b_lists_permission" => "GROUP_ID",
					)
				),
			),
		);
	}
}
