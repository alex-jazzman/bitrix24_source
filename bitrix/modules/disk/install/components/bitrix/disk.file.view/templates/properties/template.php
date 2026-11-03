<?php
use Bitrix\Main;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Uri;

if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true) die();
/** @var array $arParams */
/** @var array $arResult */
/** @global CMain $APPLICATION */
/** @global CUser $USER */
/** @global CDatabase $DB */
/** @var CBitrixComponentTemplate $this */
/** @var string $templateName */
/** @var string $templateFile */
/** @var string $templateFolder */
/** @var string $componentPath */
/** @var \Bitrix\Disk\Internals\BaseComponent $component */

$documentRoot = \Bitrix\Main\Application::getDocumentRoot();
$messages = Loc::loadLanguageFile(__FILE__);

CJSCore::Init([
	'clipboard',
	'ui.design-tokens',
	'ui.design-tokens.air',
	'ui.icon-set.outline',
	'ui.avatar',
	'disk',
	'disk_information_popups',
	'sidepanel',
	'ui.buttons',
	'disk.model.sharing-item',
]);

// The panel is injected into a document that already holds the card of the same file, and both
// templates print the same names: every id of this surface is prefixed with the id of its own root.
// A panel of the same file can be injected a second time, so the file alone does not tell two
// roots apart - the tail below is what makes every injection a root of its own.
$surfaceTail = $arResult['FILE']['ID'] . '-' . \Bitrix\Main\Security\Random::getString(8);
$surfaceId = 'disk-detail-properties-' . $surfaceTail;
$sortBpLog = false;
if(isset($_GET['log_sort']))
{
	$sortBpLog = true;
}

$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty('BodyClass', ($bodyClass ? $bodyClass.' ' : '').'no-all-paddings no-background');


$jsTemplates = new Main\IO\Directory($documentRoot.$templateFolder.'/js-templates');
/** @var Main\IO\File $jsTemplate */
foreach ($jsTemplates->getChildren() as $jsTemplate)
{
	include($jsTemplate->getPath());
}
?>
<div class="disk-detail-properties" id="<?= $surfaceId ?>" data-testid="disk-detail-properties">
	<div class="disk-detail-properties-title"><?= Loc::getMessage('DISK_FILE_VIEW_TAB_PROPERTIES') ?></div>
	<div class="disk-detail-properties-block">
		<div class="disk-detail-properties-file-info" data-testid="disk-detail-file-info">
			<span class="disk-detail-properties-file-name" data-testid="disk-detail-file-name"><?= htmlspecialcharsbx($arResult['FILE']['NAME']) ?></span>
			<table class="disk-detail-properties-table" data-testid="disk-detail-file-params">
				<tr>
					<td class="disk-detail-properties-table-value"><?= CFile::formatSize($arResult['FILE']['SIZE']) ?></td>
				</tr>
				<tr>
					<td class="disk-detail-properties-table-value"><?= $arResult['FILE']['UPDATE_TIME'] ?></td>
				</tr>
				<? if($arResult['FILE']['IS_DELETED'])
				{
					?>
					<tr>
						<td class="disk-detail-properties-table-param">
							<?= Loc::getMessage('DISK_FILE_VIEW_FILE_DELETE_TIME') ?>:
						</td>
						<td class="disk-detail-properties-table-value">
							<?= $arResult['FILE']['DELETE_TIME'] ?>
						</td>
					</tr>
					<?
				}
				?>
				<? if(!empty($arResult['EXTERNAL_LINK']['ID'])): ?>
				<tr>
					<td class="disk-detail-properties-table-param"><?= Loc::getMessage('DISK_FILE_VIEW_FILE_DOWNLOAD_COUNT_BY_EXT_LINK') ?>:</td>
					<td class="disk-detail-properties-table-value"><?= $arResult['EXTERNAL_LINK']['DOWNLOAD_COUNT'] ?></td>
				</tr>
				<? endif; ?>
			</table>
			<div class="disk-detail-properties-owner">
				<?= $arResult['FILE']['CREATE_USER']['AVA_HTML'] ?>
				<div class="disk-detail-properties-owner-name">
					<a class="disk-detail-properties-owner-link" data-testid="disk-detail-file-owner-link" target="_top" href="<?= $arResult['FILE']['CREATE_USER']['LINK'] ?>"><?= htmlspecialcharsbx($arResult['FILE']['CREATE_USER']['NAME']) ?></a>
					<div class="disk-detail-properties-owner-position"><?= htmlspecialcharsbx($arResult['FILE']['CREATE_USER']['WORK_POSITION']) ?></div>
				</div>
			</div>
		</div>
	</div>

	<?php if(!$arResult['FILE']['IS_DELETED']){ ?>
	<div class="disk-detail-properties-block">
		<div class="disk-detail-properties-section-title">
			<div class="disk-detail-properties-section-title-text"><?= Loc::getMessage('DISK_FILE_VIEW_TAB_FILE_LINKS') ?></div>
		</div>
		<div class="disk-detail-properties-public-link" data-testid="disk-detail-internal-link">
			<div class="disk-detail-properties-public-link-copy-link" id="<?= $surfaceId ?>-internal-link-copy" data-entity="internal-link-copy" data-testid="disk-detail-copy-internal-link" role="button" tabindex="0" title="<?= Loc::getMessage('DISK_FILE_VIEW_INTERNAL_LINK_COPY_HINT') ?>"><span class="ui-icon-set --o-copy" aria-hidden="true"></span><?= Loc::getMessage('DISK_FILE_VIEW_INTERNAL_LINK') ?></div>
			<input class="bx-disk-sidebar-shared-inner-link-input" type="text" value="<?= $arResult['FILE']['SHOW_FILE_ABSOLUTE_URL'] ?>" id="<?= $surfaceId ?>-internal-link-input" data-entity="internal-link-input" data-testid="disk-detail-internal-link-input">
		</div>
		<div data-entity="external-link-place"></div>
	</div>
	<?php } ?>

	<? if(!$arResult['FILE']['IS_DELETED'])
	{
		?>
	<div class="disk-detail-properties-block">
		<div class="disk-detail-properties-section-title disk-detail-properties-section-title-double">
			<div class="disk-detail-properties-section-title-text"><?= Loc::getMessage('DISK_FILE_VIEW_TAB_SHARING') ?></div>
			<?php if($arResult['CAN_SHARE'] && $arResult['CAN_CHANGE_RIGHTS']) { ?>
				<div class="disk-detail-properties-section-title-action js-disk-file-add-sharing" id="<?= $surfaceId ?>-add-sharing" data-testid="disk-detail-sharing-add" role="button" tabindex="0" aria-haspopup="dialog"><?= Loc::getMessage('DISK_FILE_ADD_SHARING') ?></div>
			<?php } ?>
		</div>
		<div class="disk-detail-properties-user-access-section disk-detail-sidebar-user-access-section" data-testid="disk-detail-sharing-section"></div>
	</div>
		<?
	}
	?>

	<? if($arResult['SHOW_USER_FIELDS'])
	{
		?>
	<div class="disk-detail-properties-block">
		<div class="disk-detail-properties-section-title">
			<div class="disk-detail-properties-section-title-text"><?= Loc::getMessage('DISK_FILE_VIEW_TAB_USER_FIELDS') ?>:</div>
			<?php if($arResult['CAN_UPDATE']) { ?>
				<div class="disk-detail-properties-section-title-action js-disk-edit-uf" data-testid="disk-detail-uf-edit" role="button" tabindex="0"><?= Loc::getMessage('DISK_FILE_VIEW_LINK_EDIT_USER_FIELDS_SIDEBAR') ?></div>
			<?php } ?>
		</div>
		<?php include 'uf_sidebar.php'; ?>
	</div>
		<?
	}
	?>

	<? if(!empty($arResult['USE_IN_ENTITIES'])){?>
	<div class="disk-detail-properties-block">
		<div class="disk-detail-properties-section-title">
			<div class="disk-detail-properties-section-title-text"><?= Loc::getMessage('DISK_FILE_VIEW_USAGE') ?></div>
		</div>
		<? foreach($arResult['ENTITIES'] as $entity){?>
			<div class="disk-file-info-item-title">
				<?
				if(!empty($entity['DETAIL_URL']))
				{
					echo "<a class=\"disk-file-info-item-link\" data-testid=\"disk-detail-usage-link\" target='_blank' href=\"{$entity['DETAIL_URL']}\">" . htmlspecialcharsbx($entity['TITLE']) . "</a>";
				}
				elseif(!empty($entity['JS_OPEN_DETAIL']))
				{
					echo "<a class=\"disk-file-info-item-link\" data-testid=\"disk-detail-usage-link\" href=\"javascript:{$entity['JS_OPEN_DETAIL']}\">" . htmlspecialcharsbx($entity['TITLE']) . "</a>";
				}
				else
				{
					echo htmlspecialcharsbx($entity['TITLE']);
				}
				?>
			</div>
			<div class="disk-file-info-item-title"><?= htmlspecialcharsbx($entity['DESCRIPTION']) ?></div>
			<div class="disk-file-info-users">
				<div class="disk-file-info-users-title"><?= Loc::getMessage('DISK_FILE_VIEW_ENTITY_MEMBERS') ?></div>
				<? foreach($entity['MEMBERS'] as $member){?>
					<div class="disk-file-info-user">
						<div class="disk-file-info-user-avatar" <?= (!empty($member['AVATAR_SRC'])? "style=\"background-image: url('" . Uri::urnEncode($member['AVATAR_SRC']) . "');\"" : '') ?>></div>
						<? if(empty($member['LINK'])) {?>
							<div class="disk-file-info-user-name"><?= htmlspecialcharsbx($member['NAME']) ?></div>
						<? } else { ?>
							<a class="disk-file-info-user-name" target="_top" href="<?= $member['LINK'] ?>"><?= htmlspecialcharsbx($member['NAME']) ?></a>
						<? } ?>
					</div>
				<? } ?>
			</div>
		<? }?>
	</div>
	<? } ?>
</div>
<?
$APPLICATION->IncludeComponent(
	'bitrix:disk.file.upload',
	'',
	array(
		'STORAGE' => $arResult['STORAGE'],
		'FILE_ID' => $arResult['FILE']['ID'],
		'CID' => 'FolderList',
		'INPUT_CONTAINER' => 'BX("bx-disk-file-upload-btn")',
		'DROP_ZONE' => 'BX("bx-disk-file-upload-btn")'
	),
	$component,
	array("HIDE_ICONS" => "Y")
);?>
<script>
(function () {
// The panel is injected into the current document over the file card, so both surfaces live in
// it at the same time: the mounting points of this panel are looked up inside its own root, not
// across the document. The root is found by an id of its own, because the inline script of an
// injected surface is evaluated from <head> and cannot reach itself through
// document.currentScript. The id names the surface and the file - getComponentId() is a constant
// of this component and tells nothing apart - so it also names the layers this shell puts into
// the body.
var surfaceId = '<?= $surfaceId ?>';
var shell = document.getElementById(surfaceId) || document;

BX(function () {
	var location = "<?= $arResult['PATH_TO_FILE_VIEW'] ?>";
	BX.Disk['FileViewClass_<?= $component->getComponentId() ?>'] = new BX.Disk.FileViewClass({
		componentName: '<?= $this->getComponent()->getName() ?>',
		surfaceId: surfaceId,
		// the dialog of recipients caches its instances by id, and the card of the same file lives
		// in this document under the panel: the id of the surface tells the two apart
		selectorDialogId: surfaceId + '-sharing-selector',
		object: {
			id: <?= $arResult['FILE']['ID'] ?>,
			uniqueCode: '<?= CUtil::JSEscape($arResult['FILE']['UNIQUE_CODE']) ?>',
			name: '<?= CUtil::JSEscape($arResult['FILE']['NAME']) ?>',
			isDeleted: <?= $arResult['FILE']['IS_DELETED']? 'true' : 'false' ?>,
			hasUf: <?= $arResult['SHOW_USER_FIELDS']? 'true' : 'false' ?>,
			hasBp: <?= $arParams['STATUS_BIZPROC']? 'true' : 'false' ?>
		},
		canDelete: <?= $arResult['CAN_DELETE']? 'true' : 'false' ?>,
		urls: {
			trashcanList: '<?= CUtil::JSUrlEscape($arResult['PATH_TO_TRASHCAN_LIST']) ?>',
			fileShowBp: BX.util.add_url_param(location, {action: 'showBp'}),
			fileEditUf: BX.util.add_url_param(location, {action: 'editUserField'})
		},
		layout: {
			sidebarUfValuesSection: BX(shell.querySelector('.disk-detail-sidebar-user-custom-field')),
			editUf: BX(shell.querySelector('.js-disk-edit-uf')),
			restoreButton: BX(shell.querySelector('.disk-detail-sidebar-editor-item-restore')),
			deleteButton: BX(shell.querySelector('.disk-detail-sidebar-editor-item-remove')),
			addSharingButton: BX(shell.querySelector('.js-disk-file-add-sharing')),
			externalLink: BX(shell.querySelector('[data-entity="external-link-place"]')),
			copyInternalLinkButton: BX(shell.querySelector('[data-entity="internal-link-copy"]')),
			internalLinkInput: BX(shell.querySelector('[data-entity="internal-link-input"]')),
			sharingSection: BX(shell.querySelector('.disk-detail-sidebar-user-access-section'))
		},
		externalLinkInfo: {
			id: <?= $arResult['EXTERNAL_LINK']['ID'] ?? 'null' ?>,
			objectId: <?= (int)($arResult['EXTERNAL_LINK']['OBJECT_ID'] ?? $arResult['FILE']['ID']) ?>,
			supportsSharingAccessPopup: <?= $arResult['EXTERNAL_LINK']['SUPPORTS_SHARING_ACCESS_POPUP']? 'true' : 'false'?>,
			<? if (isset($arResult['EXTERNAL_LINK']['ID'])) { ?>
				link: '<?= CUtil::JSEscape($arResult['EXTERNAL_LINK']['LINK'])?>',
				hasPassword: <?= $arResult['EXTERNAL_LINK']['HAS_PASSWORD']? 'true' : 'false'?>,
				canEditSettings: <?= $arResult['EXTERNAL_LINK']['CAN_EDIT_SETTINGS'] ? 'true' : 'false' ?>,
				availableEdit: <?= $arResult['EXTERNAL_LINK']['AVAILABLE_EDIT']? 'true' : 'false'?>,
				canEditDocument: <?= $arResult['EXTERNAL_LINK']['CAN_EDIT_DOCUMENT'] === null? 'null' : ($arResult['EXTERNAL_LINK']['CAN_EDIT_DOCUMENT']? 'true' : 'false')?>,
				isBoard: <?= $arResult['EXTERNAL_LINK']['IS_BOARD']? 'true' : 'false'?>,
				hasDeathTime: <?= $arResult['EXTERNAL_LINK']['HAS_DEATH_TIME']? 'true' : 'false'?>,
				deathTimeTimestamp: <?= $arResult['EXTERNAL_LINK']['DEATH_TIME_TIMESTAMP']?: 'null'?>,
				<? if ($arResult['EXTERNAL_LINK']['DEATH_TIME']) { ?>
				deathTime: '<?= CUtil::JSEscape($arResult['EXTERNAL_LINK']['DEATH_TIME']) ?>'
				<? } ?>
			<? } ?>
		},
		uf: {
			editButton: BX('bx-disk-link-edit-uf-values'),
			contentContainer: BX('bx-disk-file-uf-props-content')
		}
	});
	if('<?= $sortBpLog ?>')
	{
		BX.Disk['FileViewClass_<?= $component->getComponentId() ?>'].fixUrlForSort();
	}
});

BX.message(<?=Main\Web\Json::encode($messages)?>);
})();
</script>
<?
global $USER;
if(
	\Bitrix\Disk\Integration\Bitrix24Manager::isEnabled()
)
{
	?>
	<div id="bx-bitrix24-business-tools-info" style="display: none; width: 600px; margin: 9px;">
		<? $APPLICATION->IncludeComponent('bitrix:bitrix24.business.tools.info', '', array()); ?>
	</div>

	<script>
	BX.message({
		disk_restriction: <?= (!\Bitrix\Disk\Integration\Bitrix24Manager::checkAccessEnabled('disk', $USER->getId())? 'true' : 'false') ?>
	});
	</script>

<?
}
