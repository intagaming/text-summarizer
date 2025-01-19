import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PROVIDERS } from "@/config/providers";
import { cn, debounce } from "@/lib/utils";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const { apiKey, setApiKey, provider, setProvider, model, setModel } =
    useSettingsStore();
  const [models, setModels] = useState<string[]>([]);
  const [openModelCombobox, setOpenModelCombobox] = useState(false);
  const [openProviderCombobox, setOpenProviderCombobox] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      if (!provider) return;
      try {
        const selectedProvider = PROVIDERS.find((p) => p.value === provider);
        if (!selectedProvider) return;

        const response = await fetch(`${selectedProvider.baseUrl}/models`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
        });
        const data = await response.json();
        setModels(data.data.map((model: { id: string }) => model.id) || []);
      } catch (error) {
        console.error("Failed to fetch models:", error);
        setModels([]);
      }
    };

    const debouncedFetchModels = debounce(fetchModels, 300);
    debouncedFetchModels();
    return () => {
      debouncedFetchModels.cancel();
    };
  }, [apiKey, provider]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider">LLM Provider</Label>
            <Popover
              open={openProviderCombobox}
              onOpenChange={setOpenProviderCombobox}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {PROVIDERS.find((p) => p.value === provider)?.label ||
                    "Select provider"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Search providers..." />
                  <CommandEmpty>No providers found.</CommandEmpty>
                  <CommandList>
                    <CommandGroup className="max-h-[300px] overflow-y-auto">
                      {PROVIDERS.map((p) => (
                        <CommandItem
                          key={p.value}
                          value={p.value}
                          onSelect={() => {
                            setProvider(p.value);
                            setModel("");
                            setOpenProviderCombobox(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              provider === p.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {p.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Popover
              open={openModelCombobox}
              onOpenChange={setOpenModelCombobox}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {model || "Select model"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Search models..." />
                  <CommandEmpty>No models found.</CommandEmpty>
                  <CommandList>
                    <CommandGroup className="max-h-[300px] overflow-y-auto">
                      {models.map((m) => (
                        <CommandItem
                          key={m}
                          value={m}
                          onSelect={() => {
                            setModel(m);
                            setOpenModelCombobox(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              model === m ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {m}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
            />
            <div className="text-sm text-muted-foreground">
              Note: Some providers require an API key to view available models.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
