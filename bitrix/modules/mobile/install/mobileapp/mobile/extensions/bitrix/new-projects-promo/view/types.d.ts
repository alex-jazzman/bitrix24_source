type NewProjectsPromoProps = {
	onClose: () => void;
};

declare function NewProjectsPromo(
	props: NewProjectsPromoProps,
): LayoutComponent<Record<string, unknown>, Record<string, never>>;

export {
	NewProjectsPromo,
	NewProjectsPromoProps,
};
