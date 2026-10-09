// App name and colours live here so they can be changed in one place.
// Daylight Book by day, Little Black Book by night: primary is deep green in
// light and gold in dark. The rest of the palette is in app/globals.css.
export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "King of Names",
  shortName: process.env.NEXT_PUBLIC_APP_NAME || "King of Names",
  description: "Remember everyone you meet.",
  accent: {
    light: "#1f4d3d",
    dark: "#c9a96a",
  },
  background: {
    light: "#f6f1e6",
    dark: "#0f1412",
  },
  // The Android splash can't follow the theme, so it uses the icon's deep green.
  splash: "#10221c",
} as const;
