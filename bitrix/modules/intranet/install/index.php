<?php

use Bitrix\Main\Localization\Loc,
	Bitrix\Main\IO;
Loc::loadMessages(__FILE__);

//if (class_exists("intranet")) return;

Class intranet extends CModule
{
	var $MODULE_ID = "intranet";
	var $MODULE_VERSION;
	var $MODULE_VERSION_DATE;
	var $MODULE_NAME;
	var $MODULE_DESCRIPTION;
	var $MODULE_CSS;
	var $MODULE_GROUP_RIGHTS = "Y";

	function __construct()
	{
		$arModuleVersion = array();

		include(__DIR__.'/version.php');

		if (is_array($arModuleVersion) && array_key_exists("VERSION", $arModuleVersion))
		{
			$this->MODULE_VERSION = $arModuleVersion["VERSION"];
			$this->MODULE_VERSION_DATE = $arModuleVersion["VERSION_DATE"];
		}
		elseif (defined('INTRANET_VERSION') && defined('INTRANET_VERSION_DATE'))
		{
			$this->MODULE_VERSION = INTRANET_VERSION;
			$this->MODULE_VERSION_DATE = INTRANET_VERSION_DATE;
		}

		$this->MODULE_NAME = GetMessage("INTR_MODULE_NAME");
		$this->MODULE_DESCRIPTION = GetMessage("INTR_MODULE_DESCRIPTION");
	}

	function InstallDB()
	{
		global $DB, $APPLICATION;

		$migrationResult = $this->installMigrations();
		if (!$migrationResult->isSuccess())
		{
			$APPLICATION->ThrowException(implode('', $migrationResult->getErrorMessages()));
			return false;
		}

		RegisterModule("intranet");

		$arFields = Array(
			"ACTIVE" => "N",
			"NAME" => GetMessage("INTR_INSTALL_RATING_RULE"),
			"ENTITY_TYPE_ID" => "USER",
			"CONDITION_NAME" => "SUBORDINATE",
			"CONDITION_MODULE" => "intranet",
			"CONDITION_CLASS" => "CRatingRulesIntranet",
			"CONDITION_METHOD" => "subordinateCheck",
			"CONDITION_CONFIG" => Array(
				"SUBORDINATE" => Array(
				),
			),
			"ACTION_NAME" => "empty",
			"ACTION_CONFIG" => Array(),
			"ACTIVATE" => "N",
			"ACTIVATE_CLASS" => "empty",
			"ACTIVATE_METHOD" => "empty",
			"DEACTIVATE" => "N",
			"DEACTIVATE_CLASS" => "empty ",
			"DEACTIVATE_METHOD" => "empty",
			"~CREATED" => $DB->GetNowFunction(),
			"~LAST_MODIFIED" => $DB->GetNowFunction(),
		);
		$arFields["CONDITION_CONFIG"] = serialize($arFields["CONDITION_CONFIG"]);
		$arFields["ACTION_CONFIG"] = serialize($arFields["ACTION_CONFIG"]);
		$DB->Add("b_rating_rule", $arFields, array("ACTION_CONFIG", "CONDITION_CONFIG"));

		$this->InstallUserFields();

		return true;
	}

	function UnInstallDB($arParams = array())
	{
		$dropTables = false;

		$migrationResult = $this->uninstallMigrations($dropTables);
		if (!$migrationResult->isSuccess())
		{
			$this->errors = $migrationResult->getErrorMessages();
			return false;
		}

		return true;
	}

	function InstallEvents()
	{
		global $DB;

		$sIn = "'INTRANET_USER_INVITATION'";
		$rs = $DB->Query("SELECT count(*) C FROM b_event_type WHERE EVENT_NAME IN (".$sIn.") ");
		$ar = $rs->Fetch();
		if($ar["C"] <= 0)
		{
			include($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/intranet/install/events.php");
		}
		return true;
	}

	function UnInstallEvents()
	{
		return true;
	}

	function InstallFiles()
	{
		global $APPLICATION;

		CopyDirFiles(
			$_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/intranet/install/components",
			$_SERVER["DOCUMENT_ROOT"]."/bitrix/components",
			true, true
		);

		CopyDirFiles(
			$_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/intranet/install/gadgets",
			$_SERVER["DOCUMENT_ROOT"]."/bitrix/gadgets",
			true, true
		);

		CopyDirFiles(
			$_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/intranet/install/admin",
			$_SERVER["DOCUMENT_ROOT"]."/bitrix/admin",
			true, true
		);

		CopyDirFiles(
			$_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/intranet/install/js",
			$_SERVER["DOCUMENT_ROOT"]."/bitrix/js",
			true, true
		);

		CopyDirFiles(
			$_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/intranet/install/themes",
			$_SERVER["DOCUMENT_ROOT"]."/bitrix/themes",
			true, true
		);

		// here: set access rights for all of the services
		CopyDirFiles(
			$_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/intranet/install/tools",
			$_SERVER["DOCUMENT_ROOT"]."/bitrix/tools",
			true, true
		);

		CopyDirFiles(
			$_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/intranet/install/images",
			$_SERVER["DOCUMENT_ROOT"]."/bitrix/images",
			true, true
		);

		CopyDirFiles(
			$_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/intranet/install/services",
			$_SERVER["DOCUMENT_ROOT"]."/bitrix/services",
			true, true
		);

		CopyDirFiles(
			$_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/bitrix24/install/routes",
			$_SERVER["DOCUMENT_ROOT"]."/bitrix/routes",
			true, true
		);

		foreach (["portal", "portal_clear"] as $wizard)
		{
			if (IO\Directory::isDirectoryExists(
				$_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/intranet/install/wizards/bitrix/".$wizard)
			)
			{
				CopyDirFiles(
					$_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/intranet/install/wizards/bitrix/".$wizard,
					$_SERVER["DOCUMENT_ROOT"]."/bitrix/wizards/bitrix/".$wizard,
					true,
					true,
					true
				);
			}
		}

		\Bitrix\Main\UrlRewriter::add(
			\CSite::getDefSite() ?: 's1',
			array(
				'CONDITION' => '#^/stssync/contacts/#',
				'RULE' => '',
				'ID' => 'bitrix:stssync.server',
				'PATH' => '/bitrix/services/stssync/contacts/index.php',
			)
		);

		return true;
	}

	function UnInstallFiles()
	{
		return true;
	}

	function InstallUserFields()
	{
		$arMess = self::__GetMessagesForAllLang(__DIR__.'/property_names.php', array(
			'UF_PHONE_INNER',
			'UF_1C',
			'UF_INN',
			'UF_DISTRICT',
			'UF_SKYPE_MSGVER_1',
			'UF_SKYPE_LINK',
			'UF_ZOOM',
			'UF_TWITTER',
			'UF_FACEBOOK',
			'UF_LINKEDIN',
			'UF_XING',
			'UF_WEB_SITES',
			'UF_SKILLS',
			'UF_INTERESTS',
			'UF_DEPARTMENT',
			'UF_EMPLOYMENT_DATE'
		));

		$arProperties = Array(

			'UF_PHONE_INNER' => array(
				'ENTITY_ID' => 'USER',
				'FIELD_NAME' => 'UF_PHONE_INNER',
				'USER_TYPE_ID' => 'string',
				'XML_ID' => '',
				'SORT' => 2,
				'MULTIPLE' => 'N',
				'MANDATORY' => 'N',
				'SHOW_FILTER' => 'S',
				'SHOW_IN_LIST' => 'Y',
				'EDIT_IN_LIST' => 'Y',
				'IS_SEARCHABLE' => 'Y',
			),

			'UF_1C' => Array(
				'ENTITY_ID' => 'USER',
				'FIELD_NAME' => 'UF_1C',
				'USER_TYPE_ID' => 'boolean',
				'XML_ID' => '',
				'SORT' => 100,
				'MULTIPLE' => 'N',
				'MANDATORY' => 'N',
				'SHOW_FILTER' => 'I',
				'SHOW_IN_LIST' => 'N',
				'EDIT_IN_LIST' => 'N',
				'IS_SEARCHABLE' => 'Y',
				'SETTINGS' => array(
					'DISPLAY' => 'CHECKBOX',
				),
			),

			'UF_INN' => array(
				'ENTITY_ID' => 'USER',
				'FIELD_NAME' => 'UF_INN',
				'USER_TYPE_ID' => 'string',
				'XML_ID' => '',
				'SORT' => 100,
				'MULTIPLE' => 'N',
				'MANDATORY' => 'N',
				'SHOW_FILTER' => 'I',
				'SHOW_IN_LIST' => 'Y',
				'EDIT_IN_LIST' => 'Y',
				'IS_SEARCHABLE' => 'Y',
			),

			'UF_DISTRICT' => array(
				'ENTITY_ID' => 'USER',
				'FIELD_NAME' => 'UF_DISTRICT',
				'USER_TYPE_ID' => 'string',
				'XML_ID' => '',
				'SORT' => 100,
				'MULTIPLE' => 'N',
				'MANDATORY' => 'N',
				'SHOW_FILTER' => 'Y',
				'SHOW_IN_LIST' => 'Y',
				'EDIT_IN_LIST' => 'Y',
				'IS_SEARCHABLE' => 'Y',
			),
			'UF_SKYPE' => array(
				'ENTITY_ID' => 'USER',
				'FIELD_NAME' => 'UF_SKYPE',
				'USER_TYPE_ID' => 'string_formatted',
				'XML_ID' => 'UF_SKYPE',
				'SORT' => 100,
				'MULTIPLE' => 'N',
				'MANDATORY' => 'N',
				'SHOW_FILTER' => 'Y',
				'SHOW_IN_LIST' => 'Y',
				'EDIT_IN_LIST' => 'Y',
				'IS_SEARCHABLE' => 'Y',
				'SETTINGS' => ['PATTERN' => '<a href="skype://#VALUE#">#VALUE#</a>'],
			),
			'UF_SKYPE_LINK' => array(
				'ENTITY_ID' => 'USER',
				'FIELD_NAME' => 'UF_SKYPE_LINK',
				'USER_TYPE_ID' => 'url',
				'XML_ID' => 'UF_SKYPE_LINK',
				'SORT' => 100,
				'MULTIPLE' => 'N',
				'MANDATORY' => 'N',
				'SHOW_FILTER' => 'N',
				'SHOW_IN_LIST' => 'Y',
				'EDIT_IN_LIST' => 'Y',
				'IS_SEARCHABLE' => 'Y',
			),
			'UF_ZOOM' => array(
				'ENTITY_ID' => 'USER',
				'FIELD_NAME' => 'UF_ZOOM',
				'USER_TYPE_ID' => 'url',
				'XML_ID' => 'UF_ZOOM',
				'SORT' => 100,
				'MULTIPLE' => 'N',
				'MANDATORY' => 'N',
				'SHOW_FILTER' => 'N',
				'SHOW_IN_LIST' => 'Y',
				'EDIT_IN_LIST' => 'Y',
				'IS_SEARCHABLE' => 'Y',
			),
			'UF_TWITTER' => array(
				'ENTITY_ID' => 'USER',
				'FIELD_NAME' => 'UF_TWITTER',
				'USER_TYPE_ID' => 'string',
				'XML_ID' => '',
				'SORT' => 100,
				'MULTIPLE' => 'N',
				'MANDATORY' => 'N',
				'SHOW_FILTER' => 'Y',
				'SHOW_IN_LIST' => 'Y',
				'EDIT_IN_LIST' => 'Y',
				'IS_SEARCHABLE' => 'Y',
			),
			'UF_FACEBOOK' => array(
				'ENTITY_ID' => 'USER',
				'FIELD_NAME' => 'UF_FACEBOOK',
				'USER_TYPE_ID' => 'string',
				'XML_ID' => '',
				'SORT' => 100,
				'MULTIPLE' => 'N',
				'MANDATORY' => 'N',
				'SHOW_FILTER' => 'Y',
				'SHOW_IN_LIST' => 'Y',
				'EDIT_IN_LIST' => 'Y',
				'IS_SEARCHABLE' => 'Y',
			),
			'UF_LINKEDIN' => array(
				'ENTITY_ID' => 'USER',
				'FIELD_NAME' => 'UF_LINKEDIN',
				'USER_TYPE_ID' => 'string',
				'XML_ID' => '',
				'SORT' => 100,
				'MULTIPLE' => 'N',
				'MANDATORY' => 'N',
				'SHOW_FILTER' => 'Y',
				'SHOW_IN_LIST' => 'Y',
				'EDIT_IN_LIST' => 'Y',
				'IS_SEARCHABLE' => 'Y',
			),
			'UF_XING' => array(
				'ENTITY_ID' => 'USER',
				'FIELD_NAME' => 'UF_XING',
				'USER_TYPE_ID' => 'string',
				'XML_ID' => '',
				'SORT' => 100,
				'MULTIPLE' => 'N',
				'MANDATORY' => 'N',
				'SHOW_FILTER' => 'Y',
				'SHOW_IN_LIST' => 'Y',
				'EDIT_IN_LIST' => 'Y',
				'IS_SEARCHABLE' => 'Y',
			),
			'UF_WEB_SITES' => array(
				'ENTITY_ID' => 'USER',
				'FIELD_NAME' => 'UF_WEB_SITES',
				'USER_TYPE_ID' => 'string',
				'XML_ID' => '',
				'SORT' => 100,
				'MULTIPLE' => 'N',
				'MANDATORY' => 'N',
				'SHOW_FILTER' => 'Y',
				'SHOW_IN_LIST' => 'Y',
				'EDIT_IN_LIST' => 'Y',
				'IS_SEARCHABLE' => 'Y',
			),
			'UF_SKILLS' => array(
				'ENTITY_ID' => 'USER',
				'FIELD_NAME' => 'UF_SKILLS',
				'USER_TYPE_ID' => 'string',
				'XML_ID' => '',
				'SORT' => 100,
				'MULTIPLE' => 'N',
				'MANDATORY' => 'N',
				'SHOW_FILTER' => 'Y',
				'SHOW_IN_LIST' => 'Y',
				'EDIT_IN_LIST' => 'Y',
				'IS_SEARCHABLE' => 'Y',
			),
			'UF_INTERESTS' => array(
				'ENTITY_ID' => 'USER',
				'FIELD_NAME' => 'UF_INTERESTS',
				'USER_TYPE_ID' => 'string',
				'XML_ID' => '',
				'SORT' => 100,
				'MULTIPLE' => 'N',
				'MANDATORY' => 'N',
				'SHOW_FILTER' => 'Y',
				'SHOW_IN_LIST' => 'Y',
				'EDIT_IN_LIST' => 'Y',
				'IS_SEARCHABLE' => 'Y',
			),
			'UF_DEPARTMENT' => array(
				'ENTITY_ID' => 'USER',
				'FIELD_NAME' => 'UF_DEPARTMENT',
				'USER_TYPE_ID' => 'iblock_section',
				'XML_ID' => '',
				'SORT' => 1,
				'MULTIPLE' => 'Y',
				'MANDATORY' => 'N',
				'SHOW_FILTER' => 'I',
				'SHOW_IN_LIST' => 'Y',
				'EDIT_IN_LIST' => 'Y',
				'IS_SEARCHABLE' => 'Y'
			),
			'UF_EMPLOYMENT_DATE' => array(
				'ENTITY_ID' => 'USER',
				'FIELD_NAME' => 'UF_EMPLOYMENT_DATE',
				'USER_TYPE_ID' => 'date',
				'XML_ID' => '',
				'SORT' => 100,
				'MULTIPLE' => 'N',
				'MANDATORY' => 'N',
				'SHOW_FILTER' => 'E',
				'SHOW_IN_LIST' => 'Y',
				'EDIT_IN_LIST' => 'Y',
				'IS_SEARCHABLE' => 'Y',
			),
		);

		$arLanguages = array();
		$rsLanguage = CLanguage::GetList();
		while($arLanguage = $rsLanguage->Fetch())
			$arLanguages[] = $arLanguage["LID"];

		foreach ($arProperties as $arProperty)
		{
			$dbRes = CUserTypeEntity::GetList(Array(), Array("ENTITY_ID" => $arProperty["ENTITY_ID"], "FIELD_NAME" => $arProperty["FIELD_NAME"]));
			if ($dbRes->Fetch())
				continue;

			$arLabelNames = Array();

			$fieldToMsgKeyMap = [
				'UF_SKYPE' => 'UF_SKYPE_MSGVER_1',
			];

			$messageKey = $fieldToMsgKeyMap[$arProperty['FIELD_NAME']] ?? $arProperty['FIELD_NAME'];

			foreach($arLanguages as $languageID)
			{
				$arLabelNames[$languageID] = $arMess[$messageKey][$languageID];
			}

			$arProperty["EDIT_FORM_LABEL"] = $arLabelNames;
			$arProperty["LIST_COLUMN_LABEL"] = $arLabelNames;
			$arProperty["LIST_FILTER_LABEL"] = $arLabelNames;

			$userType = new CUserTypeEntity();
			$userType->Add($arProperty);
		}

		\Bitrix\Main\Entity\Base::destroy(\Bitrix\Main\UserTable::getEntity());
	}


	function DoInstall()
	{
		if (!IsModuleInstalled("intranet"))
		{
			$this->InstallDB();
			$this->InstallEvents();
			$this->InstallFiles();
		}
	}

	function DoUninstall()
	{
		global $DB, $APPLICATION, $USER, $step;
		$APPLICATION->IncludeAdminFile(GetMessage("INTR_UNINSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/".$this->MODULE_ID."/install/del_denied.php");
	}

	private static function __GetMessagesForAllLang($file, $MessID, $strDefMess = false, $arLangList = array())
	{
		$arResult = false;

		if (empty($MessID))
			return $arResult;
		if (!is_array($MessID))
			$MessID = array($MessID);

		if (empty($arLangList))
		{
			$rsLangs = CLanguage::GetList('lid', 'asc', array("ACTIVE" => "Y"));
			while ($arLang = $rsLangs->Fetch())
			{
				$arLangList[] = $arLang['LID'];
			}
		}
		foreach ($arLangList as $strLID)
		{
			$MESS = \Bitrix\Main\Localization\Loc::loadLanguageFile($file, $strLID);
			foreach ($MessID as $strMessID)
			{
				if ($strMessID == '')
					continue;
				$arResult[$strMessID][$strLID] = (isset($MESS[$strMessID]) ? $MESS[$strMessID] : $strDefMess);
			}
		}


		return $arResult;
	}
}
