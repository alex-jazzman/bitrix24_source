<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();?>
<?
$INPUT_ID = trim($arParams["~INPUT_ID"]);
if($INPUT_ID == '')
	$INPUT_ID = "title-search-input";
$INPUT_ID = CUtil::JSEscape($INPUT_ID);

$CONTAINER_ID = trim($arParams["~CONTAINER_ID"]);
if($CONTAINER_ID == '')
	$CONTAINER_ID = "title-search";
$CONTAINER_ID = CUtil::JSEscape($CONTAINER_ID);

if($arParams["SHOW_INPUT"] !== "N"):?>
	<div id="<?echo $CONTAINER_ID?>">
	<form action="<?echo $arResult["FORM_ACTION"]?>">
        <input id="<?echo $INPUT_ID?>" type="text" style="width:98%;" name="q" value="" maxlength="50" autocomplete="off" />
	</form>
	</div>
<?endif?>
<script type="text/javascript">
if (typeof jsControl_<?=$INPUT_ID?> == 'undefined')
{
    var jsControl_<?=$INPUT_ID?> = new JCWDTitleSearch({
        'AJAX_PAGE' : '<?echo CUtil::JSEscape(POST_FORM_ACTION_URI)?>',
        'CONTAINER_ID': '<?echo $CONTAINER_ID?>',
        'INPUT_ID': '<?echo $INPUT_ID?>',
        'MIN_QUERY_LEN': 2
    });
}
</script>
