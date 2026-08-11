<?php

if(class_exists("sender"))
{
	return;
}

IncludeModuleLangFile(__FILE__);

class sender extends CModule
{
	var $MODULE_ID = "sender";
	var $MODULE_VERSION;
	var $MODULE_VERSION_DATE;
	var $MODULE_NAME;
	var $MODULE_DESCRIPTION;
	var $MODULE_CSS;
	var $MODULE_GROUP_RIGHTS = "Y";

	var $errors;

	public function __construct()
	{
		$arModuleVersion = array();

		include(__DIR__.'/version.php');

		if (is_array($arModuleVersion) && array_key_exists("VERSION", $arModuleVersion))
		{
			$this->MODULE_VERSION = $arModuleVersion["VERSION"];
			$this->MODULE_VERSION_DATE = $arModuleVersion["VERSION_DATE"];
		}

		$this->MODULE_NAME = GetMessage("SENDER_MODULE_NAME");
		$this->MODULE_DESCRIPTION = GetMessage("SENDER_MODULE_DESC");
		$this->MODULE_CSS = "/bitrix/modules/sender/styles.css";
	}

	function InstallDB($arParams = array())
	{
		global $APPLICATION;
		$this->errors = false;

		$migrationResult = $this->installMigrations();
		if (!$migrationResult->isSuccess())
		{
			$this->errors = $migrationResult->getErrorMessages();
		}

		if($this->errors !== false)
		{
			$APPLICATION->ThrowException(implode("<br>", $this->errors));
			return false;
		}

		RegisterModule("sender");
		CModule::IncludeModule("sender");

		CTimeZone::Disable();

		\Bitrix\Sender\Runtime\Job::actualizeAll();
		\Bitrix\Sender\Trigger\Manager::activateAllHandlers();

		CTimeZone::Enable();

		return true;
	}

	function UnInstallDB($arParams = array())
	{
		global $APPLICATION;
		$this->errors = false;

		CModule::IncludeModule("sender");
		\Bitrix\Sender\Trigger\Manager::activateAllHandlers(false);

		$dropTables = !array_key_exists("save_tables", $arParams) || ($arParams["save_tables"] != "Y");

		$migrationResult = $this->uninstallMigrations($dropTables);
		if (!$migrationResult->isSuccess())
		{
			$this->errors = $migrationResult->getErrorMessages();
		}

		UnRegisterModule("sender");

		if($this->errors !== false)
		{
			$APPLICATION->ThrowException(implode("<br>", $this->errors));
			return false;
		}

		return true;
	}

	function GetEventCountByName($eventName)
	{
		global $DB;
		$result = $DB->Query("SELECT count(*) C FROM b_event_type WHERE EVENT_NAME IN ('".$DB->ForSql($eventName)."') "
		);
		$array = $result->Fetch();
		return $array['C'];
	}

	function InstallEvents()
	{
		$senderSubscribeEventCount = $this->getEventCountByName("SENDER_SUBSCRIBE_CONFIRM") ?? 0;
		$senderSubscribeEvent = $senderSubscribeEventCount <= 0;

		$senderConsentEventCount = $this->getEventCountByName("SENDER_CONSENT") ?? 0;
		$senderConsentEvent = $senderConsentEventCount <= 0;

		if($senderSubscribeEvent || $senderConsentEvent)
		{
			include($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sender/install/events.php");
		}
		return true;
	}

	function DeleteEventByName($name)
	{
		global $DB;
		$realEscapeName = $DB->ForSql($name);
		$DB->Query("DELETE FROM b_event_message WHERE EVENT_NAME IN ('".$realEscapeName."') ");
		$DB->Query("DELETE FROM b_event_type WHERE EVENT_NAME IN ('".$realEscapeName."') ");
	}

	function UnInstallEvents()
	{
		$this->DeleteEventByName("SENDER_SUBSCRIBE_CONFIRM");
		$this->DeleteEventByName("SENDER_CONSENT");
		return true;
	}

	function InstallFiles($arParams = array())
	{
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sender/install/admin", $_SERVER["DOCUMENT_ROOT"]."/bitrix/admin");
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sender/install/themes", $_SERVER["DOCUMENT_ROOT"]."/bitrix/themes", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sender/install/components", $_SERVER["DOCUMENT_ROOT"]."/bitrix/components", True, True);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sender/install/images", $_SERVER["DOCUMENT_ROOT"]."/bitrix/images", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sender/install/js", $_SERVER["DOCUMENT_ROOT"]."/bitrix/js", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sender/install/tools", $_SERVER["DOCUMENT_ROOT"]."/bitrix/tools", true, true);

		return true;
	}

	function UnInstallFiles()
	{
		//admin files
		DeleteDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sender/install/admin", $_SERVER["DOCUMENT_ROOT"]."/bitrix/admin");
		DeleteDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sender/install/tools", $_SERVER["DOCUMENT_ROOT"]."/bitrix/tools");
		//css
		DeleteDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sender/install/themes/.default/", $_SERVER["DOCUMENT_ROOT"]."/bitrix/themes/.default");
		DeleteDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sender/install/js", $_SERVER["DOCUMENT_ROOT"]."/bitrix/js");

		return true;
	}

	function DoInstall()
	{
		global $APPLICATION, $step;

		$POST_RIGHT = $APPLICATION->GetGroupRight("sender");
		if($POST_RIGHT == "W")
		{
			$step = intval($step);
			if($step < 2)
			{
				$APPLICATION->IncludeAdminFile(GetMessage("SENDER_MODULE_INST_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sender/install/inst1.php");
			}
			elseif($step==2)
			{
				if($this->InstallDB())
				{
					$this->InstallEvents();
					$this->InstallFiles();
				}
				$GLOBALS["errors"] = $this->errors;
				$APPLICATION->IncludeAdminFile(GetMessage("SENDER_MODULE_INST_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sender/install/inst2.php");
			}
		}
	}

	function DoUninstall()
	{
		global $APPLICATION, $step;

		$POST_RIGHT = $APPLICATION->GetGroupRight("sender");
		if($POST_RIGHT == "W")
		{
			$step = intval($step);
			if($step < 2)
			{
				$APPLICATION->IncludeAdminFile(GetMessage("SENDER_MODULE_UNINST_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sender/install/uninst1.php");
			}
			elseif($step == 2)
			{
				$this->UnInstallDB(array(
					"save_tables" => $_REQUEST["save_tables"],
				));
				//message types and templates
				if($_REQUEST["save_templates"] != "Y")
				{
					$this->UnInstallEvents();
				}
				$this->UnInstallFiles();
				$GLOBALS["errors"] = $this->errors;
				$APPLICATION->IncludeAdminFile(GetMessage("SENDER_MODULE_UNINST_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sender/install/uninst2.php");
			}
		}
	}

}
