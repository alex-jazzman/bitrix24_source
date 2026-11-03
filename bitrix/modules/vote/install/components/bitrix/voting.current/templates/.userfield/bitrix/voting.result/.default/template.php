<?if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
$uid = $arParams["UID"];

if (!empty($arResult["ERROR_MESSAGE"])):?>
<div class="vote-note-box vote-note-error">
	<div class="vote-note-box-text"><? ShowError($arResult["ERROR_MESSAGE"])?></div>
</div>
<?endif;

if (empty($arResult["VOTE"]) || empty($arResult["QUESTIONS"]) ):
	return true;
endif;

$isAnonymousVote = (int)($arResult["VOTE"]["ANONYMITY"] ?? 0) === \Bitrix\Vote\Vote\Anonymity::ANONYMOUSLY;
$votedSigner = new \Bitrix\Vote\Service\VotedContextSigner();
$voteId = (int)$arParams["VOTE_ID"];
$votedNameTemplate = (string)($arParams["~NAME_TEMPLATE"] ?? '');
$votedUrlTemplate = (string)($arParams["~PATH_TO_USER"] ?? '');

?>
	<ol class="bx-vote-question-list" id="vote-<?=$uid?>">
	<?foreach ($arResult["QUESTIONS"] as $arQuestion):?>
		<li id="question<?=$arQuestion["ID"]?>"<?if($arQuestion["REQUIRED"]=="Y"): ?> class="bx-vote-question-required"<? endif; ?>>
			<?if (!empty($arQuestion["IMAGE"]) && !empty($arQuestion["IMAGE"]["SRC"])): ?><div class="bx-vote-question-image"><img src="<?=$arQuestion["IMAGE"]["SRC"]?>" /></div><? endif; ?>
			<div class="bx-vote-question-title"><?=$arQuestion["QUESTION"]?></div>
				<table class="bx-vote-answer-list" cellspacing="0">
				<?foreach ($arQuestion["ANSWERS"] as $arAnswer):?>
				<tr id="answer<?=$arAnswer["ID"]?>" class="bx-vote-answer-item">
					<td>
						<div class="bx-vote-bar"><?
				?><span class="bx-vote-block-input-wrap"><?
					?><span class="bx-vote-block-input"></span><?
					?><label><?=$arAnswer["MESSAGE"]?></label><?
				?></span>
							<div class="bx-vote-result-bar" style="width:<?=$arAnswer["PERCENT"]?>%;"></div>
						</div>
					</td>
					<td>
						<span class="bx-vote-voted-users-wrap"><?
							$counterTestId = "vote-current-answer-counter-".$arAnswer["ID"];
							if ($isAnonymousVote):
								?><span class="bx-vote-voted-users" data-testid="<?=$counterTestId?>"><?=$arAnswer["COUNTER"]?></span><?
							else:
								$votedSign = $votedSigner->sign($voteId, (int)$arAnswer["ID"], $votedNameTemplate, $votedUrlTemplate);
								?><a href="javascript:void(0);" class="bx-vote-voted-users" data-sign="<?=htmlspecialcharsbx($votedSign)?>" rev="<?=$arAnswer["ID"]?>" data-testid="<?=$counterTestId?>"><?=$arAnswer["COUNTER"]?></a><?
							endif;
						?></span>
					</td>
					<td><span class="bx-vote-data-percent"><?=$arAnswer["PERCENT"]?>%</span></td>
				</tr>
				<?endforeach;?>
			</table>
		</li>
	<?endforeach;?>
	</ol>
<?
$this->__component->arParams["RETURN"] = array(
	"lastVote" => $arResult["LAST_VOTE"]);
?>