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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";
import {
    Check,
    CheckCircle2,
    ChevronDown,
    MessageSquare,
    RefreshCw,
    Search,
    Star,
    X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Contact, checkDoNotContactStatus } from "../contacts/actions";

// Campaign type
interface Campaign {
  id: string;
  name: string;
  content: string;
  is_default: boolean;
}

// Internal contact type with added fields we need for the UI
interface ContactWithMessagingInfo {
  // Original contact data
  originalContact: Contact;
  // Added fields for UI
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  phone: string;
  group: string;
  messageSent: boolean;
}

// Group selectors
const GROUP_OPTIONS = [
  { value: "all", label: "All Groups" },
  { value: "A-F", label: "Group A-F" },
  { value: "G-M", label: "Group G-M" },
  { value: "N-S", label: "Group N-S" },
  { value: "T-Z", label: "Group T-Z" }
];

export default function MessengerPage() {
  const [contacts, setContacts] = useState<ContactWithMessagingInfo[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("all");
  const [showOnlyNonUsers, setShowOnlyNonUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [previewContact, setPreviewContact] = useState<ContactWithMessagingInfo | null>(null);

  const supabase = createClient();

  // Load campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoadingCampaigns(true);
        
        // Fetch user from auth to ensure we have user context
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error("Not authenticated");
        }
        
        // Fetch campaigns from the database
        const { data, error } = await supabase
          .from('campaigns')
          .select('*');
        
        if (error) {
          throw error;
        }
        
        // Find default campaign
        let defaultCampaign = data?.find(c => c.is_default);
        
        setCampaigns(data || []);
        
        // Set the default campaign as selected
        if (defaultCampaign) {
          setSelectedCampaign(defaultCampaign);
        } else if (data && data.length > 0) {
          setSelectedCampaign(data[0]);
        }
      } catch (error) {
        console.error("Error fetching campaigns:", error);
        toast.error("Failed to load message templates");
        
        // Create a basic default template if none found
        const defaultTemplate: Campaign = {
          id: "default",
          name: "Default Reminder",
          content: "Hello {first}, this is a reminder that your cleaning assignment is scheduled for {schedule}. You are in group {group}.",
          is_default: true
        };
        
        setCampaigns([defaultTemplate]);
        setSelectedCampaign(defaultTemplate);
      } finally {
        setLoadingCampaigns(false);
      }
    };

    fetchCampaigns();
  }, []);

  // Load contacts from ward data
  useEffect(() => {
    const loadContactsFromWardData = async () => {
      try {
        setLoadingContacts(true);
        
        // Get ward data from localStorage
        const wardContactDataStr = localStorage.getItem('wardContactData');
        if (!wardContactDataStr) {
          toast.error("No ward data found. Please import your ward data first.");
          setLoadingContacts(false);
          return;
        }
        
        const wardData = JSON.parse(wardContactDataStr);
        
        // Extract contacts from households
        const extractedContacts: Contact[] = [];
        
        // Process ward data structure (array of households)
        if (Array.isArray(wardData)) {
          wardData.forEach(household => {
            if (household.members && Array.isArray(household.members)) {
              household.members.forEach((member: any) => {
                // Extract phone
                let phoneNumber = '';
                if (member.phone && member.phone.number) {
                  phoneNumber = member.phone.number;
                } else if (member.phone && member.phone.e164) {
                  phoneNumber = member.phone.e164;
                } else if (typeof member.phone === 'string') {
                  phoneNumber = member.phone;
                }
                
                // Only add if has phone
                if (phoneNumber) {
                  extractedContacts.push({
                    name: member.displayName || member.name,
                    email: member.email ? member.email.email : undefined,
                    phone: phoneNumber,
                    role: member.positions && member.positions.length > 0 ? 
                          member.positions[0].positionTypeName : 'Member',
                    head: member.head === true
                  });
                }
              });
            }
          });
        }
        
        // Filter to only include household heads
        const headContacts = extractedContacts.filter(contact => 
          contact.head === true && contact.phone && contact.phone.trim() !== ''
        );
        
        // Use head contacts if available, otherwise use all contacts with phones
        const contactsToProcess = headContacts.length > 0 ? 
          headContacts : 
          extractedContacts.filter(c => c.phone && c.phone.trim() !== '');
        
        // Format phone numbers
        const formattedContacts = contactsToProcess.map(contact => {
          let formattedPhone = contact.phone || '';
          if (contact.phone) {
            const digitsOnly = contact.phone.replace(/\D/g, '');
            
            if (digitsOnly.length === 10) {
              formattedPhone = `+1 (${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
            } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
              formattedPhone = `+1 (${digitsOnly.slice(1, 4)}) ${digitsOnly.slice(4, 7)}-${digitsOnly.slice(7)}`;
            }
          }
          
          return { ...contact, phone: formattedPhone };
        });
        
        // Check do-not-contact status
        const contactsWithStatus = await checkDoNotContactStatus(formattedContacts);
        
        // Convert to our internal type with added fields
        const processedContacts: ContactWithMessagingInfo[] = contactsWithStatus.map((contact, index) => {
          // Extract name parts for first/last name
          const nameParts = (contact.name || '').split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
          
          // Determine group based on last name
          let group = "A-F";
          const firstLetter = lastName.charAt(0).toUpperCase();
          if (firstLetter >= 'G' && firstLetter <= 'M') group = "G-M";
          else if (firstLetter >= 'N' && firstLetter <= 'S') group = "N-S";
          else if (firstLetter >= 'T' && firstLetter <= 'Z') group = "T-Z";
          
          return {
            originalContact: contact,
            id: `contact-${index}`,
            displayName: contact.name || '',
            firstName,
            lastName,
            phone: contact.phone || '',
            group,
            messageSent: false
          };
        });
        
        setContacts(processedContacts);
      } catch (error) {
        console.error("Error processing ward data:", error);
        toast.error("Error loading contacts");
      } finally {
        setLoadingContacts(false);
      }
    };
    
    loadContactsFromWardData();
  }, []);

  // Filter contacts based on current filters
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      // Skip contacts on do-not-contact list
      if (contact.originalContact.doNotContact) {
        return false;
      }
      
      // Filter by user type if needed
      if (showOnlyNonUsers && contact.originalContact.userType === 'registered') {
        return false;
      }
      
      // Filter by group
      if (selectedGroupFilter !== "all" && contact.group !== selectedGroupFilter) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery && !contact.displayName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }, [contacts, showOnlyNonUsers, selectedGroupFilter, searchQuery]);

  // Send a message to contact
  const sendMessage = (contact: ContactWithMessagingInfo) => {
    if (!selectedCampaign) {
      toast.error("Please select a message template first");
      return;
    }

    // Don't send messages to do-not-contact individuals
    if (contact.originalContact.doNotContact) {
      toast.error(`${contact.displayName} is on the do-not-contact list`);
      return;
    }

    try {
      // Build personalized message
      const message = personalizeMessage(selectedCampaign.content, contact);
      
      // Format phone number for SMS link - remove non-numeric characters
      const phoneNumber = contact.phone.replace(/\D/g, '');
      
      // Create SMS link with personalized message
      const smsLink = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
      
      // Open SMS link
      window.open(smsLink, '_blank');
      
      // Mark contact as messaged
      markContactMessaged(contact.id);
      
      toast.success(`Message prepared for ${contact.displayName}`);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to prepare message");
    }
  };

  // Mark a contact as messaged
  const markContactMessaged = (contactId: string) => {
    setContacts(contacts.map(c => 
      c.id === contactId ? { ...c, messageSent: true } : c
    ));
  };

  // Mark all filtered contacts as messaged
  const markAllMessaged = () => {
    setContacts(contacts.map(c => 
      filteredContacts.some(fc => fc.id === c.id) ? { ...c, messageSent: true } : c
    ));
    toast.success("All contacts marked as messaged");
  };

  // Reset message status for all contacts
  const resetMessageStatus = () => {
    setContacts(contacts.map(c => ({ ...c, messageSent: false })));
    toast.success("Message status reset for all contacts");
  };

  // Replace tokens in message with contact data
  const personalizeMessage = (template: string, contact: ContactWithMessagingInfo): string => {
    let message = template;
    
    // Replace first name
    message = message.replace(/{first}/g, contact.firstName);
    
    // Replace last name
    message = message.replace(/{last}/g, contact.lastName);
    
    // Replace group
    message = message.replace(/{group}/g, contact.group);
    
    // Replace schedule - assume it's the next Saturday at 9 AM
    const nextSaturday = getNextSaturday();
    const schedule = `${nextSaturday.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at 9:00 AM`;
    message = message.replace(/{schedule}/g, schedule);
    
    return message;
  };

  // Get next Saturday date
  const getNextSaturday = (): Date => {
    const now = new Date();
    const day = now.getDay(); // 0 is Sunday, 6 is Saturday
    const daysUntilSaturday = 6 - day;
    const nextSaturday = new Date(now);
    nextSaturday.setDate(now.getDate() + (daysUntilSaturday <= 0 ? daysUntilSaturday + 7 : daysUntilSaturday));
    return nextSaturday;
  };

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Messenger</h1>
          <p className="text-muted-foreground">Send personalized cleaning assignment reminders</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Filters and Campaign Selection */}
        <div className="lg:col-span-1 space-y-6">
          {/* Campaign Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Message Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingCampaigns ? (
                <div className="text-center py-4">Loading templates...</div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No message templates found</p>
                  <Button 
                    variant="link" 
                    onClick={() => window.location.href = '/app/campaigns'}
                    className="mt-2"
                  >
                    Create your first template
                  </Button>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {selectedCampaign?.name || "Select a template"}
                      <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    {campaigns.map((campaign) => (
                      <DropdownMenuItem 
                        key={campaign.id} 
                        onClick={() => setSelectedCampaign(campaign)}
                      >
                        <div className="flex items-center">
                          {campaign.name}
                          {campaign.is_default && <Star className="ml-2 h-3 w-3 text-yellow-500" />}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {selectedCampaign && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">Template Preview:</p>
                  <div className="text-sm p-3 bg-muted rounded-md whitespace-pre-wrap">
                    {selectedCampaign.content}
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    Tokens like {'{first}'}, {'{last}'}, {'{group}'}, and {'{schedule}'} will be replaced with actual values.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="group-filter">Group</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button id="group-filter" variant="outline" className="w-full justify-between">
                      {GROUP_OPTIONS.find(opt => opt.value === selectedGroupFilter)?.label || "Select a group"}
                      <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    {GROUP_OPTIONS.map((option) => (
                      <DropdownMenuItem 
                        key={option.value} 
                        onClick={() => setSelectedGroupFilter(option.value)}
                      >
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="non-users-only"
                  checked={showOnlyNonUsers}
                  onCheckedChange={(checked) => setShowOnlyNonUsers(checked === true)}
                />
                <Label htmlFor="non-users-only" className="cursor-pointer">Show Non-Users Only</Label>
              </div>

              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={resetMessageStatus}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset Status
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={markAllMessaged}
              >
                <Check className="mr-2 h-4 w-4" />
                Mark All Sent
              </Button>
            </CardFooter>
          </Card>

          {/* Message Preview */}
          {previewContact && selectedCampaign && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Message Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">To: {previewContact.displayName}</p>
                  <div className="text-sm p-3 bg-muted rounded-md whitespace-pre-wrap">
                    {personalizeMessage(selectedCampaign.content, previewContact)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel: Contact List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium flex items-center gap-2">
              Contacts
              <span className="text-sm font-normal text-muted-foreground">
                ({filteredContacts.length} {filteredContacts.length === 1 ? 'contact' : 'contacts'})
              </span>
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Showing:</span>
              <span className="bg-primary/10 text-primary px-2 py-1 rounded-full">
                {showOnlyNonUsers ? 'Non-Users' : 'All Contacts'} {selectedGroupFilter !== 'all' ? `in ${selectedGroupFilter}` : ''}
              </span>
            </div>
          </div>

          {loadingContacts ? (
            <div className="flex justify-center items-center py-8">
              <svg 
                className="animate-spin h-8 w-8 text-primary" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                ></circle>
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="ml-3 text-lg">Loading contacts...</span>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-8 border rounded-lg">
              <p className="text-muted-foreground mb-2">No contacts found matching your filters.</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedGroupFilter("all");
                  setShowOnlyNonUsers(false);
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredContacts.map((contact) => (
                <Card 
                  key={contact.id} 
                  className={`overflow-hidden transition-all cursor-pointer ${contact.messageSent ? 'bg-muted/30' : ''}`}
                  onClick={() => setPreviewContact(contact)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className={`font-medium ${contact.messageSent ? 'line-through text-muted-foreground' : ''}`}>
                          {contact.displayName}
                        </h3>
                        <p className="text-sm text-muted-foreground">{contact.phone}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Group {contact.group}
                          </span>
                          {contact.originalContact.userType === 'registered' && (
                            <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-full">
                              Registered
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        {contact.messageSent ? (
                          <div className="text-green-600 flex items-center">
                            <CheckCircle2 className="h-5 w-5 mr-1" />
                            <span className="text-xs">Sent</span>
                          </div>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              sendMessage(contact);
                            }}
                          >
                            <MessageSquare className="mr-1 h-4 w-4" />
                            Send SMS
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 