declare global
{
	type MarkMenuTarget = {
		current: TargetRef | null;
	};

	type ApproveButtonProps = {
		state: MarkStateValue;
		onChange?: (nextState: MarkStateValue) => void;
		userId: number;
		size?: number;
		testId?: string;
		markMenuTarget?: MarkMenuTarget;
	};
}

export {};
