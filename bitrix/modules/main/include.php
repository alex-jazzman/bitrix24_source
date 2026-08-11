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

/*ZDUyZmZMjBmOWM5NDY1MzNlOGIwMTA5ZmM3NzRiZGY1YzM5ODQ=*/$GLOBALS['_____2058832361']= array(base64_decode('R2V0T'.'W9kdWxlRXZlbnRz'),base64_decode('R'.'Xh'.'l'.'Y3V0ZU1v'.'ZHV'.'sZUV2'.'ZW50RX'.'g='));$GLOBALS['____915428400']= array(base64_decode(''.'ZGV'.'maW5l'),base64_decode('YmF'.'zZTY0'.'X2Rl'.'Y2'.'9kZQ='.'='),base64_decode('dW5z'.'ZXJpYWx'.'pe'.'mU'.'='),base64_decode(''.'aXNf'.'YXJyY'.'Xk='),base64_decode('a'.'W'.'5fYXJyYXk'.'='),base64_decode('c2'.'V'.'ya'.'WFsa'.'Xpl'),base64_decode('YmFzZTY0X2'.'VuY29kZQ='.'='),base64_decode('bWt'.'0aW1'.'l'),base64_decode('Z'.'G'.'F0ZQ=='),base64_decode(''.'ZGF0'.'ZQ=='),base64_decode('c3RybGVu'),base64_decode('bWt0aW1l'),base64_decode('ZGF'.'0ZQ'.'=='),base64_decode('ZGF0ZQ'.'=='),base64_decode('bWV'.'0aG9kX2V4aXN0cw=='),base64_decode('Y'.'2F'.'sbF'.'91c2VyX2Z1bmN'.'f'.'YXJyYXk'.'='),base64_decode('c3'.'RybGVu'),base64_decode('c2Vy'.'aWF'.'saX'.'pl'),base64_decode(''.'YmFzZ'.'T'.'Y0X2VuY29kZQ=='),base64_decode('c3'.'RybGVu'),base64_decode(''.'aXN'.'fYXJyYXk='),base64_decode('c2VyaWFsaX'.'pl'),base64_decode('YmFzZTY0'.'X2V'.'uY'.'2'.'9kZQ=='),base64_decode('c2VyaWFsaXpl'),base64_decode('Y'.'mFz'.'ZTY0X2VuY2'.'9'.'kZQ='.'='),base64_decode('a'.'XNfYXJyYXk='),base64_decode('aXNfYXJyY'.'Xk='),base64_decode('aW5fY'.'XJyYXk'.'='),base64_decode(''.'aW5fYXJ'.'yYXk='),base64_decode('bWt0aW1l'),base64_decode('ZGF0Z'.'Q=='),base64_decode('ZGF0ZQ=='),base64_decode('ZGF0ZQ=='),base64_decode('bWt'.'0aW1l'),base64_decode('Z'.'GF0Z'.'Q'.'=='),base64_decode('ZGF0ZQ='.'='),base64_decode('aW5'.'fYXJy'.'YX'.'k='),base64_decode('c2Vya'.'W'.'Fs'.'aXpl'),base64_decode('YmFzZTY0'.'X2V'.'uY29kZQ'.'=='),base64_decode('aW5'.'0dmFs'),base64_decode(''.'dGltZQ='.'='),base64_decode('ZmlsZV'.'9leGlz'.'dHM='),base64_decode('c3RyX3JlcGxhY2'.'U='),base64_decode('Y2xh'.'c3NfZXhpc3Rz'),base64_decode('ZGVma'.'W'.'5l'));if(!function_exists(__NAMESPACE__.'\\___1240077017')){function ___1240077017($_299680452){static $_1673712356= false; if($_1673712356 == false) $_1673712356=array('SU5UUkFORVRfRURJ'.'VElPTg'.'==','W'.'Q==','b'.'WF'.'pbg==','fmN'.'wZl9t'.'YXB'.'fdmFsdW'.'U=','','','YWxsb3dlZF'.'9j'.'bGF'.'zc'.'2Vz','ZQ='.'=','Zg'.'='.'=','Z'.'Q='.'=','R'.'g==',''.'WA==','Zg'.'==','bWFpb'.'g'.'==','fm'.'Nw'.'Zl'.'9tY'.'XBfdmFsd'.'WU'.'=',''.'UG9y'.'dG'.'Fs','R'.'g==','ZQ==','ZQ==','WA='.'=','Rg='.'=','R'.'A==',''.'RA==','b'.'Q==','ZA='.'=','WQ==','Zg==','Zg==','Z'.'g==',''.'Z'.'g'.'==',''.'U'.'G9'.'y'.'dGFs','R'.'g==','ZQ='.'=',''.'ZQ==','WA==','Rg==','RA='.'=','RA='.'=',''.'bQ==','ZA='.'=','WQ==',''.'b'.'WFpb'.'g==',''.'T24=',''.'U2V0dGluZ3N'.'DaGFuZ2U=','Zg==','Zg==','Zg==','Zg='.'=',''.'bWFpbg==',''.'f'.'mNwZl9tYXBfdmFsdWU'.'=','Z'.'Q==',''.'ZQ==',''.'RA'.'==','ZQ='.'=','ZQ==','Zg==','Zg==','Zg='.'=','ZQ==',''.'bW'.'Fpbg='.'=','fm'.'NwZl9'.'t'.'Y'.'XBfdmFs'.'dWU=','ZQ='.'=','Zg==',''.'Zg==','Zg==','Zg='.'=',''.'bWF'.'pbg==','fmNwZl'.'9t'.'Y'.'XBfdmFsdWU=','Z'.'Q==','Zg==',''.'UG9y'.'dGF'.'s','UG9ydG'.'Fs','Z'.'Q==','ZQ==','UG'.'9ydGFs','Rg==','W'.'A==','Rg='.'=','R'.'A==','ZQ='.'=','ZQ==','RA='.'=','b'.'Q==','Z'.'A==','W'.'Q'.'==','Z'.'Q==','WA'.'==','ZQ==','Rg==','ZQ'.'==','RA==','Zg==','ZQ='.'=','RA='.'=','ZQ='.'=','bQ='.'=','Z'.'A'.'='.'=','WQ==',''.'Zg'.'==','Zg'.'==','Zg='.'=','Zg==','Zg'.'==','Zg==','Zg'.'==',''.'Zg==','bWFpb'.'g==',''.'fmNwZl9t'.'Y'.'X'.'Bfdm'.'FsdWU=','ZQ==','Z'.'Q==','UG9ydG'.'Fs','Rg==','WA==','VF'.'lQRQ==','REFURQ==','Rk'.'VBVF'.'VSRVM=','RV'.'hQS'.'VJFRA==',''.'VFlQR'.'Q'.'='.'=','RA==',''.'V'.'FJZX0R'.'BWVNfQ09VTlQ=','RE'.'FURQ'.'==','VFJZX'.'0RBWVN'.'fQ0'.'9VTlQ=','RVhQSV'.'JFRA'.'==',''.'RkVBVFVSRVM=','Zg==','Z'.'g='.'=','RE'.'9D'.'VU'.'1'.'FT'.'lRf'.'Uk9PVA'.'==','L'.'2Jp'.'dH'.'J'.'p'.'eC9'.'tb2'.'R1bG'.'VzLw==','L2luc'.'3RhbGwvaW5kZXgucGh'.'w','Lg==','X'.'w==','c'.'2Vh'.'c'.'mNo','T'.'g='.'=','','',''.'Q'.'UNUSVZF',''.'WQ==','c29'.'jaWFsbm'.'V0d'.'2'.'9ya'.'w==','YW'.'x'.'sb3dfZ'.'n'.'Jp'.'ZW'.'xk'.'cw='.'=','WQ==','SUQ=','c29'.'j'.'a'.'WFsbmV0d29ya'.'w==','YWxsb3dfZnJpZWx'.'kc'.'w==','SU'.'Q=',''.'c29jaWFsbmV0d'.'2'.'9yaw='.'=','YWxsb3d'.'fZnJp'.'ZWxk'.'cw==','Tg==','','','QUNU'.'SVZF','WQ==',''.'c29jaWFsb'.'m'.'V0d'.'29ya'.'w==','Y'.'Wxsb3'.'df'.'b'.'Wljc'.'m'.'9ibG9n'.'X3VzZXI'.'=','WQ==','SUQ'.'=','c29j'.'aWFs'.'b'.'mV'.'0d29yaw'.'==',''.'YWxs'.'b'.'3'.'dfbWljcm9ibG9n'.'X'.'3VzZ'.'XI'.'=','SUQ=','c'.'29jaW'.'Fs'.'bmV'.'0d'.'2'.'9y'.'aw==','YWxsb3dfbWlj'.'c'.'m'.'9'.'ibG9nX3VzZXI'.'=','c29jaWFs'.'bmV0d2'.'9y'.'aw==','YW'.'xsb'.'3dfbWl'.'jcm9i'.'bG'.'9nX2dyb3Vw','WQ==','SU'.'Q=','c29jaW'.'FsbmV0d29yaw='.'=','YWxsb'.'3df'.'bW'.'l'.'jc'.'m9ibG9nX'.'2dyb'.'3V'.'w',''.'SUQ=','c29jaW'.'Fsbm'.'V0d29yaw'.'='.'=','YWxsb3'.'d'.'f'.'bWl'.'jc'.'m9ibG9n'.'X2dyb3Vw',''.'Tg==','','',''.'QUNU'.'S'.'VZF','W'.'Q==',''.'c29ja'.'WFs'.'bmV0d29yaw='.'=','YWxsb3dfZml'.'sZXNf'.'dXNlcg==','WQ==','SUQ'.'=','c29'.'j'.'a'.'WFsbmV0d29yaw'.'==','YWx'.'sb3dfZ'.'m'.'lsZ'.'XNfdX'.'Nlcg==','SUQ=','c29j'.'a'.'WFsbmV0d29yaw='.'=','YWx'.'sb3dfZ'.'m'.'ls'.'ZX'.'Nfd'.'XNl'.'cg==',''.'Tg==','','','QU'.'NUS'.'VZ'.'F','WQ==','c'.'29'.'jaWFsb'.'mV0d29ya'.'w==','Y'.'Wxsb3dfYmxvZ1'.'91c2'.'Vy','W'.'Q==','SUQ=','c29'.'j'.'aWFsbmV0d29y'.'aw'.'='.'=','YWxs'.'b3d'.'fY'.'mxvZ191c'.'2Vy',''.'SUQ'.'=','c29jaWFsb'.'mV'.'0d29yaw'.'==','YW'.'xs'.'b3dfYmxvZ191'.'c2'.'Vy','T'.'g==','','','Q'.'UNUSVZ'.'F',''.'W'.'Q'.'==','c29j'.'aWFsb'.'mV0'.'d'.'29ya'.'w'.'==',''.'YW'.'xsb3dfcGhvdG9f'.'dXNlcg'.'==','WQ==','SUQ=','c29'.'jaWFsbm'.'V0d'.'29yaw==','YWx'.'sb3dfcG'.'hvd'.'G9fdXNlcg==','SU'.'Q=','c'.'29ja'.'WFsbmV0'.'d29y'.'a'.'w='.'=','YW'.'xsb'.'3dfcGhv'.'dG9f'.'dX'.'Nlcg'.'==','Tg==','','','QU'.'N'.'USV'.'ZF',''.'WQ'.'==','c29j'.'aWFsbmV0d29y'.'aw'.'==','YWxsb3'.'dfZm9ydW1'.'fdXNlcg==','WQ==','S'.'UQ=','c'.'29jaWF'.'sbm'.'V0d2'.'9yaw'.'==',''.'YWxsb3dfZm9ydW'.'1fd'.'XNlc'.'g==',''.'SUQ=','c'.'29j'.'aWFsbm'.'V0'.'d29y'.'aw==',''.'Y'.'Wx'.'s'.'b3df'.'Zm9y'.'dW1'.'fdXNl'.'cg==',''.'Tg==','','','QUNUSVZF','WQ='.'=','c29jaWFsbmV0'.'d29y'.'a'.'w==','YWxsb3d'.'f'.'dGFza3'.'NfdXN'.'l'.'cg==','WQ==','SUQ=','c29jaWFsbmV0d29y'.'aw==','Y'.'Wxsb'.'3'.'dfdGF'.'z'.'a3'.'Nfd'.'XN'.'lcg==','SU'.'Q=','c'.'29'.'jaW'.'FsbmV'.'0d29yaw==','YWx'.'s'.'b3'.'dfd'.'G'.'Fza3N'.'f'.'dXNlcg==','c29jaWF'.'s'.'bmV0d'.'29y'.'a'.'w==','YWxs'.'b3dfd'.'GF'.'z'.'a3N'.'fZ3JvdXA=','WQ='.'=','SUQ=',''.'c2'.'9ja'.'WFsbmV0d'.'29yaw'.'==','YWxs'.'b3df'.'d'.'GFza3N'.'fZ3J'.'vdXA=','SUQ'.'=','c29jaWFsbmV0'.'d29ya'.'w==','YWxsb3dfdGFza3'.'Nf'.'Z3J'.'vdXA=','dGF'.'za3M=','Tg'.'==','','',''.'QUN'.'USV'.'Z'.'F','WQ'.'==','c29jaWFsbmV0d29yaw'.'='.'=','YWxsb3df'.'Y2FsZ'.'W5k'.'Y'.'XJf'.'dXNlcg='.'=','WQ==','SUQ=',''.'c2'.'9jaW'.'F'.'sbm'.'V'.'0'.'d29yaw'.'==','YWxsb'.'3'.'dfY2'.'Fs'.'Z'.'W'.'5kYXJfdXNlcg==',''.'SU'.'Q=','c'.'29jaWFsbmV'.'0d29y'.'aw'.'='.'=','YW'.'xsb3'.'dfY'.'2F'.'sZW'.'5kY'.'X'.'J'.'fdX'.'Nlc'.'g==',''.'c29jaW'.'Fsbm'.'V'.'0d29y'.'aw==','YWxsb3dfY2FsZW5kYXJfZ3Jv'.'dXA=','WQ'.'==','SU'.'Q'.'=','c'.'29'.'j'.'aW'.'Fsbm'.'V0'.'d29yaw='.'=','YWxsb3'.'d'.'f'.'Y2FsZW5kYXJfZ'.'3JvdXA=','SUQ=','c29j'.'aWFsbmV0d'.'2'.'9yaw==','YWxsb3dfY2'.'FsZW5kY'.'XJ'.'fZ3Jv'.'dXA=','QUNUS'.'VZF','WQ='.'=','Tg==','ZXh0cmF'.'uZX'.'Q=','aWJ'.'s'.'b2Nr','T'.'25BZnRlckl'.'C'.'bG9ja0VsZW1lbn'.'R'.'VcGRhdGU=','aW'.'5'.'0cmFuZXQ'.'=','Q0ludHJhbmV0RXZlbn'.'RIYW5'.'kbGVycw='.'=','U1BSZ'.'Wd'.'p'.'c3Rlcl'.'V'.'wZ'.'GF0ZWR'.'JdGVt','Q0'.'lu'.'d'.'HJ'.'hbmV0U2hhcmVwb2lud'.'Do6QW'.'dl'.'bnRMaXN0cy'.'gpOw==','aW'.'50cmFuZXQ'.'=','Tg==',''.'Q0ludHJ'.'hbmV'.'0U2h'.'h'.'cm'.'Vwb'.'2l'.'ud'.'Do6'.'QWdlbnRRdWV1ZSgp'.'Ow==','aW50cmFuZX'.'Q=','Tg==','Q0lud'.'HJhbm'.'V0U2'.'hhcmVw'.'b'.'2lud'.'Do6QWd'.'lbn'.'RV'.'c'.'GRh'.'d'.'G'.'UoK'.'Ts'.'=','aW5'.'0cmFuZXQ=','Tg'.'==','aWJsb2Nr','T'.'25BZnRlc'.'klCbG9ja'.'0VsZW1lbnRBZGQ=','aW'.'50cmFuZXQ=','Q0lud'.'HJhbmV'.'0RXZ'.'l'.'b'.'n'.'RIYW'.'5'.'kbGVycw='.'=','U1BS'.'ZWdp'.'c3Rl'.'clVwZGF0ZWRJdG'.'V'.'t','aWJsb2'.'N'.'r',''.'T25BZnRlcklCbG9ja0V'.'sZ'.'W1lbnRVcGRhdGU=','aW50cmFuZXQ'.'=','Q0'.'lud'.'H'.'Jhb'.'mV0RXZlbnR'.'IYW5kb'.'G'.'Vycw==','U1BSZW'.'dp'.'c3Rl'.'clVw'.'ZG'.'F0'.'Z'.'W'.'R'.'JdGVt',''.'Q0'.'ludHJhbmV'.'0U2hhcmVw'.'b2ludD'.'o6QWdl'.'b'.'nRM'.'aXN0c'.'ygpOw==','aW50cmFuZX'.'Q'.'=','Q0lu'.'dHJ'.'h'.'bmV0U2hhcmV'.'wb2ludD'.'o6QWdlbn'.'RRd'.'WV1'.'ZSgpOw==','aW5'.'0cm'.'FuZ'.'XQ=','Q0ludHJhbmV0'.'U2hhcmV'.'wb2ludD'.'o6QWd'.'lbnRVcGRhdG'.'UoKTs=','aW50cmFuZXQ=',''.'Y3Jt','bWFpbg'.'==','T25'.'CZWZvcmVQcm9sb2c=',''.'bWFpbg==','Q1dpem'.'FyZF'.'NvbF'.'BhbmVsS'.'W5'.'0cmFuZXQ=','U'.'2hvd1BhbmVs','L21vZHVsZXM'.'va'.'W50cmF'.'u'.'ZXQvcGFuZWxfY'.'nV'.'0dG9uL'.'nB'.'oc'.'A'.'==','RU5'.'DT0RF','WQ==');return base64_decode($_1673712356[$_299680452]);}};$GLOBALS['____915428400'][0](___1240077017(0), ___1240077017(1));class CBXFeatures{ private static $_184868956= 30; private static $_735898389= array( "Portal" => array( "CompanyCalendar", "CompanyPhoto", "CompanyVideo", "CompanyCareer", "StaffChanges", "StaffAbsence", "CommonDocuments", "MeetingRoomBookingSystem", "Wiki", "Learning", "Vote", "WebLink", "Subscribe", "Friends", "PersonalFiles", "PersonalBlog", "PersonalPhoto", "PersonalForum", "Blog", "Forum", "Gallery", "Board", "MicroBlog", "WebMessenger",), "Communications" => array( "Tasks", "Calendar", "Workgroups", "Jabber", "VideoConference", "Extranet", "SMTP", "Requests", "DAV", "intranet_sharepoint", "timeman", "Idea", "Meeting", "EventList", "Salary", "XDImport",), "Enterprise" => array( "BizProc", "Lists", "Support", "Analytics", "crm", "Controller", "LdapUnlimitedUsers",), "Holding" => array( "Cluster", "MultiSites",),); private static $_2097489875= null; private static $_1001474809= null; private static function __643854483(){ if(self::$_2097489875 === null){ self::$_2097489875= array(); foreach(self::$_735898389 as $_1812904850 => $_819002720){ foreach($_819002720 as $_458345529) self::$_2097489875[$_458345529]= $_1812904850;}} if(self::$_1001474809 === null){ self::$_1001474809= array(); $_656676722= COption::GetOptionString(___1240077017(2), ___1240077017(3), ___1240077017(4)); if($_656676722 != ___1240077017(5)){ $_656676722= $GLOBALS['____915428400'][1]($_656676722); $_656676722= $GLOBALS['____915428400'][2]($_656676722,[___1240077017(6) => false]); if($GLOBALS['____915428400'][3]($_656676722)){ self::$_1001474809= $_656676722;}} if(empty(self::$_1001474809)){ self::$_1001474809= array(___1240077017(7) => array(), ___1240077017(8) => array());}}} public static function InitiateEditionsSettings($_679205473){ self::__643854483(); $_1630783533= array(); foreach(self::$_735898389 as $_1812904850 => $_819002720){ $_726775433= $GLOBALS['____915428400'][4]($_1812904850, $_679205473); self::$_1001474809[___1240077017(9)][$_1812904850]=($_726775433? array(___1240077017(10)): array(___1240077017(11))); foreach($_819002720 as $_458345529){ self::$_1001474809[___1240077017(12)][$_458345529]= $_726775433; if(!$_726775433) $_1630783533[]= array($_458345529, false);}} $_998008950= $GLOBALS['____915428400'][5](self::$_1001474809); $_998008950= $GLOBALS['____915428400'][6]($_998008950); COption::SetOptionString(___1240077017(13), ___1240077017(14), $_998008950); foreach($_1630783533 as $_22331235) self::__990582697($_22331235[(1176/2-588)], $_22331235[round(0+0.33333333333333+0.33333333333333+0.33333333333333)]);} public static function IsFeatureEnabled($_458345529){ if($_458345529 == '') return true; self::__643854483(); if(!isset(self::$_2097489875[$_458345529])) return true; if(self::$_2097489875[$_458345529] == ___1240077017(15)) $_713154966= array(___1240077017(16)); elseif(isset(self::$_1001474809[___1240077017(17)][self::$_2097489875[$_458345529]])) $_713154966= self::$_1001474809[___1240077017(18)][self::$_2097489875[$_458345529]]; else $_713154966= array(___1240077017(19)); if($_713154966[min(184,0,61.333333333333)] != ___1240077017(20) && $_713154966[(1420/2-710)] != ___1240077017(21)){ return false;} elseif($_713154966[(157*2-314)] == ___1240077017(22)){ if($_713154966[round(0+0.33333333333333+0.33333333333333+0.33333333333333)]< $GLOBALS['____915428400'][7]((780-2*390),(244*2-488),(172*2-344), Date(___1240077017(23)), $GLOBALS['____915428400'][8](___1240077017(24))- self::$_184868956, $GLOBALS['____915428400'][9](___1240077017(25)))){ if(!isset($_713154966[round(0+0.5+0.5+0.5+0.5)]) ||!$_713154966[round(0+1+1)]) self::__219729140(self::$_2097489875[$_458345529]); return false;}} return!isset(self::$_1001474809[___1240077017(26)][$_458345529]) || self::$_1001474809[___1240077017(27)][$_458345529];} public static function IsFeatureInstalled($_458345529){ if($GLOBALS['____915428400'][10]($_458345529) <= 0) return true; self::__643854483(); return(isset(self::$_1001474809[___1240077017(28)][$_458345529]) && self::$_1001474809[___1240077017(29)][$_458345529]);} public static function IsFeatureEditable($_458345529){ if($_458345529 == '') return true; self::__643854483(); if(!isset(self::$_2097489875[$_458345529])) return true; if(self::$_2097489875[$_458345529] == ___1240077017(30)) $_713154966= array(___1240077017(31)); elseif(isset(self::$_1001474809[___1240077017(32)][self::$_2097489875[$_458345529]])) $_713154966= self::$_1001474809[___1240077017(33)][self::$_2097489875[$_458345529]]; else $_713154966= array(___1240077017(34)); if($_713154966[(816-2*408)] != ___1240077017(35) && $_713154966[(784-2*392)] != ___1240077017(36)){ return false;} elseif($_713154966[(848-2*424)] == ___1240077017(37)){ if($_713154966[round(0+0.33333333333333+0.33333333333333+0.33333333333333)]< $GLOBALS['____915428400'][11]((1424/2-712),(210*2-420),(1164/2-582), Date(___1240077017(38)), $GLOBALS['____915428400'][12](___1240077017(39))- self::$_184868956, $GLOBALS['____915428400'][13](___1240077017(40)))){ if(!isset($_713154966[round(0+2)]) ||!$_713154966[round(0+0.66666666666667+0.66666666666667+0.66666666666667)]) self::__219729140(self::$_2097489875[$_458345529]); return false;}} return true;} private static function __990582697($_458345529, $_476884478){ if($GLOBALS['____915428400'][14]("CBXFeatures", "On".$_458345529."SettingsChange")) $GLOBALS['____915428400'][15](array("CBXFeatures", "On".$_458345529."SettingsChange"), array($_458345529, $_476884478)); $_1725425812= $GLOBALS['_____2058832361'][0](___1240077017(41), ___1240077017(42).$_458345529.___1240077017(43)); while($_1875241884= $_1725425812->Fetch()) $GLOBALS['_____2058832361'][1]($_1875241884, array($_458345529, $_476884478));} public static function SetFeatureEnabled($_458345529, $_476884478= true, $_1066228968= true){ if($GLOBALS['____915428400'][16]($_458345529) <= 0) return; if(!self::IsFeatureEditable($_458345529)) $_476884478= false; $_476884478= (bool)$_476884478; self::__643854483(); $_531418655=(!isset(self::$_1001474809[___1240077017(44)][$_458345529]) && $_476884478 || isset(self::$_1001474809[___1240077017(45)][$_458345529]) && $_476884478 != self::$_1001474809[___1240077017(46)][$_458345529]); self::$_1001474809[___1240077017(47)][$_458345529]= $_476884478; $_998008950= $GLOBALS['____915428400'][17](self::$_1001474809); $_998008950= $GLOBALS['____915428400'][18]($_998008950); COption::SetOptionString(___1240077017(48), ___1240077017(49), $_998008950); if($_531418655 && $_1066228968) self::__990582697($_458345529, $_476884478);} private static function __219729140($_1812904850){ if($GLOBALS['____915428400'][19]($_1812904850) <= 0 || $_1812904850 == "Portal") return; self::__643854483(); if(!isset(self::$_1001474809[___1240077017(50)][$_1812904850]) || self::$_1001474809[___1240077017(51)][$_1812904850][min(208,0,69.333333333333)] != ___1240077017(52)) return; if(isset(self::$_1001474809[___1240077017(53)][$_1812904850][round(0+2)]) && self::$_1001474809[___1240077017(54)][$_1812904850][round(0+2)]) return; $_1630783533= array(); if(isset(self::$_735898389[$_1812904850]) && $GLOBALS['____915428400'][20](self::$_735898389[$_1812904850])){ foreach(self::$_735898389[$_1812904850] as $_458345529){ if(isset(self::$_1001474809[___1240077017(55)][$_458345529]) && self::$_1001474809[___1240077017(56)][$_458345529]){ self::$_1001474809[___1240077017(57)][$_458345529]= false; $_1630783533[]= array($_458345529, false);}} self::$_1001474809[___1240077017(58)][$_1812904850][round(0+2)]= true;} $_998008950= $GLOBALS['____915428400'][21](self::$_1001474809); $_998008950= $GLOBALS['____915428400'][22]($_998008950); COption::SetOptionString(___1240077017(59), ___1240077017(60), $_998008950); foreach($_1630783533 as $_22331235) self::__990582697($_22331235[min(172,0,57.333333333333)], $_22331235[round(0+0.2+0.2+0.2+0.2+0.2)]);} public static function ModifyFeaturesSettings($_679205473, $_819002720){ self::__643854483(); foreach($_679205473 as $_1812904850 => $_2006944460) self::$_1001474809[___1240077017(61)][$_1812904850]= $_2006944460; $_1630783533= array(); foreach($_819002720 as $_458345529 => $_476884478){ if(!isset(self::$_1001474809[___1240077017(62)][$_458345529]) && $_476884478 || isset(self::$_1001474809[___1240077017(63)][$_458345529]) && $_476884478 != self::$_1001474809[___1240077017(64)][$_458345529]) $_1630783533[]= array($_458345529, $_476884478); self::$_1001474809[___1240077017(65)][$_458345529]= $_476884478;} $_998008950= $GLOBALS['____915428400'][23](self::$_1001474809); $_998008950= $GLOBALS['____915428400'][24]($_998008950); COption::SetOptionString(___1240077017(66), ___1240077017(67), $_998008950); self::$_1001474809= null; foreach($_1630783533 as $_22331235) self::__990582697($_22331235[min(140,0,46.666666666667)], $_22331235[round(0+1)]);} public static function SaveFeaturesSettings($_1321273606, $_731171308){ self::__643854483(); $_1668534669= array(___1240077017(68) => array(), ___1240077017(69) => array()); if(!$GLOBALS['____915428400'][25]($_1321273606)) $_1321273606= array(); if(!$GLOBALS['____915428400'][26]($_731171308)) $_731171308= array(); if(!$GLOBALS['____915428400'][27](___1240077017(70), $_1321273606)) $_1321273606[]= ___1240077017(71); foreach(self::$_735898389 as $_1812904850 => $_819002720){ if(isset(self::$_1001474809[___1240077017(72)][$_1812904850])){ $_85426514= self::$_1001474809[___1240077017(73)][$_1812904850];} else{ $_85426514=($_1812904850 == ___1240077017(74)? array(___1240077017(75)): array(___1240077017(76)));} if($_85426514[min(116,0,38.666666666667)] == ___1240077017(77) || $_85426514[(1216/2-608)] == ___1240077017(78)){ $_1668534669[___1240077017(79)][$_1812904850]= $_85426514;} else{ if($GLOBALS['____915428400'][28]($_1812904850, $_1321273606)) $_1668534669[___1240077017(80)][$_1812904850]= array(___1240077017(81), $GLOBALS['____915428400'][29]((1000-2*500),(798-2*399),(1300/2-650), $GLOBALS['____915428400'][30](___1240077017(82)), $GLOBALS['____915428400'][31](___1240077017(83)), $GLOBALS['____915428400'][32](___1240077017(84)))); else $_1668534669[___1240077017(85)][$_1812904850]= array(___1240077017(86));}} $_1630783533= array(); foreach(self::$_2097489875 as $_458345529 => $_1812904850){ if($_1668534669[___1240077017(87)][$_1812904850][(1380/2-690)] != ___1240077017(88) && $_1668534669[___1240077017(89)][$_1812904850][min(140,0,46.666666666667)] != ___1240077017(90)){ $_1668534669[___1240077017(91)][$_458345529]= false;} else{ if($_1668534669[___1240077017(92)][$_1812904850][(166*2-332)] == ___1240077017(93) && $_1668534669[___1240077017(94)][$_1812904850][round(0+0.33333333333333+0.33333333333333+0.33333333333333)]< $GLOBALS['____915428400'][33]((147*2-294),(1312/2-656),(148*2-296), Date(___1240077017(95)), $GLOBALS['____915428400'][34](___1240077017(96))- self::$_184868956, $GLOBALS['____915428400'][35](___1240077017(97)))) $_1668534669[___1240077017(98)][$_458345529]= false; else $_1668534669[___1240077017(99)][$_458345529]= $GLOBALS['____915428400'][36]($_458345529, $_731171308); if(!isset(self::$_1001474809[___1240077017(100)][$_458345529]) && $_1668534669[___1240077017(101)][$_458345529] || isset(self::$_1001474809[___1240077017(102)][$_458345529]) && $_1668534669[___1240077017(103)][$_458345529] != self::$_1001474809[___1240077017(104)][$_458345529]) $_1630783533[]= array($_458345529, $_1668534669[___1240077017(105)][$_458345529]);}} $_998008950= $GLOBALS['____915428400'][37]($_1668534669); $_998008950= $GLOBALS['____915428400'][38]($_998008950); COption::SetOptionString(___1240077017(106), ___1240077017(107), $_998008950); self::$_1001474809= null; foreach($_1630783533 as $_22331235) self::__990582697($_22331235[min(110,0,36.666666666667)], $_22331235[round(0+0.33333333333333+0.33333333333333+0.33333333333333)]);} public static function GetFeaturesList(){ self::__643854483(); $_1386323138= array(); foreach(self::$_735898389 as $_1812904850 => $_819002720){ if(isset(self::$_1001474809[___1240077017(108)][$_1812904850])){ $_85426514= self::$_1001474809[___1240077017(109)][$_1812904850];} else{ $_85426514=($_1812904850 == ___1240077017(110)? array(___1240077017(111)): array(___1240077017(112)));} $_1386323138[$_1812904850]= array( ___1240077017(113) => $_85426514[(1316/2-658)], ___1240077017(114) => $_85426514[round(0+0.2+0.2+0.2+0.2+0.2)], ___1240077017(115) => array(),); $_1386323138[$_1812904850][___1240077017(116)]= false; if($_1386323138[$_1812904850][___1240077017(117)] == ___1240077017(118)){ $_1386323138[$_1812904850][___1240077017(119)]= $GLOBALS['____915428400'][39](($GLOBALS['____915428400'][40]()- $_1386323138[$_1812904850][___1240077017(120)])/ round(0+21600+21600+21600+21600)); if($_1386323138[$_1812904850][___1240077017(121)]> self::$_184868956) $_1386323138[$_1812904850][___1240077017(122)]= true;} foreach($_819002720 as $_458345529) $_1386323138[$_1812904850][___1240077017(123)][$_458345529]=(!isset(self::$_1001474809[___1240077017(124)][$_458345529]) || self::$_1001474809[___1240077017(125)][$_458345529]);} return $_1386323138;} private static function __1784927430($_2080039673, $_1984117641){ if(IsModuleInstalled($_2080039673) == $_1984117641) return true; $_1149958538= $_SERVER[___1240077017(126)].___1240077017(127).$_2080039673.___1240077017(128); if(!$GLOBALS['____915428400'][41]($_1149958538)) return false; include_once($_1149958538); $_1335962264= $GLOBALS['____915428400'][42](___1240077017(129), ___1240077017(130), $_2080039673); if(!$GLOBALS['____915428400'][43]($_1335962264)) return false; $_225248426= new $_1335962264; if($_1984117641){ if(!$_225248426->InstallDB()) return false; $_225248426->InstallEvents(); if(!$_225248426->InstallFiles()) return false;} else{ if(CModule::IncludeModule(___1240077017(131))) CSearch::DeleteIndex($_2080039673); UnRegisterModule($_2080039673);} return true;} protected static function OnRequestsSettingsChange($_458345529, $_476884478){ self::__1784927430("form", $_476884478);} protected static function OnLearningSettingsChange($_458345529, $_476884478){ self::__1784927430("learning", $_476884478);} protected static function OnJabberSettingsChange($_458345529, $_476884478){ self::__1784927430("xmpp", $_476884478);} protected static function OnVideoConferenceSettingsChange($_458345529, $_476884478){} protected static function OnBizProcSettingsChange($_458345529, $_476884478){ self::__1784927430("bizprocdesigner", $_476884478);} protected static function OnListsSettingsChange($_458345529, $_476884478){ self::__1784927430("lists", $_476884478);} protected static function OnWikiSettingsChange($_458345529, $_476884478){ self::__1784927430("wiki", $_476884478);} protected static function OnSupportSettingsChange($_458345529, $_476884478){ self::__1784927430("support", $_476884478);} protected static function OnControllerSettingsChange($_458345529, $_476884478){ self::__1784927430("controller", $_476884478);} protected static function OnAnalyticsSettingsChange($_458345529, $_476884478){ self::__1784927430("statistic", $_476884478);} protected static function OnVoteSettingsChange($_458345529, $_476884478){ self::__1784927430("vote", $_476884478);} protected static function OnFriendsSettingsChange($_458345529, $_476884478){ if($_476884478) $_1185253745= "Y"; else $_1185253745= ___1240077017(132); $_265111645= CSite::GetList(___1240077017(133), ___1240077017(134), array(___1240077017(135) => ___1240077017(136))); while($_728424009= $_265111645->Fetch()){ if(COption::GetOptionString(___1240077017(137), ___1240077017(138), ___1240077017(139), $_728424009[___1240077017(140)]) != $_1185253745){ COption::SetOptionString(___1240077017(141), ___1240077017(142), $_1185253745, false, $_728424009[___1240077017(143)]); COption::SetOptionString(___1240077017(144), ___1240077017(145), $_1185253745);}}} protected static function OnMicroBlogSettingsChange($_458345529, $_476884478){ if($_476884478) $_1185253745= "Y"; else $_1185253745= ___1240077017(146); $_265111645= CSite::GetList(___1240077017(147), ___1240077017(148), array(___1240077017(149) => ___1240077017(150))); while($_728424009= $_265111645->Fetch()){ if(COption::GetOptionString(___1240077017(151), ___1240077017(152), ___1240077017(153), $_728424009[___1240077017(154)]) != $_1185253745){ COption::SetOptionString(___1240077017(155), ___1240077017(156), $_1185253745, false, $_728424009[___1240077017(157)]); COption::SetOptionString(___1240077017(158), ___1240077017(159), $_1185253745);} if(COption::GetOptionString(___1240077017(160), ___1240077017(161), ___1240077017(162), $_728424009[___1240077017(163)]) != $_1185253745){ COption::SetOptionString(___1240077017(164), ___1240077017(165), $_1185253745, false, $_728424009[___1240077017(166)]); COption::SetOptionString(___1240077017(167), ___1240077017(168), $_1185253745);}}} protected static function OnPersonalFilesSettingsChange($_458345529, $_476884478){ if($_476884478) $_1185253745= "Y"; else $_1185253745= ___1240077017(169); $_265111645= CSite::GetList(___1240077017(170), ___1240077017(171), array(___1240077017(172) => ___1240077017(173))); while($_728424009= $_265111645->Fetch()){ if(COption::GetOptionString(___1240077017(174), ___1240077017(175), ___1240077017(176), $_728424009[___1240077017(177)]) != $_1185253745){ COption::SetOptionString(___1240077017(178), ___1240077017(179), $_1185253745, false, $_728424009[___1240077017(180)]); COption::SetOptionString(___1240077017(181), ___1240077017(182), $_1185253745);}}} protected static function OnPersonalBlogSettingsChange($_458345529, $_476884478){ if($_476884478) $_1185253745= "Y"; else $_1185253745= ___1240077017(183); $_265111645= CSite::GetList(___1240077017(184), ___1240077017(185), array(___1240077017(186) => ___1240077017(187))); while($_728424009= $_265111645->Fetch()){ if(COption::GetOptionString(___1240077017(188), ___1240077017(189), ___1240077017(190), $_728424009[___1240077017(191)]) != $_1185253745){ COption::SetOptionString(___1240077017(192), ___1240077017(193), $_1185253745, false, $_728424009[___1240077017(194)]); COption::SetOptionString(___1240077017(195), ___1240077017(196), $_1185253745);}}} protected static function OnPersonalPhotoSettingsChange($_458345529, $_476884478){ if($_476884478) $_1185253745= "Y"; else $_1185253745= ___1240077017(197); $_265111645= CSite::GetList(___1240077017(198), ___1240077017(199), array(___1240077017(200) => ___1240077017(201))); while($_728424009= $_265111645->Fetch()){ if(COption::GetOptionString(___1240077017(202), ___1240077017(203), ___1240077017(204), $_728424009[___1240077017(205)]) != $_1185253745){ COption::SetOptionString(___1240077017(206), ___1240077017(207), $_1185253745, false, $_728424009[___1240077017(208)]); COption::SetOptionString(___1240077017(209), ___1240077017(210), $_1185253745);}}} protected static function OnPersonalForumSettingsChange($_458345529, $_476884478){ if($_476884478) $_1185253745= "Y"; else $_1185253745= ___1240077017(211); $_265111645= CSite::GetList(___1240077017(212), ___1240077017(213), array(___1240077017(214) => ___1240077017(215))); while($_728424009= $_265111645->Fetch()){ if(COption::GetOptionString(___1240077017(216), ___1240077017(217), ___1240077017(218), $_728424009[___1240077017(219)]) != $_1185253745){ COption::SetOptionString(___1240077017(220), ___1240077017(221), $_1185253745, false, $_728424009[___1240077017(222)]); COption::SetOptionString(___1240077017(223), ___1240077017(224), $_1185253745);}}} protected static function OnTasksSettingsChange($_458345529, $_476884478){ if($_476884478) $_1185253745= "Y"; else $_1185253745= ___1240077017(225); $_265111645= CSite::GetList(___1240077017(226), ___1240077017(227), array(___1240077017(228) => ___1240077017(229))); while($_728424009= $_265111645->Fetch()){ if(COption::GetOptionString(___1240077017(230), ___1240077017(231), ___1240077017(232), $_728424009[___1240077017(233)]) != $_1185253745){ COption::SetOptionString(___1240077017(234), ___1240077017(235), $_1185253745, false, $_728424009[___1240077017(236)]); COption::SetOptionString(___1240077017(237), ___1240077017(238), $_1185253745);} if(COption::GetOptionString(___1240077017(239), ___1240077017(240), ___1240077017(241), $_728424009[___1240077017(242)]) != $_1185253745){ COption::SetOptionString(___1240077017(243), ___1240077017(244), $_1185253745, false, $_728424009[___1240077017(245)]); COption::SetOptionString(___1240077017(246), ___1240077017(247), $_1185253745);}} self::__1784927430(___1240077017(248), $_476884478);} protected static function OnCalendarSettingsChange($_458345529, $_476884478){ if($_476884478) $_1185253745= "Y"; else $_1185253745= ___1240077017(249); $_265111645= CSite::GetList(___1240077017(250), ___1240077017(251), array(___1240077017(252) => ___1240077017(253))); while($_728424009= $_265111645->Fetch()){ if(COption::GetOptionString(___1240077017(254), ___1240077017(255), ___1240077017(256), $_728424009[___1240077017(257)]) != $_1185253745){ COption::SetOptionString(___1240077017(258), ___1240077017(259), $_1185253745, false, $_728424009[___1240077017(260)]); COption::SetOptionString(___1240077017(261), ___1240077017(262), $_1185253745);} if(COption::GetOptionString(___1240077017(263), ___1240077017(264), ___1240077017(265), $_728424009[___1240077017(266)]) != $_1185253745){ COption::SetOptionString(___1240077017(267), ___1240077017(268), $_1185253745, false, $_728424009[___1240077017(269)]); COption::SetOptionString(___1240077017(270), ___1240077017(271), $_1185253745);}}} protected static function OnSMTPSettingsChange($_458345529, $_476884478){ self::__1784927430("mail", $_476884478);} protected static function OnExtranetSettingsChange($_458345529, $_476884478){ $_1084506373= COption::GetOptionString("extranet", "extranet_site", ""); if($_1084506373){ $_1173966581= new CSite; $_1173966581->Update($_1084506373, array(___1240077017(272) =>($_476884478? ___1240077017(273): ___1240077017(274))));} self::__1784927430(___1240077017(275), $_476884478);} protected static function OnDAVSettingsChange($_458345529, $_476884478){ self::__1784927430("dav", $_476884478);} protected static function OntimemanSettingsChange($_458345529, $_476884478){ self::__1784927430("timeman", $_476884478);} protected static function Onintranet_sharepointSettingsChange($_458345529, $_476884478){ if($_476884478){ RegisterModuleDependences("iblock", "OnAfterIBlockElementAdd", "intranet", "CIntranetEventHandlers", "SPRegisterUpdatedItem"); RegisterModuleDependences(___1240077017(276), ___1240077017(277), ___1240077017(278), ___1240077017(279), ___1240077017(280)); CAgent::AddAgent(___1240077017(281), ___1240077017(282), ___1240077017(283), round(0+166.66666666667+166.66666666667+166.66666666667)); CAgent::AddAgent(___1240077017(284), ___1240077017(285), ___1240077017(286), round(0+100+100+100)); CAgent::AddAgent(___1240077017(287), ___1240077017(288), ___1240077017(289), round(0+3600));} else{ UnRegisterModuleDependences(___1240077017(290), ___1240077017(291), ___1240077017(292), ___1240077017(293), ___1240077017(294)); UnRegisterModuleDependences(___1240077017(295), ___1240077017(296), ___1240077017(297), ___1240077017(298), ___1240077017(299)); CAgent::RemoveAgent(___1240077017(300), ___1240077017(301)); CAgent::RemoveAgent(___1240077017(302), ___1240077017(303)); CAgent::RemoveAgent(___1240077017(304), ___1240077017(305));}} protected static function OncrmSettingsChange($_458345529, $_476884478){ if($_476884478) COption::SetOptionString("crm", "form_features", "Y"); self::__1784927430(___1240077017(306), $_476884478);} protected static function OnClusterSettingsChange($_458345529, $_476884478){ self::__1784927430("cluster", $_476884478);} protected static function OnMultiSitesSettingsChange($_458345529, $_476884478){ if($_476884478) RegisterModuleDependences("main", "OnBeforeProlog", "main", "CWizardSolPanelIntranet", "ShowPanel", 100, "/modules/intranet/panel_button.php"); else UnRegisterModuleDependences(___1240077017(307), ___1240077017(308), ___1240077017(309), ___1240077017(310), ___1240077017(311), ___1240077017(312));} protected static function OnIdeaSettingsChange($_458345529, $_476884478){ self::__1784927430("idea", $_476884478);} protected static function OnMeetingSettingsChange($_458345529, $_476884478){ self::__1784927430("meeting", $_476884478);} protected static function OnXDImportSettingsChange($_458345529, $_476884478){ self::__1784927430("xdimport", $_476884478);}} $GLOBALS['____915428400'][44](___1240077017(313), ___1240077017(314));/**/			//Do not remove this

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

/*ZDUyZmZZmQyNDNjZTI4NWM5MWMxMjFlNjQ5YTYwOTM4OGYxMzY=*/$GLOBALS['____1361428894']= array(base64_decode(''.'bXRfc'.'mFu'.'ZA'.'=='),base64_decode('Y2Fs'.'bF91c'.'2VyX'.'2Z1bmM'.'='),base64_decode('c3RycG9z'),base64_decode(''.'ZXhwb'.'G9'.'kZQ=='),base64_decode('cGFj'.'aw=='),base64_decode(''.'b'.'WQ1'),base64_decode('Y29uc3R'.'h'.'bnQ='),base64_decode('a'.'GFza'.'F9o'.'bWFj'),base64_decode('c3RyY2'.'1w'),base64_decode('Y2FsbF91c2VyX2'.'Z1bm'.'M='),base64_decode('Y'.'2F'.'sbF'.'91c2V'.'y'.'X2Z1bmM='),base64_decode('aXNfb'.'2'.'J'.'qZ'.'W'.'N0'),base64_decode('Y2F'.'sbF9'.'1c2VyX2Z1bm'.'M'.'='),base64_decode('Y'.'2FsbF91c2V'.'yX'.'2Z'.'1bmM='),base64_decode('Y2Fs'.'bF91c2Vy'.'X2Z1bmM='),base64_decode(''.'Y2Fs'.'b'.'F9'.'1c2'.'VyX2Z'.'1b'.'mM'.'='),base64_decode(''.'Y2Fsb'.'F91'.'c2Vy'.'X2'.'Z1b'.'m'.'M'.'='),base64_decode(''.'Y2FsbF'.'9'.'1'.'c2VyX2Z1bmM='));if(!function_exists(__NAMESPACE__.'\\___436264789')){function ___436264789($_1746889046){static $_1125283092= false; if($_1125283092 == false) $_1125283092=array(''.'XENPcH'.'Rpb246OkdldE9w'.'dG'.'lv'.'b'.'lN0'.'cmluZw'.'==','bWFp'.'bg==','fl'.'BBUk'.'FNX0'.'1'.'B'.'W'.'F9VU0VSUw==','Lg==','Lg'.'==',''.'SCo=','Yml0'.'cml'.'4',''.'TE'.'lDR'.'U'.'5TRV9'.'LR'.'Vk=','c2h'.'h'.'MjU2','XENPcHRpb2'.'46OkdldE9wdGlvblN0cmluZw==','bWFpb'.'g'.'='.'=','UEFSQ'.'U1fTUF'.'YX1V'.'TRVJT',''.'XEJ'.'pdHJ'.'peFxNY'.'WluXENvbmZp'.'Z1xP'.'cHRpb24'.'6O'.'nNld'.'A==','bWFpb'.'g==','U'.'EFSQ'.'U1f'.'TUFYX1VTRVJT','VV'.'N'.'FUg==',''.'VVNF'.'Ug==','V'.'V'.'NF'.'Ug==','SX'.'N'.'BdXRob3JpemVk','VVNFUg==','SXN'.'BZG1pbg='.'=','QVBQT'.'E'.'lD'.'QVR'.'J'.'T04'.'=','UmVzdG'.'FydEJ1'.'ZmZlc'.'g==','TG'.'9'.'j'.'Y'.'W'.'xS'.'ZWR'.'pcmVj'.'dA==','L2xpY2Vuc2Vf'.'cmVz'.'dHJp'.'Y3Rpb24u'.'cGhw',''.'XENPcHRpb24'.'6Ok'.'d'.'ldE9wdG'.'lvb'.'lN'.'0cmluZw'.'='.'=','bW'.'F'.'pbg==',''.'UE'.'F'.'SQU'.'1'.'fTUFYX1V'.'TRVJ'.'T','XEJpd'.'HJpeF'.'xNY'.'Wl'.'uXENvbmZpZ1xP'.'cH'.'Rp'.'b246O'.'n'.'NldA==','bWFpbg==','UEFSQU1fTU'.'F'.'YX'.'1VTRV'.'JT');return base64_decode($_1125283092[$_1746889046]);}};if($GLOBALS['____1361428894'][0](round(0+0.33333333333333+0.33333333333333+0.33333333333333), round(0+6.6666666666667+6.6666666666667+6.6666666666667)) == round(0+1.4+1.4+1.4+1.4+1.4)){ $_1342143651= $GLOBALS['____1361428894'][1](___436264789(0), ___436264789(1), ___436264789(2)); if(!empty($_1342143651) && $GLOBALS['____1361428894'][2]($_1342143651, ___436264789(3)) !== false){ list($_331236632, $_382090745)= $GLOBALS['____1361428894'][3](___436264789(4), $_1342143651); $_1327363810= $GLOBALS['____1361428894'][4](___436264789(5), $_331236632); $_316372472= ___436264789(6).$GLOBALS['____1361428894'][5]($GLOBALS['____1361428894'][6](___436264789(7))); $_800014979= $GLOBALS['____1361428894'][7](___436264789(8), $_382090745, $_316372472, true); if($GLOBALS['____1361428894'][8]($_800014979, $_1327363810) !==(874-2*437)){ if($GLOBALS['____1361428894'][9](___436264789(9), ___436264789(10), ___436264789(11)) != round(0+6+6)){ $GLOBALS['____1361428894'][10](___436264789(12), ___436264789(13), ___436264789(14), round(0+3+3+3+3));} if(isset($GLOBALS[___436264789(15)]) && $GLOBALS['____1361428894'][11]($GLOBALS[___436264789(16)]) && $GLOBALS['____1361428894'][12](array($GLOBALS[___436264789(17)], ___436264789(18))) &&!$GLOBALS['____1361428894'][13](array($GLOBALS[___436264789(19)], ___436264789(20)))){ $GLOBALS['____1361428894'][14](array($GLOBALS[___436264789(21)], ___436264789(22))); $GLOBALS['____1361428894'][15](___436264789(23), ___436264789(24), true);}}} else{ if($GLOBALS['____1361428894'][16](___436264789(25), ___436264789(26), ___436264789(27)) != round(0+6+6)){ $GLOBALS['____1361428894'][17](___436264789(28), ___436264789(29), ___436264789(30), round(0+4+4+4));}}}/**/       //Do not remove this