import { useMemo, useState } from 'react';

interface SettingDropdownOption {
  label: string;
  value: number;
}

interface SettingDropdownProps {
  label: string;
  options: SettingDropdownOption[];
  selectedValue: number | undefined;
  onSelect: (value: number) => void;
  isLast?: boolean;
}

export default function SettingDropdown({
  label,
  options,
  selectedValue,
  onSelect,
  isLast,
}: SettingDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = useMemo(
    () => options.find((option) => option.value === selectedValue),
    [options, selectedValue],
  );
  const displayValue = selectedOption?.label ?? 'Select';

  return (
    <div className={`setting-dropdown ${isOpen ? 'setting-dropdown-open' : ''}`}>
      <button
        type="button"
        className={`setting-row setting-dropdown-trigger ${isLast && !isOpen ? 'setting-row-last' : ''}`}
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
      >
        <span>{label}</span>
        <span className="setting-dropdown-value-wrap">
          <span className="setting-dropdown-value">{displayValue}</span>
          <span className={`setting-dropdown-chevron ${isOpen ? 'setting-dropdown-chevron-open' : ''}`}>{'>'}</span>
        </span>
      </button>

      {isOpen && (
        <div className={`setting-dropdown-options ${isLast ? 'setting-row-last' : ''}`}>
          {options.map((option, index) => {
            const isSelected = option.value === selectedValue;
            return (
              <button
                type="button"
                key={`${label}-${option.value}`}
                className={`setting-dropdown-option ${index === options.length - 1 ? 'setting-dropdown-option-last' : ''}`}
                onClick={() => {
                  onSelect(option.value);
                  setIsOpen(false);
                }}
              >
                <span className={`setting-dropdown-option-text ${isSelected ? 'setting-dropdown-option-text-selected' : ''}`}>
                  {option.label}
                </span>
                {isSelected && <span className="setting-dropdown-check">[x]</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
