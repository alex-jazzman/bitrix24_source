<?php if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true)die();?>
<?php
//*************************************
//show current authorization section
//*************************************
?>
<form action="<?=$arResult['FORM_ACTION']?>" method="post">
    <?php echo bitrix_sessid_post();?>
<table width="100%" border="0" cellpadding="0" cellspacing="0" class="data-table">
<thead><tr><td colspan="2"><?php echo GetMessage('subscr_title_auth')?></td></tr></thead>
<tr>
	<td width="40%"><?php echo GetMessage('adm_auth_user')?>
        <?php echo htmlspecialchars($USER->GetFullName());?> [<?php echo htmlspecialchars($USER->GetLogin())?>].
	</td>
	<td width="60%">
        <?php if($arResult['ID']==0):?>
            <?php echo GetMessage('subscr_auth_logout1')?> <a href="<?php echo $arResult['FORM_ACTION']?>?logout=YES&amp;sf_EMAIL=<?php echo $arResult['REQUEST']['EMAIL']?><?php echo $arResult['REQUEST']['RUBRICS_PARAM']?>"><?php echo GetMessage('adm_auth_logout')?></a><?php echo GetMessage('subscr_auth_logout2')?><br />
        <?php else:?>
            <?php echo GetMessage('subscr_auth_logout3')?> <a href="<?php echo $arResult['FORM_ACTION']?>?logout=YES&amp;sf_EMAIL=<?php echo $arResult['REQUEST']['EMAIL']?><?php echo $arResult['REQUEST']['RUBRICS_PARAM']?>"><?php echo GetMessage('adm_auth_logout')?></a><?php echo GetMessage('subscr_auth_logout4')?><br />
        <?php endif;?>
	</td>
</tr>
</table>
</form>
<br />
