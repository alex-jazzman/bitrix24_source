<?php

use Bitrix\Main\Config\Option;
use Bitrix\Main\Localization\Loc;
Loc::loadMessages(__FILE__);

Class mail extends CModule
{
	var $MODULE_ID = "mail";
	var $MODULE_VERSION;
	var $MODULE_VERSION_DATE;
	var $MODULE_NAME;
	var $MODULE_DESCRIPTION;
	var $MODULE_CSS;

	function __construct()
	{
		$arModuleVersion = array();

		include(__DIR__.'/version.php');

		if (is_array($arModuleVersion) && array_key_exists("VERSION", $arModuleVersion))
		{
			$this->MODULE_VERSION = $arModuleVersion["VERSION"];
			$this->MODULE_VERSION_DATE = $arModuleVersion["VERSION_DATE"];
		}

		$this->MODULE_NAME = Loc::getMessage("MAIL_MODULE_NAME");
		$this->MODULE_DESCRIPTION = Loc::getMessage("MAIL_MODULE_DESC");
	}

	function InstallDB($arParams = array())
	{
		global $DB, $APPLICATION;
		$this->errors = false;

		$isFreshInstall = !$DB->TableExists('b_mail_mailbox');

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
		else
		{
			if ($isFreshInstall && \Bitrix\Main\Entity\CryptoField::cryptoAvailable())
			{
				\Bitrix\Main\ORM\Data\DataManager::enableCrypto('TOKENS', 'b_mail_oauth', true);
			}

			RegisterModule("mail");

			if (CModule::IncludeModule("mail"))
			{
				\Bitrix\Mail\Internal\Service\SourceGeneration\MigrationOperationSchema::clearCache();

				$result = \Bitrix\Main\SiteTable::getList();
				while (($site = $result->fetch()) !== false)
				{
					$this->installMailService($site["LID"]);
				}

				// create group and give it rights
				$arGroup = array(
					"ACTIVE" => "Y",
					"C_SORT" => 201,
					"NAME" => Loc::getMessage("MAIL_GROUP_NAME"),
					"DESCRIPTION" => Loc::getMessage("MAIL_GROUP_DESC"),
					"STRING_ID" => "MAIL_INVITED",
					"TASKS_MODULE" => array("main_change_profile"),
					"TASKS_FILE" => array(
						Array("fm_folder_access_read", "/bitrix/components/bitrix/"),
						Array("fm_folder_access_read", "/bitrix/tools/"),
						Array("fm_folder_access_read", "/upload/"),
						Array("fm_folder_access_read", "/pub/")
					),
				);

				$group = new CGroup;

				$groupID = CGroup::GetIDByCode($arGroup["STRING_ID"]);
				if (!$groupID)
				{
					if (file_exists($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/bitrix24"))
					{
						$arGroup["~ID"] = 17;
					}
					$groupID = $group->Add($arGroup);
				}

				if ($groupID > 0)
				{
					COption::SetOptionString("mail", "mail_invited_group", $groupID);

					$arTasksID = Array();
					foreach ($arGroup["TASKS_MODULE"] as $taskName)
					{
						$dbResult = CTask::GetList(array(), array("NAME" => $taskName));
						if ($arTask = $dbResult->Fetch())
						{
							$arTasksID[] = $arTask["ID"];
						}
					}
					if (!empty($arTasksID))
					{
						CGroup::SetTasks($groupID, $arTasksID);
					}

					if (!file_exists($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/bitrix24"))
					{
						foreach ($arGroup["TASKS_FILE"] as $arFile)
						{
							$taskName = $arFile[0];
							$originalPath = $filePath = $arFile[1];

							$dbResult = CTask::GetList(Array(), Array("NAME" => $taskName));
							if ($arTask = $dbResult->Fetch())
							{
								$permissions = array(
									$groupID => "T_".$arTask["ID"]
								);

								$documentRoot = $_SERVER["DOCUMENT_ROOT"];
								$filePath = rtrim($filePath, "/");
								$position = mb_strrpos($filePath, "/");

								$pathFile = mb_substr($filePath, $position + 1);
								$pathDir = mb_substr($filePath, 0, $position);

								$PERM = array();
								if (file_exists($documentRoot.$pathDir."/.access.php"))
								{
									@include($documentRoot.$pathDir."/.access.php");
								}

								$arPermisson = (
								!isset($PERM[$pathFile])
								|| !is_array($PERM[$pathFile])
									? $permissions
									: $permissions + $PERM[$pathFile]
								);

								$GLOBALS["APPLICATION"]->SetFileAccessPermission($originalPath, $arPermisson);
							}
						}
					}
				}
			}

			return true;
		}
	}

	/**
	 * @param $siteId
	 * @throws \Bitrix\Main\ArgumentException
	 * @throws \Bitrix\Main\ObjectPropertyException
	 * @throws \Bitrix\Main\SystemException
	 */
	public function installMailService($siteId)
	{
		$filter = [
			'ACTIVE' => 'Y',
			'SITE_ID' => $siteId
		];
		$result = Bitrix\Mail\MailServicesTable::getList(array('filter' => $filter));
		if ($result->fetch() === false)
		{
			\Bitrix\Mail\Internals\MailServiceInstaller::installServices($siteId);
		}
	}

	public function installBitrix24MailService()
	{
		if (CModule::IncludeModule("mail"))
		{
			$result = \Bitrix\Main\SiteTable::getList();
			while (($site = $result->fetch()) !== false)
			{
				if (CModule::IncludeModule('extranet') && CExtranet::IsExtranetSite($site['LID']))
					continue;

				\Bitrix\Mail\MailServicesTable::add(array(
					'SITE_ID'      => $site['LID'],
					'ACTIVE'       => 'Y',
					'NAME'         => 'bitrix24',
					'SERVICE_TYPE' => 'controller'
				));
			}
		}
	}

	function UnInstallDB($arParams = array())
	{
		global $DB, $APPLICATION;
		$this->errors = false;

		$dropTables = !array_key_exists("savedata", $arParams) || $arParams["savedata"] != "Y";

		if($dropTables)
		{
			$this->deleteOptions();

			if ($DB->TableExists('b_main_mail_sender') && $DB->Query("SELECT PARENT_MODULE_ID FROM b_main_mail_sender WHERE 1=0", true))
			{
				$mailboxSenders = \Bitrix\Main\Mail\Internal\SenderTable::query()
					->setSelect(['ID'])
					->where('PARENT_MODULE_ID', 'mail')
					->fetchAll()
				;
				foreach ($mailboxSenders as $mailboxSender)
				{
					\Bitrix\Main\Mail\Internal\SenderTable::delete($mailboxSender['ID']);
				}
			}
		}

		$migrationResult = $this->uninstallMigrations($dropTables);
		if (!$migrationResult->isSuccess())
		{
			$this->errors = $migrationResult->getErrorMessages();
		}

		UnRegisterModule("mail");

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
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/mail/install/images", $_SERVER["DOCUMENT_ROOT"]."/bitrix/images/mail", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/mail/install/admin", $_SERVER["DOCUMENT_ROOT"]."/bitrix/admin", true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/mail/install/tools", $_SERVER["DOCUMENT_ROOT"]."/bitrix/tools", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/mail/install/themes", $_SERVER["DOCUMENT_ROOT"]."/bitrix/themes", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/mail/install/templates", $_SERVER["DOCUMENT_ROOT"]."/bitrix/templates", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/mail/install/components", $_SERVER["DOCUMENT_ROOT"]."/bitrix/components", true, true);
		CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/mail/install/js", $_SERVER["DOCUMENT_ROOT"]."/bitrix/js", true, true);
		return true;
	}

	function UnInstallFiles()
	{
		DeleteDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/mail/install/admin/", $_SERVER["DOCUMENT_ROOT"]."/bitrix/admin");
		DeleteDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/mail/install/tools/", $_SERVER["DOCUMENT_ROOT"]."/bitrix/tools");
		DeleteDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/mail/install/themes/.default/", $_SERVER["DOCUMENT_ROOT"]."/bitrix/themes/.default");//css
		DeleteDirFilesEx("/bitrix/themes/.default/icons/mail/");//icons
		DeleteDirFilesEx("/bitrix/images/mail/");//images
		return true;
	}

	function DoInstall()
	{
		global $DB, $APPLICATION, $step;

		if(!CBXFeatures::IsFeatureEditable("SMTP"))
		{
			$APPLICATION->ThrowException(Loc::getMessage("MAIN_FEATURE_ERROR_EDITABLE"));
		}
		else
		{
			$this->InstallFiles();
			$this->InstallDB();
			CBXFeatures::SetFeatureEnabled("SMTP", true);
		}
		$APPLICATION->IncludeAdminFile(Loc::getMessage("MAIL_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/mail/install/step1.php");
	}

	function DoUninstall()
	{
		global $DB, $APPLICATION, $step;
		if($step < 2)
		{
			$APPLICATION->IncludeAdminFile(Loc::getMessage("MAIL_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/mail/install/unstep1.php");
		}
		elseif($step == 2)
		{
			$this->UnInstallDB(array(
					"savedata" => $_REQUEST["savedata"],
			));
			$this->UnInstallFiles();
			CBXFeatures::SetFeatureEnabled("SMTP", false);
			$GLOBALS["errors"] = $this->errors;
			$APPLICATION->IncludeAdminFile(Loc::getMessage("MAIL_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/mail/install/unstep2.php");
		}
	}

	function deleteOptions(): void
	{
		Option::delete('mail', ['name' => 'mail_access_version']);
		Option::delete('mail', ['name' => 'passwordless_sent_total_count']);
		Option::delete('mail', ['name' => 'mailbox_connection_request_pending_count']);
	}
}
