import { cn } from "../../utils/cn";
import type {
	ImageFallbackProps,
	ImageImgProps,
	ImageRootProps,
} from "@kobalte/core/image";
import { Image as ImagePrimitive } from "@kobalte/core/image";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";
import { splitProps } from "solid-js";

type imageRootProps<T extends ValidComponent = "span"> = ImageRootProps<T> & {
	class?: string;
};

export const ImageRoot = <T extends ValidComponent = "span">(
	props: PolymorphicProps<T, imageRootProps<T>>,
) => {
	const [local, rest] = splitProps(props as imageRootProps, ["class"]);

	return (
		<ImagePrimitive
			class={cn(
				"gochat-relative gochat-flex gochat-h-10 gochat-w-10 gochat-shrink-0 gochat-overflow-hidden gochat-rounded-full",
				local.class,
			)}
			{...rest}
		/>
	);
};

type imageProps<T extends ValidComponent = "img"> = ImageImgProps<T> & {
	class?: string;
};

export const Image = <T extends ValidComponent = "img">(
	props: PolymorphicProps<T, imageProps<T>>,
) => {
	const [local, rest] = splitProps(props as imageProps, ["class"]);

	return (
		<ImagePrimitive.Img
			class={cn("gochat-aspect-square gochat-h-full gochat-w-full", local.class)}
			{...rest}
		/>
	);
};

type imageFallbackProps<T extends ValidComponent = "span"> =
	ImageFallbackProps<T> & {
		class?: string;
	};

export const ImageFallback = <T extends ValidComponent = "span">(
	props: PolymorphicProps<T, imageFallbackProps<T>>,
) => {
	const [local, rest] = splitProps(props as imageFallbackProps, ["class"]);

	return (
		<ImagePrimitive.Fallback
			class={cn(
				"gochat-flex gochat-h-full gochat-w-full gochat-items-center gochat-justify-center gochat-rounded-full gochat-bg-muted",
				local.class,
			)}
			{...rest}
		/>
	);
};
