import { CATEGORIES } from "../../../../shared/contract";
import type { MatchMessages } from "@/lib/i18n/messages/match";
import { CategoryIcon } from "../icons/icons";
import styles from "./category-picker.module.css";

interface CategoryPickerProps {
  label: string;
  labels: MatchMessages["categories"];
  onChange: (category: string) => void;
  value: string;
}

export function CategoryPicker({ label, labels, onChange, value }: CategoryPickerProps) {
  return (
    <fieldset className={styles.fieldset}>
      <legend>{label}</legend>
      <div className={styles.rail}>
        {CATEGORIES.map((category) => (
          <button
            aria-pressed={value === category}
            className={value === category ? styles.active : undefined}
            key={category}
            onClick={() => onChange(category)}
            type="button"
          >
            <CategoryIcon category={category} />
            <span>{labels[category]}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
