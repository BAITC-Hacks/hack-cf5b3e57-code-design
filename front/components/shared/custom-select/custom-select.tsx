"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from "react";

import styles from "./custom-select.module.css";

export interface CustomSelectOption {
  disabled?: boolean;
  label: string;
  value: string;
}

export interface CustomSelectChangeEvent {
  currentTarget: { name: string; value: string };
  target: { name: string; value: string };
}

interface CustomSelectProps {
  ariaLabel?: string;
  className?: string;
  defaultValue?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  onChange?: (event: CustomSelectChangeEvent) => void;
  options: readonly CustomSelectOption[];
  placeholder?: string;
  value?: string;
}

function firstEnabledIndex(options: readonly CustomSelectOption[]) {
  return options.findIndex((option) => !option.disabled);
}

function lastEnabledIndex(options: readonly CustomSelectOption[]) {
  for (let index = options.length - 1; index >= 0; index -= 1) {
    if (!options[index].disabled) return index;
  }

  return -1;
}

export function CustomSelect({
  ariaLabel,
  className,
  defaultValue = "",
  disabled = false,
  id,
  name = "",
  onChange,
  options,
  placeholder = "—",
  value,
}: CustomSelectProps) {
  const generatedId = useId().replaceAll(":", "");
  const selectId = id ?? `custom-select-${generatedId}`;
  const listboxId = `${selectId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"down" | "up">("down");
  const [activeIndex, setActiveIndex] = useState(-1);
  const selectedValue = value === undefined ? internalValue : value;
  const selectedIndex = options.findIndex(
    (option) => option.value === selectedValue,
  );
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;

    document
      .getElementById(`${selectId}-option-${activeIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open, selectId]);

  function initialActiveIndex() {
    if (selectedIndex >= 0 && !options[selectedIndex].disabled) {
      return selectedIndex;
    }

    return firstEnabledIndex(options);
  }

  function openMenu(preferredIndex = initialActiveIndex()) {
    if (disabled || options.length === 0) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setPlacement(spaceBelow < 260 && spaceAbove > spaceBelow ? "up" : "down");
    }
    setActiveIndex(preferredIndex);
    setOpen(true);
  }

  function findByPrefix(query: string) {
    const from = open && activeIndex >= 0 ? activeIndex : selectedIndex;
    for (let step = 1; step <= options.length; step += 1) {
      const index = (from + step + options.length) % options.length;
      const option = options[index];
      if (!option.disabled && option.label.toLocaleLowerCase().startsWith(query)) {
        return index;
      }
    }
    return -1;
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!open) return;
    const next = event.relatedTarget as Node | null;
    if (!next || !rootRef.current?.contains(next)) setOpen(false);
  }

  function closeMenu(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }

  function selectOption(index: number) {
    const option = options[index];
    if (!option || option.disabled) return;

    if (value === undefined) setInternalValue(option.value);
    if (option.value !== selectedValue) {
      const target = { name, value: option.value };
      onChange?.({ currentTarget: target, target });
    }
    closeMenu(true);
  }

  function moveActive(step: 1 | -1) {
    if (options.length === 0) return;

    let next = activeIndex >= 0 ? activeIndex : initialActiveIndex();
    for (let attempts = 0; attempts < options.length; attempts += 1) {
      next = (next + step + options.length) % options.length;
      if (!options[next].disabled) {
        setActiveIndex(next);
        return;
      }
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) openMenu();
        else moveActive(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!open) openMenu(lastEnabledIndex(options));
        else moveActive(-1);
        break;
      case "Home":
        event.preventDefault();
        if (!open) openMenu(firstEnabledIndex(options));
        else setActiveIndex(firstEnabledIndex(options));
        break;
      case "End":
        event.preventDefault();
        if (!open) openMenu(lastEnabledIndex(options));
        else setActiveIndex(lastEnabledIndex(options));
        break;
      case "PageDown":
        if (open) {
          event.preventDefault();
          setActiveIndex(
            Math.min(lastEnabledIndex(options), Math.max(activeIndex, 0) + 5),
          );
        }
        break;
      case "PageUp":
        if (open) {
          event.preventDefault();
          setActiveIndex(
            Math.max(firstEnabledIndex(options), Math.max(activeIndex, 0) - 5),
          );
        }
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (!open) openMenu();
        else if (activeIndex >= 0) selectOption(activeIndex);
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          closeMenu(true);
        }
        break;
      case "Tab":
        if (open) closeMenu();
        break;
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
          const query = event.key.toLocaleLowerCase();
          const match = findByPrefix(query);
          if (match >= 0) {
            event.preventDefault();
            if (!open) openMenu(match);
            else setActiveIndex(match);
          }
        }
    }
  }

  return (
    <div
      className={`${styles.root}${className ? ` ${className}` : ""}`}
      data-open={open || undefined}
      onBlur={handleBlur}
      ref={rootRef}
    >
      {name ? (
        <input
          name={name}
          onChange={() => undefined}
          type="hidden"
          value={selectedValue}
        />
      ) : null}
      <button
        aria-activedescendant={
          open && activeIndex >= 0
            ? `${selectId}-option-${activeIndex}`
            : undefined
        }
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={styles.trigger}
        disabled={disabled}
        id={selectId}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={handleKeyDown}
        ref={triggerRef}
        role="combobox"
        type="button"
      >
        <span className={selectedOption ? undefined : styles.placeholder}>
          {selectedOption?.label ?? placeholder}
        </span>
        <svg
          aria-hidden="true"
          className={open ? styles.chevronOpen : styles.chevron}
          viewBox="0 0 20 20"
        >
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>

      {open ? (
        <ul
          aria-labelledby={ariaLabel ? undefined : selectId}
          className={styles.menu}
          data-placement={placement}
          id={listboxId}
          onMouseDown={(event) => event.preventDefault()}
          role="listbox"
        >
          {options.map((option, index) => {
            const selected = option.value === selectedValue;
            return (
              <li
                aria-disabled={option.disabled || undefined}
                aria-selected={selected}
                className={styles.option}
                data-active={activeIndex === index || undefined}
                data-selected={selected || undefined}
                id={`${selectId}-option-${index}`}
                key={`${option.value}-${index}`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  selectOption(index);
                }}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => {
                  if (!option.disabled) setActiveIndex(index);
                }}
                role="option"
              >
                <span>{option.label}</span>
                {selected ? (
                  <svg aria-hidden="true" viewBox="0 0 20 20">
                    <path d="m4.5 10.5 3.4 3.4 7.6-7.6" />
                  </svg>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
