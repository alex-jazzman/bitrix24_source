declare type PackButtonProps = {
	enabled: boolean,
	text: string,
	onClick: () => void,
	ref?: (ref: PackButton) => void,
}

declare type PackButtonState = {
	isLoading: boolean,
	enabled: boolean,
}