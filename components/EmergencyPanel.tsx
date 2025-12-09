import React, { useState, useEffect } from 'react';
import { Coordinates, SafePlace, Contact } from '../types';
import { findSafePlaces } from '../services/geminiService';

interface EmergencyPanelProps {
  currentLocation: Coordinates | null;
  onRequestLocation: () => void;
}

const EmergencyPanel: React.FC<EmergencyPanelProps> = ({ currentLocation, onRequestLocation }) => {
  const [isShared, setIsShared] = useState(false);
  const [loadingSafe, setLoadingSafe] = useState(false);
  const [safePlaces, setSafePlaces] = useState<SafePlace[]>([]);
  const [showSafeList, setShowSafeList] = useState(false);
  
  // Manual location state
  const [manualAddress, setManualAddress] = useState('');
  const [isEditingLoc, setIsEditingLoc] = useState(false);

  // Contact Management State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [isManagingContacts, setIsManagingContacts] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // Auto-request location if not available when component mounts
  useEffect(() => {
    if (!currentLocation && !manualAddress) {
        onRequestLocation();
    }
  }, [currentLocation, manualAddress, onRequestLocation]);

  // Load contacts from local storage
  useEffect(() => {
    const saved = localStorage.getItem('guardian_contacts');
    if (saved) {
        try {
            setContacts(JSON.parse(saved));
        } catch (e) {
            console.error("Failed to parse contacts", e);
        }
    }
  }, []);

  const saveContacts = (newContacts: Contact[]) => {
    setContacts(newContacts);
    localStorage.setItem('guardian_contacts', JSON.stringify(newContacts));
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;
    
    const newContact: Contact = {
        id: Date.now().toString(),
        name: newName.trim(),
        phone: newPhone.trim()
    };
    
    saveContacts([...contacts, newContact]);
    setNewName('');
    setNewPhone('');
    setIsManagingContacts(false);
  };

  const handleDeleteContact = (id: string) => {
    saveContacts(contacts.filter(c => c.id !== id));
  };

  const getShareUrl = () => {
    const locString = manualAddress 
        ? manualAddress 
        : (currentLocation ? `${currentLocation.latitude},${currentLocation.longitude}` : '');
    
    if (manualAddress) {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(manualAddress)}`;
    }
    return locString ? `https://www.google.com/maps?q=${locString}` : '';
  };

  const handleSystemShare = () => {
    const mapsLink = getShareUrl();
    if (!mapsLink) {
        onRequestLocation();
        setIsEditingLoc(true);
        setShowSafeList(true); // Direct user to input location
        setShowSharePanel(false);
        return;
    }
        
    const message = `I'm using GuardianMate and wanted to share my location with you: ${mapsLink}`;

    if (navigator.share) {
      navigator.share({
        title: 'My Location',
        text: message,
        url: mapsLink
      }).then(() => {
          setIsShared(true);
          setShowSharePanel(false);
      }).catch((e) => console.log('Share dismissed', e));
    } else {
        // Fallback to clipboard
        navigator.clipboard.writeText(message);
        setIsShared(true);
        setTimeout(() => setIsShared(false), 3000);
        setShowSharePanel(false);
    }
  };

  const handleSmsShare = (phone: string) => {
    const mapsLink = getShareUrl();
    if (!mapsLink) {
        onRequestLocation();
        setIsEditingLoc(true);
        setShowSafeList(true);
        setShowSharePanel(false);
        return;
    }

    const message = `I'm using GuardianMate. Here is my location: ${mapsLink}`;
    // Simple SMS link. Note: body support varies by OS/Device.
    window.location.href = `sms:${phone}?body=${encodeURIComponent(message)}`;
  };

  const toggleSharePanel = () => {
    if (showSafeList) setShowSafeList(false); // Close other panel
    setShowSharePanel(!showSharePanel);
  };

  const toggleSafeList = () => {
    if (showSharePanel) setShowSharePanel(false); // Close other panel
    handleGetSafe();
  };

  const executeFindSafePlaces = async (location: Coordinates | string) => {
    setLoadingSafe(true);
    try {
        const places = await findSafePlaces(location);
        setSafePlaces(places);
    } catch (e) {
        console.error(e);
    } finally {
        setLoadingSafe(false);
    }
  };

  const handleGetSafe = () => {
    setShowSafeList(true);
    
    // If we have a manual address, use it
    if (manualAddress) {
        executeFindSafePlaces(manualAddress);
        return;
    }

    // If we have GPS, use it
    if (currentLocation) {
        executeFindSafePlaces(currentLocation);
        return;
    }

    // Otherwise, we need input
    setIsEditingLoc(true);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualAddress.trim()) {
        setIsEditingLoc(false);
        executeFindSafePlaces(manualAddress);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
      <div className="max-w-2xl mx-auto">
        
        {/* Safe Places Panel */}
        {showSafeList && (
            <div className="mb-4 animate-slide-up bg-slate-50 p-4 rounded-xl border border-slate-100 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-slate-800">Nearby Safe Havens</h3>
                    <button onClick={() => setShowSafeList(false)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
                </div>
                
                {/* Location Status Bar */}
                <div className="flex items-center justify-between text-xs mb-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-600 truncate mr-2 flex-1">
                        <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {isEditingLoc ? (
                            <span className="font-medium text-slate-800">Enter your correct location:</span>
                        ) : (
                            <span className="truncate">
                                <span className="font-semibold text-slate-500">Near:</span> {manualAddress ? manualAddress : (currentLocation ? 'Detected GPS Location' : 'Unknown Location')}
                            </span>
                        )}
                    </div>
                    {!isEditingLoc && (
                        <button 
                            onClick={() => setIsEditingLoc(true)}
                            className="text-emerald-600 font-bold hover:text-emerald-700 hover:underline whitespace-nowrap px-2 py-1 rounded hover:bg-emerald-50 transition-colors"
                        >
                            Change Location
                        </button>
                    )}
                </div>

                {isEditingLoc && (
                    <form onSubmit={handleManualSubmit} className="mb-3 flex gap-2">
                        <input 
                            type="text" 
                            value={manualAddress}
                            onChange={(e) => setManualAddress(e.target.value)}
                            placeholder="e.g. 123 Main St, Central Park, etc."
                            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-emerald-500 shadow-sm"
                            autoFocus
                        />
                        <button 
                            type="submit" 
                            className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-sm"
                        >
                            Update
                        </button>
                    </form>
                )}
                
                {loadingSafe ? (
                    <div className="flex items-center justify-center py-8 text-emerald-600 gap-2">
                        <div className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                        <span className="text-sm font-medium">Finding safe places nearby...</span>
                    </div>
                ) : safePlaces.length > 0 ? (
                    <div className="space-y-2">
                        {safePlaces.map((place, idx) => (
                            <div 
                                key={idx} 
                                className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all group"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-medium text-slate-800 text-sm leading-tight truncate">{place.title}</span>
                                        {place.phoneNumber && (
                                            <span className="text-xs text-slate-500 truncate mt-0.5 flex items-center gap-1">
                                                <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                {place.phoneNumber}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pl-2">
                                    {place.phoneNumber && (
                                        <a 
                                            href={`tel:${place.phoneNumber}`}
                                            className="text-white bg-emerald-500 hover:bg-emerald-600 p-2 rounded-lg transition-colors shadow-sm flex items-center justify-center"
                                            title="Call"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                        </a>
                                    )}
                                    <a 
                                        href={place.uri} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1 transition-colors"
                                    >
                                        Directions
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : !isEditingLoc && (
                    <div className="text-center py-6 bg-white rounded-lg border border-slate-100">
                        <p className="text-sm text-slate-500 mb-2">No specific safe places found nearby.</p>
                        <button 
                            onClick={() => setIsEditingLoc(true)}
                            className="text-xs text-emerald-600 font-medium hover:underline"
                        >
                            Try entering your address manually
                        </button>
                    </div>
                )}
            </div>
        )}

        {/* Contacts / Share Panel */}
        {showSharePanel && (
            <div className="mb-4 animate-slide-up bg-slate-50 p-4 rounded-xl border border-slate-100 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-slate-800">Send Location To...</h3>
                    <button onClick={() => setShowSharePanel(false)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
                </div>

                {contacts.length > 0 && !isManagingContacts && (
                    <div className="space-y-2 mb-4">
                        {contacts.map(contact => (
                            <button
                                key={contact.id}
                                onClick={() => handleSmsShare(contact.phone)}
                                className="w-full flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-xs">
                                        {contact.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-medium text-slate-800 text-sm">{contact.name}</div>
                                        <div className="text-slate-400 text-xs">{contact.phone}</div>
                                    </div>
                                </div>
                                <span className="text-emerald-600 text-xs font-semibold whitespace-nowrap bg-emerald-50 px-3 py-1.5 rounded-full group-hover:bg-emerald-200 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                    Send SMS
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Main Action Buttons in Share Panel */}
                <div className="flex gap-2 flex-col">
                     {!isManagingContacts && (
                        <button
                            onClick={handleSystemShare}
                            className="w-full py-3 px-4 rounded-lg bg-slate-200 text-slate-700 font-medium hover:bg-slate-300 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                            Share via other apps
                        </button>
                    )}

                    {!isManagingContacts ? (
                        <button
                            onClick={() => setIsManagingContacts(true)}
                            className="w-full py-2 px-4 rounded-lg text-slate-500 text-sm hover:text-slate-700 transition-colors underline"
                        >
                            {contacts.length === 0 ? "Add Emergency Contacts" : "Manage Contacts"}
                        </button>
                    ) : (
                        <div className="bg-slate-100 p-4 rounded-lg border border-slate-200">
                            <h4 className="font-semibold text-slate-700 mb-3 text-sm">Manage Contacts</h4>
                            
                            {/* List to delete */}
                            {contacts.length > 0 && (
                                <ul className="mb-4 space-y-2">
                                    {contacts.map(contact => (
                                        <li key={contact.id} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 text-sm">
                                            <span className="text-slate-700 font-medium">{contact.name}</span>
                                            <button 
                                                onClick={() => handleDeleteContact(contact.id)}
                                                className="text-rose-500 hover:text-rose-700 p-1"
                                                title="Remove contact"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* Add New Form */}
                            <form onSubmit={handleAddContact} className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Name (e.g. Mom)"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-emerald-500"
                                    required
                                />
                                <input
                                    type="tel"
                                    placeholder="Phone Number"
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-emerald-500"
                                    required
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsManagingContacts(false)}
                                        className="flex-1 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg"
                                    >
                                        Done
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                                    >
                                        Add
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Bottom Bar Buttons */}
        <div className="flex gap-3">
          <button
            onClick={toggleSharePanel}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${showSharePanel || isShared ? 'bg-emerald-500' : 'bg-rose-500 hover:bg-rose-600'}`}
          >
            {isShared ? (
                <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Sent/Copied
                </>
            ) : (
                <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Send Location
                </>
            )}
          </button>
          
          <button
            onClick={toggleSafeList}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${showSafeList ? 'bg-slate-900' : 'bg-slate-800 hover:bg-slate-900'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
            Leave Area / Safe Places
          </button>
        </div>
        <p className="text-xs text-center text-slate-400 mt-2">
            Using your location to help contacts find you or guide you to safety.
        </p>
      </div>
    </div>
  );
};

export default EmergencyPanel;