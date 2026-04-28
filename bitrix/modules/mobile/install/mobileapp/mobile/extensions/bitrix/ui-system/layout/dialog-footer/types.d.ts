interface BaseFooterProps
{
	testId: string;
	keyboardButton?: object | ((params: object) => object);
	backgroundColor?: object;
	isKeyboardShown?: boolean;
	style?: object;
}

interface DialogFooterProps extends BaseFooterProps
{
	safeArea?: boolean;
	onLayoutFooterHeight?: (params: { height: number; width: number }) => void;
	children?: Array<object | boolean | (() => object)>;
}

type BoxFooterProps = BaseFooterProps;

export { BoxFooterProps, DialogFooterProps };
