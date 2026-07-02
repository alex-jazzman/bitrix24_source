<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)
{
	die();
}

/** @var CBitrixComponentTemplate $this */
/** @var array $arParams */
/** @var array $arResult */
/** @global CDatabase $DB */
/** @global CUser $USER */
/** @global CMain $APPLICATION */
/** @var boolean $is_unread */

use \Bitrix\Main\Localization\Loc;

if (!empty($arResult['Post']['IMPORTANT'])): ?>
	<div class="feed-imp-post-footer">
		<?php
		$postId = $arResult['Post']['ID'];
		$isRead = $arResult['Post']['IMPORTANT']['IS_READ'] === 'Y';
		$counter = $arResult['Post']['IMPORTANT']['COUNT'];
		$gender = $arResult['Post']['IMPORTANT']['USER']['PERSONAL_GENDER'];
		
		$counterId = 'blog-post-readers-counter-' . $postId;
		$counterStyle = $counter ? '' : implode(' ', ['display:none;']);
		
		$counterTitle = Loc::getMessagePlural(
			'BLOG_USERS_ALREADY_READ_NEW',
			$counter,
			[
				'#COUNT#' => $counter,
				'[count_wrap]' => '',
				'[/count_wrap]' => '',
			],
		);
	
		$counterOpenWrap = <<<HTML
			<span
				id="{$counterId}"
				class="feed-imp-post-footer-text"
				style="{$counterStyle}"
				title="{$counterTitle}"
			>
				<a class="feed-imp-post-user-link" href="javascript:void(0);">
		HTML;
	
		$counterCloseWrap = <<<HTML
				</a>
			</span>
		HTML;
		
		$highlightOpenWrap = <<<HTML
			<span class="feed-imp-btn-wrap">
				<span class="have-read-text-block">
					<span class="feed-imp-post-footer-message">
		HTML;
		
		$highlightCloseWrap = <<<HTML
					</span>
				</span>
			</span>
		HTML;
		
		$textHtml = Loc::getMessagePlural(
			'BLOG_ALREADY_READ_TEXT',
			$counter,
			[
				'#COUNT#' => '<span>' . $counter . '</span>',
				'[highlight_wrap]' => $highlightOpenWrap,
				'[/highlight_wrap]' => $highlightCloseWrap,
				'[count_wrap]' => $counterOpenWrap,
				'[/count_wrap]' => $counterCloseWrap,
			],
		);

		$urlToPostImportant = htmlspecialcharsbx($arResult['arUser']['urlToPostImportant']);
		
		$textHtmlAttr = htmlspecialcharsbx($textHtml, ENT_QUOTES);
		$btnOpenWrap = <<<HTML
			<span class="feed-imp-btn-wrap">
				<button
					class="ui-btn ui-btn-sm ui-btn-success ui-btn-round"
					id="blog-post-readers-btn-{$arResult['Post']['ID']}"
					bx-blog-post-id="{$arResult['Post']['ID']}"
					bx-url="{$urlToPostImportant}"
					data-text-html="{$textHtmlAttr}"
					onclick='new SBPImpPost(this); return false;'
				>
		HTML;
		
		$btnCloseWrap = <<<HTML
				</button>
			</span>
		HTML;
		
		$btnHtml = Loc::getMessagePlural(
			'BLOG_ALREADY_READ_BTN',
			$counter,
			[
				'#BUTTON_TEXT#' => Loc::getMessage(trim('BLOG_READ_' . $gender)),
				'#COUNT#' => '<span>' . $counter . '</span>',
				'[btn_wrap]' => $btnOpenWrap,
				'[/btn_wrap]' => $btnCloseWrap,
				'[count_wrap]' => $counterOpenWrap,
				'[/count_wrap]' => $counterCloseWrap,
			],
		);
	
		?>
		<span class="feed-imp-btn-main-wrap">
			<?= $isRead ? $textHtml : $btnHtml ?>
		</span>
	</div>
	<script>
		BX.ready(function(){
			const sbpimp<?=$postId?> =  new top.SBPImpPostCounter(
				document.getElementById('<?=$counterId?>'),
				<?=$postId?>,
				{
					'pathToUser' : '<?=CUtil::JSEscape($arParams['~PATH_TO_USER'])?>',
					'nameTemplate' : '<?=CUtil::JSEscape($arParams['NAME_TEMPLATE'])?>',
				}
			);
			
			<?php if (!$isRead): ?>
				BX.addCustomEvent(
					document.getElementById('blog-post-readers-btn-<?=$postId?>'),
					'onInit',
					BX.proxy(
						sbpimp<?=$postId?>.click,
						sbpimp<?=$postId?>,
					),
				);
			<?php endif; ?>
		});
	</script>
<?php endif?>
