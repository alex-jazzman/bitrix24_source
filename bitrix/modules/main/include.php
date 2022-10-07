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

/*ZDUyZmZOWE5ZTRhNGI5YTRlYTVjZTcxNGY0ODU0NjQ0NjYxODk=*/$GLOBALS['_____445593103']= array(base64_decode('R2V0TW'.'9kdWxlRXZlbnR'.'z'),base64_decode(''.'RX'.'hlY3V0ZU'.'1vZHVsZU'.'V2ZW50RXg='));$GLOBALS['____1968534999']= array(base64_decode('ZGVmaW'.'5l'),base64_decode('c3'.'Ryb'.'GV'.'u'),base64_decode('YmF'.'zZTY'.'0'.'X2'.'RlY2'.'9kZQ=='),base64_decode('d'.'W5'.'z'.'ZXJ'.'pYWxpemU='),base64_decode('aXNfYXJyYXk='),base64_decode('Y291'.'bnQ='),base64_decode(''.'aW'.'5fYXJyYXk='),base64_decode(''.'c2'.'V'.'yaWFsa'.'X'.'pl'),base64_decode('Y'.'mFzZT'.'Y'.'0'.'X2'.'VuY29'.'kZQ=='),base64_decode('c3Ry'.'bGV'.'u'),base64_decode('Y'.'XJyYXlfa2V5'.'X2V4aXN0cw=='),base64_decode('YXJy'.'Y'.'Xlfa2V5X2V4aX'.'N0'.'c'.'w=='),base64_decode('bWt'.'0a'.'W1l'),base64_decode('ZGF0ZQ=='),base64_decode('ZGF0ZQ=='),base64_decode('YXJy'.'YXl'.'fa2V5X2V4aXN0cw=='),base64_decode('c3Ryb'.'GVu'),base64_decode('YXJyYXlf'.'a2V5'.'X2V4aXN0cw=='),base64_decode('c3RybG'.'Vu'),base64_decode(''.'Y'.'XJyY'.'Xl'.'f'.'a2V5X'.'2V4a'.'XN'.'0cw=='),base64_decode('Y'.'XJyYXl'.'fa'.'2V5X2'.'V4aXN0cw=='),base64_decode('bW'.'t0aW1l'),base64_decode(''.'ZGF0ZQ=='),base64_decode('Z'.'GF0ZQ=='),base64_decode('b'.'WV0a'.'G9'.'kX'.'2V4a'.'XN0c'.'w=='),base64_decode('Y2Fs'.'bF9'.'1c2V'.'yX'.'2Z1bmNfYX'.'J'.'yYXk='),base64_decode('c3RybGVu'),base64_decode('YXJyY'.'X'.'lfa2V'.'5'.'X2V4a'.'XN0cw=='),base64_decode('YXJyYX'.'lf'.'a2'.'V5X2V4aXN'.'0c'.'w=='),base64_decode('c'.'2VyaWF'.'saXp'.'l'),base64_decode('YmFzZTY0X2'.'V'.'uY2'.'9kZQ=='),base64_decode('c'.'3Ryb'.'GVu'),base64_decode('YX'.'JyYXl'.'f'.'a'.'2V5X2V4aXN'.'0cw=='),base64_decode('YX'.'JyYXlfa2V5'.'X2V'.'4a'.'XN0'.'cw'.'=='),base64_decode('YXJ'.'yYXlfa2V5X2V4aXN0cw=='),base64_decode('aXNfY'.'XJ'.'y'.'YX'.'k='),base64_decode('YXJyY'.'Xlfa2V5X2'.'V4'.'aXN0cw'.'=='),base64_decode('c2'.'VyaWF'.'s'.'aXpl'),base64_decode('YmFzZTY0X2VuY29k'.'ZQ=='),base64_decode('Y'.'XJyYXlfa'.'2'.'V5'.'X2V4aXN0cw=='),base64_decode('YXJyYX'.'l'.'fa'.'2V5X2V4aXN'.'0'.'cw'.'=='),base64_decode('c2VyaWF'.'saXpl'),base64_decode(''.'YmFzZT'.'Y'.'0X2V'.'uY29kZQ=='),base64_decode('aXNfYXJy'.'YXk='),base64_decode('aX'.'Nf'.'YXJyYXk='),base64_decode('a'.'W5f'.'YXJyYXk='),base64_decode('Y'.'XJyYX'.'lf'.'a2V5X'.'2V'.'4aX'.'N0'.'cw=='),base64_decode('aW5fY'.'XJ'.'yYXk'.'='),base64_decode('bWt0aW1l'),base64_decode('ZGF0Z'.'Q=='),base64_decode('ZGF0'.'Z'.'Q'.'=='),base64_decode('ZGF0'.'ZQ'.'=='),base64_decode(''.'bW'.'t'.'0'.'aW1l'),base64_decode('ZGF0Z'.'Q=='),base64_decode('ZGF0ZQ=='),base64_decode('aW5f'.'YXJyYX'.'k='),base64_decode('YXJyY'.'X'.'l'.'fa2V'.'5X2V4aXN0cw'.'=='),base64_decode(''.'YXJyYXlf'.'a2V5'.'X2'.'V4'.'a'.'XN'.'0'.'cw=='),base64_decode('c'.'2'.'VyaWFsaXpl'),base64_decode('YmFzZTY0'.'X2VuY'.'29'.'kZQ=='),base64_decode(''.'YXJy'.'Y'.'Xlfa2'.'V'.'5X2'.'V4aXN0c'.'w=='),base64_decode('aW50dm'.'Fs'),base64_decode(''.'dGltZ'.'Q=='),base64_decode('YX'.'J'.'yYXlfa2V'.'5X'.'2V4aX'.'N0cw'.'=='),base64_decode('Zm'.'ls'.'ZV9l'.'e'.'GlzdHM='),base64_decode('c3Ry'.'X'.'3JlcGx'.'hY2U'.'='),base64_decode(''.'Y2x'.'hc3NfZXhpc3Rz'),base64_decode('ZGVmaW5l'));if(!function_exists(__NAMESPACE__.'\\___2093053852')){function ___2093053852($_124119695){static $_442910401= false; if($_442910401 == false) $_442910401=array('SU5'.'UUkF'.'ORVRfR'.'UR'.'JV'.'ElP'.'Tg'.'==','WQ==','bWFpbg==','fmN'.'wZ'.'l9tY'.'XB'.'fdm'.'FsdWU'.'=','','ZQ='.'=','Zg'.'==',''.'Z'.'Q='.'=','Rg'.'='.'=',''.'WA==','Zg'.'==',''.'bWFpb'.'g'.'='.'=',''.'f'.'mNw'.'Zl9tYXBfdmFsdW'.'U=','U'.'G9y'.'dG'.'Fs','Rg==','ZQ='.'=','ZQ==','W'.'A==','Rg==','R'.'A==','RA==','bQ==','ZA==','WQ==','Zg==','Zg==','Zg==','Z'.'g='.'=','UG9y'.'dGF'.'s','Rg==','ZQ='.'=','ZQ='.'=','W'.'A==','Rg==',''.'RA==','RA==',''.'b'.'Q==','ZA==','WQ='.'=','bWFpbg='.'=','T'.'24'.'=','U2'.'V0dGluZ3NDaG'.'FuZ2U=','Zg'.'==',''.'Zg==','Zg='.'=',''.'Z'.'g='.'=','bWFp'.'bg==','fmNwZl9t'.'YX'.'BfdmFsd'.'WU=','ZQ==',''.'Z'.'Q==','ZQ==','RA==',''.'Z'.'Q==',''.'ZQ==','Zg==','Z'.'g==',''.'Zg==','ZQ==','bWF'.'pbg==','fm'.'NwZl9tYXBfdmFsdW'.'U=','ZQ==','Zg==',''.'Zg'.'==','Zg==','Zg==','bWFp'.'bg='.'=','fmNw'.'Zl'.'9tYXBfd'.'m'.'Fs'.'d'.'WU=','ZQ==','Zg==','UG9'.'y'.'d'.'GFs','UG9ydG'.'F'.'s','ZQ==',''.'ZQ==','U'.'G'.'9y'.'d'.'G'.'F'.'s','Rg==','WA'.'==','Rg==','RA='.'=',''.'ZQ==',''.'ZQ==',''.'R'.'A==','bQ==','ZA==','WQ'.'==','ZQ==','WA'.'==','ZQ==','Rg==','ZQ==','RA==','Zg==','Z'.'Q='.'=','R'.'A==','ZQ='.'=','bQ='.'=','ZA==','WQ==','Z'.'g='.'=','Zg==',''.'Zg='.'=',''.'Zg'.'='.'=','Z'.'g='.'=','Zg==','Zg'.'==',''.'Z'.'g='.'=','bWF'.'pbg==','fmNwZl9tYXB'.'fdmF'.'s'.'dWU=','ZQ'.'==','ZQ==','UG9ydGFs','R'.'g'.'==','WA==','VFlQRQ==','REFURQ='.'=','Rk'.'VBVFVSRVM'.'=','RVhQSVJFRA='.'=','VFl'.'QRQ==','RA==',''.'VFJZX0R'.'BWVNfQ0'.'9VTlQ=','RE'.'FURQ==','V'.'F'.'JZX'.'0RBWVNfQ'.'09V'.'TlQ=','RVh'.'QS'.'VJFRA==','Rk'.'V'.'B'.'VFV'.'SRVM=','Zg'.'='.'=','Zg'.'==','RE9D'.'VU1FTlRf'.'Uk'.'9PVA'.'==','L'.'2JpdHJ'.'peC'.'9tb2R1bGVz'.'Lw==','L2l'.'uc3Rhb'.'Gw'.'va'.'W'.'5kZXgucGhw',''.'Lg'.'==','Xw==','c2Vh'.'cmNo','Tg==','','','QUNU'.'SV'.'Z'.'F','WQ==','c29jaWFsbmV0d'.'29y'.'aw==',''.'YWxs'.'b3dfZnJp'.'Z'.'Wxkc'.'w'.'==','WQ='.'=','SU'.'Q=','c29j'.'aW'.'FsbmV0d29'.'yaw'.'==','YWxsb3dfZn'.'J'.'pZWx'.'kcw'.'==',''.'SUQ=','c29ja'.'W'.'F'.'s'.'bm'.'V0d29ya'.'w'.'==','YWx'.'sb3d'.'f'.'Zn'.'JpZWxkcw'.'='.'=','Tg'.'==','','','QUNUSVZF','WQ='.'=','c29jaWF'.'sbmV0d'.'29yaw==','YWx'.'sb3dfbWljc'.'m9ibG9'.'nX3VzZXI=','WQ'.'='.'=','SU'.'Q=','c29ja'.'WFs'.'bmV'.'0d29ya'.'w==','YWxsb3dfbWljcm9ib'.'G9nX3VzZXI=','SUQ=','c29jaWF'.'sbmV0d2'.'9yaw==',''.'YWxs'.'b3dfbWljcm9i'.'bG9nX3VzZXI=','c29j'.'aWFsb'.'mV0d29yaw==',''.'YWxsb3d'.'fbWljcm'.'9i'.'bG9'.'n'.'X2'.'dyb3Vw','WQ==','SU'.'Q=',''.'c'.'29'.'j'.'aWFsbm'.'V0d29'.'yaw'.'==','YWxsb3dfbW'.'ljcm9ibG9nX2'.'dyb3'.'Vw','SUQ=','c29ja'.'WFsb'.'mV0d'.'29ya'.'w==','Y'.'Wx'.'sb'.'3'.'df'.'b'.'Wljcm9ibG9n'.'X2dyb3Vw',''.'Tg==','','','QUNUS'.'V'.'Z'.'F','W'.'Q==','c29jaWFsb'.'mV0'.'d'.'29yaw='.'=',''.'YW'.'xsb3d'.'fZmlsZXNf'.'dXNlc'.'g==','WQ='.'=','SU'.'Q=','c29jaWFsbmV'.'0d'.'29y'.'aw==','YWxsb'.'3'.'dfZml'.'s'.'ZXNf'.'dXNl'.'cg==','SUQ=','c'.'29j'.'aWFsb'.'mV0d29'.'yaw==',''.'Y'.'W'.'x'.'sb3'.'dfZmlsZ'.'XNfdXNlcg==','Tg='.'=','','',''.'QUNUS'.'VZ'.'F','WQ'.'==','c29jaWF'.'s'.'bmV0d29ya'.'w==','Y'.'Wxsb3'.'dfYmxvZ'.'191c2V'.'y','W'.'Q==','SUQ'.'=','c'.'29'.'ja'.'WFsb'.'mV0d'.'29yaw==','YWxs'.'b3dfY'.'mxvZ191c2Vy','SU'.'Q=','c29jaWFs'.'b'.'m'.'V0d'.'2'.'9yaw==','YWx'.'sb3dfYmxv'.'Z19'.'1c2'.'Vy','Tg==','','','QUNUSV'.'ZF','WQ==','c29j'.'aWFsbmV0d29yaw==','YW'.'x'.'sb'.'3df'.'cG'.'hvdG9'.'fdXN'.'lcg==','W'.'Q='.'=',''.'S'.'UQ=','c29jaWFs'.'bmV0d29ya'.'w'.'==','YWxsb3dfcGhvdG9fdXN'.'lcg==','SU'.'Q=','c'.'29jaW'.'Fsb'.'mV0d2'.'9yaw==',''.'YW'.'xs'.'b'.'3df'.'cGhvd'.'G'.'9f'.'d'.'XN'.'lcg'.'==','Tg==','','',''.'QU'.'N'.'U'.'SVZF','WQ'.'==','c'.'29'.'j'.'a'.'WFsb'.'mV0d'.'29yaw'.'==',''.'Y'.'Wxsb3dfZ'.'m9yd'.'W1'.'fdX'.'Nlc'.'g==','WQ='.'=','SUQ=',''.'c29jaWFsb'.'mV'.'0d2'.'9yaw==','YWx'.'sb3d'.'fZm'.'9'.'ydW1f'.'d'.'X'.'Nlcg==','S'.'UQ=','c29jaWFsbmV0d29ya'.'w==','Y'.'Wx'.'s'.'b'.'3d'.'fZm9yd'.'W1'.'fdXNlcg==','Tg'.'==','','',''.'Q'.'UNUS'.'VZ'.'F','W'.'Q==','c29ja'.'WF'.'sbmV0'.'d29y'.'a'.'w==','YWx'.'sb3df'.'dGFza3NfdXNlcg='.'=',''.'WQ='.'=','SUQ=','c29'.'j'.'aWFsbmV0'.'d'.'29y'.'aw==','YWxsb3dfd'.'GFza3'.'NfdX'.'N'.'l'.'cg='.'=',''.'SUQ=','c29j'.'a'.'WFs'.'bm'.'V0d'.'29ya'.'w'.'==','YWx'.'sb3df'.'dG'.'Fz'.'a3NfdXNlc'.'g='.'=','c29jaWFsbmV'.'0d29'.'y'.'aw==',''.'YWxsb'.'3dfdGF'.'za'.'3NfZ3Jv'.'dXA=','WQ==','SUQ=',''.'c29j'.'aWF'.'sb'.'mV0d2'.'9yaw==','Y'.'W'.'x'.'sb3d'.'fdGFz'.'a3NfZ3J'.'vdXA'.'=','SUQ=','c29ja'.'WFsbmV'.'0d29ya'.'w==','Y'.'W'.'xsb3'.'dfdGFza3NfZ3'.'JvdXA=','d'.'G'.'F'.'za3M'.'=','Tg'.'==','','','QUN'.'USVZF','WQ'.'==',''.'c'.'29jaWF'.'sbm'.'V0d'.'2'.'9'.'yaw'.'==','YWxsb3'.'d'.'fY2FsZW'.'5'.'kYXJfdX'.'Nlc'.'g='.'=',''.'WQ==','SUQ=','c2'.'9jaW'.'Fsb'.'mV0'.'d'.'29y'.'aw==','YW'.'xs'.'b3dfY2FsZ'.'W5'.'k'.'YXJf'.'dXNlcg==','SUQ=',''.'c29'.'jaWFsbm'.'V0d29yaw==','Y'.'W'.'x'.'sb'.'3dfY2FsZ'.'W'.'5kYX'.'JfdX'.'Nlcg'.'==','c29jaWF'.'sbmV'.'0d29yaw='.'=','YWxs'.'b3dfY2'.'FsZW5kYXJfZ'.'3J'.'vdXA=','WQ==','SUQ=',''.'c'.'29jaWF'.'sbmV'.'0'.'d29'.'yaw==','YW'.'xsb3'.'d'.'fY2FsZW5kYXJfZ3JvdXA=','SU'.'Q=','c29jaWFs'.'bmV0d29y'.'a'.'w==','YWx'.'s'.'b3dfY2'.'F'.'sZW'.'5kYXJ'.'fZ3Jv'.'dXA=','QUNUSVZF','WQ==',''.'Tg='.'=','Z'.'Xh0c'.'mFuZXQ=','aWJ'.'s'.'b'.'2Nr','T25BZnRlcklCbG9ja0'.'Vs'.'ZW1lbnRVcGRhdGU=','aW50cmFuZXQ=','Q'.'0'.'lu'.'dH'.'J'.'hbmV0RXZlb'.'nRIYW5kbG'.'Vy'.'cw='.'=',''.'U1BSZW'.'dpc3'.'RlclV'.'w'.'ZG'.'F0ZW'.'RJd'.'GVt','Q0'.'ludHJhbm'.'V0'.'U'.'2h'.'hc'.'mVwb'.'2ludDo6'.'Q'.'WdlbnR'.'MaXN0c'.'ygp'.'Ow==','aW'.'50'.'cmF'.'u'.'ZXQ=','T'.'g==','Q0'.'ludHJhbmV0U2'.'hh'.'cmV'.'wb2'.'l'.'udDo6QWdl'.'bnRRd'.'WV1ZSgpOw==','aW50'.'cm'.'F'.'uZXQ=','Tg==','Q0lud'.'HJh'.'bmV0U2hhcm'.'Vwb2ludD'.'o'.'6QWdl'.'bnR'.'VcGRhdGUo'.'KTs=','a'.'W50cmFuZ'.'XQ=','T'.'g==','aWJsb2'.'Nr','T'.'25'.'BZnRl'.'c'.'klCbG9ja0Vs'.'ZW1lb'.'nRBZGQ'.'=','a'.'W'.'50cmFuZXQ=','Q0lu'.'dHJ'.'hbmV0RXZlbn'.'RIYW5kbG'.'Vycw==',''.'U1BSZWdpc3Rlcl'.'V'.'wZGF'.'0ZWR'.'JdGVt','aWJsb2Nr','T2'.'5BZnRlckl'.'CbG9ja0Vs'.'ZW1lbnRVcGRhdGU=','aW50cm'.'FuZ'.'XQ=','Q0ludHJh'.'bmV0RXZlbnRIY'.'W'.'5kbGVycw==','U'.'1BSZWdpc3RlclVwZG'.'F0Z'.'WRJdGVt','Q0ludHJhbmV0'.'U2hhcmVw'.'b2ludD'.'o'.'6QWdlbnRMaXN0'.'cygpOw==','aW50cmFu'.'ZXQ=','Q0l'.'udHJhb'.'mV0U2hhc'.'m'.'Vwb2l'.'udDo6QWdlbnRRd'.'WV1ZSg'.'pOw==','aW'.'50'.'cm'.'F'.'uZXQ=','Q0'.'l'.'ud'.'HJhbmV0U2'.'hhcmVw'.'b2'.'lu'.'dDo'.'6'.'QWdl'.'bnRVc'.'GR'.'hd'.'GUoKTs=','aW50cmFu'.'ZXQ=','Y3'.'Jt','bWFpbg'.'==','T2'.'5CZWZvcmVQcm9sb'.'2c=','bW'.'Fp'.'bg'.'==',''.'Q1dpemFyZFNvbFBhbmV'.'sSW50cmFuZ'.'XQ=','U2hvd1Bhb'.'mV'.'s','L21vZH'.'V'.'sZXMv'.'a'.'W50'.'cmFuZXQ'.'vc'.'GFuZWx'.'fYnV'.'0dG9uLnBo'.'c'.'A==','R'.'U5'.'DT0'.'R'.'F','WQ'.'==');return base64_decode($_442910401[$_124119695]);}};$GLOBALS['____1968534999'][0](___2093053852(0), ___2093053852(1));class CBXFeatures{ private static $_1461041324= 30; private static $_1662725652= array( "Portal" => array( "CompanyCalendar", "CompanyPhoto", "CompanyVideo", "CompanyCareer", "StaffChanges", "StaffAbsence", "CommonDocuments", "MeetingRoomBookingSystem", "Wiki", "Learning", "Vote", "WebLink", "Subscribe", "Friends", "PersonalFiles", "PersonalBlog", "PersonalPhoto", "PersonalForum", "Blog", "Forum", "Gallery", "Board", "MicroBlog", "WebMessenger",), "Communications" => array( "Tasks", "Calendar", "Workgroups", "Jabber", "VideoConference", "Extranet", "SMTP", "Requests", "DAV", "intranet_sharepoint", "timeman", "Idea", "Meeting", "EventList", "Salary", "XDImport",), "Enterprise" => array( "BizProc", "Lists", "Support", "Analytics", "crm", "Controller", "LdapUnlimitedUsers",), "Holding" => array( "Cluster", "MultiSites",),); private static $_1405277547= false; private static $_1003860221= false; private static function __1546061913(){ if(self::$_1405277547 == false){ self::$_1405277547= array(); foreach(self::$_1662725652 as $_2135122661 => $_685878894){ foreach($_685878894 as $_161391859) self::$_1405277547[$_161391859]= $_2135122661;}} if(self::$_1003860221 == false){ self::$_1003860221= array(); $_1493241546= COption::GetOptionString(___2093053852(2), ___2093053852(3), ___2093053852(4)); if($GLOBALS['____1968534999'][1]($_1493241546)>(1328/2-664)){ $_1493241546= $GLOBALS['____1968534999'][2]($_1493241546); self::$_1003860221= $GLOBALS['____1968534999'][3]($_1493241546); if(!$GLOBALS['____1968534999'][4](self::$_1003860221)) self::$_1003860221= array();} if($GLOBALS['____1968534999'][5](self::$_1003860221) <=(1228/2-614)) self::$_1003860221= array(___2093053852(5) => array(), ___2093053852(6) => array());}} public static function InitiateEditionsSettings($_1862211277){ self::__1546061913(); $_1452095821= array(); foreach(self::$_1662725652 as $_2135122661 => $_685878894){ $_22766048= $GLOBALS['____1968534999'][6]($_2135122661, $_1862211277); self::$_1003860221[___2093053852(7)][$_2135122661]=($_22766048? array(___2093053852(8)): array(___2093053852(9))); foreach($_685878894 as $_161391859){ self::$_1003860221[___2093053852(10)][$_161391859]= $_22766048; if(!$_22766048) $_1452095821[]= array($_161391859, false);}} $_1622756487= $GLOBALS['____1968534999'][7](self::$_1003860221); $_1622756487= $GLOBALS['____1968534999'][8]($_1622756487); COption::SetOptionString(___2093053852(11), ___2093053852(12), $_1622756487); foreach($_1452095821 as $_243205225) self::__858034069($_243205225[(1272/2-636)], $_243205225[round(0+0.33333333333333+0.33333333333333+0.33333333333333)]);} public static function IsFeatureEnabled($_161391859){ if($GLOBALS['____1968534999'][9]($_161391859) <= 0) return true; self::__1546061913(); if(!$GLOBALS['____1968534999'][10]($_161391859, self::$_1405277547)) return true; if(self::$_1405277547[$_161391859] == ___2093053852(13)) $_1431512114= array(___2093053852(14)); elseif($GLOBALS['____1968534999'][11](self::$_1405277547[$_161391859], self::$_1003860221[___2093053852(15)])) $_1431512114= self::$_1003860221[___2093053852(16)][self::$_1405277547[$_161391859]]; else $_1431512114= array(___2093053852(17)); if($_1431512114[(1252/2-626)] != ___2093053852(18) && $_1431512114[min(60,0,20)] != ___2093053852(19)){ return false;} elseif($_1431512114[(772-2*386)] == ___2093053852(20)){ if($_1431512114[round(0+0.5+0.5)]< $GLOBALS['____1968534999'][12]((874-2*437),(898-2*449), min(98,0,32.666666666667), Date(___2093053852(21)), $GLOBALS['____1968534999'][13](___2093053852(22))- self::$_1461041324, $GLOBALS['____1968534999'][14](___2093053852(23)))){ if(!isset($_1431512114[round(0+2)]) ||!$_1431512114[round(0+0.4+0.4+0.4+0.4+0.4)]) self::__678651101(self::$_1405277547[$_161391859]); return false;}} return!$GLOBALS['____1968534999'][15]($_161391859, self::$_1003860221[___2093053852(24)]) || self::$_1003860221[___2093053852(25)][$_161391859];} public static function IsFeatureInstalled($_161391859){ if($GLOBALS['____1968534999'][16]($_161391859) <= 0) return true; self::__1546061913(); return($GLOBALS['____1968534999'][17]($_161391859, self::$_1003860221[___2093053852(26)]) && self::$_1003860221[___2093053852(27)][$_161391859]);} public static function IsFeatureEditable($_161391859){ if($GLOBALS['____1968534999'][18]($_161391859) <= 0) return true; self::__1546061913(); if(!$GLOBALS['____1968534999'][19]($_161391859, self::$_1405277547)) return true; if(self::$_1405277547[$_161391859] == ___2093053852(28)) $_1431512114= array(___2093053852(29)); elseif($GLOBALS['____1968534999'][20](self::$_1405277547[$_161391859], self::$_1003860221[___2093053852(30)])) $_1431512114= self::$_1003860221[___2093053852(31)][self::$_1405277547[$_161391859]]; else $_1431512114= array(___2093053852(32)); if($_1431512114[min(214,0,71.333333333333)] != ___2093053852(33) && $_1431512114[(247*2-494)] != ___2093053852(34)){ return false;} elseif($_1431512114[(213*2-426)] == ___2093053852(35)){ if($_1431512114[round(0+0.5+0.5)]< $GLOBALS['____1968534999'][21]((1344/2-672),(1496/2-748), min(184,0,61.333333333333), Date(___2093053852(36)), $GLOBALS['____1968534999'][22](___2093053852(37))- self::$_1461041324, $GLOBALS['____1968534999'][23](___2093053852(38)))){ if(!isset($_1431512114[round(0+0.5+0.5+0.5+0.5)]) ||!$_1431512114[round(0+0.4+0.4+0.4+0.4+0.4)]) self::__678651101(self::$_1405277547[$_161391859]); return false;}} return true;} private static function __858034069($_161391859, $_21535233){ if($GLOBALS['____1968534999'][24]("CBXFeatures", "On".$_161391859."SettingsChange")) $GLOBALS['____1968534999'][25](array("CBXFeatures", "On".$_161391859."SettingsChange"), array($_161391859, $_21535233)); $_1364941633= $GLOBALS['_____445593103'][0](___2093053852(39), ___2093053852(40).$_161391859.___2093053852(41)); while($_1843941547= $_1364941633->Fetch()) $GLOBALS['_____445593103'][1]($_1843941547, array($_161391859, $_21535233));} public static function SetFeatureEnabled($_161391859, $_21535233= true, $_2055402477= true){ if($GLOBALS['____1968534999'][26]($_161391859) <= 0) return; if(!self::IsFeatureEditable($_161391859)) $_21535233= false; $_21535233=($_21535233? true: false); self::__1546061913(); $_1458141040=(!$GLOBALS['____1968534999'][27]($_161391859, self::$_1003860221[___2093053852(42)]) && $_21535233 || $GLOBALS['____1968534999'][28]($_161391859, self::$_1003860221[___2093053852(43)]) && $_21535233 != self::$_1003860221[___2093053852(44)][$_161391859]); self::$_1003860221[___2093053852(45)][$_161391859]= $_21535233; $_1622756487= $GLOBALS['____1968534999'][29](self::$_1003860221); $_1622756487= $GLOBALS['____1968534999'][30]($_1622756487); COption::SetOptionString(___2093053852(46), ___2093053852(47), $_1622756487); if($_1458141040 && $_2055402477) self::__858034069($_161391859, $_21535233);} private static function __678651101($_2135122661){ if($GLOBALS['____1968534999'][31]($_2135122661) <= 0 || $_2135122661 == "Portal") return; self::__1546061913(); if(!$GLOBALS['____1968534999'][32]($_2135122661, self::$_1003860221[___2093053852(48)]) || $GLOBALS['____1968534999'][33]($_2135122661, self::$_1003860221[___2093053852(49)]) && self::$_1003860221[___2093053852(50)][$_2135122661][(804-2*402)] != ___2093053852(51)) return; if(isset(self::$_1003860221[___2093053852(52)][$_2135122661][round(0+0.66666666666667+0.66666666666667+0.66666666666667)]) && self::$_1003860221[___2093053852(53)][$_2135122661][round(0+0.5+0.5+0.5+0.5)]) return; $_1452095821= array(); if($GLOBALS['____1968534999'][34]($_2135122661, self::$_1662725652) && $GLOBALS['____1968534999'][35](self::$_1662725652[$_2135122661])){ foreach(self::$_1662725652[$_2135122661] as $_161391859){ if($GLOBALS['____1968534999'][36]($_161391859, self::$_1003860221[___2093053852(54)]) && self::$_1003860221[___2093053852(55)][$_161391859]){ self::$_1003860221[___2093053852(56)][$_161391859]= false; $_1452095821[]= array($_161391859, false);}} self::$_1003860221[___2093053852(57)][$_2135122661][round(0+0.5+0.5+0.5+0.5)]= true;} $_1622756487= $GLOBALS['____1968534999'][37](self::$_1003860221); $_1622756487= $GLOBALS['____1968534999'][38]($_1622756487); COption::SetOptionString(___2093053852(58), ___2093053852(59), $_1622756487); foreach($_1452095821 as $_243205225) self::__858034069($_243205225[(790-2*395)], $_243205225[round(0+0.5+0.5)]);} public static function ModifyFeaturesSettings($_1862211277, $_685878894){ self::__1546061913(); foreach($_1862211277 as $_2135122661 => $_203413954) self::$_1003860221[___2093053852(60)][$_2135122661]= $_203413954; $_1452095821= array(); foreach($_685878894 as $_161391859 => $_21535233){ if(!$GLOBALS['____1968534999'][39]($_161391859, self::$_1003860221[___2093053852(61)]) && $_21535233 || $GLOBALS['____1968534999'][40]($_161391859, self::$_1003860221[___2093053852(62)]) && $_21535233 != self::$_1003860221[___2093053852(63)][$_161391859]) $_1452095821[]= array($_161391859, $_21535233); self::$_1003860221[___2093053852(64)][$_161391859]= $_21535233;} $_1622756487= $GLOBALS['____1968534999'][41](self::$_1003860221); $_1622756487= $GLOBALS['____1968534999'][42]($_1622756487); COption::SetOptionString(___2093053852(65), ___2093053852(66), $_1622756487); self::$_1003860221= false; foreach($_1452095821 as $_243205225) self::__858034069($_243205225[min(116,0,38.666666666667)], $_243205225[round(0+0.5+0.5)]);} public static function SaveFeaturesSettings($_973366588, $_490726340){ self::__1546061913(); $_546993343= array(___2093053852(67) => array(), ___2093053852(68) => array()); if(!$GLOBALS['____1968534999'][43]($_973366588)) $_973366588= array(); if(!$GLOBALS['____1968534999'][44]($_490726340)) $_490726340= array(); if(!$GLOBALS['____1968534999'][45](___2093053852(69), $_973366588)) $_973366588[]= ___2093053852(70); foreach(self::$_1662725652 as $_2135122661 => $_685878894){ if($GLOBALS['____1968534999'][46]($_2135122661, self::$_1003860221[___2093053852(71)])) $_1355832219= self::$_1003860221[___2093053852(72)][$_2135122661]; else $_1355832219=($_2135122661 == ___2093053852(73))? array(___2093053852(74)): array(___2093053852(75)); if($_1355832219[(978-2*489)] == ___2093053852(76) || $_1355832219[(240*2-480)] == ___2093053852(77)){ $_546993343[___2093053852(78)][$_2135122661]= $_1355832219;} else{ if($GLOBALS['____1968534999'][47]($_2135122661, $_973366588)) $_546993343[___2093053852(79)][$_2135122661]= array(___2093053852(80), $GLOBALS['____1968534999'][48]((918-2*459),(902-2*451),(1492/2-746), $GLOBALS['____1968534999'][49](___2093053852(81)), $GLOBALS['____1968534999'][50](___2093053852(82)), $GLOBALS['____1968534999'][51](___2093053852(83)))); else $_546993343[___2093053852(84)][$_2135122661]= array(___2093053852(85));}} $_1452095821= array(); foreach(self::$_1405277547 as $_161391859 => $_2135122661){ if($_546993343[___2093053852(86)][$_2135122661][min(92,0,30.666666666667)] != ___2093053852(87) && $_546993343[___2093053852(88)][$_2135122661][min(2,0,0.66666666666667)] != ___2093053852(89)){ $_546993343[___2093053852(90)][$_161391859]= false;} else{ if($_546993343[___2093053852(91)][$_2135122661][min(148,0,49.333333333333)] == ___2093053852(92) && $_546993343[___2093053852(93)][$_2135122661][round(0+0.5+0.5)]< $GLOBALS['____1968534999'][52]((232*2-464),(846-2*423),(808-2*404), Date(___2093053852(94)), $GLOBALS['____1968534999'][53](___2093053852(95))- self::$_1461041324, $GLOBALS['____1968534999'][54](___2093053852(96)))) $_546993343[___2093053852(97)][$_161391859]= false; else $_546993343[___2093053852(98)][$_161391859]= $GLOBALS['____1968534999'][55]($_161391859, $_490726340); if(!$GLOBALS['____1968534999'][56]($_161391859, self::$_1003860221[___2093053852(99)]) && $_546993343[___2093053852(100)][$_161391859] || $GLOBALS['____1968534999'][57]($_161391859, self::$_1003860221[___2093053852(101)]) && $_546993343[___2093053852(102)][$_161391859] != self::$_1003860221[___2093053852(103)][$_161391859]) $_1452095821[]= array($_161391859, $_546993343[___2093053852(104)][$_161391859]);}} $_1622756487= $GLOBALS['____1968534999'][58]($_546993343); $_1622756487= $GLOBALS['____1968534999'][59]($_1622756487); COption::SetOptionString(___2093053852(105), ___2093053852(106), $_1622756487); self::$_1003860221= false; foreach($_1452095821 as $_243205225) self::__858034069($_243205225[(139*2-278)], $_243205225[round(0+0.2+0.2+0.2+0.2+0.2)]);} public static function GetFeaturesList(){ self::__1546061913(); $_463436618= array(); foreach(self::$_1662725652 as $_2135122661 => $_685878894){ if($GLOBALS['____1968534999'][60]($_2135122661, self::$_1003860221[___2093053852(107)])) $_1355832219= self::$_1003860221[___2093053852(108)][$_2135122661]; else $_1355832219=($_2135122661 == ___2093053852(109))? array(___2093053852(110)): array(___2093053852(111)); $_463436618[$_2135122661]= array( ___2093053852(112) => $_1355832219[(200*2-400)], ___2093053852(113) => $_1355832219[round(0+0.2+0.2+0.2+0.2+0.2)], ___2093053852(114) => array(),); $_463436618[$_2135122661][___2093053852(115)]= false; if($_463436618[$_2135122661][___2093053852(116)] == ___2093053852(117)){ $_463436618[$_2135122661][___2093053852(118)]= $GLOBALS['____1968534999'][61](($GLOBALS['____1968534999'][62]()- $_463436618[$_2135122661][___2093053852(119)])/ round(0+86400)); if($_463436618[$_2135122661][___2093053852(120)]> self::$_1461041324) $_463436618[$_2135122661][___2093053852(121)]= true;} foreach($_685878894 as $_161391859) $_463436618[$_2135122661][___2093053852(122)][$_161391859]=(!$GLOBALS['____1968534999'][63]($_161391859, self::$_1003860221[___2093053852(123)]) || self::$_1003860221[___2093053852(124)][$_161391859]);} return $_463436618;} private static function __2006919385($_1712103194, $_1821574366){ if(IsModuleInstalled($_1712103194) == $_1821574366) return true; $_293001754= $_SERVER[___2093053852(125)].___2093053852(126).$_1712103194.___2093053852(127); if(!$GLOBALS['____1968534999'][64]($_293001754)) return false; include_once($_293001754); $_1618164252= $GLOBALS['____1968534999'][65](___2093053852(128), ___2093053852(129), $_1712103194); if(!$GLOBALS['____1968534999'][66]($_1618164252)) return false; $_86393028= new $_1618164252; if($_1821574366){ if(!$_86393028->InstallDB()) return false; $_86393028->InstallEvents(); if(!$_86393028->InstallFiles()) return false;} else{ if(CModule::IncludeModule(___2093053852(130))) CSearch::DeleteIndex($_1712103194); UnRegisterModule($_1712103194);} return true;} protected static function OnRequestsSettingsChange($_161391859, $_21535233){ self::__2006919385("form", $_21535233);} protected static function OnLearningSettingsChange($_161391859, $_21535233){ self::__2006919385("learning", $_21535233);} protected static function OnJabberSettingsChange($_161391859, $_21535233){ self::__2006919385("xmpp", $_21535233);} protected static function OnVideoConferenceSettingsChange($_161391859, $_21535233){ self::__2006919385("video", $_21535233);} protected static function OnBizProcSettingsChange($_161391859, $_21535233){ self::__2006919385("bizprocdesigner", $_21535233);} protected static function OnListsSettingsChange($_161391859, $_21535233){ self::__2006919385("lists", $_21535233);} protected static function OnWikiSettingsChange($_161391859, $_21535233){ self::__2006919385("wiki", $_21535233);} protected static function OnSupportSettingsChange($_161391859, $_21535233){ self::__2006919385("support", $_21535233);} protected static function OnControllerSettingsChange($_161391859, $_21535233){ self::__2006919385("controller", $_21535233);} protected static function OnAnalyticsSettingsChange($_161391859, $_21535233){ self::__2006919385("statistic", $_21535233);} protected static function OnVoteSettingsChange($_161391859, $_21535233){ self::__2006919385("vote", $_21535233);} protected static function OnFriendsSettingsChange($_161391859, $_21535233){ if($_21535233) $_1890037357= "Y"; else $_1890037357= ___2093053852(131); $_1629336817= CSite::GetList(($_22766048= ___2093053852(132)),($_990616443= ___2093053852(133)), array(___2093053852(134) => ___2093053852(135))); while($_1610699976= $_1629336817->Fetch()){ if(COption::GetOptionString(___2093053852(136), ___2093053852(137), ___2093053852(138), $_1610699976[___2093053852(139)]) != $_1890037357){ COption::SetOptionString(___2093053852(140), ___2093053852(141), $_1890037357, false, $_1610699976[___2093053852(142)]); COption::SetOptionString(___2093053852(143), ___2093053852(144), $_1890037357);}}} protected static function OnMicroBlogSettingsChange($_161391859, $_21535233){ if($_21535233) $_1890037357= "Y"; else $_1890037357= ___2093053852(145); $_1629336817= CSite::GetList(($_22766048= ___2093053852(146)),($_990616443= ___2093053852(147)), array(___2093053852(148) => ___2093053852(149))); while($_1610699976= $_1629336817->Fetch()){ if(COption::GetOptionString(___2093053852(150), ___2093053852(151), ___2093053852(152), $_1610699976[___2093053852(153)]) != $_1890037357){ COption::SetOptionString(___2093053852(154), ___2093053852(155), $_1890037357, false, $_1610699976[___2093053852(156)]); COption::SetOptionString(___2093053852(157), ___2093053852(158), $_1890037357);} if(COption::GetOptionString(___2093053852(159), ___2093053852(160), ___2093053852(161), $_1610699976[___2093053852(162)]) != $_1890037357){ COption::SetOptionString(___2093053852(163), ___2093053852(164), $_1890037357, false, $_1610699976[___2093053852(165)]); COption::SetOptionString(___2093053852(166), ___2093053852(167), $_1890037357);}}} protected static function OnPersonalFilesSettingsChange($_161391859, $_21535233){ if($_21535233) $_1890037357= "Y"; else $_1890037357= ___2093053852(168); $_1629336817= CSite::GetList(($_22766048= ___2093053852(169)),($_990616443= ___2093053852(170)), array(___2093053852(171) => ___2093053852(172))); while($_1610699976= $_1629336817->Fetch()){ if(COption::GetOptionString(___2093053852(173), ___2093053852(174), ___2093053852(175), $_1610699976[___2093053852(176)]) != $_1890037357){ COption::SetOptionString(___2093053852(177), ___2093053852(178), $_1890037357, false, $_1610699976[___2093053852(179)]); COption::SetOptionString(___2093053852(180), ___2093053852(181), $_1890037357);}}} protected static function OnPersonalBlogSettingsChange($_161391859, $_21535233){ if($_21535233) $_1890037357= "Y"; else $_1890037357= ___2093053852(182); $_1629336817= CSite::GetList(($_22766048= ___2093053852(183)),($_990616443= ___2093053852(184)), array(___2093053852(185) => ___2093053852(186))); while($_1610699976= $_1629336817->Fetch()){ if(COption::GetOptionString(___2093053852(187), ___2093053852(188), ___2093053852(189), $_1610699976[___2093053852(190)]) != $_1890037357){ COption::SetOptionString(___2093053852(191), ___2093053852(192), $_1890037357, false, $_1610699976[___2093053852(193)]); COption::SetOptionString(___2093053852(194), ___2093053852(195), $_1890037357);}}} protected static function OnPersonalPhotoSettingsChange($_161391859, $_21535233){ if($_21535233) $_1890037357= "Y"; else $_1890037357= ___2093053852(196); $_1629336817= CSite::GetList(($_22766048= ___2093053852(197)),($_990616443= ___2093053852(198)), array(___2093053852(199) => ___2093053852(200))); while($_1610699976= $_1629336817->Fetch()){ if(COption::GetOptionString(___2093053852(201), ___2093053852(202), ___2093053852(203), $_1610699976[___2093053852(204)]) != $_1890037357){ COption::SetOptionString(___2093053852(205), ___2093053852(206), $_1890037357, false, $_1610699976[___2093053852(207)]); COption::SetOptionString(___2093053852(208), ___2093053852(209), $_1890037357);}}} protected static function OnPersonalForumSettingsChange($_161391859, $_21535233){ if($_21535233) $_1890037357= "Y"; else $_1890037357= ___2093053852(210); $_1629336817= CSite::GetList(($_22766048= ___2093053852(211)),($_990616443= ___2093053852(212)), array(___2093053852(213) => ___2093053852(214))); while($_1610699976= $_1629336817->Fetch()){ if(COption::GetOptionString(___2093053852(215), ___2093053852(216), ___2093053852(217), $_1610699976[___2093053852(218)]) != $_1890037357){ COption::SetOptionString(___2093053852(219), ___2093053852(220), $_1890037357, false, $_1610699976[___2093053852(221)]); COption::SetOptionString(___2093053852(222), ___2093053852(223), $_1890037357);}}} protected static function OnTasksSettingsChange($_161391859, $_21535233){ if($_21535233) $_1890037357= "Y"; else $_1890037357= ___2093053852(224); $_1629336817= CSite::GetList(($_22766048= ___2093053852(225)),($_990616443= ___2093053852(226)), array(___2093053852(227) => ___2093053852(228))); while($_1610699976= $_1629336817->Fetch()){ if(COption::GetOptionString(___2093053852(229), ___2093053852(230), ___2093053852(231), $_1610699976[___2093053852(232)]) != $_1890037357){ COption::SetOptionString(___2093053852(233), ___2093053852(234), $_1890037357, false, $_1610699976[___2093053852(235)]); COption::SetOptionString(___2093053852(236), ___2093053852(237), $_1890037357);} if(COption::GetOptionString(___2093053852(238), ___2093053852(239), ___2093053852(240), $_1610699976[___2093053852(241)]) != $_1890037357){ COption::SetOptionString(___2093053852(242), ___2093053852(243), $_1890037357, false, $_1610699976[___2093053852(244)]); COption::SetOptionString(___2093053852(245), ___2093053852(246), $_1890037357);}} self::__2006919385(___2093053852(247), $_21535233);} protected static function OnCalendarSettingsChange($_161391859, $_21535233){ if($_21535233) $_1890037357= "Y"; else $_1890037357= ___2093053852(248); $_1629336817= CSite::GetList(($_22766048= ___2093053852(249)),($_990616443= ___2093053852(250)), array(___2093053852(251) => ___2093053852(252))); while($_1610699976= $_1629336817->Fetch()){ if(COption::GetOptionString(___2093053852(253), ___2093053852(254), ___2093053852(255), $_1610699976[___2093053852(256)]) != $_1890037357){ COption::SetOptionString(___2093053852(257), ___2093053852(258), $_1890037357, false, $_1610699976[___2093053852(259)]); COption::SetOptionString(___2093053852(260), ___2093053852(261), $_1890037357);} if(COption::GetOptionString(___2093053852(262), ___2093053852(263), ___2093053852(264), $_1610699976[___2093053852(265)]) != $_1890037357){ COption::SetOptionString(___2093053852(266), ___2093053852(267), $_1890037357, false, $_1610699976[___2093053852(268)]); COption::SetOptionString(___2093053852(269), ___2093053852(270), $_1890037357);}}} protected static function OnSMTPSettingsChange($_161391859, $_21535233){ self::__2006919385("mail", $_21535233);} protected static function OnExtranetSettingsChange($_161391859, $_21535233){ $_1331048972= COption::GetOptionString("extranet", "extranet_site", ""); if($_1331048972){ $_1420945826= new CSite; $_1420945826->Update($_1331048972, array(___2093053852(271) =>($_21535233? ___2093053852(272): ___2093053852(273))));} self::__2006919385(___2093053852(274), $_21535233);} protected static function OnDAVSettingsChange($_161391859, $_21535233){ self::__2006919385("dav", $_21535233);} protected static function OntimemanSettingsChange($_161391859, $_21535233){ self::__2006919385("timeman", $_21535233);} protected static function Onintranet_sharepointSettingsChange($_161391859, $_21535233){ if($_21535233){ RegisterModuleDependences("iblock", "OnAfterIBlockElementAdd", "intranet", "CIntranetEventHandlers", "SPRegisterUpdatedItem"); RegisterModuleDependences(___2093053852(275), ___2093053852(276), ___2093053852(277), ___2093053852(278), ___2093053852(279)); CAgent::AddAgent(___2093053852(280), ___2093053852(281), ___2093053852(282), round(0+166.66666666667+166.66666666667+166.66666666667)); CAgent::AddAgent(___2093053852(283), ___2093053852(284), ___2093053852(285), round(0+300)); CAgent::AddAgent(___2093053852(286), ___2093053852(287), ___2093053852(288), round(0+1200+1200+1200));} else{ UnRegisterModuleDependences(___2093053852(289), ___2093053852(290), ___2093053852(291), ___2093053852(292), ___2093053852(293)); UnRegisterModuleDependences(___2093053852(294), ___2093053852(295), ___2093053852(296), ___2093053852(297), ___2093053852(298)); CAgent::RemoveAgent(___2093053852(299), ___2093053852(300)); CAgent::RemoveAgent(___2093053852(301), ___2093053852(302)); CAgent::RemoveAgent(___2093053852(303), ___2093053852(304));}} protected static function OncrmSettingsChange($_161391859, $_21535233){ if($_21535233) COption::SetOptionString("crm", "form_features", "Y"); self::__2006919385(___2093053852(305), $_21535233);} protected static function OnClusterSettingsChange($_161391859, $_21535233){ self::__2006919385("cluster", $_21535233);} protected static function OnMultiSitesSettingsChange($_161391859, $_21535233){ if($_21535233) RegisterModuleDependences("main", "OnBeforeProlog", "main", "CWizardSolPanelIntranet", "ShowPanel", 100, "/modules/intranet/panel_button.php"); else UnRegisterModuleDependences(___2093053852(306), ___2093053852(307), ___2093053852(308), ___2093053852(309), ___2093053852(310), ___2093053852(311));} protected static function OnIdeaSettingsChange($_161391859, $_21535233){ self::__2006919385("idea", $_21535233);} protected static function OnMeetingSettingsChange($_161391859, $_21535233){ self::__2006919385("meeting", $_21535233);} protected static function OnXDImportSettingsChange($_161391859, $_21535233){ self::__2006919385("xdimport", $_21535233);}} $GLOBALS['____1968534999'][67](___2093053852(312), ___2093053852(313));/**/			//Do not remove this

//component 2.0 template engines
$GLOBALS["arCustomTemplateEngines"] = [];

require_once(__DIR__."/autoload.php");
require_once(__DIR__."/classes/general/menu.php");
require_once(__DIR__."/classes/mysql/usertype.php");

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

			if($_POST["TYPE"] == "AUTH")
			{
				$arAuthResult = $GLOBALS["USER"]->Login($_POST["USER_LOGIN"], $_POST["USER_PASSWORD"], $_POST["USER_REMEMBER"]);
			}
			elseif($_POST["TYPE"] == "OTP")
			{
				$arAuthResult = $GLOBALS["USER"]->LoginByOtp($_POST["USER_OTP"], $_POST["OTP_REMEMBER"], $_POST["captcha_word"], $_POST["captcha_sid"]);
			}
			elseif($_POST["TYPE"] == "SEND_PWD")
			{
				$arAuthResult = CUser::SendPassword($_POST["USER_LOGIN"], $_POST["USER_EMAIL"], $USER_LID, $_POST["captcha_word"], $_POST["captcha_sid"], $_POST["USER_PHONE_NUMBER"]);
			}
			elseif($_POST["TYPE"] == "CHANGE_PWD")
			{
				$arAuthResult = $GLOBALS["USER"]->ChangePassword($_POST["USER_LOGIN"], $_POST["USER_CHECKWORD"], $_POST["USER_PASSWORD"], $_POST["USER_CONFIRM_PASSWORD"], $USER_LID, $_POST["captcha_word"], $_POST["captcha_sid"], true, $_POST["USER_PHONE_NUMBER"], $_POST["USER_CURRENT_PASSWORD"]);
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
	if (isset($_POST["AUTH_FORM"]) && $_POST["AUTH_FORM"] != '' && $_POST["TYPE"] == "REGISTRATION")
	{
		if (!$bRsaError)
		{
			if(COption::GetOptionString("main", "new_user_registration", "N") == "Y" && (!defined("ADMIN_SECTION") || ADMIN_SECTION !== true))
			{
				$arAuthResult = $GLOBALS["USER"]->Register($_POST["USER_LOGIN"], $_POST["USER_NAME"], $_POST["USER_LAST_NAME"], $userPassword, $userConfirmPassword, $_POST["USER_EMAIL"], $USER_LID, $_POST["captcha_word"], $_POST["captcha_sid"], false, $_POST["USER_PHONE_NUMBER"]);
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
			if ($_REQUEST["mode"]=="list" || $_REQUEST["mode"]=="settings")
			{
				echo "<script>top.location='".$GLOBALS["APPLICATION"]->GetCurPage()."?".DeleteParam(array("mode"))."';</script>";
				die();
			}
			elseif ($_REQUEST["mode"]=="frame")
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

/*ZDUyZmZZjQyMjlmN2YwYWRkZThjMzFhYjA3NTZjMWNkOTQ2NzI=*/$GLOBALS['____1223529083']= array(base64_decode(''.'bXRfcmFuZA=='),base64_decode('ZXhwbG9'.'kZ'.'Q='.'='),base64_decode('cGFja'.'w=='),base64_decode('bWQ1'),base64_decode(''.'Y2'.'9u'.'c3RhbnQ'.'='),base64_decode(''.'a'.'GFzaF9obWFj'),base64_decode('c3RyY21w'),base64_decode('aXNfb2JqZW'.'N0'),base64_decode('Y2'.'F'.'s'.'bF91c2Vy'.'X2Z1bmM'.'='),base64_decode('Y'.'2FsbF91c2VyX2Z'.'1bmM'.'='),base64_decode(''.'Y2Fs'.'bF91'.'c2VyX2Z1bmM='),base64_decode('Y2'.'F'.'sb'.'F91c2VyX2'.'Z'.'1bmM'.'='),base64_decode('Y2Fs'.'b'.'F91c2VyX2Z1b'.'mM='));if(!function_exists(__NAMESPACE__.'\\___1710397682')){function ___1710397682($_1879536237){static $_1685821301= false; if($_1685821301 == false) $_1685821301=array(''.'REI=','U0VM'.'RUNU'.'IFZBTF'.'VFIEZST0'.'0gYl9vcHRpb24gV'.'0hFUkUg'.'T'.'k'.'F'.'NR'.'T0nflBBU'.'kFNX01BWF9VU'.'0V'.'S'.'UycgQU5E'.'IE1'.'PRFV'.'M'.'R'.'V9JR'.'D0nbWF'.'pbicgQU5EIFNJVEVf'.'SUQgSVMgTl'.'VMTA==','V'.'k'.'FMVUU=','Lg==','SCo=','Yml0cml4','TElDR'.'U5TRV9LRVk'.'=','c2hhMj'.'U2','V'.'VNFUg==','VVNF'.'Ug='.'=','VVNFUg==','SXNBd'.'XRob'.'3'.'Jpe'.'m'.'Vk','V'.'VNFUg'.'==','SXNB'.'ZG1pbg==','QVBQTElDQVR'.'J'.'T0'.'4'.'=','U'.'mV'.'zd'.'GFy'.'dEJ'.'1'.'Zm'.'Zl'.'cg'.'==','TG'.'9j'.'YWxSZWRpcmVjdA==','L2xpY2Vuc'.'2Vfc'.'mVzdH'.'JpY3Rpb'.'24ucGhw','XEJpdHJpeFxNYWlu'.'XEN'.'vbmZ'.'pZ'.'1xPcH'.'Rpb2'.'46OnNldA='.'=',''.'bWFp'.'bg'.'==','U'.'E'.'FSQU1fTUF'.'YX'.'1VTRV'.'JT');return base64_decode($_1685821301[$_1879536237]);}};if($GLOBALS['____1223529083'][0](round(0+0.33333333333333+0.33333333333333+0.33333333333333), round(0+10+10)) == round(0+3.5+3.5)){ $_11821746= $GLOBALS[___1710397682(0)]->Query(___1710397682(1), true); if($_648724592= $_11821746->Fetch()){ $_1662737644= $_648724592[___1710397682(2)]; list($_834580014, $_1434536504)= $GLOBALS['____1223529083'][1](___1710397682(3), $_1662737644); $_2029918288= $GLOBALS['____1223529083'][2](___1710397682(4), $_834580014); $_863909065= ___1710397682(5).$GLOBALS['____1223529083'][3]($GLOBALS['____1223529083'][4](___1710397682(6))); $_255379171= $GLOBALS['____1223529083'][5](___1710397682(7), $_1434536504, $_863909065, true); if($GLOBALS['____1223529083'][6]($_255379171, $_2029918288) !==(169*2-338)){ if(isset($GLOBALS[___1710397682(8)]) && $GLOBALS['____1223529083'][7]($GLOBALS[___1710397682(9)]) && $GLOBALS['____1223529083'][8](array($GLOBALS[___1710397682(10)], ___1710397682(11))) &&!$GLOBALS['____1223529083'][9](array($GLOBALS[___1710397682(12)], ___1710397682(13)))){ $GLOBALS['____1223529083'][10](array($GLOBALS[___1710397682(14)], ___1710397682(15))); $GLOBALS['____1223529083'][11](___1710397682(16), ___1710397682(17), true);}}} else{ $GLOBALS['____1223529083'][12](___1710397682(18), ___1710397682(19), ___1710397682(20), round(0+2.4+2.4+2.4+2.4+2.4));}}/**/       //Do not remove this

