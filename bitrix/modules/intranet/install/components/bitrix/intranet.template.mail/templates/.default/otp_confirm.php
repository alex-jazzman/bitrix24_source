<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;
?>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html lang="<?= $arParams['FIELDS']['HTML_LANGUAGE_ID'] ?>" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<meta name="viewport" content="width=device-width,initial-scale=1" />
	<meta name="x-apple-disable-message-reformatting" />
	<title></title>
	<!--[if mso]>
	<noscript>
		<xml>
			<o:OfficeDocumentSettings>
				<o:PixelsPerInch>96</o:PixelsPerInch>
			</o:OfficeDocumentSettings>
		</xml>
	</noscript>
	<![endif]-->
	<style type="text/css">
		/* ======================================= DESKTOP STYLES */
		* { -webkit-text-size-adjust: none; }
		body { margin: 0 !important; padding: 0 !important; }
		body,table,td,p,a { -ms-text-size-adjust: 100% !important; -webkit-text-size-adjust: 100% !important; }
		table, tr, td { border-spacing: 0 !important; mso-table-lspace: 0px !important; mso-table-rspace: 0pt !important; border-collapse: collapse !important; mso-line-height-rule:exactly !important;}
		.ExternalClass * { line-height: 100% }
		.mobile-link a, .mobile-link span { text-decoration:none !important; color: inherit !important; border: none !important; }
		pre {margin-top:0;margin-bottom:0;}
		/* ======================================= CUSTOM DESKTOP STYLES */

		/* ======================================= MOBILE STYLES */
		@media only screen and (max-width: 640px) {
			body { min-width: 320px; margin: 0; }
			.hide-m { display: none !important; }
			.show-for-small { display: block !important; overflow: visible !important; width: auto !important; max-height: inherit !important; }
			.no-float { float: none !important; }
			.block { display: block !important; }
			.resize-image { width: 100%; height: auto; }
			.center-image { display: block; margin: 0 auto; }

			.text-center { text-align: center !important; }
			.font-14 { font-size: 14px !important; line-height: 16px !important; }
			.font-16 { font-size: 16px !important; line-height: 18px !important; }
			.font-18 { font-size: 18px !important; line-height: 20px !important; }
			.font-20 { font-size: 20px !important; line-height: 22px !important; }
			.font-22 { font-size: 22px !important; line-height: 24px !important; }

			.pad-t-0 { padding-top: 0px !important; }
			.pad-r-0 { padding-right: 0px !important; }
			.pad-b-0 { padding-bottom: 0px !important; }
			.pad-l-0 { padding-left: 0px !important; }
			.pad-t-20 { padding-top: 20px !important; }
			.pad-r-20 { padding-right: 20px !important; }
			.pad-b-20 { padding-bottom: 20px !important; }
			.pad-l-20 { padding-left: 20px !important; }
			.pad-0 { padding-top: 0px !important; padding-right: 0px !important; padding-bottom: 0px !important; padding-left: 0px !important; }
			.pad-10 { padding-top: 10px !important; padding-right: 10px !important; padding-bottom: 10px !important; padding-left: 10px !important; }
			.pad-20 { padding-top: 20px !important; padding-right: 20px !important; padding-bottom: 20px !important; padding-left: 20px !important; }
			.pad-sides-0 { padding-right: 0px !important; padding-left: 0px !important; }
			.pad-sides-10 { padding-right: 10px !important; padding-left: 10px !important; }
			.pad-sides-20 { padding-right: 20px !important; padding-left: 20px !important; }
			.pad-sides-30 { padding-right: 30px !important; padding-left: 30px !important; }

			.w100 { width: 100% !important; min-width: initial !important; }
			.w90 { width: 90% !important; min-width: initial !important; }
			.w50 { width: 50% !important; min-width: initial !important; }
			/* ======================================= CUSTOM MOBILE STYLES */

		}
	</style>
</head>
<body>
<!-- WRAPPER -->
<table class="w100" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="width: 100%; height: auto; background-color: #e5f9ff; background-repeat: no-repeat; background-position: center; background-size: cover; font-family: sans-serif;">
	<tbody>
	<tr>
		<td align="center" class="pad-sides-20" style="padding-bottom: 14px;">
			<!-- CONTAINER -->
			<table class="w100" cellspacing="0" cellpadding="0" border="0" align="center" width="410" style="width: 410px; min-width: 410px; margin-top: 0; margin-right: auto; margin-bottom: 0; margin-left: auto;">
				<tbody>
				<tr>
					<td style="padding-bottom:24px;">
						&nbsp;
					</td>
				</tr>
				<!-- HEADER -->
				<tr>
					<td style="padding: 0 10px 25px;">
						<table class="w100" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="padding-bottom: 24px;width: 100%;">
							<tbody>
							<tr>
								<td align="left" style="">
									<img alt="Bitrix24" src="<?= $arResult['LOGO'] ?>" width="104" height="22" style="display:block;width: 104px;height: 22px;" />
								</td>
								<td align="right" style="">
										<span style="font-size: 13px;font-weight: 500;color: #0065a3;text-align: right;">
											<?=
											Loc::getMessage(
												'INTRANET_CONFIRM_USING_CODE_SLOGAN',
											)
											?>
										</span>
								</td>
							</tr>
							</tbody>
						</table>
					</td>
				</tr>
				<!-- /HEADER -->

				<!-- CONTENT -->
				<tr>
					<td align="center">
						<!-- CONTAINER -->
						<table class="w100" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" bgcolor="#ffffff" style="width: 100%; border-radius: 10px; background-color: #ffffff; margin-top: 0; margin-right: auto; margin-bottom: 0; margin-left: auto; border: 1px solid #e6e6e6; border-collapse: separate !important; border: 1px solid #e6e6e6;">
							<tbody>
							<tr>
								<td class="pad-sides-10" align="center" style="padding-top: 34px; padding-left: 43px; padding-right: 43px; padding-bottom: 10px;">

									<table class="w100" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="width: 100%; margin: 0 auto;">
										<tbody>
										<tr>
											<td align="left" style="">
												<div style="margin-bottom: 24px;">
													<div class="title" style="display: block;font-size: 20px;margin-bottom: 6px;font-weight: 600;color: #151515;">
														<?=
														Loc::getMessage(
															'INTRANET_CONFIRM_USING_CODE_TITLE',
														)
														?>
													</div>
													<div class="subtitle" style="display: block;font-weight: 400;font-size: 16px;color: #6a737f;">
														<?=
														Loc::getMessage(
															'INTRANET_CONFIRM_USING_CODE_INSTRUCTIONS',
														)
														?>
													</div>
												</div>
											</td>
										</tr>

										<tr>
											<td align="center" style="padding-bottom: 16px;">
												<div><!--[if mso]>
													<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" style="height:66px;v-text-anchor:middle;width:350px;text-transform: uppercase;" arcsize="18%" stroke="f" fillcolor="#bbed21">
														<w:anchorlock/>
														<center>
													<![endif]-->
													<div class="w100" style="background-color:#F5FCDE;border-radius:8px;color:#000000;display:inline-block;font-family:sans-serif;font-size:40px;font-weight:bold;line-height:1;text-align:center;text-decoration:none;width:350px;-webkit-text-size-adjust:none;text-transform: uppercase;letter-spacing: 6.4px; padding: 24px 0;">
														<?= $arParams['CODE'] ?>
													</div>
													<!--[if mso]>
													</center>
													</v:roundrect>
													<![endif]-->
												</div>
											</td>
										</tr>

										<tr>
											<td align="center" style="padding-bottom: 25px;">
												<div style="display:block;font-size: 13px;color:#959ca4;text-align: center;">
													<?=
													Loc::getMessage(
														'INTRANET_CONFIRM_USING_CODE_IGNORE_MAIL',
														[
															'[br]' => '<br>',
														],
													)
													?>
												</div>
											</td>
										</tr>
										</tbody>
									</table>

								</td>
							</tr>

							<!-- GRAY CONTAINER -->
							<tr id="gray-container">
								<td>
									<table class="w100" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="width: 100%; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px; margin-top: 0; margin-right: auto; margin-bottom: 0; margin-left: auto;">
										<tbody>
										<tr>
											<td>
												<table class="w100" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="width: 100%; background-color: #f5f7f8; margin-top: 0; margin-right: auto; margin-bottom: 0; margin-left: auto;border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;">
													<tbody>

													<tr style="">
														<td align="left" style="padding-left: 43px; padding-top: 28px; padding-bottom: 28px;">
															<div style="font-size: 14px;color:#959ca4;">
																<?=
																Loc::getMessage(
																	'INTRANET_CONFIRM_USING_CODE_YOUR_BACKUP_EMAIL',
																)
																?>
															</div>
														</td>
														<td align="left" style="padding-right: 43px; padding-top: 28px; padding-bottom: 28px;">
																	<span style="font-size: 14px;font-weight: 500;color:#525c69;text-decoration: none;">
																		<?= $arParams['FIELDS']['EMAIL'] ?>
																	</span>
														</td>
													</tr>
													</tbody>
												</table>
											</td>
										</tr>
										</tbody>
									</table>
								</td>
							</tr>
							<!-- /GRAY CONTAINER -->

							</tbody>
						</table>
						<!-- /CONTAINER -->
					</td>
				</tr>
				<!-- /CONTENT -->


				<!-- FOOTER -->
				<tr>
					<td align="center">
						<div style="padding-top:16px;padding-right: 16px;padding-left:16px">
							<a href="<?= $arResult['PERSONAL_DATA_POLICY_URL'] ?? '#' ?>" style="padding-bottom: 2px;font-size: 13px;color:#a8adb4;text-align: center; text-decoration: none; border-bottom: 1px dashed #a8adb4;">
								<?=
								Loc::getMessage(
									'INTRANET_CONFIRM_USING_CODE_PESONAL_DATA_POLICY',
								)
								?>
							</a>
						</div>
					</td>
				</tr>
				<!-- /FOOTER -->

				</tbody>
			</table>
			<!-- /CONTAINER -->
		</td>
	</tr>
	</tbody>
</table>
<!-- /WRAPPER -->
</body>
</html>
