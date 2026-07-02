<?php
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true) die();

/**
 * @global CMain $APPLICATION
 * @global CAdminPage $adminPage
 */
?>
<!DOCTYPE html>
<html id="bx-admin-prefix">
<head>
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title><?= $APPLICATION->GetTitle()?></title>
<meta http-equiv="Content-Type" content="text/html; charset=<?= LANG_CHARSET?>">
<?php
if(!is_object($adminPage))
	$adminPage = new CAdminPage();

CJSCore::Init(array('admin_interface'));

$APPLICATION->AddBufferContent(array($adminPage, "ShowCSS"));
echo $adminPage->ShowScript();
$APPLICATION->ShowHeadStrings();
$APPLICATION->ShowHeadScripts();
?>
<script>
function PopupOnKeyPress(e)
{
	if(!e) e = window.event
	if(!e) return;
	if(e.keyCode == 27)
		window.close();
}
jsUtils.addEvent(window, "keypress", PopupOnKeyPress);
</script>
</head>
<body class="body-popup adm-workarea" onkeypress="PopupOnKeyPress();">