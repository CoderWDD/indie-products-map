export const defaultSiteUrl = "https://indie-products-map.vercel.app";

export function createAbsoluteUrl(pathname: string, siteUrl: string | URL = defaultSiteUrl) {
  return new URL(pathname, siteUrl).toString();
}

export function normalizePathname(pathname: string) {
  if (pathname === "") {
    return "/";
  }

  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}
