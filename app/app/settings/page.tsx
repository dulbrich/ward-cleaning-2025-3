"use client";

import { WardMembershipManager } from "@/app/components/WardMembershipManager";
import { ProfileForm } from "@/components/profile/profile-form";
import { createClient } from "@/utils/supabase/client";
import { CheckCircle, HelpCircle, PencilIcon, PlusCircle, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Define user profile interface
interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone_number: string;
  is_phone_verified: boolean;
  avatar_url: string;
  role: string;
}

// Define Ward/Branch interface
interface WardBranch {
  id: string;
  name: string;
  unit_type: "Ward" | "Branch";
  unit_number?: string;
  stake_district_name?: string;
  city?: string;
  state_province?: string;
  country?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Profile");
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [wardBranches, setWardBranches] = useState<WardBranch[]>([]);
  const [loadingWardBranches, setLoadingWardBranches] = useState(false);
  const [editingWardBranch, setEditingWardBranch] = useState<WardBranch | null>(null);
  const [showWardBranchForm, setShowWardBranchForm] = useState(false);
  const [wardBranchFormData, setWardBranchFormData] = useState<Partial<WardBranch>>({
    name: "",
    unit_type: "Ward",
    unit_number: "",
    stake_district_name: "",
    city: "",
    state_province: "",
    country: "",
    is_primary: false
  });
  const [showUnitNumberHelp, setShowUnitNumberHelp] = useState(false);

  // Fetch actual user data on component mount
  useEffect(() => {
    async function fetchUserData() {
      try {
        // Try to fetch user profile from the server (or session)
        const response = await fetch('/api/user/profile');
        
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
          console.log("Loaded user data:", data); // Add logging to verify data is fetched
        } else {
          console.error("Error fetching profile: Response not OK"); // Log error response
          // Fallback to session data or local storage if available
          const storedUser = sessionStorage.getItem('user');
          if (storedUser) {
            setUserData(JSON.parse(storedUser));
          } else {
            // Use default mock data as last resort
            setUserData({
              id: "user_123",
              first_name: "",
              last_name: "",
              username: "",
              email: "",
              phone_number: "",
              is_phone_verified: false,
              avatar_url: "/images/avatars/default.png",
              role: "user"
            });
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, []);

  // Fetch ward/branch data when tab is selected
  useEffect(() => {
    if (activeTab === 'Ward/Branch') {
      fetchWardBranches();
    }
  }, [activeTab]);

  // Fetch ward/branch data from Supabase
  async function fetchWardBranches() {
    setLoadingWardBranches(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('ward_branches')
        .select('*')
        .order('is_primary', { ascending: false })
        .order('name');

      if (error) {
        throw error;
      }

      setWardBranches(data || []);
    } catch (error) {
      console.error("Error fetching ward/branch data:", error);
      toast.error("Failed to load ward/branch data");
    } finally {
      setLoadingWardBranches(false);
    }
  }

  // Handle form input changes
  const handleWardBranchInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | boolean = value;
    
    // Handle checkbox for is_primary
    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    }
    
    setWardBranchFormData({
      ...wardBranchFormData,
      [name]: processedValue
    });
  };

  // Save ward/branch form data
  const handleWardBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!wardBranchFormData.name || !wardBranchFormData.unit_type) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    try {
      const supabase = createClient();
      
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error("User not authenticated");
      }
      
      // Add user_id to the form data
      const dataWithUserId = {
        ...wardBranchFormData,
        user_id: user.id
      };
      
      if (editingWardBranch) {
        // Update existing ward/branch
        const { data, error } = await supabase
          .from('ward_branches')
          .update(dataWithUserId)
          .eq('id', editingWardBranch.id)
          .select();
          
        if (error) throw error;
        toast.success("Ward/Branch updated successfully");
      } else {
        // Create new ward/branch
        const { data, error } = await supabase
          .from('ward_branches')
          .insert([dataWithUserId])
          .select();
          
        if (error) throw error;
        toast.success("Ward/Branch added successfully");
      }
      
      // Reset form and refresh data
      setWardBranchFormData({
        name: "",
        unit_type: "Ward",
        unit_number: "",
        stake_district_name: "",
        city: "",
        state_province: "",
        country: "",
        is_primary: false
      });
      setEditingWardBranch(null);
      setShowWardBranchForm(false);
      fetchWardBranches();
      
    } catch (error) {
      console.error("Error saving ward/branch:", error);
      toast.error("Failed to save ward/branch: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  // Delete ward/branch
  const handleDeleteWardBranch = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ward/branch?")) {
      return;
    }
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('ward_branches')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success("Ward/Branch deleted successfully");
      fetchWardBranches();
    } catch (error) {
      console.error("Error deleting ward/branch:", error);
      toast.error("Failed to delete ward/branch");
    }
  };

  // Set ward/branch as primary
  const handleSetPrimary = async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('ward_branches')
        .update({ is_primary: true })
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success("Ward/Branch set as primary");
      fetchWardBranches();
    } catch (error) {
      console.error("Error setting primary ward/branch:", error);
      toast.error("Failed to set primary ward/branch");
    }
  };

  // Edit ward/branch
  const handleEditWardBranch = (wardBranch: WardBranch) => {
    setEditingWardBranch(wardBranch);
    setWardBranchFormData({
      name: wardBranch.name,
      unit_type: wardBranch.unit_type,
      unit_number: wardBranch.unit_number || "",
      stake_district_name: wardBranch.stake_district_name || "",
      city: wardBranch.city || "",
      state_province: wardBranch.state_province || "",
      country: wardBranch.country || "",
      is_primary: wardBranch.is_primary
    });
    setShowWardBranchForm(true);
  };

  // Add help modal for unit number
  const UnitNumberHelpModal = () => {
    if (!showUnitNumberHelp) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4 relative">
          <button 
            onClick={() => setShowUnitNumberHelp(false)}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
          
          <h3 className="text-lg font-medium mb-4">How to Find Your Ward Unit Number</h3>
          
          <div className="space-y-4 text-sm">
            <p>To find your ward unit number on <strong>churchofjesuschrist.org</strong>, follow these steps:</p>
            
            <ol className="list-decimal pl-5 space-y-2">
              <li><strong>Log in</strong> to <a href="https://www.churchofjesuschrist.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">churchofjesuschrist.org</a> with your church account.</li>
              
              <li>Click on your profile icon or name in the upper right corner and select <strong>"Ward Directory and Map."</strong></li>
              
              <li>Once you're on your ward's directory page, look at the URL in your browser's address bar. You'll see something like:</li>
            </ol>
            
            <div className="bg-muted p-2 rounded-md font-mono text-xs">
              https://www.churchofjesuschrist.org/directory/?lang=eng&unitNumber=123456
            </div>
            
            <p>The numbers after <code className="bg-muted px-1 py-0.5 rounded text-xs">unitNumber=</code> (e.g., <strong>123456</strong>) represent your ward's unit number.</p>
            
            <p>Alternatively, you can ask a bishopric member or your ward clerk directly—they typically have the number readily available.</p>
          </div>
          
          <button 
            onClick={() => setShowUnitNumberHelp(false)}
            className="mt-6 w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Got it
          </button>
        </div>
      </div>
    );
  };

  const tabs = [
    { name: 'Profile', active: activeTab === 'Profile' },
    { name: 'Ward/Branch', active: activeTab === 'Ward/Branch' },
    { name: 'Account', active: activeTab === 'Account' },
    { name: 'Notifications', active: activeTab === 'Notifications' },
    { name: 'Preferences', active: activeTab === 'Preferences' },
    { name: 'Privacy', active: activeTab === 'Privacy' },
    { name: 'Security', active: activeTab === 'Security' },
    { name: 'Connected Services', active: activeTab === 'Connected Services' },
    { name: 'Admin Options', active: activeTab === 'Admin Options' }
  ];

  // Determine which tab content to show
  const renderTabContent = () => {
    switch (activeTab) {
      case "Profile":
        return (
          <ProfileForm 
            initialData={userData} 
            onSave={(updatedData) => {
              setUserData(updatedData);
              toast.success("Profile updated successfully");
            }} 
          />
        );
      case "Ward/Branch":
        // Use our new Ward Membership Manager component
        // Import WardMembershipManager from "@/components/WardMembershipManager";
        return (
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="loader"></div>
              </div>
            ) : (
              <div>
                {userData && (
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold">Ward Memberships</h2>
                      <p className="text-sm text-muted-foreground">
                        Manage your ward memberships and participation
                      </p>
                    </div>
                    
                    {/* Use the new WardMembershipManager component */}
                    <div className="mt-4">
                      <WardMembershipManager userId={userData.id} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case "Schedule":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Schedule Settings</h2>
            <p className="text-muted-foreground">
              Configure your availability and schedule preferences
            </p>
            <div className="border rounded-md p-4 bg-muted/30">
              <p className="text-center text-muted-foreground">
                Schedule settings coming soon
              </p>
            </div>
          </div>
        );
      case "Notifications":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Notification Settings</h2>
            <p className="text-muted-foreground">
              Configure how and when you receive notifications
            </p>
            <div className="border rounded-md p-4 bg-muted/30">
              <p className="text-center text-muted-foreground">
                Notification settings coming soon
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Include help modal */}
      <UnitNumberHelpModal />
      
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Settings Navigation */}
        <div className="md:col-span-1">
          <nav className="bg-card rounded-lg border overflow-hidden">
            <div className="p-2">
              {tabs.map((item, i) => (
                <button 
                  key={i} 
                  className={`w-full text-left px-3 py-2 rounded-md ${item.active ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                  onClick={() => setActiveTab(item.name)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </nav>
        </div>
        
        {/* Settings Content */}
        <div className="md:col-span-2 space-y-6">
          {renderTabContent()}
          
          {activeTab === 'Ward/Branch' && (
            <div className="bg-card rounded-lg border p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-medium">Ward/Branch Settings</h2>
                {!showWardBranchForm && (
                  <button 
                    className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-2 rounded-md hover:bg-primary/90"
                    onClick={() => {
                      setEditingWardBranch(null);
                      setWardBranchFormData({
                        name: "",
                        unit_type: "Ward",
                        unit_number: "",
                        stake_district_name: "",
                        city: "",
                        state_province: "",
                        country: "",
                        is_primary: false
                      });
                      setShowWardBranchForm(true);
                    }}
                  >
                    <PlusCircle size={16} />
                    <span>Add New</span>
                  </button>
                )}
              </div>
              
              {loadingWardBranches ? (
                <div className="h-60 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {showWardBranchForm ? (
                    <form onSubmit={handleWardBranchSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="name" className="block text-sm font-medium">
                            Ward/Branch Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            maxLength={100}
                            value={wardBranchFormData.name}
                            onChange={handleWardBranchInputChange}
                            placeholder="e.g. Grasslands 3rd Ward"
                            className="w-full px-3 py-2 border rounded-md"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="unit_type" className="block text-sm font-medium">
                            Unit Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            id="unit_type"
                            name="unit_type"
                            required
                            value={wardBranchFormData.unit_type}
                            onChange={handleWardBranchInputChange}
                            className="w-full px-3 py-2 border rounded-md"
                          >
                            <option value="Ward">Ward</option>
                            <option value="Branch">Branch</option>
                          </select>
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="unit_number" className="flex items-center text-sm font-medium gap-1">
                            Unit Number
                            <button 
                              type="button"
                              onClick={() => setShowUnitNumberHelp(true)}
                              className="text-muted-foreground hover:text-primary focus:outline-none"
                              aria-label="Learn how to find unit number"
                            >
                              <HelpCircle size={14} />
                            </button>
                          </label>
                          <input
                            id="unit_number"
                            name="unit_number"
                            type="text"
                            maxLength={10}
                            pattern="[0-9]*"
                            value={wardBranchFormData.unit_number}
                            onChange={handleWardBranchInputChange}
                            placeholder="e.g. 123456"
                            className="w-full px-3 py-2 border rounded-md"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="stake_district_name" className="block text-sm font-medium">
                            Stake/District Name
                          </label>
                          <input
                            id="stake_district_name"
                            name="stake_district_name"
                            type="text"
                            maxLength={100}
                            value={wardBranchFormData.stake_district_name}
                            onChange={handleWardBranchInputChange}
                            placeholder="e.g. Provo Utah Stake"
                            className="w-full px-3 py-2 border rounded-md"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="city" className="block text-sm font-medium">
                            City
                          </label>
                          <input
                            id="city"
                            name="city"
                            type="text"
                            maxLength={100}
                            value={wardBranchFormData.city}
                            onChange={handleWardBranchInputChange}
                            placeholder="e.g. Provo"
                            className="w-full px-3 py-2 border rounded-md"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="state_province" className="block text-sm font-medium">
                            State/Province
                          </label>
                          <input
                            id="state_province"
                            name="state_province"
                            type="text"
                            maxLength={100}
                            value={wardBranchFormData.state_province}
                            onChange={handleWardBranchInputChange}
                            placeholder="e.g. Utah"
                            className="w-full px-3 py-2 border rounded-md"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="country" className="block text-sm font-medium">
                            Country
                          </label>
                          <input
                            id="country"
                            name="country"
                            type="text"
                            maxLength={100}
                            value={wardBranchFormData.country}
                            onChange={handleWardBranchInputChange}
                            placeholder="e.g. United States"
                            className="w-full px-3 py-2 border rounded-md"
                          />
                        </div>
                        
                        <div className="space-y-2 md:col-span-2">
                          <div className="flex items-center space-x-2">
                            <input
                              id="is_primary"
                              name="is_primary"
                              type="checkbox"
                              checked={wardBranchFormData.is_primary as boolean}
                              onChange={handleWardBranchInputChange}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="is_primary" className="text-sm font-medium">
                              Set as primary ward/branch
                            </label>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Primary ward/branch will be used as the default for various features.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                          onClick={() => {
                            setShowWardBranchForm(false);
                            setEditingWardBranch(null);
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        >
                          {editingWardBranch ? 'Update' : 'Save'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {wardBranches.length === 0 ? (
                        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/50">
                          <h3 className="text-lg font-medium text-muted-foreground mb-2">No Wards or Branches</h3>
                          <p className="text-muted-foreground mb-6 max-w-md mx-auto">You haven't added any wards or branches yet. Add your first one to get started.</p>
                          <button
                            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md hover:bg-primary/90 transition-colors shadow-sm"
                            onClick={() => setShowWardBranchForm(true)}
                          >
                            <PlusCircle size={18} />
                            <span>Add Your First Ward/Branch</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-4">
                            {wardBranches.map((item) => (
                              <div 
                                key={item.id} 
                                className={`relative rounded-lg border p-4 transition-all ${
                                  item.is_primary 
                                    ? 'bg-primary/5 border-primary/20 shadow-sm' 
                                    : 'bg-card hover:bg-muted/10'
                                }`}
                              >
                                {item.is_primary && (
                                  <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/3">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground shadow-sm">
                                      <CheckCircle size={14} />
                                    </span>
                                  </div>
                                )}
                                
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                  <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-medium text-lg">{item.name}</h3>
                                      <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                                        {item.unit_type}
                                      </span>
                                      
                                      {item.is_primary && (
                                        <span className="hidden sm:inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                                          <CheckCircle size={12} className="mr-1" />
                                          Primary
                                        </span>
                                      )}
                                    </div>
                                    
                                    <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                                      {item.unit_number && (
                                        <span className="flex items-center gap-1">
                                          <span className="font-medium">Unit #:</span> {item.unit_number}
                                        </span>
                                      )}
                                      
                                      {item.stake_district_name && (
                                        <span className="flex items-center gap-1">
                                          <span className="font-medium">Stake/District:</span> {item.stake_district_name}
                                        </span>
                                      )}
                                    </div>
                                    
                                    {(item.city || item.state_province || item.country) && (
                                      <div className="text-sm text-muted-foreground">
                                        <span className="font-medium">Location:</span>{' '}
                                        {[item.city, item.state_province, item.country]
                                          .filter(Boolean)
                                          .join(', ')}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-4">
                                    {!item.is_primary && (
                                      <button
                                        onClick={() => handleSetPrimary(item.id)}
                                        className="text-xs text-primary hover:text-primary/80 border border-primary/20 px-3 py-1.5 rounded-md hover:bg-primary/5 transition-colors"
                                      >
                                        Set as primary
                                      </button>
                                    )}
                                    
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleEditWardBranch(item)}
                                        className="flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                        aria-label="Edit"
                                      >
                                        <PencilIcon size={16} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteWardBranch(item.id)}
                                        className="flex items-center justify-center h-8 w-8 rounded-md text-red-500/70 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                        aria-label="Delete"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}
          
          {activeTab === 'Notifications' && (
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-medium mb-4">Notification Preferences</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-muted-foreground">Receive updates about campaigns and assignments</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">SMS Notifications</h3>
                    <p className="text-sm text-muted-foreground">Receive text messages for urgent requests</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">In-App Notifications</h3>
                    <p className="text-sm text-muted-foreground">Receive notifications within the application</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Weekly Digest</h3>
                    <p className="text-sm text-muted-foreground">Receive a summary of the week's activities</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {/* Placeholder for other tabs */}
          {activeTab !== 'Profile' && activeTab !== 'Notifications' && activeTab !== 'Ward/Branch' && (
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-medium mb-4">{activeTab} Settings</h2>
              <p className="text-muted-foreground">This feature is coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 