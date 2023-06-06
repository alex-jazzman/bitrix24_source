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

/*ZDUyZmZMjU1N2M2YWQyZjBmYzVjZGYzYmRlYjk2NjU1OGMxYWM=*/$GLOBALS['_____1428242642']= array(base64_decode('R'.'2V0TW'.'9kdWxlR'.'XZl'.'bnRz'),base64_decode('RX'.'h'.'lY3V0ZU1'.'vZ'.'HVs'.'ZUV2Z'.'W5'.'0'.'RXg='));$GLOBALS['____1009283622']= array(base64_decode(''.'Z'.'G'.'Vm'.'a'.'W5l'),base64_decode('Ym'.'F'.'zZTY0X2'.'RlY29kZQ=='),base64_decode('dW5zZXJp'.'YW'.'x'.'pemU'.'='),base64_decode('aX'.'NfY'.'XJyYX'.'k='),base64_decode(''.'aW5'.'fY'.'XJyYX'.'k='),base64_decode('c2VyaW'.'F'.'sa'.'X'.'pl'),base64_decode(''.'YmFzZ'.'TY0'.'X2Vu'.'Y29k'.'ZQ=='),base64_decode('bWt0aW1l'),base64_decode(''.'ZGF0ZQ'.'=='),base64_decode(''.'ZGF0ZQ=='),base64_decode('c'.'3Ry'.'b'.'GVu'),base64_decode(''.'b'.'Wt0'.'aW'.'1l'),base64_decode('ZGF0'.'ZQ=='),base64_decode('ZGF0Z'.'Q='.'='),base64_decode('bWV0aG9kX2V4aXN'.'0cw=='),base64_decode('Y2FsbF'.'91c2VyX2Z'.'1bmNfYXJyYXk='),base64_decode('c3Ry'.'b'.'G'.'Vu'),base64_decode('c2'.'VyaWFsaXpl'),base64_decode(''.'YmFz'.'Z'.'TY0X2VuY'.'2'.'9kZQ=='),base64_decode('c3RybG'.'Vu'),base64_decode('a'.'XN'.'fYXJyYXk='),base64_decode(''.'c'.'2Vy'.'aWF'.'saX'.'pl'),base64_decode('YmFzZTY0X'.'2V'.'uY29k'.'ZQ='.'='),base64_decode(''.'c2V'.'yaW'.'F'.'s'.'aXpl'),base64_decode('YmFzZTY'.'0X2VuY29kZQ=='),base64_decode('aXNfYXJyYXk'.'='),base64_decode('aXNfY'.'XJyYXk='),base64_decode('a'.'W5fYXJyYXk='),base64_decode('a'.'W5'.'fYXJyY'.'Xk='),base64_decode('bWt'.'0aW1l'),base64_decode('ZGF0ZQ='.'='),base64_decode('Z'.'GF0'.'ZQ=='),base64_decode('ZGF0ZQ='.'='),base64_decode('bWt0aW1l'),base64_decode('ZGF'.'0ZQ='.'='),base64_decode('ZGF'.'0ZQ'.'=='),base64_decode('a'.'W5fYXJyYXk'.'='),base64_decode(''.'c'.'2Vya'.'W'.'FsaXpl'),base64_decode('YmFzZTY'.'0X2VuY2'.'9kZQ=='),base64_decode('aW50d'.'mFs'),base64_decode(''.'dGltZQ=='),base64_decode('Z'.'mls'.'ZV9'.'leGlzd'.'HM='),base64_decode('c3RyX3'.'J'.'l'.'cGxhY2U='),base64_decode(''.'Y2'.'xhc'.'3N'.'fZ'.'Xhpc3Rz'),base64_decode('ZGVmaW5l'));if(!function_exists(__NAMESPACE__.'\\___590489705')){function ___590489705($_1215386474){static $_128332425= false; if($_128332425 == false) $_128332425=array('SU5UU'.'kFO'.'RVRf'.'R'.'UR'.'JVElPT'.'g==','WQ==','bW'.'Fpb'.'g='.'=',''.'fm'.'Nw'.'Zl9t'.'YXB'.'fdm'.'Fs'.'dWU=','','','YWxs'.'b3d'.'lZ'.'F9jb'.'GF'.'zc2Vz',''.'ZQ==','Zg==','Z'.'Q'.'==','Rg'.'==',''.'W'.'A'.'='.'=','Zg==','bWF'.'pbg==','fmNw'.'Zl9tYXB'.'fdmFs'.'dWU=','UG9ydGFs','Rg==','ZQ==','Z'.'Q==','WA'.'==','R'.'g='.'=','R'.'A==',''.'RA==','bQ==','ZA='.'=','WQ==','Z'.'g='.'=',''.'Z'.'g==','Zg='.'=','Zg'.'==','UG9ydGFs','Rg='.'=','Z'.'Q'.'==','ZQ==','WA'.'==','Rg==','RA==',''.'RA==','b'.'Q'.'==',''.'ZA'.'==','WQ==','bW'.'F'.'pbg==','T24'.'=','U2'.'V0dGlu'.'Z3N'.'D'.'aG'.'FuZ2U=','Zg==','Zg==','Zg==','Zg==','bWFpbg==','fmNwZl9'.'tYXBfdmFsdWU=','ZQ==','ZQ==','RA==','Z'.'Q'.'==',''.'ZQ==','Zg==','Z'.'g'.'==','Zg==',''.'ZQ==','bWFp'.'bg==','f'.'mNwZl9tYXBfdmFs'.'dW'.'U=','Z'.'Q'.'==','Z'.'g==','Zg==','Zg==','Zg='.'=','bW'.'Fpbg==','f'.'m'.'NwZl9t'.'YXBfdm'.'FsdW'.'U=','ZQ'.'='.'=','Zg==','UG9'.'ydGFs','UG9'.'yd'.'GFs','ZQ==','ZQ='.'=','UG'.'9y'.'dGFs','Rg==',''.'WA'.'==','Rg==','R'.'A==',''.'Z'.'Q==','ZQ'.'==','RA==','b'.'Q='.'=','ZA==','WQ'.'==','ZQ==',''.'WA==','ZQ'.'==','Rg'.'='.'=','ZQ==',''.'R'.'A==','Zg'.'==',''.'ZQ'.'==','RA==',''.'ZQ'.'==','bQ==','ZA==','WQ==','Zg==',''.'Zg='.'=','Zg==','Zg'.'==','Zg==',''.'Z'.'g==','Z'.'g==','Zg==','bWF'.'pb'.'g==','fmNwZl9t'.'Y'.'XBf'.'dmFsdWU'.'=','ZQ==',''.'ZQ==','UG9'.'yd'.'GFs','Rg==',''.'WA==','V'.'FlQRQ==','R'.'EFURQ'.'==','RkVBV'.'F'.'VSRVM=','RVhQSVJFRA==',''.'VFlQR'.'Q==','RA==','VF'.'JZX0RB'.'W'.'VN'.'f'.'Q0'.'9VTlQ=','REFUR'.'Q==',''.'VFJZX0RBWVNf'.'Q09VTlQ'.'=','RVhQSVJ'.'FRA==','Rk'.'VBVFVSRVM=','Zg='.'=','Zg==','RE9D'.'VU'.'1FTlRfU'.'k9'.'P'.'V'.'A'.'='.'=','L2J'.'pdH'.'JpeC9tb'.'2R1bGVz'.'L'.'w==','L2luc3RhbGwvaW5kZXgucGhw','Lg==','X'.'w'.'==','c2V'.'h'.'c'.'mNo','Tg==','','','QUNUSVZF',''.'WQ==','c29'.'jaWFsbmV0d2'.'9yaw==','Y'.'Wxsb3d'.'fZnJpZWxkcw==',''.'WQ='.'=',''.'SU'.'Q'.'=','c29jaWFsbmV0'.'d29y'.'a'.'w==','YWxsb3'.'dfZnJp'.'ZW'.'xkcw==','SUQ=','c29j'.'aWFs'.'bmV0d29yaw==','YWx'.'sb'.'3dfZn'.'J'.'pZWx'.'kc'.'w==','Tg==','','','QUNU'.'SVZF','WQ==','c29'.'jaWFs'.'b'.'mV0d29y'.'aw==','YWxsb3dfbWljcm9ibG9nX3Vz'.'ZXI=',''.'WQ==','SUQ=','c29'.'jaWFsbmV0d'.'2'.'9yaw'.'==','YWx'.'s'.'b3dfbWljcm9ibG9nX3Vz'.'ZX'.'I'.'=','SUQ=',''.'c29'.'j'.'aWFs'.'bm'.'V0'.'d2'.'9yaw==','YWxs'.'b'.'3dfb'.'W'.'ljcm9ibG9nX3VzZXI=','c'.'29jaWF'.'sbmV'.'0d29yaw='.'=',''.'YWxsb3'.'dfb'.'Wl'.'jcm9ibG'.'9nX2dyb'.'3'.'Vw','WQ'.'='.'=','S'.'UQ'.'=','c29j'.'aWFsbmV0d29ya'.'w==','Y'.'Wxsb3d'.'fbWl'.'jcm9ibG9'.'n'.'X'.'2dyb3V'.'w','SUQ=','c2'.'9'.'jaWFsb'.'mV0d2'.'9yaw==','YWxsb3'.'d'.'fbWljcm'.'9ibG9nX2dyb3Vw','Tg==','','','Q'.'UNUSVZF','WQ'.'==','c29jaWFsbmV0d29yaw'.'==','Y'.'Wxs'.'b3dfZ'.'ml'.'s'.'ZX'.'Nf'.'dXN'.'lcg==','WQ'.'==','SUQ'.'=',''.'c'.'29j'.'aWF'.'sbmV'.'0d29y'.'a'.'w==',''.'YWxs'.'b'.'3dfZmlsZ'.'XN'.'fdXN'.'lcg==','S'.'UQ=','c29jaW'.'Fsbm'.'V0'.'d29yaw==','Y'.'Wxsb3df'.'Zml'.'sZXNfdXN'.'lcg==','Tg==','','','QUNUSVZ'.'F','WQ'.'==','c29ja'.'WF'.'sb'.'mV0'.'d'.'29yaw'.'==','YWxs'.'b3'.'dfYm'.'x'.'vZ191c'.'2'.'V'.'y','WQ='.'=','SUQ=','c2'.'9jaWFsbmV'.'0d29yaw==','YWxsb3dfYm'.'x'.'vZ1'.'91c2Vy','SUQ'.'=','c29jaWF'.'sbmV0d2'.'9'.'yaw==',''.'YWxsb3d'.'f'.'Y'.'mxvZ191c2'.'Vy','Tg'.'==','','',''.'QUN'.'USVZ'.'F','WQ'.'==','c'.'29jaW'.'Fs'.'bmV0d29yaw'.'==',''.'YWxsb3'.'d'.'fcGhvdG9fdX'.'Nlcg==','WQ'.'==',''.'SUQ'.'=','c2'.'9'.'ja'.'WFsbmV'.'0'.'d29yaw'.'==','YWxs'.'b'.'3dfcGhvdG9fdXNlcg==','SUQ'.'=',''.'c29j'.'aWFs'.'bmV'.'0d29yaw==','Y'.'Wxsb3'.'dfcGhv'.'dG9'.'fdX'.'Nlcg==','Tg==','','','QUN'.'USV'.'ZF','WQ==','c2'.'9jaWFs'.'bmV0d'.'29'.'ya'.'w==','YWxsb3d'.'fZm'.'9'.'yd'.'W1f'.'dXNl'.'cg==','WQ='.'=','SU'.'Q=','c29jaWF'.'s'.'bmV0d'.'2'.'9ya'.'w'.'='.'=','Y'.'Wxsb3'.'d'.'fZm'.'9ydW1fdX'.'Nlcg==','SUQ'.'=','c2'.'9jaWF'.'s'.'bmV0d2'.'9ya'.'w==','YWxsb3dfZm9y'.'dW1fd'.'XNlcg==','Tg='.'=','','','Q'.'UNUSVZF','W'.'Q'.'==','c29'.'jaWF'.'sbmV0d29y'.'aw'.'==','YWx'.'sb3d'.'fd'.'GFz'.'a'.'3Nf'.'dX'.'Nlcg='.'=','WQ'.'='.'=','SUQ=','c2'.'9jaWFsbmV'.'0d29y'.'aw==',''.'YWx'.'sb3df'.'dGFza3'.'N'.'f'.'dXNlcg'.'==','S'.'UQ=',''.'c29jaWFsb'.'mV'.'0d29yaw==','YWx'.'sb3dfdGF'.'za'.'3NfdXNlcg='.'=',''.'c2'.'9jaWFsbm'.'V'.'0d29yaw==',''.'YWxsb3dfd'.'GFza3Nf'.'Z3Jv'.'d'.'XA=','WQ==','S'.'UQ=','c29jaWFsbmV'.'0d29ya'.'w==',''.'YW'.'xsb3dfdGFza3Nf'.'Z3'.'JvdX'.'A=',''.'SUQ'.'=',''.'c29jaWFsbmV0d29yaw==','Y'.'Wxsb3dfdGFza'.'3NfZ3Jv'.'dXA=',''.'dGFza'.'3'.'M=','Tg='.'=','','','QUNUSVZF',''.'W'.'Q==','c'.'29jaWFs'.'bmV0'.'d2'.'9yaw==','YWxsb3dfY'.'2FsZW5kY'.'XJfdXNlc'.'g==',''.'W'.'Q==','S'.'UQ=','c2'.'9ja'.'WF'.'sbmV0d29ya'.'w==','Y'.'Wxsb3dfY2F'.'sZW5kYXJ'.'fdXN'.'lcg='.'=','SUQ=',''.'c29'.'j'.'aWFsb'.'mV0'.'d29yaw==','YWxsb3df'.'Y2FsZW'.'5kY'.'XJfdX'.'Nl'.'cg==',''.'c29jaWF'.'sbmV0'.'d29yaw='.'=',''.'YWxs'.'b3d'.'fY2FsZW'.'5kYXJfZ3JvdXA'.'=','WQ==','SUQ'.'=','c29jaWF'.'sb'.'m'.'V0d29yaw==','YWxsb'.'3df'.'Y2FsZW'.'5kYX'.'J'.'fZ'.'3JvdXA'.'=','S'.'UQ=','c29j'.'aWF'.'sbmV'.'0d29yaw==','YWxsb'.'3df'.'Y2'.'FsZ'.'W5kYX'.'Jf'.'Z3J'.'vdXA=','QU'.'NUSVZF','W'.'Q==','Tg==','ZXh'.'0'.'c'.'mFuZX'.'Q=','aWJsb2Nr','T25BZnR'.'lc'.'k'.'lCbG9ja0VsZW'.'1l'.'b'.'n'.'RV'.'c'.'GRhdGU=','aW5'.'0cmF'.'uZX'.'Q'.'=','Q0ludHJh'.'bmV0R'.'XZ'.'lbnR'.'IYW5kb'.'GVycw==','U1B'.'S'.'ZWdpc3'.'RlclVwZ'.'G'.'F0ZWRJ'.'dGVt','Q'.'0l'.'udHJ'.'hbmV0U2hh'.'cmVw'.'b'.'2ludDo6QW'.'dlb'.'nR'.'MaXN0c'.'y'.'gpO'.'w='.'=','aW5'.'0c'.'mFuZXQ=','Tg==',''.'Q'.'0ludHJhb'.'mV0U2hhcmVw'.'b'.'2l'.'udDo'.'6QWdlb'.'nRRdWV'.'1ZSgp'.'Ow==','a'.'W50cmFuZXQ'.'=','T'.'g==','Q'.'0l'.'u'.'dH'.'J'.'hbmV0U2h'.'hcm'.'Vw'.'b2ludDo6QWdlbn'.'RVcGRhd'.'G'.'UoK'.'Ts=','aW50cmF'.'uZ'.'XQ=','Tg==','aWJsb2Nr',''.'T'.'25BZnRlcklC'.'b'.'G9j'.'a'.'0Vs'.'ZW1lb'.'n'.'RBZGQ'.'=',''.'aW50'.'cmFuZXQ'.'=',''.'Q0lu'.'dH'.'JhbmV0RXZ'.'lb'.'nRIYW5k'.'bGV'.'yc'.'w='.'=','U1B'.'SZW'.'d'.'pc3'.'RlclVwZGF0ZWRJdGVt',''.'aWJsb2'.'Nr','T2'.'5'.'B'.'ZnRlcklCbG9ja'.'0VsZW1lbn'.'RVc'.'GRhdGU=','aW50c'.'mFuZ'.'XQ=','Q0l'.'udHJhbmV0R'.'XZlbnR'.'IYW5k'.'bG'.'Vycw='.'=','U1BSZ'.'W'.'dpc3RlclVwZGF0ZW'.'RJd'.'GVt','Q0'.'lud'.'HJhbm'.'V0U2'.'hh'.'cm'.'Vw'.'b'.'2lud'.'Do6QWdlbnRMaXN'.'0cygpOw==',''.'aW5'.'0cmFuZXQ=',''.'Q0ludHJ'.'hbmV0U2h'.'hcm'.'Vwb2ludDo6QWd'.'lbnRRdWV1ZSgp'.'O'.'w='.'=',''.'aW50cmF'.'uZXQ=','Q0l'.'udHJhbmV0U2hhcmVwb2'.'ludDo6'.'QWdlbnRVcGR'.'hd'.'G'.'UoKTs=','aW50cmFuZXQ=','Y3Jt','b'.'WFpbg==','T'.'25C'.'ZWZ'.'vc'.'mV'.'Qcm9sb2c=',''.'bW'.'Fpbg==',''.'Q1'.'dpemFyZFNvbFB'.'h'.'b'.'mVsSW50cm'.'FuZXQ=','U2'.'hv'.'d1BhbmVs','L21'.'vZHVs'.'Z'.'XMvaW50cm'.'F'.'u'.'Z'.'XQvcGFu'.'ZWxfYnV0dG9u'.'LnBocA==','RU5'.'D'.'T'.'0RF','WQ'.'='.'=');return base64_decode($_128332425[$_1215386474]);}};$GLOBALS['____1009283622'][0](___590489705(0), ___590489705(1));class CBXFeatures{ private static $_593358002= 30; private static $_1351351300= array( "Portal" => array( "CompanyCalendar", "CompanyPhoto", "CompanyVideo", "CompanyCareer", "StaffChanges", "StaffAbsence", "CommonDocuments", "MeetingRoomBookingSystem", "Wiki", "Learning", "Vote", "WebLink", "Subscribe", "Friends", "PersonalFiles", "PersonalBlog", "PersonalPhoto", "PersonalForum", "Blog", "Forum", "Gallery", "Board", "MicroBlog", "WebMessenger",), "Communications" => array( "Tasks", "Calendar", "Workgroups", "Jabber", "VideoConference", "Extranet", "SMTP", "Requests", "DAV", "intranet_sharepoint", "timeman", "Idea", "Meeting", "EventList", "Salary", "XDImport",), "Enterprise" => array( "BizProc", "Lists", "Support", "Analytics", "crm", "Controller", "LdapUnlimitedUsers",), "Holding" => array( "Cluster", "MultiSites",),); private static $_722179564= null; private static $_1824058552= null; private static function __781319540(){ if(self::$_722179564 === null){ self::$_722179564= array(); foreach(self::$_1351351300 as $_1796380944 => $_55462095){ foreach($_55462095 as $_1795156582) self::$_722179564[$_1795156582]= $_1796380944;}} if(self::$_1824058552 === null){ self::$_1824058552= array(); $_1826058081= COption::GetOptionString(___590489705(2), ___590489705(3), ___590489705(4)); if($_1826058081 != ___590489705(5)){ $_1826058081= $GLOBALS['____1009283622'][1]($_1826058081); $_1826058081= $GLOBALS['____1009283622'][2]($_1826058081,[___590489705(6) => false]); if($GLOBALS['____1009283622'][3]($_1826058081)){ self::$_1824058552= $_1826058081;}} if(empty(self::$_1824058552)){ self::$_1824058552= array(___590489705(7) => array(), ___590489705(8) => array());}}} public static function InitiateEditionsSettings($_384794625){ self::__781319540(); $_1498734115= array(); foreach(self::$_1351351300 as $_1796380944 => $_55462095){ $_1644981337= $GLOBALS['____1009283622'][4]($_1796380944, $_384794625); self::$_1824058552[___590489705(9)][$_1796380944]=($_1644981337? array(___590489705(10)): array(___590489705(11))); foreach($_55462095 as $_1795156582){ self::$_1824058552[___590489705(12)][$_1795156582]= $_1644981337; if(!$_1644981337) $_1498734115[]= array($_1795156582, false);}} $_1365626048= $GLOBALS['____1009283622'][5](self::$_1824058552); $_1365626048= $GLOBALS['____1009283622'][6]($_1365626048); COption::SetOptionString(___590489705(13), ___590489705(14), $_1365626048); foreach($_1498734115 as $_1691850245) self::__1092845127($_1691850245[(918-2*459)], $_1691850245[round(0+0.5+0.5)]);} public static function IsFeatureEnabled($_1795156582){ if($_1795156582 == '') return true; self::__781319540(); if(!isset(self::$_722179564[$_1795156582])) return true; if(self::$_722179564[$_1795156582] == ___590489705(15)) $_1228787598= array(___590489705(16)); elseif(isset(self::$_1824058552[___590489705(17)][self::$_722179564[$_1795156582]])) $_1228787598= self::$_1824058552[___590489705(18)][self::$_722179564[$_1795156582]]; else $_1228787598= array(___590489705(19)); if($_1228787598[(1336/2-668)] != ___590489705(20) && $_1228787598[(149*2-298)] != ___590489705(21)){ return false;} elseif($_1228787598[(196*2-392)] == ___590489705(22)){ if($_1228787598[round(0+0.2+0.2+0.2+0.2+0.2)]< $GLOBALS['____1009283622'][7]((1064/2-532),(208*2-416),(768-2*384), Date(___590489705(23)), $GLOBALS['____1009283622'][8](___590489705(24))- self::$_593358002, $GLOBALS['____1009283622'][9](___590489705(25)))){ if(!isset($_1228787598[round(0+0.66666666666667+0.66666666666667+0.66666666666667)]) ||!$_1228787598[round(0+1+1)]) self::__553011567(self::$_722179564[$_1795156582]); return false;}} return!isset(self::$_1824058552[___590489705(26)][$_1795156582]) || self::$_1824058552[___590489705(27)][$_1795156582];} public static function IsFeatureInstalled($_1795156582){ if($GLOBALS['____1009283622'][10]($_1795156582) <= 0) return true; self::__781319540(); return(isset(self::$_1824058552[___590489705(28)][$_1795156582]) && self::$_1824058552[___590489705(29)][$_1795156582]);} public static function IsFeatureEditable($_1795156582){ if($_1795156582 == '') return true; self::__781319540(); if(!isset(self::$_722179564[$_1795156582])) return true; if(self::$_722179564[$_1795156582] == ___590489705(30)) $_1228787598= array(___590489705(31)); elseif(isset(self::$_1824058552[___590489705(32)][self::$_722179564[$_1795156582]])) $_1228787598= self::$_1824058552[___590489705(33)][self::$_722179564[$_1795156582]]; else $_1228787598= array(___590489705(34)); if($_1228787598[(882-2*441)] != ___590489705(35) && $_1228787598[(189*2-378)] != ___590489705(36)){ return false;} elseif($_1228787598[min(132,0,44)] == ___590489705(37)){ if($_1228787598[round(0+0.5+0.5)]< $GLOBALS['____1009283622'][11]((207*2-414), min(238,0,79.333333333333),(244*2-488), Date(___590489705(38)), $GLOBALS['____1009283622'][12](___590489705(39))- self::$_593358002, $GLOBALS['____1009283622'][13](___590489705(40)))){ if(!isset($_1228787598[round(0+2)]) ||!$_1228787598[round(0+2)]) self::__553011567(self::$_722179564[$_1795156582]); return false;}} return true;} private static function __1092845127($_1795156582, $_974984676){ if($GLOBALS['____1009283622'][14]("CBXFeatures", "On".$_1795156582."SettingsChange")) $GLOBALS['____1009283622'][15](array("CBXFeatures", "On".$_1795156582."SettingsChange"), array($_1795156582, $_974984676)); $_1804859232= $GLOBALS['_____1428242642'][0](___590489705(41), ___590489705(42).$_1795156582.___590489705(43)); while($_1430039948= $_1804859232->Fetch()) $GLOBALS['_____1428242642'][1]($_1430039948, array($_1795156582, $_974984676));} public static function SetFeatureEnabled($_1795156582, $_974984676= true, $_1113772883= true){ if($GLOBALS['____1009283622'][16]($_1795156582) <= 0) return; if(!self::IsFeatureEditable($_1795156582)) $_974984676= false; $_974984676= (bool)$_974984676; self::__781319540(); $_432712881=(!isset(self::$_1824058552[___590489705(44)][$_1795156582]) && $_974984676 || isset(self::$_1824058552[___590489705(45)][$_1795156582]) && $_974984676 != self::$_1824058552[___590489705(46)][$_1795156582]); self::$_1824058552[___590489705(47)][$_1795156582]= $_974984676; $_1365626048= $GLOBALS['____1009283622'][17](self::$_1824058552); $_1365626048= $GLOBALS['____1009283622'][18]($_1365626048); COption::SetOptionString(___590489705(48), ___590489705(49), $_1365626048); if($_432712881 && $_1113772883) self::__1092845127($_1795156582, $_974984676);} private static function __553011567($_1796380944){ if($GLOBALS['____1009283622'][19]($_1796380944) <= 0 || $_1796380944 == "Portal") return; self::__781319540(); if(!isset(self::$_1824058552[___590489705(50)][$_1796380944]) || self::$_1824058552[___590489705(51)][$_1796380944][min(128,0,42.666666666667)] != ___590489705(52)) return; if(isset(self::$_1824058552[___590489705(53)][$_1796380944][round(0+0.66666666666667+0.66666666666667+0.66666666666667)]) && self::$_1824058552[___590489705(54)][$_1796380944][round(0+0.5+0.5+0.5+0.5)]) return; $_1498734115= array(); if(isset(self::$_1351351300[$_1796380944]) && $GLOBALS['____1009283622'][20](self::$_1351351300[$_1796380944])){ foreach(self::$_1351351300[$_1796380944] as $_1795156582){ if(isset(self::$_1824058552[___590489705(55)][$_1795156582]) && self::$_1824058552[___590489705(56)][$_1795156582]){ self::$_1824058552[___590489705(57)][$_1795156582]= false; $_1498734115[]= array($_1795156582, false);}} self::$_1824058552[___590489705(58)][$_1796380944][round(0+0.5+0.5+0.5+0.5)]= true;} $_1365626048= $GLOBALS['____1009283622'][21](self::$_1824058552); $_1365626048= $GLOBALS['____1009283622'][22]($_1365626048); COption::SetOptionString(___590489705(59), ___590489705(60), $_1365626048); foreach($_1498734115 as $_1691850245) self::__1092845127($_1691850245[(960-2*480)], $_1691850245[round(0+0.5+0.5)]);} public static function ModifyFeaturesSettings($_384794625, $_55462095){ self::__781319540(); foreach($_384794625 as $_1796380944 => $_1513563924) self::$_1824058552[___590489705(61)][$_1796380944]= $_1513563924; $_1498734115= array(); foreach($_55462095 as $_1795156582 => $_974984676){ if(!isset(self::$_1824058552[___590489705(62)][$_1795156582]) && $_974984676 || isset(self::$_1824058552[___590489705(63)][$_1795156582]) && $_974984676 != self::$_1824058552[___590489705(64)][$_1795156582]) $_1498734115[]= array($_1795156582, $_974984676); self::$_1824058552[___590489705(65)][$_1795156582]= $_974984676;} $_1365626048= $GLOBALS['____1009283622'][23](self::$_1824058552); $_1365626048= $GLOBALS['____1009283622'][24]($_1365626048); COption::SetOptionString(___590489705(66), ___590489705(67), $_1365626048); self::$_1824058552= false; foreach($_1498734115 as $_1691850245) self::__1092845127($_1691850245[(1184/2-592)], $_1691850245[round(0+1)]);} public static function SaveFeaturesSettings($_1106686242, $_1335174646){ self::__781319540(); $_826648477= array(___590489705(68) => array(), ___590489705(69) => array()); if(!$GLOBALS['____1009283622'][25]($_1106686242)) $_1106686242= array(); if(!$GLOBALS['____1009283622'][26]($_1335174646)) $_1335174646= array(); if(!$GLOBALS['____1009283622'][27](___590489705(70), $_1106686242)) $_1106686242[]= ___590489705(71); foreach(self::$_1351351300 as $_1796380944 => $_55462095){ if(isset(self::$_1824058552[___590489705(72)][$_1796380944])){ $_1579735822= self::$_1824058552[___590489705(73)][$_1796380944];} else{ $_1579735822=($_1796380944 == ___590489705(74)? array(___590489705(75)): array(___590489705(76)));} if($_1579735822[min(246,0,82)] == ___590489705(77) || $_1579735822[(233*2-466)] == ___590489705(78)){ $_826648477[___590489705(79)][$_1796380944]= $_1579735822;} else{ if($GLOBALS['____1009283622'][28]($_1796380944, $_1106686242)) $_826648477[___590489705(80)][$_1796380944]= array(___590489705(81), $GLOBALS['____1009283622'][29]((848-2*424), min(212,0,70.666666666667),(142*2-284), $GLOBALS['____1009283622'][30](___590489705(82)), $GLOBALS['____1009283622'][31](___590489705(83)), $GLOBALS['____1009283622'][32](___590489705(84)))); else $_826648477[___590489705(85)][$_1796380944]= array(___590489705(86));}} $_1498734115= array(); foreach(self::$_722179564 as $_1795156582 => $_1796380944){ if($_826648477[___590489705(87)][$_1796380944][(1224/2-612)] != ___590489705(88) && $_826648477[___590489705(89)][$_1796380944][min(130,0,43.333333333333)] != ___590489705(90)){ $_826648477[___590489705(91)][$_1795156582]= false;} else{ if($_826648477[___590489705(92)][$_1796380944][(207*2-414)] == ___590489705(93) && $_826648477[___590489705(94)][$_1796380944][round(0+0.5+0.5)]< $GLOBALS['____1009283622'][33]((209*2-418),(900-2*450),(830-2*415), Date(___590489705(95)), $GLOBALS['____1009283622'][34](___590489705(96))- self::$_593358002, $GLOBALS['____1009283622'][35](___590489705(97)))) $_826648477[___590489705(98)][$_1795156582]= false; else $_826648477[___590489705(99)][$_1795156582]= $GLOBALS['____1009283622'][36]($_1795156582, $_1335174646); if(!isset(self::$_1824058552[___590489705(100)][$_1795156582]) && $_826648477[___590489705(101)][$_1795156582] || isset(self::$_1824058552[___590489705(102)][$_1795156582]) && $_826648477[___590489705(103)][$_1795156582] != self::$_1824058552[___590489705(104)][$_1795156582]) $_1498734115[]= array($_1795156582, $_826648477[___590489705(105)][$_1795156582]);}} $_1365626048= $GLOBALS['____1009283622'][37]($_826648477); $_1365626048= $GLOBALS['____1009283622'][38]($_1365626048); COption::SetOptionString(___590489705(106), ___590489705(107), $_1365626048); self::$_1824058552= false; foreach($_1498734115 as $_1691850245) self::__1092845127($_1691850245[(924-2*462)], $_1691850245[round(0+1)]);} public static function GetFeaturesList(){ self::__781319540(); $_1873763030= array(); foreach(self::$_1351351300 as $_1796380944 => $_55462095){ if(isset(self::$_1824058552[___590489705(108)][$_1796380944])){ $_1579735822= self::$_1824058552[___590489705(109)][$_1796380944];} else{ $_1579735822=($_1796380944 == ___590489705(110)? array(___590489705(111)): array(___590489705(112)));} $_1873763030[$_1796380944]= array( ___590489705(113) => $_1579735822[(187*2-374)], ___590489705(114) => $_1579735822[round(0+0.25+0.25+0.25+0.25)], ___590489705(115) => array(),); $_1873763030[$_1796380944][___590489705(116)]= false; if($_1873763030[$_1796380944][___590489705(117)] == ___590489705(118)){ $_1873763030[$_1796380944][___590489705(119)]= $GLOBALS['____1009283622'][39](($GLOBALS['____1009283622'][40]()- $_1873763030[$_1796380944][___590489705(120)])/ round(0+17280+17280+17280+17280+17280)); if($_1873763030[$_1796380944][___590489705(121)]> self::$_593358002) $_1873763030[$_1796380944][___590489705(122)]= true;} foreach($_55462095 as $_1795156582) $_1873763030[$_1796380944][___590489705(123)][$_1795156582]=(!isset(self::$_1824058552[___590489705(124)][$_1795156582]) || self::$_1824058552[___590489705(125)][$_1795156582]);} return $_1873763030;} private static function __473449417($_924973083, $_1980156980){ if(IsModuleInstalled($_924973083) == $_1980156980) return true; $_367347405= $_SERVER[___590489705(126)].___590489705(127).$_924973083.___590489705(128); if(!$GLOBALS['____1009283622'][41]($_367347405)) return false; include_once($_367347405); $_97729169= $GLOBALS['____1009283622'][42](___590489705(129), ___590489705(130), $_924973083); if(!$GLOBALS['____1009283622'][43]($_97729169)) return false; $_1971748744= new $_97729169; if($_1980156980){ if(!$_1971748744->InstallDB()) return false; $_1971748744->InstallEvents(); if(!$_1971748744->InstallFiles()) return false;} else{ if(CModule::IncludeModule(___590489705(131))) CSearch::DeleteIndex($_924973083); UnRegisterModule($_924973083);} return true;} protected static function OnRequestsSettingsChange($_1795156582, $_974984676){ self::__473449417("form", $_974984676);} protected static function OnLearningSettingsChange($_1795156582, $_974984676){ self::__473449417("learning", $_974984676);} protected static function OnJabberSettingsChange($_1795156582, $_974984676){ self::__473449417("xmpp", $_974984676);} protected static function OnVideoConferenceSettingsChange($_1795156582, $_974984676){ self::__473449417("video", $_974984676);} protected static function OnBizProcSettingsChange($_1795156582, $_974984676){ self::__473449417("bizprocdesigner", $_974984676);} protected static function OnListsSettingsChange($_1795156582, $_974984676){ self::__473449417("lists", $_974984676);} protected static function OnWikiSettingsChange($_1795156582, $_974984676){ self::__473449417("wiki", $_974984676);} protected static function OnSupportSettingsChange($_1795156582, $_974984676){ self::__473449417("support", $_974984676);} protected static function OnControllerSettingsChange($_1795156582, $_974984676){ self::__473449417("controller", $_974984676);} protected static function OnAnalyticsSettingsChange($_1795156582, $_974984676){ self::__473449417("statistic", $_974984676);} protected static function OnVoteSettingsChange($_1795156582, $_974984676){ self::__473449417("vote", $_974984676);} protected static function OnFriendsSettingsChange($_1795156582, $_974984676){ if($_974984676) $_50295217= "Y"; else $_50295217= ___590489705(132); $_2092410867= CSite::GetList(___590489705(133), ___590489705(134), array(___590489705(135) => ___590489705(136))); while($_634169079= $_2092410867->Fetch()){ if(COption::GetOptionString(___590489705(137), ___590489705(138), ___590489705(139), $_634169079[___590489705(140)]) != $_50295217){ COption::SetOptionString(___590489705(141), ___590489705(142), $_50295217, false, $_634169079[___590489705(143)]); COption::SetOptionString(___590489705(144), ___590489705(145), $_50295217);}}} protected static function OnMicroBlogSettingsChange($_1795156582, $_974984676){ if($_974984676) $_50295217= "Y"; else $_50295217= ___590489705(146); $_2092410867= CSite::GetList(___590489705(147), ___590489705(148), array(___590489705(149) => ___590489705(150))); while($_634169079= $_2092410867->Fetch()){ if(COption::GetOptionString(___590489705(151), ___590489705(152), ___590489705(153), $_634169079[___590489705(154)]) != $_50295217){ COption::SetOptionString(___590489705(155), ___590489705(156), $_50295217, false, $_634169079[___590489705(157)]); COption::SetOptionString(___590489705(158), ___590489705(159), $_50295217);} if(COption::GetOptionString(___590489705(160), ___590489705(161), ___590489705(162), $_634169079[___590489705(163)]) != $_50295217){ COption::SetOptionString(___590489705(164), ___590489705(165), $_50295217, false, $_634169079[___590489705(166)]); COption::SetOptionString(___590489705(167), ___590489705(168), $_50295217);}}} protected static function OnPersonalFilesSettingsChange($_1795156582, $_974984676){ if($_974984676) $_50295217= "Y"; else $_50295217= ___590489705(169); $_2092410867= CSite::GetList(___590489705(170), ___590489705(171), array(___590489705(172) => ___590489705(173))); while($_634169079= $_2092410867->Fetch()){ if(COption::GetOptionString(___590489705(174), ___590489705(175), ___590489705(176), $_634169079[___590489705(177)]) != $_50295217){ COption::SetOptionString(___590489705(178), ___590489705(179), $_50295217, false, $_634169079[___590489705(180)]); COption::SetOptionString(___590489705(181), ___590489705(182), $_50295217);}}} protected static function OnPersonalBlogSettingsChange($_1795156582, $_974984676){ if($_974984676) $_50295217= "Y"; else $_50295217= ___590489705(183); $_2092410867= CSite::GetList(___590489705(184), ___590489705(185), array(___590489705(186) => ___590489705(187))); while($_634169079= $_2092410867->Fetch()){ if(COption::GetOptionString(___590489705(188), ___590489705(189), ___590489705(190), $_634169079[___590489705(191)]) != $_50295217){ COption::SetOptionString(___590489705(192), ___590489705(193), $_50295217, false, $_634169079[___590489705(194)]); COption::SetOptionString(___590489705(195), ___590489705(196), $_50295217);}}} protected static function OnPersonalPhotoSettingsChange($_1795156582, $_974984676){ if($_974984676) $_50295217= "Y"; else $_50295217= ___590489705(197); $_2092410867= CSite::GetList(___590489705(198), ___590489705(199), array(___590489705(200) => ___590489705(201))); while($_634169079= $_2092410867->Fetch()){ if(COption::GetOptionString(___590489705(202), ___590489705(203), ___590489705(204), $_634169079[___590489705(205)]) != $_50295217){ COption::SetOptionString(___590489705(206), ___590489705(207), $_50295217, false, $_634169079[___590489705(208)]); COption::SetOptionString(___590489705(209), ___590489705(210), $_50295217);}}} protected static function OnPersonalForumSettingsChange($_1795156582, $_974984676){ if($_974984676) $_50295217= "Y"; else $_50295217= ___590489705(211); $_2092410867= CSite::GetList(___590489705(212), ___590489705(213), array(___590489705(214) => ___590489705(215))); while($_634169079= $_2092410867->Fetch()){ if(COption::GetOptionString(___590489705(216), ___590489705(217), ___590489705(218), $_634169079[___590489705(219)]) != $_50295217){ COption::SetOptionString(___590489705(220), ___590489705(221), $_50295217, false, $_634169079[___590489705(222)]); COption::SetOptionString(___590489705(223), ___590489705(224), $_50295217);}}} protected static function OnTasksSettingsChange($_1795156582, $_974984676){ if($_974984676) $_50295217= "Y"; else $_50295217= ___590489705(225); $_2092410867= CSite::GetList(___590489705(226), ___590489705(227), array(___590489705(228) => ___590489705(229))); while($_634169079= $_2092410867->Fetch()){ if(COption::GetOptionString(___590489705(230), ___590489705(231), ___590489705(232), $_634169079[___590489705(233)]) != $_50295217){ COption::SetOptionString(___590489705(234), ___590489705(235), $_50295217, false, $_634169079[___590489705(236)]); COption::SetOptionString(___590489705(237), ___590489705(238), $_50295217);} if(COption::GetOptionString(___590489705(239), ___590489705(240), ___590489705(241), $_634169079[___590489705(242)]) != $_50295217){ COption::SetOptionString(___590489705(243), ___590489705(244), $_50295217, false, $_634169079[___590489705(245)]); COption::SetOptionString(___590489705(246), ___590489705(247), $_50295217);}} self::__473449417(___590489705(248), $_974984676);} protected static function OnCalendarSettingsChange($_1795156582, $_974984676){ if($_974984676) $_50295217= "Y"; else $_50295217= ___590489705(249); $_2092410867= CSite::GetList(___590489705(250), ___590489705(251), array(___590489705(252) => ___590489705(253))); while($_634169079= $_2092410867->Fetch()){ if(COption::GetOptionString(___590489705(254), ___590489705(255), ___590489705(256), $_634169079[___590489705(257)]) != $_50295217){ COption::SetOptionString(___590489705(258), ___590489705(259), $_50295217, false, $_634169079[___590489705(260)]); COption::SetOptionString(___590489705(261), ___590489705(262), $_50295217);} if(COption::GetOptionString(___590489705(263), ___590489705(264), ___590489705(265), $_634169079[___590489705(266)]) != $_50295217){ COption::SetOptionString(___590489705(267), ___590489705(268), $_50295217, false, $_634169079[___590489705(269)]); COption::SetOptionString(___590489705(270), ___590489705(271), $_50295217);}}} protected static function OnSMTPSettingsChange($_1795156582, $_974984676){ self::__473449417("mail", $_974984676);} protected static function OnExtranetSettingsChange($_1795156582, $_974984676){ $_1636816156= COption::GetOptionString("extranet", "extranet_site", ""); if($_1636816156){ $_593371480= new CSite; $_593371480->Update($_1636816156, array(___590489705(272) =>($_974984676? ___590489705(273): ___590489705(274))));} self::__473449417(___590489705(275), $_974984676);} protected static function OnDAVSettingsChange($_1795156582, $_974984676){ self::__473449417("dav", $_974984676);} protected static function OntimemanSettingsChange($_1795156582, $_974984676){ self::__473449417("timeman", $_974984676);} protected static function Onintranet_sharepointSettingsChange($_1795156582, $_974984676){ if($_974984676){ RegisterModuleDependences("iblock", "OnAfterIBlockElementAdd", "intranet", "CIntranetEventHandlers", "SPRegisterUpdatedItem"); RegisterModuleDependences(___590489705(276), ___590489705(277), ___590489705(278), ___590489705(279), ___590489705(280)); CAgent::AddAgent(___590489705(281), ___590489705(282), ___590489705(283), round(0+100+100+100+100+100)); CAgent::AddAgent(___590489705(284), ___590489705(285), ___590489705(286), round(0+300)); CAgent::AddAgent(___590489705(287), ___590489705(288), ___590489705(289), round(0+720+720+720+720+720));} else{ UnRegisterModuleDependences(___590489705(290), ___590489705(291), ___590489705(292), ___590489705(293), ___590489705(294)); UnRegisterModuleDependences(___590489705(295), ___590489705(296), ___590489705(297), ___590489705(298), ___590489705(299)); CAgent::RemoveAgent(___590489705(300), ___590489705(301)); CAgent::RemoveAgent(___590489705(302), ___590489705(303)); CAgent::RemoveAgent(___590489705(304), ___590489705(305));}} protected static function OncrmSettingsChange($_1795156582, $_974984676){ if($_974984676) COption::SetOptionString("crm", "form_features", "Y"); self::__473449417(___590489705(306), $_974984676);} protected static function OnClusterSettingsChange($_1795156582, $_974984676){ self::__473449417("cluster", $_974984676);} protected static function OnMultiSitesSettingsChange($_1795156582, $_974984676){ if($_974984676) RegisterModuleDependences("main", "OnBeforeProlog", "main", "CWizardSolPanelIntranet", "ShowPanel", 100, "/modules/intranet/panel_button.php"); else UnRegisterModuleDependences(___590489705(307), ___590489705(308), ___590489705(309), ___590489705(310), ___590489705(311), ___590489705(312));} protected static function OnIdeaSettingsChange($_1795156582, $_974984676){ self::__473449417("idea", $_974984676);} protected static function OnMeetingSettingsChange($_1795156582, $_974984676){ self::__473449417("meeting", $_974984676);} protected static function OnXDImportSettingsChange($_1795156582, $_974984676){ self::__473449417("xdimport", $_974984676);}} $GLOBALS['____1009283622'][44](___590489705(313), ___590489705(314));/**/			//Do not remove this

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
$kernelSession['SESS_IP'] = $_SERVER['REMOTE_ADDR'];
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

/*ZDUyZmZZWNhYzA1YTNiZjExODY0NzQ4ZTE3ZDViZTgyMDljNjY=*/$GLOBALS['____1841531111']= array(base64_decode('bX'.'Rfcm'.'FuZA='.'='),base64_decode(''.'ZXhw'.'bG9kZQ=='),base64_decode('c'.'GF'.'j'.'a'.'w=='),base64_decode('bWQ1'),base64_decode(''.'Y'.'29uc3'.'Rh'.'bnQ='),base64_decode('a'.'GFzaF'.'9'.'obWFj'),base64_decode(''.'c3R'.'y'.'Y21'.'w'),base64_decode('aXN'.'f'.'b2Jq'.'ZWN0'),base64_decode('Y2FsbF91'.'c2VyX2Z1bm'.'M='),base64_decode('Y2FsbF91'.'c'.'2VyX2Z1bmM='),base64_decode('Y2FsbF'.'91c2'.'VyX'.'2Z1bm'.'M='),base64_decode('Y2'.'Fs'.'bF91c2VyX'.'2'.'Z1bmM'.'='),base64_decode(''.'Y2FsbF9'.'1c2VyX'.'2Z1bmM='));if(!function_exists(__NAMESPACE__.'\\___682223966')){function ___682223966($_979334982){static $_840892297= false; if($_840892297 == false) $_840892297=array('RE'.'I'.'=',''.'U0V'.'M'.'RUNUIFZ'.'BTF'.'VFI'.'EZ'.'ST'.'00gY'.'l9vcH'.'Rp'.'b24gV0hFU'.'kUgTkFNRT'.'0nflBBUkFNX01BWF9VU0'.'VSUycgQU'.'5EIE1PRFVMRV9JRD0nbW'.'FpbicgQ'.'U5EIFNJV'.'EV'.'fSUQgSV'.'Mg'.'TlVM'.'TA'.'==','VkF'.'MV'.'UU'.'=',''.'Lg==','SCo=','Yml'.'0cml4','TElDRU5TRV9LRVk=',''.'c'.'2h'.'hM'.'jU'.'2','VVNFUg'.'==','VVNFUg==','V'.'V'.'NF'.'Ug==','SXNBdXRob3JpemVk','VVN'.'F'.'Ug==',''.'SXNB'.'ZG'.'1p'.'bg==','Q'.'VBQTElD'.'QVR'.'JT04=','Um'.'VzdGFydEJ'.'1ZmZlc'.'g='.'=','TG'.'9jY'.'WxSZ'.'W'.'RpcmVjdA==','L'.'2x'.'pY'.'2Vuc2V'.'fcmVzdHJ'.'pY'.'3Rpb24'.'uc'.'Ghw','XEJpd'.'HJpeF'.'xNYWluXEN'.'v'.'bm'.'Z'.'pZ1xPcHRpb24'.'6OnNld'.'A'.'='.'=','bW'.'Fpb'.'g='.'=',''.'U'.'EF'.'SQU'.'1f'.'T'.'UFYX1VTR'.'VJ'.'T');return base64_decode($_840892297[$_979334982]);}};if($GLOBALS['____1841531111'][0](round(0+0.2+0.2+0.2+0.2+0.2), round(0+6.6666666666667+6.6666666666667+6.6666666666667)) == round(0+1.4+1.4+1.4+1.4+1.4)){ $_212546792= $GLOBALS[___682223966(0)]->Query(___682223966(1), true); if($_857818270= $_212546792->Fetch()){ $_16477272= $_857818270[___682223966(2)]; list($_1934743318, $_1840898156)= $GLOBALS['____1841531111'][1](___682223966(3), $_16477272); $_1280621973= $GLOBALS['____1841531111'][2](___682223966(4), $_1934743318); $_2015640460= ___682223966(5).$GLOBALS['____1841531111'][3]($GLOBALS['____1841531111'][4](___682223966(6))); $_639843268= $GLOBALS['____1841531111'][5](___682223966(7), $_1840898156, $_2015640460, true); if($GLOBALS['____1841531111'][6]($_639843268, $_1280621973) !==(144*2-288)){ if(isset($GLOBALS[___682223966(8)]) && $GLOBALS['____1841531111'][7]($GLOBALS[___682223966(9)]) && $GLOBALS['____1841531111'][8](array($GLOBALS[___682223966(10)], ___682223966(11))) &&!$GLOBALS['____1841531111'][9](array($GLOBALS[___682223966(12)], ___682223966(13)))){ $GLOBALS['____1841531111'][10](array($GLOBALS[___682223966(14)], ___682223966(15))); $GLOBALS['____1841531111'][11](___682223966(16), ___682223966(17), true);}}} else{ $GLOBALS['____1841531111'][12](___682223966(18), ___682223966(19), ___682223966(20), round(0+12));}}/**/       //Do not remove this

