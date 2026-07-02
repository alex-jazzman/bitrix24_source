<?php if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
IncludeTemplateLangFile(__FILE__);

/**
 * @global CMain $APPLICATION
 * @global CUser $USER
 */
?>
<html>
<head>
<?php $APPLICATION->ShowHead();?>
<title><?php $APPLICATION->ShowTitle()?></title>
</head>

<body leftmargin="0" topmargin="0" marginwidth="0" marginheight="0" bgcolor="#FFFFFF">

<?php $APPLICATION->ShowPanel()?>

<?php if($USER->IsAdmin()):?>

<div style="border:red solid 1px">
	<form action="/bitrix/admin/site_edit.php" method="GET">
		<input type="hidden" name="LID" value="<?=SITE_ID?>" />
		<p><font style="color:red"><?= GetMessage("DEF_TEMPLATE_NF")?> </font></p>
		<input type="submit" name="set_template" value="<?= GetMessage("DEF_TEMPLATE_NF_SET")?>" />
	</form>
</div>

<?php endif?>