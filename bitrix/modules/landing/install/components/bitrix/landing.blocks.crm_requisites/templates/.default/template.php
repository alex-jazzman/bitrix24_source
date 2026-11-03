<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Security\Random;

/** @var array $arParams */

// The heading of a table names it through aria-labelledby, so it needs an id, and a page may carry
// several blocks of this component - the check page carries three - where a constant would repeat.
// The id of the block itself never reaches the template: block.php hands over TYPE and REQUISITE and
// nothing else, so the unique part is drawn here.
$titleId = 'landing-crm-requisites-title-' . Random::getString(8);
?>

<?php
if ($arParams['TYPE'] === 'CONTACTS')
{
	\Bitrix\Main\UI\Extension::load([
		'ui.icon-set.main',
	]);

	$communications = $arResult['COMMUNICATIONS'] ?? null;
	$hideContactsData = $arResult['HIDE_CONTACTS_DATA'] ?? [];
	$isPrimaryIcon = $arResult['IS_PRIMARY_ICON'] ?? 'N';
	?>
	<div class="landing-crm-requisites__wrap">
		<h2 class="landing-crm-requisites__title"><?= Loc::getMessage('LNDNG_BLPHB_TPL_HEADER_CONTACTS')?></h2>

		<div class="landing-crm-requisites_inner">
			<?php if (!empty($communications['web']) && !in_array('web', $hideContactsData, true)):?>
				<?php
				if (!str_contains($communications['web'][0], 'http'))
				{
					$communications['web'][0] = 'https://' . $communications['web'][0];
				}
				// the substring check above passes javascript:...//http through, so the scheme allow-list decides
				$webUrl = \Bitrix\Landing\Sanitizer::sanitizeHrefScheme($communications['web'][0]);
				$webText = preg_replace('#^https?://(.*?)/?$#', '$1', $webUrl);
				?>
				<div class="landing-crm-requisites__box">
					<div class="landing-crm-requisites_icon">
						<?php if ($isPrimaryIcon === 'Y') :?>
							<div
								style="--ui-icon-set__icon-size: 30px; --ui-icon-set__icon-color: var(--primary);"
								class="ui-icon-set --expand"
								aria-hidden="true"
							></div>
						<?php else: ?>
							<div
								style="--ui-icon-set__icon-size: 30px; --ui-icon-set__icon-color: currentColor;"
								class="ui-icon-set --expand"
								aria-hidden="true"
							></div>
						<?php endif?>
					</div>
					<dl class="landing-crm-requisites_main">
						<dt class="landing-crm-requisites__name"><?= Loc::getMessage('LNDNG_BLPHB_TPL_CONTACTS_WEB')?>:</dt>
						<dd class="landing-crm-requisites__value">
							<a href="<?= htmlspecialcharsbx($webUrl)?>" target="_blank"><?= htmlspecialcharsbx($webText)?></a>
						</dd>
					</dl>
				</div>
			<?php endif?>

			<?php if (!empty($communications['phone']) && !in_array('phone', $hideContactsData, true)):?>
				<div class="landing-crm-requisites__box">
					<div class="landing-crm-requisites_icon">
						<?php if ($isPrimaryIcon === 'Y') :?>
							<div
								style="--ui-icon-set__icon-size: 30px; --ui-icon-set__icon-color: var(--primary);"
								class="ui-icon-set --telephony-handset-1"
								aria-hidden="true"
							></div>
						<?php else: ?>
							<div
								style="--ui-icon-set__icon-size: 30px; --ui-icon-set__icon-color: currentColor;"
								class="ui-icon-set --telephony-handset-1"
								aria-hidden="true"
							></div>
						<?php endif?>
					</div>
					<dl class="landing-crm-requisites_main">
						<dt class="landing-crm-requisites__name"><?= Loc::getMessage('LNDNG_BLPHB_TPL_CONTACTS_PHONE')?>:</dt>
						<dd class="landing-crm-requisites__value">
							<a href="tel:<?= htmlspecialcharsbx($communications['phone'][0])?>"><?= htmlspecialcharsbx($communications['phone'][0])?></a>
						</dd>
					</dl>
				</div>
			<?php endif?>

			<?php if (!empty($communications['email']) && !in_array('email', $hideContactsData, true)):?>
				<div class="landing-crm-requisites__box">
					<div class="landing-crm-requisites_icon">
						<?php if ($isPrimaryIcon === 'Y') :?>
							<div
								style="--ui-icon-set__icon-size: 30px; --ui-icon-set__icon-color: var(--primary);"
								class="ui-icon-set --mail"
								aria-hidden="true"
							></div>
						<?php else: ?>
							<div
								style="--ui-icon-set__icon-size: 30px; --ui-icon-set__icon-color: currentColor;"
								class="ui-icon-set --mail"
								aria-hidden="true"
							></div>
						<?php endif?>
					</div>
					<dl class="landing-crm-requisites_main">
						<dt class="landing-crm-requisites__name"><?= Loc::getMessage('LNDNG_BLPHB_TPL_CONTACTS_EMAIL')?>:</dt>
						<dd class="landing-crm-requisites__value">
							<a href="mailto:<?= htmlspecialcharsbx($communications['email'][0])?>"><?= htmlspecialcharsbx($communications['email'][0])?></a>
						</dd>
					</dl>
				</div>
			<?php endif?>
		</div>
	</div>
	<?php
}
?>

<?php
if ($arParams['TYPE'] === 'REQUISITES')
{
	$requisites = $arResult['REQUISITES'] ?? [];
	$hideRequisitesData = $arResult['HIDE_REQUISITES_DATA'] ?? [];
	?>
	<div class="landing-crm-requisites__wrap">
		<h2 class="landing-crm-requisites__title" id="<?= $titleId ?>">
			<?= Loc::getMessage('LNDNG_BLPHB_TPL_HEADER_REQUISITES')?>
		</h2>
		<table class="landing-crm-requisites__table" aria-labelledby="<?= $titleId ?>">
			<?php foreach($requisites as $requisite):?>
				<?php if (!in_array($requisite["name"], $hideRequisitesData, true)) :?>
					<tr class="landing-crm-requisites__table_row">
						<th scope="row" class="landing-crm-requisites__table_cell">
							<?= htmlspecialcharsbx($requisite['title'])?>:
						</th>
						<td class="landing-crm-requisites__table_cell"><?= htmlspecialcharsbx($requisite['textValue'])?></td>
					</tr>
				<?php endif?>
			<?php endforeach?>
		</table>
	</div>
	<?php
}
?>

<?php
if ($arParams['TYPE'] === 'BANK')
{
	$bankRequisites = $arResult['BANK_REQUISITES'] ?? [];
	$hideBankData = $arResult['HIDE_BANK_DATA'] ?? [];
	?>
	<div class="landing-crm-requisites__wrap">
		<h2 class="landing-crm-requisites__title" id="<?= $titleId ?>">
			<?= Loc::getMessage('LNDNG_BLPHB_TPL_HEADER_BANK_REQUISITES')?>
		</h2>
		<table class="landing-crm-requisites__table" aria-labelledby="<?= $titleId ?>">
			<?php foreach($bankRequisites as $bankRequisite):?>
				<?php if (!in_array($bankRequisite["name"], $hideBankData, true)) :?>
					<tr class="landing-crm-requisites__table_row">
						<th scope="row" class="landing-crm-requisites__table_cell">
							<?= htmlspecialcharsbx($bankRequisite['title'])?>:
						</th>
						<td class="landing-crm-requisites__table_cell"><?= htmlspecialcharsbx($bankRequisite['textValue'])?></td>
					</tr>
				<?php endif?>
			<?php endforeach?>
		</table>
	</div>
	<?php
}
?>
