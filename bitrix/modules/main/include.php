<?php

/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage main
 * @copyright 2001-2022 Bitrix
 */

use Bitrix\Main;
use Bitrix\Main\Session\Legacy\HealerEarlySessionStart;

require_once(__DIR__."/bx_root.php");
require_once(__DIR__."/start.php");

$application = Main\HttpApplication::getInstance();
$application->initializeExtendedKernel([
	"get" => $_GET,
	"post" => $_POST,
	"files" => $_FILES,
	"cookie" => $_COOKIE,
	"server" => $_SERVER,
	"env" => $_ENV
]);

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
define('SITE_SERVER_NAME', ($site ? $site->getServerName() : ''));
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

error_reporting(COption::GetOptionInt("main", "error_reporting", E_COMPILE_ERROR | E_ERROR | E_CORE_ERROR | E_PARSE) & ~E_STRICT & ~E_DEPRECATED & ~E_WARNING & ~E_NOTICE);

if(!defined("BX_COMP_MANAGED_CACHE") && COption::GetOptionString("main", "component_managed_cache_on", "Y") <> "N")
{
	define("BX_COMP_MANAGED_CACHE", true);
}

// global functions
require_once(__DIR__."/filter_tools.php");

define('BX_AJAX_PARAM_ID', 'bxajaxid');

/*ZDUyZmZNTQyZTc1NTI5MzNjMzAxNTNmYzNmNzZhYjQ0ZTM1NmM=*/$GLOBALS['_____1816152456']= array(base64_decode('R2V0TW9kd'.'Wxl'.'RXZlbnRz'),base64_decode('RXhl'.'Y3V0ZU1vZHV'.'s'.'ZU'.'V2'.'Z'.'W50RXg='));$GLOBALS['____1758271313']= array(base64_decode('ZGV'.'m'.'aW5l'),base64_decode('Ym'.'FzZT'.'Y0'.'X2Rl'.'Y29'.'kZQ=='),base64_decode('d'.'W'.'5z'.'Z'.'XJ'.'pYWx'.'pe'.'mU'.'='),base64_decode('aX'.'NfYXJyYXk='),base64_decode('aW'.'5'.'fYX'.'JyYXk='),base64_decode('c2V'.'y'.'aWFsa'.'Xpl'),base64_decode('YmFzZ'.'TY0X2V'.'uY'.'29kZQ=='),base64_decode('bWt0aW1'.'l'),base64_decode('Z'.'GF0Z'.'Q=='),base64_decode('ZGF0ZQ=='),base64_decode('c'.'3R'.'yb'.'GVu'),base64_decode('bW'.'t0a'.'W1'.'l'),base64_decode('ZG'.'F0ZQ=='),base64_decode('ZGF0ZQ=='),base64_decode('b'.'WV0aG9k'.'X2V4aXN'.'0cw=='),base64_decode('Y'.'2Fs'.'bF91'.'c2VyX2Z1bmNfYX'.'JyYXk='),base64_decode('c'.'3RybGVu'),base64_decode(''.'c2Vy'.'aWFsaX'.'pl'),base64_decode(''.'YmFzZ'.'TY0X'.'2VuY29kZQ=='),base64_decode('c'.'3Ryb'.'GVu'),base64_decode('aXNfYXJyYX'.'k='),base64_decode('c2VyaWFsaXp'.'l'),base64_decode('YmF'.'zZT'.'Y0X2V'.'uY'.'29k'.'ZQ=='),base64_decode('c'.'2Vy'.'a'.'WFs'.'aXpl'),base64_decode('YmFzZTY'.'0X2'.'V'.'uY29'.'kZ'.'Q=='),base64_decode('aXN'.'fYXJy'.'YXk='),base64_decode('aXNfYXJyY'.'Xk'.'='),base64_decode(''.'aW5fYXJyYXk='),base64_decode(''.'aW5fYX'.'J'.'yY'.'Xk='),base64_decode('bWt0aW'.'1'.'l'),base64_decode('ZGF'.'0'.'ZQ=='),base64_decode('ZGF0ZQ='.'='),base64_decode(''.'Z'.'GF0'.'ZQ=='),base64_decode('bW'.'t0a'.'W1l'),base64_decode('ZGF0ZQ=='),base64_decode('ZGF0Z'.'Q='.'='),base64_decode('aW'.'5'.'fYXJyYXk'.'='),base64_decode('c2VyaWF'.'saXpl'),base64_decode(''.'YmFzZTY0X2'.'Vu'.'Y29'.'kZQ=='),base64_decode('aW'.'50'.'d'.'mFs'),base64_decode('dG'.'lt'.'ZQ='.'='),base64_decode('ZmlsZV9leGlzdHM='),base64_decode('c3RyX'.'3Jl'.'cG'.'x'.'hY2U='),base64_decode('Y2xhc3NfZ'.'Xh'.'p'.'c3Rz'),base64_decode('ZGVmaW5'.'l'));if(!function_exists(__NAMESPACE__.'\\___191363642')){function ___191363642($_1453960136){static $_1906934372= false; if($_1906934372 == false) $_1906934372=array('SU5U'.'UkFO'.'R'.'VRfRU'.'RJV'.'ElPTg'.'==','WQ==','bWFpbg==','fmNwZl9tYX'.'Bf'.'dmFsdWU'.'=','','','YW'.'xsb3dlZF9jb'.'GFzc2'.'Vz','ZQ==','Zg==','ZQ==','Rg==','WA'.'==','Zg==','bWFpbg==','fmNwZl9t'.'YXBfdm'.'F'.'s'.'d'.'WU=','UG9ydG'.'Fs','Rg==','ZQ==','ZQ='.'=',''.'WA'.'==','R'.'g==','RA==','R'.'A==','bQ==','Z'.'A==','WQ'.'==','Z'.'g==','Zg'.'==','Zg==','Z'.'g='.'=','UG9ydGFs','Rg'.'==','ZQ'.'='.'=','ZQ==','WA='.'=','Rg==','RA==','RA='.'=',''.'bQ==','ZA==','WQ==','bWFpbg==','T'.'24=','U2'.'V0dGluZ3N'.'D'.'aGFuZ2U=',''.'Zg==','Zg==','Z'.'g'.'==',''.'Zg==','bWFp'.'bg==','f'.'mN'.'wZ'.'l9tY'.'XBfdmFsdWU=','Z'.'Q==','ZQ==',''.'RA==','Z'.'Q='.'=','ZQ'.'==','Zg'.'==','Zg==','Zg'.'='.'=','ZQ==','bW'.'Fpbg==','fmNwZl9'.'tYXBf'.'dmFsdWU=','ZQ==','Zg='.'=',''.'Z'.'g==','Zg'.'==','Z'.'g==','bWFp'.'bg==','fmNwZl9tYX'.'BfdmF'.'sdWU=',''.'ZQ==','Z'.'g==',''.'UG9'.'y'.'dG'.'Fs',''.'UG9ydGFs','Z'.'Q==','UG'.'9ydG'.'Fs','Rg==','WA==',''.'Rg='.'=','RA='.'=',''.'ZQ==','ZQ==','RA==','b'.'Q'.'==','ZA==','WQ==','ZQ==','WA'.'==','Z'.'Q==','R'.'g='.'=','ZQ==',''.'RA==','Z'.'g==','ZQ'.'==','R'.'A==','Z'.'Q==',''.'bQ==',''.'ZA==','WQ==','Zg'.'==','Zg==','Zg'.'==','Z'.'g='.'=','Zg==','Zg'.'==','Zg==','Zg==','bWFp'.'bg==','fmNw'.'Z'.'l9tY'.'X'.'BfdmFsdWU=','ZQ==','UG9ydGF'.'s','Rg==','WA==','VFlQRQ==',''.'R'.'EFURQ==','RkVBVFVSRVM=','RVhQ'.'SV'.'JFR'.'A==','V'.'FlQRQ==','RA==',''.'VFJ'.'ZX'.'0RBWVNfQ09V'.'TlQ'.'=','R'.'E'.'FUR'.'Q==','VF'.'JZX'.'0RB'.'WVNfQ09V'.'TlQ=','RVhQSVJF'.'RA==','RkVBVFV'.'SR'.'V'.'M'.'=','Zg==','Zg==','RE9DVU'.'1FTlR'.'fUk9PVA==','L2Jp'.'dH'.'JpeC9tb2R1bGVzL'.'w==',''.'L'.'2luc3RhbGwvaW5'.'k'.'Z'.'X'.'gucGhw','Lg==','Xw==','c'.'2Vh'.'cmNo','Tg='.'=','','','QUNU'.'SV'.'ZF','WQ==','c29ja'.'WF'.'sbm'.'V0d'.'29ya'.'w==','YWxsb'.'3df'.'ZnJp'.'Z'.'Wxkc'.'w==','WQ==','SUQ'.'=',''.'c2'.'9jaWFsbmV0d'.'2'.'9yaw==','YWxs'.'b3d'.'fZn'.'J'.'pZWxkcw==','SU'.'Q=','c2'.'9jaWFsbmV0d29yaw==','YW'.'xsb'.'3dfZ'.'nJpZWx'.'kcw==',''.'Tg'.'==','','','QUNUSV'.'Z'.'F','WQ'.'==','c29'.'jaW'.'Fsbm'.'V0d2'.'9'.'yaw==','YWxsb3df'.'bWljcm9'.'ib'.'G9n'.'X3VzZ'.'XI=',''.'W'.'Q'.'==','S'.'UQ=','c2'.'9jaWFs'.'bmV0d29ya'.'w==','YWxsb3dfbW'.'l'.'jc'.'m9ibG'.'9nX'.'3'.'VzZXI=','SU'.'Q'.'=','c29'.'ja'.'WFs'.'bmV0d29'.'yaw==','Y'.'W'.'xsb3dfb'.'Wljc'.'m'.'9ibG9'.'nX3VzZXI=','c29'.'jaWFsbmV'.'0d29yaw==','YW'.'xsb3dfbWljcm9ibG9n'.'X'.'2'.'d'.'yb'.'3Vw','WQ==','S'.'UQ=','c29j'.'aWFsbm'.'V0d29y'.'aw==','YWxs'.'b3dfbWljcm'.'9ibG9nX2dyb3'.'Vw','SUQ=','c29'.'jaWFs'.'bmV'.'0d29y'.'aw'.'==','YWxsb3dfbWljcm9i'.'bG9nX2dyb3'.'Vw','Tg==','','','QU'.'NUS'.'VZF','W'.'Q==','c29jaWFs'.'bmV0d'.'2'.'9yaw==','YWx'.'sb3'.'dfZmls'.'Z'.'XNfdXNlcg==','WQ==','SUQ=',''.'c'.'29jaWFsb'.'mV0d29yaw==','YW'.'x'.'sb3df'.'ZmlsZXNf'.'dX'.'N'.'lc'.'g==',''.'SUQ=','c29'.'jaWF'.'sbm'.'V0'.'d29y'.'aw==','Y'.'Wx'.'sb3dfZ'.'m'.'l'.'sZX'.'Nf'.'dX'.'N'.'lcg==','Tg==','','','QUN'.'US'.'VZ'.'F',''.'WQ'.'==',''.'c29jaW'.'FsbmV0d29yaw==',''.'YWxsb3d'.'fYmxvZ1'.'9'.'1c2Vy','WQ'.'==',''.'SUQ=',''.'c'.'2'.'9ja'.'W'.'F'.'sbmV0d'.'29yaw==','Y'.'W'.'xsb3dfY'.'mx'.'v'.'Z191c2Vy','S'.'UQ=','c29j'.'aWFsbmV0d29ya'.'w==','YWxsb3df'.'Ym'.'xvZ'.'191'.'c'.'2Vy',''.'T'.'g==','','','Q'.'UNUSVZF','WQ='.'=','c2'.'9jaWF'.'sbm'.'V0d29ya'.'w='.'=','YW'.'xsb'.'3dfcGhvdG9fdX'.'Nlcg==','WQ'.'==','SUQ=','c29jaWFsbmV0d29yaw==','YWxsb3dfcGhv'.'dG9fdXNlc'.'g'.'==','S'.'UQ=','c29jaW'.'Fsbm'.'V'.'0d29y'.'a'.'w==','YWxsb'.'3dfcGhvdG9fdXNl'.'cg'.'==','Tg='.'=','','','QUNUS'.'VZF','WQ'.'='.'=','c2'.'9j'.'aWFs'.'b'.'m'.'V0d29ya'.'w==','Y'.'Wxsb3df'.'Zm9ydW'.'1f'.'dXNlcg'.'='.'=',''.'WQ==','SUQ'.'=','c29'.'ja'.'WFsb'.'mV0d29yaw'.'==','YWxsb3d'.'fZm9ydW1fdXNlcg==',''.'SUQ=','c29j'.'aWFsbmV0d2'.'9'.'yaw==','YWx'.'sb3dfZm'.'9ydW1f'.'dXNlcg==','Tg==','','','QUNUSVZF','WQ==','c2'.'9jaWF'.'sbmV0d29ya'.'w==',''.'YWxsb3d'.'fdGFz'.'a'.'3Nf'.'d'.'XNlcg='.'=','WQ==',''.'SUQ=',''.'c2'.'9'.'jaWFs'.'bmV0'.'d2'.'9ya'.'w==','YWxs'.'b'.'3dfdGFza3'.'N'.'fdXNlcg==','SU'.'Q=','c29ja'.'WFsb'.'mV0'.'d29yaw==','YWx'.'s'.'b3dfdG'.'Fz'.'a3Nf'.'dXN'.'lc'.'g==','c'.'29jaWFsbmV0d29'.'yaw==',''.'YWxsb3dfd'.'GF'.'za3'.'NfZ3JvdXA'.'=',''.'WQ==','SU'.'Q=','c29jaWFsbmV0d29'.'y'.'aw==','Y'.'Wxsb'.'3dfdGFza3'.'NfZ3Jvd'.'XA=','SUQ'.'=','c29jaWFsbmV'.'0d29ya'.'w='.'=','YWxsb3dfdG'.'F'.'za3'.'N'.'f'.'Z'.'3Jvd'.'XA=','d'.'GF'.'za'.'3M=','Tg==','','','QUN'.'USVZF','WQ==','c'.'29ja'.'WFsb'.'mV0'.'d2'.'9yaw==','YWxs'.'b'.'3dfY2F'.'sZW'.'5kYXJfdXNlcg='.'=',''.'W'.'Q==','SUQ=','c29jaWFsb'.'mV0d2'.'9yaw'.'='.'=','YWxsb'.'3dfY2'.'F'.'sZ'.'W5k'.'Y'.'XJ'.'f'.'dXN'.'lcg==','S'.'UQ=',''.'c'.'29ja'.'WFsb'.'mV'.'0d29yaw==','YWxsb3dfY2'.'FsZW5'.'kYXJf'.'d'.'XN'.'lc'.'g==','c29jaW'.'Fs'.'bmV0d29yaw==','YWxsb'.'3dfY2'.'FsZW5k'.'Y'.'X'.'JfZ3Jv'.'dXA=','WQ==','SUQ'.'=','c29jaWFsbmV0d29yaw==',''.'YWxsb'.'3d'.'fY2Fs'.'Z'.'W5kYXJf'.'Z3JvdX'.'A=','S'.'UQ=','c2'.'9'.'j'.'a'.'W'.'FsbmV'.'0'.'d29yaw==',''.'YWxsb3dfY'.'2FsZ'.'W5kY'.'XJ'.'fZ3Jvd'.'XA'.'=','Q'.'UNUSVZF','WQ==','Tg==','ZXh0cmFuZXQ=','aWJsb2Nr','T2'.'5BZ'.'nRlcklCb'.'G9ja0VsZW1l'.'bn'.'RVcGRhdGU'.'=',''.'aW50'.'cmFuZX'.'Q=','Q0ludHJhbm'.'V'.'0'.'RXZlbnRIYW5'.'kbG'.'Vycw='.'=','U1BSZWdpc3Rlcl'.'Vw'.'ZGF0ZWRJ'.'dGVt','Q0l'.'u'.'dHJhbmV0U2'.'hhc'.'m'.'Vwb2l'.'u'.'dDo6QWdlb'.'nRMaXN0cygpOw==','a'.'W50cm'.'Fu'.'ZXQ=','T'.'g==','Q0'.'l'.'u'.'d'.'HJhbmV'.'0'.'U2'.'hhcmVwb2ludDo'.'6QWdlbn'.'RRd'.'WV1ZSgpOw==',''.'aW'.'5'.'0c'.'mFuZ'.'XQ=','Tg==',''.'Q0l'.'udHJhbmV0U2h'.'hcmVwb'.'2ludDo6QWdlbnRVcG'.'RhdG'.'UoKTs=','aW5'.'0cmFu'.'ZXQ=','T'.'g==',''.'aWJsb2Nr',''.'T2'.'5BZnRlcklC'.'b'.'G9ja'.'0VsZW1lbnRBZGQ'.'=','aW'.'50cmFuZXQ=','Q0lu'.'dHJhbmV'.'0RXZ'.'l'.'bnRIYW5'.'kb'.'G'.'V'.'ycw'.'==','U'.'1BSZWdp'.'c3'.'Rl'.'c'.'lVw'.'Z'.'GF0ZW'.'RJdGVt','aW'.'Jsb2Nr','T25BZnRlckl'.'CbG9ja'.'0VsZW1l'.'b'.'nRVcGRhd'.'GU=','aW'.'50c'.'m'.'FuZXQ=','Q0lud'.'HJ'.'hb'.'mV0RXZlb'.'nRI'.'YW'.'5k'.'bG'.'V'.'yc'.'w==','U1BSZWd'.'pc3Rlc'.'lVwZGF0ZWRJdG'.'Vt','Q0ludHJh'.'bmV0'.'U2h'.'hcmVwb2l'.'udDo6QWdlbnR'.'MaXN0c'.'y'.'gpO'.'w==','aW50'.'cm'.'F'.'uZX'.'Q=',''.'Q0'.'ludHJ'.'hbmV0U2'.'hhcmVwb2lud'.'Do6'.'QWdl'.'bnRRdWV'.'1ZSgpOw='.'=','a'.'W50cmFuZXQ=','Q'.'0ludHJhbmV0U2hh'.'c'.'mVwb2'.'lud'.'Do6QWdlbn'.'RVcGRhdGU'.'oKTs=','aW50cmFuZXQ=','Y3Jt','bWF'.'pbg==','T25'.'CZWZvcmVQcm9sb2c'.'=','bWFpbg'.'==','Q'.'1dpemFyZ'.'FNvbFBh'.'bm'.'VsSW50cm'.'FuZXQ=','U2hvd1BhbmVs','L21vZHVsZXM'.'vaW50cmFu'.'ZXQvc'.'GFu'.'ZW'.'xfYnV0dG9uLnB'.'ocA'.'='.'=','RU'.'5D'.'T0RF','WQ==');return base64_decode($_1906934372[$_1453960136]);}};$GLOBALS['____1758271313'][0](___191363642(0), ___191363642(1));class CBXFeatures{ private static $_1174112816= 30; private static $_1845745121= array( "Portal" => array( "CompanyCalendar", "CompanyPhoto", "CompanyVideo", "CompanyCareer", "StaffChanges", "StaffAbsence", "CommonDocuments", "MeetingRoomBookingSystem", "Wiki", "Learning", "Vote", "WebLink", "Subscribe", "Friends", "PersonalFiles", "PersonalBlog", "PersonalPhoto", "PersonalForum", "Blog", "Forum", "Gallery", "Board", "MicroBlog", "WebMessenger",), "Communications" => array( "Tasks", "Calendar", "Workgroups", "Jabber", "VideoConference", "Extranet", "SMTP", "Requests", "DAV", "intranet_sharepoint", "timeman", "Idea", "Meeting", "EventList", "Salary", "XDImport",), "Enterprise" => array( "BizProc", "Lists", "Support", "Analytics", "crm", "Controller", "LdapUnlimitedUsers",), "Holding" => array( "Cluster", "MultiSites",),); private static $_959698180= null; private static $_1351238637= null; private static function __99174713(){ if(self::$_959698180 === null){ self::$_959698180= array(); foreach(self::$_1845745121 as $_1176389958 => $_1406438419){ foreach($_1406438419 as $_586096733) self::$_959698180[$_586096733]= $_1176389958;}} if(self::$_1351238637 === null){ self::$_1351238637= array(); $_65446739= COption::GetOptionString(___191363642(2), ___191363642(3), ___191363642(4)); if($_65446739 != ___191363642(5)){ $_65446739= $GLOBALS['____1758271313'][1]($_65446739); $_65446739= $GLOBALS['____1758271313'][2]($_65446739,[___191363642(6) => false]); if($GLOBALS['____1758271313'][3]($_65446739)){ self::$_1351238637= $_65446739;}} if(empty(self::$_1351238637)){ self::$_1351238637= array(___191363642(7) => array(), ___191363642(8) => array());}}} public static function InitiateEditionsSettings($_1817452121){ self::__99174713(); $_404584359= array(); foreach(self::$_1845745121 as $_1176389958 => $_1406438419){ $_1420485295= $GLOBALS['____1758271313'][4]($_1176389958, $_1817452121); self::$_1351238637[___191363642(9)][$_1176389958]=($_1420485295? array(___191363642(10)): array(___191363642(11))); foreach($_1406438419 as $_586096733){ self::$_1351238637[___191363642(12)][$_586096733]= $_1420485295; if(!$_1420485295) $_404584359[]= array($_586096733, false);}} $_1938456363= $GLOBALS['____1758271313'][5](self::$_1351238637); $_1938456363= $GLOBALS['____1758271313'][6]($_1938456363); COption::SetOptionString(___191363642(13), ___191363642(14), $_1938456363); foreach($_404584359 as $_680919731) self::__173442164($_680919731[(860-2*430)], $_680919731[round(0+1)]);} public static function IsFeatureEnabled($_586096733){ if($_586096733 == '') return true; self::__99174713(); if(!isset(self::$_959698180[$_586096733])) return true; if(self::$_959698180[$_586096733] == ___191363642(15)) $_1884718084= array(___191363642(16)); elseif(isset(self::$_1351238637[___191363642(17)][self::$_959698180[$_586096733]])) $_1884718084= self::$_1351238637[___191363642(18)][self::$_959698180[$_586096733]]; else $_1884718084= array(___191363642(19)); if($_1884718084[(1452/2-726)] != ___191363642(20) && $_1884718084[(1024/2-512)] != ___191363642(21)){ return false;} elseif($_1884718084[min(124,0,41.333333333333)] == ___191363642(22)){ if($_1884718084[round(0+0.5+0.5)]< $GLOBALS['____1758271313'][7](min(144,0,48), min(220,0,73.333333333333),(163*2-326), Date(___191363642(23)), $GLOBALS['____1758271313'][8](___191363642(24))- self::$_1174112816, $GLOBALS['____1758271313'][9](___191363642(25)))){ if(!isset($_1884718084[round(0+1+1)]) ||!$_1884718084[round(0+0.66666666666667+0.66666666666667+0.66666666666667)]) self::__1123188183(self::$_959698180[$_586096733]); return false;}} return!isset(self::$_1351238637[___191363642(26)][$_586096733]) || self::$_1351238637[___191363642(27)][$_586096733];} public static function IsFeatureInstalled($_586096733){ if($GLOBALS['____1758271313'][10]($_586096733) <= 0) return true; self::__99174713(); return(isset(self::$_1351238637[___191363642(28)][$_586096733]) && self::$_1351238637[___191363642(29)][$_586096733]);} public static function IsFeatureEditable($_586096733){ if($_586096733 == '') return true; self::__99174713(); if(!isset(self::$_959698180[$_586096733])) return true; if(self::$_959698180[$_586096733] == ___191363642(30)) $_1884718084= array(___191363642(31)); elseif(isset(self::$_1351238637[___191363642(32)][self::$_959698180[$_586096733]])) $_1884718084= self::$_1351238637[___191363642(33)][self::$_959698180[$_586096733]]; else $_1884718084= array(___191363642(34)); if($_1884718084[(1208/2-604)] != ___191363642(35) && $_1884718084[min(46,0,15.333333333333)] != ___191363642(36)){ return false;} elseif($_1884718084[min(24,0,8)] == ___191363642(37)){ if($_1884718084[round(0+0.33333333333333+0.33333333333333+0.33333333333333)]< $GLOBALS['____1758271313'][11](min(98,0,32.666666666667),(1168/2-584),(988-2*494), Date(___191363642(38)), $GLOBALS['____1758271313'][12](___191363642(39))- self::$_1174112816, $GLOBALS['____1758271313'][13](___191363642(40)))){ if(!isset($_1884718084[round(0+0.66666666666667+0.66666666666667+0.66666666666667)]) ||!$_1884718084[round(0+0.4+0.4+0.4+0.4+0.4)]) self::__1123188183(self::$_959698180[$_586096733]); return false;}} return true;} private static function __173442164($_586096733, $_147644179){ if($GLOBALS['____1758271313'][14]("CBXFeatures", "On".$_586096733."SettingsChange")) $GLOBALS['____1758271313'][15](array("CBXFeatures", "On".$_586096733."SettingsChange"), array($_586096733, $_147644179)); $_501901265= $GLOBALS['_____1816152456'][0](___191363642(41), ___191363642(42).$_586096733.___191363642(43)); while($_296091707= $_501901265->Fetch()) $GLOBALS['_____1816152456'][1]($_296091707, array($_586096733, $_147644179));} public static function SetFeatureEnabled($_586096733, $_147644179= true, $_59438783= true){ if($GLOBALS['____1758271313'][16]($_586096733) <= 0) return; if(!self::IsFeatureEditable($_586096733)) $_147644179= false; $_147644179= (bool)$_147644179; self::__99174713(); $_1820441725=(!isset(self::$_1351238637[___191363642(44)][$_586096733]) && $_147644179 || isset(self::$_1351238637[___191363642(45)][$_586096733]) && $_147644179 != self::$_1351238637[___191363642(46)][$_586096733]); self::$_1351238637[___191363642(47)][$_586096733]= $_147644179; $_1938456363= $GLOBALS['____1758271313'][17](self::$_1351238637); $_1938456363= $GLOBALS['____1758271313'][18]($_1938456363); COption::SetOptionString(___191363642(48), ___191363642(49), $_1938456363); if($_1820441725 && $_59438783) self::__173442164($_586096733, $_147644179);} private static function __1123188183($_1176389958){ if($GLOBALS['____1758271313'][19]($_1176389958) <= 0 || $_1176389958 == "Portal") return; self::__99174713(); if(!isset(self::$_1351238637[___191363642(50)][$_1176389958]) || self::$_1351238637[___191363642(51)][$_1176389958][(1004/2-502)] != ___191363642(52)) return; if(isset(self::$_1351238637[___191363642(53)][$_1176389958][round(0+1+1)]) && self::$_1351238637[___191363642(54)][$_1176389958][round(0+0.5+0.5+0.5+0.5)]) return; $_404584359= array(); if(isset(self::$_1845745121[$_1176389958]) && $GLOBALS['____1758271313'][20](self::$_1845745121[$_1176389958])){ foreach(self::$_1845745121[$_1176389958] as $_586096733){ if(isset(self::$_1351238637[___191363642(55)][$_586096733]) && self::$_1351238637[___191363642(56)][$_586096733]){ self::$_1351238637[___191363642(57)][$_586096733]= false; $_404584359[]= array($_586096733, false);}} self::$_1351238637[___191363642(58)][$_1176389958][round(0+2)]= true;} $_1938456363= $GLOBALS['____1758271313'][21](self::$_1351238637); $_1938456363= $GLOBALS['____1758271313'][22]($_1938456363); COption::SetOptionString(___191363642(59), ___191363642(60), $_1938456363); foreach($_404584359 as $_680919731) self::__173442164($_680919731[(240*2-480)], $_680919731[round(0+0.5+0.5)]);} public static function ModifyFeaturesSettings($_1817452121, $_1406438419){ self::__99174713(); foreach($_1817452121 as $_1176389958 => $_729193570) self::$_1351238637[___191363642(61)][$_1176389958]= $_729193570; $_404584359= array(); foreach($_1406438419 as $_586096733 => $_147644179){ if(!isset(self::$_1351238637[___191363642(62)][$_586096733]) && $_147644179 || isset(self::$_1351238637[___191363642(63)][$_586096733]) && $_147644179 != self::$_1351238637[___191363642(64)][$_586096733]) $_404584359[]= array($_586096733, $_147644179); self::$_1351238637[___191363642(65)][$_586096733]= $_147644179;} $_1938456363= $GLOBALS['____1758271313'][23](self::$_1351238637); $_1938456363= $GLOBALS['____1758271313'][24]($_1938456363); COption::SetOptionString(___191363642(66), ___191363642(67), $_1938456363); self::$_1351238637= false; foreach($_404584359 as $_680919731) self::__173442164($_680919731[(1144/2-572)], $_680919731[round(0+1)]);} public static function SaveFeaturesSettings($_1701848993, $_23109764){ self::__99174713(); $_1004837720= array(___191363642(68) => array(), ___191363642(69) => array()); if(!$GLOBALS['____1758271313'][25]($_1701848993)) $_1701848993= array(); if(!$GLOBALS['____1758271313'][26]($_23109764)) $_23109764= array(); if(!$GLOBALS['____1758271313'][27](___191363642(70), $_1701848993)) $_1701848993[]= ___191363642(71); foreach(self::$_1845745121 as $_1176389958 => $_1406438419){ $_1548448947= self::$_1351238637[___191363642(72)][$_1176389958] ??($_1176389958 == ___191363642(73)? array(___191363642(74)): array(___191363642(75))); if($_1548448947[min(92,0,30.666666666667)] == ___191363642(76) || $_1548448947[min(150,0,50)] == ___191363642(77)){ $_1004837720[___191363642(78)][$_1176389958]= $_1548448947;} else{ if($GLOBALS['____1758271313'][28]($_1176389958, $_1701848993)) $_1004837720[___191363642(79)][$_1176389958]= array(___191363642(80), $GLOBALS['____1758271313'][29]((247*2-494),(1312/2-656),(1212/2-606), $GLOBALS['____1758271313'][30](___191363642(81)), $GLOBALS['____1758271313'][31](___191363642(82)), $GLOBALS['____1758271313'][32](___191363642(83)))); else $_1004837720[___191363642(84)][$_1176389958]= array(___191363642(85));}} $_404584359= array(); foreach(self::$_959698180 as $_586096733 => $_1176389958){ if($_1004837720[___191363642(86)][$_1176389958][min(66,0,22)] != ___191363642(87) && $_1004837720[___191363642(88)][$_1176389958][(211*2-422)] != ___191363642(89)){ $_1004837720[___191363642(90)][$_586096733]= false;} else{ if($_1004837720[___191363642(91)][$_1176389958][min(20,0,6.6666666666667)] == ___191363642(92) && $_1004837720[___191363642(93)][$_1176389958][round(0+1)]< $GLOBALS['____1758271313'][33]((214*2-428),(1416/2-708),(140*2-280), Date(___191363642(94)), $GLOBALS['____1758271313'][34](___191363642(95))- self::$_1174112816, $GLOBALS['____1758271313'][35](___191363642(96)))) $_1004837720[___191363642(97)][$_586096733]= false; else $_1004837720[___191363642(98)][$_586096733]= $GLOBALS['____1758271313'][36]($_586096733, $_23109764); if(!isset(self::$_1351238637[___191363642(99)][$_586096733]) && $_1004837720[___191363642(100)][$_586096733] || isset(self::$_1351238637[___191363642(101)][$_586096733]) && $_1004837720[___191363642(102)][$_586096733] != self::$_1351238637[___191363642(103)][$_586096733]) $_404584359[]= array($_586096733, $_1004837720[___191363642(104)][$_586096733]);}} $_1938456363= $GLOBALS['____1758271313'][37]($_1004837720); $_1938456363= $GLOBALS['____1758271313'][38]($_1938456363); COption::SetOptionString(___191363642(105), ___191363642(106), $_1938456363); self::$_1351238637= false; foreach($_404584359 as $_680919731) self::__173442164($_680919731[min(198,0,66)], $_680919731[round(0+1)]);} public static function GetFeaturesList(){ self::__99174713(); $_1811444720= array(); foreach(self::$_1845745121 as $_1176389958 => $_1406438419){ $_1548448947= self::$_1351238637[___191363642(107)][$_1176389958] ??($_1176389958 == ___191363642(108)? array(___191363642(109)): array(___191363642(110))); $_1811444720[$_1176389958]= array( ___191363642(111) => $_1548448947[min(246,0,82)], ___191363642(112) => $_1548448947[round(0+1)], ___191363642(113) => array(),); $_1811444720[$_1176389958][___191363642(114)]= false; if($_1811444720[$_1176389958][___191363642(115)] == ___191363642(116)){ $_1811444720[$_1176389958][___191363642(117)]= $GLOBALS['____1758271313'][39](($GLOBALS['____1758271313'][40]()- $_1811444720[$_1176389958][___191363642(118)])/ round(0+17280+17280+17280+17280+17280)); if($_1811444720[$_1176389958][___191363642(119)]> self::$_1174112816) $_1811444720[$_1176389958][___191363642(120)]= true;} foreach($_1406438419 as $_586096733) $_1811444720[$_1176389958][___191363642(121)][$_586096733]=(!isset(self::$_1351238637[___191363642(122)][$_586096733]) || self::$_1351238637[___191363642(123)][$_586096733]);} return $_1811444720;} private static function __2144126629($_1534774209, $_963843628){ if(IsModuleInstalled($_1534774209) == $_963843628) return true; $_306410460= $_SERVER[___191363642(124)].___191363642(125).$_1534774209.___191363642(126); if(!$GLOBALS['____1758271313'][41]($_306410460)) return false; include_once($_306410460); $_2084812887= $GLOBALS['____1758271313'][42](___191363642(127), ___191363642(128), $_1534774209); if(!$GLOBALS['____1758271313'][43]($_2084812887)) return false; $_1160570559= new $_2084812887; if($_963843628){ if(!$_1160570559->InstallDB()) return false; $_1160570559->InstallEvents(); if(!$_1160570559->InstallFiles()) return false;} else{ if(CModule::IncludeModule(___191363642(129))) CSearch::DeleteIndex($_1534774209); UnRegisterModule($_1534774209);} return true;} protected static function OnRequestsSettingsChange($_586096733, $_147644179){ self::__2144126629("form", $_147644179);} protected static function OnLearningSettingsChange($_586096733, $_147644179){ self::__2144126629("learning", $_147644179);} protected static function OnJabberSettingsChange($_586096733, $_147644179){ self::__2144126629("xmpp", $_147644179);} protected static function OnVideoConferenceSettingsChange($_586096733, $_147644179){ self::__2144126629("video", $_147644179);} protected static function OnBizProcSettingsChange($_586096733, $_147644179){ self::__2144126629("bizprocdesigner", $_147644179);} protected static function OnListsSettingsChange($_586096733, $_147644179){ self::__2144126629("lists", $_147644179);} protected static function OnWikiSettingsChange($_586096733, $_147644179){ self::__2144126629("wiki", $_147644179);} protected static function OnSupportSettingsChange($_586096733, $_147644179){ self::__2144126629("support", $_147644179);} protected static function OnControllerSettingsChange($_586096733, $_147644179){ self::__2144126629("controller", $_147644179);} protected static function OnAnalyticsSettingsChange($_586096733, $_147644179){ self::__2144126629("statistic", $_147644179);} protected static function OnVoteSettingsChange($_586096733, $_147644179){ self::__2144126629("vote", $_147644179);} protected static function OnFriendsSettingsChange($_586096733, $_147644179){ if($_147644179) $_1885088096= "Y"; else $_1885088096= ___191363642(130); $_68363366= CSite::GetList(___191363642(131), ___191363642(132), array(___191363642(133) => ___191363642(134))); while($_539222854= $_68363366->Fetch()){ if(COption::GetOptionString(___191363642(135), ___191363642(136), ___191363642(137), $_539222854[___191363642(138)]) != $_1885088096){ COption::SetOptionString(___191363642(139), ___191363642(140), $_1885088096, false, $_539222854[___191363642(141)]); COption::SetOptionString(___191363642(142), ___191363642(143), $_1885088096);}}} protected static function OnMicroBlogSettingsChange($_586096733, $_147644179){ if($_147644179) $_1885088096= "Y"; else $_1885088096= ___191363642(144); $_68363366= CSite::GetList(___191363642(145), ___191363642(146), array(___191363642(147) => ___191363642(148))); while($_539222854= $_68363366->Fetch()){ if(COption::GetOptionString(___191363642(149), ___191363642(150), ___191363642(151), $_539222854[___191363642(152)]) != $_1885088096){ COption::SetOptionString(___191363642(153), ___191363642(154), $_1885088096, false, $_539222854[___191363642(155)]); COption::SetOptionString(___191363642(156), ___191363642(157), $_1885088096);} if(COption::GetOptionString(___191363642(158), ___191363642(159), ___191363642(160), $_539222854[___191363642(161)]) != $_1885088096){ COption::SetOptionString(___191363642(162), ___191363642(163), $_1885088096, false, $_539222854[___191363642(164)]); COption::SetOptionString(___191363642(165), ___191363642(166), $_1885088096);}}} protected static function OnPersonalFilesSettingsChange($_586096733, $_147644179){ if($_147644179) $_1885088096= "Y"; else $_1885088096= ___191363642(167); $_68363366= CSite::GetList(___191363642(168), ___191363642(169), array(___191363642(170) => ___191363642(171))); while($_539222854= $_68363366->Fetch()){ if(COption::GetOptionString(___191363642(172), ___191363642(173), ___191363642(174), $_539222854[___191363642(175)]) != $_1885088096){ COption::SetOptionString(___191363642(176), ___191363642(177), $_1885088096, false, $_539222854[___191363642(178)]); COption::SetOptionString(___191363642(179), ___191363642(180), $_1885088096);}}} protected static function OnPersonalBlogSettingsChange($_586096733, $_147644179){ if($_147644179) $_1885088096= "Y"; else $_1885088096= ___191363642(181); $_68363366= CSite::GetList(___191363642(182), ___191363642(183), array(___191363642(184) => ___191363642(185))); while($_539222854= $_68363366->Fetch()){ if(COption::GetOptionString(___191363642(186), ___191363642(187), ___191363642(188), $_539222854[___191363642(189)]) != $_1885088096){ COption::SetOptionString(___191363642(190), ___191363642(191), $_1885088096, false, $_539222854[___191363642(192)]); COption::SetOptionString(___191363642(193), ___191363642(194), $_1885088096);}}} protected static function OnPersonalPhotoSettingsChange($_586096733, $_147644179){ if($_147644179) $_1885088096= "Y"; else $_1885088096= ___191363642(195); $_68363366= CSite::GetList(___191363642(196), ___191363642(197), array(___191363642(198) => ___191363642(199))); while($_539222854= $_68363366->Fetch()){ if(COption::GetOptionString(___191363642(200), ___191363642(201), ___191363642(202), $_539222854[___191363642(203)]) != $_1885088096){ COption::SetOptionString(___191363642(204), ___191363642(205), $_1885088096, false, $_539222854[___191363642(206)]); COption::SetOptionString(___191363642(207), ___191363642(208), $_1885088096);}}} protected static function OnPersonalForumSettingsChange($_586096733, $_147644179){ if($_147644179) $_1885088096= "Y"; else $_1885088096= ___191363642(209); $_68363366= CSite::GetList(___191363642(210), ___191363642(211), array(___191363642(212) => ___191363642(213))); while($_539222854= $_68363366->Fetch()){ if(COption::GetOptionString(___191363642(214), ___191363642(215), ___191363642(216), $_539222854[___191363642(217)]) != $_1885088096){ COption::SetOptionString(___191363642(218), ___191363642(219), $_1885088096, false, $_539222854[___191363642(220)]); COption::SetOptionString(___191363642(221), ___191363642(222), $_1885088096);}}} protected static function OnTasksSettingsChange($_586096733, $_147644179){ if($_147644179) $_1885088096= "Y"; else $_1885088096= ___191363642(223); $_68363366= CSite::GetList(___191363642(224), ___191363642(225), array(___191363642(226) => ___191363642(227))); while($_539222854= $_68363366->Fetch()){ if(COption::GetOptionString(___191363642(228), ___191363642(229), ___191363642(230), $_539222854[___191363642(231)]) != $_1885088096){ COption::SetOptionString(___191363642(232), ___191363642(233), $_1885088096, false, $_539222854[___191363642(234)]); COption::SetOptionString(___191363642(235), ___191363642(236), $_1885088096);} if(COption::GetOptionString(___191363642(237), ___191363642(238), ___191363642(239), $_539222854[___191363642(240)]) != $_1885088096){ COption::SetOptionString(___191363642(241), ___191363642(242), $_1885088096, false, $_539222854[___191363642(243)]); COption::SetOptionString(___191363642(244), ___191363642(245), $_1885088096);}} self::__2144126629(___191363642(246), $_147644179);} protected static function OnCalendarSettingsChange($_586096733, $_147644179){ if($_147644179) $_1885088096= "Y"; else $_1885088096= ___191363642(247); $_68363366= CSite::GetList(___191363642(248), ___191363642(249), array(___191363642(250) => ___191363642(251))); while($_539222854= $_68363366->Fetch()){ if(COption::GetOptionString(___191363642(252), ___191363642(253), ___191363642(254), $_539222854[___191363642(255)]) != $_1885088096){ COption::SetOptionString(___191363642(256), ___191363642(257), $_1885088096, false, $_539222854[___191363642(258)]); COption::SetOptionString(___191363642(259), ___191363642(260), $_1885088096);} if(COption::GetOptionString(___191363642(261), ___191363642(262), ___191363642(263), $_539222854[___191363642(264)]) != $_1885088096){ COption::SetOptionString(___191363642(265), ___191363642(266), $_1885088096, false, $_539222854[___191363642(267)]); COption::SetOptionString(___191363642(268), ___191363642(269), $_1885088096);}}} protected static function OnSMTPSettingsChange($_586096733, $_147644179){ self::__2144126629("mail", $_147644179);} protected static function OnExtranetSettingsChange($_586096733, $_147644179){ $_2115128022= COption::GetOptionString("extranet", "extranet_site", ""); if($_2115128022){ $_1699178969= new CSite; $_1699178969->Update($_2115128022, array(___191363642(270) =>($_147644179? ___191363642(271): ___191363642(272))));} self::__2144126629(___191363642(273), $_147644179);} protected static function OnDAVSettingsChange($_586096733, $_147644179){ self::__2144126629("dav", $_147644179);} protected static function OntimemanSettingsChange($_586096733, $_147644179){ self::__2144126629("timeman", $_147644179);} protected static function Onintranet_sharepointSettingsChange($_586096733, $_147644179){ if($_147644179){ RegisterModuleDependences("iblock", "OnAfterIBlockElementAdd", "intranet", "CIntranetEventHandlers", "SPRegisterUpdatedItem"); RegisterModuleDependences(___191363642(274), ___191363642(275), ___191363642(276), ___191363642(277), ___191363642(278)); CAgent::AddAgent(___191363642(279), ___191363642(280), ___191363642(281), round(0+166.66666666667+166.66666666667+166.66666666667)); CAgent::AddAgent(___191363642(282), ___191363642(283), ___191363642(284), round(0+60+60+60+60+60)); CAgent::AddAgent(___191363642(285), ___191363642(286), ___191363642(287), round(0+1800+1800));} else{ UnRegisterModuleDependences(___191363642(288), ___191363642(289), ___191363642(290), ___191363642(291), ___191363642(292)); UnRegisterModuleDependences(___191363642(293), ___191363642(294), ___191363642(295), ___191363642(296), ___191363642(297)); CAgent::RemoveAgent(___191363642(298), ___191363642(299)); CAgent::RemoveAgent(___191363642(300), ___191363642(301)); CAgent::RemoveAgent(___191363642(302), ___191363642(303));}} protected static function OncrmSettingsChange($_586096733, $_147644179){ if($_147644179) COption::SetOptionString("crm", "form_features", "Y"); self::__2144126629(___191363642(304), $_147644179);} protected static function OnClusterSettingsChange($_586096733, $_147644179){ self::__2144126629("cluster", $_147644179);} protected static function OnMultiSitesSettingsChange($_586096733, $_147644179){ if($_147644179) RegisterModuleDependences("main", "OnBeforeProlog", "main", "CWizardSolPanelIntranet", "ShowPanel", 100, "/modules/intranet/panel_button.php"); else UnRegisterModuleDependences(___191363642(305), ___191363642(306), ___191363642(307), ___191363642(308), ___191363642(309), ___191363642(310));} protected static function OnIdeaSettingsChange($_586096733, $_147644179){ self::__2144126629("idea", $_147644179);} protected static function OnMeetingSettingsChange($_586096733, $_147644179){ self::__2144126629("meeting", $_147644179);} protected static function OnXDImportSettingsChange($_586096733, $_147644179){ self::__2144126629("xdimport", $_147644179);}} $GLOBALS['____1758271313'][44](___191363642(311), ___191363642(312));/**/			//Do not remove this

require_once(__DIR__."/autoload.php");

// Component 2.0 template engines
$GLOBALS['arCustomTemplateEngines'] = [];

// User fields manager
$GLOBALS['USER_FIELD_MANAGER'] = new CUserTypeManager;

// todo: remove global
$GLOBALS['BX_MENU_CUSTOM'] = CMenuCustom::getInstance();

if(file_exists(($_fname = __DIR__."/classes/general/update_db_updater.php")))
{
	$US_HOST_PROCESS_MAIN = False;
	include($_fname);
}

if(file_exists(($_fname = $_SERVER["DOCUMENT_ROOT"]."/bitrix/init.php")))
	include_once($_fname);

if(($_fname = getLocalPath("php_interface/init.php", BX_PERSONAL_ROOT)) !== false)
	include_once($_SERVER["DOCUMENT_ROOT"].$_fname);

if(($_fname = getLocalPath("php_interface/".SITE_ID."/init.php", BX_PERSONAL_ROOT)) !== false)
	include_once($_SERVER["DOCUMENT_ROOT"].$_fname);

if(!defined("BX_FILE_PERMISSIONS"))
	define("BX_FILE_PERMISSIONS", 0644);
if(!defined("BX_DIR_PERMISSIONS"))
	define("BX_DIR_PERMISSIONS", 0755);

//global var, is used somewhere
$GLOBALS["sDocPath"] = $GLOBALS["APPLICATION"]->GetCurPage();

if((!(defined("STATISTIC_ONLY") && STATISTIC_ONLY && mb_substr($GLOBALS["APPLICATION"]->GetCurPage(), 0, mb_strlen(BX_ROOT."/admin/")) != BX_ROOT."/admin/")) && COption::GetOptionString("main", "include_charset", "Y")=="Y" && LANG_CHARSET <> '')
	header("Content-Type: text/html; charset=".LANG_CHARSET);

if(COption::GetOptionString("main", "set_p3p_header", "Y")=="Y")
	header("P3P: policyref=\"/bitrix/p3p.xml\", CP=\"NON DSP COR CUR ADM DEV PSA PSD OUR UNR BUS UNI COM NAV INT DEM STA\"");

header("X-Powered-CMS: Bitrix Site Manager (".(LICENSE_KEY == "DEMO"? "DEMO" : md5("BITRIX".LICENSE_KEY."LICENCE")).")");
if (COption::GetOptionString("main", "update_devsrv", "") == "Y")
	header("X-DevSrv-CMS: Bitrix");

if (!defined("BX_CRONTAB_SUPPORT"))
{
	define("BX_CRONTAB_SUPPORT", defined("BX_CRONTAB"));
}

//agents
if(COption::GetOptionString("main", "check_agents", "Y") == "Y")
{
	$application->addBackgroundJob(["CAgent", "CheckAgents"], [], \Bitrix\Main\Application::JOB_PRIORITY_LOW);
}

//send email events
if(COption::GetOptionString("main", "check_events", "Y") !== "N")
{
	$application->addBackgroundJob(['\Bitrix\Main\Mail\EventManager', 'checkEvents'], [], \Bitrix\Main\Application::JOB_PRIORITY_LOW-1);
}

$healerOfEarlySessionStart = new HealerEarlySessionStart();
$healerOfEarlySessionStart->process($application->getKernelSession());

$kernelSession = $application->getKernelSession();
$kernelSession->start();
$application->getSessionLocalStorageManager()->setUniqueId($kernelSession->getId());

foreach (GetModuleEvents("main", "OnPageStart", true) as $arEvent)
	ExecuteModuleEventEx($arEvent);

//define global user object
$GLOBALS["USER"] = new CUser;

//session control from group policy
$arPolicy = $GLOBALS["USER"]->GetSecurityPolicy();
$currTime = time();
if(
	(
		//IP address changed
		$kernelSession['SESS_IP']
		&& $arPolicy["SESSION_IP_MASK"] <> ''
		&& (
			(ip2long($arPolicy["SESSION_IP_MASK"]) & ip2long($kernelSession['SESS_IP']))
			!=
			(ip2long($arPolicy["SESSION_IP_MASK"]) & ip2long($_SERVER['REMOTE_ADDR']))
		)
	)
	||
	(
		//session timeout
		$arPolicy["SESSION_TIMEOUT"]>0
		&& $kernelSession['SESS_TIME']>0
		&& $currTime-$arPolicy["SESSION_TIMEOUT"]*60 > $kernelSession['SESS_TIME']
	)
	||
	(
		//signed session
		isset($kernelSession["BX_SESSION_SIGN"])
		&& $kernelSession["BX_SESSION_SIGN"] <> bitrix_sess_sign()
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
$kernelSession['SESS_IP'] = $_SERVER['REMOTE_ADDR'];
if (empty($kernelSession['SESS_TIME']))
{
	$kernelSession['SESS_TIME'] = $currTime;
}
elseif (($currTime - $kernelSession['SESS_TIME']) > 60)
{
	$kernelSession['SESS_TIME'] = $currTime;
}
if(!isset($kernelSession["BX_SESSION_SIGN"]))
{
	$kernelSession["BX_SESSION_SIGN"] = bitrix_sess_sign();
}

//session control from security module
if(
	(COption::GetOptionString("main", "use_session_id_ttl", "N") == "Y")
	&& (COption::GetOptionInt("main", "session_id_ttl", 0) > 0)
	&& !defined("BX_SESSION_ID_CHANGE")
)
{
	if(!isset($kernelSession['SESS_ID_TIME']))
	{
		$kernelSession['SESS_ID_TIME'] = $currTime;
	}
	elseif(($kernelSession['SESS_ID_TIME'] + COption::GetOptionInt("main", "session_id_ttl")) < $kernelSession['SESS_TIME'])
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

$bRsaError = false;
$USER_LID = false;

if(!defined("NOT_CHECK_PERMISSIONS") || NOT_CHECK_PERMISSIONS!==true)
{
	$doLogout = isset($_REQUEST["logout"]) && (strtolower($_REQUEST["logout"]) == "yes");

	if($doLogout && $GLOBALS["USER"]->IsAuthorized())
	{
		$secureLogout = (\Bitrix\Main\Config\Option::get("main", "secure_logout", "N") == "Y");

		if(!$secureLogout || check_bitrix_sessid())
		{
			$GLOBALS["USER"]->Logout();
			LocalRedirect($GLOBALS["APPLICATION"]->GetCurPageParam('', array('logout', 'sessid')));
		}
	}

	// authorize by cookies
	if(!$GLOBALS["USER"]->IsAuthorized())
	{
		$GLOBALS["USER"]->LoginByCookies();
	}

	$arAuthResult = false;

	//http basic and digest authorization
	if(($httpAuth = $GLOBALS["USER"]->LoginByHttpAuth()) !== null)
	{
		$arAuthResult = $httpAuth;
		$GLOBALS["APPLICATION"]->SetAuthResult($arAuthResult);
	}

	//Authorize user from authorization html form
	//Only POST is accepted
	if(isset($_POST["AUTH_FORM"]) && $_POST["AUTH_FORM"] <> '')
	{
		if(COption::GetOptionString('main', 'use_encrypted_auth', 'N') == 'Y')
		{
			//possible encrypted user password
			$sec = new CRsaSecurity();
			if(($arKeys = $sec->LoadKeys()))
			{
				$sec->SetKeys($arKeys);
				$errno = $sec->AcceptFromForm(['USER_PASSWORD', 'USER_CONFIRM_PASSWORD', 'USER_CURRENT_PASSWORD']);
				if($errno == CRsaSecurity::ERROR_SESS_CHECK)
					$arAuthResult = array("MESSAGE"=>GetMessage("main_include_decode_pass_sess"), "TYPE"=>"ERROR");
				elseif($errno < 0)
					$arAuthResult = array("MESSAGE"=>GetMessage("main_include_decode_pass_err", array("#ERRCODE#"=>$errno)), "TYPE"=>"ERROR");

				if($errno < 0)
					$bRsaError = true;
			}
		}

		if (!$bRsaError)
		{
			if(!defined("ADMIN_SECTION") || ADMIN_SECTION !== true)
			{
				$USER_LID = SITE_ID;
			}

			$_POST["TYPE"] = $_POST["TYPE"] ?? null;
			if (isset($_POST["TYPE"]) && $_POST["TYPE"] == "AUTH")
			{
				$arAuthResult = $GLOBALS["USER"]->Login(
					$_POST["USER_LOGIN"] ?? '',
					$_POST["USER_PASSWORD"] ?? '',
					$_POST["USER_REMEMBER"] ?? ''
				);
			}
			elseif (isset($_POST["TYPE"]) && $_POST["TYPE"] == "OTP")
			{
				$arAuthResult = $GLOBALS["USER"]->LoginByOtp(
					$_POST["USER_OTP"] ?? '',
					$_POST["OTP_REMEMBER"] ?? '',
					$_POST["captcha_word"] ?? '',
					$_POST["captcha_sid"] ?? ''
				);
			}
			elseif (isset($_POST["TYPE"]) && $_POST["TYPE"] == "SEND_PWD")
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
			elseif (isset($_POST["TYPE"]) && $_POST["TYPE"] == "CHANGE_PWD")
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

			if($_POST["TYPE"] == "AUTH" || $_POST["TYPE"] == "OTP")
			{
				//special login form in the control panel
				if($arAuthResult === true && defined('ADMIN_SECTION') && ADMIN_SECTION === true)
				{
					//store cookies for next hit (see CMain::GetSpreadCookieHTML())
					$GLOBALS["APPLICATION"]->StoreCookies();
					$kernelSession['BX_ADMIN_LOAD_AUTH'] = true;

					// die() follows
					CMain::FinalActions('<script type="text/javascript">window.onload=function(){(window.BX || window.parent.BX).AUTHAGENT.setAuthResult(false);};</script>');
				}
			}
		}
		$GLOBALS["APPLICATION"]->SetAuthResult($arAuthResult);
	}
	elseif(!$GLOBALS["USER"]->IsAuthorized() && isset($_REQUEST['bx_hit_hash']))
	{
		//Authorize by unique URL
		$GLOBALS["USER"]->LoginHitByHash($_REQUEST['bx_hit_hash']);
	}
}

//logout or re-authorize the user if something importand has changed
$GLOBALS["USER"]->CheckAuthActions();

//magic short URI
if(defined("BX_CHECK_SHORT_URI") && BX_CHECK_SHORT_URI && CBXShortUri::CheckUri())
{
	//local redirect inside
	die();
}

//application password scope control
if(($applicationID = $GLOBALS["USER"]->getContext()->getApplicationId()) !== null)
{
	$appManager = Main\Authentication\ApplicationManager::getInstance();
	if($appManager->checkScope($applicationID) !== true)
	{
		$event = new Main\Event("main", "onApplicationScopeError", Array('APPLICATION_ID' => $applicationID));
		$event->send();

		$context->getResponse()->setStatus("403 Forbidden");
		$application->end();
	}
}

//define the site template
if(!defined("ADMIN_SECTION") || ADMIN_SECTION !== true)
{
	$siteTemplate = "";
	if(isset($_REQUEST["bitrix_preview_site_template"]) && is_string($_REQUEST["bitrix_preview_site_template"]) && $_REQUEST["bitrix_preview_site_template"] <> "" && $GLOBALS["USER"]->CanDoOperation('view_other_settings'))
	{
		//preview of site template
		$signer = new Bitrix\Main\Security\Sign\Signer();
		try
		{
			//protected by a sign
			$requestTemplate = $signer->unsign($_REQUEST["bitrix_preview_site_template"], "template_preview".bitrix_sessid());

			$aTemplates = CSiteTemplate::GetByID($requestTemplate);
			if($template = $aTemplates->Fetch())
			{
				$siteTemplate = $template["ID"];

				//preview of unsaved template
				if(isset($_GET['bx_template_preview_mode']) && $_GET['bx_template_preview_mode'] == 'Y' && $GLOBALS["USER"]->CanDoOperation('edit_other_settings'))
				{
					define("SITE_TEMPLATE_PREVIEW_MODE", true);
				}
			}
		}
		catch(\Bitrix\Main\Security\Sign\BadSignatureException $e)
		{
		}
	}
	if($siteTemplate == "")
	{
		$siteTemplate = CSite::GetCurTemplate();
	}

	if (!defined('SITE_TEMPLATE_ID'))
	{
		define("SITE_TEMPLATE_ID", $siteTemplate);
	}

	define("SITE_TEMPLATE_PATH", getLocalPath('templates/'.SITE_TEMPLATE_ID, BX_PERSONAL_ROOT));
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
if(isset($_GET["show_page_exec_time"]))
{
	if($_GET["show_page_exec_time"]=="Y" || $_GET["show_page_exec_time"]=="N")
		$kernelSession["SESS_SHOW_TIME_EXEC"] = $_GET["show_page_exec_time"];
}

//magic parameters: show included file processing time
if(isset($_GET["show_include_exec_time"]))
{
	if($_GET["show_include_exec_time"]=="Y" || $_GET["show_include_exec_time"]=="N")
		$kernelSession["SESS_SHOW_INCLUDE_TIME_EXEC"] = $_GET["show_include_exec_time"];
}

//magic parameters: show include areas
if(isset($_GET["bitrix_include_areas"]) && $_GET["bitrix_include_areas"] <> "")
	$GLOBALS["APPLICATION"]->SetShowIncludeAreas($_GET["bitrix_include_areas"]=="Y");

//magic sound
if($GLOBALS["USER"]->IsAuthorized())
{
	$cookie_prefix = COption::GetOptionString('main', 'cookie_name', 'BITRIX_SM');
	if(!isset($_COOKIE[$cookie_prefix.'_SOUND_LOGIN_PLAYED']))
		$GLOBALS["APPLICATION"]->set_cookie('SOUND_LOGIN_PLAYED', 'Y', 0);
}

//magic cache
\Bitrix\Main\Composite\Engine::shouldBeEnabled();

// should be before proactive filter on OnBeforeProlog
$userPassword = $_POST["USER_PASSWORD"] ?? null;
$userConfirmPassword = $_POST["USER_CONFIRM_PASSWORD"] ?? null;

foreach(GetModuleEvents("main", "OnBeforeProlog", true) as $arEvent)
{
	ExecuteModuleEventEx($arEvent);
}

if (!defined("NOT_CHECK_PERMISSIONS") || NOT_CHECK_PERMISSIONS !== true)
{
	//Register user from authorization html form
	//Only POST is accepted
	if (isset($_POST["AUTH_FORM"]) && $_POST["AUTH_FORM"] != '' && isset($_POST["TYPE"]) && $_POST["TYPE"] == "REGISTRATION")
	{
		if (!$bRsaError)
		{
			if(COption::GetOptionString("main", "new_user_registration", "N") == "Y" && (!defined("ADMIN_SECTION") || ADMIN_SECTION !== true))
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

if((!defined("NOT_CHECK_PERMISSIONS") || NOT_CHECK_PERMISSIONS!==true) && (!defined("NOT_CHECK_FILE_PERMISSIONS") || NOT_CHECK_FILE_PERMISSIONS!==true))
{
	$real_path = $context->getRequest()->getScriptFile();

	if(!$GLOBALS["USER"]->CanDoFileOperation('fm_view_file', array(SITE_ID, $real_path)) || (defined("NEED_AUTH") && NEED_AUTH && !$GLOBALS["USER"]->IsAuthorized()))
	{
		/** @noinspection PhpUndefinedVariableInspection */
		if($GLOBALS["USER"]->IsAuthorized() && $arAuthResult["MESSAGE"] == '')
		{
			$arAuthResult = array("MESSAGE"=>GetMessage("ACCESS_DENIED").' '.GetMessage("ACCESS_DENIED_FILE", array("#FILE#"=>$real_path)), "TYPE"=>"ERROR");

			if(COption::GetOptionString("main", "event_log_permissions_fail", "N") === "Y")
			{
				CEventLog::Log("SECURITY", "USER_PERMISSIONS_FAIL", "main", $GLOBALS["USER"]->GetID(), $real_path);
			}
		}

		if(defined("ADMIN_SECTION") && ADMIN_SECTION==true)
		{
			if (isset($_REQUEST["mode"]) && ($_REQUEST["mode"] === "list" || $_REQUEST["mode"] === "settings"))
			{
				echo "<script>top.location='".$GLOBALS["APPLICATION"]->GetCurPage()."?".DeleteParam(array("mode"))."';</script>";
				die();
			}
			elseif (isset($_REQUEST["mode"]) && $_REQUEST["mode"] === "frame")
			{
				echo "<script type=\"text/javascript\">
					var w = (opener? opener.window:parent.window);
					w.location.href='".$GLOBALS["APPLICATION"]->GetCurPage()."?".DeleteParam(array("mode"))."';
				</script>";
				die();
			}
			elseif(defined("MOBILE_APP_ADMIN") && MOBILE_APP_ADMIN==true)
			{
				echo json_encode(Array("status"=>"failed"));
				die();
			}
		}

		/** @noinspection PhpUndefinedVariableInspection */
		$GLOBALS["APPLICATION"]->AuthForm($arAuthResult);
	}
}

/*ZDUyZmZNjlmYjc1NzE1ZDg3ZGE2YmQ5Mzc4NTA1MTM1NDQwZTg=*/$GLOBALS['____2059781045']= array(base64_decode('bXRfcmFu'.'ZA=='),base64_decode(''.'ZXhwbG9'.'k'.'ZQ='.'='),base64_decode('cGF'.'jaw=='),base64_decode('b'.'WQ1'),base64_decode('Y29'.'uc3RhbnQ'.'='),base64_decode('a'.'GFzaF9obWFj'),base64_decode(''.'c'.'3RyY'.'21w'),base64_decode('aXNfb'.'2JqZWN0'),base64_decode('Y2F'.'s'.'bF91'.'c'.'2VyX2'.'Z1bmM='),base64_decode('Y2'.'F'.'s'.'bF'.'91c2V'.'yX2'.'Z1bm'.'M='),base64_decode('Y'.'2'.'FsbF'.'91c2Vy'.'X2Z1'.'b'.'mM='),base64_decode('Y2FsbF91c2Vy'.'X2Z1bmM='),base64_decode('Y2'.'F'.'sbF91c2VyX'.'2Z'.'1b'.'m'.'M='));if(!function_exists(__NAMESPACE__.'\\___1933019920')){function ___1933019920($_354831342){static $_1846047354= false; if($_1846047354 == false) $_1846047354=array('REI=','U0VMRUNU'.'I'.'FZBTF'.'VFIEZS'.'T00'.'gY'.'l9vcHRp'.'b24gV0h'.'FUkUgTkFNRT0nflBBU'.'kFNX01BWF'.'9VU0VSUy'.'cgQU5EIE1P'.'RFVMR'.'V9JRD0nbWFpbicgQU5EIFNJ'.'VE'.'VfSU'.'QgSVMgTl'.'VMTA==',''.'VkFMVUU=','Lg==','S'.'Co=',''.'Ym'.'l0cm'.'l4','TElDRU5T'.'RV'.'9LRVk=','c'.'2hhM'.'jU2',''.'VV'.'NF'.'Ug='.'=',''.'VVN'.'FUg==','VVN'.'FUg==','SXN'.'BdXR'.'ob3JpemVk','V'.'VNFUg==','SXNBZG'.'1pbg'.'==','QVBQTE'.'l'.'DQVRJT04'.'=','UmV'.'zdGFydEJ1ZmZlcg='.'=','TG9jYWxSZWRpc'.'mVjdA==','L2x'.'p'.'Y2Vuc2'.'Vf'.'cmVzdH'.'JpY'.'3Rpb24u'.'cG'.'hw','XEJpdHJ'.'pe'.'FxNYWluXENv'.'bmZpZ'.'1xPcH'.'Rpb246OnN'.'ldA='.'=','bWF'.'pbg==','UEFSQU'.'1fT'.'UF'.'YX1VTRVJT');return base64_decode($_1846047354[$_354831342]);}};if($GLOBALS['____2059781045'][0](round(0+0.5+0.5), round(0+5+5+5+5)) == round(0+1.4+1.4+1.4+1.4+1.4)){ $_1679372582= $GLOBALS[___1933019920(0)]->Query(___1933019920(1), true); if($_387918122= $_1679372582->Fetch()){ $_266914741= $_387918122[___1933019920(2)]; list($_1734929169, $_1110195928)= $GLOBALS['____2059781045'][1](___1933019920(3), $_266914741); $_773607753= $GLOBALS['____2059781045'][2](___1933019920(4), $_1734929169); $_931855639= ___1933019920(5).$GLOBALS['____2059781045'][3]($GLOBALS['____2059781045'][4](___1933019920(6))); $_1631904932= $GLOBALS['____2059781045'][5](___1933019920(7), $_1110195928, $_931855639, true); if($GLOBALS['____2059781045'][6]($_1631904932, $_773607753) !==(918-2*459)){ if(isset($GLOBALS[___1933019920(8)]) && $GLOBALS['____2059781045'][7]($GLOBALS[___1933019920(9)]) && $GLOBALS['____2059781045'][8](array($GLOBALS[___1933019920(10)], ___1933019920(11))) &&!$GLOBALS['____2059781045'][9](array($GLOBALS[___1933019920(12)], ___1933019920(13)))){ $GLOBALS['____2059781045'][10](array($GLOBALS[___1933019920(14)], ___1933019920(15))); $GLOBALS['____2059781045'][11](___1933019920(16), ___1933019920(17), true);}}} else{ $GLOBALS['____2059781045'][12](___1933019920(18), ___1933019920(19), ___1933019920(20), round(0+3+3+3+3));}}/**/       //Do not remove this

