"use client";

import Fuse from 'fuse.js';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Contact, checkDoNotContactStatus, toggleDoNotContactStatus } from './actions';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fuse, setFuse] = useState<Fuse<Contact> | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingContact, setProcessingContact] = useState<string | null>(null);

  useEffect(() => {
    // Get wardContactData from localStorage
    const wardContactDataStr = localStorage.getItem('wardContactData');
    
    if (wardContactDataStr) {
      try {
        setLoading(true);
        const wardData = JSON.parse(wardContactDataStr);
        
        // Extract contacts from the data structure
        let allContacts: Contact[] = [];
        
        // The ward.json is an array of households
        if (Array.isArray(wardData)) {
          // Process each household
          wardData.forEach((household: any) => {
            if (household.members && Array.isArray(household.members)) {
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
          // If we somehow got a different format, try to extract data
          // ...existing fallback code
        }
        
        // Filter contacts: head=true and has phone
        const filteredContacts = allContacts.filter(contact => {
          const isHead = contact.head === true;
          const hasPhone = Boolean(contact.phone && contact.phone.trim() !== '');
          return isHead && hasPhone;
        });
        
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
        
        // Check do-not-contact status for all contacts
        checkDoNotContactStatus(formattedContacts)
          .then(enhancedContacts => {
            setContacts(enhancedContacts);
            setFilteredContacts(enhancedContacts);
            
            // Initialize Fuse.js with the contacts
            const fuseOptions = {
              keys: ['name', 'email', 'phone', 'role'],
              threshold: 0.3, // A lower threshold means a more strict match
              includeScore: true
            };
            setFuse(new Fuse(enhancedContacts, fuseOptions));
            setLoading(false);
          })
          .catch(error => {
            console.error("Error checking do-not-contact status:", error);
            setContacts(formattedContacts);
            setFilteredContacts(formattedContacts);
            setLoading(false);
          });
        
      } catch (error) {
        console.error("Error parsing wardContactData:", error);
        setLoading(false);
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
  
  const getShortName = (name?: string) => {
    if (!name) return "Unknown";
    const nameParts = name.split(' ');
    // Get first name and last name only
    return nameParts.length > 1 ? 
      `${nameParts[0]} ${nameParts[nameParts.length - 1]}` : 
      name;
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleToggleDoNotContact = async (contact: Contact) => {
    if (!contact.name || !contact.phone || !contact.userHash) {
      toast.error("Cannot update contact: Missing required information");
      return;
    }
    
    setProcessingContact(contact.userHash);
    
    try {
      const newStatus = !contact.doNotContact;
      
      const result = await toggleDoNotContactStatus(contact, newStatus);
      
      if (result.success) {
        // Update the contact in the local state
        const updatedContacts = contacts.map(c => 
          c.userHash === contact.userHash 
            ? { ...c, doNotContact: newStatus } 
            : c
        );
        
        setContacts(updatedContacts);
        
        // Update filtered contacts as well
        const updatedFilteredContacts = filteredContacts.map(c => 
          c.userHash === contact.userHash 
            ? { ...c, doNotContact: newStatus } 
            : c
        );
        
        setFilteredContacts(updatedFilteredContacts);
        
        toast.success(newStatus 
          ? "Contact marked as 'Do Not Contact'" 
          : "Contact removed from 'Do Not Contact' list"
        );
      } else {
        toast.error(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Error toggling do-not-contact status:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setProcessingContact(null);
    }
  };

  const getUserTypeBadge = (userType?: string) => {
    if (!userType || userType === 'unknown') return null;
    
    const bgColor = userType === 'imported' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900';
    const textColor = userType === 'imported' ? 'text-blue-800 dark:text-blue-300' : 'text-green-800 dark:text-green-300';
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-8 ${bgColor} ${textColor}`}>
        {userType === 'imported' ? 'Imported' : 'Registered'}
      </span>
    );
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
      
      {loading ? (
        <div className="flex justify-center items-center p-8">
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
      ) : (
        <div className="bg-card rounded-lg border overflow-hidden shadow-sm dark:shadow-gray-800/30">
          {/* Header - hide on mobile */}
          <div className="p-4 border-b bg-muted hidden md:block">
            <div className="grid grid-cols-12 font-medium">
              <div className="col-span-5">Name</div>
              <div className="col-span-3">Role</div>
              <div className="col-span-3">Contact</div>
              <div className="col-span-1">Do Not Contact</div>
            </div>
          </div>
          
          <div className="divide-y">
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact, index) => (
                <div 
                  key={index} 
                  className={`p-4 ${
                    contact.doNotContact 
                      ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  {/* Desktop layout - hidden on mobile */}
                  <div className="hidden md:grid grid-cols-12 items-center">
                    <div className="col-span-5 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-${getRandomColor(contact.name)}-100 dark:bg-${getRandomColor(contact.name)}-900/30 flex items-center justify-center flex-shrink-0`}>
                        <span className={`text-${getRandomColor(contact.name)}-700 dark:text-${getRandomColor(contact.name)}-300 font-medium`}>
                          {getInitials(contact.name)}
                        </span>
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium truncate mr-2">{getShortName(contact.name)}</h3>
                          {getUserTypeBadge(contact.userType)}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{contact.email || ""}</p>
                      </div>
                    </div>
                    <div className="col-span-3 truncate">{contact.role || "Member"}</div>
                    <div className="col-span-3 truncate">{contact.phone || ""}</div>
                    <div className="col-span-1 text-right">
                      <button 
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                          contact.doNotContact ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                        role="switch"
                        aria-checked={contact.doNotContact}
                        disabled={processingContact === contact.userHash}
                        onClick={() => handleToggleDoNotContact(contact)}
                      >
                        <span 
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            contact.doNotContact ? 'translate-x-5' : 'translate-x-0'
                          }`} 
                        />
                        {processingContact === contact.userHash && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <svg 
                              className="h-3 w-3 text-white animate-spin" 
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
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Mobile layout - shown only on small screens */}
                  <div className="md:hidden flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-grow">
                      <div className={`w-10 h-10 rounded-full bg-${getRandomColor(contact.name)}-100 dark:bg-${getRandomColor(contact.name)}-900/30 flex items-center justify-center flex-shrink-0`}>
                        <span className={`text-${getRandomColor(contact.name)}-700 dark:text-${getRandomColor(contact.name)}-300 font-medium`}>
                          {getInitials(contact.name)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-grow">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium truncate mr-2">
                            {getShortName(contact.name)}
                          </h3>
                          {getUserTypeBadge(contact.userType)}
                        </div>
                        <div className="flex items-center gap-2">
                          {contact.role && contact.role !== "Member" && (
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {contact.role.length > 20 ? 
                                contact.role.split(' ').slice(0, 2).join(' ') + '...' : 
                                contact.role}
                            </p>
                          )}
                          {contact.doNotContact && (
                            <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 rounded">
                              Do Not Contact
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                      <div className="text-sm text-right">
                        {contact.phone}
                      </div>
                      <button 
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                          contact.doNotContact ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                        role="switch"
                        aria-checked={contact.doNotContact}
                        disabled={processingContact === contact.userHash}
                        onClick={() => handleToggleDoNotContact(contact)}
                      >
                        <span 
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            contact.doNotContact ? 'translate-x-5' : 'translate-x-0'
                          }`} 
                        />
                        {processingContact === contact.userHash && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <svg 
                              className="h-3 w-3 text-white animate-spin" 
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
                          </span>
                        )}
                      </button>
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
      )}
    </div>
  );
} 