import { cn } from "../../utils/cn";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type {
	TextFieldDescriptionProps,
	TextFieldErrorMessageProps,
	TextFieldInputProps,
	TextFieldLabelProps,
	TextFieldRootProps,
} from "@kobalte/core/text-field";
import { TextField as TextFieldPrimitive } from "@kobalte/core/text-field";
import { cva } from "class-variance-authority";
import type { ValidComponent, VoidProps } from "solid-js";
import { splitProps } from "solid-js";

type textFieldProps<T extends ValidComponent = "div"> =
	TextFieldRootProps<T> & {
		class?: string;
	};

export const TextFieldRoot = <T extends ValidComponent = "div">(
	props: PolymorphicProps<T, textFieldProps<T>>,
) => {
	const [local, rest] = splitProps(props as textFieldProps, ["class"]);

	return <TextFieldPrimitive class={cn("gochat-space-y-1", local.class)} {...rest} />;
};

export const textfieldLabel = cva(
	"gochat-text-sm data-[disabled]:gochat-cursor-not-allowed data-[disabled]:gochat-opacity-70 gochat-font-medium",
	{
		variants: {
			label: {
				true: "data-[invalid]:gochat-text-destructive",
			},
			error: {
				true: "gochat-text-destructive gochat-text-xs",
			},
			description: {
				true: "gochat-font-normal gochat-text-muted-foreground",
			},
		},
		defaultVariants: {
			label: true,
		},
	},
);

type textFieldLabelProps<T extends ValidComponent = "label"> =
	TextFieldLabelProps<T> & {
		class?: string;
	};

export const TextFieldLabel = <T extends ValidComponent = "label">(
	props: PolymorphicProps<T, textFieldLabelProps<T>>,
) => {
	const [local, rest] = splitProps(props as textFieldLabelProps, ["class"]);

	return (
		<TextFieldPrimitive.Label
			class={cn(textfieldLabel(), local.class)}
			{...rest}
		/>
	);
};

type textFieldErrorMessageProps<T extends ValidComponent = "div"> =
	TextFieldErrorMessageProps<T> & {
		class?: string;
	};

export const TextFieldErrorMessage = <T extends ValidComponent = "div">(
	props: PolymorphicProps<T, textFieldErrorMessageProps<T>>,
) => {
	const [local, rest] = splitProps(props as textFieldErrorMessageProps, [
		"class",
	]);

	return (
		<TextFieldPrimitive.ErrorMessage
			class={cn(textfieldLabel({ error: true }), local.class)}
			{...rest}
		/>
	);
};

type textFieldDescriptionProps<T extends ValidComponent = "div"> =
	TextFieldDescriptionProps<T> & {
		class?: string;
	};

export const TextFieldDescription = <T extends ValidComponent = "div">(
	props: PolymorphicProps<T, textFieldDescriptionProps<T>>,
) => {
	const [local, rest] = splitProps(props as textFieldDescriptionProps, [
		"class",
	]);

	return (
		<TextFieldPrimitive.Description
			class={cn(
				textfieldLabel({ description: true, label: false }),
				local.class,
			)}
			{...rest}
		/>
	);
};

type textFieldInputProps<T extends ValidComponent = "input"> = VoidProps<
	TextFieldInputProps<T> & {
		class?: string;
	}
>;

export const TextField = <T extends ValidComponent = "input">(
	props: PolymorphicProps<T, textFieldInputProps<T>>,
) => {
	const [local, rest] = splitProps(props as textFieldInputProps, ["class"]);

	return (
		<TextFieldPrimitive.Input
			class={cn(
				"gochat-flex gochat-h-9 gochat-w-full gochat-rounded-md gochat-border gochat-border-input gochat-bg-transparent gochat-px-3 gochat-py-1 gochat-text-sm gochat-shadow-sm gochat-transition-shadow file:gochat-border-0 file:gochat-bg-transparent file:gochat-text-sm file:gochat-font-medium placeholder:gochat-text-muted-foreground focus-visible:gochat-outline-none focus-visible:gochat-ring-[1.5px] focus-visible:gochat-ring-ring disabled:gochat-cursor-not-allowed disabled:gochat-opacity-50",
				local.class,
			)}
			{...rest}
		/>
	);
};
