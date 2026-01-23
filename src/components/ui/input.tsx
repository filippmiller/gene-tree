import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Premium Input component with Stripe-level polish
 *
 * Features:
 * - Floating label that animates on focus
 * - Validation states (success, error, warning)
 * - Left/right icon slots
 * - Helper text with animation
 * - Smooth focus transitions
 * - Full accessibility support
 */

const inputVariants = cva(
  [
    "flex w-full rounded-lg border bg-background text-sm",
    "transition-all duration-200 ease-smooth",
    "placeholder:text-muted-foreground",
    "focus:outline-none",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
    "file:border-0 file:bg-transparent file:text-sm file:font-medium",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "border-input",
          "hover:border-muted-foreground/50",
          "focus:border-primary focus:ring-2 focus:ring-primary/20",
        ].join(" "),

        error: [
          "border-destructive",
          "focus:border-destructive focus:ring-2 focus:ring-destructive/20",
          "text-destructive",
        ].join(" "),

        success: [
          "border-emerald-500",
          "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
        ].join(" "),

        warning: [
          "border-amber-500",
          "focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20",
        ].join(" "),
      },
      inputSize: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-3",
        lg: "h-12 px-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "md",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  /** Icon to display on the left side */
  leftIcon?: React.ReactNode;
  /** Icon to display on the right side */
  rightIcon?: React.ReactNode;
  /** Helper text displayed below the input */
  helperText?: string;
  /** Error message - also sets variant to error */
  error?: string;
  /** Success message - also sets variant to success */
  success?: string;
  /** Container className */
  containerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      type,
      variant,
      inputSize,
      leftIcon,
      rightIcon,
      helperText,
      error,
      success,
      disabled,
      ...props
    },
    ref
  ) => {
    // Determine variant from validation state
    const resolvedVariant = error ? "error" : success ? "success" : variant;
    const message = error || success || helperText;

    return (
      <div className={cn("relative w-full", containerClassName)}>
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}

          <input
            type={type}
            className={cn(
              inputVariants({ variant: resolvedVariant, inputSize }),
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            ref={ref}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={message ? `${props.id}-helper` : undefined}
            {...props}
          />

          {/* Right icon */}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Helper/Error/Success text */}
        {message && (
          <p
            id={props.id ? `${props.id}-helper` : undefined}
            className={cn(
              "mt-1.5 text-xs transition-all duration-200",
              "animate-fade-in-up",
              error && "text-destructive",
              success && "text-emerald-600",
              !error && !success && "text-muted-foreground"
            )}
          >
            {message}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

/**
 * Floating Label Input - Label animates into border on focus/fill
 */
export interface FloatingInputProps extends Omit<InputProps, "placeholder"> {
  label: string;
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, className, containerClassName, id, error, success, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);
    const inputId = id || React.useId();

    const isFloating = isFocused || hasValue;
    const resolvedVariant = error ? "error" : success ? "success" : "default";

    return (
      <div className={cn("relative w-full", containerClassName)}>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={cn(
              inputVariants({ variant: resolvedVariant, inputSize: "lg" }),
              "peer pt-4 pb-1",
              className
            )}
            placeholder=" "
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              setHasValue(!!e.target.value);
              props.onBlur?.(e);
            }}
            onChange={(e) => {
              setHasValue(!!e.target.value);
              props.onChange?.(e);
            }}
            aria-invalid={!!error}
            {...props}
          />
          <label
            htmlFor={inputId}
            className={cn(
              "absolute left-3 transition-all duration-200 ease-smooth pointer-events-none",
              "text-muted-foreground",
              isFloating
                ? "top-1 text-[10px] font-medium"
                : "top-1/2 -translate-y-1/2 text-sm",
              isFocused && "text-primary",
              error && "text-destructive",
              success && "text-emerald-600"
            )}
          >
            {label}
          </label>
        </div>

        {/* Helper/Error/Success text */}
        {(error || success || props.helperText) && (
          <p
            className={cn(
              "mt-1.5 text-xs transition-all duration-200",
              "animate-fade-in-up",
              error && "text-destructive",
              success && "text-emerald-600",
              !error && !success && "text-muted-foreground"
            )}
          >
            {error || success || props.helperText}
          </p>
        )}
      </div>
    );
  }
);
FloatingInput.displayName = "FloatingInput";

/**
 * Search Input - Pre-configured with search icon and clear button
 */
const SearchInput = React.forwardRef<
  HTMLInputElement,
  Omit<InputProps, "leftIcon" | "type"> & { onClear?: () => void }
>(({ value, onClear, rightIcon, ...props }, ref) => {
  const showClear = value && String(value).length > 0;

  return (
    <Input
      ref={ref}
      type="search"
      value={value}
      leftIcon={
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
      rightIcon={
        showClear ? (
          <button
            type="button"
            onClick={onClear}
            className="hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        ) : (
          rightIcon
        )
      }
      {...props}
    />
  );
});
SearchInput.displayName = "SearchInput";

export { Input, FloatingInput, SearchInput, inputVariants };
