export type ShowToastParams = {
	message: string,
	position?: ToastPosition,
	offset?: number,
	backgroundColor?: string,
	backgroundOpacity?: number,
	svg?: string,
	icon?: object,
	buttonText?: string,
	buttonTextColor?: string,
	time?: number,
	shouldCloseOnTap?: boolean,
	onTap?: () => void,
	onButtonTap?: () => void,
	onTimerOver?: () => void,
}

export type ShowNotifierParams = {
	title?: string,
	message?: string,
	imageUrl?: string,
	time?: number,
	backgroundColor?: string,
	code?: string,
	data?: object,
}

export enum ToastPosition {
	top = 'top',
	bottom = 'bottom',
}
