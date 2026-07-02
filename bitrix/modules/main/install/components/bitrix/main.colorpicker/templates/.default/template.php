<?php
if(!defined("B_PROLOG_INCLUDED")||B_PROLOG_INCLUDED!==true)die();

/**
 * @var array $arParams
 */
?>
<script>
jsColorPickerMess = window.jsColorPickerMess = {
	DefaultColor: '<?= CUtil::JSEscape(GetMessage('DefaultColor'));?>'
}
</script>
<?php
if ($arParams['SHOW_BUTTON'] == 'Y')
{
		$ID = !empty($arParams['ID']) ? $arParams['ID'] : RandString();
?>
<span id="bx_colorpicker_<?= $ID?>"></span>
<style>#bx_btn_<?= $ID?>{background-position: -280px -21px;}</style>
<script>
var CP_<?= CUtil::JSEscape($ID)?> = new window.BXColorPicker({
	'id':'<?= CUtil::JSEscape($ID)?>'<?php if (!empty($arParams['NAME'])):?>,'name':'<?= CUtil::JSEscape($arParams['~NAME']);?>'<?php endif;if ($arParams['ONSELECT']):?>,'OnSelect':<?= $arParams['ONSELECT'];endif;?>
});
BX.ready(function () {document.getElementById('bx_colorpicker_<?= CUtil::JSEscape($ID)?>').appendChild(CP_<?= CUtil::JSEscape($ID)?>.pCont)});
</script>
	<?php
}
?>