import { LanguageName } from "../lib/country";
import { Locale } from "../lib/locale";
import { English } from "./messages/en-CA";

export const LOCALES = {
  English: English,
};

export const langNameMap: Record<Locale, LanguageName> = {
  "en-CA": "NAME_EN",
};
