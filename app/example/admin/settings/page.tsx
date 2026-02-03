"use client";

import { useEffect, useState } from "react";

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  category: string;
  createdAt: string | null;
  updatedAt: string | null;
}

type TabCategory = "prompts" | "general" | "agent" | "regional_tones";

const CATEGORY_LABELS: Record<TabCategory, string> = {
  prompts: "Prompts",
  general: "General",
  agent: "Agent",
  regional_tones: "Regional Tones",
};

const KEY_LABELS: Record<string, string> = {
  research_prompt: "Research Prompt",
  research_system_prompt: "Research System Prompt",
  classification_prompt: "Classification Prompt",
  classification_system_prompt: "Classification System Prompt",
  news_search_prompt: "News Search Prompt",
  message1_prompt: "LinkedIn Message 1 (Proposal)",
  message2_prompt: "LinkedIn Message 2 (Invitation)",
  message3_prompt: "LinkedIn Message 3 (Case Study)",
  message_system_prompt: "LinkedIn Message System Prompt",
  case_selection_prompt: "Case Selection Prompt",
  case_data_url: "Case Data URL",
  average_processing_time_ms: "Average Processing Time (ms)",
  // Regional tone settings
  regional_tone_uk: "UK Region",
  regional_tone_usa: "USA Region",
  regional_tone_mena: "MENA Region (UAE, Saudi Arabia, Qatar)",
  regional_tone_eu: "EU Region",
  regional_tone_dach: "DACH Region (Germany, Austria, Switzerland)",
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabCategory>("prompts");
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const [successKeys, setSuccessKeys] = useState<Set<string>>(new Set());
  const [errorKeys, setErrorKeys] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const response = await fetch("/api/example/admin/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        // Initialize edited values with current values
        const values: Record<string, string> = {};
        data.forEach((s: SystemSetting) => {
          values[s.key] = s.value;
        });
        setEditedValues(values);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave(key: string) {
    // Clear previous status
    setSuccessKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    setErrorKeys((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    setSavingKeys((prev) => new Set(prev).add(key));

    try {
      const response = await fetch(
        `/api/example/admin/settings/${encodeURIComponent(key)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: editedValues[key] }),
        },
      );

      if (response.ok) {
        const updated = await response.json();
        setSettings((prev) => prev.map((s) => (s.key === key ? updated : s)));
        setSuccessKeys((prev) => new Set(prev).add(key));
        // Clear success after 3 seconds
        setTimeout(() => {
          setSuccessKeys((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        }, 3000);
      } else {
        const data = await response.json();
        setErrorKeys((prev) => ({
          ...prev,
          [key]: data.error || "Failed to save",
        }));
      }
    } catch (error) {
      setErrorKeys((prev) => ({ ...prev, [key]: "Failed to save setting" }));
    } finally {
      setSavingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  function handleReset(key: string) {
    const original = settings.find((s) => s.key === key);
    if (original) {
      setEditedValues((prev) => ({ ...prev, [key]: original.value }));
    }
  }

  function hasChanges(key: string): boolean {
    const original = settings.find((s) => s.key === key);
    return original ? original.value !== editedValues[key] : false;
  }

  const filteredSettings = settings.filter((s) => s.category === activeTab);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-accent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-foreground">
          System Settings
        </h2>
        <p className="text-muted-foreground mt-1">
          Configure prompts and system behavior for the LeadGen processor.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {(Object.keys(CATEGORY_LABELS) as TabCategory[]).map((category) => (
          <button
            key={category}
            onClick={() => setActiveTab(category)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              activeTab === category
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {CATEGORY_LABELS[category]}
            <span className="ml-1.5 text-xs text-muted-foreground">
              ({settings.filter((s) => s.category === category).length})
            </span>
          </button>
        ))}
      </div>

      {/* Settings Cards */}
      <div className="space-y-4">
        {filteredSettings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <p className="text-muted-foreground">
              No settings in this category.
            </p>
          </div>
        ) : (
          filteredSettings.map((setting) => (
            <div
              key={setting.key}
              className="bg-white rounded-xl border border-gray-100 shadow-soft overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 bg-primary/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {KEY_LABELS[setting.key] || setting.key}
                    </h3>
                    {setting.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {setting.description}
                      </p>
                    )}
                  </div>
                  {setting.updatedAt && (
                    <span className="text-xs text-muted-foreground">
                      Updated: {new Date(setting.updatedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6">
                {/* Success/Error Messages */}
                {successKeys.has(setting.key) && (
                  <div className="mb-4 p-3 bg-success/10 border border-success/20 text-success text-sm rounded-lg animate-fade-in">
                    Setting saved successfully
                  </div>
                )}
                {errorKeys[setting.key] && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg animate-fade-in">
                    {errorKeys[setting.key]}
                  </div>
                )}

                {/* Textarea or Input based on content length */}
                {setting.category === "prompts" ||
                setting.category === "regional_tones" ? (
                  <textarea
                    value={editedValues[setting.key] || ""}
                    onChange={(e) =>
                      setEditedValues((prev) => ({
                        ...prev,
                        [setting.key]: e.target.value,
                      }))
                    }
                    rows={setting.category === "regional_tones" ? 15 : 12}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent font-mono text-sm resize-y min-h-[200px]"
                    placeholder={
                      setting.category === "regional_tones"
                        ? "Enter regional tone guidelines..."
                        : "Enter prompt text..."
                    }
                  />
                ) : (
                  <input
                    type="text"
                    value={editedValues[setting.key] || ""}
                    onChange={(e) =>
                      setEditedValues((prev) => ({
                        ...prev,
                        [setting.key]: e.target.value,
                      }))
                    }
                    className="input-enhanced"
                  />
                )}

                {/* Character count for prompts and regional tones */}
                {(setting.category === "prompts" ||
                  setting.category === "regional_tones") && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {(editedValues[setting.key] || "").length} characters
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(setting.key)}
                      disabled={
                        savingKeys.has(setting.key) || !hasChanges(setting.key)
                      }
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors cursor-pointer ${
                        hasChanges(setting.key)
                          ? "btn-accent"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {savingKeys.has(setting.key) ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving...
                        </span>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                    {hasChanges(setting.key) && (
                      <button
                        onClick={() => handleReset(setting.key)}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-muted-foreground hover:bg-gray-50 font-medium text-sm transition-colors cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {hasChanges(setting.key) && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                      Unsaved changes
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Help Text */}
      {activeTab === "prompts" && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <h4 className="font-semibold text-blue-900 mb-2">
            Template Variables
          </h4>
          <p className="text-sm text-blue-800 mb-2">
            Use double curly braces to insert dynamic values into prompts:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs font-mono text-blue-700">
            <span className="bg-blue-100 px-2 py-1 rounded">
              {"{{companyName}}"}
            </span>
            <span className="bg-blue-100 px-2 py-1 rounded">
              {"{{firstName}}"}
            </span>
            <span className="bg-blue-100 px-2 py-1 rounded">
              {"{{lastName}}"}
            </span>
            <span className="bg-blue-100 px-2 py-1 rounded">
              {"{{country}}"}
            </span>
            <span className="bg-blue-100 px-2 py-1 rounded">
              {"{{industry}}"}
            </span>
            <span className="bg-blue-100 px-2 py-1 rounded">
              {"{{linkedinLink}}"}
            </span>
            <span className="bg-blue-100 px-2 py-1 rounded">
              {"{{researchContent}}"}
            </span>
            <span className="bg-blue-100 px-2 py-1 rounded">
              {"{{enrichedNews}}"}
            </span>
            <span className="bg-blue-100 px-2 py-1 rounded">
              {"{{matchedCasesText}}"}
            </span>
          </div>
        </div>
      )}

      {activeTab === "regional_tones" && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
          <h4 className="font-semibold text-amber-900 mb-2">
            Regional Tone Guidelines
          </h4>
          <p className="text-sm text-amber-800 mb-3">
            These guidelines are automatically applied to LinkedIn message
            generation based on the detected company country. The appropriate
            regional tone is injected into the message system prompt.
          </p>
          <div className="text-sm text-amber-700">
            <strong className="block mb-2">Country to Region Mapping:</strong>
            <ul className="list-disc ml-5 space-y-1">
              <li>
                <strong>UK:</strong> United Kingdom
              </li>
              <li>
                <strong>USA:</strong> United States, Canada, Singapore, South
                Korea
              </li>
              <li>
                <strong>MENA:</strong> UAE, Saudi Arabia, Qatar
              </li>
              <li>
                <strong>EU:</strong> Belgium, Cyprus, Denmark, Estonia, Finland,
                France, Georgia, Hungary, Ireland, Italy, Kazakhstan, Latvia,
                Lithuania, Luxembourg, Malta, Netherlands, Poland, Serbia,
                Sweden
              </li>
              <li>
                <strong>DACH:</strong> Germany, Austria, Switzerland
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
