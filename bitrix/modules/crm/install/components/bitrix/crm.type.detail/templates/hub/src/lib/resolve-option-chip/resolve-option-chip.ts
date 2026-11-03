// Which chip design stands for a selected sub-option and which for an unselected one.
//
// Values are the plain strings of ChipDesign (ui/install/js/ui/system/chip/src/const.js) rather than
// the constant itself: this module is unit-tested, and importing a value from ui.system.chip.vue
// crashes the template's test harness — the same gotcha the layout constants of this template already
// work around for icon names.
export const OptionChipDesign = Object.freeze({
	Selected: 'tinted',
	Unselected: 'outline-no-accent',
});

export function resolveOptionChipDesign(isChecked: boolean): string
{
	return isChecked ? OptionChipDesign.Selected : OptionChipDesign.Unselected;
}
