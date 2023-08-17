<?php

/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage main
 * @copyright 2001-2023 Bitrix
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

if (class_exists('\Dev\Main\Migrator\ModuleUpdater'))
{
	\Dev\Main\Migrator\ModuleUpdater::checkUpdates('main', __DIR__);
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

error_reporting(COption::GetOptionInt("main", "error_reporting", E_COMPILE_ERROR | E_ERROR | E_CORE_ERROR | E_PARSE) & ~E_STRICT & ~E_DEPRECATED & ~E_WARNING & ~E_NOTICE);

if (!defined("BX_COMP_MANAGED_CACHE") && COption::GetOptionString("main", "component_managed_cache_on", "Y") <> "N")
{
	define("BX_COMP_MANAGED_CACHE", true);
}

// global functions
require_once(__DIR__."/filter_tools.php");

define('BX_AJAX_PARAM_ID', 'bxajaxid');

/*ZDUyZmZMGI2NWRkNGMxNGUzM2JjMzFmZjUwMDM5YWE5ZWI5OGE=*/$GLOBALS['_____1529180564']= array(base64_decode('R2V0TW9kd'.'Wx'.'l'.'RXZ'.'l'.'bnRz'),base64_decode('RXh'.'lY'.'3V0ZU1'.'v'.'Z'.'H'.'VsZUV2'.'ZW5'.'0RXg='));$GLOBALS['____1373852294']= array(base64_decode('ZGVmaW5l'),base64_decode('YmFz'.'ZT'.'Y0X2RlY29kZQ=='),base64_decode(''.'dW5'.'zZXJpYWx'.'pemU'.'='),base64_decode('a'.'XNfYX'.'J'.'yYXk'.'='),base64_decode('a'.'W5f'.'YXJyYXk='),base64_decode(''.'c2V'.'y'.'aWFsa'.'Xpl'),base64_decode('Ym'.'FzZTY0X2VuY2'.'9kZQ=='),base64_decode('bWt0aW1l'),base64_decode('ZGF0ZQ=='),base64_decode('Z'.'GF0ZQ'.'='.'='),base64_decode('c'.'3Ry'.'bGVu'),base64_decode('bWt0'.'a'.'W'.'1l'),base64_decode(''.'ZGF0ZQ=='),base64_decode('Z'.'GF0ZQ='.'='),base64_decode('bWV0a'.'G9k'.'X2V4aXN0'.'cw=='),base64_decode(''.'Y2FsbF91c2'.'V'.'yX2'.'Z1bmNf'.'YXJyYX'.'k='),base64_decode(''.'c'.'3R'.'ybGVu'),base64_decode('c2VyaWFsaXpl'),base64_decode(''.'YmF'.'zZ'.'TY0X2VuY2'.'9kZ'.'Q=='),base64_decode('c3'.'RybGV'.'u'),base64_decode(''.'aX'.'N'.'f'.'YXJyYXk='),base64_decode('c2'.'VyaW'.'F'.'sa'.'Xpl'),base64_decode('YmFzZTY0'.'X2VuY29k'.'ZQ='.'='),base64_decode('c2'.'VyaWFsaXpl'),base64_decode('YmF'.'zZ'.'TY'.'0X2'.'VuY2'.'9k'.'ZQ=='),base64_decode('a'.'XNfYX'.'JyYX'.'k'.'='),base64_decode('aXNfYXJy'.'YX'.'k='),base64_decode('aW5fYXJyYX'.'k='),base64_decode('aW5fY'.'XJyY'.'Xk='),base64_decode('bW'.'t0aW1l'),base64_decode('ZGF0'.'ZQ=='),base64_decode('ZGF0ZQ'.'=='),base64_decode(''.'ZGF'.'0ZQ='.'='),base64_decode('b'.'Wt0aW1l'),base64_decode('Z'.'G'.'F0ZQ'.'=='),base64_decode('ZG'.'F0ZQ=='),base64_decode(''.'aW'.'5'.'fY'.'X'.'J'.'y'.'YXk='),base64_decode('c'.'2VyaW'.'FsaXpl'),base64_decode('Ym'.'FzZTY'.'0X'.'2VuY29'.'kZQ'.'='.'='),base64_decode('a'.'W50d'.'m'.'Fs'),base64_decode('dGltZQ'.'='.'='),base64_decode('Zm'.'lsZV'.'9l'.'e'.'Glz'.'dHM='),base64_decode(''.'c3RyX'.'3JlcG'.'xhY2'.'U='),base64_decode('Y2xhc3N'.'fZ'.'X'.'h'.'pc3Rz'),base64_decode('ZGVmaW5l'));if(!function_exists(__NAMESPACE__.'\\___108088498')){function ___108088498($_66069601){static $_1958424534= false; if($_1958424534 == false) $_1958424534=array('SU5'.'UUkFORV'.'RfRUR'.'JVElPT'.'g==','W'.'Q==','bWFpbg==','fmNwZ'.'l9tYXBf'.'dmF'.'sdWU=','','','YWxsb3dlZF9jbGFz'.'c2V'.'z','ZQ==',''.'Zg==','ZQ'.'==','Rg==','W'.'A'.'==','Z'.'g==','bWFpbg'.'==','fmNwZ'.'l9tYXB'.'f'.'dmFsdWU'.'=',''.'UG9ydGFs','Rg==','ZQ==','Z'.'Q==','W'.'A'.'==','Rg'.'==','R'.'A==','RA==',''.'bQ==',''.'Z'.'A==','W'.'Q='.'=','Zg==','Z'.'g==','Zg='.'=','Zg==','UG9ydGFs','Rg'.'==','ZQ==','ZQ='.'=','WA==','Rg==','RA==','RA='.'=','bQ==','ZA==','WQ==','bWF'.'pbg'.'==','T'.'24=','U2V0d'.'Gl'.'uZ3NDaGFuZ2U=',''.'Z'.'g'.'==','Z'.'g='.'=','Zg==','Zg'.'==','bWFpbg='.'=','fmNwZl9tYXBf'.'dmFsdW'.'U=','ZQ==','ZQ'.'==','RA==',''.'ZQ='.'=','Z'.'Q==','Zg==','Zg'.'='.'=','Zg'.'==','ZQ==','b'.'WFpbg='.'=','f'.'mN'.'wZl9tYXBfdmFs'.'dW'.'U=','ZQ='.'=','Zg==','Zg==','Z'.'g==','Zg'.'='.'=','bWFp'.'bg='.'=','f'.'m'.'NwZ'.'l9t'.'Y'.'XBf'.'dmFs'.'dWU=','ZQ==','Z'.'g==','UG9ydGFs',''.'UG9ydGFs','ZQ==',''.'ZQ==',''.'UG9ydGFs','Rg'.'='.'=','WA==','Rg==','RA==',''.'ZQ'.'==','ZQ==','RA'.'==',''.'bQ==','ZA==',''.'WQ'.'==',''.'ZQ==','WA'.'='.'=',''.'ZQ'.'==',''.'Rg==','ZQ='.'=','R'.'A='.'=','Zg==',''.'ZQ==',''.'RA==','ZQ'.'='.'=','b'.'Q'.'='.'=','ZA==','WQ='.'=','Zg==',''.'Z'.'g='.'=','Zg==','Z'.'g==','Z'.'g'.'==','Zg==','Z'.'g'.'==','Zg==','bW'.'F'.'pbg==','fmNwZl9tYX'.'BfdmFs'.'dWU'.'=',''.'ZQ==',''.'ZQ==','UG9ydGFs','Rg==','W'.'A'.'==','VFlQR'.'Q'.'==','REF'.'U'.'RQ==',''.'R'.'kVB'.'VFVS'.'RV'.'M=','R'.'VhQSVJFRA==','VFlQRQ==','R'.'A='.'=','VFJZX0RB'.'WV'.'NfQ0'.'9VTlQ'.'=','REFURQ='.'=','VF'.'JZ'.'X0RBWVNfQ09'.'VTlQ=','R'.'V'.'hQSVJFRA==','RkVBVF'.'VSRVM'.'=','Zg==','Zg'.'==','RE'.'9D'.'V'.'U1F'.'TlRfU'.'k9'.'PVA==','L2Jpd'.'HJpe'.'C'.'9tb2R1bGVz'.'Lw='.'=','L2luc3RhbGwvaW5kZ'.'Xg'.'uc'.'G'.'hw','L'.'g'.'='.'=','Xw==','c2Vhc'.'m'.'No',''.'Tg==','','',''.'QU'.'NUSV'.'ZF','WQ==','c'.'29jaWFsbm'.'V0'.'d29yaw==','YWx'.'sb3dfZnJpZ'.'Wx'.'kcw'.'==','WQ==','S'.'UQ=',''.'c2'.'9jaW'.'Fs'.'b'.'mV0d29yaw='.'=','Y'.'Wxs'.'b'.'3dfZn'.'JpZWxk'.'cw'.'==','SUQ=','c29jaWFsb'.'mV'.'0d2'.'9yaw==','YWxsb3d'.'fZn'.'JpZW'.'xkcw='.'=','Tg'.'==','','',''.'Q'.'UNUSVZF',''.'WQ==','c'.'29jaW'.'FsbmV0d29yaw==','YWxsb3d'.'fb'.'W'.'lj'.'cm9'.'i'.'bG'.'9nX3VzZXI'.'=','WQ==',''.'S'.'UQ=',''.'c29j'.'aWFsbmV0d2'.'9ya'.'w='.'=','YW'.'xsb3dfbW'.'l'.'jcm9'.'i'.'b'.'G9nX3V'.'z'.'ZXI=','S'.'UQ=','c'.'2'.'9jaWFsbmV0'.'d29y'.'aw='.'=','Y'.'Wxsb3dfbWljcm9ibG9n'.'X'.'3Vz'.'ZXI=',''.'c29jaWFsbmV'.'0d'.'2'.'9ya'.'w='.'=','YWxsb3dfbWljcm9'.'i'.'b'.'G9n'.'X2dyb3Vw','WQ'.'==','SUQ=','c29j'.'aWFsb'.'m'.'V0d2'.'9'.'ya'.'w==',''.'Y'.'Wx'.'sb3dfbWlj'.'c'.'m9ibG'.'9'.'nX2'.'dyb3'.'V'.'w',''.'SUQ'.'=','c2'.'9jaWFsbm'.'V0d29yaw==','Y'.'Wxsb3dfb'.'Wljc'.'m9i'.'bG'.'9nX2dyb3Vw','Tg'.'='.'=','','','Q'.'UN'.'US'.'V'.'ZF','WQ'.'==',''.'c29jaW'.'FsbmV0d29'.'yaw==','YWx'.'sb3'.'dfZ'.'mls'.'ZXNfdXNlcg==','WQ==',''.'SU'.'Q=','c29'.'j'.'aW'.'Fs'.'bmV0d29yaw==',''.'YWxsb3dfZmls'.'ZXN'.'f'.'dX'.'Nlcg='.'=',''.'SUQ=',''.'c29'.'jaWFsbmV'.'0d29'.'yaw==','Y'.'W'.'x'.'sb3'.'dfZml'.'sZX'.'NfdXNlcg==','Tg==','','',''.'QUNUSVZF',''.'WQ='.'=','c29'.'j'.'aWF'.'sbm'.'V0d29yaw='.'=','YWxsb3df'.'Ym'.'xvZ191'.'c2Vy','WQ==','SUQ'.'=',''.'c29jaWFsbmV0d'.'29'.'yaw='.'=','YWxsb3dfYmx'.'vZ191c2Vy','S'.'UQ'.'=','c29j'.'aWFsbm'.'V0'.'d29y'.'aw==','Y'.'Wxsb3dfYmxvZ191c'.'2Vy','T'.'g==','','','QUNUSVZF','WQ'.'==','c29jaWFsbm'.'V0d29yaw'.'='.'=','YWx'.'sb3d'.'fcGh'.'v'.'dG9fdXNlcg==','WQ='.'=','SUQ=','c29j'.'aWF'.'sbmV0d29yaw='.'=',''.'YWxsb'.'3dfc'.'G'.'hv'.'dG9fdX'.'Nlcg'.'==','SU'.'Q'.'=',''.'c29jaWF'.'sbmV'.'0'.'d29ya'.'w'.'==','Y'.'Wx'.'sb3dfcGhvd'.'G9fd'.'X'.'Nlc'.'g==','Tg==','','','QUNUS'.'VZF','WQ==','c29jaWF'.'sbmV0d2'.'9yaw==','YWxsb3dfZ'.'m9ydW1fdXNlc'.'g==','WQ==','SUQ=','c'.'29j'.'aWF'.'s'.'b'.'m'.'V'.'0d29ya'.'w='.'=',''.'YWxsb3dfZm9yd'.'W'.'1fd'.'XNlcg==','SUQ'.'=','c29jaWFsbm'.'V0d29yaw='.'=',''.'YWx'.'sb'.'3dfZm'.'9'.'ydW1'.'f'.'dX'.'Nlcg==',''.'Tg==','','','Q'.'UNUSV'.'ZF','WQ==','c'.'29jaWFsbmV'.'0d'.'29ya'.'w='.'=',''.'YWx'.'sb3df'.'d'.'GFza3Nfd'.'XNl'.'cg'.'==',''.'W'.'Q'.'==',''.'SUQ=','c29jaW'.'F'.'sbmV0d29yaw==','YWxsb3'.'dfd'.'G'.'Fza3Nfd'.'X'.'Nlc'.'g==','S'.'U'.'Q=','c'.'29'.'jaWFsbm'.'V0d29yaw==',''.'Y'.'Wx'.'sb3dfdGFz'.'a3N'.'f'.'dXNlc'.'g==','c2'.'9jaW'.'FsbmV'.'0d'.'29yaw'.'==','YWx'.'sb3df'.'dGF'.'z'.'a3NfZ'.'3Jv'.'dXA=','WQ==','S'.'UQ=','c29'.'jaWFsbmV0d'.'29yaw==','YWxsb3dfdGFza3N'.'fZ3JvdXA=','SUQ=',''.'c2'.'9'.'jaWFsbmV0d'.'2'.'9yaw==','YWxsb3dfdGFza3N'.'fZ3JvdXA'.'=','dGFza'.'3M=','Tg'.'==','','','QUN'.'USVZF','WQ'.'='.'=','c2'.'9'.'ja'.'WFs'.'b'.'mV0d29yaw'.'==','Y'.'Wx'.'sb3dfY2F'.'sZ'.'W'.'5'.'kY'.'XJfdXN'.'lcg'.'==','WQ==','SU'.'Q=','c29j'.'a'.'WFsbmV0d29yaw'.'==',''.'YW'.'xs'.'b3dfY2'.'FsZW5kY'.'X'.'Jf'.'d'.'XNlcg==','S'.'UQ'.'=','c29'.'jaWFsb'.'mV0'.'d29ya'.'w='.'=','YWxsb3d'.'f'.'Y2FsZW5kYXJfdXNlcg==','c'.'29ja'.'WFsbmV0d2'.'9ya'.'w='.'=','YWxsb3df'.'Y2'.'FsZW5'.'k'.'YXJfZ3J'.'vd'.'XA=',''.'WQ==','SUQ=',''.'c'.'29jaWFsbm'.'V0d29yaw==','Y'.'Wx'.'sb'.'3'.'df'.'Y2F'.'sZW5kY'.'XJfZ3J'.'vdXA=','SU'.'Q'.'=','c2'.'9jaWFsbm'.'V0d'.'29'.'yaw==','YWxsb3d'.'fY2F'.'sZW5kYXJfZ'.'3JvdXA'.'=',''.'QUN'.'U'.'S'.'VZ'.'F','WQ'.'='.'=','Tg='.'=','Z'.'X'.'h'.'0cmFuZ'.'XQ=','aWJsb2Nr','T25BZnRlckl'.'CbG9ja0VsZW1'.'lbn'.'RVcGRhdGU'.'=','aW5'.'0'.'cmFuZXQ=','Q0lu'.'dHJh'.'b'.'m'.'V0RXZ'.'lb'.'nRIYW5kbGVy'.'cw='.'=','U1'.'BS'.'Z'.'W'.'d'.'pc3Rl'.'clV'.'wZGF'.'0Z'.'WRJdG'.'Vt','Q0ludHJh'.'bmV0U2'.'hhcm'.'Vwb2'.'ludDo'.'6'.'QWd'.'lb'.'nR'.'MaXN0'.'c'.'yg'.'pOw'.'==','aW50cmFuZXQ=','Tg='.'=','Q0lu'.'dHJhbmV'.'0U2hhcmVw'.'b2'.'ludDo6'.'QWd'.'l'.'bnRRd'.'WV1'.'Z'.'SgpOw'.'==','aW50'.'cm'.'FuZX'.'Q=','Tg'.'='.'=','Q0ludHJhb'.'m'.'V0'.'U'.'2h'.'hc'.'m'.'Vw'.'b2ludDo6QWdlbn'.'RVcGRhd'.'GUoKTs=','aW5'.'0cmFuZXQ=','Tg==',''.'aWJsb2Nr','T25BZn'.'RlcklCb'.'G9ja0Vs'.'Z'.'W1lb'.'nR'.'B'.'Z'.'GQ=','a'.'W50c'.'mFuZXQ=','Q'.'0l'.'u'.'dH'.'JhbmV0R'.'X'.'Zl'.'bnRI'.'YW5kbGVycw==','U'.'1'.'B'.'SZWd'.'pc3RlclVwZGF'.'0ZWRJdGVt','aWJsb2Nr','T25B'.'Zn'.'RlcklCb'.'G9ja0VsZW1lbnRVcGRh'.'d'.'GU'.'=',''.'a'.'W50'.'cmFuZ'.'XQ=','Q0lu'.'dHJhbmV0RXZ'.'lbnR'.'I'.'YW5'.'kbGVycw==','U1BSZWd'.'pc3RlclV'.'wZ'.'GF0'.'ZWR'.'JdG'.'Vt','Q'.'0l'.'udHJhbmV'.'0U2hhc'.'mVwb2ludDo6Q'.'Wdlb'.'nR'.'MaXN0cygpOw==',''.'aW50c'.'mFuZXQ=','Q0'.'ludHJ'.'hbmV0'.'U2hhcmVwb2lu'.'dDo6QWdlb'.'n'.'RR'.'dWV1ZSg'.'pOw==','a'.'W50c'.'mFuZXQ=','Q0ludHJhb'.'mV0'.'U'.'2hh'.'cmVwb2ludDo6'.'QWdl'.'bn'.'RVcGRhdG'.'UoK'.'Ts=',''.'aW50cmFuZXQ=','Y3Jt','bWFpbg==','T25CZ'.'WZvcmVQcm9sb2c'.'=','bWFpbg='.'=','Q1dpemFyZFNvbFB'.'hbmV'.'sSW50'.'cmFuZ'.'XQ=','U2hvd1Bhbm'.'Vs',''.'L'.'21vZHV'.'sZXMv'.'aW50cmF'.'uZ'.'XQvcGFu'.'ZWx'.'fYn'.'V0dG'.'9uL'.'nB'.'ocA'.'==',''.'RU5D'.'T0RF','WQ==');return base64_decode($_1958424534[$_66069601]);}};$GLOBALS['____1373852294'][0](___108088498(0), ___108088498(1));class CBXFeatures{ private static $_662533507= 30; private static $_583481545= array( "Portal" => array( "CompanyCalendar", "CompanyPhoto", "CompanyVideo", "CompanyCareer", "StaffChanges", "StaffAbsence", "CommonDocuments", "MeetingRoomBookingSystem", "Wiki", "Learning", "Vote", "WebLink", "Subscribe", "Friends", "PersonalFiles", "PersonalBlog", "PersonalPhoto", "PersonalForum", "Blog", "Forum", "Gallery", "Board", "MicroBlog", "WebMessenger",), "Communications" => array( "Tasks", "Calendar", "Workgroups", "Jabber", "VideoConference", "Extranet", "SMTP", "Requests", "DAV", "intranet_sharepoint", "timeman", "Idea", "Meeting", "EventList", "Salary", "XDImport",), "Enterprise" => array( "BizProc", "Lists", "Support", "Analytics", "crm", "Controller", "LdapUnlimitedUsers",), "Holding" => array( "Cluster", "MultiSites",),); private static $_516955142= null; private static $_1201828923= null; private static function __1544679445(){ if(self::$_516955142 === null){ self::$_516955142= array(); foreach(self::$_583481545 as $_1924418147 => $_1759898247){ foreach($_1759898247 as $_1266322035) self::$_516955142[$_1266322035]= $_1924418147;}} if(self::$_1201828923 === null){ self::$_1201828923= array(); $_1096249974= COption::GetOptionString(___108088498(2), ___108088498(3), ___108088498(4)); if($_1096249974 != ___108088498(5)){ $_1096249974= $GLOBALS['____1373852294'][1]($_1096249974); $_1096249974= $GLOBALS['____1373852294'][2]($_1096249974,[___108088498(6) => false]); if($GLOBALS['____1373852294'][3]($_1096249974)){ self::$_1201828923= $_1096249974;}} if(empty(self::$_1201828923)){ self::$_1201828923= array(___108088498(7) => array(), ___108088498(8) => array());}}} public static function InitiateEditionsSettings($_588132525){ self::__1544679445(); $_954519211= array(); foreach(self::$_583481545 as $_1924418147 => $_1759898247){ $_135482733= $GLOBALS['____1373852294'][4]($_1924418147, $_588132525); self::$_1201828923[___108088498(9)][$_1924418147]=($_135482733? array(___108088498(10)): array(___108088498(11))); foreach($_1759898247 as $_1266322035){ self::$_1201828923[___108088498(12)][$_1266322035]= $_135482733; if(!$_135482733) $_954519211[]= array($_1266322035, false);}} $_1757317914= $GLOBALS['____1373852294'][5](self::$_1201828923); $_1757317914= $GLOBALS['____1373852294'][6]($_1757317914); COption::SetOptionString(___108088498(13), ___108088498(14), $_1757317914); foreach($_954519211 as $_116711670) self::__1798721496($_116711670[(946-2*473)], $_116711670[round(0+0.25+0.25+0.25+0.25)]);} public static function IsFeatureEnabled($_1266322035){ if($_1266322035 == '') return true; self::__1544679445(); if(!isset(self::$_516955142[$_1266322035])) return true; if(self::$_516955142[$_1266322035] == ___108088498(15)) $_215123075= array(___108088498(16)); elseif(isset(self::$_1201828923[___108088498(17)][self::$_516955142[$_1266322035]])) $_215123075= self::$_1201828923[___108088498(18)][self::$_516955142[$_1266322035]]; else $_215123075= array(___108088498(19)); if($_215123075[(134*2-268)] != ___108088498(20) && $_215123075[(1384/2-692)] != ___108088498(21)){ return false;} elseif($_215123075[(1460/2-730)] == ___108088498(22)){ if($_215123075[round(0+1)]< $GLOBALS['____1373852294'][7]((1372/2-686),(1276/2-638),(1180/2-590), Date(___108088498(23)), $GLOBALS['____1373852294'][8](___108088498(24))- self::$_662533507, $GLOBALS['____1373852294'][9](___108088498(25)))){ if(!isset($_215123075[round(0+0.4+0.4+0.4+0.4+0.4)]) ||!$_215123075[round(0+0.4+0.4+0.4+0.4+0.4)]) self::__1890769420(self::$_516955142[$_1266322035]); return false;}} return!isset(self::$_1201828923[___108088498(26)][$_1266322035]) || self::$_1201828923[___108088498(27)][$_1266322035];} public static function IsFeatureInstalled($_1266322035){ if($GLOBALS['____1373852294'][10]($_1266322035) <= 0) return true; self::__1544679445(); return(isset(self::$_1201828923[___108088498(28)][$_1266322035]) && self::$_1201828923[___108088498(29)][$_1266322035]);} public static function IsFeatureEditable($_1266322035){ if($_1266322035 == '') return true; self::__1544679445(); if(!isset(self::$_516955142[$_1266322035])) return true; if(self::$_516955142[$_1266322035] == ___108088498(30)) $_215123075= array(___108088498(31)); elseif(isset(self::$_1201828923[___108088498(32)][self::$_516955142[$_1266322035]])) $_215123075= self::$_1201828923[___108088498(33)][self::$_516955142[$_1266322035]]; else $_215123075= array(___108088498(34)); if($_215123075[min(134,0,44.666666666667)] != ___108088498(35) && $_215123075[(155*2-310)] != ___108088498(36)){ return false;} elseif($_215123075[(187*2-374)] == ___108088498(37)){ if($_215123075[round(0+1)]< $GLOBALS['____1373852294'][11](min(48,0,16),(185*2-370),(864-2*432), Date(___108088498(38)), $GLOBALS['____1373852294'][12](___108088498(39))- self::$_662533507, $GLOBALS['____1373852294'][13](___108088498(40)))){ if(!isset($_215123075[round(0+0.4+0.4+0.4+0.4+0.4)]) ||!$_215123075[round(0+0.4+0.4+0.4+0.4+0.4)]) self::__1890769420(self::$_516955142[$_1266322035]); return false;}} return true;} private static function __1798721496($_1266322035, $_1811812895){ if($GLOBALS['____1373852294'][14]("CBXFeatures", "On".$_1266322035."SettingsChange")) $GLOBALS['____1373852294'][15](array("CBXFeatures", "On".$_1266322035."SettingsChange"), array($_1266322035, $_1811812895)); $_410784456= $GLOBALS['_____1529180564'][0](___108088498(41), ___108088498(42).$_1266322035.___108088498(43)); while($_959879261= $_410784456->Fetch()) $GLOBALS['_____1529180564'][1]($_959879261, array($_1266322035, $_1811812895));} public static function SetFeatureEnabled($_1266322035, $_1811812895= true, $_1335519220= true){ if($GLOBALS['____1373852294'][16]($_1266322035) <= 0) return; if(!self::IsFeatureEditable($_1266322035)) $_1811812895= false; $_1811812895= (bool)$_1811812895; self::__1544679445(); $_1480930085=(!isset(self::$_1201828923[___108088498(44)][$_1266322035]) && $_1811812895 || isset(self::$_1201828923[___108088498(45)][$_1266322035]) && $_1811812895 != self::$_1201828923[___108088498(46)][$_1266322035]); self::$_1201828923[___108088498(47)][$_1266322035]= $_1811812895; $_1757317914= $GLOBALS['____1373852294'][17](self::$_1201828923); $_1757317914= $GLOBALS['____1373852294'][18]($_1757317914); COption::SetOptionString(___108088498(48), ___108088498(49), $_1757317914); if($_1480930085 && $_1335519220) self::__1798721496($_1266322035, $_1811812895);} private static function __1890769420($_1924418147){ if($GLOBALS['____1373852294'][19]($_1924418147) <= 0 || $_1924418147 == "Portal") return; self::__1544679445(); if(!isset(self::$_1201828923[___108088498(50)][$_1924418147]) || self::$_1201828923[___108088498(51)][$_1924418147][(944-2*472)] != ___108088498(52)) return; if(isset(self::$_1201828923[___108088498(53)][$_1924418147][round(0+0.66666666666667+0.66666666666667+0.66666666666667)]) && self::$_1201828923[___108088498(54)][$_1924418147][round(0+2)]) return; $_954519211= array(); if(isset(self::$_583481545[$_1924418147]) && $GLOBALS['____1373852294'][20](self::$_583481545[$_1924418147])){ foreach(self::$_583481545[$_1924418147] as $_1266322035){ if(isset(self::$_1201828923[___108088498(55)][$_1266322035]) && self::$_1201828923[___108088498(56)][$_1266322035]){ self::$_1201828923[___108088498(57)][$_1266322035]= false; $_954519211[]= array($_1266322035, false);}} self::$_1201828923[___108088498(58)][$_1924418147][round(0+1+1)]= true;} $_1757317914= $GLOBALS['____1373852294'][21](self::$_1201828923); $_1757317914= $GLOBALS['____1373852294'][22]($_1757317914); COption::SetOptionString(___108088498(59), ___108088498(60), $_1757317914); foreach($_954519211 as $_116711670) self::__1798721496($_116711670[min(42,0,14)], $_116711670[round(0+0.25+0.25+0.25+0.25)]);} public static function ModifyFeaturesSettings($_588132525, $_1759898247){ self::__1544679445(); foreach($_588132525 as $_1924418147 => $_185432525) self::$_1201828923[___108088498(61)][$_1924418147]= $_185432525; $_954519211= array(); foreach($_1759898247 as $_1266322035 => $_1811812895){ if(!isset(self::$_1201828923[___108088498(62)][$_1266322035]) && $_1811812895 || isset(self::$_1201828923[___108088498(63)][$_1266322035]) && $_1811812895 != self::$_1201828923[___108088498(64)][$_1266322035]) $_954519211[]= array($_1266322035, $_1811812895); self::$_1201828923[___108088498(65)][$_1266322035]= $_1811812895;} $_1757317914= $GLOBALS['____1373852294'][23](self::$_1201828923); $_1757317914= $GLOBALS['____1373852294'][24]($_1757317914); COption::SetOptionString(___108088498(66), ___108088498(67), $_1757317914); self::$_1201828923= false; foreach($_954519211 as $_116711670) self::__1798721496($_116711670[(174*2-348)], $_116711670[round(0+1)]);} public static function SaveFeaturesSettings($_539477289, $_759554150){ self::__1544679445(); $_731916193= array(___108088498(68) => array(), ___108088498(69) => array()); if(!$GLOBALS['____1373852294'][25]($_539477289)) $_539477289= array(); if(!$GLOBALS['____1373852294'][26]($_759554150)) $_759554150= array(); if(!$GLOBALS['____1373852294'][27](___108088498(70), $_539477289)) $_539477289[]= ___108088498(71); foreach(self::$_583481545 as $_1924418147 => $_1759898247){ if(isset(self::$_1201828923[___108088498(72)][$_1924418147])){ $_803192978= self::$_1201828923[___108088498(73)][$_1924418147];} else{ $_803192978=($_1924418147 == ___108088498(74)? array(___108088498(75)): array(___108088498(76)));} if($_803192978[(916-2*458)] == ___108088498(77) || $_803192978[min(46,0,15.333333333333)] == ___108088498(78)){ $_731916193[___108088498(79)][$_1924418147]= $_803192978;} else{ if($GLOBALS['____1373852294'][28]($_1924418147, $_539477289)) $_731916193[___108088498(80)][$_1924418147]= array(___108088498(81), $GLOBALS['____1373852294'][29]((952-2*476),(1228/2-614),(1344/2-672), $GLOBALS['____1373852294'][30](___108088498(82)), $GLOBALS['____1373852294'][31](___108088498(83)), $GLOBALS['____1373852294'][32](___108088498(84)))); else $_731916193[___108088498(85)][$_1924418147]= array(___108088498(86));}} $_954519211= array(); foreach(self::$_516955142 as $_1266322035 => $_1924418147){ if($_731916193[___108088498(87)][$_1924418147][min(162,0,54)] != ___108088498(88) && $_731916193[___108088498(89)][$_1924418147][(1316/2-658)] != ___108088498(90)){ $_731916193[___108088498(91)][$_1266322035]= false;} else{ if($_731916193[___108088498(92)][$_1924418147][(237*2-474)] == ___108088498(93) && $_731916193[___108088498(94)][$_1924418147][round(0+0.2+0.2+0.2+0.2+0.2)]< $GLOBALS['____1373852294'][33]((1260/2-630),(141*2-282),(958-2*479), Date(___108088498(95)), $GLOBALS['____1373852294'][34](___108088498(96))- self::$_662533507, $GLOBALS['____1373852294'][35](___108088498(97)))) $_731916193[___108088498(98)][$_1266322035]= false; else $_731916193[___108088498(99)][$_1266322035]= $GLOBALS['____1373852294'][36]($_1266322035, $_759554150); if(!isset(self::$_1201828923[___108088498(100)][$_1266322035]) && $_731916193[___108088498(101)][$_1266322035] || isset(self::$_1201828923[___108088498(102)][$_1266322035]) && $_731916193[___108088498(103)][$_1266322035] != self::$_1201828923[___108088498(104)][$_1266322035]) $_954519211[]= array($_1266322035, $_731916193[___108088498(105)][$_1266322035]);}} $_1757317914= $GLOBALS['____1373852294'][37]($_731916193); $_1757317914= $GLOBALS['____1373852294'][38]($_1757317914); COption::SetOptionString(___108088498(106), ___108088498(107), $_1757317914); self::$_1201828923= false; foreach($_954519211 as $_116711670) self::__1798721496($_116711670[(1000-2*500)], $_116711670[round(0+0.33333333333333+0.33333333333333+0.33333333333333)]);} public static function GetFeaturesList(){ self::__1544679445(); $_291772509= array(); foreach(self::$_583481545 as $_1924418147 => $_1759898247){ if(isset(self::$_1201828923[___108088498(108)][$_1924418147])){ $_803192978= self::$_1201828923[___108088498(109)][$_1924418147];} else{ $_803192978=($_1924418147 == ___108088498(110)? array(___108088498(111)): array(___108088498(112)));} $_291772509[$_1924418147]= array( ___108088498(113) => $_803192978[(906-2*453)], ___108088498(114) => $_803192978[round(0+1)], ___108088498(115) => array(),); $_291772509[$_1924418147][___108088498(116)]= false; if($_291772509[$_1924418147][___108088498(117)] == ___108088498(118)){ $_291772509[$_1924418147][___108088498(119)]= $GLOBALS['____1373852294'][39](($GLOBALS['____1373852294'][40]()- $_291772509[$_1924418147][___108088498(120)])/ round(0+17280+17280+17280+17280+17280)); if($_291772509[$_1924418147][___108088498(121)]> self::$_662533507) $_291772509[$_1924418147][___108088498(122)]= true;} foreach($_1759898247 as $_1266322035) $_291772509[$_1924418147][___108088498(123)][$_1266322035]=(!isset(self::$_1201828923[___108088498(124)][$_1266322035]) || self::$_1201828923[___108088498(125)][$_1266322035]);} return $_291772509;} private static function __2030565865($_330039324, $_2146347018){ if(IsModuleInstalled($_330039324) == $_2146347018) return true; $_881600703= $_SERVER[___108088498(126)].___108088498(127).$_330039324.___108088498(128); if(!$GLOBALS['____1373852294'][41]($_881600703)) return false; include_once($_881600703); $_349112539= $GLOBALS['____1373852294'][42](___108088498(129), ___108088498(130), $_330039324); if(!$GLOBALS['____1373852294'][43]($_349112539)) return false; $_694359313= new $_349112539; if($_2146347018){ if(!$_694359313->InstallDB()) return false; $_694359313->InstallEvents(); if(!$_694359313->InstallFiles()) return false;} else{ if(CModule::IncludeModule(___108088498(131))) CSearch::DeleteIndex($_330039324); UnRegisterModule($_330039324);} return true;} protected static function OnRequestsSettingsChange($_1266322035, $_1811812895){ self::__2030565865("form", $_1811812895);} protected static function OnLearningSettingsChange($_1266322035, $_1811812895){ self::__2030565865("learning", $_1811812895);} protected static function OnJabberSettingsChange($_1266322035, $_1811812895){ self::__2030565865("xmpp", $_1811812895);} protected static function OnVideoConferenceSettingsChange($_1266322035, $_1811812895){ self::__2030565865("video", $_1811812895);} protected static function OnBizProcSettingsChange($_1266322035, $_1811812895){ self::__2030565865("bizprocdesigner", $_1811812895);} protected static function OnListsSettingsChange($_1266322035, $_1811812895){ self::__2030565865("lists", $_1811812895);} protected static function OnWikiSettingsChange($_1266322035, $_1811812895){ self::__2030565865("wiki", $_1811812895);} protected static function OnSupportSettingsChange($_1266322035, $_1811812895){ self::__2030565865("support", $_1811812895);} protected static function OnControllerSettingsChange($_1266322035, $_1811812895){ self::__2030565865("controller", $_1811812895);} protected static function OnAnalyticsSettingsChange($_1266322035, $_1811812895){ self::__2030565865("statistic", $_1811812895);} protected static function OnVoteSettingsChange($_1266322035, $_1811812895){ self::__2030565865("vote", $_1811812895);} protected static function OnFriendsSettingsChange($_1266322035, $_1811812895){ if($_1811812895) $_2094267867= "Y"; else $_2094267867= ___108088498(132); $_1925444729= CSite::GetList(___108088498(133), ___108088498(134), array(___108088498(135) => ___108088498(136))); while($_1199303260= $_1925444729->Fetch()){ if(COption::GetOptionString(___108088498(137), ___108088498(138), ___108088498(139), $_1199303260[___108088498(140)]) != $_2094267867){ COption::SetOptionString(___108088498(141), ___108088498(142), $_2094267867, false, $_1199303260[___108088498(143)]); COption::SetOptionString(___108088498(144), ___108088498(145), $_2094267867);}}} protected static function OnMicroBlogSettingsChange($_1266322035, $_1811812895){ if($_1811812895) $_2094267867= "Y"; else $_2094267867= ___108088498(146); $_1925444729= CSite::GetList(___108088498(147), ___108088498(148), array(___108088498(149) => ___108088498(150))); while($_1199303260= $_1925444729->Fetch()){ if(COption::GetOptionString(___108088498(151), ___108088498(152), ___108088498(153), $_1199303260[___108088498(154)]) != $_2094267867){ COption::SetOptionString(___108088498(155), ___108088498(156), $_2094267867, false, $_1199303260[___108088498(157)]); COption::SetOptionString(___108088498(158), ___108088498(159), $_2094267867);} if(COption::GetOptionString(___108088498(160), ___108088498(161), ___108088498(162), $_1199303260[___108088498(163)]) != $_2094267867){ COption::SetOptionString(___108088498(164), ___108088498(165), $_2094267867, false, $_1199303260[___108088498(166)]); COption::SetOptionString(___108088498(167), ___108088498(168), $_2094267867);}}} protected static function OnPersonalFilesSettingsChange($_1266322035, $_1811812895){ if($_1811812895) $_2094267867= "Y"; else $_2094267867= ___108088498(169); $_1925444729= CSite::GetList(___108088498(170), ___108088498(171), array(___108088498(172) => ___108088498(173))); while($_1199303260= $_1925444729->Fetch()){ if(COption::GetOptionString(___108088498(174), ___108088498(175), ___108088498(176), $_1199303260[___108088498(177)]) != $_2094267867){ COption::SetOptionString(___108088498(178), ___108088498(179), $_2094267867, false, $_1199303260[___108088498(180)]); COption::SetOptionString(___108088498(181), ___108088498(182), $_2094267867);}}} protected static function OnPersonalBlogSettingsChange($_1266322035, $_1811812895){ if($_1811812895) $_2094267867= "Y"; else $_2094267867= ___108088498(183); $_1925444729= CSite::GetList(___108088498(184), ___108088498(185), array(___108088498(186) => ___108088498(187))); while($_1199303260= $_1925444729->Fetch()){ if(COption::GetOptionString(___108088498(188), ___108088498(189), ___108088498(190), $_1199303260[___108088498(191)]) != $_2094267867){ COption::SetOptionString(___108088498(192), ___108088498(193), $_2094267867, false, $_1199303260[___108088498(194)]); COption::SetOptionString(___108088498(195), ___108088498(196), $_2094267867);}}} protected static function OnPersonalPhotoSettingsChange($_1266322035, $_1811812895){ if($_1811812895) $_2094267867= "Y"; else $_2094267867= ___108088498(197); $_1925444729= CSite::GetList(___108088498(198), ___108088498(199), array(___108088498(200) => ___108088498(201))); while($_1199303260= $_1925444729->Fetch()){ if(COption::GetOptionString(___108088498(202), ___108088498(203), ___108088498(204), $_1199303260[___108088498(205)]) != $_2094267867){ COption::SetOptionString(___108088498(206), ___108088498(207), $_2094267867, false, $_1199303260[___108088498(208)]); COption::SetOptionString(___108088498(209), ___108088498(210), $_2094267867);}}} protected static function OnPersonalForumSettingsChange($_1266322035, $_1811812895){ if($_1811812895) $_2094267867= "Y"; else $_2094267867= ___108088498(211); $_1925444729= CSite::GetList(___108088498(212), ___108088498(213), array(___108088498(214) => ___108088498(215))); while($_1199303260= $_1925444729->Fetch()){ if(COption::GetOptionString(___108088498(216), ___108088498(217), ___108088498(218), $_1199303260[___108088498(219)]) != $_2094267867){ COption::SetOptionString(___108088498(220), ___108088498(221), $_2094267867, false, $_1199303260[___108088498(222)]); COption::SetOptionString(___108088498(223), ___108088498(224), $_2094267867);}}} protected static function OnTasksSettingsChange($_1266322035, $_1811812895){ if($_1811812895) $_2094267867= "Y"; else $_2094267867= ___108088498(225); $_1925444729= CSite::GetList(___108088498(226), ___108088498(227), array(___108088498(228) => ___108088498(229))); while($_1199303260= $_1925444729->Fetch()){ if(COption::GetOptionString(___108088498(230), ___108088498(231), ___108088498(232), $_1199303260[___108088498(233)]) != $_2094267867){ COption::SetOptionString(___108088498(234), ___108088498(235), $_2094267867, false, $_1199303260[___108088498(236)]); COption::SetOptionString(___108088498(237), ___108088498(238), $_2094267867);} if(COption::GetOptionString(___108088498(239), ___108088498(240), ___108088498(241), $_1199303260[___108088498(242)]) != $_2094267867){ COption::SetOptionString(___108088498(243), ___108088498(244), $_2094267867, false, $_1199303260[___108088498(245)]); COption::SetOptionString(___108088498(246), ___108088498(247), $_2094267867);}} self::__2030565865(___108088498(248), $_1811812895);} protected static function OnCalendarSettingsChange($_1266322035, $_1811812895){ if($_1811812895) $_2094267867= "Y"; else $_2094267867= ___108088498(249); $_1925444729= CSite::GetList(___108088498(250), ___108088498(251), array(___108088498(252) => ___108088498(253))); while($_1199303260= $_1925444729->Fetch()){ if(COption::GetOptionString(___108088498(254), ___108088498(255), ___108088498(256), $_1199303260[___108088498(257)]) != $_2094267867){ COption::SetOptionString(___108088498(258), ___108088498(259), $_2094267867, false, $_1199303260[___108088498(260)]); COption::SetOptionString(___108088498(261), ___108088498(262), $_2094267867);} if(COption::GetOptionString(___108088498(263), ___108088498(264), ___108088498(265), $_1199303260[___108088498(266)]) != $_2094267867){ COption::SetOptionString(___108088498(267), ___108088498(268), $_2094267867, false, $_1199303260[___108088498(269)]); COption::SetOptionString(___108088498(270), ___108088498(271), $_2094267867);}}} protected static function OnSMTPSettingsChange($_1266322035, $_1811812895){ self::__2030565865("mail", $_1811812895);} protected static function OnExtranetSettingsChange($_1266322035, $_1811812895){ $_737639286= COption::GetOptionString("extranet", "extranet_site", ""); if($_737639286){ $_714384836= new CSite; $_714384836->Update($_737639286, array(___108088498(272) =>($_1811812895? ___108088498(273): ___108088498(274))));} self::__2030565865(___108088498(275), $_1811812895);} protected static function OnDAVSettingsChange($_1266322035, $_1811812895){ self::__2030565865("dav", $_1811812895);} protected static function OntimemanSettingsChange($_1266322035, $_1811812895){ self::__2030565865("timeman", $_1811812895);} protected static function Onintranet_sharepointSettingsChange($_1266322035, $_1811812895){ if($_1811812895){ RegisterModuleDependences("iblock", "OnAfterIBlockElementAdd", "intranet", "CIntranetEventHandlers", "SPRegisterUpdatedItem"); RegisterModuleDependences(___108088498(276), ___108088498(277), ___108088498(278), ___108088498(279), ___108088498(280)); CAgent::AddAgent(___108088498(281), ___108088498(282), ___108088498(283), round(0+500)); CAgent::AddAgent(___108088498(284), ___108088498(285), ___108088498(286), round(0+300)); CAgent::AddAgent(___108088498(287), ___108088498(288), ___108088498(289), round(0+1800+1800));} else{ UnRegisterModuleDependences(___108088498(290), ___108088498(291), ___108088498(292), ___108088498(293), ___108088498(294)); UnRegisterModuleDependences(___108088498(295), ___108088498(296), ___108088498(297), ___108088498(298), ___108088498(299)); CAgent::RemoveAgent(___108088498(300), ___108088498(301)); CAgent::RemoveAgent(___108088498(302), ___108088498(303)); CAgent::RemoveAgent(___108088498(304), ___108088498(305));}} protected static function OncrmSettingsChange($_1266322035, $_1811812895){ if($_1811812895) COption::SetOptionString("crm", "form_features", "Y"); self::__2030565865(___108088498(306), $_1811812895);} protected static function OnClusterSettingsChange($_1266322035, $_1811812895){ self::__2030565865("cluster", $_1811812895);} protected static function OnMultiSitesSettingsChange($_1266322035, $_1811812895){ if($_1811812895) RegisterModuleDependences("main", "OnBeforeProlog", "main", "CWizardSolPanelIntranet", "ShowPanel", 100, "/modules/intranet/panel_button.php"); else UnRegisterModuleDependences(___108088498(307), ___108088498(308), ___108088498(309), ___108088498(310), ___108088498(311), ___108088498(312));} protected static function OnIdeaSettingsChange($_1266322035, $_1811812895){ self::__2030565865("idea", $_1811812895);} protected static function OnMeetingSettingsChange($_1266322035, $_1811812895){ self::__2030565865("meeting", $_1811812895);} protected static function OnXDImportSettingsChange($_1266322035, $_1811812895){ self::__2030565865("xdimport", $_1811812895);}} $GLOBALS['____1373852294'][44](___108088498(313), ___108088498(314));/**/			//Do not remove this

require_once(__DIR__."/autoload.php");

// Component 2.0 template engines
$GLOBALS['arCustomTemplateEngines'] = [];

// User fields manager
$GLOBALS['USER_FIELD_MANAGER'] = new CUserTypeManager;

// todo: remove global
$GLOBALS['BX_MENU_CUSTOM'] = CMenuCustom::getInstance();

if (file_exists(($_fname = __DIR__."/classes/general/update_db_updater.php")))
{
	$US_HOST_PROCESS_MAIN = false;
	include($_fname);
}

if (file_exists(($_fname = $_SERVER["DOCUMENT_ROOT"]."/bitrix/init.php")))
{
	include_once($_fname);
}

if (($_fname = getLocalPath("php_interface/init.php", BX_PERSONAL_ROOT)) !== false)
{
	include_once($_SERVER["DOCUMENT_ROOT"].$_fname);
}

if (($_fname = getLocalPath("php_interface/".SITE_ID."/init.php", BX_PERSONAL_ROOT)) !== false)
{
	include_once($_SERVER["DOCUMENT_ROOT"].$_fname);
}

if (!defined("BX_FILE_PERMISSIONS"))
{
	define("BX_FILE_PERMISSIONS", 0644);
}
if (!defined("BX_DIR_PERMISSIONS"))
{
	define("BX_DIR_PERMISSIONS", 0755);
}

//global var, is used somewhere
$GLOBALS["sDocPath"] = $GLOBALS["APPLICATION"]->GetCurPage();

if ((!(defined("STATISTIC_ONLY") && STATISTIC_ONLY && mb_substr($GLOBALS["APPLICATION"]->GetCurPage(), 0, mb_strlen(BX_ROOT."/admin/")) != BX_ROOT."/admin/")) && COption::GetOptionString("main", "include_charset", "Y")=="Y" && LANG_CHARSET <> '')
{
	header("Content-Type: text/html; charset=".LANG_CHARSET);
}

if (COption::GetOptionString("main", "set_p3p_header", "Y")=="Y")
{
	header("P3P: policyref=\"/bitrix/p3p.xml\", CP=\"NON DSP COR CUR ADM DEV PSA PSD OUR UNR BUS UNI COM NAV INT DEM STA\"");
}

$license = $application->getLicense();
header("X-Powered-CMS: Bitrix Site Manager (" . ($license->isDemoKey() ? "DEMO" : $license->getPublicHashKey()) . ")");

if (COption::GetOptionString("main", "update_devsrv", "") == "Y")
{
	header("X-DevSrv-CMS: Bitrix");
}

if (!defined("BX_CRONTAB_SUPPORT"))
{
	define("BX_CRONTAB_SUPPORT", defined("BX_CRONTAB"));
}

//agents
if (COption::GetOptionString("main", "check_agents", "Y") == "Y")
{
	$application->addBackgroundJob(["CAgent", "CheckAgents"], [], \Bitrix\Main\Application::JOB_PRIORITY_LOW);
}

//send email events
if (COption::GetOptionString("main", "check_events", "Y") !== "N")
{
	$application->addBackgroundJob(['\Bitrix\Main\Mail\EventManager', 'checkEvents'], [], \Bitrix\Main\Application::JOB_PRIORITY_LOW-1);
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
	(COption::GetOptionString("main", "use_session_id_ttl", "N") == "Y")
	&& (COption::GetOptionInt("main", "session_id_ttl", 0) > 0)
	&& !defined("BX_SESSION_ID_CHANGE")
)
{
	if (!isset($kernelSession['SESS_ID_TIME']))
	{
		$kernelSession['SESS_ID_TIME'] = $currTime;
	}
	elseif (($kernelSession['SESS_ID_TIME'] + COption::GetOptionInt("main", "session_id_ttl")) < $kernelSession['SESS_TIME'])
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

if (!defined("NOT_CHECK_PERMISSIONS") || NOT_CHECK_PERMISSIONS!==true)
{
	$doLogout = isset($_REQUEST["logout"]) && (strtolower($_REQUEST["logout"]) == "yes");

	if ($doLogout && $GLOBALS["USER"]->IsAuthorized())
	{
		$secureLogout = (\Bitrix\Main\Config\Option::get("main", "secure_logout", "N") == "Y");

		if (!$secureLogout || check_bitrix_sessid())
		{
			$GLOBALS["USER"]->Logout();
			LocalRedirect($GLOBALS["APPLICATION"]->GetCurPageParam('', array('logout', 'sessid')));
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
	if (isset($_POST["AUTH_FORM"]) && $_POST["AUTH_FORM"] <> '')
	{
		if (COption::GetOptionString('main', 'use_encrypted_auth', 'N') == 'Y')
		{
			//possible encrypted user password
			$sec = new CRsaSecurity();
			if (($arKeys = $sec->LoadKeys()))
			{
				$sec->SetKeys($arKeys);
				$errno = $sec->AcceptFromForm(['USER_PASSWORD', 'USER_CONFIRM_PASSWORD', 'USER_CURRENT_PASSWORD']);
				if ($errno == CRsaSecurity::ERROR_SESS_CHECK)
				{
					$arAuthResult = array("MESSAGE"=>GetMessage("main_include_decode_pass_sess"), "TYPE"=>"ERROR");
				}
				elseif ($errno < 0)
				{
					$arAuthResult = array("MESSAGE"=>GetMessage("main_include_decode_pass_err", array("#ERRCODE#"=>$errno)), "TYPE"=>"ERROR");
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

			if ($_POST["TYPE"] == "AUTH" || $_POST["TYPE"] == "OTP")
			{
				//special login form in the control panel
				if ($arAuthResult === true && defined('ADMIN_SECTION') && ADMIN_SECTION === true)
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
		$event = new Main\Event("main", "onApplicationScopeError", Array('APPLICATION_ID' => $applicationID));
		$event->send();

		$context->getResponse()->setStatus("403 Forbidden");
		$application->end();
	}
}

//define the site template
if (!defined("ADMIN_SECTION") || ADMIN_SECTION !== true)
{
	$siteTemplate = "";
	if (isset($_REQUEST["bitrix_preview_site_template"]) && is_string($_REQUEST["bitrix_preview_site_template"]) && $_REQUEST["bitrix_preview_site_template"] <> "" && $GLOBALS["USER"]->CanDoOperation('view_other_settings'))
	{
		//preview of site template
		$signer = new Bitrix\Main\Security\Sign\Signer();
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
		catch(\Bitrix\Main\Security\Sign\BadSignatureException $e)
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
if (isset($_GET["show_page_exec_time"]))
{
	if ($_GET["show_page_exec_time"]=="Y" || $_GET["show_page_exec_time"]=="N")
	{
		$kernelSession["SESS_SHOW_TIME_EXEC"] = $_GET["show_page_exec_time"];
	}
}

//magic parameters: show included file processing time
if (isset($_GET["show_include_exec_time"]))
{
	if ($_GET["show_include_exec_time"]=="Y" || $_GET["show_include_exec_time"]=="N")
	{
		$kernelSession["SESS_SHOW_INCLUDE_TIME_EXEC"] = $_GET["show_include_exec_time"];
	}
}

//magic parameters: show include areas
if (isset($_GET["bitrix_include_areas"]) && $_GET["bitrix_include_areas"] <> "")
{
	$GLOBALS["APPLICATION"]->SetShowIncludeAreas($_GET["bitrix_include_areas"]=="Y");
}

//magic sound
if ($GLOBALS["USER"]->IsAuthorized())
{
	$cookie_prefix = COption::GetOptionString('main', 'cookie_name', 'BITRIX_SM');
	if (!isset($_COOKIE[$cookie_prefix.'_SOUND_LOGIN_PLAYED']))
	{
		$GLOBALS["APPLICATION"]->set_cookie('SOUND_LOGIN_PLAYED', 'Y', 0);
	}
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
			if (COption::GetOptionString("main", "new_user_registration", "N") == "Y" && (!defined("ADMIN_SECTION") || ADMIN_SECTION !== true))
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

if ((!defined("NOT_CHECK_PERMISSIONS") || NOT_CHECK_PERMISSIONS!==true) && (!defined("NOT_CHECK_FILE_PERMISSIONS") || NOT_CHECK_FILE_PERMISSIONS!==true))
{
	$real_path = $context->getRequest()->getScriptFile();

	if (!$GLOBALS["USER"]->CanDoFileOperation('fm_view_file', array(SITE_ID, $real_path)) || (defined("NEED_AUTH") && NEED_AUTH && !$GLOBALS["USER"]->IsAuthorized()))
	{
		if ($GLOBALS["USER"]->IsAuthorized() && $arAuthResult["MESSAGE"] == '')
		{
			$arAuthResult = array("MESSAGE"=>GetMessage("ACCESS_DENIED").' '.GetMessage("ACCESS_DENIED_FILE", array("#FILE#"=>$real_path)), "TYPE"=>"ERROR");

			if (COption::GetOptionString("main", "event_log_permissions_fail", "N") === "Y")
			{
				CEventLog::Log("SECURITY", "USER_PERMISSIONS_FAIL", "main", $GLOBALS["USER"]->GetID(), $real_path);
			}
		}

		if (defined("ADMIN_SECTION") && ADMIN_SECTION==true)
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
			elseif (defined("MOBILE_APP_ADMIN") && MOBILE_APP_ADMIN==true)
			{
				echo json_encode(Array("status"=>"failed"));
				die();
			}
		}

		/** @noinspection PhpUndefinedVariableInspection */
		$GLOBALS["APPLICATION"]->AuthForm($arAuthResult);
	}
}

/*ZDUyZmZNmE5MWJhNDM0YTA4MjFjMTM1ZjAwYjIxZWYxNTZiMDY=*/$GLOBALS['____1701108876']= array(base64_decode('bXRfcmFuZ'.'A=='),base64_decode('ZXh'.'wbG9kZ'.'Q=='),base64_decode('cGFj'.'aw=='),base64_decode('bWQ'.'1'),base64_decode('Y2'.'9'.'uc3Rh'.'bnQ='),base64_decode(''.'aGFzaF9o'.'bWFj'),base64_decode(''.'c'.'3R'.'y'.'Y21w'),base64_decode('aX'.'N'.'fb2JqZWN0'),base64_decode('Y2FsbF91c2V'.'yX2Z1b'.'mM='),base64_decode('Y2Fsb'.'F'.'91c2Vy'.'X'.'2Z1bmM'.'='),base64_decode('Y'.'2Fsb'.'F91c2Vy'.'X'.'2Z1bmM='),base64_decode('Y2FsbF91c2'.'V'.'yX2'.'Z1'.'bm'.'M='),base64_decode('Y2FsbF9'.'1'.'c2'.'VyX'.'2Z1bmM='));if(!function_exists(__NAMESPACE__.'\\___353427370')){function ___353427370($_584733255){static $_1411113839= false; if($_1411113839 == false) $_1411113839=array('R'.'EI'.'=','U0VM'.'RUNUIFZ'.'BTFVFIEZ'.'S'.'T00gY'.'l'.'9vc'.'H'.'Rpb'.'2'.'4gV'.'0h'.'FU'.'kUgTk'.'FNRT0nf'.'lBBUkFNX01BWF9V'.'U'.'0V'.'SUycgQU5EIE1'.'P'.'RF'.'V'.'MRV9JRD0nbWFpb'.'ic'.'g'.'QU5EIF'.'NJV'.'EVfSUQgSVMgTlVMTA==','VkFMVUU=',''.'Lg='.'=','SC'.'o'.'=','Yml0cml4','TE'.'lDRU'.'5TRV'.'9L'.'RV'.'k=',''.'c2'.'hhM'.'jU2','VVNFUg==','VVNF'.'Ug==','VVN'.'F'.'Ug='.'=',''.'SXNBdXRob3Jpem'.'Vk','V'.'VN'.'FUg==','S'.'X'.'NBZG1p'.'bg==',''.'QVBQT'.'ElDQVR'.'J'.'T04=','UmV'.'zdGF'.'ydE'.'J1Zm'.'Zlcg==','TG'.'9j'.'YWxSZ'.'WRpcmVjdA==','L2xpY2V'.'uc'.'2Vf'.'cmVzdHJpY3R'.'pb2'.'4ucG'.'h'.'w','XEJpdHJp'.'eF'.'xN'.'YWluXEN'.'v'.'bmZpZ1'.'xPcHR'.'p'.'b24'.'6OnNldA==','bWF'.'p'.'bg==','UEF'.'SQU'.'1fT'.'UFY'.'X1VT'.'R'.'VJT');return base64_decode($_1411113839[$_584733255]);}};if($GLOBALS['____1701108876'][0](round(0+0.5+0.5), round(0+5+5+5+5)) == round(0+2.3333333333333+2.3333333333333+2.3333333333333)){ $_1627691302= $GLOBALS[___353427370(0)]->Query(___353427370(1), true); if($_1016361832= $_1627691302->Fetch()){ $_1611583921= $_1016361832[___353427370(2)]; list($_864244964, $_491283930)= $GLOBALS['____1701108876'][1](___353427370(3), $_1611583921); $_1212210827= $GLOBALS['____1701108876'][2](___353427370(4), $_864244964); $_1648600208= ___353427370(5).$GLOBALS['____1701108876'][3]($GLOBALS['____1701108876'][4](___353427370(6))); $_1313187523= $GLOBALS['____1701108876'][5](___353427370(7), $_491283930, $_1648600208, true); if($GLOBALS['____1701108876'][6]($_1313187523, $_1212210827) !==(1360/2-680)){ if(isset($GLOBALS[___353427370(8)]) && $GLOBALS['____1701108876'][7]($GLOBALS[___353427370(9)]) && $GLOBALS['____1701108876'][8](array($GLOBALS[___353427370(10)], ___353427370(11))) &&!$GLOBALS['____1701108876'][9](array($GLOBALS[___353427370(12)], ___353427370(13)))){ $GLOBALS['____1701108876'][10](array($GLOBALS[___353427370(14)], ___353427370(15))); $GLOBALS['____1701108876'][11](___353427370(16), ___353427370(17), true);}}} else{ $GLOBALS['____1701108876'][12](___353427370(18), ___353427370(19), ___353427370(20), round(0+4+4+4));}}/**/       //Do not remove this

