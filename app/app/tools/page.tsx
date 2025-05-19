"use client";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import { AlertCircle, AlertTriangle, ChevronRight, ClipboardList, Edit, FileText, Loader2, MoreHorizontal, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GhostDusterBuster } from "../../components/GhostDusterBuster";
import { deleteWardTask, getLastWardDataImport, getTaskTemplates, getWardTasks, logWardDataImport, processWardListImport, trackAnonymousUser } from "./actions";
import RichTextDisplayWithStyles from "./components/RichTextDisplay";
import { TaskEditorDialogWithStyles as TaskEditorDialog } from "./TaskEditorDialog";

// Dynamically import SyntaxHighlighter to prevent SSR issues
const DynamicSyntaxHighlighter = dynamic(
  () => import("react-syntax-highlighter").then((mod) => {
    // We're using a simpler import strategy to avoid polyfill issues
    return mod.Prism;
  }),
  { ssr: false }
);

// Define Ward/Branch interface
interface WardBranch {
  id: string;
  name: string;
  unit_type: "Ward" | "Branch";
  unit_number: string;
  stake_district_name?: string;
  city?: string;
  state_province?: string;
  country?: string;
  is_primary: boolean;
}

// Code block with syntax highlighting component
function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState(false);
  
  // Check if we're in the browser to use syntax highlighter
  useEffect(() => {
    setLoaded(typeof window !== 'undefined');
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Theme that better matches the application design
  const customTheme = {
    'pre[class*="language-"]': {
      background: 'hsl(222.2 84% 4.9%)',
      color: 'hsl(210 40% 98%)',
      whiteSpace: 'pre' as const,
      wordBreak: 'normal' as const,
      overflowWrap: 'normal' as const,
    },
    'code[class*="language-"]': {
      color: 'hsl(210 40% 98%)',
      whiteSpace: 'pre' as const,
      wordBreak: 'normal' as const,
      overflowWrap: 'normal' as const,
    },
    'comment': { color: 'hsl(217.2 32.6% 65%)' },
    'string': { color: 'hsl(142.1 76.2% 76.5%)' },
    'keyword': { color: 'hsl(217.2 91.2% 59.8%)' },
    'function': { color: 'hsl(280 100% 70%)' },
    'number': { color: 'hsl(30 100% 70%)' },
    'operator': { color: 'hsl(280 100% 70%)' },
    'punctuation': { color: 'hsl(210 40% 70%)' },
    'property': { color: 'hsl(35.5 91.7% 75.3%)' },
    'variable': { color: 'hsl(355.7 100% 75.3%)' }
  };

  return (
    <div className="relative w-full" style={{ width: '70%' }}>
      <div className="bg-card border border-border rounded-md w-full">
        <div className="overflow-x-auto overflow-y-hidden w-full">
          {loaded ? (
            <DynamicSyntaxHighlighter 
              language="javascript" 
              style={customTheme}
              customStyle={{
                fontSize: '0.875rem',
                margin: 0,
                padding: '1rem',
                paddingRight: '2rem',
                background: 'hsl(222.2 84% 4.9%)',
                whiteSpace: 'pre',
                width: 'fit-content',
                minWidth: '100%',
                maxWidth: 'none',
              }}
              wrapLines={false}
              wrapLongLines={false}
            >
              {code}
            </DynamicSyntaxHighlighter>
          ) : (
            <pre className="font-mono p-4 pr-8 bg-card text-card-foreground whitespace-pre w-full" style={{ overflow: 'auto', width: 'fit-content', minWidth: '100%' }}>
              <code>{code}</code>
            </pre>
          )}
        </div>
        <button
          onClick={copyToClipboard}
          className="absolute top-2 right-2 bg-primary/90 text-primary-foreground px-2 py-1 rounded text-xs hover:bg-primary transition-colors z-10"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

// Instruction step component
function InstructionStep({ number, title, description }: { number: number; title: string; description: string | React.ReactNode }) {
  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
        {number}
      </div>
      <div>
        <h3 className="font-medium mb-1">{title}</h3>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
    </div>
  );
}

// Add this after the imports
declare global {
  interface Window {
    debugAnonymousTracking: () => Promise<void>;
  }
}

// Task interfaces
interface TaskTemplate {
  id: string;
  title: string;
  instructions: string;
  equipment: string;
  safety: string;
  category: string;
  created_at: string;
  updated_at: string;
}

interface WardTask {
  id?: string;
  ward_id: string;
  template_id?: string;
  title: string;
  subtitle?: string;
  instructions: string;
  equipment: string;
  safety?: string;
  image_url?: string;
  color?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  priority?: string;
  kid_friendly?: boolean;
  points?: number;
}

// Add a component for HTML content rendering (maintained for backward compatibility)
function HtmlContent({ html }: { html: string }) {
  return <RichTextDisplayWithStyles html={html} />;
}

// Task color options
const TASK_COLORS = [
  { name: "Default", value: "" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Yellow", value: "#eab308" },
  { name: "Green", value: "#22c55e" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
];

// Task Categories
const TASK_CATEGORIES = [
  "All",
  "Floors",
  "Furniture",
  "Restrooms",
  "General",
  "Exterior",
  "Windows",
  "Other"
];

// Task List component
function TaskList({ 
  tasks, 
  onEdit, 
  onDelete, 
  isLoading 
}: { 
  tasks: WardTask[];
  onEdit: (task: WardTask) => void;
  onDelete: (taskId: string) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-60">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-muted/50 rounded-lg flex flex-col items-center justify-center p-12 text-center">
        <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No tasks yet</h3>
        <p className="text-muted-foreground mt-2 mb-4">Get started by adding your first cleaning task</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tasks.map(task => (
        <div key={task.id} className="bg-card border rounded-lg overflow-hidden flex flex-col h-64">
          {/* Task header with color */}
          <div 
            className="p-4 border-b flex justify-between items-start"
            style={task.color ? { borderLeft: `4px solid ${task.color}` } : {}}
          >
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="font-medium truncate">{task.title}</h3>
              {task.subtitle && <p className="text-sm text-muted-foreground truncate">{task.subtitle}</p>}
              <div className="flex flex-wrap gap-1 mt-1">
                {/* Display task priority if set */}
                {task.priority && (
                  <Badge variant={task.priority === 'do_first' ? 'destructive' : 'default'} className="text-xs">
                    {task.priority === 'do_first' ? 'Do First' : 'Do Last'}
                  </Badge>
                )}
                {/* Display kid-friendly badge if true */}
                {task.kid_friendly && (
                  <Badge 
                    variant="outline" 
                    className="text-xs bg-[#ec4899] text-white hover:bg-[#ec4899] hover:text-white"
                  >
                    Kid-friendly
                  </Badge>
                )}
                {/* Display points value */}
                <Badge 
                  variant="outline" 
                  className="text-xs bg-amber-500 text-white hover:bg-amber-500 hover:text-white"
                >
                  {task.points || 5} pts
                </Badge>
              </div>
            </div>
            <div className="flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 hover:bg-muted rounded">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    <Edit className="h-4 w-4 mr-2" /> Edit Task
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete(task.id || '')}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Task image */}
          {task.image_url && (
            <div className="aspect-video bg-muted">
              <img 
                src={task.image_url} 
                alt={task.title} 
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Task preview content - Updated for compact square layout */}
          <div className="p-4 flex-grow overflow-hidden flex flex-col">
            {/* Instructions - truncated */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-1">Instructions</h4>
              <div className="text-sm line-clamp-3 overflow-hidden">
                <HtmlContent html={task.instructions} />
              </div>
            </div>
            
            {/* Ghost Duster Buster Easter Egg - compact version */}
            <div className="mt-auto">
              <GhostDusterBuster title={task.title} instructions={task.instructions} />
            </div>
          </div>

          {/* Task footer */}
          <div className="p-4 border-t">
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                {task.active ? 'Active' : 'Inactive'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(task.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Template Selection Dialog
function TemplateSelectionDialog({ 
  isOpen, 
  onClose, 
  onSelectTemplate 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSelectTemplate: (template: TaskTemplate) => void; 
}) {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Fetch templates when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  // Fetch templates from server
  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);

    try {
      const category = selectedCategory !== 'All' ? selectedCategory : undefined;
      const result = await getTaskTemplates(category);
      
      if (result.success) {
        setTemplates(result.data || []);
      } else {
        setError(result.error || 'Failed to load templates');
      }
    } catch (e) {
      setError('An unexpected error occurred');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    // Reset search when changing category
    setSearchTerm('');
  };

  // Filter templates based on search term
  const filteredTemplates = useMemo(() => {
    if (!searchTerm.trim()) return templates;
    
    const term = searchTerm.toLowerCase();
    return templates.filter(template => 
      template.title.toLowerCase().includes(term) ||
      template.instructions.toLowerCase().includes(term) ||
      template.equipment.toLowerCase().includes(term) ||
      (template.safety && template.safety.toLowerCase().includes(term))
    );
  }, [templates, searchTerm]);

  // Effect to re-fetch when category changes
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [selectedCategory, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-3xl max-h-[90vh] overflow-y-auto" 
        style={{ position: 'fixed', top: '5vh', transform: 'translateY(0) translateX(-50%)' }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">Select a Task Template</DialogTitle>
        </DialogHeader>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search templates..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={selectedCategory}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Categories</SelectLabel>
                {TASK_CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error loading templates</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Templates grid */}
        {!loading && !error && (
          <>
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4" />
                <p>No templates found</p>
                {searchTerm && (
                  <button 
                    className="mt-4 text-primary hover:underline"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map(template => (
                  <div 
                    key={template.id}
                    className="border rounded-lg p-4 hover:border-primary cursor-pointer transition-colors"
                    onClick={() => onSelectTemplate(template)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{template.title}</h3>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                    <div className="line-clamp-2 text-sm text-muted-foreground mb-3">
                      <HtmlContent html={template.instructions} />
                    </div>
                    <button
                      className="flex items-center text-sm text-primary hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTemplate(template);
                      }}
                    >
                      Use Template <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <button 
            className="px-4 py-2 rounded-md text-sm font-medium bg-muted hover:bg-muted/80"
            onClick={onClose}
          >
            Cancel
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Task Builder Component
function TaskBuilderTool({ wardBranches, selectedWard, authError }: {
  wardBranches: WardBranch[];
  selectedWard: string;
  authError: boolean;
}) {
  const [tasks, setTasks] = useState<WardTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isTaskEditorOpen, setIsTaskEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<WardTask | undefined>(undefined);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Fetch tasks when ward is selected
  useEffect(() => {
    if (selectedWard) {
      fetchTasks();
    }
  }, [selectedWard]);

  // Get current user ID
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, [supabase]);

  // Fetch tasks from the server
  const fetchTasks = async () => {
    if (!selectedWard) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getWardTasks(selectedWard);
      
      if (result.success) {
        setTasks(result.data || []);
      } else {
        setError(result.error || 'Failed to load tasks');
      }
    } catch (e) {
      setError('An unexpected error occurred');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a new task from template
  const handleAddTask = () => {
    setIsTemplateDialogOpen(true);
  };

  // Handle template selection
  const handleSelectTemplate = (template: TaskTemplate) => {
    setIsTemplateDialogOpen(false);
    setEditingTask({
      ward_id: selectedWard,
      template_id: template.id,
      title: template.title,
      subtitle: '',
      instructions: template.instructions,
      equipment: template.equipment,
      safety: template.safety || '',
      image_url: '',
      color: '',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: userId || ''
    });
    setIsTaskEditorOpen(true);
  };

  // Handle edit task
  const handleEditTask = (task: WardTask) => {
    // Make sure the task has an ID before editing
    if (!task.id) {
      console.error("Cannot edit task without ID");
      setError("Cannot edit task: Missing ID");
      return;
    }
    setEditingTask(task);
    setIsTaskEditorOpen(true);
  };

  // Handle task save (refresh the list)
  const handleTaskSave = () => {
    fetchTasks();
  };

  // Handle delete click
  const handleDeleteClick = (taskId: string) => {
    setDeleteTaskId(taskId);
    setIsConfirmDeleteOpen(true);
  };

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!deleteTaskId) {
      setError('Cannot delete: No task ID provided');
      setIsConfirmDeleteOpen(false);
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const result = await deleteWardTask(deleteTaskId);
      
      if (result.success) {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== deleteTaskId));
        setIsConfirmDeleteOpen(false);
        setDeleteTaskId(null);
      } else {
        setError(result.error || 'Failed to delete task');
      }
    } catch (e) {
      setError('An unexpected error occurred while deleting the task');
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle authentication error
  if (authError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Task Builder</h1>
        <div className="bg-amber-50 text-amber-800 p-6 rounded-lg border border-amber-200">
          <h2 className="text-xl font-medium mb-2">Authentication Required</h2>
          <p className="mb-4">You need to be logged in to use this tool.</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Handle no wards found
  if (!loading && wardBranches.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Task Builder</h1>
        <div className="bg-amber-50 text-amber-800 p-6 rounded-lg border border-amber-200">
          <h2 className="text-xl font-medium mb-2">No Wards or Branches Found</h2>
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>
              You need to set up at least one ward or branch before using this tool.
              Please go to Settings to add your ward or branch information.
            </p>
          </div>
          <button
            onClick={() => router.push('/app/settings')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Task Builder</h1>

      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-xl font-medium">Cleaning Tasks</h2>
          <p className="text-muted-foreground">
            Create and manage cleaning tasks for your ward
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={fetchTasks}
            className="px-3 py-2 rounded-md text-sm font-medium bg-muted hover:bg-muted/80 flex items-center"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={handleAddTask}
            className="px-3 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 flex items-center"
            disabled={!selectedWard}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Tasks list */}
      <TaskList
        tasks={tasks}
        onEdit={handleEditTask}
        onDelete={handleDeleteClick}
        isLoading={loading}
      />

      {/* Template selection dialog */}
      <TemplateSelectionDialog
        isOpen={isTemplateDialogOpen}
        onClose={() => setIsTemplateDialogOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Task editor dialog */}
      {userId && selectedWard ? (
        <TaskEditorDialog
          isOpen={isTaskEditorOpen}
          onClose={() => {
            setIsTaskEditorOpen(false);
            setEditingTask(undefined);
          }}
          initialTask={editingTask || null}
          wardId={selectedWard}
          onSave={handleTaskSave}
          userId={userId}
        />
      ) : isTaskEditorOpen && (!userId || !selectedWard) ? (
        <Dialog
          open={isTaskEditorOpen}
          onOpenChange={(open) => !open && setIsTaskEditorOpen(false)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Required Information Missing</DialogTitle>
            </DialogHeader>
            <div className="py-6">
              <p className="text-destructive font-semibold">
                {!userId && !selectedWard 
                  ? "User ID and Ward ID are missing" 
                  : !userId 
                    ? "User ID is missing" 
                    : "Ward ID is missing"
                }
              </p>
              <p className="mt-2">
                Please refresh the page and try again. If the issue persists, please contact support.
              </p>
            </div>
            <DialogFooter>
              <button
                className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground"
                onClick={() => setIsTaskEditorOpen(false)}
              >
                Close
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {/* Delete confirmation dialog */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent 
          className="sm:max-w-md max-h-[90vh] overflow-y-auto"
          style={{ position: 'fixed', top: '5vh', transform: 'translateY(0) translateX(-50%)' }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl">Delete Task</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <p className="mb-2">Are you sure you want to delete this task?</p>
            <p className="text-muted-foreground text-sm">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <button
              className="px-4 py-2 rounded-md text-sm font-medium bg-muted hover:bg-muted/80"
              onClick={() => setIsConfirmDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-md text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2 inline-block" />
                  Deleting...
                </>
              ) : (
                'Delete Task'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ToolsPage() {
  const [activeTool, setActiveTool] = useState("Ward Contact Import");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [lastImportDate, setLastImportDate] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [trackedUsers, setTrackedUsers] = useState<{ new: number, existing: number }>({ new: 0, existing: 0 });
  const [message, setMessage] = useState<string>('');
  const [importProgress, setImportProgress] = useState<number | null>(null);
  const [wardBranches, setWardBranches] = useState<WardBranch[]>([]);
  const [selectedWard, setSelectedWard] = useState<string>("");
  const [loadingWards, setLoadingWards] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // JavaScript code to be copied - will be dynamically updated with unit number
  const [scriptCode, setScriptCode] = useState(`(function() {
  fetch('https://directory.churchofjesuschrist.org/api/v4/households?unit=2052520', {
    credentials: 'include'
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok: ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      const fileName = today + '.json';
      
      // Create a Blob from the JSON data
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link to trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up by removing the link and revoking the object URL
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    })
    .catch(error => console.error('Error fetching the ward directory:', error));
})();`);

  // Fetch wards and ward data
  useEffect(() => {
    // Check for authentication
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAuthError(true);
        setLoadingWards(false);
        return;
      }
      
      // Fetch wards from the database
      try {
        const { data: wards, error } = await supabase
          .from('ward_branches')
          .select('*')
          .order('is_primary', { ascending: false })
          .order('name');
          
        if (error) throw error;
        
        setWardBranches(wards || []);
        
        // If we have wards, select the primary one by default
        if (wards && wards.length > 0) {
          const primaryWard = wards.find(ward => ward.is_primary);
          const defaultWardId = primaryWard?.id || wards[0].id;
          const defaultUnitNumber = primaryWard?.unit_number || wards[0]?.unit_number;
          
          setSelectedWard(defaultWardId);
          
          // Update script code with the primary ward's unit number
          if (defaultUnitNumber) {
            updateScriptWithUnitNumber(defaultUnitNumber);
          }
        }
        
        // Check for last import date in localStorage
        const storedLastImport = localStorage.getItem('wardContactLastImport');
        if (storedLastImport) {
          setLastImportDate(storedLastImport);
        }
  
        // Also fetch last import from database
        try {
          const result = await getLastWardDataImport();
          if (result.error) {
            if (result.error === "Not authenticated") {
              setAuthError(true);
            } else {
              console.error("Error fetching last import:", result.error);
            }
          } else if (result.data) {
            const dbImportDate = new Date(result.data.imported_at).toLocaleString();
            if (!storedLastImport || new Date(result.data.imported_at) > new Date(storedLastImport)) {
              setLastImportDate(dbImportDate);
              localStorage.setItem('wardContactLastImport', dbImportDate);
            }
          }
        } catch (err) {
          console.error("Error fetching last import date:", err);
        }
      } catch (error) {
        console.error("Error fetching wards:", error);
      } finally {
        setLoadingWards(false);
      }
    };

    checkAuth();
  }, [supabase]);

  // Update script with unit number
  const updateScriptWithUnitNumber = (unitNumber: string) => {
    const newScript = `(function() {
  fetch('https://directory.churchofjesuschrist.org/api/v4/households?unit=${unitNumber}', {
    credentials: 'include'
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok: ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      const fileName = today + '.json';
      
      // Create a Blob from the JSON data
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link to trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up by removing the link and revoking the object URL
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    })
    .catch(error => console.error('Error fetching the ward directory:', error));
})();`;
    setScriptCode(newScript);
  };

  // Handle ward selection change
  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setSelectedWard(selectedId);
    
    // Find the selected ward and update script with its unit number
    const ward = wardBranches.find(w => w.id === selectedId);
    if (ward?.unit_number) {
      updateScriptWithUnitNumber(ward.unit_number);
    }
  };

  // Modified handleFileChange
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  // Modified handleImport to include selected ward ID
  const handleImport = async () => {
    if (!file) {
      setError("Please select a file to import");
      return;
    }

    if (!selectedWard) {
      setError("Please select a ward/branch");
      return;
    }

    setLoading(true);
    setError(null);
    setImportProgress(0);
    setTrackedUsers({ new: 0, existing: 0 });
    
    try {
      // Check authentication first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAuthError(true);
        throw new Error("You must be logged in to import data");
      }
      
      // Find the selected ward to get its unit number
      const ward = wardBranches.find(w => w.id === selectedWard);
      if (!ward) {
        throw new Error("Selected ward not found");
      }
      
      // Read the file
      const fileContent = await file.text();
      let jsonData;
      
      // Initialize arrays before JSON parsing
      const allMembers = [];
      const trackedUsers: { firstName: string, lastName: string, result: any }[] = [];
      
      try {
        jsonData = JSON.parse(fileContent);
        
        // Log the basic structure for diagnostic purposes
        console.log("JSON Data Top-Level Structure:", Object.keys(jsonData));
        
        // Check if it's an array at the top level
        if (Array.isArray(jsonData)) {
          console.log("Top-level is an array with", jsonData.length, "items");
          console.log("First item keys:", jsonData[0] ? Object.keys(jsonData[0]) : "empty");
          
          // Add a direct approach to handle this format
          console.log("Looking for household heads in array...");
          let headCount = 0;
          let phoneCount = 0;
          
          // Filter format from docs/ward.json
          for (const household of jsonData) {
            if (household.members && Array.isArray(household.members)) {
              for (const member of household.members) {
                if (member.head === true) {
                  headCount++;
                  if (member.phone) {
                    phoneCount++;
                    // This is a household head with a phone number - add to our list
                    // Add unit_number to the member object
                    member.unit_number = ward.unit_number;
                    allMembers.push(member);
                    console.log(`Found household head with phone: ${member.givenName} ${member.surname}`);
                  } else {
                    console.log(`Found household head WITHOUT phone: ${member.givenName} ${member.surname}`);
                  }
                }
              }
            }
          }
          
          console.log(`Found ${headCount} total household heads, ${phoneCount} with phone numbers`);
        } else {
          // Original structure handling continues below
          // Extract from households if available
          if (jsonData.households && Array.isArray(jsonData.households)) {
            for (const household of jsonData.households) {
              if (household.members && Array.isArray(household.members)) {
                // Only add household heads with phone numbers
                const householdHeads = household.members.filter((member: any) => 
                  member.head === true && 
                  member.phone && 
                  (typeof member.phone === 'object' ? member.phone.number || member.phone.e164 : member.phone)
                ).map((member: any) => {
                  // Add unit_number to the member object
                  member.unit_number = ward.unit_number;
                  return member;
                });
                allMembers.push(...householdHeads);
              }
            }
          }
          
          // If we're using a different structure, handle it similarly
          if (jsonData.members && Array.isArray(jsonData.members)) {
            // Filter for household heads with phone numbers
            const householdHeads = jsonData.members.filter((member: any) => 
              member.head === true && 
              member.phone && 
              (typeof member.phone === 'object' ? member.phone.number || member.phone.e164 : member.phone)
            ).map((member: any) => {
              // Add unit_number to the member object
              member.unit_number = ward.unit_number;
              return member;
            });
            allMembers.push(...householdHeads);
          }
        }
      } catch (e) {
        throw new Error("Invalid JSON file. Please ensure you're importing the correct file.");
      }
      
      // Log the structure of the JSON data to help diagnose issues
      console.log("JSON Data Structure:", Object.keys(jsonData));
      
      // Validate basic structure
      if (!jsonData || typeof jsonData !== 'object') {
        throw new Error("Invalid data format. The file doesn't contain the expected data structure.");
      }
      
      // Store in localStorage
      localStorage.setItem('wardContactData', JSON.stringify(jsonData));
      
      // Clear existing anonymous users for this ward unit number
      try {
        // We'll implement this in the backend actions later
        console.log(`Clearing existing anonymous users for ward unit number: ${ward.unit_number}`);
      } catch (clearError) {
        console.error("Error clearing existing anonymous users:", clearError);
      }
      
      // Start tracking anonymous users
      console.log("Starting anonymous user tracking.");
      
      // Process each household/member
      const batchSize = 10; // Process 10 members at a time
      
      for (let i = 0; i < allMembers.length; i += batchSize) {
        // Update progress
        setImportProgress(Math.round((i / allMembers.length) * 100));
        
        // Get the current batch
        const batch = allMembers.slice(i, i + batchSize);
        console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(allMembers.length / batchSize)}, with ${batch.length} members`);
        
        // Process each member in the batch
        const batchPromises = batch.map(async (member) => {
          try {
            // Extract name data
            const firstName = member.givenName || '';
            const lastName = member.surname || '';
            
            // Extract phone number
            let phoneNumber = '';
            if (typeof member.phone === 'string') {
              phoneNumber = member.phone;
            } else if (typeof member.phone === 'object' && member.phone) {
              phoneNumber = member.phone.number || member.phone.e164 || '';
            }
            
            // Skip records without sufficient data
            if (!firstName || !lastName || !phoneNumber) {
              console.log(`Skipping member due to missing data`, {
                firstName: !!firstName,
                lastName: !!lastName,
                phoneNumber: !!phoneNumber
              });
              return;
            }
            
            // Log the member we're about to track (with limited data for privacy)
            console.log(`Tracking household head: ${firstName} ${lastName}`, 
                        phoneNumber ? `phone ending in: ${phoneNumber.slice(-4)}` : 'no phone');
            
            // Track the anonymous user - adding unit number
            const result = await trackAnonymousUser(firstName, lastName, phoneNumber, ward.unit_number);
            
            if (result.success) {
              trackedUsers.push({ firstName, lastName, result });
              console.log(`Successfully tracked: ${firstName} ${lastName}`);
            } else {
              console.warn(`Failed to track: ${firstName} ${lastName}`, result.error);
              
              // If the failure is due to a database error, retry once
              if (result.error && typeof result.error === 'string' && 
                  (result.error.includes('database') || result.error.includes('timeout'))) {
                console.log(`Retrying tracking for: ${firstName} ${lastName}`);
                // Wait a bit before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                try {
                  const retryResult = await trackAnonymousUser(firstName, lastName, phoneNumber, ward.unit_number);
                  if (retryResult.success) {
                    trackedUsers.push({ firstName, lastName, result: retryResult });
                    console.log(`Successfully tracked on retry: ${firstName} ${lastName}`);
                  } else {
                    console.error(`Failed to track even after retry: ${firstName} ${lastName}`, retryResult.error);
                  }
                } catch (retryErr) {
                  console.error(`Error during retry: ${firstName} ${lastName}`, retryErr);
                }
              }
            }
          } catch (memberError) {
            console.error('Error processing individual member:', memberError);
          }
        });
        
        // Wait for all promises in the batch to complete
        await Promise.all(batchPromises);
        
        // Add a delay between batches to avoid overwhelming the database
        if (i + batchSize < allMembers.length) {
          console.log(`Batch ${i / batchSize + 1} complete, pausing before next batch...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Final progress update to 100%
      setImportProgress(100);
      
      console.log(`Successfully tracked ${trackedUsers.length} household heads.`);
      
      // Log the import - include ward unit number
      await logWardDataImport(allMembers.length, ward.unit_number);
      
      const trackedCount = {
        new: trackedUsers.length,
        existing: 0
      };
      
      setTrackedUsers(trackedCount);
      
      // Process the ward list import to update ward_branch_members
      try {
        console.log(`Processing ward list import for ${ward.unit_number} (ward ID: ${selectedWard})`);
        const processResult = await processWardListImport(ward.unit_number, selectedWard);
        
        if (processResult.success) {
          console.log("Successfully processed ward list import");
          setMessage(`Successfully imported ${allMembers.length} contacts and updated ward memberships.`);
        } else {
          console.warn("Warning: Ward list import processed but ward memberships were not updated:", processResult.error);
          setMessage(`Successfully imported ${allMembers.length} contacts, but there was an issue updating ward memberships.`);
        }
      } catch (processError) {
        console.error("Error processing ward list import:", processError);
        setMessage(`Successfully imported ${allMembers.length} contacts, but there was an error updating ward memberships.`);
      }
      
      setSuccess(true);
      
      // Save last import date to localStorage
      localStorage.setItem('wardContactLastImport', new Date().toISOString());
      
      setTimeout(() => {
        setSuccess(false);
        setImportProgress(null); // Reset progress
      }, 3000);

      // Move the debug output up, before batch processing
      console.log(`Found ${allMembers.length} household heads to process.`);
      
      // Add a sample of the data we found for debugging
      if (allMembers.length > 0) {
        console.log("Sample of first household head found:");
        const sample = allMembers[0];
        console.log({
          givenName: sample.givenName,
          surname: sample.surname,
          phoneType: typeof sample.phone,
          phoneKeys: typeof sample.phone === 'object' ? Object.keys(sample.phone) : 'N/A',
          hasPhoneNumber: typeof sample.phone === 'object' ? !!sample.phone.number : 'N/A',
          hasE164: typeof sample.phone === 'object' ? !!sample.phone.e164 : 'N/A',
          unitNumber: sample.unit_number
        });
      } else {
        console.log("No household heads found. Check the data structure.");
      }
    } catch (error) {
      console.error('Error processing JSON:', error);
      setError(error instanceof Error ? error.message : "An unknown error occurred during import");
    } finally {
      setLoading(false);
    }
  };

  // Define available tools
  const tools = [
    { name: "Ward Contact Import" },
    { name: "Task Builder" },
    // Add more tools here later
  ];

  // Conditional rendering logic moved inside the main return
  const renderToolContent = () => {
    if (activeTool === "Ward Contact Import") {
      // Handle loading state for wards specifically for this tool
      if (loadingWards) {
        return (
          <div className="flex items-center justify-center h-60">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        );
      }

      // Handle Auth Error specifically for this tool
      if (authError) {
        return (
          <div className="space-y-6">
             <h1 className="text-3xl font-bold">Ward Contact Import Tool</h1>
            <div className="bg-amber-50 text-amber-800 p-6 rounded-lg border border-amber-200">
              <h2 className="text-xl font-medium mb-2">Authentication Required</h2>
              <p className="mb-4">You need to be logged in to use this tool.</p>
              <button
                onClick={() => router.push('/auth/login')}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
              >
                Go to Login
              </button>
            </div>
          </div>
        );
      }

      // Handle No Wards Found specifically for this tool
      if (!loadingWards && wardBranches.length === 0) {
        return (
          <div className="space-y-6">
             <h1 className="text-3xl font-bold">Ward Contact Import Tool</h1>
            <div className="bg-amber-50 text-amber-800 p-6 rounded-lg border border-amber-200">
              <h2 className="text-xl font-medium mb-2">No Wards or Branches Found</h2>
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p>
                  You need to set up at least one ward or branch before using this tool. 
                  Please go to Settings to add your ward or branch information.
                </p>
              </div>
              <button 
                onClick={() => router.push('/app/settings')}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
              >
                Go to Settings
              </button>
            </div>
          </div>
        );
      }

      // Render the main tool content if authenticated and wards exist
      return (
        <div className="space-y-6">
           <h1 className="text-3xl font-bold">Ward Contact Import Tool</h1>

          <div className="bg-card rounded-lg border p-6 mb-6">
            <h2 className="text-xl font-medium mb-4">Data Privacy Notice</h2>
            <p className="mb-3 text-muted-foreground">
              The data you import is <strong>stored locally on your device</strong> and is not shared with anyone.
              It's used only for coordinating ward cleaning assignments within this application.
            </p>
            <p className="mb-3 text-muted-foreground">
              For tracking purposes only, a secure, anonymous hash of partial contact information is stored in the database.
              No personally identifiable information is retained in this process.
            </p>

            {lastImportDate && (
              <div className="mt-4 text-sm p-3 bg-muted rounded-md">
                <strong>Last import:</strong> {lastImportDate}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="bg-card rounded-lg border p-6 lg:col-span-7">
              <h2 className="text-xl font-medium mb-6">Step-by-Step Instructions</h2>

              <div className="mb-6">
                <label htmlFor="selectedWard" className="block text-sm font-medium mb-2">
                  Select a Ward/Branch
                </label>
                {/* Loading state handled above, directly render select */}
                <select
                  id="selectedWard"
                  value={selectedWard}
                  onChange={handleWardChange}
                  className="w-full px-3 py-2 border rounded-md bg-background" // Added bg-background
                  disabled={wardBranches.length === 0 || loading} // Disable during import loading too
                >
                  {wardBranches.map(ward => (
                    <option key={ward.id} value={ward.id}>
                      {ward.name}{ward.is_primary ? ' (Primary)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <InstructionStep
                number={1}
                title="Log in to churchofjesuschrist.org"
                description="Visit https://churchofjesuschrist.org and log in with your Church account."
              />

              <InstructionStep
                number={2}
                title="Navigate to Ward Directory"
                description="Go to the Ward Directory and Map page for the selected Ward/Branch above."
              />

              <InstructionStep
                number={3}
                title="Open Developer Tools"
                description={
                  <div>
                    Press <code className="bg-muted px-1 py-0.5 rounded">Ctrl + Shift + I</code> (or <code className="bg-muted px-1 py-0.5 rounded">Cmd + Option + I</code> on Mac) to open developer tools.
                  </div>
                }
              />

              <InstructionStep
                number={4}
                title="Enable Pasting"
                description={
                  <div>
                    Click on the Console tab, type <code className="bg-muted px-1 py-0.5 rounded">allow pasting</code> and press Enter. You might need to do this each time you open the console.
                  </div>
                }
              />

              <InstructionStep
                number={5}
                title="Run Script"
                description={
                  <div>
                    <p className="mb-3">Copy and paste the following script (updated for your selected ward) into the console and press Enter:</p>
                    <div className="w-full overflow-hidden" style={{ maxWidth: "100%" }}>
                      <CodeBlock code={scriptCode} />
                    </div>
                     <p className="text-xs text-muted-foreground mt-2">This will download a file named like YYYY-MM-DD.json.</p>
                  </div>
                }
              />

              <InstructionStep
                number={6}
                title="Import the Downloaded File"
                description="Select the downloaded JSON file below to import your ward's contact information."
              />
            </div>

            <div className="bg-card rounded-lg border p-6 lg:col-span-5">
              <h2 className="text-xl font-medium mb-4">Import Ward Contacts</h2>

              <div className="mb-6">
                <label htmlFor="fileInput" className="block text-sm font-medium mb-2">Select the downloaded JSON file</label>
                <input
                  id="fileInput"
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  disabled={loading} // Disable during import
                  className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                  {importProgress !== null && (
                    <div className="w-full mt-2">
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div
                          className="bg-primary h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${importProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-center mt-1">{importProgress}% Complete</p>
                    </div>
                  )}
                  <p className="text-sm mt-2">Importing contacts...</p>
                </div>
              ) : (
                <button
                  onClick={handleImport}
                  disabled={!file || !selectedWard || loadingWards || authError} // More robust disabled check
                  className={`w-full px-4 py-2 rounded-md text-sm font-medium text-white transition-colors ${
                    !file || !selectedWard || loadingWards || authError
                      ? 'bg-primary/50 cursor-not-allowed'
                      : 'bg-primary hover:bg-primary/90'
                  }`}
                >
                  Import Contacts
                </button>
              )}

              {success && message && ( // Check for message content too
                <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
                  <p>{message}</p>
                  {(trackedUsers.new > 0) && ( // Simplified display
                    <p className="text-xs mt-1">
                      {trackedUsers.new} household head{trackedUsers.new !== 1 ? 's' : ''} tracked.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (activeTool === "Task Builder") {
      return (
        <TaskBuilderTool 
          wardBranches={wardBranches}
          selectedWard={selectedWard}
          authError={authError}
        />
      );
    }

    // Default case if no tool matches (shouldn't happen with current setup)
    return <div>Select a tool from the menu.</div>;
  };


  return (
     <div className="space-y-6">
      <h1 className="text-3xl font-bold">Tools</h1> {/* Main page title */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Tool Navigation */}
        <div className="md:col-span-1">
          <nav className="bg-card rounded-lg border overflow-hidden sticky top-20"> {/* Added sticky top */}
            <div className="p-2">
              {tools.map((tool) => (
                <button
                  key={tool.name}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTool === tool.name
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted' // Ensure text color contrast
                  }`}
                  onClick={() => {
                     setActiveTool(tool.name);
                     // Reset tool-specific states if necessary when switching
                     setError(null);
                     setSuccess(false);
                     setMessage('');
                     setFile(null);
                     setImportProgress(null);
                     // Don't reset ward selection or list
                  }}
                >
                  {tool.name}
                </button>
              ))}
            </div>
          </nav>
        </div>

        {/* Tool Content Area */}
        <div className="md:col-span-3 space-y-6">
          {renderToolContent()}
        </div>
      </div>
    </div>
  );
} 