"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/utils/supabase/client";
import { Edit, PlusIcon, SearchIcon, Star, StarIcon, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Define the Campaign type
interface Campaign {
  id: string;
  name: string;
  content: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Token type for personalization
interface Token {
  key: string;
  label: string;
  description: string;
  example: string;
}

// Available tokens for personalization
const TOKENS: Token[] = [
  { 
    key: "{first}", 
    label: "First Name", 
    description: "Member's first name", 
    example: "John" 
  },
  { 
    key: "{last}", 
    label: "Last Name", 
    description: "Member's last name",
    example: "Smith" 
  },
  { 
    key: "{group}", 
    label: "Group", 
    description: "Alphabetical group assignment",
    example: "B" 
  },
  { 
    key: "{schedule}", 
    label: "Schedule", 
    description: "Cleaning schedule details",
    example: "Saturday, May 15th at 9:00 AM" 
  }
];

// Sample members for previewing messages
const SAMPLE_MEMBERS = [
  { first: "John", last: "Smith", group: "A", schedule: "Saturday, May 15th at 9:00 AM" },
  { first: "Jane", last: "Doe", group: "B", schedule: "Wednesday, May 19th at 6:00 PM" },
  { first: "Michael", last: "Johnson", group: "C", schedule: "Monday, May 17th at 7:30 PM" }
];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("updated");
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [newCampaign, setNewCampaign] = useState<Partial<Campaign>>({
    name: "",
    content: "",
    is_default: false
  });
  const [isCreating, setIsCreating] = useState(false);
  const [selectedMemberIndex, setSelectedMemberIndex] = useState(0);
  const [hasFetched, setHasFetched] = useState(false);

  const supabase = createClient();

  // Fetch campaigns from Supabase
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      console.log("Fetching campaigns with sort:", sortOption);
      
      // Get the current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("Auth error:", userError);
        throw new Error("User authentication required to view campaigns");
      }
      
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order(sortOption === "name" ? "name" : sortOption === "created" ? "created_at" : "updated_at", { ascending: sortOption === "name" });

      if (error) {
        console.error("Supabase error fetching campaigns:", error);
        throw new Error(`Database fetch error: ${error.message} (Code: ${error.code})`);
      }

      console.log("Campaigns fetched:", data?.length || 0);
      setCampaigns(data || []);
      setHasFetched(true);
    } catch (error) {
      console.error("Detailed error fetching campaigns:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  // Load campaigns when component mounts
  useEffect(() => {
    fetchCampaigns();
  }, [sortOption]);

  // Filter campaigns based on search query
  const filteredCampaigns = campaigns.filter(campaign => 
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create a new campaign
  const createCampaign = async () => {
    try {
      if (!newCampaign.name || !newCampaign.content) {
        toast.error("Campaign name and content are required");
        return;
      }

      setLoading(true);
      
      // Get the current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("Auth error:", userError);
        throw new Error("User authentication required to create campaigns");
      }
      
      // If this is the first campaign, make it default
      const shouldBeDefault = campaigns.length === 0 ? true : !!newCampaign.is_default;
      
      // Log the data we're sending
      console.log("Creating campaign with data:", {
        user_id: user.id,
        name: newCampaign.name,
        content: newCampaign.content,
        is_default: shouldBeDefault
      });
      
      const { data, error } = await supabase
        .from("campaigns")
        .insert({
          user_id: user.id,
          name: newCampaign.name,
          content: newCampaign.content,
          is_default: shouldBeDefault
        })
        .select();

      if (error) {
        console.error("Supabase error details:", error);
        throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
      }

      console.log("Campaign created successfully:", data);
      
      setCampaigns([...(data || []), ...campaigns]);
      setNewCampaign({ name: "", content: "", is_default: false });
      setIsCreating(false);
      toast.success("Campaign created successfully");
      
      // Refresh campaigns to get accurate data after trigger execution
      fetchCampaigns();
    } catch (error) {
      console.error("Detailed error creating campaign:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  // Update an existing campaign
  const updateCampaign = async () => {
    try {
      if (!editingCampaign || !editingCampaign.name || !editingCampaign.content) {
        toast.error("Campaign name and content are required");
        return;
      }

      setLoading(true);
      
      // Get the current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("Auth error:", userError);
        throw new Error("User authentication required to update campaigns");
      }
      
      console.log("Updating campaign with data:", {
        id: editingCampaign.id,
        user_id: user.id,
        name: editingCampaign.name,
        content: editingCampaign.content,
        is_default: editingCampaign.is_default
      });
      
      const { error } = await supabase
        .from("campaigns")
        .update({
          name: editingCampaign.name,
          content: editingCampaign.content,
          is_default: editingCampaign.is_default
        })
        .eq("id", editingCampaign.id)
        .eq("user_id", user.id); // Ensure we're only updating the user's own campaigns

      if (error) {
        console.error("Supabase error updating campaign:", error);
        throw new Error(`Database update error: ${error.message} (Code: ${error.code})`);
      }

      // Update local campaigns state
      setCampaigns(campaigns.map(c => 
        c.id === editingCampaign.id ? editingCampaign : c
      ));
      
      setEditingCampaign(null);
      toast.success("Campaign updated successfully");
      
      // Refresh campaigns to get accurate data after trigger execution
      fetchCampaigns();
    } catch (error) {
      console.error("Detailed error updating campaign:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update campaign");
    } finally {
      setLoading(false);
    }
  };

  // Delete a campaign
  const deleteCampaign = async (id: string, isDefault: boolean) => {
    try {
      setLoading(true);
      
      // Get the current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("Auth error:", userError);
        throw new Error("User authentication required to delete campaigns");
      }
      
      console.log("Deleting campaign:", id, "isDefault:", isDefault, "user_id:", user.id);
      
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id); // Ensure we're only deleting the user's own campaigns

      if (error) {
        console.error("Supabase error deleting campaign:", error);
        throw new Error(`Database delete error: ${error.message} (Code: ${error.code})`);
      }

      // Update local campaigns state
      setCampaigns(campaigns.filter(c => c.id !== id));
      
      toast.success("Campaign deleted successfully");
      
      // If the deleted campaign was default, prompt to select a new default
      if (isDefault && campaigns.length > 1) {
        toast.info("Please select a new default campaign");
      }
    } catch (error) {
      console.error("Detailed error deleting campaign:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete campaign");
    } finally {
      setLoading(false);
    }
  };

  // Set a campaign as default
  const setDefaultCampaign = async (id: string) => {
    try {
      setLoading(true);
      
      // Get the current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("Auth error:", userError);
        throw new Error("User authentication required to set default campaign");
      }
      
      console.log("Setting campaign as default:", id, "user_id:", user.id);
      
      const { error } = await supabase
        .from("campaigns")
        .update({ is_default: true })
        .eq("id", id)
        .eq("user_id", user.id); // Ensure we're only updating the user's own campaigns

      if (error) {
        console.error("Supabase error setting default campaign:", error);
        throw new Error(`Database update error: ${error.message} (Code: ${error.code})`);
      }

      toast.success("Default campaign updated");
      
      // Refresh campaigns to get accurate data after trigger execution
      fetchCampaigns();
    } catch (error) {
      console.error("Detailed error setting default campaign:", error);
      toast.error(error instanceof Error ? error.message : "Failed to set default campaign");
    } finally {
      setLoading(false);
    }
  };

  // Insert a token into the message content
  const insertToken = (token: Token) => {
    if (isCreating) {
      // Get the textarea element
      const textarea = document.getElementById('content') as HTMLTextAreaElement;
      if (textarea) {
        // Store current cursor position
        const cursorPos = textarea.selectionStart;
        
        // Get text before and after cursor
        const textBefore = newCampaign.content?.substring(0, cursorPos) || '';
        const textAfter = newCampaign.content?.substring(cursorPos) || '';
        
        // Insert token at cursor position (without extra spaces)
        const newContent = textBefore + token.key + textAfter;
        
        // Update state
        setNewCampaign({
          ...newCampaign,
          content: newContent
        });
        
        // Set timeout to place cursor right after the inserted token
        setTimeout(() => {
          const newCursorPos = cursorPos + token.key.length;
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      } else {
        // Fallback if textarea element not found
        setNewCampaign({
          ...newCampaign,
          content: `${newCampaign.content || ''}${token.key}`
        });
      }
    } else if (editingCampaign) {
      // Get the textarea element
      const textarea = document.getElementById('edit-content') as HTMLTextAreaElement;
      if (textarea) {
        // Store current cursor position
        const cursorPos = textarea.selectionStart;
        
        // Get text before and after cursor
        const textBefore = editingCampaign.content?.substring(0, cursorPos) || '';
        const textAfter = editingCampaign.content?.substring(cursorPos) || '';
        
        // Insert token at cursor position (without extra spaces)
        const newContent = textBefore + token.key + textAfter;
        
        // Update state
        setEditingCampaign({
          ...editingCampaign,
          content: newContent
        });
        
        // Set timeout to place cursor right after the inserted token
        setTimeout(() => {
          const newCursorPos = cursorPos + token.key.length;
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      } else {
        // Fallback if textarea element not found
        setEditingCampaign({
          ...editingCampaign,
          content: `${editingCampaign.content || ''}${token.key}`
        });
      }
    }
  };

  // Replace tokens with sample data in preview
  const previewMessage = (content: string, memberIndex: number = 0): string => {
    if (!content) return "";
    
    const member = SAMPLE_MEMBERS[memberIndex];
    let preview = content;
    
    // Replace each token with its sample value
    Object.entries(member).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`{${key}}`, "g"), value);
    });
    
    return preview;
  };

  // Count characters and calculate SMS segments
  const countCharacters = (content: string): { chars: number, segments: number } => {
    const chars = content ? content.length : 0;
    const segments = Math.ceil(chars / 160);
    return { chars, segments };
  };

  // Get formatted date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">Create and manage message templates for member communications</p>
        </div>
        <Button 
          onClick={() => setIsCreating(true)}
          className="whitespace-nowrap"
        >
          <PlusIcon className="mr-2 h-4 w-4" /> New Campaign
        </Button>
      </div>

      {/* Filtering and Sorting Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search campaigns..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Sort by: {sortOption === "name" ? "Name" : sortOption === "created" ? "Date Created" : "Recently Updated"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSortOption("name")}>Name</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOption("created")}>Date Created</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOption("updated")}>Recently Updated</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Campaign List */}
      <div className="space-y-4">
        <h2 className="text-xl font-medium flex items-center gap-2">
          Available Campaigns
          <span className="text-sm font-normal text-muted-foreground">
            ({filteredCampaigns.length} {filteredCampaigns.length === 1 ? 'campaign' : 'campaigns'})
          </span>
        </h2>

        {loading && !hasFetched ? (
          <div className="text-center py-8">Loading campaigns...</div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-8 border rounded-lg">
            <p className="text-muted-foreground">No campaigns found{searchQuery ? ' matching your search' : ''}.</p>
            {!searchQuery && (
              <Button 
                variant="link" 
                onClick={() => setIsCreating(true)}
                className="mt-2"
              >
                Create your first campaign
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCampaigns.map((campaign) => (
              <Card 
                key={campaign.id} 
                className={`overflow-hidden transition-all ${campaign.is_default ? 'ring-1 ring-primary' : ''}`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-start justify-between">
                    <span className="flex items-center gap-2">
                      {campaign.name}
                      {campaign.is_default && (
                        <StarIcon className="h-4 w-4 text-yellow-500 inline" />
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Updated {formatDate(campaign.updated_at)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {campaign.content}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingCampaign(campaign)}
                    >
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    {!campaign.is_default && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setDefaultCampaign(campaign.id)}
                      >
                        <Star className="h-4 w-4 mr-1" /> Set Default
                      </Button>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this campaign?")) {
                        deleteCampaign(campaign.id, campaign.is_default);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Campaign Dialog */}
      <Dialog 
        open={isCreating} 
        onOpenChange={(open) => {
          if (!open && !loading) {
            setIsCreating(false);
            setNewCampaign({ name: "", content: "", is_default: false });
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Create a message template with personalization tokens for member communications
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input 
                id="name" 
                placeholder="e.g., Weekly Reminder"
                value={newCampaign.name || ''}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
              />
            </div>

            <Tabs defaultValue="editor" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="editor">Message Editor</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="editor" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="content">Message Content</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {TOKENS.map((token) => (
                      <Button
                        key={token.key}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => insertToken(token)}
                        title={token.description}
                      >
                        {token.label}
                      </Button>
                    ))}
                  </div>
                  <Textarea 
                    id="content" 
                    placeholder="Enter your message content here..."
                    rows={5}
                    value={newCampaign.content || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewCampaign({ ...newCampaign, content: e.target.value })}
                    className="font-mono"
                  />
                  <div className="text-xs text-muted-foreground">
                    {countCharacters(newCampaign.content || '').chars} characters
                    {' / '}
                    {countCharacters(newCampaign.content || '').segments} SMS message{countCharacters(newCampaign.content || '').segments !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="is_default" 
                    checked={newCampaign.is_default}
                    onCheckedChange={(checked) => 
                      setNewCampaign({ ...newCampaign, is_default: checked as boolean })
                    }
                  />
                  <label
                    htmlFor="is_default"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Set as default campaign
                  </label>
                </div>
              </TabsContent>
              
              <TabsContent value="preview" className="space-y-4">
                <div className="space-y-2">
                  <Label>Preview with sample data</Label>
                  <div className="flex gap-2 mb-2">
                    {SAMPLE_MEMBERS.map((member, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant={selectedMemberIndex === index ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedMemberIndex(index)}
                      >
                        {member.first} {member.last}
                      </Button>
                    ))}
                  </div>
                  <div className="border rounded-md p-4 bg-muted/50 whitespace-pre-wrap">
                    {previewMessage(newCampaign.content || '', selectedMemberIndex)}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreating(false);
                setNewCampaign({ name: "", content: "", is_default: false });
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={createCampaign}
              disabled={loading || !newCampaign.name || !newCampaign.content}
            >
              {loading ? "Creating..." : "Create Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Dialog */}
      <Dialog 
        open={!!editingCampaign} 
        onOpenChange={(open) => {
          if (!open && !loading) {
            setEditingCampaign(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>
              Update your message template for member communications
            </DialogDescription>
          </DialogHeader>

          {editingCampaign && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Campaign Name</Label>
                <Input 
                  id="edit-name" 
                  value={editingCampaign.name}
                  onChange={(e) => setEditingCampaign({ ...editingCampaign, name: e.target.value })}
                />
              </div>

              <Tabs defaultValue="editor" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="editor">Message Editor</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                
                <TabsContent value="editor" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-content">Message Content</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {TOKENS.map((token) => (
                        <Button
                          key={token.key}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => insertToken(token)}
                          title={token.description}
                        >
                          {token.label}
                        </Button>
                      ))}
                    </div>
                    <Textarea 
                      id="edit-content" 
                      rows={5}
                      value={editingCampaign.content}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingCampaign({ ...editingCampaign, content: e.target.value })}
                      className="font-mono"
                    />
                    <div className="text-xs text-muted-foreground">
                      {countCharacters(editingCampaign.content).chars} characters
                      {' / '}
                      {countCharacters(editingCampaign.content).segments} SMS message{countCharacters(editingCampaign.content).segments !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="edit-is_default" 
                      checked={editingCampaign.is_default}
                      onCheckedChange={(checked) => 
                        setEditingCampaign({ ...editingCampaign, is_default: checked as boolean })
                      }
                      disabled={editingCampaign.is_default}
                    />
                    <label
                      htmlFor="edit-is_default"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Set as default campaign
                    </label>
                  </div>
                </TabsContent>
                
                <TabsContent value="preview" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Preview with sample data</Label>
                    <div className="flex gap-2 mb-2">
                      {SAMPLE_MEMBERS.map((member, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant={selectedMemberIndex === index ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedMemberIndex(index)}
                        >
                          {member.first} {member.last}
                        </Button>
                      ))}
                    </div>
                    <div className="border rounded-md p-4 bg-muted/50 whitespace-pre-wrap">
                      {previewMessage(editingCampaign.content, selectedMemberIndex)}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditingCampaign(null)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              className="mr-auto"
              onClick={() => {
                if (editingCampaign && confirm("Are you sure you want to delete this campaign?")) {
                  deleteCampaign(editingCampaign.id, editingCampaign.is_default);
                  setEditingCampaign(null);
                }
              }}
              disabled={loading}
            >
              Delete
            </Button>
            <Button 
              onClick={updateCampaign}
              disabled={loading || !editingCampaign?.name || !editingCampaign?.content}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 