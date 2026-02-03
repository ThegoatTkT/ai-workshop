"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  Linkedin,
  Building2,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  Newspaper,
  Globe,
  MapPin,
  RefreshCw,
  Check,
  Pencil,
  X,
  Loader2,
  Home,
} from "lucide-react";

interface NewsItem {
  title: string;
  date: string;
  source: string;
  summary: string;
}

interface ProcessingRecord {
  id: string;
  status: string;
  companyName: string;
  linkedinLink: string | null;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  companyRegion: string | null;
  companyIndustry: string | null;
  companyNews: string | null;
  message1: string | null;
  message2: string | null;
  message3: string | null;
  matchedCaseIds: string | null;
  selectedNewsIndices: string | null;
  selectedCaseIndices: string | null;
  appliedRegionalTone: string | null;
  researchData: string | null;
  processingTimeMs: number | null;
  errorMessage: string | null;
}

// Regional tone options
const REGIONAL_TONES = [
  {
    key: "regional_tone_uk",
    label: "UK",
    description: "Restrained European style",
  },
  {
    key: "regional_tone_usa",
    label: "USA",
    description: "Direct, equal-footing approach",
  },
  {
    key: "regional_tone_mena",
    label: "MENA",
    description: "Formal, respectful, structured",
  },
  {
    key: "regional_tone_eu",
    label: "EU",
    description: "Friendly, logical, specific",
  },
  {
    key: "regional_tone_dach",
    label: "DACH",
    description: "Formal, clarity-focused, specific",
  },
];

interface Job {
  id: string;
  filename: string;
  status: string;
  totalRecords: number;
  processedRecords: number;
  createdAt: string;
}

interface Case {
  id: string;
  title: string;
  industry: string | null;
  link: string | null;
}

// Collapsible section component with smooth animation
function CollapsibleDetails({
  isExpanded,
  children,
}: {
  isExpanded: boolean;
  children: React.ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isExpanded ? contentRef.current.scrollHeight : 0);
    }
  }, [isExpanded, children]);

  return (
    <div
      className="overflow-hidden transition-all duration-300 ease-out"
      style={{ height: isExpanded ? height : 0 }}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
}

// Icon button with tooltip component
function IconButton({
  icon: Icon,
  tooltip,
  onClick,
  disabled = false,
  variant = "default",
  isLoading = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "success" | "danger" | "primary";
  isLoading?: boolean;
}) {
  const variantClasses = {
    default: "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800",
    success: "bg-success/10 text-success hover:bg-success hover:text-white",
    danger:
      "bg-destructive/10 text-destructive hover:bg-destructive hover:text-white",
    primary: "bg-accent/10 text-accent hover:bg-accent hover:text-white",
  };

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        disabled={disabled || isLoading}
        className={`p-2 rounded-lg transition-all duration-200 ${
          disabled || isLoading
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : variantClasses[variant]
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Icon className="w-4 h-4" />
        )}
      </button>
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[-4px] border-4 border-transparent border-b-gray-900" />
        {tooltip}
      </div>
    </div>
  );
}

// LinkedIn message card component
function MessageCard({
  number,
  title,
  content,
  recordId,
  copiedMessage,
  onCopy,
  canRegenerate = false,
  onRegenerate = () => {},
  onSave,
  isSaving = false,
  isRegenerating = false,
}: {
  number: number;
  title: string;
  content: string;
  recordId: string;
  copiedMessage: string | null;
  onCopy: (text: string, messageId: string) => void;
  canRegenerate?: boolean;
  onRegenerate?: (messageNumber: number) => void;
  onSave: (messageNumber: number, content: string) => Promise<void>;
  isSaving?: boolean;
  isRegenerating?: boolean;
}) {
  const messageId = `${recordId}-message${number}`;
  const isCopied = copiedMessage === messageId;
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset edited content when original content changes
  useEffect(() => {
    if (!isEditing) {
      setEditedContent(content);
    }
  }, [content, isEditing]);

  // Auto-resize textarea and focus when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  const handleEdit = () => {
    setEditedContent(content);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  const handleSave = async () => {
    await onSave(number, editedContent);
    setIsEditing(false);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const currentContent = isEditing ? editedContent : content;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Message Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-primary/5 to-transparent border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
            {number}
          </span>
          <div>
            <h4 className="text-sm font-semibold text-primary">{title}</h4>
            <p className="text-xs text-muted-foreground">LinkedIn message</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isEditing ? (
            <>
              <IconButton
                icon={Check}
                tooltip="Save changes"
                onClick={handleSave}
                variant="success"
                isLoading={isSaving}
                disabled={isSaving || editedContent === content}
              />
              <IconButton
                icon={X}
                tooltip="Cancel editing"
                onClick={handleCancel}
                variant="danger"
                disabled={isSaving}
              />
            </>
          ) : (
            <>
              <IconButton
                icon={Pencil}
                tooltip="Edit message"
                onClick={handleEdit}
                variant="default"
              />
              <IconButton
                icon={RefreshCw}
                tooltip={
                  canRegenerate
                    ? "Regenerate with selected context"
                    : "Select news or cases to enable"
                }
                onClick={() => onRegenerate(number)}
                variant="primary"
                disabled={!canRegenerate || isRegenerating}
                isLoading={isRegenerating}
              />
            </>
          )}
          <IconButton
            icon={isCopied ? Check : Copy}
            tooltip={isCopied ? "Copied!" : "Copy to clipboard"}
            onClick={() => onCopy(currentContent, messageId)}
            variant={isCopied ? "success" : "default"}
          />
        </div>
      </div>

      {/* Message Content */}
      <div className="p-5">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Message{" "}
            {isEditing && <span className="text-accent">(editing)</span>}
          </label>
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={editedContent}
              onChange={handleTextareaChange}
              className="mt-1.5 w-full text-sm text-foreground bg-white rounded-lg px-4 py-3 border-2 border-accent/30 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 whitespace-pre-wrap leading-relaxed min-h-[120px] resize-none transition-all duration-200"
              placeholder="Enter message content..."
              disabled={isSaving}
            />
          ) : (
            <div className="mt-1.5 text-sm text-foreground bg-gray-50 rounded-lg px-4 py-3 border border-gray-100 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
              {content}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const config = {
    completed: {
      icon: CheckCircle2,
      bg: "bg-success/10",
      text: "text-success",
      label: "Completed",
    },
    failed: {
      icon: XCircle,
      bg: "bg-destructive/10",
      text: "text-destructive",
      label: "Failed",
    },
    pending: {
      icon: Clock,
      bg: "bg-warning/10",
      text: "text-warning",
      label: "Pending",
    },
    processing: {
      icon: Clock,
      bg: "bg-accent/10",
      text: "text-accent",
      label: "Processing",
    },
  };

  const {
    icon: Icon,
    bg,
    text,
    label,
  } = config[status as keyof typeof config] || config.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${bg} ${text}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

// Toast notification component
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
      <div className="bg-primary text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
        <RefreshCw className="w-4 h-4" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

// Helper to extract domain from URL
function extractDomain(url: string): string {
  try {
    const domain = new URL(url).hostname.replace("www.", "");
    return domain;
  } catch {
    return url;
  }
}

// Helper to check if string is a valid URL
function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

// Helper to parse company news JSON
function parseCompanyNews(newsJson: string | null): NewsItem[] {
  if (!newsJson) return [];
  try {
    const parsed = JSON.parse(newsJson);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => item && typeof item.title === "string");
    }
    return [];
  } catch {
    return [];
  }
}

// News section component
function NewsSection({
  news,
  country,
  industry,
  selectedNews = new Set(),
  onNewsSelect = () => {},
  appliedTone = null,
  onToneChange,
  isRegeneratingAll = false,
}: {
  news: NewsItem[];
  country: string | null;
  industry: string | null;
  selectedNews?: Set<number>;
  onNewsSelect?: (index: number) => void;
  appliedTone?: string | null;
  onToneChange?: (tone: string) => void;
  isRegeneratingAll?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleNews = isExpanded ? news : news.slice(0, 3);
  const hasMoreNews = news.length > 3;

  // Find current tone label
  const currentTone = REGIONAL_TONES.find((t) => t.key === appliedTone);

  if (news.length === 0 && !country && !industry) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-accent/5 to-transparent border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
            <Newspaper className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-primary">
              Company Research & News
            </h4>
            <p className="text-xs text-muted-foreground">
              Select items to use as context for regeneration
            </p>
          </div>
        </div>
        {selectedNews.size > 0 && (
          <span className="px-2 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full">
            {selectedNews.size} selected
          </span>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Classification Badges and Tone Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {industry && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/5 text-primary border border-primary/10">
              <Globe className="w-3.5 h-3.5" />
              {industry}
            </span>
          )}
          {country && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/5 text-accent border border-accent/10">
              <MapPin className="w-3.5 h-3.5" />
              {country}
            </span>
          )}
          {/* Regional Tone Selector */}
          {onToneChange && (
            <div className="relative ml-auto">
              <select
                value={appliedTone || ""}
                onChange={(e) => onToneChange(e.target.value)}
                disabled={isRegeneratingAll}
                className={`appearance-none pl-3 pr-8 py-1.5 text-xs font-medium rounded-lg border cursor-pointer transition-all duration-200 ${
                  isRegeneratingAll
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-white text-primary border-primary/20 hover:border-primary/40 focus:border-accent focus:ring-2 focus:ring-accent/20"
                }`}
              >
                <option value="" disabled>
                  Select tone...
                </option>
                {REGIONAL_TONES.map((tone) => (
                  <option key={tone.key} value={tone.key}>
                    {tone.label} - {tone.description}
                  </option>
                ))}
              </select>
              <ChevronDown
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${
                  isRegeneratingAll ? "text-gray-400" : "text-primary"
                }`}
              />
              {isRegeneratingAll && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-lg">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* News Items */}
        {news.length > 0 && (
          <div className="space-y-3">
            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Recent News ({news.length})
            </h5>
            <div className="space-y-3">
              {visibleNews.map((item, index) => {
                const isSelected = selectedNews.has(index);
                return (
                  <div
                    key={index}
                    onClick={() => onNewsSelect(index)}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "bg-accent/5 border-2 border-accent/30 shadow-sm"
                        : "bg-gray-50 hover:bg-gray-100 border border-gray-100"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div
                        className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
                          isSelected
                            ? "bg-accent text-white"
                            : "border-2 border-gray-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground leading-snug">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                          <span>{item.date}</span>
                          <span className="text-gray-300">-</span>
                          {isValidUrl(item.source) ? (
                            <a
                              href={item.source}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-accent hover:text-accent-light hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              {extractDomain(item.source)}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span>{item.source}</span>
                          )}
                        </div>
                        {item.summary && (
                          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                            {item.summary}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Show more/less button */}
            {hasMoreNews && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full py-2 text-sm font-medium text-accent hover:text-accent-light flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                {isExpanded ? <>Show less</> : <>Show {news.length - 3} more</>}
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                />
              </button>
            )}
          </div>
        )}

        {/* Empty state for news */}
        {news.length === 0 && (country || industry) && (
          <p className="text-xs text-muted-foreground italic">
            No recent news found for this company.
          </p>
        )}
      </div>
    </div>
  );
}

// Record card component
function RecordCard({
  record,
  isExpanded,
  onToggle,
  matchedCases,
  copiedEmail,
  onCopy,
  onRecordUpdate,
}: {
  record: ProcessingRecord;
  isExpanded: boolean;
  onToggle: () => void;
  matchedCases: Case[];
  copiedEmail: string | null;
  onCopy: (text: string, emailId: string) => void;
  onRecordUpdate: (
    recordId: string,
    updates: Partial<ProcessingRecord>,
  ) => void;
}) {
  const hasMessages = record.message1 || record.message2 || record.message3;

  // Parse originally-selected indices from the record
  const parseIndices = (json: string | null): number[] => {
    if (!json) return [];
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed)
        ? parsed.filter((n): n is number => typeof n === "number")
        : [];
    } catch {
      return [];
    }
  };

  const originalNewsIndices = parseIndices(record.selectedNewsIndices);
  const originalCaseIndices = parseIndices(record.selectedCaseIndices);

  // Selection state for news and cases - initialize with originally-selected items
  const [selectedNews, setSelectedNews] = useState<Set<number>>(
    () => new Set(originalNewsIndices),
  );
  const [selectedCases, setSelectedCases] = useState<Set<string>>(
    () => new Set(originalCaseIndices.map((i) => `case-${i}`)),
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [savingMessage, setSavingMessage] = useState<number | null>(null);
  const [regeneratingMessage, setRegeneratingMessage] = useState<number | null>(
    null,
  );
  const [isRegeneratingAll, setIsRegeneratingAll] = useState(false);
  const [currentTone, setCurrentTone] = useState<string | null>(
    record.appliedRegionalTone,
  );

  // Update currentTone when record changes
  useEffect(() => {
    setCurrentTone(record.appliedRegionalTone);
  }, [record.appliedRegionalTone]);

  // Re-initialize selection when record changes (e.g., after regeneration)
  useEffect(() => {
    const newNewsIndices = parseIndices(record.selectedNewsIndices);
    const newCaseIndices = parseIndices(record.selectedCaseIndices);
    setSelectedNews(new Set(newNewsIndices));
    setSelectedCases(new Set(newCaseIndices.map((i) => `case-${i}`)));
  }, [record.selectedNewsIndices, record.selectedCaseIndices]);

  const toggleNewsSelection = (index: number) => {
    setSelectedNews((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const toggleCaseSelection = (caseId: string) => {
    setSelectedCases((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(caseId)) {
        newSet.delete(caseId);
      } else {
        newSet.add(caseId);
      }
      return newSet;
    });
  };

  const canRegenerate = selectedNews.size > 0 || selectedCases.size > 0;

  const handleRegenerate = async (messageNumber: number) => {
    setRegeneratingMessage(messageNumber);
    try {
      const fieldName = `message${messageNumber}` as
        | "message1"
        | "message2"
        | "message3";
      const currentMessage = record[fieldName] || "";

      const response = await fetch(
        `/api/example/leadgen/records/${record.id}/regenerate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messageNumber,
            selectedNewsIndices: Array.from(selectedNews),
            selectedCaseIds: Array.from(selectedCases),
            currentMessageText: currentMessage,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to regenerate message");
      }

      const { content } = await response.json();
      onRecordUpdate(record.id, { [fieldName]: content });
      setToastMessage(`Message ${messageNumber} regenerated successfully!`);
    } catch (error: any) {
      console.error("Error regenerating message:", error);
      setToastMessage(
        error.message || "Failed to regenerate message. Please try again.",
      );
    } finally {
      setRegeneratingMessage(null);
    }
  };

  const handleSaveMessage = async (messageNumber: number, content: string) => {
    setSavingMessage(messageNumber);
    try {
      const fieldName = `message${messageNumber}` as
        | "message1"
        | "message2"
        | "message3";

      const response = await fetch(
        `/api/example/leadgen/records/${record.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [fieldName]: content }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save message");
      }

      const updatedData = await response.json();
      onRecordUpdate(record.id, { [fieldName]: updatedData[fieldName] });
      setToastMessage("Message saved successfully");
    } catch (error) {
      console.error("Error saving message:", error);
      setToastMessage("Failed to save message. Please try again.");
    } finally {
      setSavingMessage(null);
    }
  };

  const handleToneChange = async (newTone: string) => {
    if (newTone === currentTone || isRegeneratingAll) return;

    setIsRegeneratingAll(true);
    setCurrentTone(newTone); // Optimistically update UI
    setRegeneratingMessage(-1); // Use -1 to indicate all messages are regenerating

    try {
      const response = await fetch(
        `/api/example/leadgen/records/${record.id}/regenerate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messageNumber: "all",
            selectedNewsIndices: Array.from(selectedNews),
            selectedCaseIds: Array.from(selectedCases),
            regionalToneKey: newTone,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to regenerate messages");
      }

      const data = await response.json();
      onRecordUpdate(record.id, {
        message1: data.message1,
        message2: data.message2,
        message3: data.message3,
        appliedRegionalTone: data.appliedRegionalTone,
      });
      setToastMessage("All messages regenerated with new tone!");
    } catch (error: any) {
      console.error("Error regenerating messages:", error);
      setCurrentTone(record.appliedRegionalTone); // Revert on error
      setToastMessage(
        error.message || "Failed to regenerate messages. Please try again.",
      );
    } finally {
      setIsRegeneratingAll(false);
      setRegeneratingMessage(null);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border transition-all duration-200 ${
        isExpanded
          ? "border-accent/30 shadow-lg ring-1 ring-accent/10"
          : "border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200"
      }`}
    >
      {/* Toast notification */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}

      {/* Card Header - Always Visible */}
      <div className="p-5">
        <div className="flex items-center justify-between">
          {/* Left: Company & Contact Info */}
          <div className="flex items-center gap-5 flex-1 min-w-0">
            {/* Company Icon */}
            <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-primary" />
            </div>

            {/* Company Details */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-base font-semibold text-foreground truncate">
                  {record.companyName}
                </h3>
                <StatusBadge status={record.status} />
              </div>

              <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  {record.firstName} {record.lastName}
                </span>
                {record.jobTitle && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    {record.jobTitle}
                  </span>
                )}
              </div>

              {record.companyIndustry && (
                <p className="text-xs text-muted-foreground mt-1">
                  {record.companyIndustry}{" "}
                  {record.companyRegion && `- ${record.companyRegion}`}
                </p>
              )}
            </div>
          </div>

          {/* Right: View Details Button */}
          <button
            onClick={onToggle}
            disabled={!hasMessages && !record.errorMessage}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ml-4 flex-shrink-0 ${
              hasMessages || record.errorMessage
                ? isExpanded
                  ? "bg-primary text-white shadow-md"
                  : "bg-accent/10 text-accent hover:bg-accent hover:text-white hover:shadow-md"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {hasMessages ? (
              <>
                <Linkedin className="w-4 h-4" />
                {isExpanded ? "Hide Details" : "View Details"}
              </>
            ) : record.errorMessage ? (
              <>
                <XCircle className="w-4 h-4" />
                View Error
              </>
            ) : (
              "No Details"
            )}
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Collapsible Details Section */}
      <CollapsibleDetails isExpanded={isExpanded}>
        <div className="border-t border-gray-100 bg-gray-50/50">
          <div className="p-5 space-y-5">
            {/* Company Research & News */}
            <NewsSection
              news={parseCompanyNews(record.companyNews)}
              country={record.companyRegion}
              industry={record.companyIndustry}
              selectedNews={selectedNews}
              onNewsSelect={toggleNewsSelection}
              appliedTone={currentTone}
              onToneChange={handleToneChange}
              isRegeneratingAll={isRegeneratingAll}
            />

            {/* Matched Cases - MOVED ABOVE EMAILS */}
            {matchedCases.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-accent" />
                    Matched Case Studies ({matchedCases.length})
                  </h4>
                  {selectedCases.size > 0 && (
                    <span className="px-2 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full">
                      {selectedCases.size} selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Select case studies to use as context for regeneration
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {matchedCases.map((caseItem) => {
                    const isSelected = selectedCases.has(caseItem.id);
                    return (
                      <div
                        key={caseItem.id}
                        onClick={() => toggleCaseSelection(caseItem.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "bg-accent/5 border-2 border-accent/30 shadow-sm"
                            : "bg-gray-50 hover:bg-gray-100 border border-gray-100"
                        }`}
                      >
                        {/* Checkbox */}
                        <div
                          className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-accent text-white"
                              : "border-2 border-gray-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {caseItem.title}
                          </p>
                          {caseItem.industry && (
                            <p className="text-xs text-muted-foreground">
                              {caseItem.industry}
                            </p>
                          )}
                        </div>
                        {caseItem.link && (
                          <a
                            href={caseItem.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 text-accent hover:text-accent-light hover:bg-accent/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* LinkedIn Messages Grid */}
            {(record.message1 || record.message2 || record.message3) && (
              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
                {record.message1 && (
                  <MessageCard
                    number={1}
                    title="Proposal"
                    content={record.message1}
                    recordId={record.id}
                    copiedMessage={copiedEmail}
                    onCopy={onCopy}
                    canRegenerate={canRegenerate}
                    onRegenerate={handleRegenerate}
                    onSave={handleSaveMessage}
                    isSaving={savingMessage === 1}
                    isRegenerating={
                      regeneratingMessage === 1 || regeneratingMessage === -1
                    }
                  />
                )}
                {record.message2 && (
                  <MessageCard
                    number={2}
                    title="Invitation"
                    content={record.message2}
                    recordId={record.id}
                    copiedMessage={copiedEmail}
                    onCopy={onCopy}
                    canRegenerate={canRegenerate}
                    onRegenerate={handleRegenerate}
                    onSave={handleSaveMessage}
                    isSaving={savingMessage === 2}
                    isRegenerating={
                      regeneratingMessage === 2 || regeneratingMessage === -1
                    }
                  />
                )}
                {record.message3 && (
                  <MessageCard
                    number={3}
                    title="Case Study"
                    content={record.message3}
                    recordId={record.id}
                    copiedMessage={copiedEmail}
                    onCopy={onCopy}
                    canRegenerate={canRegenerate}
                    onRegenerate={handleRegenerate}
                    onSave={handleSaveMessage}
                    isSaving={savingMessage === 3}
                    isRegenerating={
                      regeneratingMessage === 3 || regeneratingMessage === -1
                    }
                  />
                )}
              </div>
            )}

            {/* Error Message */}
            {record.errorMessage && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-4 h-4 text-destructive" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-destructive">
                      Processing Error
                    </h4>
                    <p className="text-sm text-destructive/80 mt-1">
                      {record.errorMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CollapsibleDetails>
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [records, setRecords] = useState<ProcessingRecord[]>([]);
  const [cases, setCases] = useState<Record<string, Case>>({});
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(
          `/api/example/leadgen/jobs/${jobId}/results`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch results");
        }
        const data = await response.json();
        setJob(data.job);
        setRecords(data.records);
        setCases(data.cases || {});
      } catch (err) {
        setError("Failed to load results");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [jobId]);

  const toggleRow = (recordId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (text: string, emailId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedEmail(emailId);
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/example/leadgen/jobs/${jobId}/export`);
      if (!response.ok) {
        throw new Error("Failed to export");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${job?.filename || "results"}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export:", err);
      alert("Failed to export results. Please try again.");
    }
  };

  const getMatchedCases = (matchedCaseIds: string | null): Case[] => {
    if (!matchedCaseIds) return [];
    try {
      const parsed = JSON.parse(matchedCaseIds);
      return parsed.map((item: any, index: number) => {
        if (typeof item === "string") {
          // Legacy format: just title string
          return {
            id: `legacy-${index}`,
            title: item,
            industry: null,
            link: null,
          };
        }
        // New format: {title, link} object
        return {
          id: `case-${index}`,
          title: item.title || "Unknown Case",
          industry: null,
          link: item.link || null,
        };
      });
    } catch {
      return [];
    }
  };

  const handleRecordUpdate = (
    recordId: string,
    updates: Partial<ProcessingRecord>,
  ) => {
    setRecords((prevRecords) =>
      prevRecords.map((record) =>
        record.id === recordId ? { ...record, ...updates } : record,
      ),
    );
  };

  // Stats
  const completedCount = records.filter((r) => r.status === "completed").length;
  const failedCount = records.filter((r) => r.status === "failed").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-primary/20 border-t-accent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground font-medium">
            Loading results...
          </p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <p className="text-destructive font-medium mb-4">
            {error || "Results not found"}
          </p>
          <button
            onClick={() => router.push("/example/leadgen")}
            className="btn-accent cursor-pointer"
          >
            Back to LeadGen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-soft sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-primary">
                  Job Results
                </h1>
                <p className="text-sm text-muted-foreground">
                  {job.filename} <span className="mx-2">-</span>{" "}
                  {new Date(job.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-5 py-2.5 text-sm bg-success text-white rounded-lg hover:bg-success/90 font-semibold transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Export to Excel
              </button>
              <button
                onClick={() => router.push(`/example/leadgen/jobs/${jobId}`)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary border border-gray-200 rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 cursor-pointer"
              >
                Back to Job Status
              </button>
              <button
                onClick={() => router.push("/example")}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary border border-gray-200 rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-100 shadow-sm">
            <span className="text-sm text-muted-foreground">
              Total Records:
            </span>
            <span className="text-sm font-semibold text-primary">
              {records.length}
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-success/5 rounded-lg border border-success/20">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span className="text-sm font-semibold text-success">
              {completedCount} Completed
            </span>
          </div>
          {failedCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-destructive/5 rounded-lg border border-destructive/20">
              <XCircle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-semibold text-destructive">
                {failedCount} Failed
              </span>
            </div>
          )}
        </div>

        {/* Records List */}
        <div className="space-y-4">
          {records.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              isExpanded={expandedRows.has(record.id)}
              onToggle={() => toggleRow(record.id)}
              matchedCases={getMatchedCases(record.matchedCaseIds)}
              copiedEmail={copiedEmail}
              onCopy={copyToClipboard}
              onRecordUpdate={handleRecordUpdate}
            />
          ))}
        </div>

        {records.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Linkedin className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">
                No results available
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Results will appear here once processing completes
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
