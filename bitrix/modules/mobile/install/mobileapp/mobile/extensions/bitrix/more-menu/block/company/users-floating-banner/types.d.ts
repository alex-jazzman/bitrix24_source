export interface UsersFloatingBannerProps {
	testId: string,
	layout: LayoutWidget,
	onCollapseStarted?: (params: { duration: number }) => void,
}

export interface CollapsedInviteButtonProps {
	testId: string,
	onClick: () => void,
}
