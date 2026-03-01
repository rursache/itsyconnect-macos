export function CharCount({ value, limit }: { value: string; limit?: number }) {
  const count = value?.length ?? 0;
  if (!limit) return null;
  const over = count > limit;

  return (
    <span
      className={`mt-[3px] text-xs tabular-nums ${over ? "font-medium text-destructive" : "text-muted-foreground"}`}
    >
      {count}/{limit}
    </span>
  );
}
