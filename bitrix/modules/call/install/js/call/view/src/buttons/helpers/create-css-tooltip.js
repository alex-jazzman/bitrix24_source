export const createCssTooltip = (options = {}) => {
	const {
		width: tooltipWidth = 'max-content',
		position: tooltipPosition = 'top',
		getText: getTooltipText = () => '',
	} = options;

	const hasTooltip = Object.keys(options).length > 0;
	const tooltipText = getTooltipText();
	const tooltipPositionClass = tooltipPosition === 'bottom' ? '-bottom' : '-top';
	const tooltipClass = `bx-videocall-tooltip ${tooltipPositionClass}`;
	const tooltipTextVarName = '--data-tooltip-text';

	return {
		hasTooltip,
		tooltipClass: hasTooltip ? tooltipClass : '',
		tooltipText,
		tooltipStyle: `--data-tooltip-width:${tooltipWidth}; ${tooltipTextVarName}:'${tooltipText}'`,
		getTooltipText,
		tooltipTextVarName,
	};
};
