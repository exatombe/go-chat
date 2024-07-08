import { cn } from "../../utils/cn";
import type { ButtonRootProps } from "@kobalte/core/button";
import { Button as ButtonPrimitive } from "@kobalte/core/button";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import type { ValidComponent } from "solid-js";
import { splitProps } from "solid-js";

export const buttonVariants = cva(
	"gochat-inline-flex gochat-items-center gochat-justify-center gochat-rounded-md gochat-text-sm gochat-font-medium gochat-transition-[color,background-color,box-shadow] focus-visible:gochat-outline-none focus-visible:gochat-ring-[1.5px] focus-visible:gochat-ring-ring disabled:gochat-pointer-events-none disabled:gochat-opacity-50",
	{
		variants: {
			variant: {
				default:
					"gochat-bg-primary gochat-text-primary-foreground gochat-shadow hover:gochat-bg-primary/90",
				destructive:
					"gochat-bg-destructive gochat-text-destructive-foreground gochat-shadow-sm hover:gochat-bg-destructive/90",
				outline:
					"gochat-border gochat-border-input gochat-bg-background gochat-shadow-sm hover:gochat-bg-accent hover:gochat-text-accent-foreground",
				secondary:
					"gochat-bg-secondary gochat-text-secondary-foreground gochat-shadow-sm hover:gochat-bg-secondary/80",
				ghost: "hover:gochat-bg-accent hover:gochat-text-accent-foreground",
				link: "gochat-text-primary gochat-underline-offset-4 hover:gochat-underline",
			},
			size: {
				default: "gochat-h-9 gochat-px-4 gochat-py-2",
				sm: "gochat-h-8 gochat-rounded-md gochat-px-3 gochat-text-xs",
				lg: "gochat-h-10 gochat-rounded-md gochat-px-8",
				icon: "gochat-h-9 gochat-w-9",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

type buttonProps<T extends ValidComponent = "button"> = ButtonRootProps<T> &
	VariantProps<typeof buttonVariants> & {
		class?: string;
	};

export const Button = <T extends ValidComponent = "button">(
	props: PolymorphicProps<T, buttonProps<T>>,
) => {
	const [local, rest] = splitProps(props as buttonProps, [
		"class",
		"variant",
		"size",
	]);

	return (
		<ButtonPrimitive
			class={cn(
				buttonVariants({
					size: local.size,
					variant: local.variant,
				}),
				local.class,
			)}
			{...rest}
		/>
	);
};
