<?php

if(!Defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)
	die();

/**
 * @var array $arParams
 */

use Bitrix\Main\Context;
use Bitrix\Main\Web\Json;

if ((defined('BX_PUBLIC_MODE')) && (1 == BX_PUBLIC_MODE))
{
?><link rel="stylesheet" type="text/css" href="<?php echo $this->GetFolder().'/style.css'; ?>">
<script src="<?php echo $this->__component->GetPath().'/script.js'; ?>"></script>
<?php
}

$name_x = CUtil::JSEscape($arParams['NAME']);
$arParams['INPUT_NAME'] = CUtil::JSEscape($arParams['~INPUT_NAME']);

if($arParams['SHOW_INPUT'] == 'Y'):?>
	<input type="text" id="<?= $arParams['INPUT_NAME']?>" name="<?= $arParams['INPUT_NAME']?>" value="<?= $arParams['INPUT_VALUE']?>" size="3" />
<?php endif;?>

<?php if($arParams['SHOW_BUTTON'] == 'Y'):?>
	<input type="button" onclick="<?= $name_x?>.Show()" value="<?= $arParams['BUTTON_CAPTION'] ? $arParams['BUTTON_CAPTION'] : '...'?>" title="<?php echo ('' != $arParams['BUTTON_TITLE'] ? $arParams['BUTTON_TITLE'] : '');?>" />
<?php endif;?>

<script>
<?php if($arParams['INPUT_NAME'] && !$arParams['ONSELECT']):?>
	function OnSelect_<?=$name_x?>(value){
		document.getElementById('<?=$arParams['INPUT_NAME']?>').value = value;
	}
<?php
	$arParams['ONSELECT'] = 'OnSelect_'.$name_x;
endif;?>
<?php

$request = Context::getCurrent()->getRequest();

$arAjaxParams = array(
	"IBLOCK_ID" => $arParams["IBLOCK_ID"],
	"lang" => LANGUAGE_ID,
	"admin" => ($request->isAdminSection() ? 'Y' : 'N'),
);
if (!$request->isAdminSection())
{
	$arAjaxParams["site"] = SITE_ID;
}
if ('' != $arParams['BAN_SYM'])
{
	$arAjaxParams['BAN_SYM'] = $arParams['BAN_SYM'];
	$arAjaxParams['REP_SYM'] = $arParams['REP_SYM'];
}
?>
var <?=$name_x?> = new JCTreeSelectControl({
	'AJAX_PAGE' : '<?= CUtil::JSEscape($this->GetFolder()."/ajax.php")?>',
	'AJAX_PARAMS' : <?= Json::encode($arAjaxParams) ?>,
	'MULTIPLE' : <?= $arParams['MULTIPLE'] == 'Y' ? 'true' : 'false'?>,
	'GET_FULL_INFO': <?= $arParams['GET_FULL_INFO'] == 'Y' ? 'true' : 'false'?>,
	'ONSELECT' : function(v){<?= $arParams['ONSELECT']?>(v)},
	'START_TEXT' : '<?= CUtil::JSEscape($arParams["START_TEXT"])?>',
	'NO_SEARCH_RESULT_TEXT' : '<?= CUtil::JSEscape($arParams["NO_SEARCH_RESULT_TEXT"])?>',
	'INPUT_NAME' : '<?= CUtil::JSEscape($arParams["~INPUT_NAME"])?>',
	'SET_ALWAYS' : true
});

<?php if($arParams['~INPUT_NAME']):?>
//BX.ready(function() {
//	<?= $name_x?>.SetValueFromInput('<?= $arParams['~INPUT_NAME']?>');
//	var inp = document.getElementById('<?= $arParams['~INPUT_NAME']?>');
//	if(inp)
//		inp.onchange = function () {<?= $name_x?>.SetValue(this.value)}
//});
<?php endif;?>
</script>