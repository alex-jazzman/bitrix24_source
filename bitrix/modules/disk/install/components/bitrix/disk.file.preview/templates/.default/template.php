<?
use Bitrix\Main\Localization\Loc;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();
global $APPLICATION;

\Bitrix\Main\UI\Extension::load([
	'ui.design-tokens',
	'ui.fonts.opensans',
]);

$APPLICATION->SetAdditionalCSS('/bitrix/js/disk/css/disk.css');
?>

<div class="file-preview" data-testid="disk-file-preview">
	<div class="file-preview-header">
		<span class="file-preview-header-icon bx-file-icon-container-small <?=$arResult["ICON_CLASS"]?>" aria-hidden="true"></span>
		<span class="file-preview-header-title">
			<?=Loc::getMessage("FILE_PREVIEW_TITLE")?>:
			<a href="<?=htmlspecialcharsbx($arResult['URL_DOWNLOAD'])?>" target="_blank" data-testid="disk-file-preview-download-link"><?=htmlspecialcharsbx($arResult['NAME'])?></a>
		</span>
	</div>

	<table class="file-preview-info" aria-label="<?=htmlspecialcharsbx(Loc::getMessage('FILE_PREVIEW_INFO_TABLE_LABEL'))?>">
		<tr>
			<th scope="row"><?=Loc::getMessage('FILE_PREVIEW_SIZE')?>:</th>
			<td>
				<?=$arResult['SIZE']?>
			</td>
		</tr>
		<tr>
			<th scope="row"><?=Loc::getMessage('FILE_PREVIEW_UPDATED')?>: </th>
			<td><?=$arResult['UPDATED']?></td>
		</tr>
	</table>
</div>
