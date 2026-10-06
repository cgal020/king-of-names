// App name and colours live here so the placeholders can be changed in a minute.
// The accent is the only brand colour; everything else is neutral.
export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "PeopleMap",
  shortName: process.env.NEXT_PUBLIC_APP_NAME || "PeopleMap",
  description: "Remember everyone you meet.",
  accent: {
    light: "#1f6f5c",
    dark: "#5fbfa4",
  },
  background: {
    light: "#fafaf9",
    dark: "#0c0c0b",
  },
} as const;
