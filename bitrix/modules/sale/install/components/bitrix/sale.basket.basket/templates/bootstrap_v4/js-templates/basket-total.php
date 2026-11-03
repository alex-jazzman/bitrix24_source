<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Main\Localization\Loc;

/**
 * @var array $arParams
 */
?>
<script id="basket-total-template" type="text/html">
	<div class="basket-checkout-container" data-entity="basket-checkout-aligner">
		<?
		if ($arParams['HIDE_COUPON'] !== 'Y')
		{
			?>
			<div class="basket-coupon-section">
				<div class="basket-coupon-block-field">
					<div class="basket-coupon-block-field-description">
						<?= Loc::getMessage('SBB_COUPON_ENTER_MSGVER_1') ?>
					</div>
					<div class="form">
						<div class="form-group" style="position: relative;">
							<input type="text" class="form-control"
								aria-label="<?=htmlspecialcharsbx(Loc::getMessage('SBB_COUPON_FIELD_ARIA'))?>"
								data-entity="basket-coupon-input">
							<span class=" basket-coupon-block-coupon-btn" aria-hidden="true"></span>
						</div>
					</div>

				</div>
			</div>
			<?
		}
		?>
		<div class="basket-checkout-section">
			<div class="basket-checkout-section-inner<?=(($arParams['HIDE_COUPON'] == 'Y') ? ' justify-content-between' : '')?>">
				<div class="basket-checkout-block basket-checkout-block-total">
					<div class="basket-checkout-block-total-inner">
						<div class="basket-checkout-block-total-title"><?= Loc::getMessage('SBB_TOTAL_MSGVER_1') ?></div>
						<div class="basket-checkout-block-total-description">
							{{#WEIGHT_FORMATED}}
								<?= Loc::getMessage('SBB_WEIGHT_MSGVER_1', ['#WEIGHT_FORMATED#' => '{{{WEIGHT_FORMATED}}}']) ?>
								{{#SHOW_VAT}}<br>{{/SHOW_VAT}}
							{{/WEIGHT_FORMATED}}
							{{#SHOW_VAT}}
								<?= Loc::getMessage('SBB_VAT_MSGVER_1', ['#VAT_SUM_FORMATED#' => '{{{VAT_SUM_FORMATED}}}']) ?>
							{{/SHOW_VAT}}
						</div>
					</div>
				</div>

				<div class="basket-checkout-block basket-checkout-block-total-price">
					<div class="basket-checkout-block-total-price-inner">
						{{#DISCOUNT_PRICE_FORMATED}}
							<div class="basket-coupon-block-total-price-old">
								{{{PRICE_WITHOUT_DISCOUNT_FORMATED}}}
							</div>
						{{/DISCOUNT_PRICE_FORMATED}}

						<div class="basket-coupon-block-total-price-current" data-entity="basket-total-price">
							{{{PRICE_FORMATED}}}
						</div>

						{{#DISCOUNT_PRICE_FORMATED}}
							<div class="basket-coupon-block-total-price-difference">
								<?= Loc::getMessage(
									'SBB_BASKET_ITEM_ECONOMY_MSGVER_1',
									[
										'#DISCOUNT_PRICE_FORMATED#' => '<span style="white-space: nowrap;">{{{DISCOUNT_PRICE_FORMATED}}}</span>',
									],
								) ?>
							</div>
						{{/DISCOUNT_PRICE_FORMATED}}
					</div>
				</div>

				<div class="basket-checkout-block basket-checkout-block-btn">
					<button class="btn btn-lg btn-primary basket-btn-checkout{{#DISABLE_CHECKOUT}} disabled{{/DISABLE_CHECKOUT}}"
						{{#DISABLE_CHECKOUT}}aria-disabled="true" aria-describedby="basket-checkout-disabled-reason"{{/DISABLE_CHECKOUT}}
						data-entity="basket-checkout-button">
						<?=Loc::getMessage('SBB_ORDER')?>
					</button>
					{{#DISABLE_CHECKOUT}}
						<span class="basket-visually-hidden" id="basket-checkout-disabled-reason">
							<?=Loc::getMessage(
								'SBB_CHECKOUT_DISABLED_ARIA',
								['#REASON#' => Loc::getMessage('SBB_CHECKOUT_DISABLED_REASON_ARIA')],
							)?>
						</span>
					{{/DISABLE_CHECKOUT}}
				</div>
			</div>
		</div>

		<?
		if ($arParams['HIDE_COUPON'] !== 'Y')
		{
		?>
			<div class="basket-coupon-alert-section">
				<div class="basket-coupon-alert-inner">
					{{#COUPON_LIST}}
					<div class="basket-coupon-alert text-{{CLASS}}">
						<span class="basket-coupon-text">
							<strong>{{COUPON}}</strong> - {{JS_CHECK_CODE}}
							{{#DISCOUNT_NAME}}({{DISCOUNT_NAME}}){{/DISCOUNT_NAME}}
						</span>
						<button type="button" class="close-link basket-btn-plain"
							aria-label="<?=htmlspecialcharsbx(Loc::getMessage('SBB_COUPON_DELETE_ARIA', ['#COUPON#' => '{{COUPON}}']))?>"
							data-entity="basket-coupon-delete"
							data-coupon="{{COUPON}}">
							<?=Loc::getMessage('SBB_DELETE')?>
						</button>
					</div>
					{{/COUPON_LIST}}
				</div>
			</div>
			<?
		}
		?>
	</div>
</script>
