import { Search, X } from "lucide-react";
import type { InputHTMLAttributes, Ref } from "react";

type SearchFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className" | "id" | "type"
> & {
  clearLabel?: string;
  inputId: string;
  inputRef?: Ref<HTMLInputElement>;
  label: string;
  labelClassName?: string;
  onClear?: () => void;
  showClear?: boolean;
  submitLabel?: string;
};

export function SearchField({
  clearLabel = "Suchanfrage löschen",
  inputId,
  inputRef,
  label,
  labelClassName = "sr-only",
  onClear,
  showClear = false,
  submitLabel = "Suchen",
  ...inputProps
}: SearchFieldProps) {
  return (
    <>
      <label
        id={`${inputId}-label`}
        htmlFor={inputId}
        className={labelClassName}
      >
        {label}
      </label>
      <div
        className={`search-field${onClear && showClear ? " search-field--clearable" : ""}`}
      >
        <Search aria-hidden="true" className="search-field__icon" />
        <input
          {...inputProps}
          ref={inputRef}
          id={inputId}
          type="search"
          className="search-field__input"
        />
        {onClear && showClear ? (
          <button
            type="button"
            onClick={onClear}
            aria-label={clearLabel}
            className="search-field__clear"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}
        <button type="submit" className="button-primary search-field__submit">
          {submitLabel}
        </button>
      </div>
    </>
  );
}
