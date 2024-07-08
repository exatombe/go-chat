import { cn } from "../../utils/cn";
import type {
	DialogContentProps,
	DialogDescriptionProps,
	DialogTitleProps,
} from "@kobalte/core/dialog";
import { Dialog as DialogPrimitive } from "@kobalte/core/dialog";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ComponentProps, ParentProps, ValidComponent } from "solid-js";
import { splitProps } from "solid-js";

export const Dialog = DialogPrimitive;
export const DialogTrigger = DialogPrimitive.Trigger;

type dialogContentProps<T extends ValidComponent = "div"> = ParentProps<
	DialogContentProps<T> & {
		class?: string;
	}
>;

export const DialogContent = <T extends ValidComponent = "div">(
	props: PolymorphicProps<T, dialogContentProps<T>>,
) => {
	const [local, rest] = splitProps(props as dialogContentProps, [
		"class",
		"children",
	]);

	return (
		<DialogPrimitive.Portal>
			<DialogPrimitive.Overlay
				class={cn(
					"gochat-fixed gochat-inset-0 gochat-z-50 gochat-bg-background/80 data-[expanded]:gochat-animate-in data-[closed]:gochat-animate-out data-[closed]:gochat-fade-out-0 data-[expanded]:gochat-fade-in-0",
				)}
				{...rest}
			/>
			<DialogPrimitive.Content
				class={cn(
					"gochat-fixed gochat-left-[50%] gochat-top-[50%] gochat-z-50 gochat-grid gochat-w-full gochat-max-w-lg gochat-translate-x-[-50%] gochat-translate-y-[-50%] gochat-gap-4 gochat-border gochat-bg-white gochat-p-6 gochat-shadow-lg data-[closed]:gochat-duration-200 data-[expanded]:gochat-duration-200 data-[expanded]:gochat-animate-in data-[closed]:gochat-animate-out data-[closed]:gochat-fade-out-0 data-[expanded]:gochat-fade-in-0 data-[closed]:gochat-zoom-out-95 data-[expanded]:gochat-zoom-in-95 data-[closed]:gochat-slide-out-to-left-1/2 data-[closed]:gochat-slide-out-to-top-[48%] data-[expanded]:gochat-slide-in-from-left-1/2 data-[expanded]:gochat-slide-in-from-top-[48%] sm:gochat-rounded-lg  md:gochat-w-full",
					local.class,
				)}
				{...rest}
			>
				{local.children}
				<DialogPrimitive.CloseButton class="gochat-absolute gochat-right-4 gochat-top-4 gochat-rounded-sm gochat-opacity-70 gochat-ring-offset-background gochat-transition-[opacity,box-shadow] hover:gochat-opacity-100 focus:gochat-outline-none focus:gochat-ring-[1.5px] focus:gochat-ring-ring focus:gochat-ring-offset-2 disabled:gochat-pointer-events-none">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						class="gochat-h-4 gochat-w-4"
					>
						<path
							fill="none"
							stroke="currentColor"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M18 6L6 18M6 6l12 12"
						/>
						<title>Close</title>
					</svg>
				</DialogPrimitive.CloseButton>
			</DialogPrimitive.Content>
		</DialogPrimitive.Portal>
	);
};

type dialogTitleProps<T extends ValidComponent = "h2"> = DialogTitleProps<T> & {
	class?: string;
};

export const DialogTitle = <T extends ValidComponent = "h2">(
	props: PolymorphicProps<T, dialogTitleProps<T>>,
) => {
	const [local, rest] = splitProps(props as dialogTitleProps, ["class"]);

	return (
		<DialogPrimitive.Title
			class={cn("gochat-text-lg gochat-font-semibold gochat-text-foreground", local.class)}
			{...rest}
		/>
	);
};

type dialogDescriptionProps<T extends ValidComponent = "p"> =
	DialogDescriptionProps<T> & {
		class?: string;
	};

export const DialogDescription = <T extends ValidComponent = "p">(
	props: PolymorphicProps<T, dialogDescriptionProps<T>>,
) => {
	const [local, rest] = splitProps(props as dialogDescriptionProps, ["class"]);

	return (
		<DialogPrimitive.Description
			class={cn("gochat-text-sm gochat-text-muted-foreground", local.class)}
			{...rest}
		/>
	);
};

export const DialogHeader = (props: ComponentProps<"div">) => {
	const [local, rest] = splitProps(props, ["class"]);

	return (
		<div
			class={cn(
				"gochat-flex gochat-flex-col gochat-space-y-2 gochat-text-center sm:gochat-text-left",
				local.class,
			)}
			{...rest}
		/>
	);
};

export const DialogFooter = (props: ComponentProps<"div">) => {
	const [local, rest] = splitProps(props, ["class"]);

	return (
		<div
			class={cn(
				"gochat-flex gochat-flex-col-reverse sm:gochat-flex-row sm:gochat-justify-end sm:gochat-space-x-2",
				local.class,
			)}
			{...rest}
		/>
	);
};
