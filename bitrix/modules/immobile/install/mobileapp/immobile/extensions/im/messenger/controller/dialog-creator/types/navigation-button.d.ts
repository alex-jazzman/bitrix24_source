import { TextStyle } from '../../../../../../../../../../mobile/dev/janative/types/style/element';

export type NavigationButtonProps = {
	text: string,
	subtitle?: string,
	onClick: () => any,
	withSeparator?: boolean,
	testId?: string,
	textStyle?: TextStyle,
	isNew?: boolean,
	isLocked?: boolean,
} & NavigationButtonIcon

type NavigationButtonIcon = IconPng | IconSvg

type IconPng = {
	iconSvg?: never;
	pngIcon: string;
}

type IconSvg = {
	iconSvg: string;
	pngIcon?: never;
}
