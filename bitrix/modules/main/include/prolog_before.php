<?php

if (!defined('START_EXEC_PROLOG_BEFORE_1'))
{
	define("START_EXEC_PROLOG_BEFORE_1", microtime(true));
}

$GLOBALS["BX_STATE"] = "PB";
if(isset($_REQUEST["BX_STATE"])) unset($_REQUEST["BX_STATE"]);
if(isset($_GET["BX_STATE"])) unset($_GET["BX_STATE"]);
if(isset($_POST["BX_STATE"])) unset($_POST["BX_STATE"]);
if(isset($_COOKIE["BX_STATE"])) unset($_COOKIE["BX_STATE"]);
if(isset($_FILES["BX_STATE"])) unset($_FILES["BX_STATE"]);

if(!isset($USER)) {global $USER;}
if(!isset($APPLICATION)) {global $APPLICATION;}
if(!isset($DB)) {global $DB;}

require_once(__DIR__."/../include.php");

CMain::PrologActions();

if (!defined('START_EXEC_PROLOG_BEFORE_2'))
{
	define("START_EXEC_PROLOG_BEFORE_2", microtime(true));
}
