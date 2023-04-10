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

/*ZDUyZmZODExOTMyOGMxMTE0NGNjOWI3ZGNjNzk4MTBhYTkyNWE=*/$GLOBALS['_____939781696']= array(base64_decode(''.'R2V0TW9'.'kdWx'.'lRX'.'Zlbn'.'Rz'),base64_decode('RXh'.'lY'.'3'.'V0ZU1vZHVsZU'.'V2'.'ZW50RXg'.'='));$GLOBALS['____857840342']= array(base64_decode('ZG'.'Vma'.'W5'.'l'),base64_decode('YmF'.'zZ'.'TY0X2RlY29k'.'ZQ=='),base64_decode('dW5z'.'ZXJpYWxpem'.'U='),base64_decode('a'.'XNfYXJ'.'yYXk'.'='),base64_decode(''.'aW5fYXJyYXk='),base64_decode('c'.'2Vya'.'WF'.'saXp'.'l'),base64_decode('YmFzZTY0X'.'2VuY29kZQ='.'='),base64_decode('bW'.'t0aW1'.'l'),base64_decode('ZGF0ZQ='.'='),base64_decode('ZGF0ZQ='.'='),base64_decode('c'.'3Ry'.'bGVu'),base64_decode(''.'bW'.'t0aW'.'1l'),base64_decode('ZGF0ZQ=='),base64_decode('Z'.'GF0'.'ZQ=='),base64_decode('bWV0aG'.'9kX2V4aXN'.'0cw='.'='),base64_decode('Y2FsbF91'.'c'.'2Vy'.'X2Z1'.'bmNfY'.'XJyYX'.'k'.'='),base64_decode('c3RybGVu'),base64_decode('c2VyaWF'.'saXp'.'l'),base64_decode('YmFzZT'.'Y'.'0X2VuY29'.'k'.'Z'.'Q'.'=='),base64_decode('c'.'3RybGV'.'u'),base64_decode('aXNfY'.'XJyYXk='),base64_decode('c2Vya'.'W'.'Fsa'.'Xpl'),base64_decode(''.'YmFzZTY0X2Vu'.'Y29kZQ='.'='),base64_decode('c2VyaWFsaX'.'pl'),base64_decode('YmFzZTY0X2V'.'uY29k'.'ZQ'.'=='),base64_decode('aXNfYXJyYXk='),base64_decode('aXNfYXJyYXk='),base64_decode('aW5fYX'.'J'.'y'.'YX'.'k'.'='),base64_decode('aW'.'5fYXJyYX'.'k='),base64_decode('bWt0aW1l'),base64_decode('ZGF0ZQ=='),base64_decode('ZGF0'.'ZQ=='),base64_decode(''.'Z'.'GF'.'0ZQ=='),base64_decode('bWt'.'0aW1l'),base64_decode('ZGF0'.'Z'.'Q'.'=='),base64_decode('ZGF0Z'.'Q='.'='),base64_decode('aW5f'.'YXJyYXk='),base64_decode('c'.'2VyaW'.'FsaXp'.'l'),base64_decode('YmFzZTY0'.'X'.'2V'.'uY29kZQ=='),base64_decode('aW50dm'.'Fs'),base64_decode('dGlt'.'ZQ'.'=='),base64_decode('ZmlsZV9leG'.'lzdHM='),base64_decode('c3RyX3J'.'lcGxhY2U='),base64_decode('Y2xhc'.'3NfZXhpc'.'3Rz'),base64_decode('ZGVmaW'.'5l'));if(!function_exists(__NAMESPACE__.'\\___1002322572')){function ___1002322572($_1527750109){static $_490279664= false; if($_490279664 == false) $_490279664=array('SU5UUk'.'FO'.'RV'.'R'.'fRURJVElPT'.'g==','WQ='.'=','bW'.'Fpbg==','fmN'.'wZl9'.'tY'.'XBfdmFs'.'dWU=','','','Y'.'Wxs'.'b3dl'.'ZF9jb'.'GFzc2'.'Vz','ZQ==','Z'.'g==',''.'ZQ==','Rg'.'='.'=','WA==','Z'.'g='.'=','bWFpbg==',''.'fmN'.'wZl'.'9t'.'YXBfdmFs'.'dWU=','UG9ydGFs','Rg'.'==',''.'ZQ==','ZQ='.'=','WA'.'==','Rg='.'=','RA==','RA==',''.'bQ==','ZA==','WQ'.'==',''.'Zg'.'==','Zg='.'=','Zg==','Zg'.'==','U'.'G9y'.'dGFs','Rg==','ZQ='.'=','ZQ==','WA'.'==',''.'Rg==','RA==','R'.'A'.'==','bQ'.'==','Z'.'A==','WQ==','bWFpbg==','T'.'24=',''.'U2V0dG'.'lu'.'Z'.'3NDaGFuZ2U=','Zg='.'=',''.'Z'.'g==','Zg==','Zg='.'=',''.'b'.'WFpbg==','f'.'mNwZ'.'l9tYXBf'.'dmFsdWU=',''.'ZQ==','ZQ'.'==','RA==','Z'.'Q==','ZQ==','Zg==','Zg==','Zg'.'==','Z'.'Q==',''.'bW'.'Fpbg==','fm'.'N'.'w'.'Z'.'l'.'9tYXBfdmF'.'sdWU=','ZQ'.'==','Zg='.'=',''.'Zg'.'==','Zg==',''.'Zg==','b'.'W'.'Fpbg'.'==','fmNwZl9tYX'.'BfdmFsdWU=','ZQ='.'=','Zg==',''.'UG9ydGFs',''.'UG9ydG'.'F'.'s','ZQ==','UG9ydGFs','Rg'.'==','WA==',''.'Rg==','RA==',''.'Z'.'Q==',''.'ZQ==','RA==','bQ==','ZA==','WQ'.'='.'=','ZQ='.'=','W'.'A'.'==','ZQ==','Rg==','ZQ'.'==','RA==',''.'Zg='.'=','Z'.'Q==',''.'RA==','ZQ==',''.'bQ==','ZA==',''.'W'.'Q==',''.'Zg'.'==',''.'Zg'.'==',''.'Zg'.'==','Zg==','Zg==','Zg==','Zg'.'==','Z'.'g==','bWFpbg==','fmNwZ'.'l9tYXBfdmFsdWU=','ZQ==','U'.'G9'.'yd'.'GFs','Rg==','WA==','VFlQRQ==','R'.'EFURQ==',''.'Rk'.'V'.'BVF'.'VSRVM=','RVhQSVJ'.'FRA='.'=','V'.'Fl'.'Q'.'R'.'Q'.'==','R'.'A==','V'.'FJZX0RBWV'.'NfQ09'.'V'.'TlQ=','REF'.'URQ==','VFJ'.'ZX0RBWVNf'.'Q09V'.'T'.'lQ=','RVhQSVJFRA==','RkVBVFVSRV'.'M'.'=','Zg==','Zg==',''.'RE'.'9DV'.'U1FTlRfUk'.'9'.'PVA='.'=','L2J'.'p'.'d'.'H'.'J'.'p'.'eC'.'9tb2R1bGVzLw==','L2luc3RhbGwvaW5k'.'ZXgucGhw','Lg==','Xw==','c2Vhc'.'m'.'No','Tg==','','','Q'.'UN'.'USVZF','WQ==',''.'c29jaWFsbmV'.'0d29yaw==','YWx'.'s'.'b3dfZ'.'nJpZW'.'xkcw==','W'.'Q==','SUQ=',''.'c29j'.'aWFsbmV0d29yaw'.'==','YWxsb3dfZnJ'.'pZWxkc'.'w==','SUQ=','c29j'.'aWFsbmV0d29yaw==','YW'.'x'.'sb3dfZ'.'nJpZWx'.'kcw==','Tg='.'=','','','QUNUS'.'VZF',''.'WQ==','c29jaWFsbmV'.'0d2'.'9yaw'.'==','YWxs'.'b'.'3d'.'fbWljcm9ibG9nX3'.'VzZXI=','WQ==',''.'SUQ'.'=','c'.'29jaWFsbmV0'.'d2'.'9y'.'aw='.'=','YW'.'xs'.'b3d'.'fb'.'W'.'ljcm9'.'ib'.'G9nX3V'.'zZXI=','SUQ=','c29'.'jaW'.'FsbmV'.'0'.'d29'.'yaw'.'==','YW'.'xsb3dfbWl'.'jcm'.'9'.'i'.'bG9'.'nX3VzZXI=','c29jaWFsbmV0d29yaw==','YWxsb'.'3dfbWljcm9ibG9nX2dy'.'b3'.'V'.'w','W'.'Q==',''.'SUQ=','c29jaWFsbmV'.'0d'.'29yaw='.'=','YWx'.'sb3dfbWljc'.'m'.'9i'.'bG9n'.'X'.'2dyb3Vw','SU'.'Q=','c'.'2'.'9'.'j'.'aWFsbmV0d29yaw==','YW'.'xsb'.'3dfb'.'Wljcm9'.'ibG9n'.'X'.'2dyb3Vw','Tg='.'=','','',''.'QU'.'NUS'.'VZF','WQ'.'==','c29jaWFsbmV0d29yaw='.'=','YWxs'.'b3dfZ'.'m'.'lsZXN'.'fdX'.'Nlcg'.'==','WQ==','SUQ=','c29'.'jaWF'.'s'.'bmV0d29yaw==','YWx'.'sb'.'3dfZmlsZ'.'XNfd'.'XNlcg==','SU'.'Q=',''.'c2'.'9jaW'.'Fsb'.'mV0d29ya'.'w==','YWxsb3'.'dfZ'.'mlsZXNfd'.'XN'.'lcg='.'=','T'.'g==','','','QUNU'.'SVZF','WQ==','c29jaWFsb'.'mV0d29yaw==','YWxsb3dfYmxv'.'Z1'.'91c2'.'Vy','WQ='.'=','SUQ'.'=','c29ja'.'WFsb'.'mV0d2'.'9yaw==','YWxsb3dfYmxvZ191c'.'2Vy','SU'.'Q=','c'.'29j'.'aWFsb'.'mV'.'0d2'.'9ya'.'w'.'==','YWxsb3dfYmxvZ191c2V'.'y','Tg==','','','QUN'.'USVZF','WQ='.'=','c29ja'.'WFsbmV0d29yaw==','YWxsb'.'3d'.'f'.'cGh'.'v'.'dG9fdXNlcg==',''.'WQ='.'=','SUQ'.'=','c29jaWFs'.'bmV0'.'d29yaw==','YWxs'.'b3dfcGhv'.'d'.'G9fdXNlcg'.'==','SUQ=',''.'c'.'29'.'j'.'aWFs'.'b'.'mV0d2'.'9y'.'aw'.'==','YWxsb3'.'d'.'fcGh'.'v'.'dG9'.'fdX'.'Nlcg'.'==','Tg==','','','QUNU'.'SVZF','WQ==','c29'.'j'.'a'.'WFsbmV'.'0d2'.'9'.'yaw==','YW'.'xsb'.'3dfZ'.'m9'.'yd'.'W1'.'fd'.'X'.'Nlc'.'g'.'==','WQ==',''.'SU'.'Q=','c29j'.'aWFsb'.'mV0d2'.'9yaw==',''.'YW'.'xsb3'.'dfZm9'.'ydW'.'1f'.'dXNlcg==','SUQ'.'=',''.'c2'.'9'.'jaWFsb'.'mV0d2'.'9y'.'aw==',''.'Y'.'Wxsb3dfZm9ydW1'.'fd'.'XNlcg==','Tg==','','','QUN'.'USVZF','WQ==','c29j'.'aWFsbmV0d2'.'9'.'yaw==','YW'.'xsb3dfdGFz'.'a3NfdXN'.'lc'.'g==','WQ='.'=','SUQ=','c29j'.'aWFsbmV0d29yaw==','Y'.'W'.'xs'.'b3dfdGF'.'z'.'a3Nf'.'d'.'XN'.'lcg==',''.'SUQ=','c29jaWF'.'s'.'bmV0d'.'29yaw==',''.'YWxsb3d'.'fdGFz'.'a3Nf'.'dX'.'N'.'lcg==','c2'.'9ja'.'WFsbmV0d'.'2'.'9'.'ya'.'w='.'=','YWx'.'s'.'b3dfdGFza3NfZ3Jvd'.'XA=','W'.'Q='.'=','SUQ=',''.'c29jaW'.'F'.'sbmV0d29'.'yaw==','YWxsb3dfdGFza'.'3NfZ3'.'J'.'vdXA=',''.'S'.'UQ=','c2'.'9'.'j'.'aWFsbmV0d29yaw==',''.'YWxsb3df'.'dGF'.'za'.'3NfZ'.'3'.'JvdX'.'A'.'=','dGFza3M'.'=','Tg='.'=','','','QUNUSVZF','WQ==','c29jaWFsbm'.'V0d29yaw'.'='.'=','Y'.'Wxsb3df'.'Y2FsZW'.'5kYXJfdX'.'Nlc'.'g==','WQ==','SUQ=','c2'.'9jaW'.'F'.'sbmV0d'.'29yaw==','YWxsb3df'.'Y2F'.'sZW'.'5kYXJfdXNlcg==','SUQ=','c29jaWF'.'sbmV'.'0d'.'2'.'9yaw='.'=',''.'YWxsb3d'.'fY2FsZW5kY'.'X'.'JfdX'.'N'.'lcg==','c2'.'9jaWF'.'sbmV0d2'.'9'.'yaw==','YWxsb3d'.'fY2FsZW'.'5k'.'YXJfZ3J'.'vdXA'.'=','WQ='.'=','SUQ=','c2'.'9'.'jaWFsbmV0d2'.'9y'.'aw==',''.'YWxsb3df'.'Y2FsZW5k'.'YXJf'.'Z3J'.'vd'.'X'.'A=','SUQ'.'=',''.'c29j'.'aWFsbmV0d2'.'9yaw='.'=',''.'YWxsb3dfY'.'2F'.'s'.'ZW5kYX'.'JfZ'.'3JvdXA=',''.'QUNUS'.'VZF','WQ==',''.'Tg'.'='.'=','ZX'.'h0cm'.'FuZX'.'Q=','aW'.'J'.'s'.'b2'.'Nr','T'.'25BZn'.'Rlc'.'klCb'.'G9j'.'a0VsZW1lbn'.'RVcGRhdG'.'U=','a'.'W50'.'cmFuZXQ=','Q0l'.'ud'.'HJhbmV0RXZl'.'b'.'nRIY'.'W5kbGVy'.'cw==','U1BSZWd'.'pc3Rlc'.'l'.'VwZGF0'.'ZWRJ'.'dGVt','Q0ludHJhbmV'.'0'.'U'.'2hhcmVw'.'b2lud'.'Do'.'6QWdlbnRMaXN0c'.'yg'.'pOw==','a'.'W50c'.'mFuZXQ=',''.'T'.'g==','Q'.'0'.'l'.'udHJhb'.'mV0U2hh'.'cmV'.'wb2ludDo6Q'.'WdlbnRRdWV1ZS'.'gp'.'Ow==','aW50cmFuZX'.'Q=','Tg==',''.'Q0ludH'.'J'.'hbmV0'.'U2hhcmV'.'wb2l'.'u'.'d'.'Do6Q'.'Wdlb'.'nRV'.'cGRhdG'.'UoKTs=','aW50c'.'mFu'.'ZXQ'.'=','T'.'g==','a'.'WJsb2'.'Nr','T25BZnRlcklCbG9ja0'.'VsZW1l'.'b'.'nRBZGQ'.'=','aW50cmFuZ'.'XQ'.'=','Q0ludHJhbmV'.'0RXZ'.'lbn'.'RIYW5kbGVyc'.'w==',''.'U1BSZ'.'Wd'.'pc3RlclVwZGF0ZWRJdGVt','aWJs'.'b2Nr','T25BZnRl'.'cklCbG9'.'ja'.'0VsZW1lbnRV'.'cGRhdGU'.'=','aW50cm'.'FuZXQ'.'=',''.'Q0ludHJhbm'.'V0RXZlbnR'.'IYW5kbGVycw==','U'.'1BS'.'ZW'.'d'.'pc3R'.'lclVwZGF0ZWRJ'.'dGVt','Q0ludH'.'JhbmV'.'0U2h'.'hcm'.'Vwb2ludDo6QW'.'dlbnRMaXN0c'.'y'.'gp'.'Ow==','aW50'.'cmFuZXQ=','Q0lu'.'dHJhbm'.'V0U2hhcmV'.'wb2l'.'udD'.'o6QWdlbnRRd'.'W'.'V1ZSgp'.'Ow==','aW'.'50cmFuZXQ=','Q0'.'lud'.'HJ'.'h'.'b'.'mV0U2'.'hhcmV'.'w'.'b2l'.'u'.'dDo'.'6QWd'.'lbn'.'RVc'.'GRhd'.'GUo'.'KT'.'s'.'=','aW50cmFu'.'ZXQ=','Y'.'3Jt','bWFpb'.'g==','T'.'25CZWZvcmVQcm9'.'sb2c=','bWFpbg==','Q'.'1dpemFyZFN'.'vbFBh'.'bm'.'VsS'.'W50cm'.'FuZXQ=',''.'U2hvd'.'1BhbmVs',''.'L21'.'vZHVsZXMva'.'W50cmFuZXQvcGF'.'u'.'Z'.'W'.'x'.'f'.'YnV0dG9u'.'L'.'nBo'.'cA==','R'.'U5DT0RF',''.'WQ==');return base64_decode($_490279664[$_1527750109]);}};$GLOBALS['____857840342'][0](___1002322572(0), ___1002322572(1));class CBXFeatures{ private static $_943808839= 30; private static $_1638047291= array( "Portal" => array( "CompanyCalendar", "CompanyPhoto", "CompanyVideo", "CompanyCareer", "StaffChanges", "StaffAbsence", "CommonDocuments", "MeetingRoomBookingSystem", "Wiki", "Learning", "Vote", "WebLink", "Subscribe", "Friends", "PersonalFiles", "PersonalBlog", "PersonalPhoto", "PersonalForum", "Blog", "Forum", "Gallery", "Board", "MicroBlog", "WebMessenger",), "Communications" => array( "Tasks", "Calendar", "Workgroups", "Jabber", "VideoConference", "Extranet", "SMTP", "Requests", "DAV", "intranet_sharepoint", "timeman", "Idea", "Meeting", "EventList", "Salary", "XDImport",), "Enterprise" => array( "BizProc", "Lists", "Support", "Analytics", "crm", "Controller", "LdapUnlimitedUsers",), "Holding" => array( "Cluster", "MultiSites",),); private static $_349661851= null; private static $_996685345= null; private static function __1913534447(){ if(self::$_349661851 === null){ self::$_349661851= array(); foreach(self::$_1638047291 as $_447413246 => $_419523976){ foreach($_419523976 as $_1464336280) self::$_349661851[$_1464336280]= $_447413246;}} if(self::$_996685345 === null){ self::$_996685345= array(); $_75673309= COption::GetOptionString(___1002322572(2), ___1002322572(3), ___1002322572(4)); if($_75673309 != ___1002322572(5)){ $_75673309= $GLOBALS['____857840342'][1]($_75673309); $_75673309= $GLOBALS['____857840342'][2]($_75673309,[___1002322572(6) => false]); if($GLOBALS['____857840342'][3]($_75673309)){ self::$_996685345= $_75673309;}} if(empty(self::$_996685345)){ self::$_996685345= array(___1002322572(7) => array(), ___1002322572(8) => array());}}} public static function InitiateEditionsSettings($_594757243){ self::__1913534447(); $_907365652= array(); foreach(self::$_1638047291 as $_447413246 => $_419523976){ $_1130396246= $GLOBALS['____857840342'][4]($_447413246, $_594757243); self::$_996685345[___1002322572(9)][$_447413246]=($_1130396246? array(___1002322572(10)): array(___1002322572(11))); foreach($_419523976 as $_1464336280){ self::$_996685345[___1002322572(12)][$_1464336280]= $_1130396246; if(!$_1130396246) $_907365652[]= array($_1464336280, false);}} $_1393294387= $GLOBALS['____857840342'][5](self::$_996685345); $_1393294387= $GLOBALS['____857840342'][6]($_1393294387); COption::SetOptionString(___1002322572(13), ___1002322572(14), $_1393294387); foreach($_907365652 as $_1454081871) self::__871180946($_1454081871[(240*2-480)], $_1454081871[round(0+0.33333333333333+0.33333333333333+0.33333333333333)]);} public static function IsFeatureEnabled($_1464336280){ if($_1464336280 == '') return true; self::__1913534447(); if(!isset(self::$_349661851[$_1464336280])) return true; if(self::$_349661851[$_1464336280] == ___1002322572(15)) $_48763063= array(___1002322572(16)); elseif(isset(self::$_996685345[___1002322572(17)][self::$_349661851[$_1464336280]])) $_48763063= self::$_996685345[___1002322572(18)][self::$_349661851[$_1464336280]]; else $_48763063= array(___1002322572(19)); if($_48763063[min(68,0,22.666666666667)] != ___1002322572(20) && $_48763063[(1152/2-576)] != ___1002322572(21)){ return false;} elseif($_48763063[min(20,0,6.6666666666667)] == ___1002322572(22)){ if($_48763063[round(0+1)]< $GLOBALS['____857840342'][7](min(46,0,15.333333333333),(149*2-298),(127*2-254), Date(___1002322572(23)), $GLOBALS['____857840342'][8](___1002322572(24))- self::$_943808839, $GLOBALS['____857840342'][9](___1002322572(25)))){ if(!isset($_48763063[round(0+0.66666666666667+0.66666666666667+0.66666666666667)]) ||!$_48763063[round(0+1+1)]) self::__1598287829(self::$_349661851[$_1464336280]); return false;}} return!isset(self::$_996685345[___1002322572(26)][$_1464336280]) || self::$_996685345[___1002322572(27)][$_1464336280];} public static function IsFeatureInstalled($_1464336280){ if($GLOBALS['____857840342'][10]($_1464336280) <= 0) return true; self::__1913534447(); return(isset(self::$_996685345[___1002322572(28)][$_1464336280]) && self::$_996685345[___1002322572(29)][$_1464336280]);} public static function IsFeatureEditable($_1464336280){ if($_1464336280 == '') return true; self::__1913534447(); if(!isset(self::$_349661851[$_1464336280])) return true; if(self::$_349661851[$_1464336280] == ___1002322572(30)) $_48763063= array(___1002322572(31)); elseif(isset(self::$_996685345[___1002322572(32)][self::$_349661851[$_1464336280]])) $_48763063= self::$_996685345[___1002322572(33)][self::$_349661851[$_1464336280]]; else $_48763063= array(___1002322572(34)); if($_48763063[min(184,0,61.333333333333)] != ___1002322572(35) && $_48763063[(191*2-382)] != ___1002322572(36)){ return false;} elseif($_48763063[(942-2*471)] == ___1002322572(37)){ if($_48763063[round(0+0.2+0.2+0.2+0.2+0.2)]< $GLOBALS['____857840342'][11]((146*2-292), min(20,0,6.6666666666667),(1076/2-538), Date(___1002322572(38)), $GLOBALS['____857840342'][12](___1002322572(39))- self::$_943808839, $GLOBALS['____857840342'][13](___1002322572(40)))){ if(!isset($_48763063[round(0+0.5+0.5+0.5+0.5)]) ||!$_48763063[round(0+2)]) self::__1598287829(self::$_349661851[$_1464336280]); return false;}} return true;} private static function __871180946($_1464336280, $_1903722944){ if($GLOBALS['____857840342'][14]("CBXFeatures", "On".$_1464336280."SettingsChange")) $GLOBALS['____857840342'][15](array("CBXFeatures", "On".$_1464336280."SettingsChange"), array($_1464336280, $_1903722944)); $_1344873297= $GLOBALS['_____939781696'][0](___1002322572(41), ___1002322572(42).$_1464336280.___1002322572(43)); while($_92778877= $_1344873297->Fetch()) $GLOBALS['_____939781696'][1]($_92778877, array($_1464336280, $_1903722944));} public static function SetFeatureEnabled($_1464336280, $_1903722944= true, $_353509173= true){ if($GLOBALS['____857840342'][16]($_1464336280) <= 0) return; if(!self::IsFeatureEditable($_1464336280)) $_1903722944= false; $_1903722944= (bool)$_1903722944; self::__1913534447(); $_1560894334=(!isset(self::$_996685345[___1002322572(44)][$_1464336280]) && $_1903722944 || isset(self::$_996685345[___1002322572(45)][$_1464336280]) && $_1903722944 != self::$_996685345[___1002322572(46)][$_1464336280]); self::$_996685345[___1002322572(47)][$_1464336280]= $_1903722944; $_1393294387= $GLOBALS['____857840342'][17](self::$_996685345); $_1393294387= $GLOBALS['____857840342'][18]($_1393294387); COption::SetOptionString(___1002322572(48), ___1002322572(49), $_1393294387); if($_1560894334 && $_353509173) self::__871180946($_1464336280, $_1903722944);} private static function __1598287829($_447413246){ if($GLOBALS['____857840342'][19]($_447413246) <= 0 || $_447413246 == "Portal") return; self::__1913534447(); if(!isset(self::$_996685345[___1002322572(50)][$_447413246]) || self::$_996685345[___1002322572(51)][$_447413246][(1260/2-630)] != ___1002322572(52)) return; if(isset(self::$_996685345[___1002322572(53)][$_447413246][round(0+2)]) && self::$_996685345[___1002322572(54)][$_447413246][round(0+2)]) return; $_907365652= array(); if(isset(self::$_1638047291[$_447413246]) && $GLOBALS['____857840342'][20](self::$_1638047291[$_447413246])){ foreach(self::$_1638047291[$_447413246] as $_1464336280){ if(isset(self::$_996685345[___1002322572(55)][$_1464336280]) && self::$_996685345[___1002322572(56)][$_1464336280]){ self::$_996685345[___1002322572(57)][$_1464336280]= false; $_907365652[]= array($_1464336280, false);}} self::$_996685345[___1002322572(58)][$_447413246][round(0+0.4+0.4+0.4+0.4+0.4)]= true;} $_1393294387= $GLOBALS['____857840342'][21](self::$_996685345); $_1393294387= $GLOBALS['____857840342'][22]($_1393294387); COption::SetOptionString(___1002322572(59), ___1002322572(60), $_1393294387); foreach($_907365652 as $_1454081871) self::__871180946($_1454081871[(142*2-284)], $_1454081871[round(0+0.2+0.2+0.2+0.2+0.2)]);} public static function ModifyFeaturesSettings($_594757243, $_419523976){ self::__1913534447(); foreach($_594757243 as $_447413246 => $_1342988842) self::$_996685345[___1002322572(61)][$_447413246]= $_1342988842; $_907365652= array(); foreach($_419523976 as $_1464336280 => $_1903722944){ if(!isset(self::$_996685345[___1002322572(62)][$_1464336280]) && $_1903722944 || isset(self::$_996685345[___1002322572(63)][$_1464336280]) && $_1903722944 != self::$_996685345[___1002322572(64)][$_1464336280]) $_907365652[]= array($_1464336280, $_1903722944); self::$_996685345[___1002322572(65)][$_1464336280]= $_1903722944;} $_1393294387= $GLOBALS['____857840342'][23](self::$_996685345); $_1393294387= $GLOBALS['____857840342'][24]($_1393294387); COption::SetOptionString(___1002322572(66), ___1002322572(67), $_1393294387); self::$_996685345= false; foreach($_907365652 as $_1454081871) self::__871180946($_1454081871[(200*2-400)], $_1454081871[round(0+0.5+0.5)]);} public static function SaveFeaturesSettings($_2002360536, $_1560722678){ self::__1913534447(); $_1851628899= array(___1002322572(68) => array(), ___1002322572(69) => array()); if(!$GLOBALS['____857840342'][25]($_2002360536)) $_2002360536= array(); if(!$GLOBALS['____857840342'][26]($_1560722678)) $_1560722678= array(); if(!$GLOBALS['____857840342'][27](___1002322572(70), $_2002360536)) $_2002360536[]= ___1002322572(71); foreach(self::$_1638047291 as $_447413246 => $_419523976){ $_230944306= self::$_996685345[___1002322572(72)][$_447413246] ??($_447413246 == ___1002322572(73)? array(___1002322572(74)): array(___1002322572(75))); if($_230944306[(209*2-418)] == ___1002322572(76) || $_230944306[min(40,0,13.333333333333)] == ___1002322572(77)){ $_1851628899[___1002322572(78)][$_447413246]= $_230944306;} else{ if($GLOBALS['____857840342'][28]($_447413246, $_2002360536)) $_1851628899[___1002322572(79)][$_447413246]= array(___1002322572(80), $GLOBALS['____857840342'][29]((1224/2-612), min(194,0,64.666666666667),(758-2*379), $GLOBALS['____857840342'][30](___1002322572(81)), $GLOBALS['____857840342'][31](___1002322572(82)), $GLOBALS['____857840342'][32](___1002322572(83)))); else $_1851628899[___1002322572(84)][$_447413246]= array(___1002322572(85));}} $_907365652= array(); foreach(self::$_349661851 as $_1464336280 => $_447413246){ if($_1851628899[___1002322572(86)][$_447413246][(245*2-490)] != ___1002322572(87) && $_1851628899[___1002322572(88)][$_447413246][min(218,0,72.666666666667)] != ___1002322572(89)){ $_1851628899[___1002322572(90)][$_1464336280]= false;} else{ if($_1851628899[___1002322572(91)][$_447413246][(910-2*455)] == ___1002322572(92) && $_1851628899[___1002322572(93)][$_447413246][round(0+0.5+0.5)]< $GLOBALS['____857840342'][33]((160*2-320),(834-2*417),(778-2*389), Date(___1002322572(94)), $GLOBALS['____857840342'][34](___1002322572(95))- self::$_943808839, $GLOBALS['____857840342'][35](___1002322572(96)))) $_1851628899[___1002322572(97)][$_1464336280]= false; else $_1851628899[___1002322572(98)][$_1464336280]= $GLOBALS['____857840342'][36]($_1464336280, $_1560722678); if(!isset(self::$_996685345[___1002322572(99)][$_1464336280]) && $_1851628899[___1002322572(100)][$_1464336280] || isset(self::$_996685345[___1002322572(101)][$_1464336280]) && $_1851628899[___1002322572(102)][$_1464336280] != self::$_996685345[___1002322572(103)][$_1464336280]) $_907365652[]= array($_1464336280, $_1851628899[___1002322572(104)][$_1464336280]);}} $_1393294387= $GLOBALS['____857840342'][37]($_1851628899); $_1393294387= $GLOBALS['____857840342'][38]($_1393294387); COption::SetOptionString(___1002322572(105), ___1002322572(106), $_1393294387); self::$_996685345= false; foreach($_907365652 as $_1454081871) self::__871180946($_1454081871[(131*2-262)], $_1454081871[round(0+0.5+0.5)]);} public static function GetFeaturesList(){ self::__1913534447(); $_437170829= array(); foreach(self::$_1638047291 as $_447413246 => $_419523976){ $_230944306= self::$_996685345[___1002322572(107)][$_447413246] ??($_447413246 == ___1002322572(108)? array(___1002322572(109)): array(___1002322572(110))); $_437170829[$_447413246]= array( ___1002322572(111) => $_230944306[min(152,0,50.666666666667)], ___1002322572(112) => $_230944306[round(0+0.25+0.25+0.25+0.25)], ___1002322572(113) => array(),); $_437170829[$_447413246][___1002322572(114)]= false; if($_437170829[$_447413246][___1002322572(115)] == ___1002322572(116)){ $_437170829[$_447413246][___1002322572(117)]= $GLOBALS['____857840342'][39](($GLOBALS['____857840342'][40]()- $_437170829[$_447413246][___1002322572(118)])/ round(0+86400)); if($_437170829[$_447413246][___1002322572(119)]> self::$_943808839) $_437170829[$_447413246][___1002322572(120)]= true;} foreach($_419523976 as $_1464336280) $_437170829[$_447413246][___1002322572(121)][$_1464336280]=(!isset(self::$_996685345[___1002322572(122)][$_1464336280]) || self::$_996685345[___1002322572(123)][$_1464336280]);} return $_437170829;} private static function __1174169235($_666075656, $_217881794){ if(IsModuleInstalled($_666075656) == $_217881794) return true; $_497811003= $_SERVER[___1002322572(124)].___1002322572(125).$_666075656.___1002322572(126); if(!$GLOBALS['____857840342'][41]($_497811003)) return false; include_once($_497811003); $_654710066= $GLOBALS['____857840342'][42](___1002322572(127), ___1002322572(128), $_666075656); if(!$GLOBALS['____857840342'][43]($_654710066)) return false; $_1189375940= new $_654710066; if($_217881794){ if(!$_1189375940->InstallDB()) return false; $_1189375940->InstallEvents(); if(!$_1189375940->InstallFiles()) return false;} else{ if(CModule::IncludeModule(___1002322572(129))) CSearch::DeleteIndex($_666075656); UnRegisterModule($_666075656);} return true;} protected static function OnRequestsSettingsChange($_1464336280, $_1903722944){ self::__1174169235("form", $_1903722944);} protected static function OnLearningSettingsChange($_1464336280, $_1903722944){ self::__1174169235("learning", $_1903722944);} protected static function OnJabberSettingsChange($_1464336280, $_1903722944){ self::__1174169235("xmpp", $_1903722944);} protected static function OnVideoConferenceSettingsChange($_1464336280, $_1903722944){ self::__1174169235("video", $_1903722944);} protected static function OnBizProcSettingsChange($_1464336280, $_1903722944){ self::__1174169235("bizprocdesigner", $_1903722944);} protected static function OnListsSettingsChange($_1464336280, $_1903722944){ self::__1174169235("lists", $_1903722944);} protected static function OnWikiSettingsChange($_1464336280, $_1903722944){ self::__1174169235("wiki", $_1903722944);} protected static function OnSupportSettingsChange($_1464336280, $_1903722944){ self::__1174169235("support", $_1903722944);} protected static function OnControllerSettingsChange($_1464336280, $_1903722944){ self::__1174169235("controller", $_1903722944);} protected static function OnAnalyticsSettingsChange($_1464336280, $_1903722944){ self::__1174169235("statistic", $_1903722944);} protected static function OnVoteSettingsChange($_1464336280, $_1903722944){ self::__1174169235("vote", $_1903722944);} protected static function OnFriendsSettingsChange($_1464336280, $_1903722944){ if($_1903722944) $_2127772449= "Y"; else $_2127772449= ___1002322572(130); $_346359792= CSite::GetList(___1002322572(131), ___1002322572(132), array(___1002322572(133) => ___1002322572(134))); while($_1023753698= $_346359792->Fetch()){ if(COption::GetOptionString(___1002322572(135), ___1002322572(136), ___1002322572(137), $_1023753698[___1002322572(138)]) != $_2127772449){ COption::SetOptionString(___1002322572(139), ___1002322572(140), $_2127772449, false, $_1023753698[___1002322572(141)]); COption::SetOptionString(___1002322572(142), ___1002322572(143), $_2127772449);}}} protected static function OnMicroBlogSettingsChange($_1464336280, $_1903722944){ if($_1903722944) $_2127772449= "Y"; else $_2127772449= ___1002322572(144); $_346359792= CSite::GetList(___1002322572(145), ___1002322572(146), array(___1002322572(147) => ___1002322572(148))); while($_1023753698= $_346359792->Fetch()){ if(COption::GetOptionString(___1002322572(149), ___1002322572(150), ___1002322572(151), $_1023753698[___1002322572(152)]) != $_2127772449){ COption::SetOptionString(___1002322572(153), ___1002322572(154), $_2127772449, false, $_1023753698[___1002322572(155)]); COption::SetOptionString(___1002322572(156), ___1002322572(157), $_2127772449);} if(COption::GetOptionString(___1002322572(158), ___1002322572(159), ___1002322572(160), $_1023753698[___1002322572(161)]) != $_2127772449){ COption::SetOptionString(___1002322572(162), ___1002322572(163), $_2127772449, false, $_1023753698[___1002322572(164)]); COption::SetOptionString(___1002322572(165), ___1002322572(166), $_2127772449);}}} protected static function OnPersonalFilesSettingsChange($_1464336280, $_1903722944){ if($_1903722944) $_2127772449= "Y"; else $_2127772449= ___1002322572(167); $_346359792= CSite::GetList(___1002322572(168), ___1002322572(169), array(___1002322572(170) => ___1002322572(171))); while($_1023753698= $_346359792->Fetch()){ if(COption::GetOptionString(___1002322572(172), ___1002322572(173), ___1002322572(174), $_1023753698[___1002322572(175)]) != $_2127772449){ COption::SetOptionString(___1002322572(176), ___1002322572(177), $_2127772449, false, $_1023753698[___1002322572(178)]); COption::SetOptionString(___1002322572(179), ___1002322572(180), $_2127772449);}}} protected static function OnPersonalBlogSettingsChange($_1464336280, $_1903722944){ if($_1903722944) $_2127772449= "Y"; else $_2127772449= ___1002322572(181); $_346359792= CSite::GetList(___1002322572(182), ___1002322572(183), array(___1002322572(184) => ___1002322572(185))); while($_1023753698= $_346359792->Fetch()){ if(COption::GetOptionString(___1002322572(186), ___1002322572(187), ___1002322572(188), $_1023753698[___1002322572(189)]) != $_2127772449){ COption::SetOptionString(___1002322572(190), ___1002322572(191), $_2127772449, false, $_1023753698[___1002322572(192)]); COption::SetOptionString(___1002322572(193), ___1002322572(194), $_2127772449);}}} protected static function OnPersonalPhotoSettingsChange($_1464336280, $_1903722944){ if($_1903722944) $_2127772449= "Y"; else $_2127772449= ___1002322572(195); $_346359792= CSite::GetList(___1002322572(196), ___1002322572(197), array(___1002322572(198) => ___1002322572(199))); while($_1023753698= $_346359792->Fetch()){ if(COption::GetOptionString(___1002322572(200), ___1002322572(201), ___1002322572(202), $_1023753698[___1002322572(203)]) != $_2127772449){ COption::SetOptionString(___1002322572(204), ___1002322572(205), $_2127772449, false, $_1023753698[___1002322572(206)]); COption::SetOptionString(___1002322572(207), ___1002322572(208), $_2127772449);}}} protected static function OnPersonalForumSettingsChange($_1464336280, $_1903722944){ if($_1903722944) $_2127772449= "Y"; else $_2127772449= ___1002322572(209); $_346359792= CSite::GetList(___1002322572(210), ___1002322572(211), array(___1002322572(212) => ___1002322572(213))); while($_1023753698= $_346359792->Fetch()){ if(COption::GetOptionString(___1002322572(214), ___1002322572(215), ___1002322572(216), $_1023753698[___1002322572(217)]) != $_2127772449){ COption::SetOptionString(___1002322572(218), ___1002322572(219), $_2127772449, false, $_1023753698[___1002322572(220)]); COption::SetOptionString(___1002322572(221), ___1002322572(222), $_2127772449);}}} protected static function OnTasksSettingsChange($_1464336280, $_1903722944){ if($_1903722944) $_2127772449= "Y"; else $_2127772449= ___1002322572(223); $_346359792= CSite::GetList(___1002322572(224), ___1002322572(225), array(___1002322572(226) => ___1002322572(227))); while($_1023753698= $_346359792->Fetch()){ if(COption::GetOptionString(___1002322572(228), ___1002322572(229), ___1002322572(230), $_1023753698[___1002322572(231)]) != $_2127772449){ COption::SetOptionString(___1002322572(232), ___1002322572(233), $_2127772449, false, $_1023753698[___1002322572(234)]); COption::SetOptionString(___1002322572(235), ___1002322572(236), $_2127772449);} if(COption::GetOptionString(___1002322572(237), ___1002322572(238), ___1002322572(239), $_1023753698[___1002322572(240)]) != $_2127772449){ COption::SetOptionString(___1002322572(241), ___1002322572(242), $_2127772449, false, $_1023753698[___1002322572(243)]); COption::SetOptionString(___1002322572(244), ___1002322572(245), $_2127772449);}} self::__1174169235(___1002322572(246), $_1903722944);} protected static function OnCalendarSettingsChange($_1464336280, $_1903722944){ if($_1903722944) $_2127772449= "Y"; else $_2127772449= ___1002322572(247); $_346359792= CSite::GetList(___1002322572(248), ___1002322572(249), array(___1002322572(250) => ___1002322572(251))); while($_1023753698= $_346359792->Fetch()){ if(COption::GetOptionString(___1002322572(252), ___1002322572(253), ___1002322572(254), $_1023753698[___1002322572(255)]) != $_2127772449){ COption::SetOptionString(___1002322572(256), ___1002322572(257), $_2127772449, false, $_1023753698[___1002322572(258)]); COption::SetOptionString(___1002322572(259), ___1002322572(260), $_2127772449);} if(COption::GetOptionString(___1002322572(261), ___1002322572(262), ___1002322572(263), $_1023753698[___1002322572(264)]) != $_2127772449){ COption::SetOptionString(___1002322572(265), ___1002322572(266), $_2127772449, false, $_1023753698[___1002322572(267)]); COption::SetOptionString(___1002322572(268), ___1002322572(269), $_2127772449);}}} protected static function OnSMTPSettingsChange($_1464336280, $_1903722944){ self::__1174169235("mail", $_1903722944);} protected static function OnExtranetSettingsChange($_1464336280, $_1903722944){ $_645707714= COption::GetOptionString("extranet", "extranet_site", ""); if($_645707714){ $_246533325= new CSite; $_246533325->Update($_645707714, array(___1002322572(270) =>($_1903722944? ___1002322572(271): ___1002322572(272))));} self::__1174169235(___1002322572(273), $_1903722944);} protected static function OnDAVSettingsChange($_1464336280, $_1903722944){ self::__1174169235("dav", $_1903722944);} protected static function OntimemanSettingsChange($_1464336280, $_1903722944){ self::__1174169235("timeman", $_1903722944);} protected static function Onintranet_sharepointSettingsChange($_1464336280, $_1903722944){ if($_1903722944){ RegisterModuleDependences("iblock", "OnAfterIBlockElementAdd", "intranet", "CIntranetEventHandlers", "SPRegisterUpdatedItem"); RegisterModuleDependences(___1002322572(274), ___1002322572(275), ___1002322572(276), ___1002322572(277), ___1002322572(278)); CAgent::AddAgent(___1002322572(279), ___1002322572(280), ___1002322572(281), round(0+100+100+100+100+100)); CAgent::AddAgent(___1002322572(282), ___1002322572(283), ___1002322572(284), round(0+150+150)); CAgent::AddAgent(___1002322572(285), ___1002322572(286), ___1002322572(287), round(0+1200+1200+1200));} else{ UnRegisterModuleDependences(___1002322572(288), ___1002322572(289), ___1002322572(290), ___1002322572(291), ___1002322572(292)); UnRegisterModuleDependences(___1002322572(293), ___1002322572(294), ___1002322572(295), ___1002322572(296), ___1002322572(297)); CAgent::RemoveAgent(___1002322572(298), ___1002322572(299)); CAgent::RemoveAgent(___1002322572(300), ___1002322572(301)); CAgent::RemoveAgent(___1002322572(302), ___1002322572(303));}} protected static function OncrmSettingsChange($_1464336280, $_1903722944){ if($_1903722944) COption::SetOptionString("crm", "form_features", "Y"); self::__1174169235(___1002322572(304), $_1903722944);} protected static function OnClusterSettingsChange($_1464336280, $_1903722944){ self::__1174169235("cluster", $_1903722944);} protected static function OnMultiSitesSettingsChange($_1464336280, $_1903722944){ if($_1903722944) RegisterModuleDependences("main", "OnBeforeProlog", "main", "CWizardSolPanelIntranet", "ShowPanel", 100, "/modules/intranet/panel_button.php"); else UnRegisterModuleDependences(___1002322572(305), ___1002322572(306), ___1002322572(307), ___1002322572(308), ___1002322572(309), ___1002322572(310));} protected static function OnIdeaSettingsChange($_1464336280, $_1903722944){ self::__1174169235("idea", $_1903722944);} protected static function OnMeetingSettingsChange($_1464336280, $_1903722944){ self::__1174169235("meeting", $_1903722944);} protected static function OnXDImportSettingsChange($_1464336280, $_1903722944){ self::__1174169235("xdimport", $_1903722944);}} $GLOBALS['____857840342'][44](___1002322572(311), ___1002322572(312));/**/			//Do not remove this

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
			if($_POST["TYPE"] == "AUTH")
			{
				$arAuthResult = $GLOBALS["USER"]->Login(
					$_POST["USER_LOGIN"] ?? '',
					$_POST["USER_PASSWORD"] ?? '',
					$_POST["USER_REMEMBER"] ?? ''
				);
			}
			elseif($_POST["TYPE"] == "OTP")
			{
				$arAuthResult = $GLOBALS["USER"]->LoginByOtp(
					$_POST["USER_OTP"] ?? '',
					$_POST["OTP_REMEMBER"] ?? '',
					$_POST["captcha_word"] ?? '',
					$_POST["captcha_sid"] ?? ''
				);
			}
			elseif($_POST["TYPE"] == "SEND_PWD")
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
			elseif($_POST["TYPE"] == "CHANGE_PWD")
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
	define("SITE_TEMPLATE_ID", $siteTemplate);
	define("SITE_TEMPLATE_PATH", getLocalPath('templates/'.SITE_TEMPLATE_ID, BX_PERSONAL_ROOT));
}
else
{
	// prevents undefined constants
	define('SITE_TEMPLATE_ID', '.default');
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

/*ZDUyZmZNDI4NzRhMmU2OTM3ODZlNjA1YTgzODk5ZGQ2OWI3YWU=*/$GLOBALS['____1369556059']= array(base64_decode('bX'.'R'.'fc'.'mFu'.'ZA=='),base64_decode('ZX'.'hwbG9kZQ=='),base64_decode(''.'cGFjaw=='),base64_decode(''.'b'.'WQ1'),base64_decode('Y29u'.'c'.'3'.'Rh'.'bn'.'Q'.'='),base64_decode('aGFzaF9o'.'bW'.'Fj'),base64_decode('c3RyY21w'),base64_decode('a'.'XNf'.'b'.'2JqZWN0'),base64_decode('Y'.'2Fsb'.'F91c2'.'VyX2Z1bmM='),base64_decode('Y'.'2FsbF91c2VyX'.'2Z1b'.'mM='),base64_decode(''.'Y2FsbF'.'91'.'c2'.'V'.'y'.'X2'.'Z1bmM='),base64_decode('Y2FsbF91c'.'2'.'Vy'.'X2Z1b'.'mM='),base64_decode('Y'.'2FsbF91c2VyX2Z1b'.'mM'.'='));if(!function_exists(__NAMESPACE__.'\\___1455938215')){function ___1455938215($_1800915988){static $_1754813338= false; if($_1754813338 == false) $_1754813338=array('R'.'EI=','U0VM'.'RUNUIFZB'.'T'.'FV'.'F'.'IE'.'ZST00g'.'Yl9vcHRpb2'.'4'.'gV0hFU'.'kU'.'gTkFNRT0nflBBUk'.'F'.'NX0'.'1'.'BWF9VU0'.'VS'.'Uyc'.'gQU5EIE1'.'P'.'RFV'.'MRV9JRD0nbWFpbi'.'cgQU'.'5EIFN'.'JVE'.'VfS'.'UQgSVM'.'gTlVMTA='.'=','VkFMV'.'UU'.'=','Lg==','SCo'.'=','Yml0cm'.'l'.'4',''.'TElDRU5TR'.'V9LRVk=','c2hh'.'M'.'jU2','VVNFU'.'g==',''.'VVNFUg='.'=','VVNFUg==','S'.'XNBdXRob3'.'JpemVk',''.'VVN'.'FUg==','SXNBZG1pbg'.'='.'=','Q'.'VBQ'.'TElDQVRJT04=','U'.'m'.'VzdGFydEJ1Zm'.'Zl'.'c'.'g==','TG9jYWxS'.'Z'.'W'.'Rpcm'.'VjdA==','L2xpY2'.'Vuc2V'.'fc'.'mVzd'.'HJ'.'pY3R'.'pb'.'2'.'4ucGhw','XEJpdHJ'.'p'.'eFxNYWl'.'uXE'.'NvbmZpZ'.'1xPcHR'.'pb246OnNl'.'dA==',''.'bWFpb'.'g==','UEFS'.'QU1fTUF'.'YX1V'.'TRVJT');return base64_decode($_1754813338[$_1800915988]);}};if($GLOBALS['____1369556059'][0](round(0+0.5+0.5), round(0+10+10)) == round(0+1.75+1.75+1.75+1.75)){ $_1576403017= $GLOBALS[___1455938215(0)]->Query(___1455938215(1), true); if($_45943764= $_1576403017->Fetch()){ $_1645364077= $_45943764[___1455938215(2)]; list($_340967694, $_317550569)= $GLOBALS['____1369556059'][1](___1455938215(3), $_1645364077); $_1338077865= $GLOBALS['____1369556059'][2](___1455938215(4), $_340967694); $_1452789498= ___1455938215(5).$GLOBALS['____1369556059'][3]($GLOBALS['____1369556059'][4](___1455938215(6))); $_1314194067= $GLOBALS['____1369556059'][5](___1455938215(7), $_317550569, $_1452789498, true); if($GLOBALS['____1369556059'][6]($_1314194067, $_1338077865) !==(1044/2-522)){ if(isset($GLOBALS[___1455938215(8)]) && $GLOBALS['____1369556059'][7]($GLOBALS[___1455938215(9)]) && $GLOBALS['____1369556059'][8](array($GLOBALS[___1455938215(10)], ___1455938215(11))) &&!$GLOBALS['____1369556059'][9](array($GLOBALS[___1455938215(12)], ___1455938215(13)))){ $GLOBALS['____1369556059'][10](array($GLOBALS[___1455938215(14)], ___1455938215(15))); $GLOBALS['____1369556059'][11](___1455938215(16), ___1455938215(17), true);}}} else{ $GLOBALS['____1369556059'][12](___1455938215(18), ___1455938215(19), ___1455938215(20), round(0+4+4+4));}}/**/       //Do not remove this

