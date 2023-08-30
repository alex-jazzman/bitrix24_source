<?php if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true) die();?>

<h1><?=GetMessage('EMPLOYEE')?></h1>

<?php if (count($arResult["USERS"]) == 0):?>
    <?php ShowError(GetMessage('EMPLOYEE_NOT_FOUND'))?>
<?php else:?>
	<div style="float:left;">
		<table border="0" class = "usersList">
			<thead>
				<tr>
					<td class=ogg></td>
					<td class=ogg><b><?=GetMessage('FIO')."/".GetMessage('TELEPHONE')."/".GetMessage('DEPARTMENT')?></b></td>
					<td class=ogg style="text-align:center"><b>+</b></td>
				</tr>
			</thead>
			<tbody>
            <?php $i=0;?>
            <?php foreach ($arResult["USERS"] as $arIndex):?>
                <?php
    				
    				
    				if (strlen($arIndex["LAST_NAME"].$arIndex["NAME"]) < 1)
    				{
    					$showedName = $arIndex["LOGIN"];
    				}
    				else
    				{
    					$showedName = $arIndex["LAST_NAME"].' '.$arIndex["NAME"];
    				}
    				$department = array_pop($arIndex["UF_DEPARTMENT"]);
    				if ($department == '') 
    					$department = GetMessage('NOT_SET');
			    ?>
				<tr>
					<td style="text-align:center">
                        <?php if ($arIndex["PERSONAL_PHOTO"]):?>
							<img src = '<?=$arIndex["PERSONAL_PHOTO"]?>' border="0" width="55" height="55" />
                        <?php else:?>
							<div>
								<img src = "<?=$templateFolder?>/images/questionMark.jpg" />
							</div>
                        <?php endif;?>
					</td>
					<td <?=$i % 2 != 0? "class=ogg" : "class=nogg" ?> >
						<div style="padding-bottom:5px"><?=$showedName?></div>
						<div style="padding-bottom:5px">
                            <?php $defUserProperty = COption::GetOptionString('rarus.sms4b', 'user_property_phone', '', SITE_ID);?>
                            <?php if (!empty($arIndex[$defUserProperty])):?>
							<?=$arIndex[$defUserProperty];?>
                            <?php else:?>
							<?=GetMessage('NOT_SET');?>
                            <?php endif;?>
						</div>
						<div style="padding-bottom:5px"><?=$department?></div>
					</td>
					<td align="center"><button onclick="addNumber({phone: '<?=$arIndex["PERSONAL_MOBILE"]?>', name: '<?=$showedName?>', department: '<?=$department?>'}, 'dest')" value="add" class="button"></button></td>
				</tr>
                <?php $i++;?>
            <?php endforeach;?>
			</tbody>
		</table>
		<div><?=$arResult['USERS_NAV'];?></div>
	</div>
<?php endif;?>

