<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var CBitrixComponentTemplate $this */
/** @var array $arParams */
/** @var array $arResult */
/** @global CUser $USER */
/** @global CMain $APPLICATION */
/** @var CBitrixComponent $component */
/** @var string $templateFolder */

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Uri;

Loc::loadLanguageFile(__DIR__ . '/template.php');
Loc::loadLanguageFile(__FILE__);

$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty('BodyClass', ($bodyClass ? $bodyClass . ' ' : '') . 'no-all-paddings no-background');

$isRenamedIntegrator = \Bitrix\Intranet\Public\Service\IntegratorService::createByDefault()->isRenamedIntegrator();

\Bitrix\Main\UI\Extension::load([
	'ui.buttons',
	'ui.hint',
	'ui.icons.b24',
	'ui.icon-set.solid',
	'ui.design-tokens',
	'ui.fonts.opensans',
	'ui.fonts.inter',
	'ui.avatar',
]);

if (!$arResult['Permissions']['view'])
{
	$APPLICATION->IncludeComponent(
		'bitrix:ui.sidepanel.wrapper',
		'',
		[
			'POPUP_COMPONENT_NAME' => 'bitrix:socialnetwork.entity.error',
			'POPUP_COMPONENT_TEMPLATE_NAME' => '',
			'POPUP_COMPONENT_PARAMS' => [
				'ENTITY' => 'USER',
			],
		]
	);

	return;
}

$status = (string)($arResult['User']['STATUS'] ?? '');

if (
	!$arResult['IS_CURRENT_USER_COLLABER']
	&& !in_array($status, ['email', 'extranet', 'collaber'], true)
)
{
	$APPLICATION->includeComponent(
		'bitrix:intranet.binding.menu',
		'',
		[
			'SECTION_CODE' => 'user_detail',
			'MENU_CODE' => 'top_menu',
			'USE_UI_TOOLBAR' => 'Y',
			'CONTEXT' => [
				'USER_ID' => $arResult['User']['ID'],
			],
		]
	);
}

$roleBadgeText = '';
if ($status !== '' && $status !== 'employee')
{
	if ($status === 'integrator' && $isRenamedIntegrator)
	{
		$roleBadgeText = Loc::getMessage('INTRANET_USER_PROFILE_integrator_RENAMED');
	}
	else
	{
		$roleBadgeText = Loc::getMessage('INTRANET_USER_PROFILE_MSG_1_' . $status)
			?? Loc::getMessage('INTRANET_USER_PROFILE_' . $status);
	}
}

$secondaryBadge = (string)($arResult['ProfileView']['secondaryBadge'] ?? '');
$hasInfoBanner = !empty($arResult['ProfileView']['hasInfoBanner']);
?>

<div class="intranet-user-profile" id="intranet-user-profile-wrap">
	<div class="intranet-user-profile-column-left">
		<div class="intranet-user-profile-column-block<?= $secondaryBadge !== '' ? ' --with-secondary-badge' : '' ?>">
			<div class="intranet-user-profile-rank">
				<?php if (!empty($roleBadgeText)): ?>
					<div class="intranet-user-profile-rank-item intranet-user-profile-rank-<?= htmlspecialcharsbx($status) ?>">
						<span><?= mb_strtoupper(htmlspecialcharsbx($roleBadgeText)) ?></span>
					</div>
				<?php endif; ?>
				<?php if ($secondaryBadge !== ''): ?>
					<div class="intranet-user-profile-rank-item intranet-user-profile-rank-system-user">
						<span><?= htmlspecialcharsbx($secondaryBadge) ?></span>
					</div>
				<?php endif; ?>
			</div>

			<?php
			$avatarStyle = (
				!empty($arResult['User']['PHOTO'])
					? ' style="background-image: url(\'' . Uri::urnEncode($arResult['User']['PHOTO']) . '\');"'
					: ''
			);
			?>
			<div class="intranet-user-profile-userpic ui-icon ui-icon-common-user" id="intranet-user-profile-userpic-avatar">
				<i<?= $avatarStyle ?>></i>
			</div>

			<?php if ($status !== '' && !in_array($status, ['visitor', 'email', 'shop'], true)): ?>
				<div class="intranet-user-profile-actions">
					<a
						class="ui-btn ui-btn-sm ui-btn-light-border ui-btn-round"
						href="#"
						onclick="if (top.BXIM) { top.BXIM.openMessenger(<?= (int)$arResult['User']['ID'] ?>); } return false;"
					>
						<?= Loc::getMessage('INTRANET_USER_PROFILE_CHAT') ?>
					</a>
				</div>
			<?php endif; ?>
		</div>
	</div>
	<div class="intranet-user-profile-column-right">
		<?php if ($hasInfoBanner): ?>
			<div class="intranet-user-profile-container intranet-user-profile-system-user-note --ui-context-content-light">
				<div class="intranet-user-profile-system-user-note__body">
					<img
						class="intranet-user-profile-system-user-note__image"
						src="<?= htmlspecialcharsbx($templateFolder) ?>/images/system-user-banner.png"
						alt=""
					>
					<div class="intranet-user-profile-system-user-note__content">
						<span class="intranet-user-profile-system-user-note__text">
							<?= htmlspecialcharsbx(Loc::getMessage('INTRANET_USER_PROFILE_SYSTEM_USER_BANNER_TEXT')) ?>
						</span>
						<a
							class="intranet-user-profile-system-user-note__link"
							href="#"
							onclick="top.BX.Helper.show('redirect=detail&code=28659338'); return false;"
						><?= htmlspecialcharsbx(Loc::getMessage('INTRANET_USER_PROFILE_SYSTEM_USER_BANNER_MORE')) ?></a>
					</div>
				</div>
			</div>
		<?php endif; ?>

		<?php
		$APPLICATION->IncludeComponent(
			"bitrix:ui.form",
			"",
			[
				"GUID" => $arResult["FormId"],
				"INITIAL_MODE" => "view",
				"ENTITY_TYPE_NAME" => "USER",
				"ENTITY_ID" => $arResult["User"]["ID"],
				"ENTITY_FIELDS" => $arResult["FormFields"],
				"ENTITY_CONFIG" => $arResult["FormConfig"],
				"ENTITY_DATA" => $arResult["FormData"],
				"ENABLE_SECTION_EDIT" => false,
				"ENABLE_SECTION_CREATION" => false,
				"ENABLE_SECTION_DRAG_DROP" => true,
				"FORCE_DEFAULT_SECTION_NAME" => true,
				"ENABLE_PERSONAL_CONFIGURATION_UPDATE" => $arResult["EnablePersonalConfigurationUpdate"],
				"ENABLE_COMMON_CONFIGURATION_UPDATE" => $arResult["EnableCommonConfigurationUpdate"],
				"ENABLE_SETTINGS_FOR_ALL" => $arResult["EnableSettingsForAll"],
				"READ_ONLY" => !$arResult["Permissions"]['edit'],
				"ENABLE_USER_FIELD_CREATION" => $arResult["EnableUserFieldCreation"],
				"ENABLE_USER_FIELD_MANDATORY_CONTROL" => $arResult["EnableUserFieldMandatoryControl"],
				"USER_FIELD_ENTITY_ID" => $arResult["UserFieldEntityId"],
				"USER_FIELD_PREFIX" => $arResult["UserFieldPrefix"],
				"ENABLE_FIELD_DRAG_DROP" => true,
				"USER_FIELD_CREATE_SIGNATURE" => $arResult["UserFieldCreateSignature"],
				"SERVICE_URL" => POST_FORM_ACTION_URI . '&' . bitrix_sessid_get(),
				"COMPONENT_AJAX_DATA" => [
					"COMPONENT_NAME" => $this->getComponent()->getName(),
					"ACTION_NAME" => "save",
					"SIGNED_PARAMETERS" => $this->getComponent()->getSignedParameters(),
				],
			]
		);
		?>
	</div>
</div>
