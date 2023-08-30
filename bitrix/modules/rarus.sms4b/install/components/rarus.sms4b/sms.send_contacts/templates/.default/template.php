<?php if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();?>

<?php
// подключение jQuery
CJSCore::Init(['jquery']);
\Bitrix\Main\Page\Asset::getInstance()->addJs($templateFolder.'/js/jquery-ui.min.js');
\Bitrix\Main\Page\Asset::getInstance()->addJs($templateFolder.'/js/jquery.mousewheel.min.js');
\Bitrix\Main\Page\Asset::getInstance()->addJs($templateFolder.'/js/jquery.mCustomScrollbar.js');
$APPLICATION->SetAdditionalCSS($templateFolder.'/js/jquery.mCustomScrollbar.css');

?>

<div class="wrap_modul_sms">
	<form method="post" name="send_contacts">
        <?php if(empty($arResult['message'])):?>
			<div id="demo_form">
				<p class="title_block"><?=GetMessage('GET_TITLE_FORM')?></p>
				<div class="two-blocks">
					<div class="left-block">
						<p class=""><?=GetMessage('GET_CONTACTS_TEXT')?></p>
						<input type="hidden" name="ajax_demo_send" value="1" />
						<input class="text input-window grayed contact_number" type="text" placeholder="<?=GetMessage('your_number')?>" name="contact_number" maxlength="25"><br />
						<input type="submit" class="btn btn-success send_contacts" name="send_contacts" value="<?=(!empty($arResult["the_button_label"]) ? $arResult["the_button_label"] : GetMessage('GET_CONTACTS_SEND'))?>" />			
						<p class="work-technology"><?=GetMessage('GET_BOTTOM_LABEL')?></p>
					</div>
					<div class="right-block">
						<div class="content">
							<?=$arResult['contacts_company']?>
						</div>
					</div>
				</div>			
			</div>
			<div id="demo_loader">
				<img src="<?=$templateFolder.'/images/newloader.gif'?>"/><br><br>				
				<?=GetMessage('GET_CONTACTS_PROCESSING')?>
			</div>
			<div id="demo_result">
			</div>
        <?php else:?>
			<p<?=($arResult['is_error'] ? ' class="error"' : ' class="success"');?>>			
				<?=$arResult['message'];?>
			</p>
        <?php endif;?>
	</form>
</div>

<script>
	your_number  = "<?=GetMessage('your_number')?>";
	enter_number = "<?=GetMessage('enter_number')?>";
	incorrect_number = "<?=GetMessage('incorrect_number')?>";
</script>	
