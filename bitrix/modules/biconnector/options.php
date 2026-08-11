<?php
/** @var CMain $APPLICATION */
/** @var CUser $USER */
/** @var array $biconnector_default_option */

use Bitrix\BIConnector\Integration\Superset\SelfHostedConnectionService;
use Bitrix\BIConnector\Superset\Logger\Logger;
use Bitrix\BIConnector\Superset\Selfhost\SupersetHostMode;
use Bitrix\Main\Application;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ModuleManager;

$module_id = 'biconnector';
$canRead = $canWrite = $USER->IsAdmin();
if ($canWrite || $canRead)
{
	IncludeModuleLangFile($_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/main/options.php');
	IncludeModuleLangFile(__FILE__);

	$allOptions = [
		['gds_deployment_id', Loc::getMessage('BIC_OPTIONS_GDS_DEPLOYMENT_ID'), ['text', '70']],
	];

	$isBoxed = !ModuleManager::isModuleInstalled('bitrix24');

	$settingsTabs = [
		[
			'DIV' => 'edit1',
			'TAB' => Loc::getMessage('MAIN_TAB_SET'),
			'TITLE' => Loc::getMessage('MAIN_TAB_TITLE_SET'),
		],
	];

	if ($isBoxed)
	{
		$settingsTabs[] = [
			'DIV' => 'edit_superset',
			'TAB' => Loc::getMessage('BIC_TAB_SUPERSET'),
			'TITLE' => Loc::getMessage('BIC_TAB_SUPERSET_TITLE'),
		];
	}

	$settingsTabs[] = [
		'DIV' => 'edit2',
		'TAB' => Loc::getMessage('MAIN_TAB_RIGHTS'),
		'TITLE' => Loc::getMessage('MAIN_TAB_TITLE_RIGHTS'),
	];

	$tabControl = new CAdminTabControl('tabControl', $settingsTabs);

	CModule::IncludeModule($module_id);

	$selfHostedConnectionService = new SelfHostedConnectionService();

	// AJAX: check superset version
	if (
		$isBoxed
		&& $_SERVER['REQUEST_METHOD'] === 'POST'
		&& isset($_REQUEST['action'])
		&& $_REQUEST['action'] === 'check_superset_version'
		&& $canWrite
		&& check_bitrix_sessid()
		&& Loader::includeModule('superset')
	)
	{
		$response = ['success' => false, 'version' => '', 'error' => ''];
		$version = $selfHostedConnectionService->getSupersetVersion(true);
		if ($version)
		{
			$response['success'] = true;
			$response['version'] = $version;
		}
		else
		{
			$response['error'] = Loc::getMessage('BIC_SUPERSET_VERSION_NO_SERVER');
		}

		header('Content-Type: application/json');
		echo \Bitrix\Main\Web\Json::encode($response);
		\CMain::FinalActions();
		die();
	}

	if (
		$_SERVER['REQUEST_METHOD'] === 'POST'
		&& isset($_REQUEST['action'])
		&& $_REQUEST['action'] === 'regenerate_jwt_keys'
		&& $canWrite
		&& check_bitrix_sessid()
		&& Loader::includeModule('superset')
	)
	{
		$response = ['success' => false, 'publicKey' => '', 'error' => ''];
		$generateResult = $selfHostedConnectionService->generateJwtKeys();
		if ($generateResult->isSuccess())
		{
			$response['success'] = true;
		}
		else
		{
			$response['error'] = $generateResult->getError()->getMessage();
		}

		header('Content-Type: application/json');
		echo \Bitrix\Main\Web\Json::encode($response);
		\CMain::FinalActions();
		die();
	}

	$supersetModeError = '';

	if (
		$_SERVER['REQUEST_METHOD'] === 'POST'
		&& (
			(isset($_REQUEST['Update']) && $_REQUEST['Update'] !== '')
			|| (isset($_REQUEST['Apply']) && $_REQUEST['Apply'] !== '')
			|| (isset($_REQUEST['RestoreDefaults']) && $_REQUEST['RestoreDefaults'] !== '')
		)
		&& $canWrite
		&& check_bitrix_sessid()
	)
	{
		include __DIR__ . '/default_option.php';

		foreach ($allOptions as $option)
		{
			$name = $option[0];
			$val = trim($_REQUEST[$name], " \t\n\r");
			if ($option[2][0] === 'checkbox' && $val !== 'Y')
			{
				$val = 'N';
			}

			if ($val === $biconnector_default_option[$name])
			{
				Option::delete($module_id, ['name' => $name]);
			}
			else
			{
				Option::set($module_id, $name, $val);
			}
		}

		// Superset mode switching (boxed installations only)
		if ($isBoxed && isset($_REQUEST['superset_mode']))
		{
			$newMode = (string)$_REQUEST['superset_mode'];
			if (($_REQUEST['superset_mode_confirmed'] ?? 'N') === 'Y')
			{
				$switchResult = SupersetHostMode::handleSwitchMode($newMode);
				if (!$switchResult->isSuccess())
				{
					$supersetModeError = $switchResult->getError()->getMessage();
				}
			}
		}

		// Save superset connection settings (selfhosted mode)
		if (
			$isBoxed
			&& (isset($_REQUEST['superset_address']) || isset($_REQUEST['superset_admin_password']))
			&& ((string)$_REQUEST['superset_mode'] === SupersetHostMode::MODE_SELFHOSTED)
			&& Loader::includeModule('superset')
		)
		{
			$newSupersetAddress = rtrim((string)($_REQUEST['superset_address'] ?? ''), '/');
			$updateResult = $selfHostedConnectionService->updateConnectionSettings(
				$newSupersetAddress,
				(string)($_REQUEST['superset_admin_password'] ?? ''),
			);
			if (!$updateResult->isSuccess())
			{
				Logger::logErrors($updateResult->getErrors(), [
					'message' => 'Self-hosted Superset connection settings update failed',
					'superset_address' => $newSupersetAddress,
				]);
				$supersetModeError = Loc::getMessage('BIC_SUPERSET_CONNECTION_ERROR');
			}
			elseif (!empty($updateResult->getData()['host_changed']))
			{
				Application::getInstance()->getKernelSession()->set('BIC_SUPERSET_CONNECTION_SUCCESS', true);
			}
		}

		// Save export row limit
		if ($isBoxed && isset($_REQUEST['selfhost_row_limit']))
		{
			$limitManager = \Bitrix\BIConnector\LimitManager::getInstance();
			$limitManager->setLimit((int)$_REQUEST['selfhost_row_limit']);
		}

		ob_start();
		$Update = ($_REQUEST['Update'] ?? '') . ($_REQUEST['Apply'] ?? '');
		require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/admin/group_rights2.php';
		ob_end_clean();

		if ($supersetModeError === '')
		{
			if ($_REQUEST['back_url_settings'] !== '')
			{
				if (isset($_REQUEST['Apply']) && $_REQUEST['Apply'] !== '')
				{
					LocalRedirect($APPLICATION->GetCurPage() . '?mid=' . urlencode($module_id) . '&lang=' . urlencode(LANGUAGE_ID) . '&back_url_settings=' . urlencode($_REQUEST['back_url_settings']) . '&' . $tabControl->ActiveTabParam());
				}
				else
				{
					LocalRedirect($_REQUEST['back_url_settings']);
				}
			}
			else
			{
				LocalRedirect($APPLICATION->GetCurPage() . '?mid=' . urlencode($module_id) . '&lang=' . urlencode(LANGUAGE_ID) . '&' . $tabControl->ActiveTabParam());
			}
		}
	}

	?>
	<form method="post" action="<?= $APPLICATION->GetCurPage() ?>?mid=<?= urlencode($module_id) ?>&amp;lang=<?= LANGUAGE_ID ?>">
	<?php
	$tabControl->Begin();
	$tabControl->BeginNextTab();

	foreach ($allOptions as $option)
	{
		$val = Option::get($module_id, $option[0]);
		$type = $option[2];
		?>
		<tr>
			<td width="40%" nowrap <?= ($type[0] === 'textarea') ? 'class="adm-detail-valign-top"' : '' ?>>
				<label for="<?= htmlspecialcharsbx($option[0]) ?>"><?= $option[1] ?>:</label>
			<td width="60%">
				<?php if ($type[0] === 'checkbox'): ?>
					<input type="checkbox" name="<?= htmlspecialcharsbx($option[0]) ?>" id="<?= htmlspecialcharsbx($option[0]) ?>" value="Y"<?= ($val === 'Y') ? ' checked' : '' ?>>
				<?php elseif ($type[0] === 'text'): ?>
					<input type="text" size="<?= $type[1] ?>" maxlength="255" value="<?= htmlspecialcharsbx($val) ?>" name="<?= htmlspecialcharsbx($option[0]) ?>" id="<?= htmlspecialcharsbx($option[0]) ?>">
				<?php elseif ($type[0] === 'textarea'): ?>
					<textarea rows="<?= $type[1] ?>" cols="<?= $type[2] ?>" name="<?= htmlspecialcharsbx($option[0]) ?>" id="<?= htmlspecialcharsbx($option[0]) ?>"><?= htmlspecialcharsbx($val) ?></textarea>
				<?php elseif ($type[0] === 'selectbox'): ?>
					<select name="<?= htmlspecialcharsbx($option[0]) ?>">
					<?php foreach ($type[1] as $key => $value): ?>
						<option value="<?= $key ?>"<?= ($val == $key) ? ' selected' : '' ?>><?= htmlspecialcharsbx($value) ?></option>
					<?php endforeach; ?>
					</select>
				<?php endif?>
			</td>
		</tr>
	<?php
	}

	// Superset mode tab (boxed only)
	if ($isBoxed)
	{
		$tabControl->BeginNextTab();

		$currentMode = SupersetHostMode::getMode();
		$isSupersetInstalled = ModuleManager::isModuleInstalled('superset');
		$canSwitch = $isSupersetInstalled && SupersetHostMode::canSwitchMode();
		$disabled = $canSwitch ? '' : ' disabled';
		$articleUrl = \Bitrix\Main\Application::getInstance()->getLicense()->isCis()
			? 'https://dev.1c-bitrix.ru/learning/course/index.php?COURSE_ID=48&LESSON_ID=33308'
			: '' // TODO Add en article
		;

		$kernelSession = Application::getInstance()->getKernelSession();
		$supersetIsConnectSuccess = (bool)$kernelSession->get('BIC_SUPERSET_CONNECTION_SUCCESS');
		if ($supersetIsConnectSuccess)
		{
			$kernelSession->remove('BIC_SUPERSET_CONNECTION_SUCCESS');
		}

		if ($supersetModeError !== '')
		{
			?>
			<tr>
				<td colspan="2">
					<div class="adm-info-message-wrap adm-info-message-red">
						<div class="adm-info-message">
							<?= htmlspecialcharsbx($supersetModeError) ?>
							<div class="adm-info-message-icon"></div>
						</div>
					</div>
				</td>
			</tr>
			<?php
		}
		elseif ($supersetIsConnectSuccess)
		{
			?>
			<tr>
				<td colspan="2">
					<div class="adm-info-message-wrap adm-info-message-green">
						<div class="adm-info-message">
							<?= Loc::getMessage('BIC_SUPERSET_CONNECTION_SUCCESS') ?>
							<div class="adm-info-message-icon"></div>
						</div>
					</div>
				</td>
			</tr>
			<?php
		}

		if (!$isSupersetInstalled)
		{
			?>
			<tr>
				<td colspan="2">
					<div class="adm-info-message">
						<?= Loc::getMessage('BIC_SUPERSET_MODULE_NOT_INSTALLED') ?>
					</div>
				</td>
			</tr>
			<?php
		}
			?>
		<tr>
			<td width="40%"><?= Loc::getMessage('BIC_SUPERSET_MODE') ?>:</td>
			<td width="60%">
				<label>
					<input type="radio" name="superset_mode" value="<?= SupersetHostMode::MODE_CLOUD ?>"<?= ($currentMode === SupersetHostMode::MODE_CLOUD) ? ' checked' : '' ?><?= $disabled ?> onclick="bicOnModeChange(this, false)">
					<?= Loc::getMessage('BIC_SUPERSET_MODE_CLOUD') ?>
				</label>
				<br>
				<label>
					<input type="radio" name="superset_mode" value="<?= SupersetHostMode::MODE_SELFHOSTED ?>"<?= ($currentMode === SupersetHostMode::MODE_SELFHOSTED) ? ' checked' : '' ?><?= $disabled ?> onclick="bicOnModeChange(this, true)">
					<?= Loc::getMessage('BIC_SUPERSET_MODE_SELFHOSTED') ?>
				</label>
				<input type="hidden" name="superset_mode_confirmed" id="superset_mode_confirmed" value="N">
			</td>
		</tr>
		<?php
		$supersetAddress = '';
		$jwtPublicKey = '';
		if (Loader::includeModule('superset'))
		{
			$supersetAddress = $selfHostedConnectionService->getSupersetHost();
			$jwtPublicKey = $selfHostedConnectionService->readJwtPublicKey();
		}
		if ($supersetModeError !== '' && isset($_REQUEST['superset_address']))
		{
			$supersetAddress = rtrim((string)($_REQUEST['superset_address']), '/');
		}
		$selfhostedDisplay = ($currentMode !== SupersetHostMode::MODE_SELFHOSTED) ? 'display:none' : '';
		?>
		<tr class="superset-selfhosted-settings" style="<?= $selfhostedDisplay ?>">
			<td colspan="2">
				<div class="adm-info-message">
					<?= Loc::getMessage('BIC_SUPERSET_SELFHOSTED_DEPLOY_HINT', ['#ARTICLE_URL#' => $articleUrl]) ?>
				</div>
			</td>
		</tr>
		<tr class="superset-selfhosted-settings" style="<?= $selfhostedDisplay ?>">
			<td width="40%" nowrap>
				<label for="superset_address"><?= Loc::getMessage('BIC_SUPERSET_ADDRESS') ?>:</label>
			</td>
			<td width="60%">
				<input type="text" size="70" maxlength="255" value="<?= htmlspecialcharsbx($supersetAddress) ?>" name="superset_address" id="superset_address">
			</td>
		</tr>
		<tr class="superset-selfhosted-settings" style="<?= $selfhostedDisplay ?>">
			<td width="40%" nowrap>
				<label for="superset_admin_password"><?= Loc::getMessage('BIC_SUPERSET_ADMIN_PASSWORD') ?>:</label>
			</td>
			<td width="60%">
				<input type="password" size="40" maxlength="255" value="" name="superset_admin_password" id="superset_admin_password" autocomplete="off">
				<br><small><?= Loc::getMessage('BIC_SUPERSET_ADMIN_PASSWORD_HINT') ?></small>
			</td>
		</tr>
		<tr class="superset-selfhosted-settings" style="<?= $selfhostedDisplay ?>">
			<td width="40%" nowrap class="adm-detail-valign-top">
				<label><?= Loc::getMessage('BIC_SUPERSET_BI_TOKEN') ?>:</label>
			</td>
			<td width="60%">
				<input type="button" id="superset_regenerate_bi_token_btn" value="<?= htmlspecialcharsbx(Loc::getMessage('BIC_SUPERSET_BI_TOKEN_REGENERATE')) ?>" onclick="bicRegenerateBiToken()">
				<span id="superset_bi_token_regenerate_result"></span>
				<br><small><?= Loc::getMessage('BIC_SUPERSET_BI_TOKEN_HINT') ?></small>
			</td>
		</tr>
		<tr class="superset-selfhosted-settings" style="<?= $selfhostedDisplay ?>">
			<td width="40%" nowrap class="adm-detail-valign-top">
				<label for="superset_jwt_public_key"><?= Loc::getMessage('BIC_SUPERSET_JWT_PUBLIC_KEY') ?>:</label>
			</td>
			<td width="60%">
				<input type="button" id="superset_regenerate_jwt_btn" value="<?= htmlspecialcharsbx(Loc::getMessage('BIC_SUPERSET_JWT_REGENERATE')) ?>" onclick="bicRegenerateJwtKeys()">
				<span id="superset_jwt_regenerate_result"></span>
				<br><small><?= Loc::getMessage('BIC_SUPERSET_JWT_PUBLIC_KEY_HINT') ?></small>
			</td>
		</tr>
		<tr class="superset-selfhosted-settings" style="<?= $selfhostedDisplay ?>">
			<td width="40%" nowrap>
				<label for="selfhost_row_limit"><?= Loc::getMessage('BIC_OPTIONS_EXPORT_ROW_LIMIT') ?>:</label>
			</td>
			<td width="60%">
				<input type="text" size="20" maxlength="15" value="<?= htmlspecialcharsbx(Option::get($module_id, 'selfhost_row_limit', \Bitrix\BIConnector\LimitManagerBox::DEFAULT_SELFHOST_LIMIT)) ?>" name="selfhost_row_limit" id="selfhost_row_limit">
				<br><small><?= Loc::getMessage('BIC_OPTIONS_EXPORT_ROW_LIMIT_HINT') ?></small>
			</td>
		</tr>
		<tr class="superset-selfhosted-settings" style="<?= $selfhostedDisplay ?>">
			<td width="40%" nowrap>
				<?= Loc::getMessage('BIC_SUPERSET_VERSION') ?>:
			</td>
			<td width="60%">
				<input type="button" id="superset_check_version_btn" value="<?= htmlspecialcharsbx(Loc::getMessage('BIC_SUPERSET_CHECK_VERSION')) ?>" onclick="bicSupersetCheckVersion()">
				<span id="superset_version_result"></span>
			</td>
		</tr>
		<?php
	}

	if ($canWrite)
	{
		$tabControl->BeginNextTab();
		require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/admin/group_rights2.php';
	}

	?>
	<?php $tabControl->Buttons();?>
		<input <?= (!$canWrite) ? 'disabled' : '' ?> type="submit" name="Update" value="<?= Loc::getMessage('MAIN_SAVE') ?>" title="<?= Loc::getMessage('MAIN_OPT_SAVE_TITLE') ?>" class="adm-btn-save">
		<input <?= (!$canWrite) ? 'disabled' : '' ?> type="submit" name="Apply" value="<?= Loc::getMessage('MAIN_OPT_APPLY') ?>" title="<?= Loc::getMessage('MAIN_OPT_APPLY_TITLE') ?>">
		<?php if ($_REQUEST['back_url_settings'] !== ''): ?>
			<input <?= (!$canWrite) ? 'disabled' : '' ?> type="button" name="Cancel" value="<?= Loc::getMessage('MAIN_OPT_CANCEL') ?>" title="<?= Loc::getMessage('MAIN_OPT_CANCEL_TITLE') ?>" onclick="window.location='<?= htmlspecialcharsbx(CUtil::addslashes($_REQUEST['back_url_settings'])) ?>'">
			<input type="hidden" name="back_url_settings" value="<?= htmlspecialcharsbx($_REQUEST['back_url_settings']) ?>">
		<?php endif?>
		<?= bitrix_sessid_post() ?>
	<?php $tabControl->End();?>
	</form>
	<?php if ($isBoxed): ?>
	<script>
	var bicOriginalMode = '<?= CUtil::JSEscape($currentMode) ?>';

	function bicOnModeChange(radio, showSelfhosted)
	{
		if (radio.value !== bicOriginalMode)
		{
			if (!confirm('<?= CUtil::JSEscape(Loc::getMessage('BIC_SUPERSET_MODE_SWITCH_CONFIRM')) ?>'))
			{
				document.querySelector('input[name="superset_mode"][value="' + bicOriginalMode + '"]').checked = true;
				return;
			}
			document.getElementById('superset_mode_confirmed').value = 'Y';
		}
		bicToggleSupersetSettings(showSelfhosted);
	}

	function bicToggleSupersetSettings(show)
	{
		var rows = document.querySelectorAll('.superset-selfhosted-settings');
		for (var i = 0; i < rows.length; i++)
		{
			rows[i].style.display = show ? '' : 'none';
		}
	}

	function bicSupersetCheckVersion()
	{
		var btn = document.getElementById('superset_check_version_btn');
		var resultSpan = document.getElementById('superset_version_result');

		btn.disabled = true;
		resultSpan.innerText = '<?= CUtil::JSEscape(Loc::getMessage('BIC_SUPERSET_VERSION_LOADING')) ?>';
		resultSpan.style.color = '';

		var formData = new FormData();
		formData.append('action', 'check_superset_version');
		formData.append('sessid', BX.bitrix_sessid());

		fetch('<?= CUtil::JSEscape($APPLICATION->GetCurPage()) ?>?mid=<?= CUtil::JSEscape(urlencode($module_id)) ?>&lang=<?= CUtil::JSEscape(LANGUAGE_ID) ?>', {
			method: 'POST',
			body: formData
		})
		.then(function(response) { return response.json(); })
		.then(function(data) {
			btn.disabled = false;
			if (data.success)
			{
				resultSpan.style.color = 'green';
				resultSpan.innerText = data.version;
			}
			else
			{
				resultSpan.style.color = 'red';
				resultSpan.innerText = data.error || '<?= CUtil::JSEscape(Loc::getMessage('BIC_SUPERSET_VERSION_ERROR')) ?>';
			}
		})
		.catch(function() {
			btn.disabled = false;
			resultSpan.style.color = 'red';
			resultSpan.innerText = '<?= CUtil::JSEscape(Loc::getMessage('BIC_SUPERSET_VERSION_ERROR')) ?>';
		});
	}

	function bicRegenerateBiToken()
	{
		var btn = document.getElementById('superset_regenerate_bi_token_btn');
		var resultSpan = document.getElementById('superset_bi_token_regenerate_result');

		btn.disabled = true;
		resultSpan.innerText = '<?= CUtil::JSEscape(Loc::getMessage('BIC_SUPERSET_BI_TOKEN_REGENERATE_LOADING')) ?>';
		resultSpan.style.color = '';

		BX.ajax.runAction('biconnector.key.changeSupersetKey')
			.then(function() {
				btn.disabled = false;
				resultSpan.style.color = 'green';
				resultSpan.innerText = '<?= CUtil::JSEscape(Loc::getMessage('BIC_SUPERSET_BI_TOKEN_REGENERATE_SUCCESS')) ?>';
			})
			.catch(function() {
				btn.disabled = false;
				resultSpan.style.color = 'red';
				resultSpan.innerText = '<?= CUtil::JSEscape(Loc::getMessage('BIC_SUPERSET_BI_TOKEN_REGENERATE_ERROR')) ?>';
			});
	}

	function bicRegenerateJwtKeys()
	{
		var btn = document.getElementById('superset_regenerate_jwt_btn');
		var resultSpan = document.getElementById('superset_jwt_regenerate_result');

		btn.disabled = true;
		resultSpan.innerText = '<?= CUtil::JSEscape(Loc::getMessage('BIC_SUPERSET_JWT_REGENERATE_LOADING')) ?>';
		resultSpan.style.color = '';

		var formData = new FormData();
		formData.append('action', 'regenerate_jwt_keys');
		formData.append('sessid', BX.bitrix_sessid());

		fetch('<?= CUtil::JSEscape($APPLICATION->GetCurPage()) ?>?mid=<?= CUtil::JSEscape(urlencode($module_id)) ?>&lang=<?= CUtil::JSEscape(LANGUAGE_ID) ?>', {
			method: 'POST',
			body: formData
		})
		.then(function(response) { return response.json(); })
		.then(function(data) {
			btn.disabled = false;
			if (data.success)
			{
				resultSpan.style.color = 'green';
				resultSpan.innerText = '<?= CUtil::JSEscape(Loc::getMessage('BIC_SUPERSET_JWT_REGENERATE_SUCCESS')) ?>';
			}
			else
			{
				resultSpan.style.color = 'red';
				resultSpan.innerText = data.error || '<?= CUtil::JSEscape(Loc::getMessage('BIC_SUPERSET_JWT_REGENERATE_ERROR')) ?>';
			}
		})
		.catch(function() {
			btn.disabled = false;
			resultSpan.style.color = 'red';
			resultSpan.innerText = '<?= CUtil::JSEscape(Loc::getMessage('BIC_SUPERSET_JWT_REGENERATE_ERROR')) ?>';
		});
	}
	</script>
	<?php endif; ?>
	<?php
}
