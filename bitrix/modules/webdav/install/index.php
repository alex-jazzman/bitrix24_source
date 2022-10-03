<?global $DOCUMENT_ROOT, $MESS;
use Bitrix\Main\Config\Option;

IncludeModuleLangFile(__FILE__);

if (class_exists("webdav")) return;

Class webdav extends CModule
{
	var $MODULE_ID = "webdav";
	var $MODULE_VERSION;
	var $MODULE_VERSION_DATE;
	var $MODULE_NAME;
	var $MODULE_DESCRIPTION;
	var $MODULE_CSS;
	var $MODULE_GROUP_RIGHTS = "Y";

	public function __construct()
	{
		$arModuleVersion = array();

		include(__DIR__.'/version.php');

		if (is_array($arModuleVersion) && array_key_exists("VERSION", $arModuleVersion))
		{
			$this->MODULE_VERSION = $arModuleVersion["VERSION"];
			$this->MODULE_VERSION_DATE = $arModuleVersion["VERSION_DATE"];
		}
		else
		{
			$this->MODULE_VERSION = FORUM_VERSION;
			$this->MODULE_VERSION_DATE = FORUM_VERSION_DATE;
		}

		$this->MODULE_NAME = GetMessage("WD_MODULE_NAME");
		$this->MODULE_DESCRIPTION = GetMessage("WD_MODULE_DESCRIPTION");
	}

	function InstallUserFields()
	{
		global $USER_FIELD_MANAGER, $APPLICATION;
		AddEventHandler("main", "OnUserTypeBuildList", array("CUserTypeWebdavElement", "GetUserTypeDescription"));
		AddEventHandler("main", "OnUserTypeBuildList", array("CUserTypeWebdavElementHistory", "GetUserTypeDescription"));
		require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/webdav/classes/usertypewebdav.php");
		require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/webdav/classes/usertypewebdavelementhistory.php");
		$USER_FIELD_MANAGER->CleanCache();
		$USER_FIELD_MANAGER->arUserTypes = '';

		$arFields = array(
			"BLOG_POST" => array(
				"ENTITY_ID" => "BLOG_POST",
				"FIELD_NAME" => "UF_BLOG_POST_FILE",
				"XML_ID" => "UF_BLOG_POST_FILE"
			),
			"BLOG_COMMENT" => array(
				"ENTITY_ID" => "BLOG_COMMENT",
				"FIELD_NAME" => "UF_BLOG_COMMENT_FILE",
				"XML_ID" => "UF_BLOG_COMMENT_FILE"
			),
		);

		$arFieldProps = Array(
			"USER_TYPE_ID" => "webdav_element",
			"SORT" => 100,
			"MULTIPLE" => "Y",
			"MANDATORY" => "N",
			"SHOW_FILTER" => "N",
			"SHOW_IN_LIST" => "N",
			"EDIT_IN_LIST" => "Y",
			"IS_SEARCHABLE" => "N",
			"SETTINGS" => array(),
			"EDIT_FORM_LABEL" => "",
			"LIST_COLUMN_LABEL" => "",
			"LIST_FILTER_LABEL" => "",
			"ERROR_MESSAGE" => "",
			"HELP_MESSAGE" => ""
		);

		$typeData = CUserTypeEntity::GetList(array(), array("ENTITY_ID" => "BLOG_COMMENT",
			"FIELD_NAME" => "UF_BLOG_COMMENT_FH",
			"XML_ID" => "UF_BLOG_COMMENT_FH"
		));
		if (!($typeData = $typeData->Fetch()))
		{
			$arFieldPropsHistory = Array(
				"USER_TYPE_ID" => "webdav_element_history",
				"SORT" => 100,
				"MULTIPLE" => "N",
				"MANDATORY" => "N",
				"SHOW_FILTER" => "N",
				"SHOW_IN_LIST" => "N",
				"EDIT_IN_LIST" => "Y",
				"IS_SEARCHABLE" => "N",
				"SETTINGS" => array(),
				"EDIT_FORM_LABEL" => "",
				"LIST_COLUMN_LABEL" => "",
				"LIST_FILTER_LABEL" => "",
				"ERROR_MESSAGE" => "",
				"HELP_MESSAGE" => "",
				"ENTITY_ID" => "BLOG_COMMENT",
				"FIELD_NAME" => "UF_BLOG_COMMENT_FH",
				"XML_ID" => "UF_BLOG_COMMENT_FH"
			);
			$obUserField  = new CUserTypeEntity;
			$intID = $obUserField->Add($arFieldPropsHistory);
			if (false == $intID)
			{
				if ($strEx = $APPLICATION->GetException())
				{
					$this->errors[] = $strEx->GetString();
				}
			}

		}

		foreach ($arFields as $fieldName => $arField)
		{
			$rsData = CUserTypeEntity::GetList(array(), $arField);
			if ($arRes = $rsData->Fetch())
			{
				$intID = $arRes['ID'];
			}
			else
			{
				$arProps = $arFieldProps + $arField;
				$obUserField  = new CUserTypeEntity;
				$intID = $obUserField->Add($arProps);

				if (false == $intID)
				{
					if ($strEx = $APPLICATION->GetException())
					{
						$this->errors[] = $strEx->GetString();
					}
				}
			}
		}

		$rsData = CUserTypeEntity::GetList(
			array(),
			array(
				"ENTITY_ID" => "BLOG_POST",
				"XML_ID" => "UF_BLOG_POST_F_EDIT"
			)
		);
		$arRes = $rsData->Fetch();
		if (!$arRes)
		{
			$arFieldProps = Array(
				"USER_TYPE_ID" => "boolean",
				"SORT" => 100,
				"MULTIPLE" => "N",
				"MANDATORY" => "N",
				"SHOW_FILTER" => "N",
				"SHOW_IN_LIST" => "N",
				"EDIT_IN_LIST" => "Y",
				"IS_SEARCHABLE" => "N",
				"SETTINGS" => array(),
				"EDIT_FORM_LABEL" => "",
				"LIST_COLUMN_LABEL" => "",
				"LIST_FILTER_LABEL" => "",
				"ERROR_MESSAGE" => "",
				"HELP_MESSAGE" => "",
				"ENTITY_ID" => "BLOG_POST",
				"FIELD_NAME" => "UF_BLOG_POST_F_EDIT",
				"XML_ID" => "UF_BLOG_POST_F_EDIT"
			);

			$obUserField  = new CUserTypeEntity;
			$propID = $obUserField->Add($arFieldProps, false);
		}

		$rsData = CUserTypeEntity::GetList(
			array(),
			array(
				"ENTITY_ID" => "BLOG_POST",
				"XML_ID" => "UF_BLOG_POST_FILE"
			)
		);
		$arRes = $rsData->Fetch();
		if($arRes && empty($arRes['SETTINGS']['UF_TO_SAVE_ALLOW_EDIT']))
		{
			$arRes['SETTINGS']['UF_TO_SAVE_ALLOW_EDIT'] = 'UF_BLOG_POST_F_EDIT';
			$obUserField  = new CUserTypeEntity();
			$res = $obUserField->Update($arRes['ID'], array('SETTINGS' => $arRes['SETTINGS']));
		}
	}

	function InstallUnInstallDBTables($install = true)
	{
		global $DB;

		$addTables = array(
			"b_webdav_file_online_edit" => array(
				'mysql' => '
CREATE TABLE b_webdav_file_online_edit
(
	ID int(11) not null auto_increment,
	IBLOCK_ID int(11) not null,
	SECTION_ID int(11),
	ELEMENT_ID int(11) not null,
	USER_ID int(11),
	OWNER_ID int(11),
	SERVICE varchar(10) not null,
	SERVICE_FILE_ID varchar(255) not null,
	SERVICE_FILE_LINK text not null,
	CREATED_TIMESTAMP timestamp not null default current_timestamp,
	PRIMARY KEY (ID),
	INDEX IXS_WD_FILE_ONLINE_EDIT_V(CREATED_TIMESTAMP),
	INDEX IXS_WD_FILE_ONLINE_EDIT_ELEMENT(ELEMENT_ID, SECTION_ID, IBLOCK_ID)
)
',
			),
			"b_webdav_folder_invite" => array(
				'mysql' => '
CREATE TABLE b_webdav_folder_invite
(
	ID int(11) not null auto_increment,
	INVITE_USER_ID int(11) not null,
	USER_ID int(11) not null,
	IBLOCK_ID int(11) not null,
	SECTION_ID int(11) not null,
	LINK_SECTION_ID int(11),
	DESCRIPTION text,
	IS_APPROVED tinyint(1),
	IS_DELETED tinyint(1),
	CAN_FORWARD tinyint(1),
	CAN_EDIT tinyint(1),
	CREATED_TIMESTAMP timestamp not null default current_timestamp,
	PRIMARY KEY (ID),
	INDEX IXS_WD_FOLDER_INVITE_FOLDER(SECTION_ID, IBLOCK_ID),
	INDEX IXS_WD_FOLDER_INVITE_SENDER(USER_ID),
	INDEX IXS_WD_FOLDER_INVITE_RECEIVER(INVITE_USER_ID)
)
',
			),
			"b_webdav_storage_delete_log" => array(
				'mysql' => "
CREATE TABLE b_webdav_storage_delete_log
(
	ID int(11) not null auto_increment,
	IBLOCK_ID int(11) not null,
	SECTION_ID int(11),
	ELEMENT_ID varchar(60) not null,
	IS_DIR tinyint(1),
	VERSION int(11),
	USER_ID int(11),
	PRIMARY KEY (ID),
	INDEX IXS_WD_STORAGE_LOG_DEL_V(VERSION),
	INDEX IXS_WD_STORAGE_LOG_DEL_E(ELEMENT_ID)
)
",
			),
			'b_webdav_storage_tmp_file' => array(
				'mysql' => "
CREATE TABLE b_webdav_storage_tmp_file
(
	ID int(11) not null auto_increment,
	NAME varchar(32) not null,
	PATH varchar(100) not null,
	FILENAME varchar(255),
	VERSION int(11),
	BUCKET_ID int(11),
	WIDTH int(11),
	HEIGHT int(11),
	IS_CLOUD tinyint(1),
	PRIMARY KEY (ID),
	INDEX IXS_WD_STORAGE_TMP_FILE_N(NAME)
)
",
			),

			"b_webdav_ext_links" => array(
				"mysql" =>	"
CREATE TABLE b_webdav_ext_links
(
	URL varchar(1000) not null,
	RESOURCE_TYPE varchar(30) not null,
	FOLDER varchar(1000),
	IBLOCK_TYPE varchar(30),
	IBLOCK_ID INT(18),
	BASE_URL varchar(1000) not null,
	HASH varchar(40) not null,
	CREATION_DATE INT(18) not null,
	USER_ID INT(18) not null,
	SALT varchar(40),
	PASSWORD varchar(40),
	LIFETIME INT(18) not null,
	F_SIZE INT(18),
	DESCRIPTION text,
	ROOT_SECTION_ID INT(18),
	URL_HASH varchar(40),
	SINGLE_SESSION tinyint(1) NULL,
	LINK_TYPE CHAR(1) NOT NULL DEFAULT 'M',
	ELEMENT_ID int(11) NOT NULL DEFAULT 0,
	VERSION_ID int(11) NOT NULL DEFAULT 0,
	FILE_ID int(11) NOT NULL DEFAULT 0,
	DOWNLOAD_COUNT int(11) NOT NULL DEFAULT 0
);

ALTER TABLE b_webdav_ext_links ADD INDEX UX_b_webdav_ext_links_h(HASH);

ALTER TABLE b_webdav_ext_links ADD INDEX UX_b_webdav_ext_links_uh(URL_HASH);
",
			),
		);

		$deleteTables = array(
			'b_webdav_file_online_edit' => array(
				'mysql' => "
DROP TABLE IF EXISTS b_webdav_file_online_edit
",
			),
			'b_webdav_folder_invite' => array(
				'mysql' => "
DROP TABLE IF EXISTS b_webdav_folder_invite
",
			),
			'b_webdav_storage_delete_log' => array(
				'mysql' => "
DROP TABLE IF EXISTS b_webdav_storage_delete_log
",
			),
			'b_webdav_storage_tmp_file' => array(
				'mysql' => "
DROP TABLE IF EXISTS b_webdav_storage_tmp_file
",
			),
			"b_webdav_ext_links" => array(
				"mysql" =>	"
drop table if exists b_webdav_ext_links;
",
			),
		);
				
		if($install)
		{
			if(!$DB->TableExists("b_webdav_ext_links"))
			{
				foreach($addTables as $table => $arr)
				{
					if(!$DB->TableExists($table))
					{
						$arQuery = $DB->ParseSQLBatch(str_replace("\r", "", $arr['mysql']));
						foreach($arQuery as $i => $sql)
						{
							$res = $DB->Query($sql, true);
							if(!$res) return false;
						}
					}
				}
			}
		}
		else
		{
			foreach($deleteTables as $table => $arr)
			{
				if($DB->TableExists($table))
				{
					$arQuery = $DB->ParseSQLBatch(str_replace("\r", "", $arr['mysql']));
					foreach($arQuery as $i => $sql)
					{
						$res = $DB->Query($sql, true);
						if(!$res) return false;
					}					
				}
			}
		}
	}
	
	function InstallDB()
	{
		$this->InstallUserFields();

		RegisterModule("webdav");
		RegisterModuleDependences("main", "OnBeforeProlog", "main", "", "", 99, "/modules/webdav/prolog_before.php"); // before statistics
		RegisterModuleDependences("search", "BeforeIndex", "webdav", "CRatingsComponentsWebDav", "BeforeIndex");
		RegisterModuleDependences("main", "OnEventLogGetAuditTypes", "webdav", "CEventWebDav", "GetAuditTypes");
		RegisterModuleDependences("main", "OnEventLogGetAuditHandlers", "webdav", "CEventWebDav", "MakeWebDavObject");
		RegisterModuleDependences("bizproc", "OnAddToHistory", "webdav", "CIBlockDocumentWebdav", "OnAddToHistory");
		RegisterModuleDependences("socialnetwork", "OnFillSocNetAllowedSubscribeEntityTypes", "webdav", "CWebDavSocNetEvent", "OnFillSocNetAllowedSubscribeEntityTypes");
		RegisterModuleDependences("socialnetwork", "OnFillSocNetLogEvents", "webdav", "CWebDavSocNetEvent", "OnFillSocNetLogEvents");
		RegisterModuleDependences("iblock", "OnAfterIBlockElementDelete", "webdav", "CIBlockDocumentWebdav", "OnAfterIBlockElementDelete");
		RegisterModuleDependences('socialnetwork', 'OnSocNetFeaturesAdd', 'webdav', 'CIBlockWebdavSocnet', 'OnSocNetFeaturesAdd');
		RegisterModuleDependences('socialnetwork', 'OnSocNetFeaturesUpdate', 'webdav', 'CIBlockWebdavSocnet', 'OnSocNetFeaturesUpdate');
		RegisterModuleDependences('socialnetwork', 'OnSocNetFeatures', 'webdav', 'CIBlockWebdavSocnet', 'OnSocNetFeatures');
		RegisterModuleDependences('socialnetwork', 'OnSocNetUserToGroupAdd', 'webdav', 'CIBlockWebdavSocnet', 'OnSocNetUserToGroupAdd');
		RegisterModuleDependences('socialnetwork', 'OnSocNetUserToGroupUpdate', 'webdav', 'CIBlockWebdavSocnet', 'OnSocNetUserToGroupUpdate');
		RegisterModuleDependences('socialnetwork', 'OnSocNetUserToGroupDelete', 'webdav', 'CIBlockWebdavSocnet', 'OnSocNetUserToGroupDelete');
		RegisterModuleDependences('socialnetwork', 'OnSocNetGroupDelete', 'webdav', 'CIBlockWebdavSocnet', 'OnSocNetGroupDelete');
		RegisterModuleDependences('socialnetwork', 'OnSocNetGroupAdd', 'webdav', 'CIBlockWebdavSocnet', 'OnSocNetGroupAdd');
		RegisterModuleDependences('socialnetwork', 'OnSocNetGroupUpdate', 'webdav', 'CIBlockWebdavSocnet', 'OnSocNetGroupUpdate');
		
		RegisterModuleDependences('socialnetwork', 'OnAfterSocNetLogCommentAdd', 'webdav', 'CIBlockWebdavSocnet', 'CopyCommentRights');
		
		RegisterModuleDependences('main', 'OnUserTypeBuildList', 'webdav', 'CUserTypeWebdavElement', 'GetUserTypeDescription');
		RegisterModuleDependences('main', 'OnUserTypeBuildList', 'webdav', 'CUserTypeWebdavElementHistory', 'GetUserTypeDescription');
		RegisterModuleDependences('blog', 'OnPostAdd', 'webdav', 'CUserTypeWebdavElement', 'OnPostAdd');
		RegisterModuleDependences('blog', 'OnPostUpdate', 'webdav', 'CUserTypeWebdavElement', 'OnPostUpdate');
		RegisterModuleDependences('blog', 'OnBeforePostDelete', 'webdav', 'CUserTypeWebdavElement', 'OnBeforePostDelete');
		RegisterModuleDependences("blog", "OnCommentAdd", 'webdav', 'CUserTypeWebdavElement', "OnCommentAdd");
		RegisterModuleDependences("blog", "OnCommentUpdate", 'webdav', 'CUserTypeWebdavElement', "OnCommentUpdate");
		RegisterModuleDependences("blog", "OnBeforeCommentDelete", 'webdav', 'CUserTypeWebdavElement', "OnBeforeCommentDelete");

		RegisterModuleDependences("im", "OnBeforeConfirmNotify", "webdav", "CWebDavSymlinkHelper", "OnBeforeConfirmNotify");

		if (is_array($this->errors) && count($this->errors)>0)
		{
			$GLOBALS['errors'] = $this->errors;
			global $APPLICATION;
			$APPLICATION->ThrowException(implode(' ', $this->errors));
			return false;
		}
		else
		{
			$this->InstallTasks();
		}
		
		$this->InstallUnInstallDBTables();

		COption::SetOptionString('webdav', 'webdav_allow_ext_doc_services_global', 'Y');
		COption::SetOptionString('webdav', 'webdav_allow_ext_doc_services_local', 'Y');
		COption::SetOptionString('webdav', 'webdav_allow_autoconnect_share_group_folder', 'Y');

		CAgent::AddAgent('CWebDavExtLinks::RemoveExpired();', 'webdav', 'N');
		CAgent::AddAgent('CWebDavTmpFile::removeExpired();', 'webdav', 'N');

		return true;
	}

	function GetModuleTasks()
	{
		return array(
			'webdav_full_access' => array(
				"LETTER" => "X",
				"BINDING" => "module",
				"OPERATIONS" => array(
					"webdav_change_settings"
				)
			)
		);
	}

	function UnInstallDB()
	{
		//delete agents
		CAgent::RemoveModuleAgents("webdav");

		COption::RemoveOption('webdav');
		$this->UnInstallTasks();
		UnRegisterModuleDependences('main', 'OnUserTypeBuildList', 'webdav', 'CUserTypeWebdavElement', 'GetUserTypeDescription');
		UnRegisterModuleDependences('blog', 'OnPostAdd', 'webdav', 'CUserTypeWebdavElement', 'OnPostAdd');
		UnRegisterModuleDependences('blog', 'OnPostUpdate', 'webdav', 'CUserTypeWebdavElement', 'OnPostUpdate');
		UnRegisterModuleDependences('blog', 'OnBeforePostDelete', 'webdav', 'CUserTypeWebdavElement', 'OnBeforePostDelete');
		UnRegisterModuleDependences("blog", "OnCommentAdd", 'webdav', 'CUserTypeWebdavElement', "OnCommentAdd");
		UnRegisterModuleDependences("blog", "OnCommentUpdate", 'webdav', 'CUserTypeWebdavElement', "OnCommentUpdate");
		UnRegisterModuleDependences("blog", "OnBeforeCommentDelete", 'webdav', 'CUserTypeWebdavElement', "OnBeforeCommentDelete");

		UnRegisterModuleDependences("blog", "OnCommentAdd", 'webdav', 'CUserTypeWebdavElementHistory', "OnCommentAdd");
		UnRegisterModuleDependences("blog", "OnCommentUpdate", 'webdav', 'CUserTypeWebdavElementHistory', "OnCommentUpdate");
		UnRegisterModuleDependences("blog", "OnBeforeCommentDelete", 'webdav', 'CUserTypeWebdavElementHistory', "OnBeforeCommentDelete");

		//UnRegisterModuleDependences('socialnetwork', 'OnSocNetFeaturesAdd', 'webdav', 'CIBlockWebdavSocnet', 'OnSocNetFeaturesAdd');
		//UnRegisterModuleDependences('socialnetwork', 'OnSocNetFeaturesUpdate', 'webdav', 'CIBlockWebdavSocnet', 'OnSocNetFeaturesUpdate');
		//UnRegisterModuleDependences('socialnetwork', 'OnSocNetFeatures', 'webdav', 'CIBlockWebdavSocnet', 'OnSocNetFeatures');
		//UnRegisterModuleDependences('socialnetwork', 'OnSocNetUserToGroupAdd', 'webdav', 'CIBlockWebdavSocnet', 'OnSocNetUserToGroupAdd');
		//UnRegisterModuleDependences('socialnetwork', 'OnSocNetUserToGroupUpdate', 'webdav', 'CIBlockWebdavSocnet', 'OnSocNetUserToGroupUpdate');
		//UnRegisterModuleDependences('socialnetwork', 'OnSocNetUserToGroupDelete', 'webdav', 'CIBlockWebdavSocnet', 'OnSocNetUserToGroupDelete');
		//UnRegisterModuleDependences('socialnetwork', 'OnSocNetGroupDelete', 'webdav', 'CIBlockWebdavSocnet', 'OnSocNetGroupDelete');
		//UnRegisterModuleDependences('socialnetwork', 'OnSocNetGroupAdd', 'webdav', 'CIBlockWebdavSocnet', 'OnSocNetGroupAdd');
		//UnRegisterModuleDependences('socialnetwork', 'OnSocNetGroupUpdate', 'webdav', 'CIBlockWebdavSocnet', 'OnSocNetGroupUpdate');
		UnRegisterModuleDependences("bizproc", "OnAddToHistory", "webdav", "CIBlockDocumentWebdav", "OnAddToHistory");
		UnRegisterModuleDependences("main", "OnBeforeProlog", "webdav", "CWebDavBase", "OnBeforeProlog"); // from old version
		UnRegisterModuleDependences("main", "OnBeforeProlog", "main", "", "", "/modules/webdav/prolog_before.php");
		UnRegisterModuleDependences("search", "BeforeIndex", "webdav", "CRatingsComponentsWebDav", "BeforeIndex");
		UnRegisterModuleDependences("main", "OnEventLogGetAuditTypes", "webdav", "CEventWebDav", "GetAuditTypes");
		UnRegisterModuleDependences("main", "OnEventLogGetAuditHandlers", "webdav", "CEventWebDav", "MakeWebDavObject");
		UnRegisterModuleDependences("socialnetwork", "OnFillSocNetAllowedSubscribeEntityTypes", "webdav", "CWebDavSocNetEvent", "OnFillSocNetAllowedSubscribeEntityTypes");
		UnRegisterModuleDependences("socialnetwork", "OnFillSocNetLogEvents", "webdav", "CWebDavSocNetEvent", "OnFillSocNetLogEvents");
		UnRegisterModuleDependences("iblock", "OnAfterIBlockElementDelete", "webdav", "CIBlockDocumentWebdav", "OnAfterIBlockElementDelete");

		UnRegisterModuleDependences("im", "OnBeforeConfirmNotify", "webdav", "CWebDavSymlinkHelper", "OnBeforeConfirmNotify");

		UnRegisterModule("webdav");
		
		$this->InstallUnInstallDBTables(false);
		
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

	function InstallFiles()
	{
		if($_ENV["COMPUTERNAME"]!='BX')
		{
			CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/webdav/install/components",
				$_SERVER["DOCUMENT_ROOT"]."/bitrix/components", true, true);
			CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/webdav/install/webdav",
				$_SERVER["DOCUMENT_ROOT"]."/bitrix/webdav", true, true);
			CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/webdav/install/js",
				$_SERVER["DOCUMENT_ROOT"]."/bitrix/js", true, true);
			CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/webdav/install/public/templates",
				$_SERVER["DOCUMENT_ROOT"]."/bitrix/templates", true, true);
			CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/webdav/install/admin",
				$_SERVER["DOCUMENT_ROOT"]."/bitrix/admin", true, true);
		}
		$GLOBALS["APPLICATION"]->SetFileAccessPermission('/bitrix/admin/webdav_bizproc_activity_settings.php', array('2' => 'R'));
		$GLOBALS["APPLICATION"]->SetFileAccessPermission('/bitrix/admin/webdav_bizproc_selector.php', array('2' => 'R'));
		$GLOBALS["APPLICATION"]->SetFileAccessPermission('/bitrix/admin/webdav_bizproc_wf_settings.php', array('2' => 'R'));
		
		return true;
	}

	function UnInstallFiles()
	{
		return true;
	}

	function DoInstall()
	{
		if (!check_bitrix_sessid())
			return false;
		global $APPLICATION;
		
		if (IsModuleInstalled("iblock"))
		{
			$step = intval($_REQUEST["step"]);
			if ($GLOBALS["APPLICATION"]->GetGroupRight("iblock") < "W" && $step <= 2)
				$step = 3;
			if ($step < 2)
			{
				$APPLICATION->IncludeAdminFile(GetMessage("WD_INSTALL").GetMessage("WD_INSTALL1"),
					$_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/webdav/install/step1.php");
			}
			elseif($step == 2)
			{
				$APPLICATION->IncludeAdminFile(GetMessage("WD_INSTALL").GetMessage("WD_INSTALL2"),
					$_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/webdav/install/step2.php");
			}
			else
			{
				$this->InstallDB();
				$this->InstallEvents();
				$this->InstallFiles();
				LocalRedirect("module_admin.php?lang=".LANGUAGE_ID);
			}
		}
		elseif (!IsModuleInstalled("webdav"))
		{
			$this->InstallDB();
			$this->InstallEvents();
			$this->InstallFiles();
		}
	}

	function DoUninstall()
	{
		global $APPLICATION;
		$this->errors = array();

		if (!check_bitrix_sessid())
			return false;

		if(
			Option::get('webdav', 'process_converted', false) === 'Y' ||
			Option::get('disk', 'process_converted', false) === 'Y'
		)
		{
			$this->errors[] = GetMessage("WD_UNINSTALL_ERROR_MIGRATE_PROCESS");
			$GLOBALS["webdav_installer_errors"] = $this->errors;
			$APPLICATION->IncludeAdminFile(GetMessage("WD_UNINSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/webdav/install/unstep1.php");
			return;
		}

		$this->UnInstallDB();
		$this->UnInstallEvents();
		$this->UnInstallFiles();
	}
}
?>
