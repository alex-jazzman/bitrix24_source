<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true) die();
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Localization\Loc;

use Bitrix\ImConnector\Connector;
/** @var array $arParams */
/** @var array $arResult */
/** @global \CMain $APPLICATION */
/** @global \CUser $USER */
/** @global \CDatabase $DB */
/** @var \CBitrixComponentTemplate $this */
/** @var string $templateName */
/** @var string $templateFile */
/** @var string $templateFolder */
/** @var string $componentPath */
/** @var \CBitrixComponent $component */

Loc::loadMessages(__FILE__);

if ($arParams['INDIVIDUAL_USE'] !== 'Y')
{
	$this->addExternalCss('/bitrix/components/bitrix/imconnector.settings/templates/.default/style.css');
	$this->addExternalJs('/bitrix/components/bitrix/imconnector.settings/templates/.default/script.js');
	Extension::load('ui.buttons');
	Extension::load('ui.hint');
	Connector::initIconCss();
}

$placeholder = ' placeholder="' . Loc::getMessage('IMCONNECTOR_COMPONENT_SETTINGS_PLACEHOLDER') . '"';

$iconCode = Connector::getIconByConnector($arResult['CONNECTOR']);
?>

	<form action="<?=$arResult['URL']['DELETE']?>" method="post" id="form_delete_<?=$arResult['CONNECTOR']?>">
		<input type="hidden" name="<?=$arResult['CONNECTOR']?>_form" value="true">
		<input type="hidden" name="<?=$arResult['CONNECTOR']?>_del" value="Y">
		<?=bitrix_sessid_post();?>
	</form>
<?php
if(empty($arResult['PAGE']))
{
	?>
	<div class="imconnector-field-container">
		<?php if($arResult['STATUS'] === true): //case when connection competed?>
			<div class="imconnector-field-section imconnector-field-section-social">
				<div class="imconnector-field-box">
					<div class="connector-icon ui-icon ui-icon-service-<?=$iconCode?>"><i></i></div>
				</div>
				<div class="imconnector-field-box">
					<div class="imconnector-field-main-subtitle">
						<?=Loc::getMessage('IMCONNECTOR_COMPONENT_MAX_CONNECTED')?>
					</div>
					<div class="imconnector-field-box-content">
						<?=Loc::getMessage('IMCONNECTOR_COMPONENT_MAX_CHANGE_ANY_TIME_MSGVER_1')?>
					</div>
					<div class="ui-btn-container">
						<a href="<?=$arResult['URL']['SIMPLE_FORM']?>" class="ui-btn ui-btn-primary show-preloader-button">
							<?=Loc::getMessage('IMCONNECTOR_COMPONENT_SETTINGS_CHANGE_SETTING')?>
						</a>
						<button class="ui-btn ui-btn-light-border"
								onclick="popupShow(<?=CUtil::PhpToJSObject($arResult['CONNECTOR'])?>)">
							<?=Loc::getMessage('IMCONNECTOR_COMPONENT_SETTINGS_DISABLE')?>
						</button>
					</div>
				</div>
			</div>
		<?php elseif($arResult['ACTIVE_STATUS'] === true): ?>
			<div class="imconnector-field-section imconnector-field-section-social">
				<div class="imconnector-field-box">
					<div class="connector-icon ui-icon ui-icon-service-<?=$iconCode?>"><i></i></div>
				</div>
				<div class="imconnector-field-box">
					<div class="imconnector-field-main-subtitle">
						<?=$arResult['NAME']?>
					</div>
					<div class="imconnector-field-box-content">
						<?=Loc::getMessage('IMCONNECTOR_COMPONENT_SETTINGS_SETTING_IS_NOT_COMPLETED')?>
					</div>
					<div class="ui-btn-container">
						<a href="<?=$arResult['URL']['SIMPLE_FORM']?>" class="ui-btn ui-btn-primary show-preloader-button">
							<?=Loc::getMessage('IMCONNECTOR_COMPONENT_SETTINGS_CONTINUE_WITH_THE_SETUP')?>
						</a>
						<button class="ui-btn ui-btn-light-border"
								onclick="popupShow(<?=CUtil::PhpToJSObject($arResult['CONNECTOR'])?>)">
							<?=Loc::getMessage('IMCONNECTOR_COMPONENT_SETTINGS_DISABLE')?>
						</button>
					</div>
				</div>
			</div>
		<?php else: ?>
			<div class="imconnector-field-section imconnector-field-section-social imconnector-field-section-info">
				<div class="imconnector-field-box">
					<div class="connector-icon ui-icon ui-icon-service-<?=$iconCode?>"><i></i></div>
				</div>
				<div class="imconnector-field-box" data-role="more-info">
					<div class="imconnector-field-main-subtitle imconnector-field-section-main-subtitle">
						<?= Loc::getMessage('IMCONNECTOR_COMPONENT_MAX_INDEX_TITLE')?>
					</div>
					<div class="imconnector-field-box-content">

						<div class="imconnector-field-box-content-text-light">
							<b><?=Loc::getMessage('IMCONNECTOR_COMPONENT_MAX_INDEX_SUBTITLE_LINK', [
								'#LINK_START#' => '<a href="https://business.max.ru/self/?utm_source=bitrix" target="_blank" style="font-size: 14px;">',
								'#LINK_END#' => '</a>',
							])?></b>
						</div>
						<div class="imconnector-field-box-content-text-light">
							<?= Loc::getMessage('IMCONNECTOR_COMPONENT_MAX_INDEX_SUBTITLE_MSGVER_1') ?>
						</div>

						<ul class="imconnector-field-box-content-text-items">
							<li class="imconnector-field-box-content-text-item"><?= Loc::getMessage('IMCONNECTOR_COMPONENT_MAX_INDEX_LIST_ITEM_1') ?></li>
							<li class="imconnector-field-box-content-text-item"><?= Loc::getMessage('IMCONNECTOR_COMPONENT_MAX_INDEX_LIST_ITEM_2') ?></li>
							<li class="imconnector-field-box-content-text-item"><?= Loc::getMessage('IMCONNECTOR_COMPONENT_MAX_INDEX_LIST_ITEM_3') ?></li>
							<li class="imconnector-field-box-content-text-item"><?= Loc::getMessage('IMCONNECTOR_COMPONENT_MAX_INDEX_LIST_ITEM_4') ?></li>
						</ul>

						<div class="imconnector-field-box-content-btn">
							<form action="<?=$arResult['URL']['SIMPLE_FORM']?>" method="post">
								<?php if($arResult['CAN_USE_CONNECTION'] === true): ?>
									<input type="hidden" name="<?=$arResult['CONNECTOR']?>_form" value="true">
									<?=bitrix_sessid_post();?>
									<button class="ui-btn ui-btn-lg ui-btn-success ui-btn-round"
											type="submit"
											name="<?=$arResult['CONNECTOR']?>_active"
											value="<?=Loc::getMessage('IMCONNECTOR_COMPONENT_SETTINGS_TO_CONNECT')?>">
										<?=Loc::getMessage('IMCONNECTOR_COMPONENT_SETTINGS_TO_CONNECT')?>
									</button>
								<?php else: ?>
									<button class="ui-btn ui-btn-lg ui-btn-success ui-btn-round"
											onclick="BX.UI.InfoHelper.show('<?=$arResult['INFO_HELPER_LIMIT']?>'); return false;">
										<?=Loc::getMessage('IMCONNECTOR_COMPONENT_SETTINGS_TO_CONNECT')?>
									</button>
								<?php endif;?>
							</form>
						</div>
					</div>
				</div>
			</div>
		<?php endif; ?>
	</div>
	<?php
	include 'messages.php';

	if (!empty($arResult['STATUS']))
	{
		include 'info.php';
	}
	else
	{
		?>
		<div class="imconnector-field-container">
			<div class="imconnector-field-section">
				<?php include 'connection-help.php'; ?>
			</div>
		</div>
		<?php
	}
}
else
{
	?>
	<div class="imconnector-field-container">
		<div class="imconnector-field-section imconnector-field-section-social">
			<div class="imconnector-field-box">
				<div class="connector-icon ui-icon ui-icon-service-<?=$iconCode?>"><i></i></div>
			</div>
			<div class="imconnector-field-box">
				<?php
				if (empty($arResult['INFO_CONNECTION']))
				{
					?>
					<div class="imconnector-field-main-subtitle">
						<?=Loc::getMessage('IMCONNECTOR_COMPONENT_MAX_CONNECT_TITLE')?>
					</div>
					<div class="imconnector-field-box-content">
						<p><?=Loc::getMessage('IMCONNECTOR_COMPONENT_MAX_INDEX_SUBTITLE_LINK', [
							'#LINK_START#' => '<a href="https://business.max.ru/self/?utm_source=bitrix" target="_blank" class="imconnector-field-box-link">',
							'#LINK_END#' => '</a>',
						])?></p>
						<?=Loc::getMessage('IMCONNECTOR_COMPONENT_MAX_CONNECT_STEP_NEW', [
							'#LINK_START#' => '<a class="imconnector-field-box-link" id="imconnector-max-link-help">',
							'#LINK_END#' => '</a>',
						])?>
					</div>
					<?php
				}
				else
				{
					?>
					<div class="imconnector-field-main-subtitle">
						<?=Loc::getMessage('IMCONNECTOR_COMPONENT_MAX_CONNECTED')?>
					</div>
					<div class="imconnector-field-box-content">
						<?=Loc::getMessage('IMCONNECTOR_COMPONENT_MAX_FINAL_FORM_DESCRIPTION_MSGVER_1')?>
					</div>
					<?php
				}
				?>
			</div>
		</div>
		<?php include 'messages.php'?>
		<div class="imconnector-field-section imconnector-field-section-control">
			<?php if (empty($arResult['INFO_CONNECTION'])): ?>
				<div class="imconnector-field-box">
					<form action="<?=$arResult['URL']['SIMPLE_FORM_EDIT']?>"
						  method="post"
						  class="imconnector-field-control-box-border">
						<input type="hidden" name="<?=$arResult['CONNECTOR']?>_form" value="true">
						<input type="hidden" name="<?=$arResult['CONNECTOR']?>_active">
						<?=bitrix_sessid_post();?>

						<div class="imconnector-step-text">
							<label for="imconnector-max-access-token">
								<?=Loc::getMessage('IMCONNECTOR_COMPONENT_MAX_ACCESS_TOKEN')?>
							</label>
						</div>
						<input type="text"
							   class="imconnector-field-control-input"
							   id="imconnector-max-access-token"
							   name="access_token"
							   value="<?=htmlspecialcharsbx($arResult['FORM']['access_token'])?>"
							<?= $arResult['placeholder']['access_token'] ? $placeholder : ''; ?>>
						<div class="imconnector-step-text">
							<button class="ui-btn ui-btn-success"
									id="webform-small-button-have"
									name="<?=$arResult['CONNECTOR']?>_save"
									value="<?=Loc::getMessage('IMCONNECTOR_COMPONENT_SETTINGS_TO_CONNECT')?>">
								<?=Loc::getMessage('IMCONNECTOR_COMPONENT_SETTINGS_TO_CONNECT')?>
							</button>
						</div>
					</form>
				</div>
			<?php endif; ?>
			<?php
			if (empty($arResult['INFO_CONNECTION'])) //not connected yet case
			{
				include 'connection-help.php';
			}
			else
			{
				include 'info.php';
			}
			?>
		</div>
	</div>
	<?php
}
