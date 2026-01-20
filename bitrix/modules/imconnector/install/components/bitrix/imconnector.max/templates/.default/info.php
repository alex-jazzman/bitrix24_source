<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true) die();
use \Bitrix\Main\Localization\Loc;
?>
<div class="imconnector-field-container">
	<div class="imconnector-field-section">
		<div class="imconnector-field-main-title">
			<?=Loc::getMessage('IMCONNECTOR_COMPONENT_MAX_INFO')?>
		</div>
		<div class="imconnector-field-box">
			<div class="imconnector-field-box-entity-row">
				<div class="imconnector-field-box-subtitle">
					<?=Loc::getMessage('IMCONNECTOR_COMPONENT_MAX_ACCESS_TOKEN_HIDDEN')?>
				</div>
				<div class="imconnector-field-box-entity-text-bold">
					<?=htmlspecialcharsbx($arResult['INFO_CONNECTION']['accessToken'])?>
				</div>
			</div>
			<div class="imconnector-field-box-entity-row">
				<div class="imconnector-field-box-subtitle">
					<?=Loc::getMessage('IMCONNECTOR_COMPONENT_MAX_BOT_USERNAME')?>
				</div>
				<div class="imconnector-field-box-entity-text-bold">
					<?=htmlspecialcharsbx($arResult['INFO_CONNECTION']['username'])?>
				</div>
			</div>
			<div class="imconnector-field-box-entity-row">
				<div class="imconnector-field-box-subtitle">
					<?=Loc::getMessage('IMCONNECTOR_COMPONENT_MAX_BOT_NAME')?>
				</div>
				<div class="imconnector-field-box-entity-text-bold">
					<?=htmlspecialcharsbx($arResult['INFO_CONNECTION']['name'])?>
				</div>
			</div>
			<div class="imconnector-field-box-entity-row">
				<div class="imconnector-field-box-subtitle">
					<?=Loc::getMessage('IMCONNECTOR_COMPONENT_MAX_BOT_LINK')?>
				</div>
				<a href="https://max.ru/<?= htmlspecialcharsbx($arResult['INFO_CONNECTION']['username']) ?>"
				   class="imconnector-field-box-entity-link"
				   target="_blank">
					https://max.ru/<?=htmlspecialcharsbx($arResult['INFO_CONNECTION']['username'])?>
				</a>
				<span class="imconnector-field-box-entity-icon-copy-to-clipboard"
					  data-text="<?=htmlspecialcharsbx(CUtil::JSEscape('https://max.ru/' . $arResult['INFO_CONNECTION']['username']))?>"></span>
			</div>
		</div>
	</div>
</div>