<?php

/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage main
 * @copyright 2001-2026 Bitrix
 */

use Bitrix\Main;
use Bitrix\Main\Session\Legacy\HealerEarlySessionStart;
use Bitrix\Main\Config\Option;
use Dev\Main\Migrator\ModuleUpdater;

require_once __DIR__ . '/start.php';

$application = Main\HttpApplication::getInstance();
$application->initialize([
	'get' => $_GET,
	'post' => $_POST,
	'files' => $_FILES,
	'cookie' => $_COOKIE,
	'server' => $_SERVER,
	'env' => $_ENV
]);

if (class_exists('\Dev\Main\Migrator\ModuleUpdater'))
{
	ModuleUpdater::checkUpdates('main', __DIR__);
}

if (!Main\ModuleManager::isModuleInstalled('bitrix24'))
{
	// wwall rules
	(new Main\Security\W\WWall)->handle();
}

if (defined('SITE_ID'))
{
	define('LANG', SITE_ID);
}

$context = $application->getContext();
$context->initializeCulture(defined('LANG') ? LANG : null, defined('LANGUAGE_ID') ? LANGUAGE_ID : null);

// needs to be after culture initialization
$application->start();

// constants for compatibility
$culture = $context->getCulture();
define('SITE_CHARSET', $culture->getCharset());
define('FORMAT_DATE', $culture->getFormatDate());
define('FORMAT_DATETIME', $culture->getFormatDatetime());
define('LANG_CHARSET', SITE_CHARSET);

$site = $context->getSiteObject();
if (!defined('LANG'))
{
	define('LANG', ($site ? $site->getLid() : $context->getLanguage()));
}
define('SITE_DIR', ($site ? $site->getDir() : ''));
if (!defined('SITE_SERVER_NAME'))
{
	define('SITE_SERVER_NAME', ($site ? $site->getServerName() : ''));
}
define('LANG_DIR', SITE_DIR);

if (!defined('LANGUAGE_ID'))
{
	define('LANGUAGE_ID', $context->getLanguage());
}
define('LANG_ADMIN_LID', LANGUAGE_ID);

if (!defined('SITE_ID'))
{
	define('SITE_ID', LANG);
}

/** @global $lang */
$lang = $context->getLanguage();

//define global application object
$GLOBALS["APPLICATION"] = new CMain;

if (!defined("POST_FORM_ACTION_URI"))
{
	define("POST_FORM_ACTION_URI", htmlspecialcharsbx(GetRequestUri()));
}

$GLOBALS["MESS"] = [];
$GLOBALS["ALL_LANG_FILES"] = [];
IncludeModuleLangFile(__DIR__."/tools.php");
IncludeModuleLangFile(__FILE__);

error_reporting((int)Option::get("main", "error_reporting", E_COMPILE_ERROR | E_ERROR | E_CORE_ERROR | E_PARSE) & ~E_DEPRECATED & ~E_WARNING & ~E_NOTICE);

if (!defined("BX_COMP_MANAGED_CACHE") && Option::get("main", "component_managed_cache_on", "Y") != "N")
{
	define("BX_COMP_MANAGED_CACHE", true);
}

// global functions
require_once __DIR__ . "/filter_tools.php";

/*ZDUyZmZNWE3Y2I0MGMzZDcxODRlN2U5MzhkNmRmMDQwMGMzMzE=*/$GLOBALS['_____1192492250']= array(base64_decode(''.'R2V0'.'TW9kdWxlRXZlbn'.'Rz'),base64_decode('R'.'Xh'.'lY3V0ZU1v'.'ZHVsZUV2Z'.'W5'.'0RXg='));$GLOBALS['____911947049']= array(base64_decode('Z'.'GV'.'ma'.'W5l'),base64_decode('YmFzZTY'.'0X'.'2RlY'.'29kZQ='.'='),base64_decode('d'.'W5zZXJ'.'pYWxpemU='),base64_decode('aXNfYXJyYXk='),base64_decode('a'.'W5fYX'.'JyYXk'.'='),base64_decode('c'.'2'.'Vy'.'aWFsaXpl'),base64_decode('YmFz'.'ZTY0X'.'2'.'VuY29kZ'.'Q=='),base64_decode('bWt0'.'aW1l'),base64_decode('Z'.'GF0ZQ'.'='.'='),base64_decode('ZGF0ZQ'.'=='),base64_decode('c3Ryb'.'GVu'),base64_decode('bWt'.'0a'.'W1l'),base64_decode('Z'.'GF'.'0ZQ=='),base64_decode('ZGF0'.'ZQ=='),base64_decode(''.'bWV'.'0aG9kX2V4aXN0'.'c'.'w=='),base64_decode('Y2FsbF'.'91c2VyX2Z1b'.'mNfYXJ'.'yYXk='),base64_decode(''.'c3Ry'.'bGVu'),base64_decode('c2V'.'y'.'aW'.'Fsa'.'Xpl'),base64_decode('YmFzZT'.'Y0X2VuY29kZQ=='),base64_decode('c3R'.'yb'.'GVu'),base64_decode('aXNfYX'.'JyY'.'X'.'k'.'='),base64_decode('c2VyaW'.'FsaXpl'),base64_decode('Ym'.'Fz'.'ZTY0X2VuY29kZQ=='),base64_decode('c2VyaWFsaXpl'),base64_decode('Ym'.'F'.'zZTY0X2VuY29kZQ=='),base64_decode(''.'aXN'.'fYX'.'JyYXk='),base64_decode('aXNf'.'YXJyYXk='),base64_decode('aW5'.'fYXJy'.'Y'.'Xk='),base64_decode('aW5f'.'YXJyYX'.'k='),base64_decode('bWt0aW1'.'l'),base64_decode(''.'ZGF0'.'Z'.'Q=='),base64_decode('ZGF0ZQ='.'='),base64_decode('Z'.'G'.'F0'.'ZQ=='),base64_decode('bWt0aW1l'),base64_decode('Z'.'G'.'F0'.'ZQ='.'='),base64_decode('ZGF0ZQ=='),base64_decode('aW5fYXJyYX'.'k='),base64_decode('c'.'2VyaWFsaXpl'),base64_decode('Y'.'mFzZT'.'Y0X2V'.'uY29k'.'Z'.'Q=='),base64_decode('aW50d'.'m'.'F'.'s'),base64_decode('dG'.'ltZQ=='),base64_decode('ZmlsZV9l'.'eGlzdHM='),base64_decode('c'.'3Ry'.'X'.'3'.'JlcG'.'xhY2'.'U='),base64_decode('Y2xhc3NfZ'.'Xh'.'pc3R'.'z'),base64_decode('ZGV'.'maW5l'));if(!function_exists(__NAMESPACE__.'\\___524490372')){function ___524490372($_719392118){static $_261787316= false; if($_261787316 == false) $_261787316=array('S'.'U5UUkFORVRfRU'.'R'.'JVElPTg='.'=','WQ==','bW'.'Fp'.'bg==','fmNwZl'.'9tYX'.'Bfd'.'mFsdWU=','','','YWx'.'sb3'.'dlZF9j'.'bGF'.'z'.'c2'.'Vz','ZQ==','Zg==',''.'Z'.'Q==',''.'Rg==',''.'WA==','Zg='.'=','bWF'.'pbg==',''.'fmNw'.'Zl'.'9tYX'.'Bfdm'.'FsdWU=',''.'UG9'.'ydG'.'Fs','Rg==','ZQ==','Z'.'Q='.'=',''.'WA==',''.'Rg='.'=','RA==','RA==','bQ==','ZA==',''.'WQ==','Zg'.'==','Zg==','Zg==',''.'Zg==','U'.'G9yd'.'GFs','Rg==','ZQ==','ZQ==','W'.'A==','R'.'g='.'=','R'.'A==','RA'.'==','bQ==','ZA='.'=','WQ==',''.'bW'.'Fp'.'bg==','T'.'24=','U2V0d'.'GluZ3'.'ND'.'aG'.'FuZ2U'.'=',''.'Zg'.'==',''.'Zg==','Z'.'g==',''.'Z'.'g'.'='.'=','bWFpbg==','fmN'.'wZl'.'9tYX'.'Bf'.'dmFsdWU=',''.'ZQ==','ZQ==','RA==',''.'ZQ'.'==','ZQ==','Zg='.'=',''.'Zg==','Zg='.'=','ZQ'.'='.'=','b'.'WF'.'pbg'.'==','f'.'mNw'.'Zl9tYX'.'B'.'fdmFsdWU=','ZQ==',''.'Zg==',''.'Zg==','Zg'.'==','Zg==',''.'bWF'.'p'.'bg==','f'.'m'.'NwZl9tY'.'XBfdmFs'.'dWU=','ZQ==','Zg'.'==',''.'UG9'.'ydGFs',''.'UG9ydGF'.'s','ZQ'.'==','ZQ==',''.'U'.'G9'.'y'.'dGFs',''.'Rg==','WA==','Rg==',''.'R'.'A==',''.'Z'.'Q==','Z'.'Q'.'==',''.'RA==','bQ==','ZA==','WQ'.'==','ZQ'.'='.'=','W'.'A==','ZQ'.'==','Rg='.'=','ZQ==','RA'.'='.'=',''.'Zg==','ZQ='.'=','RA==','ZQ==','b'.'Q==','ZA==','WQ==','Zg==','Zg==','Zg==','Zg==','Z'.'g'.'==','Zg==','Zg==',''.'Zg'.'==','bWF'.'p'.'bg='.'=','fmNwZl9tYXB'.'f'.'d'.'m'.'F'.'sdWU=','ZQ==','Z'.'Q==','UG9'.'ydGFs',''.'R'.'g==','WA==','VFlQ'.'RQ==','REFURQ='.'=','RkVBVFVSRVM=','RVhQS'.'VJFR'.'A==','VFl'.'QRQ==','RA'.'='.'=','VF'.'JZX0RBWV'.'NfQ09VTlQ=','RE'.'F'.'URQ==','V'.'FJZX0'.'R'.'BWV'.'NfQ09'.'V'.'Tl'.'Q'.'=','RVhQSVJ'.'FR'.'A='.'=',''.'RkVB'.'VFVS'.'RVM'.'=','Zg='.'=',''.'Z'.'g='.'=','RE'.'9'.'DVU'.'1F'.'TlRfUk9PVA==','L2'.'J'.'pdHJ'.'peC9'.'tb2R1bGVzL'.'w==','L2luc3RhbG'.'wvaW'.'5kZ'.'XgucGhw','Lg='.'=','Xw==','c2Vhcm'.'N'.'o','Tg==','','','Q'.'UNUSVZF','WQ==',''.'c29jaWFsbmV0d29yaw==',''.'Y'.'Wxs'.'b3dfZ'.'nJpZWxkcw'.'==','WQ==',''.'SUQ'.'=',''.'c29jaWFsbmV'.'0d29ya'.'w==',''.'YWxsb3dfZnJ'.'pZWxkcw='.'=','SUQ'.'=','c'.'29ja'.'WF'.'sbmV'.'0d29yaw'.'==','YWx'.'sb'.'3dfZnJ'.'pZWxkc'.'w==','Tg==','','','QUNUSVZF',''.'WQ==','c29jaW'.'Fsbm'.'V'.'0d'.'29ya'.'w==','YWxs'.'b3'.'dfbWl'.'j'.'cm'.'9ib'.'G'.'9nX3'.'V'.'z'.'Z'.'X'.'I'.'=','W'.'Q==',''.'SU'.'Q=',''.'c29'.'jaW'.'Fs'.'bmV0d29yaw==','YWxsb3df'.'b'.'Wljcm'.'9'.'ibG'.'9n'.'X3VzZXI=','SUQ=','c2'.'9jaWFsbm'.'V0'.'d29ya'.'w'.'==','YWxsb3dfb'.'Wljcm9ibG9nX3VzZ'.'XI=','c29jaWFsbmV'.'0'.'d2'.'9y'.'aw'.'==','YWxs'.'b'.'3'.'d'.'fbW'.'ljcm9i'.'bG9nX2'.'dyb3Vw','WQ==','SUQ=','c29jaWFsbmV'.'0d29yaw==','YWxsb3'.'dfb'.'Wlj'.'cm9'.'ibG9'.'nX'.'2dyb3Vw',''.'SUQ=','c29j'.'aW'.'Fsbm'.'V0d'.'29y'.'aw==','YWxsb3dfb'.'W'.'ljcm9ibG9n'.'X2dyb3Vw',''.'Tg==','','','QU'.'NU'.'SVZF','WQ='.'=','c29jaWFsbmV0d29'.'yaw==','YWx'.'sb3dfZml'.'sZ'.'XNfdXNlcg==','WQ==',''.'SU'.'Q'.'=','c29jaWFsbmV0d29y'.'aw==','Y'.'W'.'xsb3d'.'f'.'Zm'.'lsZXNfdX'.'Nlcg==','SUQ=','c29'.'ja'.'WFs'.'bmV0d29y'.'aw==','YWx'.'s'.'b3dfZml'.'sZXNfdXNlcg==','Tg==','','','QUNU'.'SVZ'.'F','WQ'.'==','c29jaWFsbm'.'V0d29yaw='.'=','YWxsb3df'.'Ymxv'.'Z191c2V'.'y','WQ'.'==','SUQ'.'=','c29j'.'a'.'WFsbm'.'V0d29yaw='.'=',''.'YWxs'.'b'.'3dfYmx'.'v'.'Z191'.'c2Vy','SUQ=','c29jaWFs'.'bmV'.'0d'.'2'.'9y'.'a'.'w==','YWxs'.'b3dfYmxvZ191c2Vy',''.'Tg==','','',''.'QUNUSVZF','WQ==','c29jaWFsbmV0d29yaw'.'==',''.'YWxsb3d'.'f'.'cGhv'.'dG9f'.'d'.'XNlcg='.'=','WQ='.'=',''.'S'.'UQ=','c29jaWF'.'sbmV'.'0'.'d2'.'9yaw==','YWxsb3'.'dfc'.'GhvdG9f'.'dX'.'Nl'.'cg==','SUQ=','c29j'.'aWFsbm'.'V'.'0d29ya'.'w='.'=','Y'.'Wxsb3'.'df'.'cGhvdG9fdXNl'.'cg==','Tg==','','','QUNUS'.'VZ'.'F','WQ==','c29jaWFsbm'.'V0'.'d29yaw==',''.'YWx'.'sb3d'.'fZm'.'9y'.'dW1fdXNlcg'.'==','WQ'.'==','SUQ=','c'.'29jaWF'.'sbmV'.'0d29ya'.'w==','YWxsb3dfZm9ydW'.'1f'.'dXN'.'l'.'c'.'g'.'==','SUQ'.'=','c29jaWFsb'.'mV0'.'d29'.'y'.'a'.'w==','YWxsb3'.'dfZm9ydW1f'.'dXN'.'lc'.'g==',''.'Tg==','','','QUN'.'US'.'VZF','WQ==','c29jaWFsb'.'m'.'V0d29yaw==','YWxsb3dfdGFza3N'.'fd'.'XNlc'.'g==','W'.'Q='.'=',''.'S'.'U'.'Q'.'=','c29jaWFsbmV0d29yaw==','YWxsb3dfdG'.'Fza3Nf'.'dXNl'.'cg='.'=','SUQ'.'=','c29jaW'.'Fs'.'bm'.'V0d29yaw'.'==',''.'Y'.'Wxsb3'.'dfdGFza'.'3Nf'.'dXNlcg==','c29jaWFs'.'bmV0d29yaw'.'='.'=','Y'.'Wxsb'.'3dfd'.'GF'.'za'.'3NfZ3J'.'vdXA'.'=','WQ'.'==','SUQ'.'=','c29jaW'.'FsbmV'.'0d2'.'9y'.'aw==','YW'.'x'.'sb3dfdGFza3Nf'.'Z3'.'JvdXA'.'=',''.'SUQ=','c29jaWF'.'sb'.'mV0d29yaw==','Y'.'Wxsb3d'.'f'.'dG'.'Fza3N'.'f'.'Z'.'3'.'JvdX'.'A=',''.'dGF'.'za'.'3M=','Tg==','','','QU'.'NU'.'SVZF','WQ==',''.'c2'.'9jaW'.'Fs'.'bmV0'.'d2'.'9ya'.'w='.'=',''.'YWxsb3'.'d'.'fY2FsZW'.'5k'.'YXJfd'.'XNlcg==',''.'W'.'Q'.'==','SUQ=','c2'.'9ja'.'WFsbmV0d29yaw='.'=','YWxsb3'.'dfY2FsZW5kYXJfd'.'X'.'Nlcg==',''.'SU'.'Q=',''.'c29'.'j'.'aWFsbmV0d29'.'yaw='.'=','Y'.'Wxs'.'b3df'.'Y2FsZW5kYXJfdXNlc'.'g==',''.'c29jaWFsbmV0'.'d2'.'9ya'.'w==',''.'YWxsb3df'.'Y2Fs'.'ZW'.'5'.'kY'.'X'.'Jf'.'Z3Jv'.'dX'.'A=','WQ='.'=','S'.'U'.'Q'.'=','c'.'29jaWFsb'.'mV0d29ya'.'w'.'==','YWxs'.'b'.'3d'.'f'.'Y2FsZW5k'.'YX'.'J'.'fZ3J'.'v'.'dXA=','SUQ=',''.'c'.'29ja'.'W'.'Fsb'.'mV0d29yaw==','Y'.'Wxsb3'.'dfY2'.'F'.'sZ'.'W5'.'kYXJfZ3'.'JvdXA=','Q'.'U'.'N'.'USVZ'.'F','WQ='.'=','Tg==','ZXh0cmFuZXQ=','aWJs'.'b2'.'Nr','T'.'25'.'B'.'ZnRlcklCbG'.'9ja0VsZ'.'W'.'1lbnRVc'.'GRhdGU=','aW50cmF'.'uZ'.'XQ=','Q0lu'.'dHJ'.'hb'.'mV0'.'RXZl'.'bnRI'.'YW5'.'k'.'b'.'GV'.'y'.'cw==','U1'.'BSZWdpc3RlclVwZ'.'G'.'F0ZWRJd'.'G'.'Vt',''.'Q'.'0ludHJ'.'hbmV0'.'U2'.'hhcmVw'.'b2'.'l'.'udDo'.'6'.'QWdlb'.'nRMaX'.'N0cy'.'gpOw==','aW5'.'0cmFuZXQ=','Tg==','Q'.'0l'.'udHJhbmV0U2'.'hhcm'.'Vwb2ludDo6Q'.'WdlbnRR'.'dWV'.'1ZSgpOw='.'=','aW50'.'cmFu'.'ZXQ=','Tg==',''.'Q'.'0lud'.'H'.'Jh'.'b'.'m'.'V0U2hhcmVwb2'.'ludD'.'o6QWd'.'lbnRVcGRhdGU'.'oKTs'.'=',''.'aW50c'.'mF'.'uZXQ=',''.'Tg==',''.'aWJsb2Nr','T'.'2'.'5B'.'ZnRlcklCb'.'G9j'.'a0VsZW1l'.'bnRBZGQ=',''.'aW50'.'cmF'.'uZXQ=','Q0'.'ludHJhbmV0'.'R'.'XZlbnRIYW5kbGVyc'.'w==',''.'U1BSZWdpc3RlclVwZGF0Z'.'WRJdGVt',''.'aWJsb2Nr','T25BZnRlckl'.'CbG9'.'ja0'.'V'.'sZW1lbnRVcGR'.'hdGU=','aW50c'.'mFuZXQ=','Q0lud'.'HJh'.'bm'.'V0RXZlbnRIYW5k'.'bGVy'.'cw==','U'.'1'.'B'.'SZ'.'W'.'dpc3Rlcl'.'VwZG'.'F0ZWRJ'.'dGVt','Q0ludHJ'.'hbmV0U2'.'hhcm'.'Vwb2ludDo6QWdl'.'bn'.'RMaXN0cygpOw==','aW50cmFuZXQ'.'=','Q0ludHJhbmV'.'0U2hh'.'cm'.'Vwb2ludDo'.'6QWdlbnRRdWV'.'1ZSgpOw==','a'.'W'.'50cmFu'.'ZXQ=',''.'Q0l'.'ud'.'HJhbm'.'V'.'0U2'.'hhcmVwb2lud'.'Do6'.'QWdlbnRVcG'.'R'.'h'.'dGUoKTs=','aW50cmFuZXQ=','Y'.'3J'.'t','b'.'WFpb'.'g='.'=','T25C'.'ZWZvcmVQc'.'m9sb2c=','bWF'.'pb'.'g='.'=','Q1d'.'pemF'.'yZ'.'F'.'NvbF'.'Bhb'.'mVsSW50'.'cm'.'FuZXQ'.'=','U2hv'.'d1'.'Bh'.'bmVs','L21vZHVs'.'ZXM'.'vaW5'.'0cmFuZXQv'.'cG'.'FuZWx'.'fYnV0dG9uLnB'.'ocA==','RU5D'.'T0'.'R'.'F',''.'WQ'.'==');return base64_decode($_261787316[$_719392118]);}};$GLOBALS['____911947049'][0](___524490372(0), ___524490372(1));class CBXFeatures{ private static $_1096922598= 30; private static $_515286847= array( "Portal" => array( "CompanyCalendar", "CompanyPhoto", "CompanyVideo", "CompanyCareer", "StaffChanges", "StaffAbsence", "CommonDocuments", "MeetingRoomBookingSystem", "Wiki", "Learning", "Vote", "WebLink", "Subscribe", "Friends", "PersonalFiles", "PersonalBlog", "PersonalPhoto", "PersonalForum", "Blog", "Forum", "Gallery", "Board", "MicroBlog", "WebMessenger",), "Communications" => array( "Tasks", "Calendar", "Workgroups", "Jabber", "VideoConference", "Extranet", "SMTP", "Requests", "DAV", "intranet_sharepoint", "timeman", "Idea", "Meeting", "EventList", "Salary", "XDImport",), "Enterprise" => array( "BizProc", "Lists", "Support", "Analytics", "crm", "Controller", "LdapUnlimitedUsers",), "Holding" => array( "Cluster", "MultiSites",),); private static $_733834746= null; private static $_1772547426= null; private static function __440712057(){ if(self::$_733834746 === null){ self::$_733834746= array(); foreach(self::$_515286847 as $_264531656 => $_831157214){ foreach($_831157214 as $_656939469) self::$_733834746[$_656939469]= $_264531656;}} if(self::$_1772547426 === null){ self::$_1772547426= array(); $_11781872= COption::GetOptionString(___524490372(2), ___524490372(3), ___524490372(4)); if($_11781872 != ___524490372(5)){ $_11781872= $GLOBALS['____911947049'][1]($_11781872); $_11781872= $GLOBALS['____911947049'][2]($_11781872,[___524490372(6) => false]); if($GLOBALS['____911947049'][3]($_11781872)){ self::$_1772547426= $_11781872;}} if(empty(self::$_1772547426)){ self::$_1772547426= array(___524490372(7) => array(), ___524490372(8) => array());}}} public static function InitiateEditionsSettings($_1999548816){ self::__440712057(); $_1495922097= array(); foreach(self::$_515286847 as $_264531656 => $_831157214){ $_680818428= $GLOBALS['____911947049'][4]($_264531656, $_1999548816); self::$_1772547426[___524490372(9)][$_264531656]=($_680818428? array(___524490372(10)): array(___524490372(11))); foreach($_831157214 as $_656939469){ self::$_1772547426[___524490372(12)][$_656939469]= $_680818428; if(!$_680818428) $_1495922097[]= array($_656939469, false);}} $_290558134= $GLOBALS['____911947049'][5](self::$_1772547426); $_290558134= $GLOBALS['____911947049'][6]($_290558134); COption::SetOptionString(___524490372(13), ___524490372(14), $_290558134); foreach($_1495922097 as $_731077838) self::__1324787096($_731077838[(135*2-270)], $_731077838[round(0+0.2+0.2+0.2+0.2+0.2)]);} public static function IsFeatureEnabled($_656939469){ if($_656939469 == '') return true; self::__440712057(); if(!isset(self::$_733834746[$_656939469])) return true; if(self::$_733834746[$_656939469] == ___524490372(15)) $_1350330720= array(___524490372(16)); elseif(isset(self::$_1772547426[___524490372(17)][self::$_733834746[$_656939469]])) $_1350330720= self::$_1772547426[___524490372(18)][self::$_733834746[$_656939469]]; else $_1350330720= array(___524490372(19)); if($_1350330720[(146*2-292)] != ___524490372(20) && $_1350330720[min(184,0,61.333333333333)] != ___524490372(21)){ return false;} elseif($_1350330720[(1080/2-540)] == ___524490372(22)){ if($_1350330720[round(0+0.5+0.5)]< $GLOBALS['____911947049'][7](min(96,0,32), min(194,0,64.666666666667),(217*2-434), Date(___524490372(23)), $GLOBALS['____911947049'][8](___524490372(24))- self::$_1096922598, $GLOBALS['____911947049'][9](___524490372(25)))){ if(!isset($_1350330720[round(0+0.4+0.4+0.4+0.4+0.4)]) ||!$_1350330720[round(0+0.66666666666667+0.66666666666667+0.66666666666667)]) self::__907188086(self::$_733834746[$_656939469]); return false;}} return!isset(self::$_1772547426[___524490372(26)][$_656939469]) || self::$_1772547426[___524490372(27)][$_656939469];} public static function IsFeatureInstalled($_656939469){ if($GLOBALS['____911947049'][10]($_656939469) <= 0) return true; self::__440712057(); return(isset(self::$_1772547426[___524490372(28)][$_656939469]) && self::$_1772547426[___524490372(29)][$_656939469]);} public static function IsFeatureEditable($_656939469){ if($_656939469 == '') return true; self::__440712057(); if(!isset(self::$_733834746[$_656939469])) return true; if(self::$_733834746[$_656939469] == ___524490372(30)) $_1350330720= array(___524490372(31)); elseif(isset(self::$_1772547426[___524490372(32)][self::$_733834746[$_656939469]])) $_1350330720= self::$_1772547426[___524490372(33)][self::$_733834746[$_656939469]]; else $_1350330720= array(___524490372(34)); if($_1350330720[(1232/2-616)] != ___524490372(35) && $_1350330720[(209*2-418)] != ___524490372(36)){ return false;} elseif($_1350330720[(178*2-356)] == ___524490372(37)){ if($_1350330720[round(0+0.33333333333333+0.33333333333333+0.33333333333333)]< $GLOBALS['____911947049'][11](min(230,0,76.666666666667),(756-2*378),(186*2-372), Date(___524490372(38)), $GLOBALS['____911947049'][12](___524490372(39))- self::$_1096922598, $GLOBALS['____911947049'][13](___524490372(40)))){ if(!isset($_1350330720[round(0+0.5+0.5+0.5+0.5)]) ||!$_1350330720[round(0+0.4+0.4+0.4+0.4+0.4)]) self::__907188086(self::$_733834746[$_656939469]); return false;}} return true;} private static function __1324787096($_656939469, $_702688816){ if($GLOBALS['____911947049'][14]("CBXFeatures", "On".$_656939469."SettingsChange")) $GLOBALS['____911947049'][15](array("CBXFeatures", "On".$_656939469."SettingsChange"), array($_656939469, $_702688816)); $_910465919= $GLOBALS['_____1192492250'][0](___524490372(41), ___524490372(42).$_656939469.___524490372(43)); while($_254836823= $_910465919->Fetch()) $GLOBALS['_____1192492250'][1]($_254836823, array($_656939469, $_702688816));} public static function SetFeatureEnabled($_656939469, $_702688816= true, $_1562633680= true){ if($GLOBALS['____911947049'][16]($_656939469) <= 0) return; if(!self::IsFeatureEditable($_656939469)) $_702688816= false; $_702688816= (bool)$_702688816; self::__440712057(); $_1318883371=(!isset(self::$_1772547426[___524490372(44)][$_656939469]) && $_702688816 || isset(self::$_1772547426[___524490372(45)][$_656939469]) && $_702688816 != self::$_1772547426[___524490372(46)][$_656939469]); self::$_1772547426[___524490372(47)][$_656939469]= $_702688816; $_290558134= $GLOBALS['____911947049'][17](self::$_1772547426); $_290558134= $GLOBALS['____911947049'][18]($_290558134); COption::SetOptionString(___524490372(48), ___524490372(49), $_290558134); if($_1318883371 && $_1562633680) self::__1324787096($_656939469, $_702688816);} private static function __907188086($_264531656){ if($GLOBALS['____911947049'][19]($_264531656) <= 0 || $_264531656 == "Portal") return; self::__440712057(); if(!isset(self::$_1772547426[___524490372(50)][$_264531656]) || self::$_1772547426[___524490372(51)][$_264531656][(157*2-314)] != ___524490372(52)) return; if(isset(self::$_1772547426[___524490372(53)][$_264531656][round(0+1+1)]) && self::$_1772547426[___524490372(54)][$_264531656][round(0+0.5+0.5+0.5+0.5)]) return; $_1495922097= array(); if(isset(self::$_515286847[$_264531656]) && $GLOBALS['____911947049'][20](self::$_515286847[$_264531656])){ foreach(self::$_515286847[$_264531656] as $_656939469){ if(isset(self::$_1772547426[___524490372(55)][$_656939469]) && self::$_1772547426[___524490372(56)][$_656939469]){ self::$_1772547426[___524490372(57)][$_656939469]= false; $_1495922097[]= array($_656939469, false);}} self::$_1772547426[___524490372(58)][$_264531656][round(0+0.4+0.4+0.4+0.4+0.4)]= true;} $_290558134= $GLOBALS['____911947049'][21](self::$_1772547426); $_290558134= $GLOBALS['____911947049'][22]($_290558134); COption::SetOptionString(___524490372(59), ___524490372(60), $_290558134); foreach($_1495922097 as $_731077838) self::__1324787096($_731077838[(1376/2-688)], $_731077838[round(0+0.2+0.2+0.2+0.2+0.2)]);} public static function ModifyFeaturesSettings($_1999548816, $_831157214){ self::__440712057(); foreach($_1999548816 as $_264531656 => $_247063348) self::$_1772547426[___524490372(61)][$_264531656]= $_247063348; $_1495922097= array(); foreach($_831157214 as $_656939469 => $_702688816){ if(!isset(self::$_1772547426[___524490372(62)][$_656939469]) && $_702688816 || isset(self::$_1772547426[___524490372(63)][$_656939469]) && $_702688816 != self::$_1772547426[___524490372(64)][$_656939469]) $_1495922097[]= array($_656939469, $_702688816); self::$_1772547426[___524490372(65)][$_656939469]= $_702688816;} $_290558134= $GLOBALS['____911947049'][23](self::$_1772547426); $_290558134= $GLOBALS['____911947049'][24]($_290558134); COption::SetOptionString(___524490372(66), ___524490372(67), $_290558134); self::$_1772547426= null; foreach($_1495922097 as $_731077838) self::__1324787096($_731077838[(920-2*460)], $_731077838[round(0+0.2+0.2+0.2+0.2+0.2)]);} public static function SaveFeaturesSettings($_1497944098, $_1154904007){ self::__440712057(); $_1593141836= array(___524490372(68) => array(), ___524490372(69) => array()); if(!$GLOBALS['____911947049'][25]($_1497944098)) $_1497944098= array(); if(!$GLOBALS['____911947049'][26]($_1154904007)) $_1154904007= array(); if(!$GLOBALS['____911947049'][27](___524490372(70), $_1497944098)) $_1497944098[]= ___524490372(71); foreach(self::$_515286847 as $_264531656 => $_831157214){ if(isset(self::$_1772547426[___524490372(72)][$_264531656])){ $_2043543235= self::$_1772547426[___524490372(73)][$_264531656];} else{ $_2043543235=($_264531656 == ___524490372(74)? array(___524490372(75)): array(___524490372(76)));} if($_2043543235[(151*2-302)] == ___524490372(77) || $_2043543235[(1140/2-570)] == ___524490372(78)){ $_1593141836[___524490372(79)][$_264531656]= $_2043543235;} else{ if($GLOBALS['____911947049'][28]($_264531656, $_1497944098)) $_1593141836[___524490372(80)][$_264531656]= array(___524490372(81), $GLOBALS['____911947049'][29]((886-2*443),(1376/2-688), min(214,0,71.333333333333), $GLOBALS['____911947049'][30](___524490372(82)), $GLOBALS['____911947049'][31](___524490372(83)), $GLOBALS['____911947049'][32](___524490372(84)))); else $_1593141836[___524490372(85)][$_264531656]= array(___524490372(86));}} $_1495922097= array(); foreach(self::$_733834746 as $_656939469 => $_264531656){ if($_1593141836[___524490372(87)][$_264531656][min(190,0,63.333333333333)] != ___524490372(88) && $_1593141836[___524490372(89)][$_264531656][(1164/2-582)] != ___524490372(90)){ $_1593141836[___524490372(91)][$_656939469]= false;} else{ if($_1593141836[___524490372(92)][$_264531656][(224*2-448)] == ___524490372(93) && $_1593141836[___524490372(94)][$_264531656][round(0+1)]< $GLOBALS['____911947049'][33](min(72,0,24),(964-2*482),(148*2-296), Date(___524490372(95)), $GLOBALS['____911947049'][34](___524490372(96))- self::$_1096922598, $GLOBALS['____911947049'][35](___524490372(97)))) $_1593141836[___524490372(98)][$_656939469]= false; else $_1593141836[___524490372(99)][$_656939469]= $GLOBALS['____911947049'][36]($_656939469, $_1154904007); if(!isset(self::$_1772547426[___524490372(100)][$_656939469]) && $_1593141836[___524490372(101)][$_656939469] || isset(self::$_1772547426[___524490372(102)][$_656939469]) && $_1593141836[___524490372(103)][$_656939469] != self::$_1772547426[___524490372(104)][$_656939469]) $_1495922097[]= array($_656939469, $_1593141836[___524490372(105)][$_656939469]);}} $_290558134= $GLOBALS['____911947049'][37]($_1593141836); $_290558134= $GLOBALS['____911947049'][38]($_290558134); COption::SetOptionString(___524490372(106), ___524490372(107), $_290558134); self::$_1772547426= null; foreach($_1495922097 as $_731077838) self::__1324787096($_731077838[(207*2-414)], $_731077838[round(0+0.33333333333333+0.33333333333333+0.33333333333333)]);} public static function GetFeaturesList(){ self::__440712057(); $_492995638= array(); foreach(self::$_515286847 as $_264531656 => $_831157214){ if(isset(self::$_1772547426[___524490372(108)][$_264531656])){ $_2043543235= self::$_1772547426[___524490372(109)][$_264531656];} else{ $_2043543235=($_264531656 == ___524490372(110)? array(___524490372(111)): array(___524490372(112)));} $_492995638[$_264531656]= array( ___524490372(113) => $_2043543235[min(248,0,82.666666666667)], ___524490372(114) => $_2043543235[round(0+1)], ___524490372(115) => array(),); $_492995638[$_264531656][___524490372(116)]= false; if($_492995638[$_264531656][___524490372(117)] == ___524490372(118)){ $_492995638[$_264531656][___524490372(119)]= $GLOBALS['____911947049'][39](($GLOBALS['____911947049'][40]()- $_492995638[$_264531656][___524490372(120)])/ round(0+28800+28800+28800)); if($_492995638[$_264531656][___524490372(121)]> self::$_1096922598) $_492995638[$_264531656][___524490372(122)]= true;} foreach($_831157214 as $_656939469) $_492995638[$_264531656][___524490372(123)][$_656939469]=(!isset(self::$_1772547426[___524490372(124)][$_656939469]) || self::$_1772547426[___524490372(125)][$_656939469]);} return $_492995638;} private static function __650194552($_1614961047, $_462316728){ if(IsModuleInstalled($_1614961047) == $_462316728) return true; $_1484588704= $_SERVER[___524490372(126)].___524490372(127).$_1614961047.___524490372(128); if(!$GLOBALS['____911947049'][41]($_1484588704)) return false; include_once($_1484588704); $_452542218= $GLOBALS['____911947049'][42](___524490372(129), ___524490372(130), $_1614961047); if(!$GLOBALS['____911947049'][43]($_452542218)) return false; $_1738942403= new $_452542218; if($_462316728){ if(!$_1738942403->InstallDB()) return false; $_1738942403->InstallEvents(); if(!$_1738942403->InstallFiles()) return false;} else{ if(CModule::IncludeModule(___524490372(131))) CSearch::DeleteIndex($_1614961047); UnRegisterModule($_1614961047);} return true;} protected static function OnRequestsSettingsChange($_656939469, $_702688816){ self::__650194552("form", $_702688816);} protected static function OnLearningSettingsChange($_656939469, $_702688816){ self::__650194552("learning", $_702688816);} protected static function OnJabberSettingsChange($_656939469, $_702688816){ self::__650194552("xmpp", $_702688816);} protected static function OnVideoConferenceSettingsChange($_656939469, $_702688816){} protected static function OnBizProcSettingsChange($_656939469, $_702688816){ self::__650194552("bizprocdesigner", $_702688816);} protected static function OnListsSettingsChange($_656939469, $_702688816){ self::__650194552("lists", $_702688816);} protected static function OnWikiSettingsChange($_656939469, $_702688816){ self::__650194552("wiki", $_702688816);} protected static function OnSupportSettingsChange($_656939469, $_702688816){ self::__650194552("support", $_702688816);} protected static function OnControllerSettingsChange($_656939469, $_702688816){ self::__650194552("controller", $_702688816);} protected static function OnAnalyticsSettingsChange($_656939469, $_702688816){ self::__650194552("statistic", $_702688816);} protected static function OnVoteSettingsChange($_656939469, $_702688816){ self::__650194552("vote", $_702688816);} protected static function OnFriendsSettingsChange($_656939469, $_702688816){ if($_702688816) $_2638324= "Y"; else $_2638324= ___524490372(132); $_2114624703= CSite::GetList(___524490372(133), ___524490372(134), array(___524490372(135) => ___524490372(136))); while($_1292113215= $_2114624703->Fetch()){ if(COption::GetOptionString(___524490372(137), ___524490372(138), ___524490372(139), $_1292113215[___524490372(140)]) != $_2638324){ COption::SetOptionString(___524490372(141), ___524490372(142), $_2638324, false, $_1292113215[___524490372(143)]); COption::SetOptionString(___524490372(144), ___524490372(145), $_2638324);}}} protected static function OnMicroBlogSettingsChange($_656939469, $_702688816){ if($_702688816) $_2638324= "Y"; else $_2638324= ___524490372(146); $_2114624703= CSite::GetList(___524490372(147), ___524490372(148), array(___524490372(149) => ___524490372(150))); while($_1292113215= $_2114624703->Fetch()){ if(COption::GetOptionString(___524490372(151), ___524490372(152), ___524490372(153), $_1292113215[___524490372(154)]) != $_2638324){ COption::SetOptionString(___524490372(155), ___524490372(156), $_2638324, false, $_1292113215[___524490372(157)]); COption::SetOptionString(___524490372(158), ___524490372(159), $_2638324);} if(COption::GetOptionString(___524490372(160), ___524490372(161), ___524490372(162), $_1292113215[___524490372(163)]) != $_2638324){ COption::SetOptionString(___524490372(164), ___524490372(165), $_2638324, false, $_1292113215[___524490372(166)]); COption::SetOptionString(___524490372(167), ___524490372(168), $_2638324);}}} protected static function OnPersonalFilesSettingsChange($_656939469, $_702688816){ if($_702688816) $_2638324= "Y"; else $_2638324= ___524490372(169); $_2114624703= CSite::GetList(___524490372(170), ___524490372(171), array(___524490372(172) => ___524490372(173))); while($_1292113215= $_2114624703->Fetch()){ if(COption::GetOptionString(___524490372(174), ___524490372(175), ___524490372(176), $_1292113215[___524490372(177)]) != $_2638324){ COption::SetOptionString(___524490372(178), ___524490372(179), $_2638324, false, $_1292113215[___524490372(180)]); COption::SetOptionString(___524490372(181), ___524490372(182), $_2638324);}}} protected static function OnPersonalBlogSettingsChange($_656939469, $_702688816){ if($_702688816) $_2638324= "Y"; else $_2638324= ___524490372(183); $_2114624703= CSite::GetList(___524490372(184), ___524490372(185), array(___524490372(186) => ___524490372(187))); while($_1292113215= $_2114624703->Fetch()){ if(COption::GetOptionString(___524490372(188), ___524490372(189), ___524490372(190), $_1292113215[___524490372(191)]) != $_2638324){ COption::SetOptionString(___524490372(192), ___524490372(193), $_2638324, false, $_1292113215[___524490372(194)]); COption::SetOptionString(___524490372(195), ___524490372(196), $_2638324);}}} protected static function OnPersonalPhotoSettingsChange($_656939469, $_702688816){ if($_702688816) $_2638324= "Y"; else $_2638324= ___524490372(197); $_2114624703= CSite::GetList(___524490372(198), ___524490372(199), array(___524490372(200) => ___524490372(201))); while($_1292113215= $_2114624703->Fetch()){ if(COption::GetOptionString(___524490372(202), ___524490372(203), ___524490372(204), $_1292113215[___524490372(205)]) != $_2638324){ COption::SetOptionString(___524490372(206), ___524490372(207), $_2638324, false, $_1292113215[___524490372(208)]); COption::SetOptionString(___524490372(209), ___524490372(210), $_2638324);}}} protected static function OnPersonalForumSettingsChange($_656939469, $_702688816){ if($_702688816) $_2638324= "Y"; else $_2638324= ___524490372(211); $_2114624703= CSite::GetList(___524490372(212), ___524490372(213), array(___524490372(214) => ___524490372(215))); while($_1292113215= $_2114624703->Fetch()){ if(COption::GetOptionString(___524490372(216), ___524490372(217), ___524490372(218), $_1292113215[___524490372(219)]) != $_2638324){ COption::SetOptionString(___524490372(220), ___524490372(221), $_2638324, false, $_1292113215[___524490372(222)]); COption::SetOptionString(___524490372(223), ___524490372(224), $_2638324);}}} protected static function OnTasksSettingsChange($_656939469, $_702688816){ if($_702688816) $_2638324= "Y"; else $_2638324= ___524490372(225); $_2114624703= CSite::GetList(___524490372(226), ___524490372(227), array(___524490372(228) => ___524490372(229))); while($_1292113215= $_2114624703->Fetch()){ if(COption::GetOptionString(___524490372(230), ___524490372(231), ___524490372(232), $_1292113215[___524490372(233)]) != $_2638324){ COption::SetOptionString(___524490372(234), ___524490372(235), $_2638324, false, $_1292113215[___524490372(236)]); COption::SetOptionString(___524490372(237), ___524490372(238), $_2638324);} if(COption::GetOptionString(___524490372(239), ___524490372(240), ___524490372(241), $_1292113215[___524490372(242)]) != $_2638324){ COption::SetOptionString(___524490372(243), ___524490372(244), $_2638324, false, $_1292113215[___524490372(245)]); COption::SetOptionString(___524490372(246), ___524490372(247), $_2638324);}} self::__650194552(___524490372(248), $_702688816);} protected static function OnCalendarSettingsChange($_656939469, $_702688816){ if($_702688816) $_2638324= "Y"; else $_2638324= ___524490372(249); $_2114624703= CSite::GetList(___524490372(250), ___524490372(251), array(___524490372(252) => ___524490372(253))); while($_1292113215= $_2114624703->Fetch()){ if(COption::GetOptionString(___524490372(254), ___524490372(255), ___524490372(256), $_1292113215[___524490372(257)]) != $_2638324){ COption::SetOptionString(___524490372(258), ___524490372(259), $_2638324, false, $_1292113215[___524490372(260)]); COption::SetOptionString(___524490372(261), ___524490372(262), $_2638324);} if(COption::GetOptionString(___524490372(263), ___524490372(264), ___524490372(265), $_1292113215[___524490372(266)]) != $_2638324){ COption::SetOptionString(___524490372(267), ___524490372(268), $_2638324, false, $_1292113215[___524490372(269)]); COption::SetOptionString(___524490372(270), ___524490372(271), $_2638324);}}} protected static function OnSMTPSettingsChange($_656939469, $_702688816){ self::__650194552("mail", $_702688816);} protected static function OnExtranetSettingsChange($_656939469, $_702688816){ $_1729991532= COption::GetOptionString("extranet", "extranet_site", ""); if($_1729991532){ $_490187565= new CSite; $_490187565->Update($_1729991532, array(___524490372(272) =>($_702688816? ___524490372(273): ___524490372(274))));} self::__650194552(___524490372(275), $_702688816);} protected static function OnDAVSettingsChange($_656939469, $_702688816){ self::__650194552("dav", $_702688816);} protected static function OntimemanSettingsChange($_656939469, $_702688816){ self::__650194552("timeman", $_702688816);} protected static function Onintranet_sharepointSettingsChange($_656939469, $_702688816){ if($_702688816){ RegisterModuleDependences("iblock", "OnAfterIBlockElementAdd", "intranet", "CIntranetEventHandlers", "SPRegisterUpdatedItem"); RegisterModuleDependences(___524490372(276), ___524490372(277), ___524490372(278), ___524490372(279), ___524490372(280)); CAgent::AddAgent(___524490372(281), ___524490372(282), ___524490372(283), round(0+250+250)); CAgent::AddAgent(___524490372(284), ___524490372(285), ___524490372(286), round(0+60+60+60+60+60)); CAgent::AddAgent(___524490372(287), ___524490372(288), ___524490372(289), round(0+900+900+900+900));} else{ UnRegisterModuleDependences(___524490372(290), ___524490372(291), ___524490372(292), ___524490372(293), ___524490372(294)); UnRegisterModuleDependences(___524490372(295), ___524490372(296), ___524490372(297), ___524490372(298), ___524490372(299)); CAgent::RemoveAgent(___524490372(300), ___524490372(301)); CAgent::RemoveAgent(___524490372(302), ___524490372(303)); CAgent::RemoveAgent(___524490372(304), ___524490372(305));}} protected static function OncrmSettingsChange($_656939469, $_702688816){ if($_702688816) COption::SetOptionString("crm", "form_features", "Y"); self::__650194552(___524490372(306), $_702688816);} protected static function OnClusterSettingsChange($_656939469, $_702688816){ self::__650194552("cluster", $_702688816);} protected static function OnMultiSitesSettingsChange($_656939469, $_702688816){ if($_702688816) RegisterModuleDependences("main", "OnBeforeProlog", "main", "CWizardSolPanelIntranet", "ShowPanel", 100, "/modules/intranet/panel_button.php"); else UnRegisterModuleDependences(___524490372(307), ___524490372(308), ___524490372(309), ___524490372(310), ___524490372(311), ___524490372(312));} protected static function OnIdeaSettingsChange($_656939469, $_702688816){ self::__650194552("idea", $_702688816);} protected static function OnMeetingSettingsChange($_656939469, $_702688816){ self::__650194552("meeting", $_702688816);} protected static function OnXDImportSettingsChange($_656939469, $_702688816){ self::__650194552("xdimport", $_702688816);}} $GLOBALS['____911947049'][44](___524490372(313), ___524490372(314));/**/			//Do not remove this

// Component 2.0 template engines
$GLOBALS['arCustomTemplateEngines'] = [];

// User fields manager
$GLOBALS['USER_FIELD_MANAGER'] = new CUserTypeManager;

if (file_exists(($_fname = __DIR__ . "/classes/general/update_db_updater.php")))
{
	$US_HOST_PROCESS_MAIN = false;
	include $_fname;
}

if (($_fname = getLocalPath("init.php")) !== false)
{
	include_once $_SERVER["DOCUMENT_ROOT"] . $_fname;
}

if (($_fname = getLocalPath("php_interface/init.php", BX_PERSONAL_ROOT)) !== false)
{
	include_once $_SERVER["DOCUMENT_ROOT"] . $_fname;
}

if (($_fname = getLocalPath("php_interface/" . SITE_ID . "/init.php", BX_PERSONAL_ROOT)) !== false)
{
	include_once $_SERVER["DOCUMENT_ROOT"] . $_fname;
}

if ((!(defined("STATISTIC_ONLY") && STATISTIC_ONLY && !str_starts_with($GLOBALS["APPLICATION"]->GetCurPage(), BX_ROOT . "/admin/"))) && Option::get("main", "include_charset", "Y") == "Y" && LANG_CHARSET != '')
{
	header("Content-Type: text/html; charset=".LANG_CHARSET);
}

$license = $application->getLicense();
header("X-Powered-CMS: Bitrix Site Manager (" . ($license->isDemoKey() ? "DEMO" : $license->getPublicHashKey()) . ")");

if (Option::get("main", "update_devsrv") == "Y")
{
	header("X-DevSrv-CMS: Bitrix");
}

$healerOfEarlySessionStart = new HealerEarlySessionStart();
$healerOfEarlySessionStart->process($application->getKernelSession());

$kernelSession = $application->getKernelSession();
$kernelSession->start();
$application->getSessionLocalStorageManager()->setUniqueId($kernelSession->getId());

foreach (GetModuleEvents("main", "OnPageStart", true) as $arEvent)
{
	ExecuteModuleEventEx($arEvent);
}

//define global user object
$GLOBALS["USER"] = new CUser;

//session control from group policy
$arPolicy = $GLOBALS["USER"]->GetSecurityPolicy();
$currTime = time();
if (
	(
		//IP address changed
		$kernelSession['SESS_IP']
		&& $arPolicy["SESSION_IP_MASK"] != ''
		&& (
			(ip2long($arPolicy["SESSION_IP_MASK"]) & ip2long($kernelSession['SESS_IP']))
			!=
			(ip2long($arPolicy["SESSION_IP_MASK"]) & ip2long($_SERVER['REMOTE_ADDR']))
		)
	)
	||
	(
		//session timeout
		$arPolicy["SESSION_TIMEOUT"] > 0
		&& $kernelSession['SESS_TIME'] > 0
		&& ($currTime - $arPolicy["SESSION_TIMEOUT"] * 60) > $kernelSession['SESS_TIME']
	)
	||
	(
		//signed session
		isset($kernelSession["BX_SESSION_SIGN"])
		&& $kernelSession["BX_SESSION_SIGN"] !== bitrix_sess_sign()
	)
	||
	(
		//session manually expired, e.g. in $User->LoginHitByHash
		isSessionExpired()
	)
)
{
	$compositeSessionManager = $application->getCompositeSessionManager();
	$compositeSessionManager->destroy();

	$application->getSession()->setId(Main\Security\Random::getString(32));
	$compositeSessionManager->start();

	$GLOBALS["USER"] = new CUser;
}
$kernelSession['SESS_IP'] = $_SERVER['REMOTE_ADDR'] ?? null;
if (empty($kernelSession['SESS_TIME']))
{
	$kernelSession['SESS_TIME'] = $currTime;
}
elseif (($currTime - $kernelSession['SESS_TIME']) > 60)
{
	$kernelSession['SESS_TIME'] = $currTime;
}
if (!isset($kernelSession["BX_SESSION_SIGN"]))
{
	$kernelSession["BX_SESSION_SIGN"] = bitrix_sess_sign();
}

//session control from security module
if (
	(Option::get("main", "use_session_id_ttl", "N") == "Y")
	&& ((int)Option::get("main", "session_id_ttl", 0) > 0)
	&& !defined("BX_SESSION_ID_CHANGE")
)
{
	if (!isset($kernelSession['SESS_ID_TIME']))
	{
		$kernelSession['SESS_ID_TIME'] = $currTime;
	}
	elseif (($kernelSession['SESS_ID_TIME'] + (int)Option::get("main", "session_id_ttl")) < $kernelSession['SESS_TIME'])
	{
		$compositeSessionManager = $application->getCompositeSessionManager();
		$compositeSessionManager->regenerateId();

		$kernelSession['SESS_ID_TIME'] = $currTime;
	}
}

define("BX_STARTED", true);

if (isset($kernelSession['BX_ADMIN_LOAD_AUTH']))
{
	define('ADMIN_SECTION_LOAD_AUTH', 1);
	unset($kernelSession['BX_ADMIN_LOAD_AUTH']);
}

$formType = null;
$secureForms = false;
$bRsaError = false;
$USER_LID = false;

if (!defined("NOT_CHECK_PERMISSIONS") || NOT_CHECK_PERMISSIONS !== true)
{
	$doLogout = isset($_REQUEST["logout"]) && (strtolower($_REQUEST["logout"]) == "yes");

	if ($doLogout && $GLOBALS["USER"]->IsAuthorized())
	{
		$secureLogout = (Option::get("main", "secure_logout", "N") == "Y");

		if (!$secureLogout || check_bitrix_sessid())
		{
			$GLOBALS["USER"]->Logout();

			//store cookies for next hit (see CMain::GetSpreadCookieHTML())
			$GLOBALS["APPLICATION"]->StoreCookies();

			LocalRedirect($GLOBALS["APPLICATION"]->GetCurPageParam('', ['logout', 'sessid']));
		}
	}

	// authorize by cookies
	if (!$GLOBALS["USER"]->IsAuthorized())
	{
		$GLOBALS["USER"]->LoginByCookies();
	}

	$arAuthResult = false;

	//http basic and digest authorization
	if (($httpAuth = $GLOBALS["USER"]->LoginByHttpAuth()) !== null)
	{
		$arAuthResult = $httpAuth;
		$GLOBALS["APPLICATION"]->SetAuthResult($arAuthResult);
	}

	//Authorize user from authorization html form
	//Only POST is accepted
	if (!empty($_POST["AUTH_FORM"]))
	{
		if (Option::get('main', 'use_encrypted_auth', 'N') == 'Y')
		{
			//possible encrypted user password
			$sec = new CRsaSecurity();
			if (($arKeys = $sec->LoadKeys()))
			{
				$sec->SetKeys($arKeys);
				$errno = $sec->AcceptFromForm(['USER_PASSWORD', 'USER_CONFIRM_PASSWORD', 'USER_CURRENT_PASSWORD']);
				if ($errno == CRsaSecurity::ERROR_SESS_CHECK)
				{
					$arAuthResult = ["MESSAGE" => GetMessage("main_include_decode_pass_sess"), "TYPE" => "ERROR"];
				}
				elseif ($errno < 0)
				{
					$arAuthResult = ["MESSAGE" => GetMessage("main_include_decode_pass_err", ["#ERRCODE#" => $errno]), "TYPE" => "ERROR"];
				}

				if ($errno < 0)
				{
					$bRsaError = true;
				}
			}
		}

		if (!$bRsaError)
		{
			if (!defined("ADMIN_SECTION") || ADMIN_SECTION !== true)
			{
				$USER_LID = SITE_ID;
			}

			$formType = $_POST["TYPE"] ?? null;

			if (!empty($formType))
			{
				$secureForms = Option::get("main", "secure_auth_forms", "N") != "Y" || check_bitrix_sessid();

				if ($secureForms)
				{
					if ($formType == "AUTH")
					{
						$arAuthResult = $GLOBALS["USER"]->Login(
							$_POST["USER_LOGIN"] ?? '',
							$_POST["USER_PASSWORD"] ?? '',
							$_POST["USER_REMEMBER"] ?? ''
						);
					}
					elseif ($formType == "OTP")
					{
						$arAuthResult = $GLOBALS["USER"]->LoginByOtp(
							$_POST["USER_OTP"] ?? '',
							$_POST["OTP_REMEMBER"] ?? '',
							$_POST["captcha_word"] ?? '',
							$_POST["captcha_sid"] ?? ''
						);
					}
					elseif ($formType == "SEND_PWD")
					{
						$arAuthResult = CUser::SendPassword(
							$_POST["USER_LOGIN"] ?? '',
							$_POST["USER_EMAIL"] ?? '',
							$USER_LID,
							$_POST["captcha_word"] ?? '',
							$_POST["captcha_sid"] ?? '',
							$_POST["USER_PHONE_NUMBER"] ?? ''
						);
					}
					elseif ($formType == "CHANGE_PWD")
					{
						$arAuthResult = $GLOBALS["USER"]->ChangePassword(
							$_POST["USER_LOGIN"] ?? '',
							$_POST["USER_CHECKWORD"] ?? '',
							$_POST["USER_PASSWORD"] ?? '',
							$_POST["USER_CONFIRM_PASSWORD"] ?? '',
							$USER_LID,
							$_POST["captcha_word"] ?? '',
							$_POST["captcha_sid"] ?? '',
							true,
							$_POST["USER_PHONE_NUMBER"] ?? '',
							$_POST["USER_CURRENT_PASSWORD"] ?? ''
						);
					}
				}

				if ($formType == "AUTH" || $formType == "OTP")
				{
					//special login form in the control panel
					if ($arAuthResult === true && defined('ADMIN_SECTION') && ADMIN_SECTION === true)
					{
						//store cookies for next hit (see CMain::GetSpreadCookieHTML())
						$GLOBALS["APPLICATION"]->StoreCookies();
						$kernelSession['BX_ADMIN_LOAD_AUTH'] = true;

						// die() follows
						CMain::FinalActions('<script>window.onload=function(){(window.BX || window.parent.BX).AUTHAGENT.setAuthResult(false);};</script>');
					}
				}
			}
		}
		$GLOBALS["APPLICATION"]->SetAuthResult($arAuthResult);
	}
	elseif (!$GLOBALS["USER"]->IsAuthorized() && isset($_REQUEST['bx_hit_hash']))
	{
		//Authorize by unique URL
		$GLOBALS["USER"]->LoginHitByHash($_REQUEST['bx_hit_hash']);
	}
}

//logout or re-authorize the user if something importand has changed
$GLOBALS["USER"]->CheckAuthActions();

//magic short URI
if (defined("BX_CHECK_SHORT_URI") && BX_CHECK_SHORT_URI && CBXShortUri::CheckUri())
{
	//local redirect inside
	die();
}

//application password scope control
if (($applicationID = $GLOBALS["USER"]->getContext()->getApplicationId()) !== null)
{
	$appManager = Main\Authentication\ApplicationManager::getInstance();
	if ($appManager->checkScope($applicationID) !== true)
	{
		$event = new Main\Event("main", "onApplicationScopeError", ['APPLICATION_ID' => $applicationID]);
		$event->send();

		$context->getResponse()->setStatus("403 Forbidden");
		$application->end();
	}
}

//define the site template
if (!defined("ADMIN_SECTION") || ADMIN_SECTION !== true)
{
	$siteTemplate = "";
	if (!empty($_REQUEST["bitrix_preview_site_template"]) && is_string($_REQUEST["bitrix_preview_site_template"]) && $GLOBALS["USER"]->CanDoOperation('view_other_settings'))
	{
		//preview of site template
		$signer = new Main\Security\Sign\Signer();
		try
		{
			//protected by a sign
			$requestTemplate = $signer->unsign($_REQUEST["bitrix_preview_site_template"], "template_preview".bitrix_sessid());

			$aTemplates = CSiteTemplate::GetByID($requestTemplate);
			if ($template = $aTemplates->Fetch())
			{
				$siteTemplate = $template["ID"];

				//preview of unsaved template
				if (isset($_GET['bx_template_preview_mode']) && $_GET['bx_template_preview_mode'] == 'Y' && $GLOBALS["USER"]->CanDoOperation('edit_other_settings'))
				{
					define("SITE_TEMPLATE_PREVIEW_MODE", true);
				}
			}
		}
		catch (Main\Security\Sign\BadSignatureException)
		{
		}
	}
	if ($siteTemplate == "")
	{
		$siteTemplate = CSite::GetCurTemplate();
	}

	if (!defined('SITE_TEMPLATE_ID'))
	{
		define("SITE_TEMPLATE_ID", $siteTemplate);
	}

	if (!defined('SITE_TEMPLATE_PATH'))
	{
		define("SITE_TEMPLATE_PATH", getLocalPath('templates/'.SITE_TEMPLATE_ID, BX_PERSONAL_ROOT));
	}
}
else
{
	// prevents undefined constants
	if (!defined('SITE_TEMPLATE_ID'))
	{
		define('SITE_TEMPLATE_ID', '.default');
	}

	define('SITE_TEMPLATE_PATH', '/bitrix/templates/.default');
}

//magic parameters: show page creation time
if (isset($_GET["show_page_exec_time"]))
{
	if ($_GET["show_page_exec_time"] == "Y" || $_GET["show_page_exec_time"] == "N")
	{
		$kernelSession["SESS_SHOW_TIME_EXEC"] = $_GET["show_page_exec_time"];
	}
}

//magic parameters: show included file processing time
if (isset($_GET["show_include_exec_time"]))
{
	if ($_GET["show_include_exec_time"] == "Y" || $_GET["show_include_exec_time"] == "N")
	{
		$kernelSession["SESS_SHOW_INCLUDE_TIME_EXEC"] = $_GET["show_include_exec_time"];
	}
}

//magic parameters: show include areas
if (!empty($_GET["bitrix_include_areas"]))
{
	$GLOBALS["APPLICATION"]->SetShowIncludeAreas($_GET["bitrix_include_areas"]=="Y");
}

//magic sound
if ($GLOBALS["USER"]->IsAuthorized())
{
	$cookie_prefix = Option::get('main', 'cookie_name', 'BITRIX_SM');
	if (!isset($_COOKIE[$cookie_prefix.'_SOUND_LOGIN_PLAYED']))
	{
		$GLOBALS["APPLICATION"]->set_cookie('SOUND_LOGIN_PLAYED', 'Y', 0);
	}
}

//magic cache
Main\Composite\Engine::shouldBeEnabled();

// should be before proactive filter on OnBeforeProlog
$userPassword = $_POST["USER_PASSWORD"] ?? null;
$userConfirmPassword = $_POST["USER_CONFIRM_PASSWORD"] ?? null;

foreach(GetModuleEvents("main", "OnBeforeProlog", true) as $arEvent)
{
	ExecuteModuleEventEx($arEvent);
}

// need to reinit
$GLOBALS["APPLICATION"]->SetCurPage(false);

if (!defined("NOT_CHECK_PERMISSIONS") || NOT_CHECK_PERMISSIONS !== true)
{
	//Register user from authorization html form
	//Only POST is accepted
	if (!empty($_POST["AUTH_FORM"]) && $formType == "REGISTRATION")
	{
		if (!$bRsaError && $secureForms)
		{
			if (Option::get("main", "new_user_registration", "N") == "Y" && (!defined("ADMIN_SECTION") || ADMIN_SECTION !== true))
			{
				$arAuthResult = $GLOBALS["USER"]->Register(
					$_POST["USER_LOGIN"] ?? '',
					$_POST["USER_NAME"] ?? '',
					$_POST["USER_LAST_NAME"] ?? '',
					$userPassword,
					$userConfirmPassword,
					$_POST["USER_EMAIL"] ?? '',
					$USER_LID,
					$_POST["captcha_word"] ?? '',
					$_POST["captcha_sid"] ?? '',
					false,
					$_POST["USER_PHONE_NUMBER"] ?? ''
				);

				$GLOBALS["APPLICATION"]->SetAuthResult($arAuthResult);
			}
		}
	}
}

if ((!defined("NOT_CHECK_PERMISSIONS") || NOT_CHECK_PERMISSIONS !== true) && (!defined("NOT_CHECK_FILE_PERMISSIONS") || NOT_CHECK_FILE_PERMISSIONS !== true))
{
	$real_path = $context->getRequest()->getScriptFile();

	if (!$GLOBALS["USER"]->CanDoFileOperation('fm_view_file', [SITE_ID, $real_path]) || (defined("NEED_AUTH") && NEED_AUTH && !$GLOBALS["USER"]->IsAuthorized()))
	{
		if ($GLOBALS["USER"]->IsAuthorized() && empty($arAuthResult["MESSAGE"]))
		{
			$arAuthResult = ["MESSAGE" => GetMessage("ACCESS_DENIED").' '.GetMessage("ACCESS_DENIED_FILE", ["#FILE#" => $real_path]), "TYPE" => "ERROR"];

			if (Option::get("main", "event_log_permissions_fail", "N") === "Y")
			{
				CEventLog::Log(CEventLog::SEVERITY_SECURITY, "USER_PERMISSIONS_FAIL", "main", $GLOBALS["USER"]->GetID(), $real_path);
			}
		}

		if (defined("ADMIN_SECTION") && ADMIN_SECTION === true)
		{
			if (isset($_REQUEST["mode"]) && ($_REQUEST["mode"] === "list" || $_REQUEST["mode"] === "settings"))
			{
				echo "<script>top.location='".$GLOBALS["APPLICATION"]->GetCurPage()."?".DeleteParam(["mode"])."';</script>";
				die();
			}
			elseif (isset($_REQUEST["mode"]) && $_REQUEST["mode"] === "frame")
			{
				echo "<script>
					const w = (opener? opener.window:parent.window);
					w.location.href='" .$GLOBALS["APPLICATION"]->GetCurPage()."?".DeleteParam(["mode"])."';
				</script>";
				die();
			}
			elseif (defined("MOBILE_APP_ADMIN") && MOBILE_APP_ADMIN === true)
			{
				echo json_encode(["status" => "failed"]);
				die();
			}
		}

		/** @noinspection PhpUndefinedVariableInspection */
		$GLOBALS["APPLICATION"]->AuthForm($arAuthResult);
	}
}

/*ZDUyZmZNDRjMTQyMTBiYWM1MTZmMDU3MzEwY2VlNTVkN2EwZTA=*/$GLOBALS['____1403652808']= array(base64_decode('b'.'X'.'RfcmFuZA=='),base64_decode('Y'.'2FsbF91c2'.'VyX2'.'Z1bmM='),base64_decode('c'.'3R'.'ycG9z'),base64_decode('ZXhwbG9kZQ=='),base64_decode('cGFj'.'a'.'w=='),base64_decode(''.'bWQ1'),base64_decode('Y29uc3'.'RhbnQ='),base64_decode('aGFzaF9obWFj'),base64_decode('c3Ry'.'Y21w'),base64_decode('Y2FsbF9'.'1'.'c'.'2VyX2Z'.'1'.'b'.'mM='),base64_decode('Y2F'.'sbF9'.'1c2VyX2Z1bmM='),base64_decode('a'.'XNfb2JqZ'.'W'.'N0'),base64_decode('Y2Fsb'.'F91'.'c2VyX2Z1bmM='),base64_decode('Y2F'.'sbF91c2Vy'.'X'.'2'.'Z1bm'.'M='),base64_decode('Y2Fsb'.'F91c'.'2VyX2Z'.'1b'.'m'.'M='),base64_decode('Y2Fs'.'bF'.'91c'.'2V'.'y'.'X2Z1bmM='),base64_decode('Y2FsbF91'.'c2VyX'.'2Z1bm'.'M='),base64_decode('Y'.'2F'.'s'.'bF91c2V'.'y'.'X2Z1bm'.'M='));if(!function_exists(__NAMESPACE__.'\\___1682150530')){function ___1682150530($_848813472){static $_1998586630= false; if($_1998586630 == false) $_1998586630=array('XENPcHRpb246OkdldE'.'9wdGlvblN0cml'.'uZw==','b'.'WFpbg==','flBBUkFNX01B'.'WF9'.'VU0VSUw==','Lg==',''.'Lg==','SCo=','Y'.'ml0cml4','TElD'.'R'.'U5'.'TRV9LRVk=','c2hhMjU2','XE'.'NPcHRpb246Ok'.'d'.'ldE9w'.'dGlv'.'b'.'lN'.'0cmluZw==','bWFpb'.'g==','UEFS'.'QU1fTU'.'F'.'YX1V'.'TRVJT','XEJpdHJpeFxNYW'.'lu'.'XENvbm'.'ZpZ1xPc'.'HRpb246OnNldA==','bW'.'Fpb'.'g==','UEFSQU1fTU'.'FY'.'X1V'.'TRVJT',''.'VVN'.'FU'.'g==','VVNFUg'.'==','VVN'.'FUg'.'==','S'.'XNBdXRob3JpemV'.'k','VVNFUg==','SXNBZG'.'1pbg==','Q'.'VBQTElDQ'.'V'.'RJ'.'T04=','UmVzdGFydE'.'J1Zm'.'Zlc'.'g'.'==',''.'TG9jYWxS'.'ZWRpcmVjdA==',''.'L2x'.'pY2Vuc2VfcmVzdHJpY3Rpb'.'24uc'.'G'.'hw','XENPcHRp'.'b24'.'6'.'Okd'.'l'.'dE9'.'wdGlvb'.'lN0'.'cm'.'lu'.'Zw='.'=','bWFpbg==',''.'UEFSQU1fTUFYX1VTRVJT','XE'.'JpdHJpeFxNYWluXE'.'Nvbm'.'ZpZ1x'.'P'.'cHRp'.'b246On'.'NldA==',''.'bWFpbg==','U'.'EFSQU1fTU'.'FYX1VTRVJT');return base64_decode($_1998586630[$_848813472]);}};if($GLOBALS['____1403652808'][0](round(0+0.5+0.5), round(0+6.6666666666667+6.6666666666667+6.6666666666667)) == round(0+3.5+3.5)){ $_1100952217= $GLOBALS['____1403652808'][1](___1682150530(0), ___1682150530(1), ___1682150530(2)); if(!empty($_1100952217) && $GLOBALS['____1403652808'][2]($_1100952217, ___1682150530(3)) !== false){ list($_1454053418, $_704938486)= $GLOBALS['____1403652808'][3](___1682150530(4), $_1100952217); $_1387169373= $GLOBALS['____1403652808'][4](___1682150530(5), $_1454053418); $_370835546= ___1682150530(6).$GLOBALS['____1403652808'][5]($GLOBALS['____1403652808'][6](___1682150530(7))); $_978149302= $GLOBALS['____1403652808'][7](___1682150530(8), $_704938486, $_370835546, true); if($GLOBALS['____1403652808'][8]($_978149302, $_1387169373) !== min(212,0,70.666666666667)){ if($GLOBALS['____1403652808'][9](___1682150530(9), ___1682150530(10), ___1682150530(11)) != round(0+2.4+2.4+2.4+2.4+2.4)){ $GLOBALS['____1403652808'][10](___1682150530(12), ___1682150530(13), ___1682150530(14), round(0+12));} if(isset($GLOBALS[___1682150530(15)]) && $GLOBALS['____1403652808'][11]($GLOBALS[___1682150530(16)]) && $GLOBALS['____1403652808'][12](array($GLOBALS[___1682150530(17)], ___1682150530(18))) &&!$GLOBALS['____1403652808'][13](array($GLOBALS[___1682150530(19)], ___1682150530(20)))){ $GLOBALS['____1403652808'][14](array($GLOBALS[___1682150530(21)], ___1682150530(22))); $GLOBALS['____1403652808'][15](___1682150530(23), ___1682150530(24), true);}}} else{ if($GLOBALS['____1403652808'][16](___1682150530(25), ___1682150530(26), ___1682150530(27)) != round(0+12)){ $GLOBALS['____1403652808'][17](___1682150530(28), ___1682150530(29), ___1682150530(30), round(0+4+4+4));}}}/**/       //Do not remove this