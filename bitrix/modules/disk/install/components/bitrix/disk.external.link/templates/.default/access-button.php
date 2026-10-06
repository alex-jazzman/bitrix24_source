<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

/**
 * Shared air look for the buttons of the access pages.
 * The mockup uses the air design of ui.buttons, but Button::setAirDesign() only works under the air
 * site template, and these pages are standalone documents. The look itself is pure CSS of ui.buttons
 * and needs no special markup, so the air class is set directly.
 * Included by external.link / error.page fragments from $_SERVER['DOCUMENT_ROOT'].
 *
 * Provides in the caller scope:
 * @var callable $applyAirStyle  fn(Button $button, string $style): void, $style is an AirButtonStyle
 *                               constant. The caller sets the button size itself.
 */

use Bitrix\UI\Buttons\Button;

$applyAirStyle = static function (Button $button, string $style): void {
	$button
		->setColor(null)
		->addClass('--air')
		->setStyle($style)
		->setNoCaps()
	;
};
