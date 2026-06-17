import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CityInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  suggestions?: string[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  listId?: string;
};

export function CityInput({
  id,
  value,
  onChange,
  suggestions = [],
  placeholder = "Ex. Lomé, Kara, Sokodé…",
  required,
  className,
  listId = "villes-suggestions",
}: CityInputProps) {
  return (
    <>
      <Input
        id={id}
        list={suggestions.length > 0 ? listId : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete="address-level2"
        className={cn(className)}
      />
      {suggestions.length > 0 && (
        <datalist id={listId}>
          {suggestions.map((v) => (
            <option key={v} value={v} />
          ))}
        </datalist>
      )}
    </>
  );
}
