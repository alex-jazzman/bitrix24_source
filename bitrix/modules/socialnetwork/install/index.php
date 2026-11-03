<?php

use Bitrix\Main\Localization\Loc;
Loc::loadMessages(__FILE__);

Class socialnetwork extends CModule
{
	var $MODULE_ID = "socialnetwork";
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

		$this->MODULE_NAME = Loc::getMessage("SONET_INSTALL_NAME");
		$this->MODULE_DESCRIPTION = Loc::getMessage("SONET_INSTALL_DESCRIPTION");
	}

	public static function __SetLogFilter($site_id = false)
	{
		$arValue = array(
			array(
				"ID" => "work",
				"SORT" => 100,
				"NAME" => "#WORK#",
				"FILTER" => array(
					"EVENT_ID" => array("tasks", "timeman_entry", "report")
				)
			),
			array(
				"ID" => "favorites",
				"SORT" => 200,
				"NAME" => "#FAVORITES#",
				"FILTER" => array(
					"FAVORITES_USER_ID" => "Y"
				)
			),
			array(
				"ID" => "my",
				"SORT" => 300,
				"NAME" => "#MY#",
				"FILTER" => array(
					"CREATED_BY_ID" => "#CURRENT_USER_ID#"
				)
			)
		);
		if (IsModuleInstalled("blog"))
		{
			$arValue[] = array(
				"ID" => "important",
				"SORT" => 350,
				"NAME" => "#important#",
				"FILTER" => array(
					"EXACT_EVENT_ID" => "blog_post_important"
				)
			);
		}
		if (
			IsModuleInstalled("lists")
			&& IsModuleInstalled("bizproc")
			&& IsModuleInstalled("intranet")
		)
		{
			$arValue[] = array(
				"ID" => "bizproc",
				"SORT" => 400,
				"NAME" => "#BIZPROC#",
				"FILTER" => array(
					"EXACT_EVENT_ID" => "lists_new_element"
				)
			);
		}
		if (IsModuleInstalled("intranet"))
		{
			$arValue[] = array(
				"ID" => "extranet",
				"SORT" => 500,
				"NAME" => "#EXTRANET#",
				"FILTER" => array(
					"SITE_ID" => "#EXTRANET_SITE_ID#",
					"!EXACT_EVENT_ID" => array("lists_new_element", "tasks", "timeman_entry", "report", "crm_activity_add")
				)
			);
		}

		$arFilter = ($site_id <> '' ? array("ID" => $site_id) : array());

		$dbSites = CSite::GetList('', '', $arFilter);
		while ($arSite = $dbSites->Fetch())
		{
			CUserOptions::SetOption("socialnetwork", "~log_filter_".$arSite["ID"], $arValue, true, false);
		}
	}

	function InstallDB($install_wizard = true)
	{
		global $APPLICATION, $install_smiles;

		$migrationResult = $this->installMigrations();
		if (!$migrationResult->isSuccess())
		{
			$APPLICATION->ThrowException(implode("", $migrationResult->getErrorMessages()));
			return false;
		}

		RegisterModule("socialnetwork");

		$arUserOptions = CUserOptions::GetOption("intranet", "~gadgets_sonet_user", false, 0);
		if (!is_array($arUserOptions) || count($arUserOptions) <= 0)
		{
			$sOptions = 'a:1:{s:7:"GADGETS";a:10:{s:18:"SONET_USER_LINKS@1";a:4:{s:6:"COLUMN";i:0;s:3:"ROW";i:0;s:8:"USERDATA";N;s:4:"HIDE";s:1:"N";}s:20:"SONET_USER_FRIENDS@2";a:4:{s:6:"COLUMN";i:0;s:3:"ROW";i:1;s:8:"USERDATA";N;s:4:"HIDE";s:1:"N";}s:21:"SONET_USER_BIRTHDAY@3";a:4:{s:6:"COLUMN";i:0;s:3:"ROW";i:2;s:8:"USERDATA";N;s:4:"HIDE";s:1:"N";}s:19:"SONET_USER_GROUPS@4";a:4:{s:6:"COLUMN";i:0;s:3:"ROW";i:3;s:8:"USERDATA";N;s:4:"HIDE";s:1:"N";}s:17:"SONET_USER_HEAD@5";a:4:{s:6:"COLUMN";i:0;s:3:"ROW";i:4;s:8:"USERDATA";N;s:4:"HIDE";s:1:"N";}s:19:"SONET_USER_HONOUR@6";a:4:{s:6:"COLUMN";i:0;s:3:"ROW";i:5;s:8:"USERDATA";N;s:4:"HIDE";s:1:"N";}s:20:"SONET_USER_ABSENCE@7";a:4:{s:6:"COLUMN";i:0;s:3:"ROW";i:6;s:8:"USERDATA";N;s:4:"HIDE";s:1:"N";}s:17:"SONET_USER_DESC@8";a:4:{s:6:"COLUMN";i:1;s:3:"ROW";i:0;s:8:"USERDATA";N;s:4:"HIDE";s:1:"N";}s:22:"SONET_USER_ACTIVITY@21";a:3:{s:6:"COLUMN";i:1;s:3:"ROW";i:1;s:4:"HIDE";s:1:"N";}s:7:"TASKS@9";a:4:{s:6:"COLUMN";i:1;s:3:"ROW";i:2;s:8:"USERDATA";N;s:4:"HIDE";s:1:"N";}}}';
			$arOptions = unserialize($sOptions, [ 'allowed_classes' => false ]);
			CUserOptions::SetOption("intranet", "~gadgets_sonet_user", $arOptions, false, 0);

			$sOptions = 'a:1:{s:7:"GADGETS";a:7:{s:18:"SONET_GROUP_DESC@1";a:3:{s:6:"COLUMN";i:0;s:3:"ROW";i:0;s:4:"HIDE";s:1:"N";}s:16:"UPDATES_ENTITY@9";a:3:{s:6:"COLUMN";i:0;s:3:"ROW";i:1;s:4:"HIDE";s:1:"N";}s:7:"TASKS@4";a:3:{s:6:"COLUMN";i:0;s:3:"ROW";i:2;s:4:"HIDE";s:1:"N";}s:18:"SONET_GROUP_TAGS@5";a:3:{s:6:"COLUMN";i:0;s:3:"ROW";i:3;s:4:"HIDE";s:1:"N";}s:19:"SONET_GROUP_LINKS@6";a:3:{s:6:"COLUMN";i:1;s:3:"ROW";i:0;s:4:"HIDE";s:1:"N";}s:19:"SONET_GROUP_USERS@7";a:3:{s:6:"COLUMN";i:1;s:3:"ROW";i:1;s:4:"HIDE";s:1:"N";}s:18:"SONET_GROUP_MODS@8";a:3:{s:6:"COLUMN";i:1;s:3:"ROW";i:2;s:4:"HIDE";s:1:"N";}}}';
			$arOptions = unserialize($sOptions, [ 'allowed_classes' => false ]);
			CUserOptions::SetOption("intranet", "~gadgets_sonet_group", $arOptions, false, 0);
		}

		static::__SetLogFilter();

		CModule::IncludeModule("socialnetwork");

		if (CModule::IncludeModule("search"))
		{
			CSearch::ReIndexModule("socialnetwork");
		}

		if($install_smiles == "Y" || $install_wizard)
		{
			$dbSmile = CSocNetSmile::GetList();
			if(!($dbSmile->Fetch()))
			{
				$arSmile = Array(
					Array(
						"TYPING" => ":D :-D",
						"IMAGE" => "icon_biggrin.gif",
						"FICON_SMILE" => "FICON_BIGGRIN",
					),
					Array(
						"TYPING" => ":) :-)",
						"IMAGE" => "icon_smile.gif",
						"FICON_SMILE" => "FICON_SMILE",
					),
					Array(
						"TYPING" => ":( :-(",
						"IMAGE" => "icon_sad.gif",
						"FICON_SMILE" => "FICON_SAD",
					),
					Array(
						"TYPING" => ":o :-o :shock:",
						"IMAGE" => "icon_eek.gif",
						"FICON_SMILE" => "FICON_EEK",
					),
					Array(
						"TYPING" => "8) 8-)",
						"IMAGE" => "icon_cool.gif",
						"FICON_SMILE" => "FICON_COOL",
					),
					Array(
						"TYPING" => ":{} :-{}",
						"IMAGE" => "icon_kiss.gif",
						"FICON_SMILE" => "FICON_KISS",
					),
					Array(
						"TYPING" => ":oops:",
						"IMAGE" => "icon_redface.gif",
						"FICON_SMILE" => "FICON_REDFACE",
					),
					Array(
						"TYPING" => ":cry: :~(",
						"IMAGE" => "icon_cry.gif",
						"FICON_SMILE" => "FICON_CRY",
					),
					Array(
						"TYPING" => ":evil: >:-<",
						"IMAGE" => "icon_evil.gif",
						"FICON_SMILE" => "FICON_EVIL",
					),
					Array(
						"TYPING" => ";) ;-)",
						"IMAGE" => "icon_wink.gif",
						"FICON_SMILE" => "FICON_WINK",
					),
					Array(
						"TYPING" => ":!:",
						"IMAGE" => "icon_exclaim.gif",
						"FICON_SMILE" => "FICON_EXCLAIM",
					),
					Array(
						"TYPING" => ":?:",
						"IMAGE" => "icon_question.gif",
						"FICON_SMILE" => "FICON_QUESTION",
					),
					Array(
						"TYPING" => ":idea:",
						"IMAGE" => "icon_idea.gif",
						"FICON_SMILE" => "FICON_IDEA",
					),
					Array(
						"TYPING" => ":| :-|",
						"IMAGE" => "icon_neutral.gif",
						"FICON_SMILE" => "FICON_NEUTRAL",
					),
				);
				$arLang = Array();
				$dbLangs = CLanguage::GetList("", "", array("ACTIVE" => "Y"));
				while ($arLangs = $dbLangs->Fetch())
				{
					IncludeModuleLangFile($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/socialnetwork/install/smiles.php", $arLangs["LID"]);

					foreach($arSmile as $key => $val)
					{
						$arSmile[$key]["LANG"][] = Array("LID" => $arLangs["LID"], "NAME" => Loc::getMessage($val["FICON_SMILE"]));
					}
				}

				foreach($arSmile as $val)
				{
					$val["SMILE_TYPE"] = "S";
					$val["CLICKABLE"] = "Y";
					$val["SORT"] = 150;
					$val["IMAGE_WIDTH"] = 16;
					$val["IMAGE_HEIGHT"] = 16;
					$id = CSocNetSmile::Add($val);
				}
			}
		}

		$res = static::InstallUserFields();
		if ($res)
		{
			$this->errors[] = $res;
		}

		return true;
	}

	function UnInstallDB($arParams = Array())
	{
		if (CModule::IncludeModule("search"))
			CSearch::DeleteIndex("socialnetwork");

		global $DB, $APPLICATION;

		$dropTables = array_key_exists("savedata", $arParams) && $arParams["savedata"] != "Y";

		if ($dropTables)
		{
			$this->UnInstallUserFields();

			$DB->Query("DELETE FROM b_user_option WHERE NAME like '~gadgets_sonet_group%'");
			$DB->Query("DELETE FROM b_user_option WHERE NAME like '~gadgets_sonet_user%'");
		}

		$migrationResult = $this->uninstallMigrations($dropTables);
		if (!$migrationResult->isSuccess())
		{
			$APPLICATION->ThrowException(implode("", $migrationResult->getErrorMessages()));
			return false;
		}

		UnRegisterModule("socialnetwork");
		return true;
	}

	public static function InstallUserFields($id = "all")
	{
		global $APPLICATION, $USER_FIELD_MANAGER, $DB;
		$errors = null;

		$id = (empty($id) ? "all" : (in_array($id, array("all", "webdav", "disk", "vote", "intranet"/*, "blog"*/)) ? $id : false));
		if (!!$id)
		{
			$USER_FIELD_MANAGER->CleanCache();

			$createIndex = false;
			$arFields = array();
			if ($id != "webdav")
			{
				$arFields[] = array(
					"USER_TYPE_ID" => "file",
					"ENTITY_ID" => "SONET_LOG",
					"FIELD_NAME" => "UF_SONET_LOG_FILE",
					"XML_ID" => "UF_SONET_LOG_FILE",
					"MAX_ALLOWED_SIZE" => COption::GetOptionString("socialnetwork", "file_max_size", "5000000"),
					"MULTIPLE" => "Y",
					"MANDATORY" => "N",
					"SHOW_FILTER" => "N",
					"SHOW_IN_LIST" => "N",
					"EDIT_IN_LIST" => "Y",
					"IS_SEARCHABLE" => "Y",
				);
				$arFields[] = array(
					"USER_TYPE_ID" => "file",
					"ENTITY_ID" => "SONET_COMMENT",
					"FIELD_NAME" => "UF_SONET_COM_FILE",
					"XML_ID" => "UF_SONET_COM_FILE",
					"MAX_ALLOWED_SIZE" => COption::GetOptionString("socialnetwork", "file_max_size", "5000000"),
					"MULTIPLE" => "Y",
					"MANDATORY" => "N",
					"SHOW_FILTER" => "N",
					"SHOW_IN_LIST" => "N",
					"EDIT_IN_LIST" => "Y",
					"IS_SEARCHABLE" => "Y",
				);
				if (IsModuleInstalled("blog"))
				{
					$arImportantPostUF = array(
						"USER_TYPE_ID" => "integer",
						"ENTITY_ID" => "BLOG_POST",
						"FIELD_NAME" => "UF_BLOG_POST_IMPRTNT",
						"XML_ID" => "UF_BLOG_POST_IMPRTNT",
						"EDIT_FORM_LABEL" => Array(),
						"LIST_COLUMN_LABEL" => Array(),
						"LIST_FILTER_LABEL" => Array());

					$dbLangs = CLanguage::GetList('', '', array("ACTIVE" => "Y"));
					while ($arLang = $dbLangs->Fetch())
					{
						$messages = IncludeModuleLangFile($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/socialnetwork/install/index.php", $arLang["LID"], true);
						$arImportantPostUF["EDIT_FORM_LABEL"][$arLang["LID"]] = $messages["SONETP_EDIT_FORM_LABEL"];
						$arImportantPostUF["LIST_COLUMN_LABEL"][$arLang["LID"]] = $messages["SONETP_LIST_COLUMN_LABEL"];
						$arImportantPostUF["LIST_FILTER_LABEL"][$arLang["LID"]] = $messages["SONETP_LIST_FILTER_LABEL"];
					}
					$arFields[] = $arImportantPostUF;

					$arImportantDateEndUF = [
						"USER_TYPE_ID" => "datetime",
						"ENTITY_ID" => "BLOG_POST",
						"FIELD_NAME" => "UF_IMPRTANT_DATE_END",
						"XML_ID" => "UF_IMPRTANT_DATE_END",
						"MULTIPLE" => "N",
						"MANDATORY" => "N",
						"SHOW_FILTER" => "N",
						"SHOW_IN_LIST" => "N",
						"EDIT_IN_LIST" => "Y",
						"IS_SEARCHABLE" => "N",
						"EDIT_FORM_LABEL" => [],
						"LIST_COLUMN_LABEL" => [],
						"LIST_FILTER_LABEL" => [],
					];

					$dbLangs = CLanguage::GetList('', '', array("ACTIVE" => "Y"));
					while ($arLang = $dbLangs->Fetch())
					{
						$messages = IncludeModuleLangFile($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/socialnetwork/install/index.php", $arLang["LID"], true);
						$arImportantDateEndUF["EDIT_FORM_LABEL"][$arLang["LID"]] = $messages["SONETP_UF_IMPRTANT_DATE_END_EDIT_FORM_LABEL"];
						$arImportantDateEndUF["LIST_COLUMN_LABEL"][$arLang["LID"]] = $messages["SONETP_UF_IMPRTANT_DATE_END_LIST_COLUMN_LABEL"];
					}
					$arFields[] = $arImportantDateEndUF;

					$createIndex = true;
				}
			}

			if($id == 'all' || $id == 'disk')
			{
				$errors = self::installDiskUserFields();
			}

			if($id == 'all' || $id == 'intranet')
			{
				$errors = self::installIntranetUserFields();
			}

			if (IsModuleInstalled("webdav"))
			{
				$arFields[] = array(
					"USER_TYPE_ID" => "webdav_element",
					"ENTITY_ID" => "SONET_LOG",
					"FIELD_NAME" => "UF_SONET_LOG_DOC",
					"XML_ID" => "UF_SONET_LOG_DOC",
					"MULTIPLE" => "Y",
					"MANDATORY" => "N",
					"SHOW_FILTER" => "N",
					"SHOW_IN_LIST" => "N",
					"EDIT_IN_LIST" => "Y",
					"IS_SEARCHABLE" => "Y"
				);
				$arFields[] = array(
					"USER_TYPE_ID" => "webdav_element",
					"ENTITY_ID" => "SONET_COMMENT",
					"FIELD_NAME" => "UF_SONET_COM_DOC",
					"XML_ID" => "UF_SONET_COM_DOC",
					"MULTIPLE" => "Y",
					"MANDATORY" => "N",
					"SHOW_FILTER" => "N",
					"SHOW_IN_LIST" => "N",
					"EDIT_IN_LIST" => "Y",
					"IS_SEARCHABLE" => "Y"
				);
			}

			if (IsModuleInstalled("vote"))
			{
				$arFields[] = array(
					"USER_TYPE_ID" => "vote",
					"ENTITY_ID" => "BLOG_POST",
					"FIELD_NAME" => "UF_BLOG_POST_VOTE",
					"XML_ID" => "UF_BLOG_POST_VOTE",
					"SETTINGS" => array(
						"CHANNEL_ID" => "add",
						"CHANNEL_TITLE" => (Loc::getMessage("SONET_INSTALL_UF_BLOG_POST_VOTE") ?: "UF_BLOG_POST_VOTE"),
						"CHANNEL_SYMBOLIC_NAME" => "UF_BLOG_POST_VOTE",
						"CHANNEL_USE_CAPTCHA" => "N",
						"NOTIFY" => (IsModuleInstalled("im") ? "I" : "N"),
						"UNIQUE" => 8,
						"UNIQUE_IP_DELAY" => array(
							"DELAY" => "10",
							"DELAY_TYPE" => "D"
						)
					)
				);
			}

			$arFields[] = array(
				"USER_TYPE_ID" => 'url_preview',
				"ENTITY_ID" => "SONET_LOG",
				"FIELD_NAME" => "UF_SONET_LOG_URL_PRV",
				"XML_ID" => "UF_SONET_LOG_URL_PRV",
				"MULTIPLE" => 'N',
				"MANDATORY" => "N",
				"SHOW_FILTER" => "N",
				"SHOW_IN_LIST" => "N",
				"EDIT_IN_LIST" => "Y",
			);

			$arFields[] = array(
				"USER_TYPE_ID" => 'url_preview',
				"ENTITY_ID" => "SONET_COMMENT",
				"FIELD_NAME" => "UF_SONET_COM_URL_PRV",
				"XML_ID" => "UF_SONET_COM_URL_PRV",
				"MULTIPLE" => 'N',
				"MANDATORY" => "N",
				"SHOW_FILTER" => "N",
				"SHOW_IN_LIST" => "N",
				"EDIT_IN_LIST" => "Y",
			);

			$obUserField = new CUserTypeEntity;
			foreach ($arFields as $arField)
			{
				$rsData = CUserTypeEntity::GetList(array("ID" => "ASC"), $arField);
				if (!($rsData && ($arRes = $rsData->Fetch()) && !!$arRes))
				{
					$intID = $obUserField->Add($arField, false);
					if (
						false == $intID
						&& ($strEx = $APPLICATION->GetException())
					)
					{
						$errors = $strEx->GetString();
					}
				}
				else if ($arField["FIELD_NAME"] == "UF_BLOG_POST_VOTE")
				{
					$obUserField->Update($arRes["ID"], $arField);
				}
			}

			if (
				$createIndex
				&& $DB->TableExists('b_uts_blog_post')
				&& !$DB->IndexExists(
					'b_uts_blog_post',
					(mb_strtolower($DB->type) === 'pgsql'
						? ['uf_blog_post_imprtnt', 'uf_imprtant_date_end']
						: ['UF_BLOG_POST_IMPRTNT', 'UF_IMPRTANT_DATE_END']),
					true,
				)
			)
			{
				\Bitrix\Main\Application::getConnection()->runDdl(
					(new \Bitrix\Main\DB\Ddl\Builder\AlterTableBuilder('b_uts_blog_post'))->addIndex(
						'IX_UF_BLOG_POST_IMPRTNT_DATE',
						['UF_BLOG_POST_IMPRTNT', 'UF_IMPRTANT_DATE_END'],
					),
				);
			}
		}

		return $errors;
	}

	public static function installDiskUserFields()
	{
		global $APPLICATION;
		$errors = null;

		if(!IsModuleInstalled('disk'))
		{
			return null;
		}

		$props = array(
			array(
				"ENTITY_ID" => "SONET_COMMENT",
				"FIELD_NAME" => "UF_SONET_COM_VER",
				"USER_TYPE_ID" => "disk_version"
			),
			array(
				"ENTITY_ID" => "SONET_LOG",
				"FIELD_NAME" => "UF_SONET_LOG_DOC",
				"USER_TYPE_ID" => "disk_file"
			),
			array(
				"ENTITY_ID" => "SONET_COMMENT",
				"FIELD_NAME" => "UF_SONET_COM_DOC",
				"USER_TYPE_ID" => "disk_file"
			),
		);
		$uf = new CUserTypeEntity;
		foreach ($props as $prop)
		{
			$rsData = CUserTypeEntity::getList(array("ID" => "ASC"), array("ENTITY_ID" => $prop["ENTITY_ID"], "FIELD_NAME" => $prop["FIELD_NAME"]));
			if (!($rsData && ($arRes = $rsData->Fetch())))
			{
				$intID = $uf->add(array(
					"ENTITY_ID" => $prop["ENTITY_ID"],
					"FIELD_NAME" => $prop["FIELD_NAME"],
					"XML_ID" => $prop["FIELD_NAME"],
					"USER_TYPE_ID" => $prop["USER_TYPE_ID"],
					"SORT" => 100,
					"MULTIPLE" => ($prop["USER_TYPE_ID"] == "disk_version" ? "N" : "Y"),
					"MANDATORY" => "N",
					"SHOW_FILTER" => "N",
					"SHOW_IN_LIST" => "N",
					"EDIT_IN_LIST" => "Y",
					"IS_SEARCHABLE" => ($prop["USER_TYPE_ID"] == "disk_file" ? "Y" : "N")
				), false);

				if (false == $intID && ($strEx = $APPLICATION->getException()))
				{
					$errors[] = $strEx->getString();
				}
			}
		}

		return $errors;
	}

	public static function installIntranetUserFields()
	{
		global $APPLICATION, $DB;
		$errors = null;

		if(!IsModuleInstalled('intranet'))
		{
			return null;
		}

		if(!CModule::IncludeModule('iblock'))
		{
			return null;
		}

		$iblockId = false;

		$res = $DB->Query("select ID from b_iblock where CODE='departments' AND IBLOCK_TYPE_ID='structure'", true);
		if (
			($ar = $res->Fetch())
			&& intval($ar['ID']) > 0
		)
		{
			$iblockId = $ar['ID'];
		}

		if(intval($iblockId) <= 0)
		{
			return null;
		}

		$arUFSettings = array(
			'DISPLAY' => 'LIST',
			'LIST_HEIGHT' => '8',
			'IBLOCK_ID' => $iblockId,
			'ACTIVE_FILTER' => 'Y'
		);

		$props = array(
			array(
				"ENTITY_ID" => "SONET_GROUP",
				"FIELD_NAME" => "UF_SG_DEPT",
				"USER_TYPE_ID" => "iblock_section",
				"MULTIPLE" => "Y",
				"SETTINGS" => $arUFSettings
			)
		);
		$uf = new CUserTypeEntity;
		foreach ($props as $prop)
		{
			$rsData = CUserTypeEntity::getList(array("ID" => "ASC"), array("ENTITY_ID" => $prop["ENTITY_ID"], "FIELD_NAME" => $prop["FIELD_NAME"]));
			if (!($rsData && ($arRes = $rsData->Fetch())))
			{
				$arUFFields = array(
					"ENTITY_ID" => $prop["ENTITY_ID"],
					"FIELD_NAME" => $prop["FIELD_NAME"],
					"XML_ID" => $prop["FIELD_NAME"],
					"USER_TYPE_ID" => $prop["USER_TYPE_ID"],
					"SORT" => 100,
					"MULTIPLE" => $prop["MULTIPLE"],
					"MANDATORY" => "N",
					"SHOW_FILTER" => "N",
					"SHOW_IN_LIST" => "N",
					"EDIT_IN_LIST" => "Y",
					"IS_SEARCHABLE" => "N",
					"SETTINGS" => $prop["SETTINGS"],
				);

				$dbLangs = CLanguage::GetList("", "", array("ACTIVE" => "Y"));
				while ($arLang = $dbLangs->Fetch())
				{
					$messages = IncludeModuleLangFile($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/socialnetwork/install/index.php", $arLang["LID"], true);
					$arUFFields["EDIT_FORM_LABEL"][$arLang["LID"]] = $messages["SONET_".$prop["FIELD_NAME"]."_EDIT_FORM_LABEL"];
					$arUFFields["LIST_COLUMN_LABEL"][$arLang["LID"]] = $messages["SONET_".$prop["FIELD_NAME"]."_LIST_COLUMN_LABEL"];
					$arUFFields["LIST_FILTER_LABEL"][$arLang["LID"]] = $messages["SONET_".$prop["FIELD_NAME"]."_LIST_FILTER_LABEL"];
				}

				$intID = $uf->add($arUFFields, false);

				if (false == $intID && ($strEx = $APPLICATION->getException()))
				{
					$errors[] = $strEx->getString();
				}
			}
		}

		return $errors;
	}

	function UnInstallUserFields($id = "all")
	{
		global $DB;

		$id = (empty($id) ? "all" : (in_array($id, array("all", "webdav"/*, "blog"*/)) ? $id : false));
		if (!!$id)
		{
			$arFields = array(
				array(
					"ENTITY_ID" => "SONET_LOG",
					"FIELD_NAME" => "UF_SONET_LOG_FILE",
					"XML_ID" => "UF_SONET_LOG_FILE"
				),
				array(
					"ENTITY_ID" => "SONET_LOG",
					"FIELD_NAME" => "UF_SONET_LOG_DOC",
					"XML_ID" => "UF_SONET_LOG_DOC"
				),
				array(
					"ENTITY_ID" => "SONET_COMMENT",
					"FIELD_NAME" => "UF_SONET_COM_FILE",
					"XML_ID" => "UF_SONET_COM_FILE"
				),
				array(
					"ENTITY_ID" => "SONET_COMMENT",
					"FIELD_NAME" => "UF_SONET_COM_DOC",
					"XML_ID" => "UF_SONET_COM_DOC"
				),
				array(
					"ENTITY_ID" => "BLOG_POST",
					"FIELD_NAME" => "UF_BLOG_POST_IMPRTNT",
					"XML_ID" => "UF_BLOG_POST_IMPRTNT"
				),
				array(
					"ENTITY_ID" => "BLOG_POST",
					"FIELD_NAME" => "UF_BLOG_POST_VOTE",
					"XML_ID" => "UF_BLOG_POST_VOTE"
				),
				array(
					"ENTITY_ID" => "SONET_LOG",
					"FIELD_NAME" => "UF_SONET_LOG_URL_PRV",
					"XML_ID" => "UF_SONET_LOG_URL_PRV"
				),
				array(
					"ENTITY_ID" => "SONET_COMMENT",
					"FIELD_NAME" => "UF_SONET_COM_URL_PRV",
					"XML_ID" => "UF_SONET_COM_URL_PRV"
				)
			);

			if ($id == "webdav")
				$arFields = array(
					array(
						"ENTITY_ID" => "SONET_LOG",
						"FIELD_NAME" => "UF_SONET_LOG_DOC",
						"XML_ID" => "UF_SONET_LOG_DOC"
					),
					array(
						"ENTITY_ID" => "SONET_COMMENT",
						"FIELD_NAME" => "UF_SONET_COM_DOC",
						"XML_ID" => "UF_SONET_COM_DOC"
					),
				);

			foreach ($arFields as $arField)
			{
				$rsData = CUserTypeEntity::GetList(array("ID" => "ASC"), $arField);
				if ($arRes = $rsData->Fetch())
				{
					if (
						$arField["FIELD_NAME"] == "UF_BLOG_POST_IMPRTNT"
						&& $DB->TableExists("b_uts_blog_post")
					)
					{
						$isPostgreSql = (mb_strtolower($DB->type) === 'pgsql');
						$indexes = [
							[
								'columns' => ($isPostgreSql
									? ['uf_blog_post_imprtnt', 'uf_imprtant_date_end']
									: ['UF_BLOG_POST_IMPRTNT', 'UF_IMPRTANT_DATE_END']),
								'name' => ($isPostgreSql
									? 'ix_b_uts_blog_post_uf_blog_post_imprtnt_uf_imprtant_date_end'
									: 'IX_UF_BLOG_POST_IMPRTNT_DATE'),
							],
						];
						$indexes[] = [
							'columns' => ($isPostgreSql
								? ['uf_imprtant_date_end', 'uf_blog_post_imprtnt']
								: ['UF_IMPRTANT_DATE_END', 'UF_BLOG_POST_IMPRTNT']),
							'name' => ($isPostgreSql
								? 'ux_uf_blog_post_imprtnt2'
								: 'UX_UF_BLOG_POST_IMPRTNT2'),
						];

						$alterTableBuilder = new \Bitrix\Main\DB\Ddl\Builder\AlterTableBuilder('b_uts_blog_post');
						$hasIndexesToDrop = false;
						foreach ($indexes as $index)
						{
							$indexName = $DB->GetIndexName('b_uts_blog_post', $index['columns'], true);
							if ($indexName !== $index['name'])
							{
								continue;
							}

							$alterTableBuilder->dropIndex($indexName);
							$hasIndexesToDrop = true;
						}
						if ($hasIndexesToDrop)
						{
							\Bitrix\Main\Application::getConnection()->runDdl($alterTableBuilder);
						}
					}
					$ent = new CUserTypeEntity;
					$ent->Delete($arRes['ID']);
				}
			}
		}
	}

	function InstallEvents()
	{
		global $DB;

		$sIn = "'SONET_NEW_MESSAGE', 'SONET_INVITE_FRIEND', 'SONET_INVITE_GROUP', 'SONET_AGREE_FRIEND', 'SONET_BAN_FRIEND', 'SONET_NEW_EVENT_GROUP', 'SONET_NEW_EVENT_USER'";
		$rs = $DB->Query("SELECT count(*) C FROM b_event_type WHERE EVENT_NAME IN (".$sIn.") ");
		$ar = $rs->Fetch();
		if($ar["C"] <= 0)
		{
			$pathInMessage = (array_key_exists("public_path", $_REQUEST) ? $_REQUEST["public_path"] : "");
			if ($pathInMessage == '')
			{
				if (file_exists($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/intranet"))
					$pathInMessage = "/company/personal/";
				else
					$pathInMessage = "/club/";
			}
			include($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/socialnetwork/install/events/set_events.php");
		}
		return true;
	}

	function UnInstallEvents()
	{
		global $DB;
		include_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/socialnetwork/install/events/del_events.php");
		return true;
	}

	function InstallFiles()
	{
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/socialnetwork/install/admin", $_SERVER["DOCUMENT_ROOT"]."/bitrix/admin", true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/socialnetwork/install/images",  $_SERVER["DOCUMENT_ROOT"]."/bitrix/images/socialnetwork", true, True);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/socialnetwork/install/sounds",  $_SERVER["DOCUMENT_ROOT"]."/bitrix/sounds", true, True);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/socialnetwork/install/themes", $_SERVER["DOCUMENT_ROOT"]."/bitrix/themes", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/socialnetwork/install/components", $_SERVER["DOCUMENT_ROOT"]."/bitrix/components", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/socialnetwork/install/gadgets", $_SERVER["DOCUMENT_ROOT"]."/bitrix/gadgets", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/socialnetwork/install/tools", $_SERVER["DOCUMENT_ROOT"]."/bitrix/tools", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/socialnetwork/install/js", $_SERVER["DOCUMENT_ROOT"]."/bitrix/js", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/socialnetwork/install/activities", $_SERVER["DOCUMENT_ROOT"]."/bitrix/activities", true, true);
		return true;
	}

	function InstallPublic()
	{
		$arSite = array();
		$arSites = array();
		$arInstallParams = array();

		//getting params from $_REQUEST
		$dbSites = CSite::GetList('', '', Array("ACTIVE" => "Y"));
		while ($arSite = $dbSites->GetNext())
		{
			if ($_REQUEST["install_site_id_".$arSite["ID"]] <> '')
			{
				$arInstallParams[$arSite["ID"]]["install_site_id"] = $_REQUEST["install_site_id_".$arSite["ID"]];
				$arInstallParams[$arSite["ID"]]["installPath"] = $_REQUEST["public_path_".$arSite["ID"]];
				$arInstallParams[$arSite["ID"]]["install404"] = (($_REQUEST["is404_".$arSite["ID"]] == "Y") ? true : false);
				$arInstallParams[$arSite["ID"]]["installRewrite"] = (($_REQUEST["public_rewrite_".$arSite["ID"]] == "Y") ? true : false);
				$arSites[] = $arSite;
			}
		}

		//running installation script for each site
		foreach ($arSites as $site)
		{
			$installSiteID = $arInstallParams[$site["ID"]]["install_site_id"];
			$installPath = $arInstallParams[$site["ID"]]["installPath"];
			$install404 = $arInstallParams[$site["ID"]]["install404"];
			$installRewrite = $arInstallParams[$site["ID"]]["installRewrite"];

			include($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/socialnetwork/install/install_demo.php");
		}
	}

	function UnInstallFiles()
	{
		DeleteDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/socialnetwork/install/admin", $_SERVER["DOCUMENT_ROOT"]."/bitrix/admin");
		DeleteDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/socialnetwork/install/themes/.default/", $_SERVER["DOCUMENT_ROOT"]."/bitrix/themes/.default");//css
		DeleteDirFilesEx("/bitrix/themes/.default/icons/socialnetwork/");//icons
		DeleteDirFilesEx("/bitrix/images/socialnetwork/");//images
		DeleteDirFilesEx("/bitrix/sounds/socialnetwork/");//sounds
		DeleteDirFilesEx("/bitrix/js/socialnetwork/");//javascript

		return true;
	}

	function DoInstall()
	{
		global $APPLICATION, $step;
		$step = intval($step);
		if ($step < 2)
			$APPLICATION->IncludeAdminFile(Loc::getMessage("SONET_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/socialnetwork/install/step1.php");
		elseif($step==2)
		{
			$this->InstallFiles();
			$this->InstallDB(false);
			$this->InstallEvents();
			$this->InstallPublic();
			$GLOBALS["errors"] = $this->errors;

			$APPLICATION->IncludeAdminFile(Loc::getMessage("SONET_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/socialnetwork/install/step2.php");
		}
	}

	function DoUninstall()
	{
		global $APPLICATION, $step;
		$step = intval($step);
		if($step<2)
			$APPLICATION->IncludeAdminFile(Loc::getMessage("SONET_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/socialnetwork/install/unstep1.php");
		elseif($step==2)
		{
			$this->UnInstallDB(array(
				"savedata" => $_REQUEST["savedata"],
			));
			$this->UnInstallFiles();

			if($_REQUEST["saveemails"] != "Y")
				$this->UnInstallEvents();

			$GLOBALS["errors"] = $this->errors;

			$APPLICATION->IncludeAdminFile(Loc::getMessage("SONET_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/socialnetwork/install/unstep2.php");
		}
	}

	function GetModuleRightList()
	{
		$arr = array(
			"reference_id" => array("D", "K", "R", "W"),
			"reference" => array(
					"[D] ".Loc::getMessage("SONETP_PERM_D"),
					"[K] ".Loc::getMessage("SONETP_PERM_K"),
					"[R] ".Loc::getMessage("SONETP_PERM_R"),
					"[W] ".Loc::getMessage("SONETP_PERM_W")
				),
			"use_site" => array("K", "W")
			);
		return $arr;
	}
}
