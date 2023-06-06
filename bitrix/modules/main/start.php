<?php
/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage main
 * @copyright 2001-2022 Bitrix
 */

error_reporting(E_COMPILE_ERROR|E_ERROR|E_CORE_ERROR|E_PARSE);

require_once(__DIR__."/bx_root.php");
require_once(__DIR__."/lib/loader.php");
require_once(__DIR__.'/include/autoload.php');

define("START_EXEC_TIME", microtime(true));
if (!defined('B_PROLOG_INCLUDED'))
{
	define("B_PROLOG_INCLUDED", true);
}

require_once(__DIR__."/classes/general/version.php");

// global functions
require_once(__DIR__."/tools.php");

FormDecode();

$application = \Bitrix\Main\HttpApplication::getInstance();

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

define('BX_UTF_PCRE_MODIFIER', (defined('BX_UTF') ? 'u' : ''));

define('BX_RESIZE_IMAGE_PROPORTIONAL_ALT', 0);
define('BX_RESIZE_IMAGE_PROPORTIONAL', 1);
define('BX_RESIZE_IMAGE_EXACT', 2);

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

/**
 * License key.
 * @deprecated Use $application->getLicense()->getKey()
 */
define("LICENSE_KEY", $application->getLicense()->getKey());

//language independed classes
require_once(__DIR__."/classes/general/cache.php");
require_once(__DIR__."/classes/general/module.php");

error_reporting(E_COMPILE_ERROR|E_ERROR|E_CORE_ERROR|E_PARSE);

if (file_exists(($fname = __DIR__."/classes/general/update_db_updater.php")))
{
	$US_HOST_PROCESS_MAIN = true;
	include($fname);
}
