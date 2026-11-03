declare type ForwardResultViewProps = {
	result: ForwardOperationResult,
	onRetry?: () => Promise<ForwardOperationResult | null>,
};
