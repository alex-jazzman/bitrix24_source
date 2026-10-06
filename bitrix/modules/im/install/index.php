<?php

if (class_exists("im"))
{
	return;
}

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ModuleManager;

class im extends \CModule
{
	public $MODULE_ID = 'im';
	public $MODULE_GROUP_RIGHTS = 'Y';
	public $errors = '';

	public function __construct()
	{
		$arModuleVersion = [];

		include(__DIR__.'/version.php');

		if (is_array($arModuleVersion) && array_key_exists("VERSION", $arModuleVersion))
		{
			$this->MODULE_VERSION = $arModuleVersion["VERSION"];
			$this->MODULE_VERSION_DATE = $arModuleVersion["VERSION_DATE"];
		}

		$this->MODULE_NAME = Loc::getMessage("IM_MODULE_NAME");
		$this->MODULE_DESCRIPTION = Loc::getMessage("IM_MODULE_DESCRIPTION");
	}

	function DoInstall()
	{
		$this->InstallFiles();
		$this->InstallDB();

		$GLOBALS['APPLICATION']->IncludeAdminFile(Loc::getMessage("IM_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/im/install/step1.php");
	}

	function InstallDB()
	{
		global $DB, $APPLICATION;
		$this->errors = false;

		$migrationResult = $this->installMigrations();
		if (!$migrationResult->isSuccess())
		{
			$this->errors = $migrationResult->getErrorMessages();
			$APPLICATION->ThrowException(implode(' ', $this->errors));

			return false;
		}

		\Bitrix\Main\ModuleManager::registerModule("im");

		$eventManager = \Bitrix\Main\EventManager::getInstance();

		$eventManager->registerEventHandlerCompatible("main", "OnProlog", "main", "", "", 3, "/modules/im/ajax_hit.php");
		$eventManager->registerEventHandlerCompatible('rest', 'onRestCheckAuth', 'im', '\Bitrix\Im\V2\Guest\Auth\GuestRestAuth', 'onRestCheckAuth', 50);
		$eventManager->registerEventHandlerCompatible('main', 'OnApplicationsBuildList', 'main', '\Bitrix\Im\V2\Guest\Auth\GuestApplication', 'onApplicationsBuildList', 100, 'modules/im/lib/V2/Guest/Auth/GuestApplication.php'); // module 'main' + explicit path: handler must be loadable before im module is included

		$solution = \Bitrix\Main\Config\Option::get("main", "wizard_solution", false);
		if ($solution == 'community')
		{
			\Bitrix\Main\Config\Option::set("im", "path_to_user_profile",'/people/user/#user_id#/');
		}

		\Bitrix\Main\Loader::includeModule("im");

		\Bitrix\Im\Integration\Intranet\User::registerEventHandler();

		if (\CIMConvert::ConvertCount() > 0)
		{
			\CAdminNotify::Add([
				"MESSAGE" => Loc::getMessage("IM_CONVERT_MESSAGE", Array("#A_TAG_START#" => '<a href="/bitrix/admin/im_convert.php?lang='.LANGUAGE_ID.'">', "#A_TAG_END#" => "</a>")),
				"TAG" => "IM_CONVERT",
				"MODULE_ID" => "IM",
				"ENABLE_CLOSE" => "Y"
			]);
			\CAgent::AddAgent("CIMConvert::UndeliveredMessageAgent();", "im", "N", 20, next_exec: ConvertTimeStamp(time()+CTimeZone::GetOffset()+20, "FULL"), existError: false);
		}

		$this->InstallTemplateRules();
		$this->InstallEvents();
		$this->InstallUserFields();
		$this->installDefaultConfigurationPreset();
		\Bitrix\Main\Config\Option::set('im', 'im_link_url_migration', 'Y'); /** @see \Bitrix\Im\V2\Link\Url\UrlItem::$migrationOptionName */
		\Bitrix\Main\Config\Option::set('im', 'im_link_file_migration', 'Y'); /** @see \Bitrix\Im\V2\Link\File\FileItem::$migrationOptionName */

		return true;
	}

	function InstallFiles()
	{
		global $APPLICATION;

		\CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/im/install/js", $_SERVER["DOCUMENT_ROOT"]."/bitrix/js", true, true);
		\CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/im/install/components", $_SERVER["DOCUMENT_ROOT"]."/bitrix/components", true, true);
		\CopyDirFiles($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/im/install/activities', $_SERVER['DOCUMENT_ROOT'].'/bitrix/activities', true, true);
		\CopyDirFiles($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/im/install/admin', $_SERVER['DOCUMENT_ROOT'].'/bitrix/admin', true, true);
		\CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/im/install/templates", $_SERVER["DOCUMENT_ROOT"]."/bitrix/templates", true, true);
		\CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/im/install/public", $_SERVER["DOCUMENT_ROOT"]."/", true, true);
		\CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/im/install/images",  $_SERVER["DOCUMENT_ROOT"]."/bitrix/images/im", true, true);

		// URL rewrite rules are only needed for bare box without bitrix24 and intranet.
		// When intranet is installed, /online/ path is routed via intranet routes.
		if (
			!\Bitrix\Main\ModuleManager::isModuleInstalled('bitrix24')
			&& !\Bitrix\Main\ModuleManager::isModuleInstalled('intranet')
		)
		{
			$siteId = \CSite::GetDefSite();
			if ($siteId)
			{
				\Bitrix\Main\UrlRewriter::add($siteId, [
					"CONDITION" => "#^/online/([\.\-0-9a-zA-Z]+)(/?)([^/]*)#",
					"RULE" => "alias=\$1",
					"PATH" => "/desktop_app/router.php",
				]);
				\Bitrix\Main\UrlRewriter::add($siteId, [
					"CONDITION" => "#^/online/(/?)([^/]*)#",
					"RULE" => "",
					"PATH" => "/desktop_app/router.php",
				]);
			}
		}

		$APPLICATION->setFileAccessPermission('/desktop_app/', ["*" => "R"]);
		$APPLICATION->setFileAccessPermission('/online/', ["*" => "R"]);

		return true;
	}

	function InstallEvents()
	{
		global $DB;

		$rs = $DB->Query("SELECT count(*) as CNT FROM b_event_type WHERE EVENT_NAME IN ('IM_NEW_NOTIFY', 'IM_NEW_NOTIFY_GROUP', 'IM_NEW_MESSAGE', 'IM_NEW_MESSAGE_GROUP') ");
		$ar = $rs->Fetch();
		if ($ar["CNT"] <= 0)
		{
			include($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/im/install/events/set_events.php");
		}

		return true;
	}

	function InstallTemplateRules()
	{
		if (
			file_exists($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/intranet/install/templates/pub/")
			&& !file_exists($_SERVER["DOCUMENT_ROOT"]."/bitrix/templates/pub/")
		)
		{
			\CopyDirFiles(
				$_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/intranet/install/templates/pub/",
				$_SERVER["DOCUMENT_ROOT"]."/bitrix/templates/pub/",
				$rewrite = true,
				$recursive = true,
				$delete_after_copy = false
			);
		}

		$default_site_id = \CSite::GetDefSite();
		if ($default_site_id)
		{
			$pubAppFound = false;

			$arPubTempalate = [
				"SORT" => 100,
				"CONDITION" => 'preg_match("#^/online/([\.\-0-9a-zA-Z]+)(/?)([^/]*)#", $GLOBALS[\'APPLICATION\']->GetCurPage(0))',
				"TEMPLATE" => "pub"
			];

			$arFields = ["TEMPLATE" => []];
			$dbTemplates = \CSite::GetTemplateList($default_site_id);
			while ($template = $dbTemplates->Fetch())
			{
				if ($template["CONDITION"] == 'preg_match("#^/online/([\.\-0-9a-zA-Z]+)(/?)([^/]*)#", $GLOBALS[\'APPLICATION\']->GetCurPage(0))')
				{
					$pubAppFound = true;
					$template = $arPubTempalate;
				}
				$arFields["TEMPLATE"][] = [
					"SORT" => $template['SORT'],
					"CONDITION" => $template['CONDITION'],
					"TEMPLATE" => $template['TEMPLATE'],
				];
			}
			if (!$pubAppFound)
			{
				$arFields["TEMPLATE"][] = $arPubTempalate;
			}

			$obSite = new \CSite;
			$arFields["LID"] = $default_site_id;
			$obSite->Update($default_site_id, $arFields);
		}

		return true;
	}

	function InstallUserFields()
	{
		$arFields = [];
		$arFields['ENTITY_ID'] = 'USER';
		$arFields['FIELD_NAME'] = 'UF_IM_SEARCH';

		$rs = \CUserTypeEntity::GetList([], [
			"ENTITY_ID" => $arFields["ENTITY_ID"],
			"FIELD_NAME" => $arFields["FIELD_NAME"],
		]);
		if (!$rs->Fetch())
		{
			$arMess['IM_UF_NAME_SEARCH'] = 'IM: users can find';

			$arFields['USER_TYPE_ID'] = 'string';
			$arFields['EDIT_IN_LIST'] = 'N';
			$arFields['SHOW_IN_LIST'] = 'N';
			$arFields['MULTIPLE'] = 'N';

			$arFields['EDIT_FORM_LABEL'][LANGUAGE_ID] = $arMess['IM_UF_NAME_SEARCH'];
			$arFields['LIST_COLUMN_LABEL'][LANGUAGE_ID] = $arMess['IM_UF_NAME_SEARCH'];
			$arFields['LIST_FILTER_LABEL'][LANGUAGE_ID] = $arMess['IM_UF_NAME_SEARCH'];
			if (LANGUAGE_ID != 'en')
			{
				$arFields['EDIT_FORM_LABEL']['en'] = $arMess['IM_UF_NAME_SEARCH'];
				$arFields['LIST_COLUMN_LABEL']['en'] = $arMess['IM_UF_NAME_SEARCH'];
				$arFields['LIST_FILTER_LABEL']['en'] = $arMess['IM_UF_NAME_SEARCH'];
			}

			$CUserTypeEntity = new \CUserTypeEntity();
			$CUserTypeEntity->Add($arFields);
		}
	}

	function installDefaultConfigurationPreset()
	{
		$defaultGroupId = \Bitrix\Main\Config\Option::get('im', \Bitrix\Im\Configuration\Configuration::DEFAULT_PRESET_SETTING_NAME, null);
		if ($defaultGroupId !== null)
		{
			return $defaultGroupId;
		}

		$defaultGroupId = Bitrix\Im\Configuration\Configuration::createDefaultPreset();

		$usersQuery =
			\Bitrix\Main\UserTable::query()
				->addSelect('ID')
				->where('REAL_USER', 'expr', true)
		;

		$userBindings = [];
		foreach ($usersQuery->exec() as $row)
		{
			$userBindings[] = [
				'USER_ID' => $row['ID'],
				'GENERAL_GROUP_ID' => $defaultGroupId,
				'NOTIFY_GROUP_ID' => $defaultGroupId,
			];
		}
		if (!empty($userBindings))
		{
			\Bitrix\Im\Model\OptionUserTable::addMulti($userBindings, true);
		}

		return $defaultGroupId;
	}

	public function DoUninstall(): void
	{
		global $APPLICATION;

		$step = (int)($_REQUEST['step'] ?? 1);

		$dependencyErrors = $this->checkUninstallDependencies();
		if (!empty($dependencyErrors))
		{
			$APPLICATION->ThrowException(Loc::getMessage('IM_MODULE_UNINSTALL_ERROR_UNINSTALL_DEPENDENCIES', [
				'#MODULES#' => implode(', ', $dependencyErrors),
			]));

			$this->showUninstallUnstep(1);
		}

		if ($step < 2)
		{
			$this->showUninstallUnstep(1);
		}
		elseif ($step == 2)
		{
			$this->UnInstallDB(["savedata" => $_REQUEST["savedata"]]);

			if (!isset($_REQUEST["saveemails"]) || $_REQUEST["saveemails"] != "Y")
			{
				$this->UnInstallEvents();
			}

			$this->UnInstallFiles();

			$this->showUninstallUnstep(2);
		}
	}

	function UnInstallDB($arParams = [])
	{
		global $APPLICATION, $DB;
		$this->errors = false;

		\Bitrix\Main\Loader::includeModule('im');

		$needDropTables = !array_key_exists('savedata', $arParams) || $arParams['savedata'] != 'Y';

		$migrationResult = $this->uninstallMigrations($needDropTables);
		if (!$migrationResult->isSuccess())
		{
			$this->errors = $migrationResult->getErrorMessages();
			$APPLICATION->ThrowException(implode("", $this->errors));
			return false;
		}

		if ($needDropTables)
		{
			\Bitrix\Main\Config\Option::delete("im", ['name' => "general_chat_id"]);
			\Bitrix\Im\V2\Chat\GeneralChat::cleanGeneralChatCache(\Bitrix\Im\V2\Chat\GeneralChat::ID_CACHE_ID);
			\Bitrix\Im\V2\Chat\GeneralChat::cleanGeneralChatCache(\Bitrix\Im\V2\Chat\GeneralChat::MANAGERS_CACHE_ID);
			\Bitrix\Main\Config\Option::delete('im', ['name' => \Bitrix\Im\Configuration\Configuration::DEFAULT_PRESET_SETTING_NAME]);
		}

		\Bitrix\Im\Integration\Intranet\User::unRegisterEventHandler();

		\CAdminNotify::DeleteByTag("IM_CONVERT");

		$eventManager = \Bitrix\Main\EventManager::getInstance();

		$eventManager->unRegisterEventHandler("main", "OnProlog", "main", "", "", "/modules/im/ajax_hit.php");
		$eventManager->unRegisterEventHandler('rest', 'onRestCheckAuth', 'im', '\Bitrix\Im\V2\Guest\Auth\GuestRestAuth', 'onRestCheckAuth');
		$eventManager->unRegisterEventHandler('main', 'OnApplicationsBuildList', 'main', '\Bitrix\Im\V2\Guest\Auth\GuestApplication', 'onApplicationsBuildList', 'modules/im/lib/V2/Guest/Auth/GuestApplication.php');

		$this->UnInstallUserFields($arParams);

		\Bitrix\Main\ModuleManager::unRegisterModule("im");

		return true;
	}

	function UnInstallFiles($arParams = [])
	{
		global $APPLICATION;

		\DeleteDirFilesEx('/desktop_app/');
		\DeleteDirFilesEx('/bitrix/templates/desktop_app/');
		\DeleteDirFilesEx('/bitrix/images/im/');

		$APPLICATION->SetFileAccessPermission('/desktop_app/', array("*" => "D"));

		return true;
	}

	function UnInstallEvents()
	{
		global $DB;

		include_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/im/install/events/del_events.php");

		return true;
	}

	function UnInstallUserFields($arParams = [])
	{
		if (!$arParams['savedata'])
		{
			$res = \CUserTypeEntity::GetList(Array(), Array('ENTITY_ID' => 'USER', 'FIELD_NAME' => 'UF_IM_SEARCH'));
			$arFieldData = $res->Fetch();
			if (isset($arFieldData['ID']))
			{
				$CUserTypeEntity = new \CUserTypeEntity();
				$CUserTypeEntity->Delete($arFieldData['ID']);
			}
		}

		return true;
	}

	public static function OnGetTableSchema()
	{
		return array(
			"im" => array(
				"b_im_message" => array(
					"ID" => array(
						"b_im_relation" => "LAST_ID",
						"b_im_relation^" => "LAST_SEND_ID",
						"b_im_relation^^" => "START_ID",
						"b_im_relation^^^" => "UNREAD_ID",
						"b_disk_object" => "LAST_FILE_ID",
						"b_im_chat" => "LAST_MESSAGE_ID",
						"b_im_message_param" => "MESSAGE_ID",
						"b_im_recent" => "ITEM_MID",
					),
					"CHAT_ID" => array(
						"b_im_chat" => "ID",
					),
				),
				"b_im_chat" => array(
					"ID" => array(
						"b_im_message" => "CHAT_ID",
						"b_im_relation" => "CHAT_ID",
						"b_im_recent" => "ITEM_CID",
					),
				),
				"b_im_relation" => array(
					"ID" => array(
						"b_im_recent" => "ITEM_RID",
					),
					"CHAT_ID" => array(
						"b_im_chat" => "ID",
					),
				),
			),
			"main" => array(
				"b_user" => array(
					"ID" => array(
						"b_im_relation" => "USER_ID",
						"b_im_message" => "AUTHOR_ID",
						"b_im_chat" => "AUTHOR_ID",
					),
				),
				"b_module" => array(
					"ID" => array(
						"b_im_message" => "NOTIFY_MODULE",
					),
				),
			),
			"imopelines" => array(
				"b_imopenlines_session" => array(
					"ID" => array(
						"b_im_recent" => "ITEM_OLID",
					),
				),
			),
		);
	}

	private function showUninstallUnstep(int $unstep): void
	{
		global $APPLICATION;

		$APPLICATION->IncludeAdminFile(
			Loc::getMessage("IM_UNINSTALL_TITLE"),
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/' . $this->MODULE_ID . "/install/unstep{$unstep}.php"
		);
	}

	private function checkUninstallDependencies(): array
	{
		if (ModuleManager::isModuleInstalled('tasks'))
		{
			return ['tasks'];
		}

		return [];
	}
}
