import Image from "next/image";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { SignupFormData } from "./types";

interface PersonalInfoStepProps {
  formData: SignupFormData;
  updateFormData: (data: Partial<SignupFormData>) => void;
}

export function PersonalInfoStep({ formData, updateFormData }: PersonalInfoStepProps) {
  // Updated avatar paths to match the actual files in the directory
  const defaultAvatars = [
    '/images/avatars/avatar1.png',
    '/images/avatars/avatar2.png',
    '/images/avatars/avatar3.png',
    '/images/avatars/avatar4.png',
    '/images/avatars/avatar5.png',
    '/images/avatars/default.png',
  ];
  
  // Also have monster avatars available as alternatives - curated selection that meets standards
  const monsterAvatars = [
    '/images/avatars/monster_6.png',
    '/images/avatars/monster_7.png',
    '/images/avatars/monster_8.png',
    '/images/avatars/monster_9.png',
    '/images/avatars/monster_10.png',
    '/images/avatars/monster_11.png',
    '/images/avatars/monster_12.png',
  ];

  // If the current avatarUrl is not valid, set it to the first one
  if (!defaultAvatars.includes(formData.avatarUrl) && !monsterAvatars.includes(formData.avatarUrl)) {
    updateFormData({ avatarUrl: defaultAvatars[0] });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold mb-2">Tell Us About Yourself</h1>
        <p className="text-muted-foreground">
          This information helps us personalize your experience
        </p>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) => updateFormData({ firstName: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={(e) => updateFormData({ lastName: e.target.value })}
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            placeholder="Choose a username"
            value={formData.username}
            onChange={(e) => updateFormData({ username: e.target.value })}
            required
          />
          <p className="text-xs text-muted-foreground">
            This is how others will see you in the app
          </p>
        </div>
        
        <div className="space-y-2">
          <Label>Profile Avatar</Label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {defaultAvatars.map((avatar, index) => (
              <div 
                key={index}
                onClick={() => updateFormData({ avatarUrl: avatar })}
                className={`
                  relative cursor-pointer rounded-md overflow-hidden h-16 w-16 border-2
                  ${formData.avatarUrl === avatar ? 'border-primary' : 'border-transparent hover:border-muted'}
                `}
              >
                <Image 
                  src={avatar}
                  alt={`Avatar ${index+1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          
          <Label className="mt-4">Monster Avatars</Label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {monsterAvatars.map((avatar, index) => (
              <div 
                key={index}
                onClick={() => updateFormData({ avatarUrl: avatar })}
                className={`
                  relative cursor-pointer rounded-md overflow-hidden h-16 w-16 border-2
                  ${formData.avatarUrl === avatar ? 'border-primary' : 'border-transparent hover:border-muted'}
                `}
              >
                <Image 
                  src={avatar}
                  alt={`Monster Avatar ${index+1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 