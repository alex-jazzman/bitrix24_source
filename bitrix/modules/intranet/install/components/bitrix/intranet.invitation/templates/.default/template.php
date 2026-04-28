<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var CBitrixComponentTemplate $this */
/** @var array $arParams */
/** @var array $arResult */
/** @global CDatabase $DB */
/** @global CUser $USER */

/** @global CMain $APPLICATION */

use Bitrix\Main\Application;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;
use Bitrix\Socialnetwork\Helper\Feature;

Extension::load([
	"ui.forms",
	"ui.buttons",
	"ui.buttons.icons",
	"ui.alerts",
	"ui.selector",
	"ui.hint",
	'ui.entity-selector',
	'ui.feedback.form',
	'ui.design-tokens',
	'ui.fonts.opensans',
	'ui.switcher',
	'ui.analytics',
	'ui.icon-set.main',
	'ui.entity-selector',
	'intranet.selector-button',
	'intranet.invitation-input',
	'intranet.department-control',
	'ui.notification',
	'ui.form-elements.view',
	'ui.form-elements.field',
	'ui.system.typography',
	'ui.system.input',
	'ui.type',
	'ui.avatar',
]);

CJSCore::Init(['phone_number']);

$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty('BodyClass', ($bodyClass ? $bodyClass . ' ' : '') . 'no-background invite-body');

\Bitrix\UI\Toolbar\Facade\Toolbar::deleteFavoriteStar();
//\Bitrix\UI\Toolbar\Facade\Toolbar::setTitle('title');
$menuContainerId = 'invitation-form-menu-' . $this->randString();
$contentContainerId = 'invitation-form-content-' . $this->randString();

$projectLimitFeatureId = Feature::PROJECTS_GROUPS;
$isProjectLimitExceeded = !Feature::isFeatureEnabled($projectLimitFeatureId);
if (Feature::canTurnOnTrial($projectLimitFeatureId))
{
	$isProjectLimitExceeded = false;
}

$APPLICATION->IncludeComponent(
	'bitrix:ui.feedback.form',
	'',
	[
		'ID' => 'intranet-invitation',
		'VIEW_TARGET' => null,
		'FORMS' => [
			['zones' => ['com.br'], 'id' => '259', 'lang' => 'br', 'sec' => 'wfjn1i'],
			['zones' => ['es'], 'id' => '257', 'lang' => 'la', 'sec' => 'csaico'],
			['zones' => ['de'], 'id' => '255', 'lang' => 'de', 'sec' => 'nxzhg1'],
			['zones' => ['ua'], 'id' => '251', 'lang' => 'ua', 'sec' => '3y1j08'],
			['zones' => ['ru', 'kz', 'by'], 'id' => '261', 'lang' => 'ru', 'sec' => 'sieyyr'],
			['zones' => ['en'], 'id' => '253', 'lang' => 'en', 'sec' => 'wg6548'],
		],
		'air' => true,
		'USE_UI_TOOLBAR' => 'Y',
	]
);

$APPLICATION->IncludeComponent("bitrix:ui.sidepanel.wrappermenu", "", array(
	"ID" => $menuContainerId,
	"ITEMS" => $arResult["MENU_ITEMS"],
	"TITLE" => Loc::getMessage("INTRANET_INVITE_DIALOG_TITLE"),
	'USE_UI_TOOLBAR' => 'Y',
));
$this->SetViewTarget('left-panel');

?>
<div class="invitation-department__menu-divider"></div>
<ul id="invitation-department__sub-menu" class="ui-sidepanel-menu --menu-light-gray">
	<?php if (isset($arResult['SUB_MENU_ITEMS'])): ?>
		<?php foreach ($arResult["SUB_MENU_ITEMS"] as $item): ?>
			<li class="ui-sidepanel-menu-item
				<?php if (isset($item['SHOW_LOCKED']) && $item['SHOW_LOCKED'] === true): ?>--lock<?php endif; ?>">
				<a
				<?php foreach ($item["ATTRIBUTES"] as $attrName => $attrValue): ?>
					<?= $attrName ?>="<?= $attrValue ?>"
				<?php endforeach; ?>
				bx-operative="Y"
				class="ui-sidepanel-menu-link">
				<div class="ui-sidepanel-menu-link-text">
					<?= $item['NAME'] ?>
					<?php if (isset($item['SHOW_LOCKED']) && $item['SHOW_LOCKED'] === true): ?>
						<span class="ui-icon-set --lock"></span>
					<?php endif; ?>
				</div>
				</a>
			</li>
		<?php endforeach; ?>
	<?php endif; ?>
</ul>
<?php
$this->EndViewTarget();
if ($arResult["IS_CLOUD"])
{
	$APPLICATION->AddViewContent("left-panel", '');
}

if ($arResult["IS_CLOUD"] && $arResult['canCurrentUserInvite'])
{
	$isMaxUsersUnlimited = !(isset($arResult['USER_MAX_COUNT']) && $arResult['USER_MAX_COUNT'] > 0);
	$currentCountFormatted = number_format($arResult['USER_CURRENT_COUNT'], 0, '', ' ');

	if ($isMaxUsersUnlimited)
	{
		$APPLICATION->AddViewContent(
			"left-panel-after", '
				<div class="invite-limit-counters-container">
					<div class="invite-limit-counters-container__body">
						<span class="invite-limit-counters-container__title ui-headline --xs">
							' . Loc::getMessage('INTRANET_INVITE_DIALOG_USER_CURRENT_COUNT', [
								'#COUNT#' => '<span class="invite-limit-counters-container__number ui-headline --xs --accent" data-test-id="invite-limit-count">' . $currentCountFormatted . '</span>'
							]) . '
						</span>
						<div class="invite-limit-counters-container__count ui-text --2xs">
							' . Loc::getMessage('INTRANET_INVITE_DIALOG_USER_COUNT_UNLIMITED') . '
						</div>
					</div>
				</div>
			'
		);
	}
	else
	{
		$counterBarWidth = $arResult['USER_CURRENT_COUNT'] / $arResult['USER_MAX_COUNT'] * 100;
		$leftCount = max($arResult['USER_MAX_COUNT'] - $arResult['USER_CURRENT_COUNT'], 0);
		$leftCountFormatted = number_format($leftCount, 0, '', ' ');

		$APPLICATION->AddViewContent(
			"left-panel-after", '
				<div class="invite-limit-counters-container">
					<span class="invite-limit-counters-container__title ui-text --sm --accent">' . Loc::getMessage('INTRANET_INVITE_DIALOG_USER_COUNT_TITLE') . '</span>
					<div class="invite-limit-counters-container__body">
						<div class="invite-limit-counters-container__count ui-headline --xs">
							' . Loc::getMessagePlural('INTRANET_INVITE_DIALOG_USER_MAX_COUNT', $leftCount, [
								'#COUNT#' => '<span class="invite-limit-counters-container__number ui-headline --lg --accent" data-test-id="invite-limit-max-count">' . $leftCountFormatted . '</span>'
							]) . ' 
						</div>
						<div class="invite-limit-counters-container__bar">
							<div class="invite-limit-counters-container__bar-slider" style="width: ' . $counterBarWidth . '%"></div>
						</div>
						<div class="invite-limit-counters-container__legend ui-text --3xs">
							' . Loc::getMessage('INTRANET_INVITE_DIALOG_USER_CURRENT_COUNT', [
								'#COUNT#' => '<span class="invite-limit-counters-container__legend_number ui-text --3xs --accent" data-test-id="invite-limit-count">' . $currentCountFormatted . '</span>'
							]) . '
						</div>
					</div>
				</div>
			'
		);
	}
}
?>

<div data-id="<?= $contentContainerId ?>" class="popup-window-tabs-box">
	<div class="ui-alert ui-alert-danger intranet-invitation-alert ui-text --sm" data-role="error-message" style="display: none;">
	</div>
	<div class="ui-alert ui-alert-success" data-role="success-message" style="display: none;">
	</div>

	<div class="popup-window-tabs-content popup-window-tabs-content-invite">
	</div>
</div>

<script>
	BX.message(<?=CUtil::phpToJsObject(Loc::loadLanguageFile(__FILE__))?>);
	BX.message({
		BX24_INVITE_DIALOG_USERS_LIMIT_TEXT: '<?=GetMessageJS('BX24_INVITE_DIALOG_USERS_LIMIT_TEXT', array(
			'#NUM#' => Application::getInstance()->getLicense()->getMaxUsers()))?>',
		INTRANET_INVITE_DIALOG_EMAIL_VALIDATE_ERROR: '<?=GetMessageJS('INTRANET_INVITE_DIALOG_VALIDATE_ERROR_EMAIL') ?>',
		INTRANET_INVITE_DIALOG_PHONE_VALIDATE_ERROR: '<?=GetMessageJS('INTRANET_INVITE_DIALOG_VALIDATE_ERROR_PHONE' )?>',
		INTRANET_INVITE_DIALOG_EMAIL_OR_PHONE_VALIDATE_ERROR: '<?=GetMessageJS('INTRANET_INVITE_DIALOG_VALIDATE_ERROR_EMAIL_AND_PHONE')?>',

		INTRANET_INVITE_DIALOG_EMAIL_EMPTY_ERROR: '<?=GetMessageJS('INTRANET_INVITE_DIALOG_EMPTY_ERROR_EMAIL')?>',
		INTRANET_INVITE_DIALOG_PHONE_EMPTY_ERROR: '<?=GetMessageJS('INTRANET_INVITE_DIALOG_EMPTY_ERROR_PHONE')?>',
		INTRANET_INVITE_DIALOG_EMAIL_OR_PHONE_EMPTY_ERROR: '<?=GetMessageJS('INTRANET_INVITE_DIALOG_EMPTY_ERROR_EMAIL_AND_PHONE')?>',

		INTRANET_INVITE_DIALOG_EMAIL_INPUT: '<?=GetMessageJS('INTRANET_INVITE_DIALOG_INPUT_EMAIL')?>',
		INTRANET_INVITE_DIALOG_PHONE_INPUT: '<?=GetMessageJS('INTRANET_INVITE_DIALOG_INPUT_PHONE')?>',
		INTRANET_INVITE_DIALOG_EMAIL_OR_PHONE_INPUT: '<?=GetMessageJS('INTRANET_INVITE_DIALOG_INPUT_EMAIL_AND_PHONE')?>',

		INTRANET_INVITE_DIALOG_INTEGRATOR_EMAIL_PLACEHOLDER: '<?= Loc::getMessage($arResult['IS_INTEGRATOR_RENAMED'] ? 'INTRANET_INVITE_DIALOG_INTEGRATOR_EMAIL_RENAMED' : 'INTRANET_INVITE_DIALOG_INTEGRATOR_EMAIL') ?>',
		INTRANET_INVITE_DIALOG_CONFIRM_INTEGRATOR_POPUP_TITLE: '<?= Loc::getMessage($arResult['IS_INTEGRATOR_RENAMED'] ? 'INTRANET_INVITE_DIALOG_CONFIRM_INTEGRATOR_TITLE_RENAMED' : 'INTRANET_INVITE_DIALOG_CONFIRM_INTEGRATOR_TITLE') ?>',
		INTRANET_INVITE_DIALOG_CONFIRM_INTEGRATOR_POPUP_DESCRIPTION: '<?= Loc::getMessage($arResult['IS_INTEGRATOR_RENAMED'] ? 'INTRANET_INVITE_DIALOG_INTEGRATOR_DESCRIPTION_RENAMED' : 'INTRANET_INVITE_DIALOG_INTEGRATOR_DESCRIPTION') ?>',
	});

	BX.ready(function () {
		window.invitationForm = new BX.Intranet.Invitation.Form({
			signedParameters: '<?=$this->getComponent()->getSignedParameters()?>',
			componentName: '<?=$this->getComponent()->getName() ?>',
			userOptions: <?=CUtil::phpToJsObject($arParams['USER_OPTIONS'])?>,
			isCloud: '<?=$arResult['IS_CLOUD'] ? 'Y' : 'N'?>',
			isAdmin: '<?=$arResult['IS_CURRENT_USER_ADMIN'] ? 'Y' : 'N'?>',
			menuContainerNode: document.querySelector('#<?=$menuContainerId?>'),
			subMenuContainerNode: document.querySelector('#invitation-department__sub-menu'),
			contentContainerNode: document.querySelector('[data-id="<?=$contentContainerId?>"]'),
			isExtranetInstalled: '<?=$arResult['IS_EXTRANET_INSTALLED'] ? 'Y' : 'N'?>',
			regenerateUrlBase: '<?=$arResult['REGISTER_URL_BASE'] ?? ''?>',
			isInvitationBySmsAvailable: '<?=$arResult['IS_SMS_INVITATION_AVAILABLE'] ? 'Y' : 'N'?>',
			isCreatorEmailConfirmed: '<?=$arResult['IS_CREATOR_EMAIL_CONFIRMED'] ? 'Y' : 'N'?>',
			firstInvitationBlock: '<?=$arResult['FIRST_INVITATION_BLOCK']?>',
			isSelfRegisterEnabled: <?= CUtil::phpToJsObject(isset($arResult['REGISTER_SETTINGS']['REGISTER']) && $arResult['REGISTER_SETTINGS']['REGISTER'] === 'Y') ?>,
			analyticsLabel: <?= CUtil::phpToJsObject(
				Application::getInstance()->getContext()->getRequest()->get('analyticsLabel')
			) ?>,
			projectLimitExceeded: <?= Json::encode($isProjectLimitExceeded); ?>,
			projectLimitFeatureId: '<?= $projectLimitFeatureId ?>',
			whitelistValue: '<?= CUtil::JSEscape($arResult['REGISTER_SETTINGS']['REGISTER_WHITELIST'])?>',
			registerConfirm: <?= (isset($arResult['REGISTER_SETTINGS']['REGISTER_CONFIRM']) && $arResult['REGISTER_SETTINGS']['REGISTER_CONFIRM'] === 'Y' ? 'true' : 'false') ?>,
			isCollabEnabled: '<?= $arResult['IS_COLLAB_ENABLED'] ? 'Y' : 'N' ?>',
			canCurrentUserInvite: <?= $arResult['canCurrentUserInvite'] ? 'true' : 'false' ?>,
			useLocalEmailProgram: <?= $arResult['USE_INVITE_LOCAL_EMAIL_PROGRAM'] ? 'true' : 'false' ?>,
			leftMenuItems: <?= Json::encode(array_merge($arResult['MENU_ITEMS'], $arResult['SUB_MENU_ITEMS'] ?? [])); ?>,
		});
	});
</script>
