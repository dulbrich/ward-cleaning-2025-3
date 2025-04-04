"use client";

import Fuse from 'fuse.js';
import { useEffect, useState } from 'react';

interface Contact {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  head?: boolean | string;
  isHead?: boolean | string;
  headOfHousehold?: boolean | string;
  householdRole?: string;
  // Add other properties as needed
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fuse, setFuse] = useState<Fuse<Contact> | null>(null);

  useEffect(() => {
    // Get wardContactData from localStorage
    const wardContactDataStr = localStorage.getItem('wardContactData');
    //console.log('Raw data from localStorage:', wardContactDataStr ? 'Data exists' : 'No data');
    
    if (wardContactDataStr) {
      try {
        const wardData = JSON.parse(wardContactDataStr);
        //console.log('Parsed wardData structure:', wardData);
        
        // Extract contacts from the data structure
        let allContacts: Contact[] = [];
        
        // The ward.json is an array of households
        if (Array.isArray(wardData)) {
          //console.log('Data is an array of households, length:', wardData.length);
          
          // Process each household
          wardData.forEach((household: any) => {
            if (household.members && Array.isArray(household.members)) {
              //console.log(`Household ${household.name} has ${household.members.length} members`);
              
              // Add all members from the household
              household.members.forEach((member: any) => {
                // Extract phone number
                let phoneNumber = '';
                if (member.phone && member.phone.number) {
                  phoneNumber = member.phone.number;
                } else if (member.phone && member.phone.e164) {
                  phoneNumber = member.phone.e164;
                } else if (typeof member.phone === 'string') {
                  phoneNumber = member.phone;
                }
                
                // Create contact object with properties matching what we need
                allContacts.push({
                  name: member.displayName || member.name,
                  email: member.email ? member.email.email : undefined,
                  phone: phoneNumber,
                  role: member.positions && member.positions.length > 0 ? 
                        member.positions[0].positionTypeName : 'Member',
                  head: member.head
                });
              });
            }
          });
        } else {
          //console.log('Data is not in expected array format, trying to extract data from object');
          // If we somehow got a different format, try to extract data
          // ...existing fallback code
        }
        
        //console.log('All extracted contacts:', allContacts.length);
        // if (allContacts.length === 0) {
        //   console.log('No contacts extracted. Raw wardData:', wardData);
        // } else {
        //   console.log('Sample contact (first in list):', allContacts[0]);
        // }
        
        // Filter contacts: head=true and has phone
        const filteredContacts = allContacts.filter(contact => {
          const isHead = contact.head === true;
          const hasPhone = Boolean(contact.phone && contact.phone.trim() !== '');
          //console.log(`Contact ${contact.name || 'unknown'}: isHead=${isHead}, hasPhone=${hasPhone}`);
          return isHead && hasPhone;
        });
        
        console.log('Filtered contacts count:', filteredContacts.length);
        
        // Format phone numbers and sort by name
        let formattedContacts = filteredContacts.map(contact => {
          // Format phone to +1 (###) ###-####
          let formattedPhone = contact.phone || '';
          
          if (contact.phone) {
            // Strip all non-digit characters
            const digitsOnly = contact.phone.replace(/\D/g, '');
            
            // Format if we have 10 digits (US number without country code)
            if (digitsOnly.length === 10) {
              formattedPhone = `+1 (${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
            }
            // If already has country code (11 digits starting with 1)
            else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
              formattedPhone = `+1 (${digitsOnly.slice(1, 4)}) ${digitsOnly.slice(4, 7)}-${digitsOnly.slice(7)}`;
            }
          }
          
          return {
            ...contact,
            phone: formattedPhone
          };
        }).sort((a, b) => {
          // Sort by last name
          if (a.name && b.name) {
            const aNameParts = a.name.split(' ');
            const bNameParts = b.name.split(' ');
            
            const aLastName = aNameParts.length > 1 ? aNameParts[aNameParts.length - 1] : a.name;
            const bLastName = bNameParts.length > 1 ? bNameParts[bNameParts.length - 1] : b.name;
            
            return aLastName.localeCompare(bLastName);
          }
          return 0;
        });
        
        // Fallback: If no contacts with head=true, just show contacts with phone numbers
        if (formattedContacts.length === 0 && allContacts.length > 0) {
          console.log('No head contacts found, falling back to contacts with phone numbers');
          
          // Fallback to any contacts with phone numbers
          const contactsWithPhones = allContacts.filter(contact => 
            contact.phone && contact.phone.trim() !== ''
          );
          
          console.log('Contacts with phones (fallback):', contactsWithPhones.length);
          
          formattedContacts = contactsWithPhones.map(contact => {
            // Format phone to +1 (###) ###-####
            let formattedPhone = contact.phone || '';
            
            if (contact.phone) {
              // Strip all non-digit characters
              const digitsOnly = contact.phone.replace(/\D/g, '');
              
              // Format if we have 10 digits (US number without country code)
              if (digitsOnly.length === 10) {
                formattedPhone = `+1 (${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
              }
              // If already has country code (11 digits starting with 1)
              else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
                formattedPhone = `+1 (${digitsOnly.slice(1, 4)}) ${digitsOnly.slice(4, 7)}-${digitsOnly.slice(7)}`;
              }
            }
            
            return {
              ...contact,
              phone: formattedPhone
            };
          }).sort((a, b) => {
            // Sort by last name
            if (a.name && b.name) {
              const aNameParts = a.name.split(' ');
              const bNameParts = b.name.split(' ');
              
              const aLastName = aNameParts.length > 1 ? aNameParts[aNameParts.length - 1] : a.name;
              const bLastName = bNameParts.length > 1 ? bNameParts[bNameParts.length - 1] : b.name;
              
              return aLastName.localeCompare(bLastName);
            }
            return 0;
          });
        }
        
        setContacts(formattedContacts);
        setFilteredContacts(formattedContacts);
        
        // Initialize Fuse.js with the contacts
        const fuseOptions = {
          keys: ['name', 'email', 'phone', 'role'],
          threshold: 0.3, // A lower threshold means a more strict match
          includeScore: true
        };
        setFuse(new Fuse(formattedContacts, fuseOptions));
        
      } catch (error) {
        console.error("Error parsing wardContactData:", error);
      }
    }
  }, []);
  
  // Handle search query changes
  useEffect(() => {
    if (!searchQuery || !fuse) {
      setFilteredContacts(contacts);
      return;
    }
    
    const results = fuse.search(searchQuery);
    setFilteredContacts(results.map(result => result.item));
  }, [searchQuery, contacts, fuse]);

  const getInitials = (name?: string) => {
    if (!name) return "??";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  const getRandomColor = (name?: string) => {
    if (!name) return "blue";
    const colors = ["blue", "green", "purple", "amber", "red", "pink", "indigo", "cyan"];
    const index = name.length % colors.length;
    return colors[index];
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Contacts</h1>
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="search"
              placeholder="Search contacts..."
              className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <svg
              className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="bg-card rounded-lg border overflow-hidden">
        {/* Header - hide on mobile */}
        <div className="p-4 border-b bg-muted hidden md:block">
          <div className="grid grid-cols-12 font-medium">
            <div className="col-span-5">Name</div>
            <div className="col-span-3">Role</div>
            <div className="col-span-3">Contact</div>
            <div className="col-span-1"></div>
          </div>
        </div>
        
        <div className="divide-y">
          {filteredContacts.length > 0 ? (
            filteredContacts.map((contact, index) => (
              <div key={index} className="p-4 hover:bg-muted/50">
                {/* Desktop layout - hidden on mobile */}
                <div className="hidden md:grid grid-cols-12 items-center">
                  <div className="col-span-5 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-${getRandomColor(contact.name)}-100 flex items-center justify-center`}>
                      <span className={`text-${getRandomColor(contact.name)}-700 font-medium`}>
                        {getInitials(contact.name)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium">{contact.name || "Unknown"}</h3>
                      <p className="text-xs text-muted-foreground">{contact.email || ""}</p>
                    </div>
                  </div>
                  <div className="col-span-3">{contact.role || "Member"}</div>
                  <div className="col-span-3">{contact.phone || ""}</div>
                  <div className="col-span-1 text-right">
                    <button className="text-primary hover:underline text-sm">View</button>
                  </div>
                </div>
                
                {/* Mobile layout - shown only on small screens */}
                <div className="md:hidden flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-${getRandomColor(contact.name)}-100 flex items-center justify-center`}>
                      <span className={`text-${getRandomColor(contact.name)}-700 font-medium`}>
                        {getInitials(contact.name)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {contact.name ? 
                          (() => {
                            const nameParts = contact.name.split(' ');
                            // Get first name and last name only
                            return nameParts.length > 1 ? 
                              `${nameParts[0]} ${nameParts[nameParts.length - 1]}` : 
                              contact.name;
                          })() : 
                          "Unknown"}
                      </h3>
                      {contact.role && contact.role !== "Member" && (
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {contact.role.length > 20 ? 
                            contact.role.split(' ').slice(0, 2).join(' ') + '...' : 
                            contact.role}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-right">
                      {contact.phone}
                    </div>
                    <a href={`tel:${contact.phone?.replace(/\D/g, '')}`} className="text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              {searchQuery 
                ? `No contacts found matching "${searchQuery}". Try a different search term.` 
                : "No contacts found that match the criteria. Make sure you have imported your ward data."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 