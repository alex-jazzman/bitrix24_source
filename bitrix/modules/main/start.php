<?php
/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage main
 * @copyright 2001-2013 Bitrix
 */

error_reporting(E_COMPILE_ERROR|E_ERROR|E_CORE_ERROR|E_PARSE);

require_once(__DIR__."/bx_root.php");
require_once(__DIR__."/lib/loader.php");
require_once(__DIR__.'/include/autoload.php');

define("START_EXEC_TIME", microtime(true));
define("B_PROLOG_INCLUDED", true);

require_once(__DIR__."/classes/general/version.php");

// global functions
require_once(__DIR__."/tools.php");

//TODO remove this
if(@ini_get_bool("register_long_arrays") != true)
{
	$HTTP_POST_FILES  = $_FILES;
	$HTTP_SERVER_VARS = $_SERVER;
	$HTTP_GET_VARS = $_GET;
	$HTTP_POST_VARS = $_POST;
	$HTTP_COOKIE_VARS = $_COOKIE;
	$HTTP_ENV_VARS = $_ENV;
}

FormDecode();

$application = \Bitrix\Main\HttpApplication::getInstance();
$application->initializeBasicKernel();

//Defined in dbconn.php
global $DBType, $DBDebug, $DBDebugToFile, $DBHost, $DBName, $DBLogin, $DBPassword;

//read various parameters
require_once($_SERVER["DOCUMENT_ROOT"].BX_PERSONAL_ROOT."/php_interface/dbconn.php");

// not used anymore
$DBType = "mysql";
$DBHost = "";
$DBLogin = "";
$DBPassword = "";
$DBName = "";

if(defined('BX_UTF'))
{
	define('BX_UTF_PCRE_MODIFIER', 'u');
}
else
{
	define('BX_UTF_PCRE_MODIFIER', '');
}

if(!defined("CACHED_b_lang")) define("CACHED_b_lang", 3600);
if(!defined("CACHED_b_option")) define("CACHED_b_option", 3600);
if(!defined("CACHED_b_lang_domain")) define("CACHED_b_lang_domain", 3600);
if(!defined("CACHED_b_site_template")) define("CACHED_b_site_template", 3600);
if(!defined("CACHED_b_event")) define("CACHED_b_event", 3600);
if(!defined("CACHED_b_agent")) define("CACHED_b_agent", 3660);
if(!defined("CACHED_menu")) define("CACHED_menu", 3600);
if(!defined("CACHED_b_file")) define("CACHED_b_file", false);
if(!defined("CACHED_b_file_bucket_size")) define("CACHED_b_file_bucket_size", 100);
if(!defined("CACHED_b_group")) define("CACHED_b_group", 3600);
if(!defined("CACHED_b_user_field")) define("CACHED_b_user_field", 3600);
if(!defined("CACHED_b_user_field_enum")) define("CACHED_b_user_field_enum", 3600);
if(!defined("CACHED_b_task")) define("CACHED_b_task", 3600);
if(!defined("CACHED_b_task_operation")) define("CACHED_b_task_operation", 3600);
if(!defined("CACHED_b_rating")) define("CACHED_b_rating", 3600);
if(!defined("CACHED_b_rating_vote")) define("CACHED_b_rating_vote", 86400);
if(!defined("CACHED_b_rating_bucket_size")) define("CACHED_b_rating_bucket_size", 100);
if(!defined("CACHED_b_user_access_check")) define("CACHED_b_user_access_check", 3600);
if(!defined("CACHED_b_user_counter")) define("CACHED_b_user_counter", 3600);
if(!defined("CACHED_b_group_subordinate")) define("CACHED_b_group_subordinate", 31536000);
if(!defined("CACHED_b_smile")) define("CACHED_b_smile", 31536000);
if(!defined("TAGGED_user_card_size")) define("TAGGED_user_card_size", 100);

// From here global variable $DB is available (CDatabase class)
require_once(__DIR__."/classes/mysql/database.php");

$GLOBALS["DB"] = new CDatabase;
$GLOBALS["DB"]->debug = $DBDebug;
if ($DBDebugToFile)
{
	$GLOBALS["DB"]->DebugToFile = true;
	$application->getConnection()->startTracker()->startFileLog($_SERVER["DOCUMENT_ROOT"]."/mysql_debug.sql");
}

//magic parameters: show sql queries statistics
$show_sql_stat = "";
if(array_key_exists("show_sql_stat", $_GET))
{
	$show_sql_stat = (strtoupper($_GET["show_sql_stat"]) == "Y"? "Y":"");
	setcookie("show_sql_stat", $show_sql_stat, false, "/");
}
elseif(array_key_exists("show_sql_stat", $_COOKIE))
{
	$show_sql_stat = $_COOKIE["show_sql_stat"];
}

if ($show_sql_stat == "Y")
{
	$GLOBALS["DB"]->ShowSqlStat = true;
	$application->getConnection()->startTracker();
}

//licence key
$LICENSE_KEY = "";
if(file_exists(($_fname = $_SERVER["DOCUMENT_ROOT"].BX_ROOT."/license_key.php")))
	include($_fname);
if($LICENSE_KEY == "" || strtoupper($LICENSE_KEY) == "DEMO")
	define("LICENSE_KEY", "DEMO");
else
	define("LICENSE_KEY", $LICENSE_KEY);

//language independed classes
require_once(__DIR__."/classes/mysql/main.php");	//main class
require_once(__DIR__."/classes/general/cache.php");	//various cache classes
require_once(__DIR__."/classes/general/module.php");

error_reporting(E_COMPILE_ERROR|E_ERROR|E_CORE_ERROR|E_PARSE);

if (file_exists(($fname = __DIR__."/classes/general/update_db_updater.php")))
{
	$US_HOST_PROCESS_MAIN = True;
	include($fname);
}
