<?php

declare(strict_types=1);

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_before.php';

use Bitrix\Main\Application;
use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Vibecodeconnector\Internal\Exception\RegistrationFailedException;
use Bitrix\Vibecodeconnector\Internal\Service\Diagnostic\CloudSharedKeyLog;
use Bitrix\Vibecodeconnector\Internal\Service\Diagnostic\IncomingJwtLog;
use Bitrix\Vibecodeconnector\Internal\Service\Diagnostic\StatusUrlSender;
use Bitrix\Vibecodeconnector\Internal\Service\Endpoint\CloudEndpointProvider;
use Bitrix\Vibecodeconnector\Internal\Service\Endpoint\EndpointResolver;
use Bitrix\Vibecodeconnector\Internal\Service\Registration\RegistrationService;

/**
 * @global CMain $APPLICATION
 * @global CUser $USER
 */

$module_id = 'vibecodeconnector';
Loc::loadMessages(__FILE__);

if (!Loader::includeModule($module_id))
{
	$APPLICATION->AuthForm(Loc::getMessage('ACCESS_DENIED'));

	return;
}

$moduleAccess = $APPLICATION->GetGroupRight($module_id);
if ($moduleAccess < 'R')
{
	$APPLICATION->AuthForm(Loc::getMessage('ACCESS_DENIED'));

	return;
}

$registrationService = ServiceLocator::getInstance()->get(RegistrationService::class);
$cloudEndpointProvider = ServiceLocator::getInstance()->get(CloudEndpointProvider::class);

$pairings = $registrationService->listPairings();
$isCloudSharedConfigured = $registrationService->isCloudSharedConfigured();
$isCloudSharedAvailable = $registrationService->isCloudSharedAvailable();
$hasAnyTarget = $isCloudSharedAvailable || $pairings !== [];

$request = Application::getInstance()->getContext()->getRequest();
$isPost = $request->isPost() && $moduleAccess >= 'W' && check_bitrix_sessid();

$selectedTarget = (string)$request->getPost('target');
$statusUrl = null;
$statusExpiresAt = null;
$statusError = null;
$statusErrorCode = null;
$selectedBaseUrl = null;

if ($isPost && $request->getPost('Verify') !== null)
{
	try
	{
		if ($selectedTarget === 'cloud_shared')
		{
			if (!$isCloudSharedAvailable)
			{
				throw new RegistrationFailedException(
					Loc::getMessage('VIBECODECONNECTOR_DIAG_ERR_CLOUD_SHARED_NOT_APPLICABLE_MSG'),
					'CLOUD_SHARED_NOT_CONFIGURED',
				);
			}
			$baseUrl = $cloudEndpointProvider->getCloudUrl();
		}
		elseif (str_starts_with($selectedTarget, 'pairing:'))
		{
			$iss = substr($selectedTarget, strlen('pairing:'));
			$found = null;
			foreach ($pairings as $p)
			{
				if ($p->iss === $iss)
				{
					$found = $p;
					break;
				}
			}
			if ($found === null)
			{
				throw new RegistrationFailedException(
					Loc::getMessage('VIBECODECONNECTOR_DIAG_ERR_PAIRING_NOT_FOUND_MSG'),
					'PAIRING_NOT_FOUND',
				);
			}
			$baseUrl = $found->endpointUrl;
		}
		else
		{
			throw new RegistrationFailedException(
				Loc::getMessage('VIBECODECONNECTOR_DIAG_ERR_TARGET_REQUIRED_MSG'),
				'TARGET_REQUIRED',
			);
		}

		$selectedBaseUrl = $baseUrl;
		$sender = new StatusUrlSender(new EndpointResolver($baseUrl));
		$result = $sender->issueStatusUrl((int)$USER->getId());
		$statusUrl = (string)$result->value;
		$statusExpiresAt = $result->expiresAt;
	}
	catch (RegistrationFailedException $e)
	{
		$statusError = $e->getMessage();
		$statusErrorCode = $e->getErrorCode();
	}
	catch (\Throwable $e)
	{
		$statusError = $e->getMessage();
	}
}

$errorMessage = null;
if ($statusError !== null)
{
	$errorMessageKey = match ($statusErrorCode) {
		'CONNECTION_CHECK_FAILED' => 'VIBECODECONNECTOR_DIAG_ERR_CONNECTION_CHECK_FAILED',
		'SIGNATURE_INVALID', 'LICENSE_REJECTED' => 'VIBECODECONNECTOR_DIAG_ERR_LICENSE',
		'UPSTREAM_UNAVAILABLE', 'WRONG_SERVER_RESPONSE' => 'VIBECODECONNECTOR_DIAG_ERR_UPSTREAM',
		'INTERNAL_ERROR' => 'VIBECODECONNECTOR_DIAG_ERR_INTERNAL',
		'INVALID_RESPONSE' => 'VIBECODECONNECTOR_DIAG_ERR_INVALID_RESPONSE',
		'UNKNOWN_ACTION' => 'VIBECODECONNECTOR_DIAG_ERR_UNKNOWN_ACTION',
		'CLOUD_SHARED_NOT_CONFIGURED' => 'VIBECODECONNECTOR_DIAG_ERR_CLOUD_SHARED_NOT_CONFIGURED',
		'PAIRING_NOT_FOUND' => 'VIBECODECONNECTOR_DIAG_ERR_PAIRING_NOT_FOUND',
		'TARGET_REQUIRED' => 'VIBECODECONNECTOR_DIAG_ERR_TARGET_REQUIRED',
		default => 'VIBECODECONNECTOR_DIAG_ERR_GENERIC',
	};
	$errorMessage = Loc::getMessage($errorMessageKey, ['#MESSAGE#' => $statusError]);
}

$APPLICATION->SetTitle(Loc::getMessage('VIBECODECONNECTOR_DIAG_TITLE'));

$tabs = [
	[
		'DIV' => 'tab_verify',
		'TAB' => Loc::getMessage('VIBECODECONNECTOR_DIAG_TAB_VERIFY'),
		'TITLE' => Loc::getMessage('VIBECODECONNECTOR_DIAG_TAB_VERIFY_TITLE'),
	],
	[
		'DIV' => 'tab_state',
		'TAB' => Loc::getMessage('VIBECODECONNECTOR_DIAG_TAB_STATE'),
		'TITLE' => Loc::getMessage('VIBECODECONNECTOR_DIAG_TAB_STATE_TITLE'),
	],
];
$tabControl = new CAdminTabControl('tabControl', $tabs);

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php';

$eventLogUrl = static fn (string $auditTypeId): string => '/bitrix/admin/event_log.php'
	. '?lang=' . urlencode(LANGUAGE_ID)
	. '&set_filter=Y'
	. '&find_module_id=' . urlencode('vibecodeconnector')
	. '&find_audit_type_id=' . urlencode($auditTypeId);

$incomingLogUrl = $eventLogUrl(IncomingJwtLog::AUDIT_TYPE_ID);
$cloudSharedKeyLogUrl = $eventLogUrl(CloudSharedKeyLog::AUDIT_TYPE_ID);
?>
<form id="vbcc-diag-form" method="post" action="<?= htmlspecialcharsbx($APPLICATION->GetCurPage()) ?>?lang=<?= LANGUAGE_ID ?>">
	<?= bitrix_sessid_post() ?>

	<?php $tabControl->Begin(); ?>

	<?php /* =================== TAB: Verify ===================== */ ?>
	<?php $tabControl->BeginNextTab(); ?>

	<?php if ($errorMessage !== null): ?>
		<tr>
			<td colspan="2">
				<div class="adm-info-message-wrap adm-info-message-red">
					<div class="adm-info-message">
						<div class="adm-info-message-title"><?= htmlspecialcharsbx(Loc::getMessage('VIBECODECONNECTOR_DIAG_RESULT_FAIL')) ?></div>
						<?= htmlspecialcharsbx($errorMessage) ?>
						<?php if ($statusErrorCode !== null): ?>
							<div style="margin-top: 4px; font-family: monospace; font-size: 11px;">code: <?= htmlspecialcharsbx($statusErrorCode) ?></div>
						<?php endif; ?>
						<?php if ($selectedBaseUrl !== null): ?>
							<div style="font-family: monospace; font-size: 11px;">endpoint: <?= htmlspecialcharsbx($selectedBaseUrl) ?></div>
						<?php endif; ?>
					</div>
					<div class="adm-info-message-icon"></div>
				</div>
			</td>
		</tr>
	<?php endif; ?>

	<?php if ($statusUrl !== null): ?>
		<tr>
			<td colspan="2">
				<div class="adm-info-message-wrap adm-info-message-green">
					<div class="adm-info-message">
						<div class="adm-info-message-title"><?= htmlspecialcharsbx(Loc::getMessage('VIBECODECONNECTOR_DIAG_RESULT_OK')) ?></div>
						<?php if ($statusExpiresAt !== null): ?>
							<?= Loc::getMessage('VIBECODECONNECTOR_DIAG_RESULT_EXPIRES_AT', [
								'#TIME#' => date('Y-m-d H:i:s', $statusExpiresAt),
							]) ?>
						<?php endif; ?>
					</div>
					<div class="adm-info-message-icon"></div>
				</div>
			</td>
		</tr>
	<?php endif; ?>

	<tr class="heading">
		<td colspan="2"><?= Loc::getMessage('VIBECODECONNECTOR_DIAG_HEADING_STEP1') ?></td>
	</tr>

	<?php if (!$hasAnyTarget): ?>
		<tr>
			<td colspan="2">
				<?=BeginNote()?>
				<?= Loc::getMessage('VIBECODECONNECTOR_DIAG_NO_TARGETS', [
					'#URL#' => '/bitrix/admin/settings.php?lang=' . LANGUAGE_ID . '&mid=' . urlencode($module_id),
				]) ?>
				<?=EndNote()?>
			</td>
		</tr>
	<?php else: ?>
		<?php if ($isCloudSharedAvailable): ?>
			<tr>
				<td style="width: 30%; vertical-align: top;">
					<label>
						<input type="radio" name="target" value="cloud_shared"
							<?= $selectedTarget === 'cloud_shared' ? 'checked' : '' ?>>
						<strong><?= Loc::getMessage('VIBECODECONNECTOR_DIAG_TARGET_CLOUD_SHARED') ?></strong>
						<?php if (!$isCloudSharedConfigured): ?>
							<br>
							<span style="color: #885d00; font-size: 11px; margin-left: 22px;">
								<?= Loc::getMessage('VIBECODECONNECTOR_DIAG_TARGET_CLOUD_SHARED_NO_KEY') ?>
							</span>
						<?php endif; ?>
					</label>
				</td>
				<td style="font-family: monospace; font-size: 12px; color: #666; vertical-align: top; padding-top: 4px;">
					<?= htmlspecialcharsbx($cloudEndpointProvider->getCloudUrl()) ?>
				</td>
			</tr>
		<?php endif; ?>
		<?php foreach ($pairings as $pairing):
			$value = 'pairing:' . $pairing->iss;
			$isExpired = $pairing->isExpired();
			$radioId = 'vbcc-target-' . md5($pairing->iss);
		?>
			<tr>
				<td style="width: 30%; vertical-align: top;">
					<label for="<?= htmlspecialcharsbx($radioId) ?>">
						<input type="radio" id="<?= htmlspecialcharsbx($radioId) ?>" name="target" value="<?= htmlspecialcharsbx($value) ?>"
							<?= $selectedTarget === $value ? 'checked' : '' ?>>
						<strong><?= Loc::getMessage('VIBECODECONNECTOR_DIAG_TARGET_PAIRING', [
							'#ISS#' => htmlspecialcharsbx($pairing->iss),
						]) ?></strong>
						<?php if ($isExpired): ?>
							<br>
							<span style="color: #c00; font-size: 11px; margin-left: 22px;">
								<?= Loc::getMessage('VIBECODECONNECTOR_DIAG_PAIRING_EXPIRED') ?>
							</span>
						<?php endif; ?>
					</label>
				</td>
				<td style="font-family: monospace; font-size: 12px; color: #666; vertical-align: top; padding-top: 4px;">
					<div>portal_id: <?= htmlspecialcharsbx($pairing->portalId) ?></div>
					<div>endpoint: <?= htmlspecialcharsbx($pairing->endpointUrl) ?></div>
					<div>
						<?= Loc::getMessage('VIBECODECONNECTOR_DIAG_PAIRING_EXPIRES_AT', [
							'#TIME#' => htmlspecialcharsbx(date('Y-m-d H:i:s', $pairing->expiresAt)),
						]) ?>
					</div>
				</td>
			</tr>
		<?php endforeach; ?>
	<?php endif; ?>

	<tr>
		<td colspan="2">
			<?=BeginNote()?><?= Loc::getMessage('VIBECODECONNECTOR_DIAG_STEP1_NOTE') ?><?=EndNote()?>
		</td>
	</tr>

	<?php if ($statusUrl !== null): ?>
		<tr class="heading">
			<td colspan="2"><?= Loc::getMessage('VIBECODECONNECTOR_DIAG_HEADING_RESULT') ?></td>
		</tr>
		<tr>
			<td colspan="2">
				<div style="font-family: monospace; font-size: 11px; color: #666; word-break: break-all; padding: 4px 0;">
					<?= htmlspecialcharsbx($statusUrl) ?>
				</div>
				<iframe src="<?= htmlspecialcharsbx($statusUrl) ?>" style="width: 100%; height: 600px; border: 1px solid #ccc;"></iframe>
			</td>
		</tr>
	<?php endif; ?>

	<?php /* =================== TAB: State ===================== */ ?>
	<?php $tabControl->BeginNextTab(); ?>

	<tr class="heading">
		<td colspan="2"><?= Loc::getMessage('VIBECODECONNECTOR_DIAG_HEADING_CHANNELS') ?></td>
	</tr>
	<tr>
		<td style="width: 30%;"><?= Loc::getMessage('VIBECODECONNECTOR_DIAG_BADGE_CLOUD_SHARED_LABEL') ?>:</td>
		<td>
			<?php if ($isCloudSharedConfigured): ?>
				<span style="color: #1ba81b;">✓ <?= Loc::getMessage('VIBECODECONNECTOR_DIAG_BADGE_CLOUD_SHARED_OK') ?></span>
				<span style="font-family: monospace; color: #666; font-size: 12px;"> (<?= htmlspecialcharsbx($cloudEndpointProvider->getCloudUrl()) ?>)</span>
			<?php elseif ($isCloudSharedAvailable): ?>
				<span style="color: #1ba81b;">✓ <?= Loc::getMessage('VIBECODECONNECTOR_DIAG_BADGE_CLOUD_SHARED_NO_KEY') ?></span>
				<span style="font-family: monospace; color: #666; font-size: 12px;"> (<?= htmlspecialcharsbx($cloudEndpointProvider->getCloudUrl()) ?>)</span>
			<?php else: ?>
				<span style="color: #885d00;"><?= Loc::getMessage('VIBECODECONNECTOR_DIAG_BADGE_CLOUD_SHARED_OFF') ?></span>
			<?php endif; ?>
		</td>
	</tr>
	<tr>
		<td><?= Loc::getMessage('VIBECODECONNECTOR_DIAG_BADGE_PAIRINGS_LABEL') ?>:</td>
		<td>
			<?= Loc::getMessage('VIBECODECONNECTOR_DIAG_BADGE_PAIRINGS', ['#COUNT#' => count($pairings)]) ?>
		</td>
	</tr>

	<?php if ($pairings): ?>
		<tr>
			<td colspan="2">
<?php
$sTableID = 'tbl_vbcc_diag_pairings';
$oSort = new CAdminSorting($sTableID, 'iss', 'asc');
$lAdmin = new CAdminList($sTableID, $oSort);

$lAdmin->AddHeaders([
	['id' => 'iss', 'content' => Loc::getMessage('VIBECODECONNECTOR_DIAG_COL_ISS'), 'default' => true],
	['id' => 'portal_id', 'content' => Loc::getMessage('VIBECODECONNECTOR_DIAG_COL_PORTAL_ID'), 'default' => true],
	['id' => 'endpoint', 'content' => Loc::getMessage('VIBECODECONNECTOR_DIAG_COL_ENDPOINT'), 'default' => true],
	['id' => 'expires_at', 'content' => Loc::getMessage('VIBECODECONNECTOR_DIAG_COL_EXPIRES_AT'), 'default' => true],
]);

foreach ($pairings as $pairing)
{
	$expiresCell = htmlspecialcharsbx(date('Y-m-d H:i:s', $pairing->expiresAt));
	if ($pairing->isExpired())
	{
		$expiresCell .= ' <span style="color:#c00;font-weight:bold;">'
			. htmlspecialcharsbx(Loc::getMessage('VIBECODECONNECTOR_DIAG_PAIRING_EXPIRED'))
			. '</span>';
	}

	$lAdmin->AddRow($pairing->iss, [
		'iss' => htmlspecialcharsbx($pairing->iss),
		'portal_id' => htmlspecialcharsbx($pairing->portalId),
		'endpoint' => htmlspecialcharsbx($pairing->endpointUrl),
		'expires_at' => $expiresCell,
	]);
}

$lAdmin->CheckListMode();
$lAdmin->DisplayList();
?>
			</td>
		</tr>
	<?php endif; ?>

	<tr class="heading">
		<td colspan="2"><?= Loc::getMessage('VIBECODECONNECTOR_DIAG_HEADING_LINKS') ?></td>
	</tr>
	<tr>
		<td colspan="2">
			<a href="<?= htmlspecialcharsbx($incomingLogUrl) ?>" target="_blank">
				<?= Loc::getMessage('VIBECODECONNECTOR_DIAG_LINK_INCOMING_LOG') ?>
			</a>
			&nbsp;|&nbsp;
			<a href="<?= htmlspecialcharsbx($cloudSharedKeyLogUrl) ?>" target="_blank">
				<?= Loc::getMessage('VIBECODECONNECTOR_DIAG_LINK_CLOUD_SHARED_KEY_LOG') ?>
			</a>
			&nbsp;|&nbsp;
			<a href="/bitrix/admin/vibecodeconnector_developer_keys.php?lang=<?= LANGUAGE_ID ?>">
				<?= Loc::getMessage('VIBECODECONNECTOR_DIAG_LINK_DEVELOPER_KEYS') ?>
			</a>
			&nbsp;|&nbsp;
			<a href="/bitrix/admin/settings.php?lang=<?= LANGUAGE_ID ?>&mid=<?= urlencode($module_id) ?>">
				<?= Loc::getMessage('VIBECODECONNECTOR_DIAG_LINK_SETTINGS') ?>
			</a>
		</td>
	</tr>

	<?php $tabControl->Buttons(); ?>

	<input
		type="submit"
		name="Verify"
		value="<?= htmlspecialcharsbx(Loc::getMessage('VIBECODECONNECTOR_DIAG_VERIFY_BUTTON')) ?>"
		class="adm-btn-save"
		<?= $hasAnyTarget && $moduleAccess >= 'W' ? '' : 'disabled' ?>
	>

	<?php $tabControl->End(); ?>
</form>

<?php
require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin.php';
