"use client";

import { updateUserProfileWithHash } from "@/app/app/tools/actions";
import { FormEvent, useState } from "react";
import InputMask from "react-input-mask";

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

interface ProfileFormProps {
  userData: UserProfile | null;
}

// Helper function to unformat phone numbers for saving to database
function unformatPhoneNumber(phoneNumber: string): string {
  // Remove all non-numeric characters
  return phoneNumber.replace(/\D/g, "");
}

export function ProfileForm({ userData }: ProfileFormProps) {
  // Initialize form state with userData or empty values
  const [formData, setFormData] = useState({
    first_name: userData?.first_name || "",
    last_name: userData?.last_name || "",
    username: userData?.username || "",
    email: userData?.email || "",
    phone_number: userData?.phone_number || "",
    avatar_url: userData?.avatar_url || "/images/avatars/default.png",
  });

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available avatars
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

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle avatar selection
  const handleAvatarSelect = (avatarUrl: string) => {
    setFormData({ ...formData, avatar_url: avatarUrl });
  };

  // Initiate phone verification
  const handleInitiateVerification = (e: React.MouseEvent) => {
    e.preventDefault();
    // In a real app, this would send a verification code to the user's phone
    setIsVerifying(true);
    setStatusMessage("Verification code sent to your phone.");
  };

  // Verify phone number
  const handleVerifyPhone = (e: React.MouseEvent) => {
    e.preventDefault();
    // In a real app, this would verify the code with a backend service
    if (verificationCode === "123456") {
      setStatusMessage("Phone number verified successfully.");
      setIsVerifying(false);
    } else {
      setStatusMessage("Invalid verification code. Please try again.");
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage("");

    try {
      // Format the data before sending to API
      const dataToSubmit = {
        ...formData,
        phone_number: unformatPhoneNumber(formData.phone_number)
      };

      // In a real implementation, this would send the data to your API
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (response.ok) {
        // Also update the user hash
        if (userData?.id) {
          try {
            const hashResult = await updateUserProfileWithHash(
              userData.id,
              formData.first_name,
              formData.last_name,
              unformatPhoneNumber(formData.phone_number)
            );
            
            if (!hashResult.success) {
              console.error("Error updating user hash:", hashResult.error);
            }
          } catch (hashError) {
            console.error("Exception updating user hash:", hashError);
          }
        }
        
        setStatusMessage("Profile updated successfully!");
      } else {
        setStatusMessage("Failed to update profile. Please try again.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setStatusMessage("An error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If userData is null, show a message
  if (!userData) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">User data not available.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-medium">Profile Settings</h2>

      {/* Status message */}
      {statusMessage && (
        <div
          className={`p-3 rounded-md ${
            statusMessage.includes("success")
              ? "bg-green-100 text-green-700"
              : statusMessage.includes("error") || statusMessage.includes("fail")
              ? "bg-red-100 text-red-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {statusMessage}
        </div>
      )}

      {/* Avatar Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Profile Picture</label>
        <div className="flex flex-wrap gap-3 max-h-[260px] overflow-y-auto p-2">
          {avatars.map((avatar, index) => (
            <button
              key={index}
              type="button"
              className={`w-16 h-16 rounded-full overflow-hidden border-2 ${
                formData.avatar_url === avatar
                  ? "border-primary"
                  : "border-transparent hover:border-primary/50"
              }`}
              onClick={() => handleAvatarSelect(avatar)}
              title={`Avatar option ${index + 1}`}
            >
              {/* In a real implementation, you would use next/image here */}
              <img
                src={avatar}
                alt={`Avatar option ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="first_name" className="block text-sm font-medium">
            First Name
          </label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            value={formData.first_name}
            onChange={handleChange}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="last_name" className="block text-sm font-medium">
            Last Name
          </label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            value={formData.last_name}
            onChange={handleChange}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            required
          />
        </div>
      </div>

      {/* Username */}
      <div className="space-y-2">
        <label htmlFor="username" className="block text-sm font-medium">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
          required
        />
      </div>

      {/* Email (Read Only) */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium">
          Email Address (Read Only)
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          className="w-full rounded-md border border-input bg-background px-3 py-2 opacity-70 cursor-not-allowed"
          disabled
        />
      </div>

      {/* Phone Number with Verification */}
      <div className="space-y-2">
        <label htmlFor="phone_number" className="block text-sm font-medium">
          Phone Number
        </label>
        <div className="flex gap-2">
          <InputMask
            mask="+1 (999) 999-9999"
            id="phone_number"
            name="phone_number"
            type="tel"
            value={formData.phone_number}
            onChange={handleChange}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2"
            placeholder="+1 (___) ___-____"
            alwaysShowMask
          />
          <button
            onClick={handleInitiateVerification}
            className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm"
            type="button"
            disabled={isVerifying}
          >
            {userData.is_phone_verified ? "Re-verify" : "Verify"}
          </button>
        </div>

        {/* Verification code input (shown only when verifying) */}
        {isVerifying && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2"
              maxLength={6}
            />
            <button
              onClick={handleVerifyPhone}
              className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm"
              type="button"
            >
              Confirm
            </button>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
} 