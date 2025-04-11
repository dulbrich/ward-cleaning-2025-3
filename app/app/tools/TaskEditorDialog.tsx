"use client";

import { Loader2, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { Button } from "../../../components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { createWardTask, updateWardTask, uploadTaskImage } from "./actions";

// Dynamically import the WYSIWYG editor to prevent SSR issues
const RichTextEditor = dynamic(() => import('react-simple-wysiwyg'), {
  ssr: false,
  loading: () => <div className="border rounded-md h-40 flex items-center justify-center bg-muted"><Loader2 className="h-6 w-6 animate-spin" /></div>
});

// Define standard WYSIWYG toolbar configuration
const editorToolbarButtons = [
  'bold', 'italic', 'underline', 'strikethrough', 
  'orderedList', 'unorderedList', 
  'link', 'image'
];

// Helper function to check if any value is empty or just whitespace
const isEmptyValue = (value: any): boolean => {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  return false;
};

// Helper function to validate UUID format
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

interface WardTask {
  id?: string;
  ward_id: string;
  title: string;
  subtitle?: string;
  instructions: string;
  equipment?: string;
  safety?: string;
  image_url?: string;
  color?: string;
  active?: boolean;
  created_by: string;
  template_id?: string;
  priority?: string;
  kid_friendly?: boolean;
}

interface TaskEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialTask: WardTask | null;
  wardId: string;
  userId: string;
  onSave: () => void;
}

const TASK_COLORS = [
  { name: "Red", value: "#ef4444" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
  { name: "Orange", value: "#f97316" },
  { name: "Teal", value: "#14b8a6" },
];

export function TaskEditorDialog({
  isOpen,
  onClose,
  initialTask,
  wardId,
  userId,
  onSave,
}: TaskEditorDialogProps) {
  const [task, setTask] = useState<WardTask>({
    ward_id: wardId,
    title: "",
    instructions: "",
    created_by: userId,
    active: true,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Initialize task when dialog opens or initialTask changes
  useEffect(() => {
    if (initialTask) {
      setTask({
        ...initialTask,
        // Ensure these critical fields are set correctly
        ward_id: initialTask.ward_id || wardId,
        created_by: initialTask.created_by || userId
      });
      
      if (initialTask.image_url) {
        setImagePreview(initialTask.image_url);
      }
    } else {
      // For new tasks, make sure required fields are set
      if (!wardId) {
        console.error("No ward ID provided for new task");
      }
      if (!userId) {
        console.error("No user ID provided for new task");
      }
      
      setTask({
        ward_id: wardId,
        title: "",
        instructions: "",
        created_by: userId,
        active: true,
      });
      setImagePreview(null);
      setImageFile(null);
    }
    
    setError(null);
  }, [initialTask, wardId, userId, isOpen]);
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTask(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle WYSIWYG editor changes
  const handleEditorChange = (name: string) => (e: any) => {
    setTask(prev => ({ ...prev, [name]: e.target.value }));
  };
  
  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, etc.)');
      return;
    }
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }
    
    setImageFile(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle image removal
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setTask(prev => ({ ...prev, image_url: undefined }));
  };
  
  // Handle color selection
  const handleColorSelect = (color: string) => {
    setTask(prev => ({ ...prev, color }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!task.title.trim()) {
      setError('Title is required');
      return;
    }

    // Validate required UUID fields are not empty strings
    if (isEmptyValue(task.ward_id)) {
      setError('Ward ID is missing. Please try refreshing the page.');
      return;
    }

    if (isEmptyValue(task.created_by)) {
      setError('User ID is missing. Please try refreshing the page.');
      return;
    }

    // Only check task ID if we're editing (when it should exist and be valid)
    // For new tasks, the ID field might be an empty string or undefined, which is expected
    if (task.id !== undefined && task.id !== null && task.id !== '' && !isValidUUID(task.id)) {
      setError('Task ID is invalid. Please try again.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Upload image if one is selected
      if (imageFile) {
        setIsUploading(true);
        const uploadResult = await uploadTaskImage(imageFile);
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to upload image');
        }
        
        setTask(prev => ({ ...prev, image_url: uploadResult.data?.url }));
        setIsUploading(false);
      }
      
      // Create or update the task
      const taskWithRequiredFields = {
        ...task,
        equipment: task.equipment || '',
        active: task.active === undefined ? true : task.active,
        image_url: imageFile ? undefined : task.image_url,
        // Ensure template_id is never an empty string
        template_id: isEmptyValue(task.template_id) ? undefined : task.template_id
      };
      
      // For new tasks, remove the ID field if it's empty
      if (isEmptyValue(taskWithRequiredFields.id)) {
        delete taskWithRequiredFields.id;
      }
      
      // Log the task being sent (for debugging)
      console.log('Saving task:', JSON.stringify(taskWithRequiredFields));
      
      const result = task.id && !isEmptyValue(task.id)
        ? await updateWardTask({
            id: task.id,
            ...taskWithRequiredFields
          })
        : await createWardTask(taskWithRequiredFields);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save task');
      }
      
      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving task:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>
            {initialTask
              ? 'Update the task details'
              : 'Fill in the details to create a new cleaning task'}
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={task.title}
                onChange={handleChange}
                placeholder="Enter task title"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="subtitle">Subtitle (Optional)</Label>
              <Input
                id="subtitle"
                name="subtitle"
                value={task.subtitle || ''}
                onChange={handleChange}
                placeholder="Enter optional subtitle"
              />
            </div>
            
            <div>
              <Label htmlFor="instructions">Instructions</Label>
              <div className="rsw-editor-wrapper">
                <RichTextEditor
                  value={task.instructions}
                  onChange={handleEditorChange('instructions')}
                  className="min-h-[150px]"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Use the toolbar to format text, create lists, and add other formatting. For lists, use the numbered list (ordered) or bullet list (unordered) buttons.
              </p>
            </div>
            
            <div>
              <Label htmlFor="equipment">Equipment (Optional)</Label>
              <div className="rsw-editor-wrapper">
                <RichTextEditor
                  value={task.equipment || ''}
                  onChange={handleEditorChange('equipment')}
                  className="min-h-[100px]"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="safety">Safety Guidelines (Optional)</Label>
              <div className="rsw-editor-wrapper">
                <RichTextEditor
                  value={task.safety || ''}
                  onChange={handleEditorChange('safety')}
                  className="min-h-[100px]"
                />
              </div>
            </div>
            
            <div>
              <Label>Task Color (Optional)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {TASK_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-8 h-8 rounded-full hover:ring-2 hover:ring-offset-2 ${
                      task.color === color.value ? 'ring-2 ring-offset-2 ring-black' : ''
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => handleColorSelect(color.value)}
                    title={color.name}
                  />
                ))}
                {task.color && (
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full border border-dashed flex items-center justify-center text-muted-foreground"
                    onClick={() => setTask(prev => ({ ...prev, color: undefined }))}
                    title="Clear color"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid gap-4 py-4">
              {/* Priority selection */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priority" className="text-right">
                  Priority
                </Label>
                <div className="col-span-3">
                  <select
                    id="priority"
                    name="priority"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={task.priority || ""}
                    onChange={(e) => setTask(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="">Normal</option>
                    <option value="do_first">Do First</option>
                    <option value="do_last">Do Last</option>
                  </select>
                </div>
              </div>

              {/* Kid-friendly checkbox */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="kid_friendly" className="text-right">
                  Kid-friendly
                </Label>
                <div className="col-span-3 flex items-center">
                  <input
                    type="checkbox"
                    id="kid_friendly"
                    name="kid_friendly"
                    className="mr-2 h-4 w-4 rounded border-gray-300"
                    checked={task.kid_friendly || false}
                    onChange={(e) => setTask(prev => ({ ...prev, kid_friendly: e.target.checked }))}
                  />
                  <span className="text-sm text-muted-foreground">
                    This task is suitable for children
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading || isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isUploading}
            >
              {isLoading || isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                initialTask ? 'Update Task' : 'Create Task'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// At the end of the file, add a style tag to fix the WYSIWYG list rendering
export function TaskEditorDialogStyles() {
  return (
    <style jsx global>{`
      /* Ensure lists render properly in the editor and output */
      .rsw-editor ul, .prose ul {
        list-style-type: disc !important;
        padding-left: 2rem !important;
        margin: 1rem 0 !important;
        display: block !important;
      }
      
      .rsw-editor ol, .prose ol {
        list-style-type: decimal !important;
        padding-left: 2rem !important;
        margin: 1rem 0 !important;
        display: block !important;
      }
      
      .rsw-editor li, .prose li {
        margin: 0.5rem 0 !important;
        display: list-item !important;
      }
      
      /* Fix editor display */
      .rsw-editor {
        border: 1px solid #e2e8f0;
        border-radius: 0.375rem;
      }
      
      .rsw-toolbar {
        border-bottom: 1px solid #e2e8f0;
        padding: 0.5rem;
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        background-color: #f8f9fa;
      }

      /* Make toolbar buttons more visible and consistent */
      .rsw-toolbar button {
        padding: 5px;
        border-radius: 4px;
        border: 1px solid transparent;
      }

      .rsw-toolbar button:hover {
        background-color: #f1f5f9;
        border-color: #e2e8f0;
      }

      .rsw-toolbar button.active {
        background-color: #e2e8f0;
        border-color: #cbd5e1;
      }
      
      .rsw-ce {
        padding: 0.75rem;
        min-height: 100px;
        max-height: 400px;
        overflow-y: auto;
      }

      /* Improve focus states */
      .rsw-editor:focus-within {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
      
      /* Make sure lists are clearly visible while editing */
      .rsw-ce ul {
        list-style-type: disc !important;
        padding-left: 2rem !important;
        display: block !important;
      }
      
      .rsw-ce ol {
        list-style-type: decimal !important;
        padding-left: 2rem !important;
        display: block !important;
      }
      
      .rsw-ce li {
        display: list-item !important;
      }
      
      /* Fix dialog positioning */
      .sm\:max-w-2xl {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
    `}</style>
  );
}

// Modify the main component export to include the styles
export function TaskEditorDialogWithStyles(props: TaskEditorDialogProps) {
  return (
    <>
      <TaskEditorDialogStyles />
      <TaskEditorDialog {...props} />
    </>
  );
} 