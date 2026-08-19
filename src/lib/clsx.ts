export type ClassValue = string | number | false | null | undefined | ClassValue[];

export function clsx(...args: ClassValue[]): string {
  const out: string[] = [];
  for (const a of args) {
    if (!a) continue;
    if (Array.isArray(a)) {
      const nested = clsx(...a);
      if (nested) out.push(nested);
    } else {
      out.push(String(a));
    }
  }
  return out.join(" ");
}
