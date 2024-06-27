<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Application;
use Bitrix\Main\DB;

//Disable statistics
define("STOP_STATISTICS", true);
define("NO_AGENT_STATISTIC", true);
define("NO_AGENT_CHECK", true);

@set_time_limit(3600);
@ignore_user_abort(true);

define("BX_PRODUCT_INSTALLATION", true);

if (defined("DEBUG_MODE"))
{
	error_reporting(E_ALL);
}
else
{
	error_reporting(E_COMPILE_ERROR | E_ERROR | E_CORE_ERROR | E_PARSE);
}

if (isset($_REQUEST["clear_db"]))
{
	setcookie("clear_db", $_REQUEST["clear_db"], time() + 3600);
}

require_once($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/bx_root.php");
require_once($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/lib/loader.php");
require_once($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/include/autoload.php");
require_once($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/tools.php");

require_once($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/classes/general/wizard.php"); //Wizard API
require_once($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/classes/general/version.php"); //Sitemanager version
require_once($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/install/wizard/template.php"); //Wizard template
require_once($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/install/wizard/utils.php"); //Wizard utils

@set_time_limit(3600);

//Get Wizard Settings
$GLOBALS["arWizardConfig"] = BXInstallServices::GetWizardsSettings();

if (!empty($GLOBALS["arWizardConfig"]["LANGUAGE_ID"]))
{
	define("LANGUAGE_ID", $GLOBALS["arWizardConfig"]["LANGUAGE_ID"]);
}
elseif (defined('PRE_LANGUAGE_ID'))
{
	define("LANGUAGE_ID", PRE_LANGUAGE_ID);
}
else
{
	define("LANGUAGE_ID", 'en');
}

//Init new kernel
$application = \Bitrix\Main\HttpApplication::getInstance();
$context = new \Bitrix\Main\HttpContext($application);
$language = \Bitrix\Main\Localization\LanguageTable::wakeUpObject(LANGUAGE_ID);
$context->setLanguage($language);
$application->setContext($context);

//Lang files
IncludeModuleLangFile($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/install.php");

Application::resetAccelerator();

class WelcomeStep extends CWizardStep
{
	function InitStep()
	{
		$this->SetStepID("welcome");
		$this->SetNextStep("agreement");
		$this->SetNextCaption(InstallGetMessage("NEXT_BUTTON"));
		$this->SetTitle(InstallGetMessage("INS_STEP1_TITLE"));
	}

	function ShowStep()
	{
		global $arWizardConfig;

		//wizard customization file
		$bxProductConfig = [];
		if (file_exists($_SERVER["DOCUMENT_ROOT"] . BX_ROOT . "/.config.php"))
		{
			include($_SERVER["DOCUMENT_ROOT"] . BX_ROOT . "/.config.php");
		}

		if (isset($bxProductConfig["product_wizard"]["welcome_text"]))
		{
			$this->content .= '<div class="inst-cont-text-block"><div class="inst-cont-text">' . $bxProductConfig["product_wizard"]["welcome_text"] . '</div></div>';
		}
		else
		{
			$this->content .= '<div class="inst-cont-text-block"><div class="inst-cont-text">' . ($arWizardConfig["welcomeText"] ?? InstallGetMessage("FIRST_PAGE")) . '</div></div>';
		}
	}

	public static function unformat($str)
	{
		$str = strtolower(trim($str));
		$res = intval($str);
		$suffix = substr($str, -1);
		if ($suffix == "k")
		{
			$res *= 1024;
		}
		elseif ($suffix == "m")
		{
			$res *= 1048576;
		}
		elseif ($suffix == "g")
		{
			$res *= 1048576 * 1024;
		}
		return $res;
	}
}

class AgreementStep extends CWizardStep
{
	function InitStep()
	{
		$this->SetStepID("agreement");
		$this->SetPrevStep("welcome");
		$this->SetNextStep("select_database");
		$this->SetNextCaption(InstallGetMessage("NEXT_BUTTON"));
		$this->SetPrevCaption(InstallGetMessage("PREVIOUS_BUTTON"));
		$this->SetTitle(InstallGetMessage("INS_STEP2_TITLE"));
	}

	function OnPostForm()
	{
		$wizard = $this->GetWizard();

		if ($wizard->IsPrevButtonClick())
		{
			return;
		}

		$agreeLicense = $wizard->GetVar("agree_license");
		if ($agreeLicense !== "Y")
		{
			$this->SetError(InstallGetMessage("ERR_AGREE_LICENSE"), "agree_license");
		}
	}

	function ShowStep()
	{
		$this->content = '<br /><iframe name="license_text" src="/bitrix/legal/license.php" width="100%" height="250" border="0" frameBorder="1" scrolling="yes"></iframe><br /><br />';
		$this->content .= $this->ShowCheckboxField("agree_license", "Y", ["id" => "agree_license_id", "tabindex" => "1"]);
		$this->content .= '&nbsp;<label for="agree_license_id">' . InstallGetMessage("LICENSE_AGREE_PROMT") . '</label>';

		$this->content .= '<script>setTimeout(function() {document.getElementById("agree_license_id").focus();}, 500);</script>';
	}
}

class AgreementStep4VM extends CWizardStep
{
	function InitStep()
	{
		$this->SetStepID("agreement");
		if ($_SERVER['BITRIX_ENV_TYPE'] <> "crm")
		{
			$this->SetNextStep("check_license_key");
		}
		else
		{
			$this->SetNextStep("create_modules");
		}
		$this->SetNextCaption(InstallGetMessage("NEXT_BUTTON"));
		$this->SetPrevCaption(InstallGetMessage("PREVIOUS_BUTTON"));
		$this->SetTitle(InstallGetMessage("INS_STEP2_TITLE"));
	}

	function OnPostForm()
	{
		$wizard = $this->GetWizard();

		if ($wizard->IsPrevButtonClick())
		{
			return;
		}

		$agreeLicense = $wizard->GetVar("agree_license");
		if ($agreeLicense !== "Y")
		{
			$this->SetError(InstallGetMessage("ERR_AGREE_LICENSE"), "agree_license");
		}

		if (BXInstallServices::IsShortInstall() && defined("VM_INSTALL"))
		{
			$this->CheckShortInstall();
		}
	}

	public function CheckShortInstall()
	{
		$DBType = "mysql";

		//PHP
		$requireStep = new RequirementStep;
		if (!$requireStep->CheckRequirements($DBType))
		{
			$this->SetError($requireStep->GetErrors());
			return;
		}

		//UTF-8
		if (!BXInstallServices::IsUTF8Support())
		{
			$this->SetError(InstallGetMessage("INST_UTF8_NOT_SUPPORT"));
			return;
		}

		//Check connection
		require_once($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/start.php");

		IncludeModuleLangFile($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/classes/general/main.php");

		$application = \Bitrix\Main\HttpApplication::getInstance();
		$conPool = $application->getConnectionPool();
		$connection = $conPool->getConnection();

		$conPool->useMasterOnly(true);

		// Database-dependent classes
		CAllDatabase::registerAutoload($DBType);

		$DB = new CDatabase;

		if (!$DB->DoConnect())
		{
			$this->SetError(InstallGetMessage("COULD_NOT_CONNECT") . " " . $DB->db_Error);
			return;
		}

		$databaseStep = new CreateDBStep;
		$databaseStep->DB = $DB;
		$databaseStep->dbType = $DBType;
		$databaseStep->dbName = $connection->getDatabase();
		$databaseStep->filePermission = (defined("BX_FILE_PERMISSIONS") ? sprintf("%04o", BX_FILE_PERMISSIONS) : 0);
		$databaseStep->folderPermission = (defined("BX_DIR_PERMISSIONS") ? sprintf("%04o", BX_DIR_PERMISSIONS) : 0);

		if ($databaseStep->IsBitrixInstalled())
		{
			$this->SetError($databaseStep->GetErrors());
			return;
		}

		//Database check
		$databaseStep->checkMysqlRequirements($connection);
		if (!empty($databaseStep->GetErrors()))
		{
			$this->SetError($databaseStep->GetErrors());
			return;
		}

		$DB->Query("ALTER DATABASE `" . $databaseStep->dbName . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci", true);

		//Create after_connect.php if not exists
		if (!file_exists($_SERVER["DOCUMENT_ROOT"] . BX_PERSONAL_ROOT . "/php_interface/after_connect_d7.php") && $databaseStep->CreateAfterConnect() === false)
		{
			$this->SetError($databaseStep->GetErrors());
		}

		if (!$databaseStep->CheckDBOperation())
		{
			$this->SetError($databaseStep->GetErrors());
		}
	}

	function SetError($strError, $id = false)
	{
		if (is_array($strError))
		{
			$this->stepErrors = array_merge($this->stepErrors, $strError);
		}
		else
		{
			$this->stepErrors[] = [$strError, $id];
		}
	}

	function ShowStep()
	{
		$this->content = '<iframe name="license_text" src="/bitrix/legal/license.php" width="100%" height="250" border="0" frameBorder="1" scrolling="yes"></iframe><br /><br />';
		$this->content .= $this->ShowCheckboxField("agree_license", "Y", ["id" => "agree_license_id", "tabindex" => "1"]);
		$this->content .= '&nbsp;<label for="agree_license_id">' . InstallGetMessage("LICENSE_AGREE_PROMT") . '</label>';
		$this->content .= '<script>setTimeout(function() {document.getElementById("agree_license_id").focus();}, 500);</script>';
	}
}

class DBTypeStep extends CWizardStep
{
	function InitStep()
	{
		$this->SetStepID("select_database");
		$this->SetPrevStep("agreement");
		$this->SetNextStep("requirements");
		$this->SetNextCaption(InstallGetMessage("NEXT_BUTTON"));
		$this->SetPrevCaption(InstallGetMessage("PREVIOUS_BUTTON"));

		$arDBTypes = BXInstallServices::GetDBTypes();
		if (count($arDBTypes) > 1)
		{
			$this->SetTitle(InstallGetMessage("INS_DB_SELECTION"));
		}
		else
		{
			$this->SetTitle(InstallGetMessage("INS_LICENSE_HEAD"));
		}

		$wizard = $this->GetWizard();

		if (defined("TRIAL_VERSION"))
		{
			$wizard->SetDefaultVar("lic_key_variant", "Y");
		}

		if (file_exists($_SERVER['DOCUMENT_ROOT'] . '/bitrix/license_key.php'))
		{
			$LICENSE_KEY = '';
			include($_SERVER['DOCUMENT_ROOT'] . '/bitrix/license_key.php');
			$wizard->SetDefaultVar("license", $LICENSE_KEY);
		}

		$defaultDbType = "mysql";
		foreach ($arDBTypes as $dbType => $active)
		{
			$defaultDbType = $dbType;
			if ($active)
			{
				break;
			}
		}

		$wizard->SetDefaultVar("dbType", $defaultDbType);
	}

	function OnPostForm()
	{
		$wizard = $this->GetWizard();

		if ($wizard->IsPrevButtonClick())
		{
			return;
		}

		$dbType = $wizard->GetVar("dbType");
		$arDBTypes = BXInstallServices::GetDBTypes();

		if (count($arDBTypes) > 1 && (!array_key_exists($dbType, $arDBTypes) || $arDBTypes[$dbType] === false))
		{
			$this->SetError(InstallGetMessage("ERR_NO_DATABSEL"), "dbType");
		}

		$licenseKey = $wizard->GetVar("license");

		if (!defined("TRIAL_VERSION") && !preg_match('/[A-Z0-9]{3}-[A-Z]{2}-?[A-Z0-9]{12,30}/i', $licenseKey))
		{
			$this->SetError(InstallGetMessage("BAD_LICENSE_KEY"), "license");
		}

		if (defined("TRIAL_VERSION"))
		{
			$lic_key_variant = $wizard->GetVar("lic_key_variant");

			if ($lic_key_variant == "Y" && $licenseKey == '')
			{
				$lic_key_user_surname = $wizard->GetVar("user_surname");
				$lic_key_user_name = $wizard->GetVar("user_name");
				$lic_key_email = $wizard->GetVar("email");

				$bError = false;
				if (trim($lic_key_user_name) == '')
				{
					$this->SetError(InstallGetMessage("ACT_KEY_BAD_NAME"), "user_name");
					$bError = true;
				}
				if (trim($lic_key_user_surname) == '')
				{
					$this->SetError(InstallGetMessage("ACT_KEY_BAD_LAST_NAME"), "user_surname");
					$bError = true;
				}
				if (trim($lic_key_email) == '' || !check_email($lic_key_email))
				{
					$this->SetError(InstallGetMessage("ACT_KEY_BAD_EMAIL"), "email");
					$bError = true;
				}

				if (!$bError)
				{
					$key = BXInstallServices::GetRegistrationKey($lic_key_user_name, $lic_key_user_surname, $lic_key_email, $dbType);

					if ($key !== false)
					{
						$wizard->SetVar("license", $key);
					}
				}
			}
		}
	}

	function ShowStep()
	{
		$wizard = $this->GetWizard();

		BXInstallServices::SetSession();

		if (!defined("TRIAL_VERSION"))
		{
			$this->content .= '
				<table border="0" class="data-table">
				<tr>
					<td colspan="2" class="header">' . InstallGetMessage("INS_LICENSE_HEAD") . '</td>
				</tr>
				<tr>
				<td nowrap align="right" width="40%" valign="top">
					<span style="color:red">*</span>&nbsp;' . InstallGetMessage("INS_LICENSE") . '
				</td>
				<td width="60%" valign="top">' . $this->ShowInputField("text", "license", ["size" => "30", "tabindex" => "1", "id" => "license_id"]) . '
					<br>
					<small>' . InstallGetMessage("INS_LICENSE_NOTE_SOURCE") . '<br></small>
				</td>
				</tr>
				<tr>
				<td nowrap align="right" width="40%" valign="top">
					' . InstallGetMessage("INSTALL_DEVSRV") . '
				</td>
				<td width="60%" valign="top">' . $this->ShowCheckboxField("devsrv", "Y", ["id" => "devsrv_inst"]) . '
					<br>
					<small>' . InstallGetMessage("INSTALL_DEVSRV_NOTE") . '<br></small>
				</td>
				</tr>
				</table>
			';
		}
		else
		{
			$this->content .= '
			<script>
				function changeLicKey(val)
				{
					if(val)
					{
						document.getElementById("lic_key_activation").style.display = "block";
					}
					else
					{
						document.getElementById("lic_key_activation").style.display = "none";
					}
				}
			</script>

			<table border="0" class="data-table">
			<tr>
				<td colspan="2" class="header">' . InstallGetMessage("INS_LICENSE_HEAD") . '</td>
			</tr>
			';

			$this->content .= '<tr><td colspan="2"><label for="lic_key_variant">' . $this->ShowCheckboxField("lic_key_variant", "Y", ["id" => "lic_key_variant", "onclick" => "javascript:changeLicKey(this.checked)"]) . InstallGetMessage("ACT_KEY") . '</label></td></tr>';

			$lic_key_variant = $wizard->GetVar("lic_key_variant", true);
			$this->content .= '
			</table>

			<div id="lic_key_activation">
			<table border="0" class="data-table" style="border-top:none;">
			<tr>
				<td align="right" width="40%" style="border-top:none;"><span style="color:red">*</span>&nbsp;' . InstallGetMessage("ACT_KEY_NAME") . ':</td>
				<td width="60%" valign="top" style="border-top:none;">' . $this->ShowInputField("text", "user_name", ["size" => "30", "tabindex" => "4", "id" => "user_name"]) . '</td>
			</tr>
			<tr>
				<td align="right" width="40%" style="border-top:none;"><span style="color:red">*</span>&nbsp;' . InstallGetMessage("ACT_KEY_LAST_NAME") . ':</td>
				<td width="60%" valign="top" style="border-top:none;">' . $this->ShowInputField("text", "user_surname", ["size" => "30", "tabindex" => "5", "id" => "user_surname"]) . '</td>
			</tr>
			<tr>
				<td align="right" width="40%" style="border-top:none;"><span style="color:red">*</span>&nbsp;Email:</td>
				<td width="60%" valign="top" style="border-top:none;">' . $this->ShowInputField("text", "email", ["size" => "30", "tabindex" => "6", "id" => "email"]) . '</td>
			</tr>
			</table>
			</div>

			<script>
			changeLicKey(' . (($lic_key_variant == "Y") ? 'true' : 'false') . ');
			</script>
			';
		}

		$arDBTypes = BXInstallServices::GetDBTypes();

		if (count($arDBTypes) > 1)
		{
			$strDBTypes = "";
			foreach ($arDBTypes as $dbType => $active)
			{
				$arParams = ($active ? [] : ["disabled" => "disabled"]);
				$strDBTypes .= $this->ShowRadioField("dbType", $dbType, ["id" => "dbType_" . $dbType] + $arParams);

				$dbName = $dbType;
				if ($dbType == "mysql")
				{
					$dbName = "MySQL";
				}
				elseif ($dbType == "pgsql")
				{
					$dbName = "PostgreSQL";
				}

				$strDBTypes .= '<label for="' . "dbType_" . $dbType . '">&nbsp;' . $dbName . '</label><br>';
			}

			$this->content .= '
				<br />
				<table border="0" class="data-table">
				<tr>
					<td colspan="2" class="header">' . InstallGetMessage("INS_DB_SELECTION") . '</td>
				</tr>
				<tr>
					<td align="right" valign="top" width="40%">
						<span style="color:red">*</span>&nbsp;' . InstallGetMessage("INS_DB_PROMT") . ':<br><small>' . InstallGetMessage("INS_DB_PROMT_ALT") . '<br></small>
					</td>
					<td valign="top" width="60%">
						' . $strDBTypes . '
						<small>' . InstallGetMessage("INS_DB_PROMT_HINT") . '<br></small>
					</td>
				</tr>
				</table>
			';
		}
		else
		{
			$wizard->SetVar("dbType", $wizard->GetDefaultVar("dbType"));
		}

		$this->content .= '
			<script>
				setTimeout(function() {
					if(document.getElementById("license_id"))
					{
						document.getElementById("license_id").focus();
					}
					else
					{
						if(document.getElementById("lic_key_variant"))
							document.getElementById("lic_key_variant").focus();
					}
				}, 500);
			</script>
		';
	}
}

class RequirementStep extends CWizardStep
{
	protected $memoryMin = 64;
	protected $memoryRecommend = 256;
	protected $diskSizeMin = 500;
	protected $phpMinVersion = "8.1.0";
	protected $apacheMinVersion = "2.0";
	protected $bitrixVmMinVersion = '7.5.0';
	protected $arCheckFiles = [];

	function InitStep()
	{
		$this->SetStepID("requirements");
		$this->SetNextStep("create_database");
		$this->SetPrevStep("select_database");
		$this->SetNextCaption(InstallGetMessage("NEXT_BUTTON"));
		$this->SetPrevCaption(InstallGetMessage("PREVIOUS_BUTTON"));
		$this->SetTitle(InstallGetMessage("INS_STEP4_TITLE"));
	}

	function OnPostForm()
	{
		$wizard = $this->GetWizard();

		if ($wizard->IsPrevButtonClick())
		{
			return null;
		}

		$dbType = $wizard->GetVar("dbType");

		if (!BXInstallServices::IsUTF8Support())
		{
			$this->SetError(InstallGetMessage("INST_UTF8_RECOMENDATION2"));
			return false;
		}

		$mbEncoding = ini_get("mbstring.internal_encoding");
		if ($mbEncoding <> '' && strtoupper($mbEncoding) <> strtoupper(ini_get("default_charset")))
		{
			$this->SetError(InstallGetMessage("INST_UTF8_DEFAULT_ENCODING"));
			return false;
		}

		if (!BXInstallServices::CheckSession())
		{
			$this->SetError(InstallGetMessage("INST_SESSION_NOT_SUPPORT"));
			return false;
		}

		if (!$this->CheckRequirements($dbType))
		{
			return false;
		}
		return null;
	}

	function CheckRequirements($dbType)
	{
		if ($this->CheckServerVersion($serverName, $serverVersion, $serverMinVersion) === false)
		{
			$this->SetError(InstallGetMessage("SC_WEBSERVER_VER_ER"));
			return false;
		}

		if (function_exists('apache_get_modules') && !in_array('mod_rewrite', apache_get_modules()))
		{
			$this->SetError(InstallGetMessage("SC_MOD_REWRITE"));
			return false;
		}

		if (!$this->CheckPHPVersion())
		{
			$this->SetError(InstallGetMessage("SC_PHP_VER_ER"));
			return false;
		}

		if ($this->GetPHPSetting("safe_mode") == "ON")
		{
			$this->SetError(InstallGetMessage("SC_SAFE_MODE_ER"));
			return false;
		}

		if (ini_get("date.timezone") == '')
		{
			$this->SetError(InstallGetMessage("SC_TIME_ZONE_ER"));
			return false;
		}

		if (extension_loaded('eaccelerator'))
		{
			$this->SetError(InstallGetMessage("SC_EA_ER"));
			return false;
		}

		$arDBTypes = BXInstallServices::GetDBTypes();
		if (!array_key_exists($dbType, $arDBTypes) || $arDBTypes[$dbType] === false)
		{
			$this->SetError(InstallGetMessage("SC_NO_MYS_LIB_ER"));
			return false;
		}

		if (!function_exists("hash"))
		{
			$this->SetError(InstallGetMessage("SC_NO_HASH"));
			return false;
		}

		if (!function_exists("openssl_encrypt"))
		{
			$this->SetError(InstallGetMessage("SC_NO_OPENSSL_LIB_ER"));
			return false;
		}

		if (!function_exists("mb_strlen"))
		{
			$this->SetError(InstallGetMessage("SC_NO_MBSTRING_LIB_ER"));
			return false;
		}

		if (intval(ini_get("mbstring.func_overload")) > 0)
		{
			$this->SetError(InstallGetMessage("SC_FUNC_OVERLOAD_ER1"));
			return false;
		}

		if (!$this->CheckFileAccess())
		{
			$files = "";
			foreach ($this->arCheckFiles as $arFile)
			{
				if (!$arFile["ACCESS"])
				{
					$files .= "<br />&nbsp;" . $arFile["PATH"];
				}
			}

			$this->SetError(InstallGetMessage("INST_ERROR_ACCESS_FILES") . $files);
			return false;
		}

		return true;
	}

	function GetPHPSetting($value)
	{
		return (ini_get($value) == "1" || strtoupper(ini_get($value)) == "ON" ? "ON" : "OFF");
	}

	function ShowResult($resultText, $type = "OK")
	{
		if ($resultText == '')
		{
			return "";
		}

		if (strtoupper($type) == "ERROR" || $type === false)
		{
			return "<b><span style=\"color:red\">" . $resultText . "</span></b>";
		}
		elseif (strtoupper($type) == "OK" || $type === true)
		{
			return "<b><span style=\"color:green\">" . $resultText . "</span></b>";
		}
		elseif (strtoupper($type) == "NOTE" || strtoupper($type) == "N")
		{
			return "<b><span style=\"color:black\">" . $resultText . "</span></b>";
		}
		return "";
	}

	function CheckServerVersion(&$serverName, &$serverVersion, &$serverMinVersion)
	{
		$serverName = "";
		$serverVersion = "";
		$serverMinVersion = "";

		if (isset($_SERVER['BITRIX_VA_VER']))
		{
			// Bitrix VM on board
			$serverName = 'Bitrix VM';
			$serverVersion = $_SERVER['BITRIX_VA_VER'];
			$serverMinVersion = $this->bitrixVmMinVersion;

			return BXInstallServices::VersionCompare($serverVersion, $serverMinVersion);
		}
		else
		{
			$serverSoftware = $_SERVER["SERVER_SOFTWARE"];
			if ($serverSoftware == '')
			{
				$serverSoftware = $_SERVER["SERVER_SIGNATURE"];
			}
			$serverSoftware = trim($serverSoftware);

			if (!preg_match("#^([a-zA-Z-]+).*?([\\d]+\\.[\\d]+(\\.[\\d]+)?)#i", $serverSoftware, $arMatch))
			{
				return null;
			}

			$serverName = $arMatch[1];
			$serverVersion = $arMatch[2];

			if (strtoupper($serverName) == "APACHE")
			{
				$serverMinVersion = $this->apacheMinVersion;
				return BXInstallServices::VersionCompare($serverVersion, $serverMinVersion);
			}

			return null;
		}
	}

	function CheckPHPVersion()
	{
		return BXInstallServices::VersionCompare(phpversion(), $this->phpMinVersion);
	}

	function CheckFileAccess()
	{
		$this->arCheckFiles = [
			["PATH" => $_SERVER["DOCUMENT_ROOT"], "DESC" => InstallGetMessage("SC_DISK_PUBLIC"), "RESULT" => "", "ACCESS" => true],
			["PATH" => $_SERVER["DOCUMENT_ROOT"] . "/bitrix", "DESC" => InstallGetMessage("SC_DISK_BITRIX"), "RESULT" => "", "ACCESS" => true],
			["PATH" => $_SERVER["DOCUMENT_ROOT"] . "/index.php", "DESC" => InstallGetMessage("SC_FILE"), "RESULT" => "", "ACCESS" => true],
			["PATH" => $_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules", "DESC" => InstallGetMessage("SC_CATALOG"), "RESULT" => "", "ACCESS" => true],
		];

		$success = true;
		foreach ($this->arCheckFiles as $index => $arFile)
		{
			$readable = is_readable($arFile["PATH"]);
			$writeable = is_writeable($arFile["PATH"]);

			if ($readable && $writeable)
			{
				$this->arCheckFiles[$index]["RESULT"] = $this->ShowResult(InstallGetMessage("SC_DISK_AVAIL_READ_WRITE1"), "OK");
				continue;
			}

			$success = false;
			$this->arCheckFiles[$index]["ACCESS"] = false;

			if (!$writeable)
			{
				$this->arCheckFiles[$index]["RESULT"] .= $this->ShowResult(InstallGetMessage("SC_CAN_NOT_WRITE"), "ERROR");
			}

			if (!$writeable && !$readable)
			{
				$this->arCheckFiles[$index]["RESULT"] .= " " . InstallGetMessage("SC_AND") . " ";
			}

			if (!$readable)
			{
				$this->arCheckFiles[$index]["RESULT"] .= $this->ShowResult(InstallGetMessage("SC_CAN_NOT_READ"), "ERROR");
			}
		}

		if ($success === false)
		{
			return false;
		}

		return $this->CreateTemporaryFiles();
	}

	function CreateTemporaryFiles()
	{
		$htaccessTest = $_SERVER["DOCUMENT_ROOT"] . "/bitrix/httest";
		$rootTest = $_SERVER["DOCUMENT_ROOT"] . "/bxtest";

		if (!file_exists($htaccessTest) && @mkdir($htaccessTest) === false)
		{
			$this->arCheckFiles[] = [
				"PATH" => $htaccessTest,
				"DESC" => InstallGetMessage("SC_CATALOG"),
				"RESULT" => $this->ShowResult(InstallGetMessage("SC_CAN_NOT_WRITE"), "ERROR"),
				"ACCESS" => false,
			];
			return false;
		}

		if (!file_exists($rootTest) && @mkdir($rootTest) === false)
		{
			$this->arCheckFiles[] = [
				"PATH" => $rootTest,
				"ACCESS" => false,
				"RESULT" => $this->ShowResult(InstallGetMessage("SC_CAN_NOT_WRITE"), "ERROR"),
				"DESC" => InstallGetMessage("SC_CATALOG"),
			];
			return false;
		}

		$arFiles = [
			[
				"PATH" => $_SERVER["DOCUMENT_ROOT"] . "/bitrix/httest/.htaccess",
				"CONTENT" => 'ErrorDocument 404 /bitrix/httest/404.php

<IfModule mod_rewrite.c>
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^.+\.php$ /bitrix/httest/404.php
</IfModule>',
			],
			[
				"PATH" => $_SERVER["DOCUMENT_ROOT"] . "/bitrix/httest/404.php",
				"CONTENT" => "<" . "?\n" .
					"$" . "cgi = (stristr(php_sapi_name(), \"cgi\") !== false);\n" .
					"$" . "fastCGI = (" . "$" . "cgi && stristr(" . "$" . "_SERVER[\"SERVER_SOFTWARE\"], \"Microsoft-IIS\") !== false);\n" .
					"if (" . "$" . "cgi && !" . "$" . "fastCGI)\n" .
					"	header(\"Status: 200 OK\");\n" .
					"else\n" .
					"	header(\"HTTP/1.0 200 OK\");\n" .
					"echo \"SUCCESS\";\n" .
					"?" . ">",
			],
			[
				"PATH" => $_SERVER["DOCUMENT_ROOT"] . "/bxtest/test.php",
				"CONTENT" => "test",
			],
		];

		foreach ($arFiles as $arFile)
		{
			if (!$fp = @fopen($arFile["PATH"], "wb"))
			{
				$this->arCheckFiles[] = ["PATH" => $arFile["PATH"], "ACCESS" => false, "SKIP" => true];
				return false;
			}

			if (!fwrite($fp, $arFile["CONTENT"]))
			{
				$this->arCheckFiles[] = ["PATH" => $arFile["PATH"], "ACCESS" => false, "SKIP" => true];
				return false;
			}
		}

		return true;
	}

	function ShowStep()
	{
		$wizard = $this->GetWizard();

		$this->content .= '<h3>' . InstallGetMessage("SC_SUBTITLE_REQUIED") . '</h3>' . InstallGetMessage("SC_SUBTITLE_REQUIED_DESC") . '<br><br>';

		$this->content .= '
		<table border="0" class="data-table data-table-multiple-column">
			<tr>
				<td class="header">' . InstallGetMessage("SC_PARAM") . '</td>
				<td class="header">' . InstallGetMessage("SC_REQUIED") . '</td>
				<td class="header">' . InstallGetMessage("SC_CURRENT") . '</td>
			</tr>';

		//Web server version
		$success = $this->CheckServerVersion($serverName, $serverVersion, $serverMinVersion);
		$this->content .= '
		<tr>
			<td valign="top">
					' . str_replace("#SERVER#", (($serverName <> '') ? $serverName : InstallGetMessage("SC_UNKNOWN")), InstallGetMessage("SC_SERVER_VERS")) . '
			</td>
			<td valign="top">
				' . ($serverMinVersion <> '' ? str_replace("#VER#", $serverMinVersion, InstallGetMessage("SC_VER_VILKA1")) : "") . '
			</td>
			<td valign="top">
				' . ($success !== null ? $this->ShowResult($serverVersion, $success) : $this->ShowResult(InstallGetMessage("SC_UNKNOWN1"), "ERROR")) . '
			</td>
		</tr>';

		if (function_exists('apache_get_modules'))
		{
			// mod_rewrite
			$this->content .= '
			<tr>
				<td valign="top">mod_rewrite</td>
				<td valign="top">' . InstallGetMessage("SC_SETTED") . '</td>
				<td valign="top">
						' . (in_array('mod_rewrite', apache_get_modules()) ?
					$this->ShowResult(InstallGetMessage("SC_SETTED"), "OK") :
					$this->ShowResult(InstallGetMessage("SC_NOT_SETTED"), "ERROR")
				) . '
				</td>
			</tr>';
		}

		//PHP version
		$success = $this->CheckPHPVersion();
		$this->content .= '
		<tr>
			<td valign="top">' . InstallGetMessage("SC_PHP_VERS") . '</td>
			<td valign="top">
					' . ($this->phpMinVersion <> '' ? str_replace("#VER#", $this->phpMinVersion, InstallGetMessage("SC_VER_VILKA1")) : "") . '
			</td>
			<td valign="top">' . $this->ShowResult(phpversion(), $success) . '</td>
		</tr>';

		$this->content .= '
		<tr>
			<td colspan="3"><b>' . InstallGetMessage("SC_PHP_SETTINGS") . '</b></td>
		</tr>';

		//Save mode
		$this->content .= '
		<tr>
			<td valign="top">safe mode</td>
			<td valign="top">' . InstallGetMessage("SC_TURN_OFF") . '</td>
			<td valign="top">
					' . ($this->GetPHPSetting("safe_mode") == "ON" ?
				$this->ShowResult(InstallGetMessage("SC_TURN_ON"), "ERROR") :
				$this->ShowResult(InstallGetMessage("SC_TURN_OFF"), "OK")
			) . '
			</td>
		</tr>';

		//timezone
		$this->content .= '
		<tr>
			<td valign="top">date.timezone</td>
			<td valign="top">' . InstallGetMessage("SC_SETTED") . '</td>
			<td valign="top">
					' . (($zone = ini_get("date.timezone")) == '' ?
				$this->ShowResult(InstallGetMessage("SC_NOT_SETTED"), "ERROR") :
				$this->ShowResult($zone, "OK")
			) . '
			</td>
		</tr>';

		if ($this->GetPHPSetting('opcache.enable') == 'ON')
		{
			$this->content .= '
			<tr>
				<td valign="top">opcache.validate_timestamps</td>
				<td valign="top">1</td>
				<td valign="top">
						' . ($this->GetPHPSetting('opcache.validate_timestamps') == "ON" ?
					$this->ShowResult(1, "OK") :
					$this->ShowResult(0, "ERROR")
				) . '
				</td>
			</tr>
			<tr>
				<td valign="top">opcache.revalidate_freq</td>
				<td valign="top">0</td>
				<td valign="top">
						' . (ini_get('opcache.revalidate_freq') > 0 ?
					$this->ShowResult(ini_get('opcache.revalidate_freq'), "ERROR") :
					$this->ShowResult("0", "OK")
				) . '
				</td>
			</tr>';
		}

		if (extension_loaded('eaccelerator'))
		{
			$this->content .= '
			<tr>
				<td valign="top">eAccelerator</td>
				<td valign="top">' . InstallGetMessage("SC_NOT_SETTED") . '</td>
				<td valign="top">' . $this->ShowResult(InstallGetMessage("SC_SETTED"), "ERROR") . '</td>
			</tr>';
		}

		//UTF-8
		$encoding = ini_get("default_charset");
		if ($encoding == "")
		{
			$encoding = $this->ShowResult(InstallGetMessage("SC_NOT_SETTED"), "ERROR");
		}
		else
		{
			$encoding = $this->ShowResult($encoding, (strtoupper($encoding) == "UTF-8" ? "OK" : "ERROR"));
		}

		$this->content .= '
			<tr>
				<td valign="top">default_charset</td>
				<td valign="top">UTF-8</td>
				<td valign="top">' . $encoding . '</td>
			</tr>';

		if (intval(ini_get("mbstring.func_overload")) > 0)
		{
			$this->content .= '
				<tr>
					<td valign="top">mbstring.func_overload</td>
					<td valign="top">-</td>
					<td valign="top">' . $this->ShowResult(ini_get("mbstring.func_overload"), "ERROR") . '</td>
				</tr>';
		}

		//Database support in PHP
		$dbType = $wizard->GetVar("dbType");
		$arDBTypes = BXInstallServices::GetDBTypes();
		$success = (array_key_exists($dbType, $arDBTypes) && $arDBTypes[$dbType] === true);

		$library = '';
		if ($dbType == "mysql")
		{
			$library = '<a href="https://www.php.net/manual/en/book.mysqli.php" target="_blank">' . InstallGetMessage("SC_MOD_MYSQL") . '</a>';
		}
		elseif ($dbType == "pgsql")
		{
			$library = '<a href="https://www.php.net/manual/en/book.pgsql.php" target="_blank">PostgreSQL</a>';
		}

		$this->content .= '
		<tr>
			<td colspan="3"><b>' . InstallGetMessage("SC_REQUIED_PHP_MODS") . '</b></td>
		</tr>
		<tr>
			<td valign="top">' . $library . '</td>
			<td valign="top">' . InstallGetMessage("SC_SETTED") . '</td>
			<td valign="top">
			' . (
			$success ?
				$this->ShowResult(InstallGetMessage("SC_SETTED"), "OK") :
				$this->ShowResult(InstallGetMessage("SC_NOT_SETTED"), "ERROR")
			) . '</td>
		</tr>';

		$this->content .= '
		<tr>
			<td valign="top">
				<a href="http://php.net/manual/book.hash.php" target="_blank">' . InstallGetMessage("SC_MOD_HASH") . '</a>
			</td>
			<td valign="top">' . InstallGetMessage("SC_SETTED") . '</td>
			<td valign="top">
					' . (function_exists("hash") ? $this->ShowResult(InstallGetMessage("SC_SETTED"), "OK") : $this->ShowResult(InstallGetMessage("SC_NOT_SETTED"), "ERROR")) . '
			</td>
		</tr>';

		$this->content .= '
		<tr>
			<td valign="top">
				<a href="http://php.net/manual/en/book.openssl.php" target="_blank">OpenSSL</a>
			</td>
			<td valign="top">' . InstallGetMessage("SC_SETTED") . '</td>
			<td valign="top">
					' . (function_exists("openssl_encrypt") ? $this->ShowResult(InstallGetMessage("SC_SETTED"), "OK") : $this->ShowResult(InstallGetMessage("SC_NOT_SETTED"), "ERROR")) . '
			</td>
		</tr>';
		$this->content .= '
		<tr>
			<td valign="top">
				<a href="http://php.net/manual/en/book.mbstring.php" target="_blank">Multibyte String</a>
			</td>
			<td valign="top">' . InstallGetMessage("SC_SETTED") . '</td>
			<td valign="top">
					' . (function_exists("mb_strlen") ? $this->ShowResult(InstallGetMessage("SC_SETTED"), "OK") : $this->ShowResult(InstallGetMessage("SC_NOT_SETTED"), "ERROR")) . '
			</td>
		</tr>';

		if (!BXInstallServices::CheckSession())
		{
			$this->content .= '
				<tr>
					<td valign="top">
							<a href="http://www.php.net/manual/en/book.session.php" target="_blank">' . InstallGetMessage("INST_SESSION_SUPPORT") . '</a>
					</td>
					<td valign="top">' . InstallGetMessage("INST_YES") . '</td>
					<td valign="top">' . $this->ShowResult(InstallGetMessage("INST_NO") . ". " . InstallGetMessage("INST_SESSION_NOT_SUPPORT"), "ERROR") . '</td>
				</tr>';
		}

		$this->content .= '</table>';

		//File and folder permissons
		$this->content .= '<h3>' . InstallGetMessage("SC_SUBTITLE_DISK") . '</h3>' . InstallGetMessage("SC_SUBTITLE_DISK_DESC") . '<br><br>';
		$this->content .= '
		<table border="0" class="data-table data-table-multiple-column">
		<tr>
			<td class="header">' . InstallGetMessage("SC_PARAM") . '</td>
			<td class="header">' . InstallGetMessage("SC_VALUE") . '</td>
		</tr>';

		$this->CheckFileAccess();
		foreach ($this->arCheckFiles as $arFile)
		{
			if (isset($arFile["SKIP"]))
			{
				continue;
			}

			$this->content .= '
			<tr>
				<td valign="top">' . $arFile["DESC"] . ' <i>' . $arFile["PATH"] . '</i></td>
				<td valign="top">' . $arFile["RESULT"] . '</td>
			</tr>';
		}

		$this->content .= '</table>';

		//Recommend
		$this->content .= '<h3>' . InstallGetMessage("SC_SUBTITLE_RECOMMEND") . '</h3>' . InstallGetMessage("SC_SUBTITLE_RECOMMEND_DESC") . '<br><br>';
		$this->content .= '
		<table border="0" class="data-table data-table-multiple-column">
			<tr>
				<td class="header">' . InstallGetMessage("SC_PARAM") . '</td>
				<td class="header">' . InstallGetMessage("SC_RECOMMEND") . '</td>
				<td class="header">' . InstallGetMessage("SC_CURRENT") . '</td>
			</tr>';

		if (file_exists($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/intranet"))
		{
			$min_version = '4.2';
			if (!($vm = getenv('BITRIX_VA_VER')))
			{
				$txt = $this->ShowResult(InstallGetMessage('SC_VMBITRIX_UNKNOWN'), false);
			}
			elseif (version_compare($vm, $min_version, '<'))
			{
				$txt = $this->ShowResult(str_replace('#VER#', htmlspecialcharsbx($vm), InstallGetMessage('SC_VMBITRIX_OLD')), false);
			}
			else
			{
				$txt = $this->ShowResult(InstallGetMessage('SC_VMBITRIX_OK'), true);
			}

			$this->content .= '
			<tr>
				<td valign="top">' . InstallGetMessage("SC_VMBITRIX") . '</td>
				<td valign="top">' . str_replace('#VER#', $min_version, InstallGetMessage('SC_VMBITRIX_RECOMMENDED')) . '</td>
				<td valign="top">' . $txt . '</td>
			</tr>';
		}

		if (str_contains(strtolower($_SERVER['SERVER_SOFTWARE']), 'apache'))
		{
			$this->content .= '
			<tr>
				<td valign="top">' . InstallGetMessage("SC_HTACCESS") . '</td>
				<td valign="top">' . InstallGetMessage("SC_TURN_ON2") . '</td>
				<td valign="top"><span id="httest">' . $this->ShowResult(InstallGetMessage("SC_TESTING"), "N") . '</span>
				<script>
					req = false;
					if(window.XMLHttpRequest)
					{
						try{req = new XMLHttpRequest();}
						catch(e) {req = false;}
					} else if(window.ActiveXObject)
					{
						try {req = new ActiveXObject("Msxml2.XMLHTTP");}
						catch(e)
						{
							try {req = new ActiveXObject("Microsoft.XMLHTTP");}
							catch(e) {req = false;}
						}
					}

					if (req)
					{
						req.onreadystatechange = processReqChange;
						req.open("GET", "/bitrix/httest/test_404.php?random=" + Math.random(), true);
						req.send("");
					}
					else
						document.getElementById("httest").innerHTML = \'' . $this->ShowResult(InstallGetMessage("SC_HTERR"), "ERROR") . '\';

					function processReqChange() {
						if (req.readyState == 4) {
							if (req.responseText == "SUCCESS") {
								res = \'' . $this->ShowResult(InstallGetMessage("SC_TURN_ON2"), "OK") . '\';
							} else {
								res = \'' . $this->ShowResult(InstallGetMessage("SC_TURN_OFF2"), "ERROR") . '\';
							}
							document.getElementById("httest").innerHTML = res;
						}
					}
				</script>
				</td>
			</tr>';
		}

		$freeSpace = @disk_free_space($_SERVER["DOCUMENT_ROOT"]);
		$freeSpace = $freeSpace * 1.0 / 1000000.0;
		$this->content .= '
		<tr>
			<td valign="top">' . InstallGetMessage("SC_AVAIL_DISK_SPACE") . '</td>
			<td valign="top">
				' . (intval($this->diskSizeMin) > 0 ? str_replace("#SIZE#", $this->diskSizeMin, InstallGetMessage("SC_AVAIL_DISK_SPACE_SIZE")) : "") . '&nbsp;
			</td>
			<td valign="top">
					' . ($freeSpace > $this->diskSizeMin ? $this->ShowResult(round($freeSpace, 1) . " Mb", "OK") : $this->ShowResult(round($freeSpace, 1) . " Mb", "ERROR")) . '
			</td>
		</tr>';

		$memoryLimit = WelcomeStep::unformat(ini_get('memory_limit'));
		if (!$memoryLimit || $memoryLimit == '')
		{
			$memoryLimit = WelcomeStep::unformat(get_cfg_var('memory_limit'));
		}

		if ($memoryLimit > 0 && $memoryLimit < $this->memoryMin)
		{
			@ini_set("memory_limit", "64M");
			$memoryLimit = WelcomeStep::unformat(ini_get('memory_limit'));
		}

		$recommendMemory = "";
		if (intval($this->memoryMin) > 0)
		{
			$recommendMemory .= str_replace("#SIZE#", $this->memoryMin, InstallGetMessage("SC_AVAIL_MEMORY_MIN"));
		}
		if (intval($this->memoryMin) > 0 && intval($this->memoryRecommend) > 0)
		{
			$recommendMemory .= ", ";
		}
		if (intval($this->memoryRecommend) > 0)
		{
			$recommendMemory .= str_replace("#SIZE#", $this->memoryRecommend, InstallGetMessage("SC_AVAIL_MEMORY_REC"));
		}

		$this->content .= '
		<tr>
			<td colspan="3"><b>' . InstallGetMessage("SC_RECOM_PHP_SETTINGS") . '</b></td>
		</tr>
		<tr>
			<td valign="top">' . InstallGetMessage("SC_AVAIL_MEMORY") . '</td>
			<td valign="top">' . $recommendMemory . '</td>
			<td valign="top">
					' . ($memoryLimit > 0 && $memoryLimit < $this->memoryMin * 1048576 ? $this->ShowResult(ini_get('memory_limit'), "ERROR") : $this->ShowResult(ini_get('memory_limit'), "OK")) . '
			</td>
		</tr>';

		$this->content .= '
		<tr>
			<td valign="top">' . InstallGetMessage("SC_ALLOW_UPLOAD") . ' (file_uploads)</td>
			<td valign="top">' . InstallGetMessage("SC_TURN_ON1") . '</td>
			<td valign="top">
					' . ($this->GetPHPSetting("file_uploads") == "ON" ? $this->ShowResult(InstallGetMessage("SC_TURN_ON1"), "OK") : $this->ShowResult(InstallGetMessage("SC_TURN_OFF1"), "ERROR")) . '
			</td>
		</tr>
		<tr>
			<td valign="top">' . InstallGetMessage("SC_SHOW_ERRORS") . ' (display_errors)</td>
			<td valign="top">' . InstallGetMessage("SC_TURN_OFF1") . '</td>
			<td valign="top">
					' . ($this->GetPHPSetting("display_errors") == "ON" ? $this->ShowResult(InstallGetMessage("SC_TURN_ON1"), "ERROR") : $this->ShowResult(InstallGetMessage("SC_TURN_OFF1"), "OK")) . '
			</td>
		</tr>
		<tr>
			<td valign="top">' . InstallGetMessage("SC_magic_quotes_sybase") . ' (magic_quotes_sybase)</td>
			<td valign="top">' . InstallGetMessage("SC_TURN_OFF1") . '</td>
			<td valign="top">
					' . ($this->GetPHPSetting("magic_quotes_sybase") == "ON" ? $this->ShowResult(InstallGetMessage("SC_TURN_ON1"), "ERROR") : $this->ShowResult(InstallGetMessage("SC_TURN_OFF1"), "OK")) . '
			</td>
		</tr>';

		//Recommended extensions
		$this->content .= '
		<tr>
			<td colspan="3"><b>' . InstallGetMessage("SC_RECOM_PHP_MODULES") . '</b></td>
		</tr>
		<tr>
			<td valign="top">
				<a href="http://www.php.net/manual/en/ref.zlib.php" target="_blank">Zlib Compression</a>
			</td>
			<td valign="top">' . InstallGetMessage("SC_SETTED") . '</td>
			<td valign="top">
					' . (extension_loaded("zlib") && function_exists("gzcompress") ? $this->ShowResult(InstallGetMessage("SC_SETTED"), "OK") : $this->ShowResult(InstallGetMessage("SC_NOT_SETTED"), "ERROR")) . '
			</td>
		</tr>
		<tr>
			<td valign="top">
				<a href="http://www.php.net/manual/en/ref.image.php" target="_blank">' . InstallGetMessage("SC_MOD_GD") . '</a>
			</td>
			<td valign="top">' . InstallGetMessage("SC_SETTED") . '</td>
			<td valign="top">
					' . (function_exists("imagecreate") ? $this->ShowResult(InstallGetMessage("SC_SETTED"), "OK") : $this->ShowResult(InstallGetMessage("SC_NOT_SETTED"), "ERROR")) . '
			</td>
		</tr>
		<tr>
			<td valign="top"><a href="http://www.freetype.org" target="_blank">Free Type Library</a></td>
			<td valign="top">' . InstallGetMessage("SC_SETTED") . '</td>
			<td valign="top">
					' . (function_exists("imagettftext") ? $this->ShowResult(InstallGetMessage("SC_SETTED"), "OK") : $this->ShowResult(InstallGetMessage("SC_NOT_SETTED"), "ERROR")) . '
			</td>
		</tr>';

		$this->content .= '</table>';

		$this->content .= '<br /><br /><table class="data-table"><tr><td width="0%">' . InstallGetMessage("SC_NOTES1") . '</td></tr></table>';
	}
}

class CreateDBStep extends CWizardStep
{
	const MIN_MYSQL_VERSION = '8.0.0';

	var $dbType;
	var $dbUser;
	var $dbPassword;
	var $dbHost;
	var $dbName;
	var $createDatabase;
	var $createUser;
	var $rootUser;
	var $rootPassword;
	var $filePermission;
	var $folderPermission;
	var $DB = null;
	var $sqlMode = false;

	protected $collation = 'utf8mb4_0900_ai_ci';

	function InitStep()
	{
		$this->SetStepID("create_database");
		$this->SetNextStep("create_modules");
		$this->SetPrevStep("requirements");
		$this->SetNextCaption(InstallGetMessage("NEXT_BUTTON"));
		$this->SetPrevCaption(InstallGetMessage("PREVIOUS_BUTTON"));
		$this->SetTitle(InstallGetMessage("INS_STEP5_TITLE"));

		$wizard = $this->GetWizard();

		$wizard->SetDefaultVars([
			"folder_access_perms" => "0755",
			"file_access_perms" => "0644",
			"create_user" => "N",
			"create_database" => "N",
		]);

		$wizard->SetDefaultVar("database", "sitemanager");
		$wizard->SetDefaultVar("host", "localhost");
	}

	function OnPostForm()
	{
		$wizard = $this->GetWizard();

		if ($wizard->IsPrevButtonClick())
		{
			return;
		}

		$this->dbType = $wizard->GetVar("dbType");
		$this->dbUser = $wizard->GetVar("user");
		$this->dbPassword = $wizard->GetVar("password");
		$this->dbHost = $wizard->GetVar("host");
		$this->dbName = $wizard->GetVar("database");

		$this->createDatabase = $wizard->GetVar("create_database");
		$this->createDatabase = ($this->createDatabase == "Y");

		$this->createUser = $wizard->GetVar("create_user");
		$this->createUser = ($this->createUser == "Y");

		$this->rootUser = $wizard->GetVar("root_user");
		$this->rootPassword = $wizard->GetVar("root_password");

		if (preg_match("/(0[0-7]{3})/", $wizard->GetVar("file_access_perms"), $match))
		{
			$this->filePermission = $match[1];
		}
		else
		{
			$this->filePermission = $wizard->GetDefaultVar("file_access_perms");
		}

		if (preg_match("/(0[0-7]{3})/", $wizard->GetVar("folder_access_perms"), $match))
		{
			$this->folderPermission = $match[1];
		}
		else
		{
			$this->folderPermission = $wizard->GetDefaultVar("folder_access_perms");
		}

		// /bitrix/admin permissions
		BXInstallServices::CheckDirPath($_SERVER["DOCUMENT_ROOT"] . "/bitrix/admin/", octdec($this->folderPermission));
		if (!is_readable($_SERVER["DOCUMENT_ROOT"] . "/bitrix/admin/") || !is_writeable($_SERVER["DOCUMENT_ROOT"] . "/bitrix/admin/"))
		{
			$this->SetError("Access denied: /bitrix/admin/");
			return;
		}

		// define.php
		$definePath = $_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/admin/define.php";
		if (file_exists($definePath))
		{
			if (!is_readable($definePath) || !is_writeable($definePath))
			{
				$this->SetError("Access denied: /bitrix/modules/main/admin/define.php");
				return;
			}
		}
		else
		{
			$sc = false;
			if ($fp = @fopen($definePath, "wb"))
			{
				if (fwrite($fp, "test"))
				{
					$sc = true;
				}

				@fclose($fp);
				@unlink($definePath);
			}

			if (!$sc)
			{
				$this->SetError("Access denied: /bitrix/modules/main/admin/define.php");
				return;
			}
		}

		//Bad database type
		$arDBTypes = BXInstallServices::GetDBTypes();
		if (!array_key_exists($wizard->GetVar("dbType"), $arDBTypes) || $arDBTypes[$wizard->GetVar("dbType")] === false)
		{
			$this->SetError(InstallGetMessage("ERR_INTERNAL_NODEF"));
			return;
		}

		//Empty database user
		if ($this->dbUser == '')
		{
			$this->SetError(InstallGetMessage("ERR_NO_USER"), "user");
			return;
		}

		$connectionParameters = [
			'host' => $this->dbHost,
			'database' => $this->dbName,
			'login' => $this->dbUser,
			'password' => $this->dbPassword,
			'options' => 2,
		];

		if ($this->dbType == 'pgsql')
		{
			$connectionParameters['className'] = "\\Bitrix\\Main\\DB\\PgsqlConnection";
			$connectionParameters['charset'] = 'utf8';
		}
		else
		{
			$connectionParameters['className'] = "\\Bitrix\\Main\\DB\\MysqliConnection";
		}

		$application = \Bitrix\Main\HttpApplication::getInstance();
		$conPool = $application->getConnectionPool();
		$conPool->setConnectionParameters(
			\Bitrix\Main\Data\ConnectionPool::DEFAULT_CONNECTION_NAME,
			$connectionParameters
		);

		$conPool->useMasterOnly(true);

		if ($this->dbType == "mysql" && !$this->CreateMySQL())
		{
			return;
		}

		if ($this->dbType == "pgsql" && !$this->CreatePgSQL())
		{
			return;
		}

		if ($this->dbType == "mysql" && !$this->CreateAfterConnect())
		{
			return;
		}

		IncludeModuleLangFile($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/classes/general/main.php");

		// Database-dependent classes
		CAllDatabase::registerAutoload($this->dbType);

		global $DB;
		try
		{
			$DB = new CDatabase();
			$this->DB = $DB;
		}
		catch (Exception $e)
		{
			$this->SetError((string)$e);
			return;
		}

		$DB->DebugToFile = false;

		if (!$DB->Connect($this->dbHost, $this->dbName, $this->dbUser, $this->dbPassword))
		{
			$this->SetError(InstallGetMessage("COULD_NOT_CONNECT") . " " . $DB->db_Error);
			return;
		}

		$DB->debug = true;

		if ($this->IsBitrixInstalled())
		{
			return;
		}

		if (!$this->CheckDBOperation())
		{
			return;
		}

		if (!$this->createSettings($connectionParameters))
		{
			return;
		}

		if (!$this->CreateDBConn())
		{
			return;
		}

		$this->CreateLicenseFile();

		//Delete cache files if exists
		BXInstallServices::DeleteDirRec($_SERVER["DOCUMENT_ROOT"] . "/bitrix/managed_cache");
		BXInstallServices::DeleteDirRec($_SERVER["DOCUMENT_ROOT"] . "/bitrix/stack_cache");
	}

	function IsBitrixInstalled()
	{
		$DB =& $this->DB;

		$res = $DB->Query("SELECT COUNT(ID) FROM b_user", true);
		if ($res && $res->Fetch())
		{
			$this->SetError(str_replace("#DB#", $this->dbName, InstallGetMessage("ERR_ALREADY_INST1")));
			return true;
		}

		return false;
	}

	function CreatePgSQL()
	{
		if (
			preg_match("/[\\x0\\xFF\\/\\\\.]/", $this->dbName)
			|| preg_match("/\\s$/", $this->dbName)
			|| strlen($this->dbName) > 63
		)
		{
			$this->SetError(InstallGetMessage("ERR_DATABASE_NAME"));
			return false;
		}

		$config = [
			'host' => $this->dbHost,
		];
		if ($this->createDatabase || $this->createUser)
		{
			$config['login'] = $this->rootUser;
			$config['password'] = $this->rootPassword;
		}
		else
		{
			$config['login'] = $this->dbUser;
			$config['password'] = $this->dbPassword;
			$config['database'] = $this->dbName;
		}

		$conn = new DB\PgsqlConnection($config);

		try
		{
			$conn->connect();
			//Check PostgreSQL version
			$version = $conn->getVersion();
		}
		catch (DB\ConnectionException $e)
		{
			$this->SetError(InstallGetMessage("ERR_CONNECT2MYSQL") . " " . $e->getDatabaseMessage());
			return false;
		}

		if (!BXInstallServices::VersionCompare($version[0], "11.0.0"))
		{
			$this->SetError(InstallGetMessage("SC_DB_PGSQL_VERSION_ER"));
			return false;
		}

		if ($this->createDatabase)
		{
			$dbResult = $conn->query("SELECT datname FROM pg_database WHERE datname = '" . $conn->getSqlHelper()->forSql($this->dbName) . "'");
			if ($dbResult->fetch())
			{
				$this->SetError(str_replace("#DB#", $this->dbName, InstallGetMessage("ERR_EXISTS_DB1")));
				return false;
			}

			//Check default template1 collation
			$dbResult = $conn->query("SELECT DATCTYPE FROM pg_database where datname='template1'");
			$row = $dbResult->fetch();
			if (preg_match('/\.(UTF-8|UTF8)$/i', $row['DATCTYPE']))
			{
				try
				{
					$conn->queryExecute("CREATE DATABASE " . $conn->getSqlHelper()->quote($this->dbName));
				}
				catch (DB\SqlQueryException $e)
				{
					$this->SetError(str_replace("#DB#", $this->dbName, InstallGetMessage("ERR_CREATE_DB1")) . ' ' . $e);
					return false;
				}
			}
			else //use slower template0 creation
			{
				try
				{
					$conn->queryExecute("CREATE DATABASE " . $conn->getSqlHelper()->quote($this->dbName) . " lc_ctype='C.UTF-8' template template0");
				}
				catch (DB\SqlQueryException)
				{
					//Windows ?
					try
					{
						$conn->queryExecute("CREATE DATABASE " . $conn->getSqlHelper()->quote($this->dbName) . " lc_ctype='us.UTF8' template template0");
					}
					catch (DB\SqlQueryException $e)
					{
						$this->SetError(str_replace("#DB#", $this->dbName, InstallGetMessage("ERR_CREATE_DB1")) . ' ' . $e);
						return false;
					}
				}
			}

			$config['database'] = $this->dbName;
			$conn = new DB\PgsqlConnection($config);
			try
			{
				$conn->queryExecute("CREATE EXTENSION IF NOT EXISTS pgcrypto");
			}
			catch (DB\SqlQueryException $e)
			{
				$this->SetError(str_replace("#DB#", $this->dbName, InstallGetMessage("ERR_CREATE_DB1")) . ' ' . $e);
				return false;
			}
		}

		if ($this->createDatabase || $this->createUser)
		{
			if ($this->createUser)
			{
				$createUser = "create user " . $conn->getSqlHelper()->quote($this->dbUser) . " with password '" . $conn->getSqlHelper()->forSql($this->dbPassword) . "'";
				try
				{
					$conn->queryExecute($createUser);
				}
				catch (DB\SqlQueryException $e)
				{
					$this->SetError(InstallGetMessage("ERR_CREATE_USER") . " " . $e->getDatabaseMessage());
					return false;
				}
			}

			$grantPrivileges = [
				"grant all privileges on database  " . $conn->getSqlHelper()->quote($this->dbName) . " to " . $conn->getSqlHelper()->quote($this->dbUser),
				"grant create on schema public to " . $conn->getSqlHelper()->quote($this->dbUser), //Start with Postgre15 requires explicit privilege
			];
			foreach ($grantPrivileges as $grant)
			{
				try
				{
					$conn->queryExecute($grant);
				}
				catch (DB\SqlQueryException $e)
				{
					$this->SetError(InstallGetMessage("ERR_GRANT_USER") . " " . $e->getDatabaseMessage());
					return false;
				}
			}
		}

		if (!$this->createDatabase)
		{
			$config['login'] = $this->dbUser;
			$config['password'] = $this->dbPassword;
			$config['database'] = $this->dbName;

			//Check pgcrypto extention
			$dbResult = $conn->query("select * from pg_available_extensions where name = 'pgcrypto' and installed_version is not null");
			if (!$dbResult->fetch())
			{
				$this->SetError(InstallGetMessage("SC_DB_PGSQL_PGCRYPTO_ER"));
				return false;
			}

			//Check database collation
			$dbResult = $conn->query("SELECT DATCTYPE FROM pg_database where datname='" . $conn->getSqlHelper()->forSql($this->dbName) . "'");
			$row = $dbResult->fetch();
			if (!preg_match('/\.(UTF-8|UTF8)$/i', $row['DATCTYPE']))
			{
				$this->SetError(InstallGetMessage("SC_DB_PGSQL_DATABASE_CTYPE_ER"));
				return false;
			}

			if (defined("DEBUG_MODE") || (isset($_COOKIE["clear_db"]) && $_COOKIE["clear_db"] == "Y"))
			{
				$conn = new DB\PgsqlConnection($config);
				try
				{
					$conn->query("
						DO \$\$
						DECLARE
							mytab RECORD;
							myfunc RECORD;
							myseq RECORD;
							myview RECORD;
						BEGIN
							FOR mytab IN (SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema = 'public')
							LOOP
								EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(mytab.table_name) || ' CASCADE';
								COMMIT;
							END LOOP;
							FOR myfunc IN (SELECT routine_name FROM information_schema.routines WHERE routine_type='FUNCTION' AND specific_schema='public' AND external_language in ('SQL', 'PLPGSQL'))
							LOOP
								EXECUTE format('DROP FUNCTION %I.%I', 'public', myfunc.routine_name);
							END LOOP;
							FOR myseq IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema='public')
							LOOP
								EXECUTE format('DROP SEQUENCE %I.%I', 'public', myseq.sequence_name);
							END LOOP;
							FOR myview IN (SELECT viewname FROM pg_catalog.pg_views WHERE schemaname='public')
							LOOP
								EXECUTE format('DROP VIEW %I.%I', 'public', myview.viewname);
							END LOOP;
						END
						\$\$
					");
				}
				catch (DB\SqlQueryException $e)
				{
					$this->SetError((string)$e);
					return false;
				}
			}
		}

		return true;
	}

	function CreateMySQL()
	{
		if (preg_match("/[\\x0\\xFF\\/\\\\.]/", $this->dbName) || preg_match("/\\s$/", $this->dbName) || strlen($this->dbName) > 64)
		{
			/*
			There are some restrictions on the characters that may appear in identifiers:
			No identifier can contain ASCII 0 (0x00) or a byte with a value of 255.
			Database, table, and column names should not end with space characters.
			Database and table names cannot contain "/", "\", ".", or characters that are not allowed in filenames.
			*/
			$this->SetError(InstallGetMessage("ERR_DATABASE_NAME"));
			return false;
		}

		$config = [
			'options' => 0,
			'host' => $this->dbHost,
		];
		if ($this->createDatabase || $this->createUser)
		{
			$config['login'] = $this->rootUser;
			$config['password'] = $this->rootPassword;
		}
		else
		{
			$config['login'] = $this->dbUser;
			$config['password'] = $this->dbPassword;
		}

		$conn = new DB\MysqliConnection($config);

		try
		{
			$conn->connect();
		}
		catch (DB\ConnectionException $e)
		{
			$this->SetError(InstallGetMessage("ERR_CONNECT2MYSQL") . " " . $e->getDatabaseMessage());
			return false;
		}

		$this->checkMysqlRequirements($conn);

		if ($this->GetErrors())
		{
			return false;
		}

		if ($this->createDatabase)
		{
			if ($conn->selectDatabase($this->dbName))
			{
				$this->SetError(str_replace("#DB#", $this->dbName, InstallGetMessage("ERR_EXISTS_DB1")));
				return false;
			}

			try
			{
				$conn->queryExecute("CREATE DATABASE " . $conn->getSqlHelper()->quote($this->dbName));
			}
			catch (DB\SqlQueryException $e)
			{
				$this->SetError(str_replace("#DB#", $this->dbName, InstallGetMessage("ERR_CREATE_DB1")) . " " . $e->getDatabaseMessage());
				return false;
			}

			if (!$conn->selectDatabase($this->dbName))
			{
				$this->SetError(str_replace("#DB#", $this->dbName, InstallGetMessage("ERR_CREATE_DB1")));
				return false;
			}
		}
		else
		{
			if (!$conn->selectDatabase($this->dbName))
			{
				$this->SetError(str_replace("#DB#", $this->dbName, InstallGetMessage("ERR_CONNECT_DB1")));
				return false;
			}

			if (defined("DEBUG_MODE") || (isset($_COOKIE["clear_db"]) && $_COOKIE["clear_db"] == "Y"))
			{
				$result = $conn->query("SHOW TABLES LIKE 'b_%'");
				while ($arTable = $result->fetch())
				{
					$conn->queryExecute("DROP TABLE " . reset($arTable));
				}
			}
		}

		if ($this->createDatabase || $this->createUser)
		{
			if ($this->createUser)
			{
				try
				{
					$conn->queryExecute("CREATE USER '" . addslashes($this->dbUser) . "'@'%' IDENTIFIED BY '" . addslashes($this->dbPassword) . "'");
				}
				catch (DB\SqlQueryException $e)
				{
					$this->SetError(InstallGetMessage("ERR_CREATE_USER") . " " . $e->getDatabaseMessage());
					return false;
				}
			}

			try
			{
				$conn->queryExecute("GRANT ALL PRIVILEGES ON `" . addslashes($this->dbName) . "`.* TO '" . addslashes($this->dbUser) . "'@'%'");
			}
			catch (DB\SqlQueryException $e)
			{
				$this->SetError(InstallGetMessage("ERR_GRANT_USER") . " " . $e->getDatabaseMessage());
				return false;
			}
		}

		try
		{
			$conn->queryExecute("ALTER DATABASE " . $conn->getSqlHelper()->quote($this->dbName) . " CHARACTER SET utf8mb4 COLLATE " . $this->collation);
		}
		catch (DB\SqlQueryException)
		{
			try
			{
				// MariaDB workaround
				$this->collation = 'utf8mb4_unicode_ci';
				$conn->queryExecute("ALTER DATABASE " . $conn->getSqlHelper()->quote($this->dbName) . " CHARACTER SET utf8mb4 COLLATE " . $this->collation);
			}
			catch (DB\SqlQueryException)
			{
				$this->SetError(InstallGetMessage("ERR_ALTER_DB"));
				return false;
			}
		}

		try
		{
			$conn->queryExecute("SET NAMES 'utf8mb4'");
		}
		catch (DB\SqlQueryException $e)
		{
			$this->SetError($e->getDatabaseMessage());
			return false;
		}

		return true;
	}

	public function checkMysqlRequirements(DB\Connection $conn)
	{
		//Check MySQL version
		$dbResult = $conn->query('select VERSION() as ver');
		if ($arVersion = $dbResult->fetch())
		{
			$mysqlVersion = trim($arVersion['ver']);
			if (!BXInstallServices::VersionCompare($mysqlVersion, self::MIN_MYSQL_VERSION))
			{
				$this->SetError(InstallGetMessage('ERR_DB_MIN_VERSION_MYSQL', ['#MIN_VERSION#' => self::MIN_MYSQL_VERSION]));
			}
		}

		//default_storage_engine
		try
		{
			$arResult = $conn->query('SELECT @@default_storage_engine')->fetch();
			if ($arResult)
			{
				if ($arResult['@@default_storage_engine'] !== 'InnoDB')
				{
					$this->SetError(InstallGetMessage('ERR_DB_MYSQL_DEFAULT_STORAGE_ENGINE', ['#VALUE#' => $arResult['@@default_storage_engine']]));
				}
			}
		}
		catch (DB\SqlQueryException)
		{
		}

		//innodb_large_prefix
		try
		{
			$arResult = $conn->query('SELECT @@innodb_large_prefix')->fetch();
			if ($arResult)
			{
				if ($arResult['@@innodb_large_prefix'] === '0' || $arResult['@@innodb_large_prefix'] === 'OFF')
				{
					$this->SetError(InstallGetMessage('ERR_DB_MYSQL_INNODB_LARGE_PREFIX', ['#VALUE#' => $arResult['@@innodb_large_prefix']]));
				}
			}
		}
		catch (DB\SqlQueryException)
		{
		}

		//innodb_default_row_format
		try
		{
			$arResult = $conn->query('SELECT @@innodb_default_row_format')->fetch();
			if ($arResult)
			{
				if (strtolower($arResult['@@innodb_default_row_format']) !== 'dynamic')
				{
					$this->SetError(InstallGetMessage('ERR_DB_MYSQL_INNODB_DEFAULT_ROW_FORMAT', ['#VALUE#' => $arResult['@@innodb_default_row_format']]));
				}
			}
		}
		catch (DB\SqlQueryException)
		{
		}

		//SQL mode
		$dbResult = $conn->query("SELECT @@sql_mode");
		if ($arResult = $dbResult->fetch())
		{
			$sqlMode = trim($arResult["@@sql_mode"]);
			if ($sqlMode <> "")
			{
				$this->sqlMode = "";
			}
		}
	}

	function createSettings($connectionParameters)
	{
		global $arWizardConfig;
		$filePath = $_SERVER["DOCUMENT_ROOT"] . "/bitrix/.settings.php";
		@umask(~(octdec($this->filePermission) | octdec($this->folderPermission)) & 0777);
		if (!BXInstallServices::CheckDirPath($filePath, octdec($this->folderPermission)))
		{
			$this->SetError(str_replace("#ROOT#", "/bitrix/", InstallGetMessage("ERR_C_SAVE_DBCONN")));
			return false;
		}

		$ar = [
			"cache_flags" => [
				"value" => [
					"config_options" => 3600,
				],
				"readonly" => false,
			],
		];

		$ar["cookies"] = ["value" => ["secure" => false, "http_only" => true], "readonly" => false];

		$ar["exception_handling"] = [
			"value" => [
				"debug" => (isset($arWizardConfig['debug']) && $arWizardConfig['debug'] === 'yes'),
				"handled_errors_types" => E_ERROR | E_PARSE | E_CORE_ERROR | E_COMPILE_ERROR | E_USER_ERROR | E_RECOVERABLE_ERROR,
				"exception_errors_types" => E_ERROR | E_PARSE | E_CORE_ERROR | E_COMPILE_ERROR | E_USER_ERROR | E_RECOVERABLE_ERROR,
				"ignore_silence" => false,
				"assertion_throws_exception" => true,
				"assertion_error_type" => E_USER_ERROR,
				"log" => (isset($arWizardConfig['error_log']) ? [
					'settings' => [
						'file' => $arWizardConfig['error_log'],
						'log_size' => 1000000,
					],
				] : null),
			],
			"readonly" => false,
		];

		$ar['connections']['value']['default'] = $connectionParameters;

		$ar['connections']['readonly'] = true;

		$ar["crypto"] = ["value" => ["crypto_key" => md5("some" . uniqid("", true))], "readonly" => true];

		if (!$fp = @fopen($filePath, "wb"))
		{
			$this->SetError(str_replace("#ROOT#", $_SERVER["DOCUMENT_ROOT"], InstallGetMessage("ERR_C_SAVE_DBCONN")));
			return false;
		}

		if (!fwrite($fp, "<" . "?php\n\rreturn " . var_export($ar, true) . ";\n"))
		{
			$this->SetError(str_replace("#ROOT#", $_SERVER["DOCUMENT_ROOT"], InstallGetMessage("ERR_C_SAVE_DBCONN")));
			return false;
		}

		@fclose($fp);
		if ($this->filePermission > 0)
		{
			@chmod($filePath, octdec($this->filePermission));
		}

		return true;
	}

	function CreateDBConn()
	{
		global $arWizardConfig;
		$filePath = $_SERVER["DOCUMENT_ROOT"] . BX_PERSONAL_ROOT . "/php_interface/dbconn.php";
		@umask(~(octdec($this->filePermission) | octdec($this->folderPermission)) & 0777);
		if (!BXInstallServices::CheckDirPath($filePath, octdec($this->folderPermission)))
		{
			$this->SetError(str_replace("#ROOT#", BX_PERSONAL_ROOT . "/", InstallGetMessage("ERR_C_SAVE_DBCONN")));
			return false;
		}

		// Various params
		$fileContent = "<" . "?php\n" .
			"$" . "DBDebug = " . (isset($arWizardConfig['debug']) && $arWizardConfig['debug'] === 'yes' ? 'true' : 'false') . ";\n" .
			"$" . "DBDebugToFile = false;\n" .
			"\n";

		$umask = [];
		if ($this->filePermission > 0)
		{
			$fileContent .= "define(\"BX_FILE_PERMISSIONS\", " . $this->filePermission . ");\n";
			$umask[] = "BX_FILE_PERMISSIONS";
		}

		if ($this->folderPermission > 0)
		{
			$fileContent .= "define(\"BX_DIR_PERMISSIONS\", " . $this->folderPermission . ");\n";
			$umask[] = "BX_DIR_PERMISSIONS";
		}

		if ($umask)
		{
			$fileContent .= "@umask(~(" . implode(" | ", $umask) . ") & 0777);\n";
		}

		if (file_exists($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/intranet"))
		{
			$fileContent .= "\n@ini_set(\"memory_limit\", \"1024M\");\n";
		}
		else
		{
			$memoryLimit = WelcomeStep::unformat(ini_get('memory_limit'));
			if (!$memoryLimit || $memoryLimit == '')
			{
				$memoryLimit = WelcomeStep::unformat(get_cfg_var('memory_limit'));
			}

			if ($memoryLimit > 0 && $memoryLimit < 256 * 1048576)
			{
				@ini_set("memory_limit", "512M");
				$memoryLimit = WelcomeStep::unformat(ini_get('memory_limit'));
				if ($memoryLimit >= 512 * 1048576)
				{
					$fileContent .= "\n@ini_set(\"memory_limit\", \"512M\");\n";
				}
			}
		}

		$fileContent .= "\ndefine(\"BX_DISABLE_INDEX_PAGE\", true);\n";

		$fileContent .= "\n" .
			"mb_internal_encoding(\"UTF-8\");\n";

		if (isset($arWizardConfig['debug_log']))
		{
			$fileContent .= "\n" .
				"define('LOG_FILENAME', '" . $arWizardConfig['debug_log'] . "');\n";
		}

		if (!$fp = @fopen($filePath, "wb"))
		{
			$this->SetError(str_replace("#ROOT#", $_SERVER["DOCUMENT_ROOT"], InstallGetMessage("ERR_C_SAVE_DBCONN")));
			return false;
		}

		if (!fwrite($fp, $fileContent))
		{
			$this->SetError(str_replace("#ROOT#", $_SERVER["DOCUMENT_ROOT"], InstallGetMessage("ERR_C_SAVE_DBCONN")));
			return false;
		}

		@fclose($fp);
		if ($this->filePermission > 0)
		{
			@chmod($filePath, octdec($this->filePermission));
		}

		return true;
	}

	function CreateAfterConnect()
	{
		$after_connNew = "<" . "?php\n" .
			($this->sqlMode !== false ? "$" . "this->queryExecute(\"SET sql_mode='{$this->sqlMode}'\");\n" : "") .
			"$" . "this->queryExecute(\"SET NAMES 'utf8mb4'\");\n" .
			"$" . "this->queryExecute(\"SET collation_connection = '{$this->collation}'\");\n";

		$filePathNew = $_SERVER["DOCUMENT_ROOT"] . BX_PERSONAL_ROOT . "/php_interface/after_connect_d7.php";

		if (!BXInstallServices::CheckDirPath($filePathNew, octdec($this->folderPermission)))
		{
			$this->SetError(str_replace("#ROOT#", BX_PERSONAL_ROOT . "/", InstallGetMessage("ERR_C_SAVE_DBCONN")));
			return false;
		}

		if (!$fp = @fopen($filePathNew, "wb"))
		{
			$this->SetError(str_replace("#ROOT#", $_SERVER["DOCUMENT_ROOT"], InstallGetMessage("ERR_C_SAVE_DBCONN")));
			return false;
		}

		if (!fwrite($fp, $after_connNew))
		{
			$this->SetError(str_replace("#ROOT#", $_SERVER["DOCUMENT_ROOT"], InstallGetMessage("ERR_C_SAVE_DBCONN")));
			return false;
		}

		@fclose($fp);
		if ($this->filePermission > 0)
		{
			@chmod($filePathNew, octdec($this->filePermission));
		}

		if (strtoupper(substr(PHP_OS, 0, 3)) === "WIN")
		{
			$fhtaccess = $_SERVER['DOCUMENT_ROOT'] . '/.htaccess';
			$f = fopen($fhtaccess, "rb");
			$fcontent = fread($f, filesize($fhtaccess));
			fclose($f);

			$fcontent = preg_replace('/RewriteEngine On/is', "RewriteEngine On\r\n\r\n" .
				"RewriteCond %{REQUEST_FILENAME} -f [OR]\r\n" .
				"RewriteCond %{REQUEST_FILENAME} -l [OR]\r\n" .
				"RewriteCond %{REQUEST_FILENAME} -d\r\n" .
				"RewriteCond %{REQUEST_FILENAME} [\\xC2-\\xDF][\\x80-\\xBF] [OR]\r\n" .
				"RewriteCond %{REQUEST_FILENAME} \\xE0[\\xA0-\\xBF][\\x80-\\xBF] [OR]\r\n" .
				"RewriteCond %{REQUEST_FILENAME} [\\xE1-\\xEC\\xEE\\xEF][\\x80-\\xBF]{2} [OR]\r\n" .
				"RewriteCond %{REQUEST_FILENAME} \\xED[\\x80-\\x9F][\\x80-\\xBF] [OR]\r\n" .
				"RewriteCond %{REQUEST_FILENAME} \\xF0[\\x90-\\xBF][\\x80-\\xBF]{2} [OR]\r\n" .
				"RewriteCond %{REQUEST_FILENAME} [\\xF1-\\xF3][\\x80-\\xBF]{3} [OR]\r\n" .
				"RewriteCond %{REQUEST_FILENAME} \\xF4[\\x80-\\x8F][\\x80-\\xBF]{2}\r\n" .
				"RewriteCond %{REQUEST_FILENAME} !/bitrix/virtual_file_system.php$\r\n" .
				"RewriteRule ^(.*)$ /bitrix/virtual_file_system.php [L]", $fcontent);

			$f = fopen($fhtaccess, "wb+");
			fwrite($f, $fcontent);
			fclose($f);
		}

		//Create .htaccess
		$filePath = $_SERVER["DOCUMENT_ROOT"] . BX_PERSONAL_ROOT . "/php_interface/.htaccess";
		if (file_exists($filePath))
		{
			return true;
		}

		if (!$fp = @fopen($filePath, "wb"))
		{
			$this->SetError(str_replace("#ROOT#", $_SERVER["DOCUMENT_ROOT"], InstallGetMessage("ERR_C_SAVE_DBCONN")));
			return false;
		}

		if (!fwrite($fp, "Deny From All"))
		{
			$this->SetError(str_replace("#ROOT#", $_SERVER["DOCUMENT_ROOT"], InstallGetMessage("ERR_C_SAVE_DBCONN")));
			return false;
		}

		@fclose($fp);
		if ($this->filePermission > 0)
		{
			@chmod($filePath, octdec($this->filePermission));
		}

		return true;
	}

	function CreateLicenseFile()
	{
		$wizard = $this->GetWizard();
		$licenseKey = $wizard->GetVar("license");

		if (!BXInstallServices::CreateLicenseFile($licenseKey))
		{
			return false;
		}

		$filePath = $_SERVER["DOCUMENT_ROOT"] . "/bitrix/license_key.php";
		if ($this->filePermission > 0)
		{
			@chmod($filePath, octdec($this->filePermission));
		}

		return true;
	}

	function CheckDBOperation()
	{
		if (!is_object($this->DB))
		{
			return false;
		}

		$DB =& $this->DB;
		$tableName = "b_tmp_bx";

		//Create table
		$strSql = "CREATE TABLE $tableName(ID INT)";
		$DB->Query($strSql, true);

		if ($DB->db_Error <> '')
		{
			$this->SetError(InstallGetMessage("ERR_C_CREATE_TBL"));
			return false;
		}

		//Alter table
		$strSql = "ALTER TABLE $tableName ADD COLUMN CLMN VARCHAR(100)";
		$DB->Query($strSql, true);

		if ($DB->db_Error <> '')
		{
			$this->SetError(InstallGetMessage("ERR_C_ALTER_TBL"));
			return false;
		}

		//Drop table
		$strSql = "DROP TABLE IF EXISTS $tableName";
		$DB->Query($strSql, true);

		if ($DB->db_Error <> '')
		{
			$this->SetError(InstallGetMessage("ERR_C_DROP_TBL"));
			return false;
		}

		return true;
	}

	function ShowStep()
	{
		$wizard = $this->GetWizard();

		$this->content .= '
		<table border="0" class="data-table">
			<tr>
				<td colspan="2" class="header">' . InstallGetMessage("INS_DATABASE_SETTINGS") . '</td>
			</tr>
			<tr>
				<td nowrap align="right" valign="top" width="40%" >
					<span style="color:red">*</span>&nbsp;' . InstallGetMessage("INS_HOST") . '
				</td>
				<td width="60%" valign="top">
					' . $this->ShowInputField("text", "host", ["size" => "30"]) . '
					<br /><small>' . InstallGetMessage("INS_HOST_DESCR") . '<br></small>
				</td>
			</tr>
			<tr>
				<td align="right" valign="top">' . InstallGetMessage("INS_CREATE_USER") . '</td>
				<td valign="top">
					' . $this->ShowRadioField("create_user", "N", ["id" => "create_user_N", "onclick" => "NeedRootUser()"]) . ' <label for="create_user_N">' . InstallGetMessage("INS_USER") . '</label><br>
					' . $this->ShowRadioField("create_user", "Y", ["id" => "create_user_Y", "onclick" => "NeedRootUser()"]) . ' <label for="create_user_Y">' . InstallGetMessage("INS_USER_NEW") . '</label>
				</td>
			</tr>
			<tr>
				<td nowrap align="right" valign="top"><span style="color:red">*</span>&nbsp;' . InstallGetMessage("INS_USERNAME") . '</td>
				<td valign="top">
					' . $this->ShowInputField("text", "user", ["size" => "30"]) . '<br />
					<small>' . InstallGetMessage("INS_USER_DESCR") . '<br></small>
				</td>
			</tr>
			<tr>
				<td nowrap align="right" valign="top">' . InstallGetMessage("INS_PASSWORD") . '</td>
				<td valign="top">
					' . $this->ShowInputField("password", "password", ["size" => "30"]) . '<br />
					<small>' . InstallGetMessage("INS_PASSWORD_DESCR") . '<br></small>
				</td>
			</tr>
			<tr>
				<td nowrap align="right" valign="top">' . InstallGetMessage("INS_CREATE_DB") . '</td>
				<td valign="top">
					' . $this->ShowRadioField("create_database", "N", ["id" => "create_db_N", "onclick" => "NeedRootUser()"]) . ' <label for=create_db_N>' . InstallGetMessage("INS_DB_EXISTS") . '</label><br>
					' . $this->ShowRadioField("create_database", "Y", ["id" => "create_db_Y", "onclick" => "NeedRootUser()"]) . ' <label for=create_db_Y>' . InstallGetMessage("INS_DB_NEW") . '</label>
				</td>
			</tr>
			<tr>
				<td nowrap align="right" valign="top">
					<div id="db_exists"><span style="color:red">*</span>' . InstallGetMessage("INS_DATABASE") . '</div>
					<div id="db_new" style="display:none"><span style="color:red">*</span>' . InstallGetMessage("INS_DATABASE_NEW") . '</div>
				</td>
				<td valign="top">
					' . $this->ShowInputField("text", "database", ["size" => "30"]) . '<br />
					<small>' . InstallGetMessage("INS_DATABASE_MY_DESC") . '<br></small>
				</td>
			</tr>
			<tr id="line1">
				<td colspan="2" class="header">' . InstallGetMessage("ADMIN_PARAMS") . '</td>
			</tr>
			<tr id="line2">
				<td nowrap align="right" valign="top">
					<span style="color:red">*</span>&nbsp;' . InstallGetMessage("INS_ROOT_USER") . '</td>
				<td valign="top">
					' . $this->ShowInputField("text", "root_user", ["size" => "30", "id" => "root_user"]) . '<br />
					<small>' . InstallGetMessage("INS_ROOT_USER_DESCR") . '<br></small>
				</td>
			</tr>
			<tr id="line3">
				<td nowrap align="right" valign="top">
					' . InstallGetMessage("INS_ROOT_PASSWORD") . '
				</td>
				<td valign="top">
					' . $this->ShowInputField("password", "root_password", ["size" => "30", "id" => "root_password"]) . '<br />
					<small>' . InstallGetMessage("INS_ROOT_PASSWORD_DESCR") . '<br></small>
				</td>
			</tr>
			<tr>
				<td colspan="2" class="header">' . InstallGetMessage("INS_ADDITIONAL_PARAMS") . '</td>
			</tr>
			<tr>
				<td nowrap align="right" width="40%" valign="top">' . InstallGetMessage("INS_AP_FAP") . ':</td>
				<td width="60%" valign="top">
					' . $this->ShowInputField("text", "file_access_perms", ["size" => "10"]) . '<br />
					<small>' . InstallGetMessage("INS_AP_FAP_DESCR") . '<br></small>
				</td>
			</tr>
			<tr>
				<td nowrap align="right" width="40%" valign="top">' . InstallGetMessage("INS_AP_PAP") . ':</td>
				<td width="60%" valign="top">
					' . $this->ShowInputField("text", "folder_access_perms", ["size" => "10"]) . '<br />
					<small>' . InstallGetMessage("INS_AP_PAP_DESCR") . '<br></small>
				</td>
			</tr>
		</table>
		<script>NeedRootUser();</script>';
	}
}

class CreateModulesStep extends CWizardStep
{
	var $arSteps = [];
	var $singleSteps = [];

	function InitStep()
	{
		$this->SetStepID("create_modules");
		$this->SetTitle(InstallGetMessage("INST_PRODUCT_INSTALL"));
	}

	function OnPostForm()
	{
		$wizard = $this->GetWizard();
		$currentStep = $wizard->GetVar("nextStep");
		$currentStepStage = $wizard->GetVar("nextStepStage");

		if ($currentStep == "__finish")
		{
			$wizard->SetCurrentStep("create_admin");
			return;
		}

		$this->singleSteps = [
			"remove_misc" => InstallGetMessage("INST_REMOVE_TEMP_FILES"),
		];

		$this->arSteps = array_merge($this->GetModuleList(), array_keys($this->singleSteps));

		$arSkipInstallModules = [];
		if ($GLOBALS["arWizardConfig"]["skipInstallModules"] != '')
		{
			$arSkipInstallModules = preg_split('/[\s,]+/', $GLOBALS["arWizardConfig"]["skipInstallModules"], -1, PREG_SPLIT_NO_EMPTY);
		}

		$searchIndex = in_array($currentStep, $this->arSteps);
		if ($searchIndex === false)
		{
			$currentStep = "main";
		}

		if (array_key_exists($currentStep, $this->singleSteps) && $currentStepStage != "skip")
		{
			$success = $this->InstallSingleStep($currentStep);
		}
		else
		{
			if (in_array($currentStep, $arSkipInstallModules))
			{
				$success = true;
			}
			else
			{
				$success = $this->InstallModule($currentStep, $currentStepStage);
			}
		}

		if ($currentStep == "main" && $success === false)
		{
			$this->SendResponse("window.onbeforeunload = null; window.ajaxForm.StopAjax(); window.ajaxForm.SetStatus('0', '" . InstallGetMessage("INST_MAIN_INSTALL_ERROR") . "');");
		}

		[$nextStep, $nextStepStage, $percent, $status] = $this->GetNextStep($currentStep, $currentStepStage, $success);

		$response = "";
		if ($nextStep == "__finish")
		{
			$response .= "window.onbeforeunload = null; window.ajaxForm.StopAjax();";
		}
		$response .= "window.ajaxForm.SetStatus('" . $percent . "'); window.ajaxForm.Post('" . $nextStep . "', '" . $nextStepStage . "','" . $status . "');";

		$this->SendResponse($response);
	}

	function SendResponse($response)
	{
		header("Content-Type: text/html; charset=UTF-8");
		die("[response]" . $response . "[/response]");
	}

	function GetModuleList()
	{
		$arModules = [];

		$handle = @opendir($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules");
		if (!$handle)
		{
			return $arModules;
		}

		while (false !== ($dir = readdir($handle)))
		{
			$module_dir = $_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/" . $dir;
			if (is_dir($module_dir) && $dir != "." && $dir != ".." && $dir != "main" && file_exists($module_dir . "/install/index.php"))
			{
				$arModules[] = $dir;
			}
		}
		closedir($handle);

		uasort($arModules, function ($a, $b) {
			return strcasecmp($a, $b);
		});
		array_unshift($arModules, "main");

		return $arModules;
	}

	function GetNextStep($currentStep, $currentStepStage, $stepSuccess)
	{
		//Next step and next stage
		$stepIndex = array_search($currentStep, $this->arSteps);

		if ($currentStepStage == "database" && $stepSuccess)
		{
			$nextStep = $currentStep;
			$nextStepStage = "files";
		}
		else
		{
			if (!isset($this->arSteps[$stepIndex + 1]))
			{
				return ["__finish", "", 100, InstallGetMessage("INST_INSTALL_COMPLETE")];
			}

			$nextStep = $this->arSteps[$stepIndex + 1];

			if (array_key_exists($nextStep, $this->singleSteps))
			{
				$nextStepStage = "single";
			}
			else
			{
				$nextStepStage = "database";
			}
		}

		//Percent
		$singleSteps = count($this->singleSteps);
		$moduleSteps = count($this->arSteps) - $singleSteps;
		$moduleStageCnt = 2; // Each module has 2 steps

		$stepCount = $moduleSteps * $moduleStageCnt + $singleSteps;

		if ($currentStepStage == "files" || ($currentStepStage == "skip" && !array_key_exists($currentStep, $this->singleSteps)))
		{
			$completeSteps = ++$stepIndex * $moduleStageCnt;
		}
		elseif ($currentStepStage == "database")
		{
			$completeSteps = ++$stepIndex * $moduleStageCnt - 1;
		}
		else
		{
			$completeSteps = $moduleSteps * $moduleStageCnt + ($stepIndex + 1 - $moduleSteps);
		}

		$percent = floor($completeSteps / $stepCount * 100);

		//Status
		$arStatus = [
			"database" => InstallGetMessage("INST_INSTALL_DATABASE"),
			"files" => InstallGetMessage("INST_INSTALL_FILES"),
		];

		if (array_key_exists($nextStep, $this->singleSteps))
		{
			$status = $this->singleSteps[$nextStep];
		}
		elseif ($nextStep == "main")
		{
			$status = InstallGetMessage("INST_MAIN_MODULE") . " (" . $arStatus[$nextStepStage] . ")";
		}
		else
		{
			$module = $this->GetModuleObject($nextStep);
			$moduleName = (is_object($module) ? $module->MODULE_NAME : $nextStep);

			$status = InstallGetMessage("INST_INSTALL_MODULE") . " &quot;" . $moduleName . "&quot; (" . $arStatus[$nextStepStage] . ")";
		}

		return [$nextStep, $nextStepStage, $percent, $status];
	}

	function InstallSingleStep($code)
	{
		if ($code == "remove_misc")
		{
			BXInstallServices::DeleteDirRec($_SERVER["DOCUMENT_ROOT"] . "/bitrix/httest");
			BXInstallServices::DeleteDirRec($_SERVER["DOCUMENT_ROOT"] . "/bxtest");
		}

		return true;
	}

	function GetModuleObject($moduleID)
	{
		if (!class_exists('CModule'))
		{
			global $DB, $DBHost, $DBLogin, $DBPassword, $DBName, $DBDebug, $DBDebugToFile, $APPLICATION, $USER;
			require_once($_SERVER['DOCUMENT_ROOT'] . "/bitrix/modules/main/include.php");
		}

		$installFile = $_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/" . $moduleID . "/install/index.php";
		if (!file_exists($installFile))
		{
			return false;
		}
		include_once($installFile);

		$moduleIDTmp = str_replace(".", "_", $moduleID);
		if (!class_exists($moduleIDTmp))
		{
			return false;
		}

		return new $moduleIDTmp;
	}

	function InstallModule($moduleID, $currentStepStage)
	{
		global $DB, $DBHost, $DBLogin, $DBPassword, $DBName, $DBDebug, $DBDebugToFile, $APPLICATION, $USER;

		if ($moduleID == "main")
		{
			require_once($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/start.php");
		}
		else
		{
			require_once($_SERVER['DOCUMENT_ROOT'] . "/bitrix/modules/main/include.php");
			if (IsModuleInstalled($moduleID) && $currentStepStage == "database")
			{
				return true;
			}
		}

		@set_time_limit(3600);

		$module = $this->GetModuleObject($moduleID);
		if (!is_object($module))
		{
			return true;
		}

		if ($currentStepStage == "skip")
		{
			return true;
		}
		elseif ($currentStepStage == "database")
		{
			$DBDebug = true;
			if (class_exists('\Dev\Main\Migrator\ModuleUpdater'))
			{
				\Dev\Main\Migrator\ModuleUpdater::checkUpdates($moduleID, $_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/" . $moduleID, false);
			}
			if (!$module->InstallDB())
			{
				if ($ex = $APPLICATION->GetException())
				{
					BXInstallServices::Add2Log($ex->GetString(), "DATABASE_ERROR");
				}
				return false;
			}

			$module->InstallEvents();

			if ($moduleID == "main")
			{
				
				
			}

			// set additional options from install.config
			if (!empty($GLOBALS['arWizardConfig']['options'][$moduleID]['option']))
			{
				foreach ($GLOBALS['arWizardConfig']['options'][$moduleID]['option'] as $option)
				{
					if (!empty($option['name']) && !empty($option['value']))
					{
						\Bitrix\Main\Config\Option::set($moduleID, $option['name'], $option['value']);
					}
				}
			}
		}
		elseif ($currentStepStage == "files")
		{
			if (!$module->InstallFiles())
			{
				if ($ex = $APPLICATION->GetException())
				{
					BXInstallServices::Add2Log($ex->GetString(), "FILES_ERROR");
				}
				return false;
			}
		}

		return true;
	}

	function ShowStep()
	{
		@include($_SERVER["DOCUMENT_ROOT"] . BX_PERSONAL_ROOT . "/php_interface/dbconn.php");

		$this->content .= '
		<div class="instal-load-block" id="result">
			<div class="instal-load-label" id="status"></div>
			<div class="instal-progress-bar-outer" style="width: 670px;">
				<div class="instal-progress-bar-alignment">
					<div class="instal-progress-bar-inner" id="indicator">
						<div class="instal-progress-bar-inner-text" style="width: 670px;" id="percent"></div>
					</div>
					<span id="percent2">0%</span>
				</div>
			</div>
		</div>
		<div id="error_container" style="display:none">
			<div id="error_notice">
				<div class="inst-note-block inst-note-block-red">
					<div class="inst-note-block-icon"></div>
					<div class="inst-note-block-label">' . InstallGetMessage("INST_ERROR_OCCURED") . '</div><br style="clear:both" />
					<div class="inst-note-block-text">' . InstallGetMessage("INST_ERROR_NOTICE") . '<div id="error_text"></div></div>
				</div>
			</div>

			<div id="error_buttons" align="center">
			<br /><input type="button" value="' . InstallGetMessage("INST_RETRY_BUTTON") . '" id="error_retry_button" onclick="" class="instal-btn instal-btn-inp" />&nbsp;<input type="button" id="error_skip_button" value="' . InstallGetMessage("INST_SKIP_BUTTON") . '" onclick="" class="instal-btn instal-btn-inp" />&nbsp;</div>
		</div>

		' . $this->ShowHiddenField("nextStep", "main") . '
		' . $this->ShowHiddenField("nextStepStage", "database") . '
		<iframe style="display:none;" id="iframe-post-form" name="iframe-post-form" src="javascript:\'\'"></iframe>
		';

		$wizard = $this->GetWizard();

		$formName = $wizard->GetFormName();
		$NextStepVarName = $wizard->GetRealName("nextStep");

		$this->content .= '
			<script>
				var ajaxForm = new CAjaxForm("' . $formName . '", "iframe-post-form", "' . $NextStepVarName . '");
				ajaxForm.Post("main", "database", "' . InstallGetMessage("INST_MAIN_MODULE") . ' (' . InstallGetMessage("INST_INSTALL_DATABASE") . ')");
			</script>
		';
	}
}

class CreateAdminStep extends CWizardStep
{
	function InitStep()
	{
		$this->SetStepID("create_admin");
		$this->SetNextStep("select_wizard");
		$this->SetNextCaption(InstallGetMessage("NEXT_BUTTON"));
		$this->SetTitle(InstallGetMessage("INST_CREATE_ADMIN"));

		$wizard = $this->GetWizard();
		$wizard->SetDefaultVar("login", "admin");
		$wizard->SetDefaultVar("email", "");

		if ($_SERVER['BITRIX_ENV_TYPE'] == "crm")
		{
			$wizard->SetDefaultVar("lic_key_variant", "Y");
		}
	}

	function OnPostForm()
	{
		global $DB, $DBHost, $DBLogin, $DBPassword, $DBName, $DBDebug, $DBDebugToFile, $APPLICATION, $USER;
		require_once($_SERVER['DOCUMENT_ROOT'] . "/bitrix/modules/main/include.php");

		$wizard = $this->GetWizard();

		$email = $wizard->GetVar("email");
		$login = $wizard->GetVar("login");
		$adminPass = $wizard->GetVar("admin_password");
		$adminPassConfirm = $wizard->GetVar("admin_password_confirm");
		$userName = $wizard->GetVar("user_name");
		$userSurname = $wizard->GetVar("user_surname");

		if ($email == '')
		{
			$this->SetError(InstallGetMessage("INS_FORGOT_EMAIL"));
			return false;
		}
		elseif (!check_email($email))
		{
			$this->SetError(InstallGetMessage("INS_WRONG_EMAIL"));
			return false;
		}

		if ($login == '')
		{
			$this->SetError(InstallGetMessage("INS_FORGOT_LOGIN"));
			return false;
		}
		elseif (strlen($login) < 3)
		{
			$this->SetError(InstallGetMessage("INS_LOGIN_MIN"));
			return false;
		}

		if ($adminPass == '')
		{
			$this->SetError(InstallGetMessage("INS_FORGOT_PASSWORD"));
			return false;
		}
		elseif (strlen($adminPass) < 6)
		{
			$this->SetError(InstallGetMessage("INS_PASSWORD_MIN"));
			return false;
		}
		elseif ($adminPass != $adminPassConfirm)
		{
			$this->SetError(InstallGetMessage("INS_WRONG_CONFIRM"));
			return false;
		}

		if ($_SERVER['BITRIX_ENV_TYPE'] == "crm")
		{
			if (trim($userName) == '')
			{
				$this->SetError(InstallGetMessage("ACT_KEY_BAD_NAME"), "user_name");
				return false;
			}
			if (trim($userSurname) == '')
			{
				$this->SetError(InstallGetMessage("ACT_KEY_BAD_LAST_NAME"), "user_surname");
				return false;
			}
		}

		$admin = $DB->Query("SELECT * FROM b_user WHERE ID=1", true);
		if ($admin === false)
		{
			return false;
		}

		$isAdminExists = (bool)$admin->Fetch();

		$arFields = [
			"NAME" => $userName,
			"LAST_NAME" => $userSurname,
			"EMAIL" => $email,
			"LOGIN" => $login,
			"ACTIVE" => "Y",
			"GROUP_ID" => ["1"],
			"PASSWORD" => $adminPass,
			"CONFIRM_PASSWORD" => $adminPassConfirm,
		];

		if ($isAdminExists)
		{
			$userID = 1;
			$success = $USER->Update($userID, $arFields);
		}
		else
		{
			$userID = $USER->Add($arFields);
			$success = (intval($userID) > 0);
		}

		if (!$success)
		{
			$this->SetError($USER->LAST_ERROR);
			return false;
		}

		COption::SetOptionString("main", "email_from", $email);

		$USER->Authorize($userID, true);

		if (!file_exists($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/intranet") && !defined("FIRST_EDITION"))
		{
			RegisterModuleDependences('main', 'OnBeforeProlog', 'main', 'CWizardSolPanel', 'ShowPanel', 100, '/modules/main/install/wizard_sol/panel_button.php');
		}

		$devsrv = $wizard->GetVar("devsrv");
		if ($devsrv == "Y")
		{
			COption::SetOptionString("main", "update_devsrv", $devsrv);
		}

		if ($_SERVER['BITRIX_ENV_TYPE'] == "crm")
		{
			if ($wizard->GetVar("lic_key_variant") == "Y")
			{
				$key = BXInstallServices::GetRegistrationKey($userName, $userSurname, $email, 'mysql');
				if ($key !== false)
				{
					BXInstallServices::CreateLicenseFile($key);
				}
			}
		}

		$wizardName = BXInstallServices::GetConfigWizard();
		if ($wizardName === false)
		{
			$arWizardsList = BXInstallServices::GetWizardsList();
			if (empty($arWizardsList))
			{
				$wizardName = BXInstallServices::GetDemoWizard();
			}
		}
		if ($wizardName !== false)
		{
			if (BXInstallServices::CreateWizardIndex($wizardName, $errorMessageTmp))
			{
				BXInstallServices::DeleteDirRec($_SERVER["DOCUMENT_ROOT"] . "/readme.php");
				BXInstallServices::DeleteDirRec($_SERVER["DOCUMENT_ROOT"] . "/readme.html");
				BXInstallServices::DeleteDirRec($_SERVER["DOCUMENT_ROOT"] . "/install.config");
				BXInstallServices::DeleteDirRec($_SERVER["DOCUMENT_ROOT"] . "/restore.php");
				BXInstallServices::DeleteDirRec($_SERVER["DOCUMENT_ROOT"] . "/bitrixsetup.php");

				BXInstallServices::LocalRedirect("/index.php");
			}
			else
			{
				$this->SetError($errorMessageTmp);
			}
		}

		return true;
	}

	function ShowStep()
	{
		$crm = ($_SERVER['BITRIX_ENV_TYPE'] == "crm");

		$this->content = '
		<table border="0" class="data-table">
			<tr>
				<td colspan="2" class="header">' . InstallGetMessage("INS_ADMIN_SETTINGS") . '</td>
			</tr>
			<tr>
				<td nowrap align="right" ><span style="color:red">*</span>&nbsp;' . InstallGetMessage("INS_LOGIN") . '</td>
				<td >' . $this->ShowInputField("text", "login", ["size" => "30"]) . '</td>
			</tr>
			<tr>
				<td nowrap align="right"><span style="color:red">*</span>&nbsp;' . InstallGetMessage("INS_ADMIN_PASSWORD") . '</td>
				<td >' . $this->ShowInputField("password", "admin_password", ["size" => "30"]) . '</td>
			</tr>
			<tr>
				<td nowrap align="right"><span style="color:red">*</span>&nbsp;' . InstallGetMessage("INS_PASSWORD_CONF") . '</td>
				<td>' . $this->ShowInputField("password", "admin_password_confirm", ["size" => "30"]) . '</td>
			</tr>
			<tr>
				<td nowrap align="right"><span style="color:red">*</span>&nbsp;' . InstallGetMessage("INS_EMAIL") . '</td>
				<td>' . $this->ShowInputField("text", "email", ["size" => "30"]) . '</td>
			</tr>
			<tr>
				<td nowrap align="right">' . ($crm ? '<span style="color:red">*</span>' : '') . InstallGetMessage("INS_NAME") . '</td>
				<td>' . $this->ShowInputField("text", "user_name", ["size" => "30"]) . '</td>
			</tr>
			<tr>
				<td nowrap align="right">' . ($crm ? '<span style="color:red">*</span>' : '') . InstallGetMessage("INS_LAST_NAME") . '</td>
				<td>' . $this->ShowInputField("text", "user_surname", ["size" => "30"]) . '</td>
			</tr>';
		if ($crm)
		{
			$this->content .= '<tr><td colspan="2"><label>' . $this->ShowCheckboxField("lic_key_variant", "Y") . InstallGetMessage("ACT_KEY") . '</label></td></tr>';
		}
		$this->content .= '
		</table>';
	}
}

class SelectWizardStep extends CWizardStep
{
	function InitStep()
	{
		$this->SetStepID("select_wizard");
		$this->SetNextStep("finish");
		$this->SetNextCaption(InstallGetMessage("NEXT_BUTTON"));
		$this->SetTitle(InstallGetMessage("INST_SELECT_WIZARD"));
	}

	function OnPostForm()
	{
		global $DB, $DBHost, $DBLogin, $DBPassword, $DBName, $DBDebug, $DBDebugToFile, $APPLICATION, $USER;

		require_once($_SERVER['DOCUMENT_ROOT'] . "/bitrix/modules/main/include.php");

		$wizard = $this->GetWizard();
		$selectedWizard = $wizard->GetVar("selected_wizard");

		if ($selectedWizard == '')
		{
			$this->SetError(InstallGetMessage("INS_WRONG_WIZARD"));
			return null;
		}

		if ($selectedWizard == "@")
		{
			$wizard->SetCurrentStep("load_module");
			return true;
		}

		$arTmp = explode(":", $selectedWizard);
		$ar = [];
		foreach ($arTmp as $a)
		{
			$a = preg_replace("#[^a-z0-9_.-]+#i", "", $a);
			if ($a <> '')
			{
				$ar[] = $a;
			}
		}

		if (count($ar) > 2)
		{
			$path = $_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/" . $ar[0] . "/install/wizards/" . $ar[1] . "/" . $ar[2];

			if (!file_exists($path) || !is_dir($path))
			{
				$this->SetError(InstallGetMessage("INS_WIZARD_NOT_FOUND"));
				return null;
			}

			BXInstallServices::CopyDirFiles(
				$_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/" . $ar[0] . "/install/wizards/" . $ar[1] . "/" . $ar[2],
				$_SERVER["DOCUMENT_ROOT"] . "/bitrix/wizards/" . $ar[1] . "/" . $ar[2]
			);

			$ar = [$ar[1], $ar[2]];
		}

		if (!file_exists($_SERVER["DOCUMENT_ROOT"] . "/bitrix/wizards/" . $ar[0] . "/" . $ar[1])
			|| !is_dir($_SERVER["DOCUMENT_ROOT"] . "/bitrix/wizards/" . $ar[0] . "/" . $ar[1]))
		{
			$this->SetError(InstallGetMessage("INS_WIZARD_NOT_FOUND"));
			return null;
		}

		if (BXInstallServices::CreateWizardIndex($ar[0] . ":" . $ar[1], $errorMessageTmp))
		{
			$u = "/index.php";
			if (defined("WIZARD_DEFAULT_SITE_ID"))
			{
				$rsSite = CSite::GetList("sort", "asc", ["ID" => WIZARD_DEFAULT_SITE_ID]);
				$arSite = $rsSite->GetNext();

				$u = "";
				if (is_array($arSite["DOMAINS"]) && $arSite["DOMAINS"][0] <> '' || $arSite["DOMAINS"] <> '')
				{
					$u .= "http://";
				}
				if (is_array($arSite["DOMAINS"]))
				{
					$u .= $arSite["DOMAINS"][0];
				}
				else
				{
					$u .= $arSite["DOMAINS"];
				}
				$u .= $arSite["DIR"];
			}
			else
			{
				BXInstallServices::DeleteDirRec($_SERVER["DOCUMENT_ROOT"] . "/readme.php");
				BXInstallServices::DeleteDirRec($_SERVER["DOCUMENT_ROOT"] . "/readme.html");
				BXInstallServices::DeleteDirRec($_SERVER["DOCUMENT_ROOT"] . "/install.config");
				BXInstallServices::DeleteDirRec($_SERVER["DOCUMENT_ROOT"] . "/restore.php");
				BXInstallServices::DeleteDirRec($_SERVER["DOCUMENT_ROOT"] . "/bitrixsetup.php");
			}

			BXInstallServices::LocalRedirect($u);
		}
		else
		{
			$this->SetError($errorMessageTmp);
		}

		return true;
	}

	function ShowStep()
	{
		$wizard = $this->GetWizard();
		$prefixName = $wizard->GetRealName("selected_wizard");

		$arWizardsList = BXInstallServices::GetWizardsList();

		$this->content = '
		<script>
			function SelectSolution(element, solutionId)
			{
				var hidden = document.getElementById("id_' . CUtil::JSEscape($prefixName) . '");
				hidden.value = solutionId;
				document.getElementById("id_radio_"+solutionId).checked=true;
			}
		</script>
		';

		$arWizardsList[] = [
			"ID" => "@",
			"IMAGE" => "/bitrix/images/install/marketplace.gif",
			"NAME" => InstallGetMessage("INS_LOAD_FROM_MARKETPLACE"),
			"DESCRIPTION" => InstallGetMessage("INS_LOAD_FROM_MARKETPLACE_DESCR"),
		];

		$this->content .= '<table class="inst-module-table" id="solutions-container">';
		$i = 0;
		foreach ($arWizardsList as $w)
		{
			if ($i == 0)
			{
				$this->content .= '<tr>';
			}
			$this->content .= '
				<td class="inst-module-cell">
					<div class="inst-module-block" onclick="SelectSolution(this, \'' . htmlspecialcharsbx($w["ID"]) . '\');" ondblclick="document.forms[\'' . htmlspecialcharsbx($wizard->GetFormName()) . '\'].submit();">
							<div class="inst-module-title"><span class="inst-module-title-alignment"></span><span class="inst-module-title-text">' . $w["NAME"] . '</span></div>
							<div class="inst-module-cont">
								' . ($w["IMAGE"] <> '' ? '<div class="inst-module-img"><img alt="" src="' . htmlspecialcharsbx($w["IMAGE"]) . '" /></div>' : "") . '
								<div class="inst-module-text">' . $w["DESCRIPTION"] . '</div>
							</div>
							<input type="radio" id="id_radio_' . htmlspecialcharsbx($w["ID"]) . '" name="redio" class="inst-module-checkbox" />
					</div>
				</td>';

			if ($i == 1)
			{
				$this->content .= '</tr>';
				$i = 0;
			}
			else
			{
				$i++;
			}
		}
		if ($i == 0)
		{
			$this->content .= '<td></td></tr>';
		}
		$this->content .= '</table>
		<input type="hidden" id="id_' . htmlspecialcharsbx($prefixName) . '" name="' . htmlspecialcharsbx($prefixName) . '" value="">';
	}
}

class LoadModuleStep extends CWizardStep
{
	function InitStep()
	{
		$this->SetStepID("load_module");
		$this->SetNextStep("select_wizard1");
		$this->SetNextCaption(InstallGetMessage("NEXT_BUTTON"));
		$this->SetTitle(InstallGetMessage("INS_MODULE_LOADING"));
	}

	function OnPostForm()
	{
		global $DB, $DBHost, $DBLogin, $DBPassword, $DBName, $DBDebug, $DBDebugToFile, $APPLICATION, $USER;
		require_once($_SERVER['DOCUMENT_ROOT'] . "/bitrix/modules/main/include.php");
		require_once($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/classes/general/update_client_partner.php");

		@set_time_limit(3600);

		$wizard = $this->GetWizard();
		$selectedModule = $wizard->GetVar("selected_module");
		$selectedModule = preg_replace("#[^a-z0-9._-]#i", "", $selectedModule);
		$coupon = $wizard->GetVar("coupon");
		$wizard->SetVar("MP_ACT_OK", "");

		if ($coupon <> '')
		{
			if (CUpdateClientPartner::ActivateCoupon($coupon, $error))
			{
				$wizard->SetVar("MP_ACT_OK", "OK");
			}
			else
			{
				$this->SetError(GetMessage("MP_COUPON_ACT_ERROR") . ": " . $error);
			}

			$wizard->SetCurrentStep("load_module");
			return null;
		}

		if ($selectedModule == '')
		{
			$wizard->SetCurrentStep("select_wizard");
			return true;
		}

		//CUtil::InitJSCore(array('window'));
		$wizard->SetVar("nextStepStage", $selectedModule);
		$wizard->SetCurrentStep("load_module_action");

		return true;
	}

	function GetModuleObject($moduleID)
	{
		$installFile = $_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/" . $moduleID . "/install/index.php";
		if (!file_exists($installFile))
		{
			return false;
		}

		@include_once($installFile);
		$moduleIDTmp = str_replace(".", "_", $moduleID);
		if (!class_exists($moduleIDTmp))
		{
			return false;
		}

		return new $moduleIDTmp;
	}

	function ShowStep()
	{
		$wizard = $this->GetWizard();
		$prefixName = $wizard->GetRealName("selected_module");
		$couponName = $wizard->GetRealName("coupon");

		$arModulesList = [];

		require_once($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/classes/general/update_client_partner.php");

		$arModules = CUpdateClientPartner::SearchModulesEx(
			["SORT" => "DESC", "NAME" => "ASC"],
			["CATEGORY" => [7, 14]],
			1,
			LANGUAGE_ID,
			$errorMessage
		);
		if (is_array($arModules) && is_array($arModules["ERROR"]))
		{
			foreach ($arModules["ERROR"] as $e)
			{
				$errorMessage .= $e["#"] . ". ";
			}
		}

		if (is_array($arModules) && is_array($arModules["MODULE"]))
		{
			foreach ($arModules["MODULE"] as $module)
			{
				$arModulesList[] = [
					"ID" => $module["@"]["ID"],
					"NAME" => $module["@"]["NAME"],
					"DESCRIPTION" => $module["@"]["DESCRIPTION"],
					"IMAGE" => $module["@"]["IMAGE"],
					"IMAGE_HEIGHT" => $module["@"]["IMAGE_HEIGHT"],
					"IMAGE_WIDTH" => $module["@"]["IMAGE_WIDTH"],
					"VERSION" => $module["@"]["VERSION"],
					"BUYED" => $module["@"]["BUYED"],
					"LINK" => "https://marketplace.1c-bitrix.ru/solutions/" . $module["@"]["ID"] . "/",
				];
			}
		}

		if ($errorMessage <> '')
		{
			$this->SetError($errorMessage);
		}

		$this->content .= '
		<script>
			function SelectSolutionMP(element, solutionId)
			{
				var hidden = document.getElementById("id_' . CUtil::JSEscape($prefixName) . '");
				hidden.value = solutionId;

				var container = document.getElementById("solutions-container");
				var anchors = container.getElementsByTagName("TD");
				for (var i = 0; i < anchors.length; i++)
				{
					anchors[i].className = "inst-module-cell";
				}

				element.parentNode.className = "inst-module-cell inst-module-cell-active";

				document.getElementById("id_radio_"+solutionId).checked=true;
			}
		</script>
		';

		$license = Application::getInstance()->getLicense();

		if (!$license->isDemoKey() && !$license->isDemo())
		{
			$actRes = $wizard->GetVar("MP_ACT_OK");
			if ($actRes == "OK")
			{
				$this->content .= '<div class="inst-note-block inst-note-block-blue">
						<div class="inst-note-block-icon"></div>
						<div class="inst-note-block-text">' . GetMessage("MP_COUPON_ACTIVATION_OK") . '</div>
					</div>';
			}
			$this->content .= '
				<div class="inst-discount-pass">
					<span class="inst-discount-label">' . GetMessage("MP_COUPON") . ':</span><input type="text" name="' . $couponName . '" value="" class="inst-discount-inp"><span class="instal-btn inst-btn-discount" onclick="document.forms[\'' . htmlspecialcharsbx($wizard->GetFormName()) . '\'].submit();">' . GetMessage("MP_ACTIVATE") . '</span>
				</div>';
		}

		$arModulesList[] = [
			"ID" => "",
			"IMAGE" => "",
			"NAME" => InstallGetMessage("INS_SKIP_MODULE_LOADING"),
			"DESCRIPTION" => InstallGetMessage("INS_SKIP_MODULE_LOADING_DESCR"),
		];

		$this->content .= '<table class="inst-module-table" id="solutions-container">';

		$arCurrentModules = CUpdateClientPartner::GetCurrentModules($errorMessage);

		$i = 0;
		foreach ($arModulesList as $m)
		{
			if ($i == 0)
			{
				$this->content .= '<tr>';
			}

			$bLoaded = array_key_exists($m["ID"], $arCurrentModules);

			$this->content .= '
				<td class="inst-module-cell">
					<div class="inst-module-block" onclick="' . 'SelectSolutionMP(this, \'' . htmlspecialcharsbx($m["ID"]) . '\');" ondblclick="' . ($bLoaded ? 'return false;' : 'document.forms[\'' . htmlspecialcharsbx($wizard->GetFormName()) . '\'].submit();') . '">
							<div class="inst-module-title"><span class="inst-module-title-alignment"></span><span class="inst-module-title-text">' . TruncateText($m["NAME"], 59) . '</span></div>
							<div class="inst-module-cont">
								' . ($m["IMAGE"] <> '' ? '<div class="inst-module-img-mp"><img alt="" src="' . htmlspecialcharsbx($m["IMAGE"]) . '" /></div>' : "") . '
								<div class="inst-module-text-mp">' .
				(isset($m["BUYED"]) && $m["BUYED"] == "Y" ? '<b>' . InstallGetMessage("INS_MODULE_IS_BUYED") . '</b><br />' : '') .
				($bLoaded ? '<b>' . InstallGetMessage("INS_MODULE_IS_ALREADY_LOADED") . '</b><br />' : '') .
				TruncateText($m["DESCRIPTION"], 90) . '</div>
							</div>' .
				(!empty($m["LINK"]) ? '<div class="inst-module-footer"><a class="inst-module-more" href="' . $m["LINK"] . '" target="_blank">' . GetMessage("MP_MORE") . '</a></div>' : '') . '
							<input type="radio" id="id_radio_' . htmlspecialcharsbx($m["ID"]) . '" name="redio" class="inst-module-checkbox" />
					</div>
				</td>';

			if ($i == 1)
			{
				$this->content .= '</tr>';
				$i = 0;
			}
			else
			{
				$i++;
			}
		}
		if ($i == 0)
		{
			$this->content .= '<td></td></tr>';
		}

		$this->content .= '</table>
		<input type="hidden" id="id_' . htmlspecialcharsbx($prefixName) . '" name="' . htmlspecialcharsbx($prefixName) . '" value="">';
	}
}

class LoadModuleActionStep extends CWizardStep
{
	var $arSteps = [];
	var $singleSteps = [];

	function InitStep()
	{
		$this->SetStepID("load_module_action");
		$this->SetTitle(InstallGetMessage("INS_MODULE_LOADING1"));
	}

	function OnPostForm()
	{
		global $DB, $DBHost, $DBLogin, $DBPassword, $DBName, $DBDebug, $DBDebugToFile, $APPLICATION, $USER;
		require_once($_SERVER['DOCUMENT_ROOT'] . "/bitrix/modules/main/include.php");

		@set_time_limit(3600);

		$wizard = $this->GetWizard();
		$currentStep = $wizard->GetVar("nextStep");
		$selectedModule = $wizard->GetVar("nextStepStage");
		$selectedModule = preg_replace("#[^a-z0-9_.-]+#i", "", $selectedModule);

		if ($selectedModule == "skip")
		{
			$wizard->SetCurrentStep("select_wizard");
			return;
		}

		$this->singleSteps = [
			"do_load_module" => InstallGetMessage("INS_MODULE_LOADING"),
			"do_update_module" => InstallGetMessage("INS_MODULE_LOADING"),
			"do_install_module" => InstallGetMessage("INS_MODULE_INSTALLING"),
			"do_load_wizard" => InstallGetMessage("INS_WIZARD_LOADING"),
		];

		$this->arSteps = array_keys($this->singleSteps);

		if (!in_array($currentStep, $this->arSteps))
		{
			if ($currentStep == "LocalRedirect")
			{
				$arWizardsList = BXInstallServices::GetWizardsList($selectedModule);

				$arTmp = explode(":", $arWizardsList[0]["ID"]);
				$ar = [];
				foreach ($arTmp as $a)
				{
					$a = preg_replace("#[^a-z0-9_.-]+#i", "", $a);
					if ($a <> '')
					{
						$ar[] = $a;
					}
				}

				$errorMessageTmp = "";
				if (BXInstallServices::CreateWizardIndex($ar[1] . ":" . $ar[2], $errorMessageTmp))
				{
					$u = "/index.php";
					if (defined("WIZARD_DEFAULT_SITE_ID"))
					{
						$rsSite = CSite::GetList("sort", "asc", ["ID" => WIZARD_DEFAULT_SITE_ID]);
						$arSite = $rsSite->GetNext();

						$u = "";
						if (is_array($arSite["DOMAINS"]) && $arSite["DOMAINS"][0] <> '' || $arSite["DOMAINS"] <> '')
						{
							$u .= "http://";
						}
						if (is_array($arSite["DOMAINS"]))
						{
							$u .= $arSite["DOMAINS"][0];
						}
						else
						{
							$u .= $arSite["DOMAINS"];
						}
						$u .= $arSite["DIR"];
					}
					else
					{
						BXInstallServices::DeleteDirRec($_SERVER["DOCUMENT_ROOT"] . "/readme.php");
						BXInstallServices::DeleteDirRec($_SERVER["DOCUMENT_ROOT"] . "/readme.html");
						BXInstallServices::DeleteDirRec($_SERVER["DOCUMENT_ROOT"] . "/install.config");
						BXInstallServices::DeleteDirRec($_SERVER["DOCUMENT_ROOT"] . "/restore.php");
						BXInstallServices::DeleteDirRec($_SERVER["DOCUMENT_ROOT"] . "/bitrixsetup.php");
					}

					BXInstallServices::LocalRedirect($u);
					return;
				}
			}
			else
			{
				$wizard->SetCurrentStep($currentStep);
				return;
			}
		}

		$nextStep = "do_load_module";
		$percent = 0;
		$status = "";

		if ($currentStep == "do_load_module" || $currentStep == "do_update_module")
		{
			if (($currentStep == "do_update_module") || !file_exists($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/" . $selectedModule))
			{
				require_once($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/classes/general/update_client_partner.php");

//				$errorMessage = "";
//				if (!CUpdateClientPartner::LoadModuleNoDemand($selectedModule, $errorMessage, "Y", LANGUAGE_ID))
//					$this->SendResponse("window.onbeforeunload = null; window.ajaxForm.StopAjax(); window.ajaxForm.SetStatus('0', '".$errorMessage."'); window.ajaxForm.ShowError('".$errorMessage."');");

				$loadModuleResult = CUpdateClientPartner::loadModule4Wizard($selectedModule, LANGUAGE_ID);
				$loadModuleResultCode = substr($loadModuleResult, 0, 3);
				if ($loadModuleResultCode == "ERR")
				{
					$this->SendResponse("window.onbeforeunload = null; window.ajaxForm.StopAjax(); window.ajaxForm.SetStatus('0', '" . substr($loadModuleResult, 3) . "'); window.ajaxForm.ShowError('" . substr($loadModuleResult, 3) . "');");
				}
				elseif ($loadModuleResultCode == "STP")
				{
					$nextStep = "do_update_module";
					$status = $this->singleSteps["do_update_module"];
					$percent = 40;
				}
				else
				{
					$nextStep = "do_install_module";
					$status = $this->singleSteps["do_install_module"];
					$percent = 40;
				}
			}
			else
			{
				$nextStep = "do_install_module";
				$status = $this->singleSteps["do_install_module"];
				$percent = 40;
			}
		}
		elseif ($currentStep == "do_install_module")
		{
			if (!IsModuleInstalled($selectedModule))
			{
				$module = $this->GetModuleObject($selectedModule);
				if (!is_object($module))
				{
					$this->SendResponse("window.onbeforeunload = null; window.ajaxForm.StopAjax(); window.ajaxForm.SetStatus('0', '" . InstallGetMessage("INS_MODULE_CANNOT_BE_INSTALLED") . "');window.ajaxForm.ShowError('" . InstallGetMessage("INS_MODULE_CANNOT_BE_INSTALLED") . "');");
				}

				if (!$module->InstallDB())
				{
					if ($ex = $APPLICATION->GetException())
					{
						$this->SendResponse("window.onbeforeunload = null; window.ajaxForm.StopAjax(); window.ajaxForm.SetStatus('0', '" . $ex->GetString() . "');");
					}
					else
					{
						$this->SendResponse("window.onbeforeunload = null; window.ajaxForm.StopAjax(); window.ajaxForm.SetStatus('0', '" . InstallGetMessage("INS_MODULE_DATABASE_ERROR") . "');");
					}
				}

				$module->InstallEvents();

				if (!$module->InstallFiles())
				{
					if ($ex = $APPLICATION->GetException())
					{
						$this->SendResponse("window.onbeforeunload = null; window.ajaxForm.StopAjax(); window.ajaxForm.SetStatus('0', '" . $ex->GetString() . "');");
					}
					else
					{
						$this->SendResponse("window.onbeforeunload = null; window.ajaxForm.StopAjax(); window.ajaxForm.SetStatus('0', '" . InstallGetMessage("INS_MODULE_FILES_ERROR") . "');");
					}
				}
			}
			$nextStep = "do_load_wizard";
			$status = $this->singleSteps["do_load_wizard"];
			$percent = 80;
		}
		elseif ($currentStep == "do_load_wizard")
		{
			$arWizardsList = BXInstallServices::GetWizardsList($selectedModule);
			if (count($arWizardsList) == 1)
			{
				$arTmp = explode(":", $arWizardsList[0]["ID"]);
				$ar = [];
				foreach ($arTmp as $a)
				{
					$a = preg_replace("#[^a-z0-9_.-]+#i", "", $a);
					if ($a <> '')
					{
						$ar[] = $a;
					}
				}

				BXInstallServices::CopyDirFiles(
					$_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/" . $ar[0] . "/install/wizards/" . $ar[1] . "/" . $ar[2],
					$_SERVER["DOCUMENT_ROOT"] . "/bitrix/wizards/" . $ar[1] . "/" . $ar[2]
				);

				$nextStep = "LocalRedirect";
			}
			elseif (empty($arWizardsList))
			{
				$nextStep = "select_wizard";
			}
			else
			{
				$nextStep = "select_wizard1";
			}
			$percent = 100;
			$status = $this->singleSteps["do_load_wizard"];
		}

		$response = "";
		if (!in_array($nextStep, $this->arSteps))
		{
			$response .= "window.onbeforeunload = null; window.ajaxForm.StopAjax();";
		}
		$response .= "window.ajaxForm.SetStatus('" . $percent . "'); window.ajaxForm.Post('" . $nextStep . "', '" . $selectedModule . "','" . $status . "');";

		$this->SendResponse($response);
	}

	function SendResponse($response)
	{
		header("Content-Type: text/html; charset=UTF-8");
		die("[response]" . $response . "[/response]");
	}

	function GetModuleObject($moduleID)
	{
		$installFile = $_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/" . $moduleID . "/install/index.php";
		if (!file_exists($installFile))
		{
			return false;
		}

		@include_once($installFile);
		$moduleIDTmp = str_replace(".", "_", $moduleID);
		if (!class_exists($moduleIDTmp))
		{
			return false;
		}

		return new $moduleIDTmp;
	}

	function ShowStep()
	{
		@include_once($_SERVER["DOCUMENT_ROOT"] . BX_PERSONAL_ROOT . "/php_interface/dbconn.php");

		$wizard = $this->GetWizard();
		$nextStepStage = $wizard->GetVar("nextStepStage");

		$this->content .= '
		<div class="instal-load-block" id="result">
			<div class="instal-load-label" id="status"></div>
			<div class="instal-progress-bar-outer" style="width: 670px;">
				<div class="instal-progress-bar-alignment">
					<div class="instal-progress-bar-inner" id="indicator">
						<div class="instal-progress-bar-inner-text" style="width: 670px;" id="percent"></div>
					</div>
					<span id="percent2">0%</span>
				</div>
			</div>
		</div>

		<div id="error_container" style="display:none">
			<div id="error_notice">
				<div class="inst-note-block inst-note-block-red">
					<div class="inst-note-block-icon"></div>
					<div class="inst-note-block-label">' . InstallGetMessage("INST_ERROR_OCCURED") . '</div><br style="clear:both" />
					<div class="inst-note-block-text">' . InstallGetMessage("INST_ERROR_NOTICE") . '<div id="error_text"></div></div>
				</div>
			</div>

			<div id="error_buttons" align="center">
			<br /><input type="button" value="' . InstallGetMessage("INST_RETRY_BUTTON") . '" id="error_retry_button" style="display:none" onclick="" class="instal-btn instal-btn-inp" />&nbsp;<input type="button" id="error_skip_button" value="' . InstallGetMessage("INST_SKIP_BUTTON") . '" onclick="" class="instal-btn instal-btn-inp" />&nbsp;</div>
		</div>

		' . $this->ShowHiddenField("nextStep", "do_load_module") . '
		' . $this->ShowHiddenField("nextStepStage", $nextStepStage) . '
		<iframe style="display:none;" id="iframe-post-form" name="iframe-post-form" src="javascript:\'\'"></iframe>
		';

		$wizard = $this->GetWizard();

		$formName = $wizard->GetFormName();
		$NextStepVarName = $wizard->GetRealName("nextStep");

		$this->content .= '
			<script>
				var ajaxForm = new CAjaxForm("' . $formName . '", "iframe-post-form", "' . $NextStepVarName . '");
				ajaxForm.Post("do_load_module", "' . $nextStepStage . '", "' . InstallGetMessage("INS_MODULE_LOADING") . '");
			</script>
		';
	}
}

class SelectWizard1Step extends SelectWizardStep
{
	function InitStep()
	{
		$this->SetStepID("select_wizard1");
		$this->SetNextStep("finish");
		$this->SetNextCaption(InstallGetMessage("NEXT_BUTTON"));
		$this->SetTitle(InstallGetMessage("INST_SELECT_WIZARD1"));
	}

	function OnPostForm()
	{
		global $DB, $DBHost, $DBLogin, $DBPassword, $DBName, $DBDebug, $DBDebugToFile, $APPLICATION, $USER;
		require_once($_SERVER['DOCUMENT_ROOT'] . "/bitrix/modules/main/include.php");

		$wizard = $this->GetWizard();
		$selectedWizard = $wizard->GetVar("selected_wizard");

		if ($selectedWizard == '')
		{
			$this->SetError(InstallGetMessage("INS_WRONG_WIZARD"));
			return null;
		}

		if ($selectedWizard == "@")
		{
			$wizard->SetCurrentStep("load_module");
			return true;
		}

		$arTmp = explode(":", $selectedWizard);
		$ar = [];
		foreach ($arTmp as $a)
		{
			$a = preg_replace("#[^a-z0-9_.-]+#i", "", $a);
			if ($a <> '')
			{
				$ar[] = $a;
			}
		}

		if (count($ar) > 2)
		{
			$path = $_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/" . $ar[0] . "/install/wizards/" . $ar[1] . "/" . $ar[2];

			if (!file_exists($path) || !is_dir($path))
			{
				$this->SetError(InstallGetMessage("INS_WIZARD_NOT_FOUND"));
				return null;
			}

			BXInstallServices::CopyDirFiles(
				$_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/" . $ar[0] . "/install/wizards/" . $ar[1] . "/" . $ar[2],
				$_SERVER["DOCUMENT_ROOT"] . "/bitrix/wizards/" . $ar[1] . "/" . $ar[2]
			);

			$ar = [$ar[1], $ar[2]];
		}

		if (!file_exists($_SERVER["DOCUMENT_ROOT"] . "/bitrix/wizards/" . $ar[0] . "/" . $ar[1])
			|| !is_dir($_SERVER["DOCUMENT_ROOT"] . "/bitrix/wizards/" . $ar[0] . "/" . $ar[1]))
		{
			$this->SetError(InstallGetMessage("INS_WIZARD_NOT_FOUND"));
			return null;
		}

		if (BXInstallServices::CreateWizardIndex($ar[0] . ":" . $ar[1], $errorMessageTmp))
		{
			$u = "/index.php";
			if (defined("WIZARD_DEFAULT_SITE_ID"))
			{
				$rsSite = CSite::GetList("sort", "asc", ["ID" => WIZARD_DEFAULT_SITE_ID]);
				$arSite = $rsSite->GetNext();

				$u = "";
				if (is_array($arSite["DOMAINS"]) && $arSite["DOMAINS"][0] <> '' || $arSite["DOMAINS"] <> '')
				{
					$u .= "http://";
				}
				if (is_array($arSite["DOMAINS"]))
				{
					$u .= $arSite["DOMAINS"][0];
				}
				else
				{
					$u .= $arSite["DOMAINS"];
				}
				$u .= $arSite["DIR"];
			}
			else
			{
				BXInstallServices::DeleteDirRec($_SERVER["DOCUMENT_ROOT"] . "/readme.php");
				BXInstallServices::DeleteDirRec($_SERVER["DOCUMENT_ROOT"] . "/readme.html");
				BXInstallServices::DeleteDirRec($_SERVER["DOCUMENT_ROOT"] . "/install.config");
				BXInstallServices::DeleteDirRec($_SERVER["DOCUMENT_ROOT"] . "/restore.php");
				BXInstallServices::DeleteDirRec($_SERVER["DOCUMENT_ROOT"] . "/bitrixsetup.php");
			}

			BXInstallServices::LocalRedirect($u);
		}
		else
		{
			$this->SetError($errorMessageTmp);
		}

		return true;
	}

	function ShowStep()
	{
		$wizard = $this->GetWizard();
		$prefixName = $wizard->GetRealName("selected_wizard");

		$selectedModule = $wizard->GetVar("selected_module");

		$arWizardsList = BXInstallServices::GetWizardsList($selectedModule);

		$this->content = '
		<script>
			function SelectSolution(element, solutionId)
			{
				var hidden = document.getElementById("id_' . CUtil::JSEscape($prefixName) . '");
				hidden.value = solutionId;

				var container = document.getElementById("solutions-container");
				var anchors = container.getElementsByTagName("TD");
				for (var i = 0; i < anchors.length; i++)
				{
					anchors[i].className = "inst-module-cell";
				}

				element.parentNode.className = "inst-module-cell inst-module-cell-active";
				
				document.getElementById("id_radio_"+solutionId).checked=true;
			}
		</script>
		';

		$arWizardsList[] = [
			"ID" => "@",
			"IMAGE" => "/bitrix/images/install/marketplace.gif",
			"NAME" => InstallGetMessage("INS_LOAD_FROM_MARKETPLACE"),
			"DESCRIPTION" => InstallGetMessage("INS_LOAD_FROM_MARKETPLACE_DESCR"),
		];

		$this->content .= '<table class="inst-module-table" id="solutions-container">';
		$i = 0;
		foreach ($arWizardsList as $w)
		{
			if ($i == 0)
			{
				$this->content .= '<tr>';
			}
			$this->content .= '
				<td class="inst-module-cell">
					<div class="inst-module-block" onclick="SelectSolution(this, \'' . htmlspecialcharsbx($w["ID"]) . '\');" ondblclick="document.forms[\'' . htmlspecialcharsbx($wizard->GetFormName()) . '\'].submit();">
							<div class="inst-module-title"><span class="inst-module-title-alignment"></span><span class="inst-module-title-text">' . TruncateText($w["NAME"], 59) . '</span></div>
							<div class="inst-module-cont">
								' . ($w["IMAGE"] <> '' ? '<div class="inst-module-img"><img alt="" src="' . htmlspecialcharsbx($w["IMAGE"]) . '" /></div>' : "") . '
								<div class="inst-module-text">' . TruncateText($w["DESCRIPTION"], 90) . '</div>
							</div>
							<input type="radio" id="id_radio_' . htmlspecialcharsbx($w["ID"]) . '" name="redio" class="inst-module-checkbox" />
					</div>
				</td>';

			if ($i == 1)
			{
				$this->content .= '</tr>';
				$i = 0;
			}
			else
			{
				$i++;
			}
		}
		if ($i == 0)
		{
			$this->content .= '<td></td></tr>';
		}
		$this->content .= '</table>
		<input type="hidden" id="id_' . htmlspecialcharsbx($prefixName) . '" name="' . htmlspecialcharsbx($prefixName) . '" value="">';
	}
}

class CheckLicenseKey extends CWizardStep
{
	function InitStep()
	{
		$this->SetStepID("check_license_key");
		$this->SetNextStep("create_modules");
		$this->SetNextCaption(InstallGetMessage("NEXT_BUTTON"));
		$this->SetTitle(InstallGetMessage("INS_LICENSE_HEAD"));

		$wizard = $this->GetWizard();
		if (defined("TRIAL_VERSION"))
		{
			$wizard->SetDefaultVar("lic_key_variant", "Y");
		}

		if (file_exists($_SERVER['DOCUMENT_ROOT'] . '/bitrix/license_key.php'))
		{
			$LICENSE_KEY = '';
			include($_SERVER['DOCUMENT_ROOT'] . '/bitrix/license_key.php');
			$wizard->SetDefaultVar("license", $LICENSE_KEY);
		}
	}

	function OnPostForm()
	{
		$wizard = $this->GetWizard();
		$licenseKey = $wizard->GetVar("license");

		if (!defined("TRIAL_VERSION") && !preg_match('/[A-Z0-9]{3}-[A-Z]{2}-?[A-Z0-9]{12,30}/i', $licenseKey))
		{
			$this->SetError(InstallGetMessage("BAD_LICENSE_KEY"), "license");
			return;
		}

		if (defined("TRIAL_VERSION"))
		{
			$lic_key_variant = $wizard->GetVar("lic_key_variant");

			if ($lic_key_variant == "Y" && $licenseKey == '')
			{
				$lic_key_user_surname = $wizard->GetVar("user_surname");
				$lic_key_user_name = $wizard->GetVar("user_name");
				$lic_key_email = $wizard->GetVar("email");

				$bError = false;
				if (trim($lic_key_user_name) == '')
				{
					$this->SetError(InstallGetMessage("ACT_KEY_BAD_NAME"), "user_name");
					$bError = true;
				}
				if (trim($lic_key_user_surname) == '')
				{
					$this->SetError(InstallGetMessage("ACT_KEY_BAD_LAST_NAME"), "user_surname");
					$bError = true;
				}
				if (trim($lic_key_email) == '' || !check_email($lic_key_email))
				{
					$this->SetError(InstallGetMessage("ACT_KEY_BAD_EMAIL"), "email");
					$bError = true;
				}

				if (!$bError)
				{
					$key = BXInstallServices::GetRegistrationKey($lic_key_user_name, $lic_key_user_surname, $lic_key_email, 'mysql');

					if ($key !== false)
					{
						$wizard->SetVar("license", $key);
					}
				}
			}
		}

		$this->CreateLicenseFile();
	}

	function CreateLicenseFile()
	{
		$wizard = $this->GetWizard();
		$licenseKey = $wizard->GetVar("license");

		return BXInstallServices::CreateLicenseFile($licenseKey);
	}

	function ShowStep()
	{
		$this->content = '
		<table border="0" class="data-table">
			<tr>
				<td colspan="2" class="header">' . InstallGetMessage("INS_LICENSE_HEAD") . '</td>
			</tr>';

		if (!defined("TRIAL_VERSION"))
		{
			$this->content .= '<tr>
				<td nowrap align="right" width="40%" valign="top">
					<span style="color:red">*</span>&nbsp;' . InstallGetMessage("INS_LICENSE") . '
				</td>
				<td width="60%" valign="top">' . $this->ShowInputField("text", "license", ["size" => "30", "tabindex" => "1", "id" => "license_id"]) . '
					<br>
					<small>' . InstallGetMessage("INS_LICENSE_NOTE_SOURCE") . '<br></small>
				</td>
				</tr>
				<tr>
				<td nowrap align="right" width="40%" valign="top">
					' . InstallGetMessage("INSTALL_DEVSRV") . '
				</td>
				<td width="60%" valign="top">' . $this->ShowCheckboxField("devsrv", "Y", ["id" => "devsrv_inst"]) . '
					<br>
					<small>' . InstallGetMessage("INSTALL_DEVSRV_NOTE") . '<br></small>
				</td>
				</tr>
				</table>
				';
		}
		else
		{
			$this->content .= '
			<script>
				function changeLicKey(val)
				{
					if(val)
					{
						document.getElementById("lic_key_activation").style.display = "block";
					}
					else
					{
						document.getElementById("lic_key_activation").style.display = "none";
					}
				}
			</script>

					';

			$this->content .= '<tr><td colspan="2">' . $this->ShowCheckboxField("lic_key_variant", "Y", ["id" => "lic_key_variant", "onclick" => "javascript:changeLicKey(this.checked)"]) . '<label for="lic_key_variant">' . InstallGetMessage("ACT_KEY") . '</label></td></tr>';

			$wizard = $this->GetWizard();
			$lic_key_variant = $wizard->GetVar("lic_key_variant", true);
			$this->content .= '
			</table>
			<div id="lic_key_activation">
			<table border="0" class="data-table" style="border-top:none;">
			<tr>
				<td align="right" width="40%" style="border-top:none;"><span style="color:red">*</span>&nbsp;' . InstallGetMessage("ACT_KEY_NAME") . ':</td>
				<td width="60%" valign="top" style="border-top:none;">' . $this->ShowInputField("text", "user_name", ["size" => "30", "tabindex" => "4", "id" => "user_name"]) . '</td>
			</tr>
			<tr>
				<td align="right" width="40%" style="border-top:none;"><span style="color:red">*</span>&nbsp;' . InstallGetMessage("ACT_KEY_LAST_NAME") . ':</td>
				<td width="60%" valign="top" style="border-top:none;">' . $this->ShowInputField("text", "user_surname", ["size" => "30", "tabindex" => "5", "id" => "user_surname"]) . '</td>
			</tr>
			<tr>
				<td align="right" width="40%" style="border-top:none;"><span style="color:red">*</span>&nbsp;Email:</td>
				<td width="60%" valign="top" style="border-top:none;">' . $this->ShowInputField("text", "email", ["size" => "30", "tabindex" => "6", "id" => "email"]) . '</td>
			</tr>
			</table>
			</div>
			<script>
			changeLicKey(' . (($lic_key_variant == "Y") ? 'true' : 'false') . ');
			</script>
			';
		}
		//$this->content .= '</table>';
	}
}

//Create wizard
$wizard = new CWizardBase(str_replace("#VERS#", SM_VERSION, InstallGetMessage("INS_TITLE")), $package = null);

if (defined("WIZARD_DEFAULT_TONLY") && WIZARD_DEFAULT_TONLY === true)
{
	global $USER;
	require_once($_SERVER['DOCUMENT_ROOT'] . "/bitrix/modules/main/include.php");
	if ($USER->CanDoOperation('edit_other_settings'))
	{
		$arSteps = [
			"SelectWizardStep",
			"LoadModuleStep",
			"LoadModuleActionStep",
			"SelectWizard1Step",
		];
	}
	else
	{
		die();
	}
}
elseif (BXInstallServices::IsShortInstall())
{
	//Short installation
	$arSteps = ["AgreementStep4VM"];

	if ($_SERVER['BITRIX_ENV_TYPE'] <> "crm")
	{
		$arSteps[] = "CheckLicenseKey";
		$arSteps[] = "CreateModulesStep";
		$arSteps[] = "CreateAdminStep";
		$arSteps[] = "SelectWizardStep";
		$arSteps[] = "LoadModuleStep";
		$arSteps[] = "LoadModuleActionStep";
		$arSteps[] = "SelectWizard1Step";
	}
	else
	{
		$arSteps[] = "CreateModulesStep";
		$arSteps[] = "CreateAdminStep";
	}
}
else
{
	//Full installation
	$arSteps = [
		"WelcomeStep",
		"AgreementStep",
		"DBTypeStep",
		"RequirementStep",
		"CreateDBStep",
		"CreateModulesStep",
		"CreateAdminStep",
		"SelectWizardStep",
		"LoadModuleStep",
		"LoadModuleActionStep",
		"SelectWizard1Step",
	];
}

$wizard->AddSteps($arSteps); //Add steps
$wizard->SetTemplate(new WizardTemplate);
$wizard->SetReturnOutput();
$content = $wizard->Display();

header("Content-Type: text/html; charset=UTF-8");
echo $content;
