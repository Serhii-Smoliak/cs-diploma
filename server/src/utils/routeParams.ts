export function getRouteParam(value: string | string[] | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return Array.isArray(value) ? value[0] : value;
}

export function requireRouteParam(
  value: string | string[] | undefined,
  name = 'id'
): string {
  const param = getRouteParam(value);
  if (!param) {
    throw new Error(`Missing route parameter: ${name}`);
  }

  return param;
}
