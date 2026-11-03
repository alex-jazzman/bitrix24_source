// ElementStyle and ResizeMode are declared in dev/janative/types; an inline import keeps this file ambient,
// so the names below stay visible to JSDoc in .js — a top-level import would turn the file into a module
type SafeImageStyle = Partial<import('../../../../../../../../dev/janative/types/style/element').ElementStyle>;
type SafeImageResizeMode = import('../../../../../../../../dev/janative/types/style/element').ResizeMode;

// a url of its own or inline svg markup
type SafeImagePlaceholder = string | { content: string };

type SafeImageProps = {
	testId?: string;
	// the picture itself: a url in uri, inline markup in svg
	uri?: string;
	svg?: { content: string };
	resizeMode?: SafeImageResizeMode;
	// style dresses the picture and everything that stands in for it, so they occupy the same box;
	// wrapperStyle dresses the container that holds them
	style?: SafeImageStyle;
	wrapperStyle?: SafeImageStyle;
	// what stands in for the picture until it loads and after it fails
	placeholder?: SafeImagePlaceholder;
	renderPlaceholder?: (() => View) | View;
	// shimmer instead of the placeholder while the picture is loading
	withShimmer?: boolean;
	clickable?: boolean;
	onSuccess?: () => void;
	onFailure?: () => void;
	onClick?: () => void;
};
