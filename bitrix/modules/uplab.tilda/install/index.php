<?php

use Bitrix\Main\EventManager;
use Bitrix\Main\IO\Directory;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ModuleManager;

Loc::loadMessages(__FILE__);

class uplab_tilda extends CModule
{
	public $MODULE_ID = "uplab.tilda";

	private $excludeAdminFiles = array(
		"..",
		".",
		"menu.php",
	);

	public function __construct() {
		$this->MODULE_GROUP_RIGHTS = "Y";
		$this->MODULE_NAME = Loc::getMessage("{$this->MODULE_ID}_MODULE_NAME");
		$this->MODULE_DESCRIPTION = Loc::getMessage("{$this->MODULE_ID}_MODULE_DESC");
		$this->PARTNER_NAME = Loc::getMessage("{$this->MODULE_ID}_PARTNER_NAME");
		$this->PARTNER_URI = Loc::getMessage("{$this->MODULE_ID}_PARTNER_URI");

		$arModuleVersion = array();

		include __DIR__ . "/version.php";

		if (is_array($arModuleVersion) && array_key_exists("VERSION", $arModuleVersion)) {
			$this->MODULE_VERSION = $arModuleVersion["VERSION"];
			$this->MODULE_VERSION_DATE = $arModuleVersion["VERSION_DATE"];
		}
	}

	public function doInstall() {
		global $APPLICATION;

		if (!$this->isVersionD7()) {
			$APPLICATION->ThrowException(Loc::getMessage("{$this->MODULE_ID}_MODULE_NO_D7_ERROR"));

			return false;
		}

		$this->installEvents();
		$this->installFiles();

		ModuleManager::registerModule($this->MODULE_ID);

		return null;
	}

	public function doUninstall() {
		$this->uninstallEvents();
		$this->uninstallFiles();

		ModuleManager::unRegisterModule($this->MODULE_ID);
	}

	public function installFiles() {
		CopyDirFiles(
			$this->getPath() . "/install/components/",
			"{$_SERVER["DOCUMENT_ROOT"]}/bitrix/components/",
			true,
			true
		);

		CopyDirFiles(
			$this->getPath() . "/install/js/",
			"{$_SERVER["DOCUMENT_ROOT"]}/bitrix/js/{$this->MODULE_ID}",
			true,
			true
		);

		CopyDirFiles(
			$this->getPath() . "/install/css/",
			"{$_SERVER["DOCUMENT_ROOT"]}/bitrix/css/{$this->MODULE_ID}",
			true,
			true
		);

		CopyDirFiles(
			$this->getPath() . "/install/images/",
			"{$_SERVER["DOCUMENT_ROOT"]}/bitrix/images/{$this->MODULE_ID}",
			true,
			true
		);

		$this->recursiveCopyFiles("admin");
		$this->recursiveCopyFiles("tools");

		return true;
	}

	public function installEvents() {
		$eventManager = EventManager::getInstance();

		$eventManager->registerEventHandler(
			"fileman",
			"OnBeforeHTMLEditorScriptRuns",
			$this->MODULE_ID,
			"Uplab\Tilda\Events",
			"beforeHTMLEditorScriptRuns"
		);

		$eventManager->registerEventHandler(
			"main",
			"OnEndBufferContent",
			$this->MODULE_ID,
			"Uplab\Tilda\Replace",
			"tagReplace"
		);

		$eventManager->registerEventHandler(
			"search",
			"BeforeIndex",
			$this->MODULE_ID,
			"Uplab\Tilda\Replace",
			"removeFromIndex"
		);

		$eventManager->registerEventHandler(
			"main",
			"OnEventLogGetAuditTypes",
			$this->MODULE_ID,
			"Uplab\Tilda\Events",
			"onEventLogGetAuditTypes"
		);
	}

	public function uninstallFiles() {
		Directory::deleteDirectory("{$_SERVER["DOCUMENT_ROOT"]}/bitrix/js/{$this->MODULE_ID}");
		Directory::deleteDirectory("{$_SERVER["DOCUMENT_ROOT"]}/bitrix/images/{$this->MODULE_ID}");

		$this->recursiveRemoveFiles("admin");
		$this->recursiveRemoveFiles("tools");

		$this->recursiveRemoveDirectory("components/uplab");

		return true;
	}

	public function uninstallEvents() {
		$eventManager = \Bitrix\Main\EventManager::getInstance();

		$eventManager->unRegisterEventHandler(
			"fileman",
			"OnBeforeHTMLEditorScriptRuns",
			$this->MODULE_ID,
			"Uplab\Tilda\Events",
			"beforeHTMLEditorScriptRuns"
		);

		$eventManager->unRegisterEventHandler(
			"main",
			"OnEndBufferContent",
			$this->MODULE_ID,
			"Uplab\Tilda\Replace",
			"tagReplace"
		);

		$eventManager->unRegisterEventHandler(
			"search",
			"BeforeIndex",
			$this->MODULE_ID,
			"Uplab\Tilda\Replace",
			"removeFromIndex"
		);

		$eventManager->unRegisterEventHandler(
			"main",
			"OnEventLogGetAuditTypes",
			$this->MODULE_ID,
			"Uplab\Tilda\Events",
			"onEventLogGetAuditTypes"
		);
	}

	public function isVersionD7() {
		return CheckVersion(
			ModuleManager::getVersion("main"),
			"14.00.00"
		);
	}

	public function getPath() {
		return $_SERVER["DOCUMENT_ROOT"] . getLocalPath("modules/$this->MODULE_ID");
	}

	private function recursiveCopyFiles($prefix) {
		CopyDirFiles(
			$this->getPath() . "/install/{$prefix}/",
			"{$_SERVER["DOCUMENT_ROOT"]}/bitrix/{$prefix}/",
			false,
			true
		);

		if (Directory::isDirectoryExists($path = $this->getPath() . "/{$prefix}")) {
			if ($dir = opendir($path)) {
				while (false !== $item = readdir($dir)) {
					if (in_array($item, $this->excludeAdminFiles)) {
						continue;
					}
					file_put_contents(
						$file =
							"{$_SERVER['DOCUMENT_ROOT']}/bitrix/{$prefix}/" .
							"{$this->MODULE_ID}_{$item}",

						"<" . "?" . PHP_EOL . "require(\$_SERVER[\"DOCUMENT_ROOT\"] . \"" .
						getLocalPath("modules/{$this->MODULE_ID}/{$prefix}/{$item}") .
						'");'
					);
				}
				closedir($dir);
			}
		}
	}

	private function recursiveRemoveFiles($prefix) {
		DeleteDirFiles(
			$this->getPath() . "/install/{$prefix}/",
			"{$_SERVER["DOCUMENT_ROOT"]}/bitrix/{$prefix}/"
		);

		if (Directory::isDirectoryExists($path = $this->getPath() . "/{$prefix}")) {
			if ($dir = opendir($path)) {
				while (false !== $item = readdir($dir)) {
					if (in_array($item, $this->excludeAdminFiles)) {
						continue;
					}
					\Bitrix\Main\IO\File::deleteFile(
						"{$_SERVER['DOCUMENT_ROOT']}/bitrix/{$prefix}/" .
						"{$this->MODULE_ID}_{$item}"
					);
				}
				closedir($dir);
			}
		}
	}

	private function recursiveRemoveDirectory($prefix) {
		$path = $this->getPath() . "/install/{$prefix}";

		$dir = new DirectoryIterator($path);
		foreach ($dir as $fileInfo) {
			if ($fileInfo->isDir() && !$fileInfo->isDot()) {
				Directory::deleteDirectory(
					"{$_SERVER["DOCUMENT_ROOT"]}/bitrix/{$prefix}/" .
					$fileInfo->getFilename()
				);
			}
		}
	}

}
