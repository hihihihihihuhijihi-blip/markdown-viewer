/** 工具函数 */
type ClassValue = string | boolean | undefined | null | ClassValue[];

/** 合并 Tailwind CSS 类名 */
export function cn(...inputs: ClassValue[]) {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === "string") {
      classes.push(input);
    } else if (Array.isArray(input)) {
      classes.push(cn(...input));
    }
  }

  return classes.filter(Boolean).join(" ");
}
