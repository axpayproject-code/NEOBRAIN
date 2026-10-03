import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
export interface Field {
  name: string;
  label: string;
  type?:
    | "text"
    | "number"
    | "email"
    | "date"
    | "datetime-local"
    | "textarea"
    | "checkbox"
    | "select"
    | "multiselect";
  options?: { value: string; label: string }[];
  optional?: boolean;
  value?: string;
}
export function ActionForm({
  fields,
  onSubmit,
  label = "Save",
  description,
}: {
  fields: Field[];
  onSubmit: (data: Record<string, any>) => Promise<void>;
  label?: string;
  description?: string;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        const data: Record<string, any> = {};
        for (const f of fields) {
          const value = fd.get(f.name);
          if (f.optional && !value) continue;
          data[f.name] =
            f.type === "multiselect"
              ? fd.getAll(f.name).map(String)
              : f.type === "checkbox"
                ? Boolean(value)
                : f.type === "number"
                  ? Number(value)
                  : f.type === "datetime-local"
                    ? new Date(String(value)).toISOString()
                    : String(value ?? "");
        }
        setPending(true);
        setError("");
        setMessage("");
        try {
          await onSubmit(data);
          setMessage("Saved successfully");
          form.reset();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Request failed");
        } finally {
          setPending(false);
        }
      }}
    >
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <label
            key={f.name}
            className={`block text-sm font-medium space-y-1.5 ${f.type === "textarea" || f.type === "checkbox" ? "sm:col-span-2" : ""}`}
          >
            <span>
              {f.label}
              {!f.optional && f.type !== "checkbox" && " *"}
            </span>
            {f.type === "textarea" ? (
              <Textarea
                name={f.name}
                required={!f.optional}
                defaultValue={f.value}
              />
            ) : f.type === "multiselect" ? (
              <select
                multiple
                name={f.name}
                required={!f.optional}
                className="w-full rounded-lg border bg-background px-3 py-2 min-h-32"
                aria-label={f.label}
              >
                {f.options?.map((o) => (
                  <option value={o.value} key={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : f.type === "select" ? (
              <select
                name={f.name}
                required={!f.optional}
                defaultValue={f.value ?? ""}
                className="w-full rounded-lg border bg-background px-3 py-2"
              >
                <option value="">Select…</option>
                {f.options?.map((o) => (
                  <option value={o.value} key={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : f.type === "checkbox" ? (
              <input
                aria-label={f.label}
                type="checkbox"
                name={f.name}
                required={!f.optional}
                className="ml-2 h-4 w-4 accent-primary"
              />
            ) : (
              <Input
                name={f.name}
                type={f.type ?? "text"}
                required={!f.optional}
                defaultValue={f.value}
                min={f.type === "number" ? 0 : undefined}
              />
            )}
          </label>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-primary">
          {message}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : label}
      </Button>
    </form>
  );
}
