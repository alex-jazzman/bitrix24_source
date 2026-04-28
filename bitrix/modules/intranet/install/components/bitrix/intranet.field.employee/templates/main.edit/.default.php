<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Security\Random;
use Bitrix\Main\Web\Json;

$itemStyle = static function (array $item): string {
	$style = '';
	if ($item['personalPhoto'])
	{
		$style = 'style="background-image:url(\'' . htmlspecialcharsbx($item['personalPhoto']) . '\'); background-size: 30px;"';
	}

	return $style;
};

/**
 * @var array $arResult
 */

$container = 'user-selector-container-' . Random::getString(16);

$fieldName = $arResult['userField']['FIELD_NAME'];
$selectedUserIds = $arResult['selectedUserIds'];
$isMultiple = $arResult['isMultiple'];

?>

<?php if($arResult['userField']['EDIT_IN_LIST'] === 'Y'): ?>
	<div class="<?= $container ?>"></div>
	<script>
		BX.ready(() => {
			void BX
				.Runtime
				.loadExtension('intranet.userfield.employee.employee-selector')
				.then(({ EmployeeSelector }) => {
					new EmployeeSelector({
						fieldName: '<?= CUtil::JSEscape($fieldName) ?>',
						container: document.querySelector('.<?= $container ?>'),
						isMultiple: <?= $isMultiple ? 'true' : 'false' ?>,
						preselectedUserIds: <?= Json::encode($selectedUserIds) ?>,
					});
				})
		});
	</script>
<?php elseif($arResult['value']): ?>
	<?php foreach($arResult['value'] as $item): ?>
		<span class="fields employee field-item" data-has-input="no">
			<a
				class="uf-employee-wrap"
				href="<?= $item['href'] ?>"
				target="_blank"
			>
				<span
					class="uf-employee-image"
					<?= ($itemStyle($item)) ?>
				>
				</span>
				<span class="uf-employee-data">
					<span class="uf-employee-name">
						<?= $item['name'] ?>
					</span>
					<span class="uf-employee-position">
						<?= $item['workPosition'] ?>
					</span>
				</span>
			</a>
		</span>
	<?php endforeach ?>
<?php else: ?>
	<span class="fields employee field-wrap" data-has-input="no">
		<?php if (is_array($arResult['value'])): ?>
			<?php foreach($arResult['value'] as $item): ?>
				<span class="fields employee field-item">
					<a
						class="uf-employee-wrap"
						href="<?= $item['href'] ?>"
						target="_blank"
					>
						<span
							class="uf-employee-image"
							<?= ($itemStyle($item)) ?>
						>
						</span>
						<span class="uf-employee-data">
							<span class="uf-employee-name">
								<?= $item['name'] ?>
							</span>
							<span class="uf-employee-position">
								<?= $item['workPosition'] ?>
							</span>
						</span>
					</a>
				</span>
			<?php endforeach ?>
		<?php else: ?>
			<?= Loc::getMessage('EMPLOYEE_FIELD_EMPTY') ?>
		<?php endif ?>
	</span>
<?php endif ?>
