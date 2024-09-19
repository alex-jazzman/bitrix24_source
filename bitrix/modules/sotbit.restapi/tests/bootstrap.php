<?php
// Set 1C-Bitrix constants to prevent "agent", permissions and auth checking
// Include 1C-Bitrix framework core
define('NOT_CHECK_PERMISSIONS', true);
define('NO_AGENT_CHECK', true);
error_reporting(-1);
ini_set("display_errors", 0);
$GLOBALS['DBType'] = 'mysql';
$_SERVER['DOCUMENT_ROOT'] = dirname(__DIR__, 4);
require($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/include/prolog_before.php');
//$_SESSION['SESS_AUTH']['USER_ID'] = 1;

define('SR_ROOT_PATH', __DIR__ .'/../..');
define('SR_APP_PATH', SR_ROOT_PATH.'/app/');
define('SR_CONFIG_PATH', SR_ROOT_PATH.'/config/');
