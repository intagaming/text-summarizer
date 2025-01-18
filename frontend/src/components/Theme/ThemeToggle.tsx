import { Switch } from "@/components/ui/switch";
import { Moon, Sun } from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";

export const ThemeToggle = () => {
  const { theme, setTheme } = useSettingsStore();

  return (
    <div className="flex items-center gap-2">
      <Sun className="h-4 w-4" />
      <Switch
        checked={theme === "dark"}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Toggle theme"
      />
      <Moon className="h-4 w-4" />
    </div>
  );
};