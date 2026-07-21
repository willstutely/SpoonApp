// Blocking inline script: applies the saved theme before first paint so
// there's no flash of the wrong theme. Dark is the default per SPEC.md
// Design Principles ("dark mode default, light mode available").
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("spoon-theme");
    var theme = stored === "light" ? "light" : "dark";
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(theme);
  } catch (e) {
    document.documentElement.classList.add("dark");
  }
})();
`;

export function ThemeInit() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
}
