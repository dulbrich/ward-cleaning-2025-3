"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IMaskInput } from "react-imask";
import { toast } from "sonner";

interface ProfileFormProps {
  userData?: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    phone_number: string;
    is_phone_verified: boolean;
    avatar_url: string;
    role: string;
  } | null;
}

// Helper function to format phone numbers as +1 (###) ###-####
function formatPhoneNumber(phoneNumber: string | undefined): string {
  if (!phoneNumber) return "+1 (";
  
  // Remove all non-numeric characters
  const digits = phoneNumber.replace(/\D/g, "");
  
  // Format as needed
  if (digits.length === 0) return "+1 (";
  if (digits.length <= 3) return `+1 (${digits}`;
  if (digits.length <= 6) return `+1 (${digits.substring(0, 3)}) ${digits.substring(3)}`;
  return `+1 (${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6, 10)}`;
}

// Helper function to extract just the digits from a formatted phone number
function extractDigits(formattedNumber: string): string {
  return formattedNumber.replace(/\D/g, "");
}

// Helper function to unformat phone numbers for saving to database
function unformatPhoneNumber(phoneNumber: string): string {
  // Remove all non-numeric characters
  return phoneNumber.replace(/\D/g, "");
}

export function ProfileForm({ userData }: ProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: userData?.first_name || "",
    last_name: userData?.last_name || "",
    username: userData?.username || "",
    email: userData?.email || "",
    phone_number: userData?.phone_number || "",
    role: userData?.role || "user",
    avatar_url: userData?.avatar_url || "/images/avatars/default.png",
  });
  
  // Update form data when userData changes
  useEffect(() => {
    if (userData) {
      setFormData({
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        username: userData.username || "",
        email: userData.email || "",
        phone_number: userData.phone_number || "",
        role: userData.role || "user",
        avatar_url: userData.avatar_url || "/images/avatars/default.png",
      });
    }
  }, [userData]);
  
  const [originalPhone, setOriginalPhone] = useState(userData?.phone_number || "");
  const [avatarSelectorOpen, setAvatarSelectorOpen] = useState(false);
  const [phoneVerificationOpen, setPhoneVerificationOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isAdmin, setIsAdmin] = useState(userData?.role === "admin");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [phoneToVerify, setPhoneToVerify] = useState("");
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);

  // Track if form has changed from initial values
  useEffect(() => {
    const isFormDirty = 
      formData.first_name !== userData?.first_name ||
      formData.last_name !== userData?.last_name ||
      formData.username !== userData?.username ||
      formData.phone_number !== userData?.phone_number ||
      formData.avatar_url !== userData?.avatar_url ||
      (isAdmin && formData.role !== userData?.role);
    
    setIsDirty(isFormDirty);
  }, [formData, userData, isAdmin]);

  // Handler for form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle phone number changes from IMask component
  const handlePhoneChange = (value: string) => {
    setFormData({
      ...formData,
      phone_number: value,
    });
  };

  const handleAvatarChange = (url: string) => {
    setFormData(prev => ({ ...prev, avatar_url: url }));
    setAvatarSelectorOpen(false);
  };

  const handleRemoveAvatar = () => {
    setFormData(prev => ({ ...prev, avatar_url: "/images/avatars/default.png" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If phone number has changed, open verification dialog
    if (unformatPhoneNumber(formData.phone_number) !== unformatPhoneNumber(originalPhone)) {
      setPhoneToVerify(formData.phone_number);
      setVerificationModalOpen(true);
      return;
    }
    
    // Otherwise continue with normal update
    await saveProfile();
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    
    try {
      // Call the phone verification API
      const response = await fetch("/api/user/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: unformatPhoneNumber(phoneToVerify),
          verification_code: verificationCode
        }),
      });
      
      const data = await response.json();
      
      if (data.success && data.verified) {
        toast.success(data.message || "Phone number verified successfully");
        setVerificationModalOpen(false);
        setVerificationCode("");
        await saveProfile(phoneToVerify, true); // true indicates phone is verified
      } else {
        toast.error(data.message || "Invalid verification code. Please try again.");
      }
    } catch (error) {
      toast.error("Verification failed. Please try again.");
      console.error("Verification error:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  const saveProfile = async (verifiedPhone?: string, isVerified: boolean = false) => {
    setIsLoading(true);
    
    try {
      // Prepare the data to send
      const dataToSave = {
        ...formData,
        phone_number: unformatPhoneNumber(verifiedPhone || formData.phone_number),
        is_phone_verified: isVerified || userData?.is_phone_verified
      };
      
      // Call the API to update the profile
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update profile");
      }
      
      const updatedData = await response.json();
      
      // Update original phone if it was changed and verified
      if (verifiedPhone) {
        setOriginalPhone(verifiedPhone);
      }
      
      toast.success("Profile updated successfully");
      router.refresh();
      setIsDirty(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Available avatars from the public directory
  const avatars = [
    "/images/avatars/default.png",
    "/images/avatars/avatar1.png",
    "/images/avatars/avatar2.png",
    "/images/avatars/avatar3.png",
    "/images/avatars/avatar4.png",
    "/images/avatars/avatar5.png",
    "/images/avatars/monster_1.png",
    "/images/avatars/monster_2.png",
    "/images/avatars/monster_3.png",
    "/images/avatars/monster_6.png",
    "/images/avatars/monster_7.png",
    "/images/avatars/monster_8.png",
    "/images/avatars/monster_9.png",
    "/images/avatars/monster_10.png",
    "/images/avatars/monster_11.png",
    "/images/avatars/monster_12.png",
  ];

  // Show loading state or no data message
  if (!userData) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">User data not available.</p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium">Profile Settings</h2>
          <button 
            type="submit"
            disabled={!isDirty || isLoading}
            className={`bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm 
              ${(!isDirty || isLoading) && "opacity-50 cursor-not-allowed"}`}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
        
        {/* Profile Picture */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-muted overflow-hidden">
            {formData.avatar_url ? (
              <img 
                src={formData.avatar_url} 
                alt="Profile Avatar" 
                className="h-full w-full object-cover" 
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <span className="text-2xl font-medium">
                  {formData.first_name.charAt(0)}{formData.last_name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <button 
                type="button"
                onClick={() => setAvatarSelectorOpen(true)}
                className="text-primary text-sm hover:underline"
              >
                Change avatar
              </button>
              <button 
                type="button"
                onClick={handleRemoveAvatar}
                className="text-muted-foreground text-sm hover:underline"
              >
                Remove
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Select from our collection of avatars.
            </p>
          </div>
        </div>
        
        {/* Profile Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="first_name" className="text-sm font-medium">
              First Name
            </label>
            <input 
              type="text" 
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="last_name" className="text-sm font-medium">
              Last Name
            </label>
            <input 
              type="text" 
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <input 
              type="text" 
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input 
              type="email" 
              id="email"
              name="email"
              value={formData.email}
              className="w-full rounded-md border border-input bg-background px-3 py-2 bg-muted"
              readOnly
            />
            <p className="text-xs text-muted-foreground">
              Email address cannot be changed
            </p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="phone_number" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Phone
            </label>
            <div className="mt-1">
              <IMaskInput
                id="phone_number"
                name="phone_number"
                mask="+1 (000) 000-0000"
                value={formData.phone_number}
                onAccept={handlePhoneChange}
                className="block w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="+1 (___) ___-____"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Changing your phone will require verification
            </p>
          </div>
          
          {isAdmin && (
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
              </select>
            </div>
          )}
        </div>
      </form>
      
      {/* Phone Verification Modal */}
      {verificationModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg shadow-lg max-w-md w-full p-6 dark:bg-gray-800">
            <h3 className="text-lg font-medium mb-4 text-foreground dark:text-gray-100">Verify Your Phone Number</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We've sent a verification code to {phoneToVerify}. 
              Please enter the code below to verify your number.
            </p>
            <form onSubmit={handleVerifySubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="verification-code" className="text-sm font-medium text-foreground dark:text-gray-200">
                    Verification Code
                  </label>
                  <input
                    id="verification-code"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full rounded-md border border-input bg-background dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    maxLength={6}
                  />
                </div>
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationModalOpen(false);
                      setVerificationCode("");
                    }}
                    className="px-4 py-2 text-sm border rounded-md hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isVerifying ? "Verifying..." : "Verify"}
                  </button>
                </div>
                <div className="space-y-2 mt-4">
                  <p className="text-xs text-muted-foreground text-center dark:text-gray-400">
                    For testing, use code: 123456
                  </p>
                  <p className="text-xs text-muted-foreground text-center dark:text-gray-400">
                    Didn't receive a code?{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline dark:text-primary"
                      onClick={() => toast.info("New code would be sent (demo)")}
                    >
                      Resend Code
                    </button>
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Avatar Selector Modal */}
      {avatarSelectorOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg shadow-lg max-w-xl w-full p-4 dark:bg-gray-800 overflow-y-auto max-h-[80vh]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-medium text-foreground dark:text-gray-100">
                Select an Avatar
              </h3>
              <button
                type="button"
                onClick={() => setAvatarSelectorOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {avatars.map((avatar, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleAvatarChange(avatar)}
                  className={`relative p-1 rounded-lg border transition-all
                    ${formData.avatar_url === avatar
                      ? "border-primary"
                      : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                    }
                  `}
                >
                  <div className="aspect-square rounded-lg overflow-hidden w-12 h-12 sm:w-14 sm:h-14">
                    <img
                      src={avatar}
                      alt={`Avatar option ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {formData.avatar_url === avatar && (
                    <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-2 h-2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 