import { useState, useEffect } from "react";
import az from "../locales/az";
import en from "../locales/en";

const LOCALES = { az, en };

export function useLang() {
  const [lang, setLang] = useState(localStorage.getItem("lang") || "az");

  useEffect(() => {
    const handler = () => setLang(localStorage.getItem("lang") || "az");
    window.addEventListener("lang_change", handler);
    return () => window.removeEventListener("lang_change", handler);
  }, []);

  const t = (key) => LOCALES[lang]?.[key] ?? LOCALES["az"][key] ?? key;

  return { lang, t };
}

export function setLang(lang) {
  localStorage.setItem("lang", lang);
  window.dispatchEvent(new Event("lang_change"));
}
