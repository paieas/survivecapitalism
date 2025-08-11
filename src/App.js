import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    signInAnonymously, 
    GoogleAuthProvider, 
    signInWithPopup, 
    linkWithCredential,
    signOut
} from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, deleteDoc, query, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Helper Icons (as SVG components) ---
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const DebtIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const BudgetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 4h4m2 4h-3a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2" /></svg>;
const StrategyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const AiIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const BillShockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const GoogleIcon = () => <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C44.592 34.933 48 29.861 48 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>;
const SignOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;

// --- Firebase Configuration ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'finance-copilot-default';
const firebaseConfig =  typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {apiKey: "AIzaSyB7q_py7uyfSSXmXgymeeX7SCHCSeojGxw",
  authDomain: "get-out-of-capitalistic-jail.firebaseapp.com",
  projectId: "get-out-of-capitalistic-jail",
  storageBucket: "get-out-of-capitalistic-jail.firebasestorage.app",
  messagingSenderId: "112263344335",
  appId: "1:112263344335:web:89d4010f3bf19bab9f07ba",
  measurementId: "G-8J17CLN2JW"
};

// --- Main App Component ---
export default function App() {
    const [auth, setAuth] = useState(null);
    const [db, setDb] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeView, setActiveView] = useState('budget');
    const [isXlsxLoaded, setIsXlsxLoaded] = useState(false);

    // --- Data States ---
    const [budgetItems, setBudgetItems] = useState([]);
    const [debts, setDebts] = useState([]);
    const [events, setEvents] = useState([]);

    // --- Event Logging Function ---
    const logEvent = async (description) => {
        if (!user || !db) return;
        try {
            const eventsCollectionRef = collection(db, `artifacts/${appId}/users/${user.uid}/events`);
            await addDoc(eventsCollectionRef, {
                description,
                timestamp: serverTimestamp(),
            });
        } catch (error) {
            console.error("Error logging event:", error);
        }
    };

    // --- Script and Firebase Initialization ---
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
        script.async = true;
        script.onload = () => setIsXlsxLoaded(true);
        script.onerror = () => console.error("Failed to load the XLSX script.");
        document.head.appendChild(script);

        try {
            const app = initializeApp(firebaseConfig);
            const authInstance = getAuth(app);
            const dbInstance = getFirestore(app);
            setAuth(authInstance);
            setDb(dbInstance);

            const unsubscribe = onAuthStateChanged(authInstance, async (currentUser) => {
                if (currentUser) {
                    setUser(currentUser);
                } else {
                    try {
                        await signInAnonymously(authInstance);
                    } catch (error) {
                        console.error("Automatic anonymous sign-in failed:", error);
                    }
                }
                setIsLoading(false);
            });
            
            return () => {
                unsubscribe();
                if(document.head.contains(script)) {
                    document.head.removeChild(script);
                }
            };
        } catch (error) {
            console.error("Firebase initialization failed:", error);
            setIsLoading(false);
        }
    }, []);

    // --- Firestore Data Subscriptions ---
    useEffect(() => {
        if (!user || !db) {
            setBudgetItems([]);
            setDebts([]);
            setEvents([]);
            return;
        };
        
        const dataQuery = (collectionName) => query(collection(db, `artifacts/${appId}/users/${user.uid}/${collectionName}`));
        const eventsQuery = query(collection(db, `artifacts/${appId}/users/${user.uid}/events`), orderBy('timestamp', 'desc'));

        const unsubBudget = onSnapshot(dataQuery('budget'), snapshot => setBudgetItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        const unsubDebts = onSnapshot(dataQuery('debts'), snapshot => setDebts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        const unsubEvents = onSnapshot(eventsQuery, snapshot => setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

        return () => {
            unsubBudget();
            unsubDebts();
            unsubEvents();
        };
    }, [user, db]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen bg-gray-900 text-white"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div></div>;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
            <div className="container mx-auto p-4 md:p-8">
                <Header user={user} auth={auth} logEvent={logEvent} />
                <Navbar activeView={activeView} setActiveView={setActiveView} />
                <main className="mt-8">
                    {activeView === 'budget' && <BudgetManager db={db} user={user} budgetItems={budgetItems} isXlsxLoaded={isXlsxLoaded} logEvent={logEvent} />}
                    {activeView === 'debts' && <DebtManager db={db} user={user} debts={debts} logEvent={logEvent} />}
                    {activeView === 'strategy' && <DebtStrategyView debts={debts} />}
                    {activeView === 'ai' && <AiAnalyst budgetItems={budgetItems} logEvent={logEvent} />}
                    {activeView === 'billshock' && <BillShockPlanner budgetItems={budgetItems} debts={debts} logEvent={logEvent} />}
                    {activeView === 'history' && <HistoryView events={events} />}
                </main>
            </div>
        </div>
    );
}

// --- Sub-components ---

function AuthManager({ user, auth, logEvent }) {
    const handleLinkAccount = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            if (auth.currentUser && auth.currentUser.isAnonymous) {
                await linkWithCredential(auth.currentUser, credential);
                logEvent("Linked anonymous account to Google.");
                alert("Your account has been saved! You can now sign in from any device.");
            }
        } catch (error) {
            console.error("Failed to link account:", error);
            if (error.code === 'auth/credential-already-in-use') {
                alert("Failed to save account. This Google account is already linked to another user.");
            } else {
                alert("Failed to save account. Please try again.");
            }
        }
    };

    const handleSignOut = async () => {
        const oldUserEmail = user.email;
        try {
            await signOut(auth);
            logEvent(`Signed out from ${oldUserEmail}.`);
        } catch (error) {
            console.error("Sign out failed:", error);
        }
    };

    if (!user) return null;

    return (
        <div className="flex items-center gap-4">
            {user.isAnonymous ? (
                <>
                    <span className="text-sm text-gray-400">Guest Mode</span>
                    <button onClick={handleLinkAccount} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center">
                        <GoogleIcon /> Save Account
                    </button>
                </>
            ) : (
                <>
                    <span className="text-sm text-white hidden md:block">{user.email}</span>
                    <button onClick={handleSignOut} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg transition-colors duration-200 flex items-center">
                        <SignOutIcon /> Sign Out
                    </button>
                </>
            )}
        </div>
    );
}


function Header({ user, auth, logEvent }) {
    return (
        <header className="bg-gray-800 rounded-lg p-4 mb-8 shadow-lg flex justify-between items-center flex-wrap gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Finance Co-Pilot</h1>
                <p className="text-sm text-blue-300">Your intelligent guide to financial clarity.</p>
            </div>
            <AuthManager user={user} auth={auth} logEvent={logEvent} />
        </header>
    );
}

function Navbar({ activeView, setActiveView }) {
    const navItems = [
        { id: 'budget', label: 'Budget', icon: <BudgetIcon /> },
        { id: 'debts', label: 'Debt Center', icon: <DebtIcon /> },
        { id: 'strategy', label: 'Payoff Strategy', icon: <StrategyIcon /> },
        { id: 'billshock', label: 'Bill Shock', icon: <BillShockIcon /> },
        { id: 'ai', label: 'AI Analyst', icon: <AiIcon /> },
        { id: 'history', label: 'History', icon: <HistoryIcon /> },
    ];

    return (
        <nav className="bg-gray-800 rounded-lg p-2 shadow-md">
            <ul className="flex flex-wrap justify-around">
                {navItems.map(item => (
                    <li key={item.id} className="flex-grow">
                        <button
                            onClick={() => setActiveView(item.id)}
                            className={`w-full flex flex-col sm:flex-row items-center justify-center p-3 rounded-md transition-colors duration-200 text-center ${activeView === item.id ? 'bg-blue-600 text-white shadow-inner' : 'hover:bg-gray-700'}`}
                        >
                            {item.icon}
                            <span className="mt-1 sm:mt-0 sm:ml-2">{item.label}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

function BudgetManager({ db, user, budgetItems, isXlsxLoaded, logEvent }) {
    const handleFileUpload = (event) => {
        if (!window.XLSX) {
            alert("Excel library is not loaded yet. Please try again in a moment.");
            return;
        }
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = window.XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = window.XLSX.utils.sheet_to_json(worksheet);

                const budgetCollectionRef = collection(db, `artifacts/${appId}/users/${user.uid}/budget`);
                const existingDocs = await getDocs(budgetCollectionRef);
                for (const docSnapshot of existingDocs.docs) {
                    await deleteDoc(docSnapshot.ref);
                }

                for (const item of json) {
                    const category = item.Category || 'Uncategorized';
                    const allocated = parseFloat(item.Allocated) || 0;
                    const spent = parseFloat(item.Spent) || 0;
                    const docId = category.replace(/[^a-zA-Z0-9]/g, '_');
                    const docRef = doc(db, `artifacts/${appId}/users/${user.uid}/budget`, docId);
                    await setDoc(docRef, { category, allocated, spent });
                }
                logEvent(`Imported budget from file: ${file.name}`);
            } catch (error) {
                console.error("Error processing file:", error);
                alert("Failed to process the Excel file. Please ensure it has 'Category', 'Allocated', and 'Spent' columns.");
            }
        };
        reader.readAsArrayBuffer(file);
    };
    
    const handleExport = () => {
        if (!window.XLSX) {
            alert("Excel library is not loaded yet. Please try again in a moment.");
            return;
        }
        const dataToExport = budgetItems.map(({ id, ...rest }) => rest);
        const worksheet = window.XLSX.utils.json_to_sheet(dataToExport);
        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, worksheet, "Budget");
        window.XLSX.writeFile(workbook, "budget_export.xlsx");
        logEvent("Exported budget to Excel file.");
    };

    return (
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-white">Budget Overview</h2>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                 <label className={`flex-1 cursor-pointer bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center ${!isXlsxLoaded ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}>
                    <UploadIcon />
                    <span>Import from Excel</span>
                    <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} disabled={!isXlsxLoaded} />
                </label>
                <button onClick={handleExport} disabled={!isXlsxLoaded || budgetItems.length === 0} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed">
                    Export to Excel
                </button>
            </div>
            
            <p className="text-sm text-gray-400 mb-4">Import an Excel file with columns: "Category", "Allocated", and "Spent". The existing budget will be replaced.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Budget Details</h3>
                    <div className="overflow-auto max-h-96">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-gray-700">
                                <tr>
                                    <th className="p-2">Category</th>
                                    <th className="p-2">Allocated</th>
                                    <th className="p-2">Spent</th>
                                    <th className="p-2">Remaining</th>
                                </tr>
                            </thead>
                            <tbody>
                                {budgetItems.length > 0 ? budgetItems.map(item => (
                                    <tr key={item.id} className="border-t border-gray-600">
                                        <td className="p-2">{item.category}</td>
                                        <td className="p-2 text-green-400">${item.allocated.toFixed(2)}</td>
                                        <td className="p-2 text-red-400">${item.spent.toFixed(2)}</td>
                                        <td className={`p-2 font-bold ${item.allocated - item.spent >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                                            ${(item.allocated - item.spent).toFixed(2)}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4" className="text-center p-4">No budget data. Please import a file.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                 <div className="bg-gray-700 p-4 rounded-lg min-h-[300px]">
                     <h3 className="font-semibold mb-2">Spending Chart</h3>
                     {budgetItems.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                             <BarChart data={budgetItems} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                                <XAxis dataKey="category" hide={true} />
                                <YAxis stroke="#a0aec0" />
                                <Tooltip contentStyle={{ backgroundColor: '#2d3748', border: '1px solid #4a5568' }} />
                                <Legend />
                                <Bar dataKey="spent" fill="#ef4444" name="Spent" />
                                <Bar dataKey="allocated" fill="#22c55e" name="Allocated" />
                            </BarChart>
                        </ResponsiveContainer>
                     ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">Chart will appear here</div>
                     )}
                </div>
            </div>
        </div>
    );
}

function Modal({ isOpen, onClose, onConfirm, title, children }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl w-full max-w-md">
                <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
                <div className="text-gray-300 mb-6">{children}</div>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">Confirm</button>
                </div>
            </div>
        </div>
    );
}

function DebtManager({ db, user, debts, logEvent }) {
    const [formState, setFormState] = useState({ name: '', balance: '', apr: '', minPayment: '', sensitivity: 'Medium' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [debtToDelete, setDebtToDelete] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormState(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formState.name || !formState.balance || !formState.apr || !formState.minPayment) {
            alert("Please fill out all fields.");
            return;
        }
        const newDebt = { ...formState, balance: parseFloat(formState.balance), apr: parseFloat(formState.apr), minPayment: parseFloat(formState.minPayment) };
        const docId = formState.name.replace(/[^a-zA-Z0-9]/g, '_');
        const docRef = doc(db, `artifacts/${appId}/users/${user.uid}/debts`, docId);
        await setDoc(docRef, newDebt);
        logEvent(`Added new debt: ${formState.name}`);
        setFormState({ name: '', balance: '', apr: '', minPayment: '', sensitivity: 'Medium' });
    };

    const openDeleteModal = (debt) => {
        setDebtToDelete(debt);
        setIsModalOpen(true);
    };

    const confirmDelete = async () => {
        if (debtToDelete) {
            const docRef = doc(db, `artifacts/${appId}/users/${user.uid}/debts`, debtToDelete.id);
            await deleteDoc(docRef);
            logEvent(`Deleted debt: ${debtToDelete.name}`);
        }
        setIsModalOpen(false);
        setDebtToDelete(null);
    };

    return (
        <>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={confirmDelete} title="Confirm Deletion">
                Are you sure you want to delete the debt: <span className="font-bold text-white">{debtToDelete?.name}</span>? This action cannot be undone.
            </Modal>
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <h2 className="text-xl font-bold mb-4 text-white">Debt Center</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h3 className="font-semibold mb-2">Add a New Bill or Debt</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="text" name="name" value={formState.name} onChange={handleInputChange} placeholder="Credit Card Name or Loan" className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <input type="number" name="balance" value={formState.balance} onChange={handleInputChange} placeholder="Total Amount Owed ($)" className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <input type="number" name="apr" value={formState.apr} onChange={handleInputChange} placeholder="Annual Percentage Rate (APR %)" className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <input type="number" name="minPayment" value={formState.minPayment} onChange={handleInputChange} placeholder="Minimum Monthly Payment ($)" className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <div>
                                <label htmlFor="sensitivity" className="block text-sm font-medium text-gray-300 mb-1">Payment Sensitivity</label>
                                <select name="sensitivity" id="sensitivity" value={formState.sensitivity} onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="High">High (Reports to credit)</option>
                                    <option value="Medium">Medium (Incurs late fees)</option>
                                    <option value="Low">Low (Has grace period)</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">Add Debt</button>
                        </form>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Your Debts</h3>
                        <div className="space-y-3 max-h-96 overflow-auto">
                            {debts.length > 0 ? debts.map(debt => (
                                <div key={debt.id} className="bg-gray-700 p-3 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-bold">{debt.name}</p>
                                        <p className="text-sm text-gray-400">
                                            Balance: <span className="text-red-400">${debt.balance.toFixed(2)}</span> | APR: <span className="text-orange-400">{debt.apr}%</span> | Sensitivity: <span className="font-semibold">{debt.sensitivity}</span>
                                        </p>
                                    </div>
                                    <button onClick={() => openDeleteModal(debt)} className="text-gray-500 hover:text-red-500 transition-colors">
                                        <TrashIcon />
                                    </button>
                                </div>
                            )) : (
                                <p className="text-center p-4">No debts added yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function DebtStrategyView({ debts }) {
    const [extraPayment, setExtraPayment] = useState(100);

    const calculatePayoff = (debts, strategy, extraPayment) => {
        if (!debts || debts.length === 0) return { months: 0, totalInterest: 0, totalPaid: 0, plan: [] };

        let localDebts = JSON.parse(JSON.stringify(debts));
        let sortedDebts;

        if (strategy === 'avalanche') {
            sortedDebts = localDebts.sort((a, b) => b.apr - a.apr);
        } else { // snowball
            sortedDebts = localDebts.sort((a, b) => a.balance - b.balance);
        }

        let months = 0;
        let totalInterestPaid = 0;

        while (sortedDebts.some(d => d.balance > 0)) {
            months++;
            let freedUpPayments = 0;

            for (const debt of sortedDebts) {
                if (debt.balance > 0) {
                    const interest = (debt.balance * (debt.apr / 100)) / 12;
                    debt.balance += interest;
                    totalInterestPaid += interest;
                }
            }

            for (const debt of sortedDebts) {
                 if (debt.balance > 0) {
                    let payment = debt.minPayment;
                    if (debt.balance < payment) {
                        payment = debt.balance;
                    }
                    debt.balance -= payment;
                    if(debt.balance <= 0) {
                        freedUpPayments += debt.minPayment;
                    }
                }
            }

            let remainingExtra = extraPayment + freedUpPayments;
            for (const debt of sortedDebts) {
                if (debt.balance > 0) {
                    const payment = Math.min(remainingExtra, debt.balance);
                    debt.balance -= payment;
                    remainingExtra -= payment;
                    if (remainingExtra <= 0) break;
                }
            }
            
            if (months > 1200) break; 
        }

        return { months, totalInterest: totalInterestPaid };
    };

    const avalancheResult = useMemo(() => calculatePayoff(debts, 'avalanche', extraPayment), [debts, extraPayment]);
    const snowballResult = useMemo(() => calculatePayoff(debts, 'snowball', extraPayment), [debts, extraPayment]);
    
    const getPayoffOrder = (strategy) => {
        if (!debts || debts.length === 0) return [];
        if (strategy === 'avalanche') {
            return [...debts].sort((a, b) => b.apr - a.apr);
        }
        return [...debts].sort((a, b) => a.balance - b.balance);
    }

    return (
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-white">Debt Payoff Strategy</h2>
            <div className="mb-6">
                <label htmlFor="extraPayment" className="block text-sm font-medium text-gray-300 mb-2">Extra Monthly Payment ($)</label>
                <input
                    type="number"
                    id="extraPayment"
                    value={extraPayment}
                    onChange={(e) => setExtraPayment(parseFloat(e.target.value) || 0)}
                    className="w-full md:w-1/3 bg-gray-700 border border-gray-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {debts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <StrategyCard title="Avalanche Method" subtitle="Highest Interest Rate First" result={avalancheResult} payoffOrder={getPayoffOrder('avalanche')} />
                    <StrategyCard title="Snowball Method" subtitle="Smallest Balance First" result={snowballResult} payoffOrder={getPayoffOrder('snowball')} />
                </div>
            ) : (
                <p className="text-center p-4">Add some debts in the 'Debt Center' to see payoff strategies.</p>
            )}
        </div>
    );
}

function StrategyCard({ title, subtitle, result, payoffOrder }) {
    return (
        <div className="bg-gray-700 p-6 rounded-lg">
            <h3 className="text-2xl font-bold text-blue-400">{title}</h3>
            <p className="text-gray-400 mb-4">{subtitle}</p>
            <div className="space-y-2 text-lg">
                <p>Payoff Time: <span className="font-bold text-white">{result.months} months</span></p>
                <p>Total Interest Paid: <span className="font-bold text-red-400">${result.totalInterest.toFixed(2)}</span></p>
            </div>
            <div className="mt-4">
                <h4 className="font-semibold mb-2">Payoff Order:</h4>
                <ol className="list-decimal list-inside space-y-1">
                    {payoffOrder.map(d => <li key={d.id}>{d.name}</li>)}
                </ol>
            </div>
        </div>
    )
}

function AiAnalyst({ budgetItems, logEvent }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [rateLimit, setRateLimit] = useState({ count: 0, timeLeft: 0 });

    const API_REQUEST_LIMIT = 5;
    const API_WINDOW_SECONDS = 60;

    useEffect(() => {
        const timer = setInterval(() => {
            setRateLimit(prev => {
                if (prev.timeLeft > 0) {
                    return { ...prev, timeLeft: prev.timeLeft - 1 };
                }
                return prev;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const now = Date.now();
        const requestTimestamps = JSON.parse(localStorage.getItem('gemini_req_ts') || '[]');
        const recentTimestamps = requestTimestamps.filter(ts => now - ts < API_WINDOW_SECONDS * 1000);

        if (recentTimestamps.length >= API_REQUEST_LIMIT) {
            const oldestRequest = recentTimestamps[0];
            const timePassed = (now - oldestRequest) / 1000;
            const timeLeft = Math.ceil(API_WINDOW_SECONDS - timePassed);
            setRateLimit({ count: recentTimestamps.length, timeLeft });
            return;
        }

        const updatedTimestamps = [...recentTimestamps, now];
        localStorage.setItem('gemini_req_ts', JSON.stringify(updatedTimestamps));
        setRateLimit({ count: updatedTimestamps.length, timeLeft: 0 });

        const userMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        logEvent(`Asked AI Analyst: "${input}"`);
        setInput('');
        setIsLoading(true);

        const budgetContext = budgetItems.map(i => `${i.category}: Allocated $${i.allocated.toFixed(2)}, Spent $${i.spent.toFixed(2)}`).join('\n');
        const prompt = `You are a helpful financial analyst. Based on the following budget data, please answer the user's question. Be concise and provide actionable advice. The data is structured as "Category: Allocated $X, Spent $Y".\n\nBudget Data:\n${budgetContext}\n\nQuestion: ${input}`;

        try {
            const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: chatHistory };
            const apiKey = ""; 
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

            const result = await response.json();
            const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't process that request.";
            const aiMessage = { role: 'ai', text: aiText };
            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            console.error("Error calling Gemini API:", error);
            const errorMessage = { role: 'ai', text: "There was an error connecting to the AI. Please try again." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg h-[600px] flex flex-col">
            <h2 className="text-xl font-bold mb-2 text-white">AI Financial Analyst</h2>
            <p className="text-xs text-gray-400 mb-4">Disclaimer: Only anonymized budget data (categories, allocated, and spent amounts) is sent for analysis. Your personal or debt information is never shared.</p>
            <div className="flex-grow bg-gray-700 rounded-lg p-4 overflow-y-auto mb-4 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-lg p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-600'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-600 p-3 rounded-lg">
                            <div className="animate-pulse flex space-x-2">
                                <div className="rounded-full bg-gray-500 h-2 w-2"></div>
                                <div className="rounded-full bg-gray-500 h-2 w-2"></div>
                                <div className="rounded-full bg-gray-500 h-2 w-2"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about your budget..."
                    className="flex-grow bg-gray-700 border border-gray-600 rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading || budgetItems.length === 0 || rateLimit.timeLeft > 0}
                />
                <button
                    onClick={handleSend}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r-lg transition-colors duration-200 disabled:opacity-50"
                    disabled={isLoading || budgetItems.length === 0 || rateLimit.timeLeft > 0}
                >
                    Send
                </button>
            </div>
            <div className="h-5 mt-2 text-center text-sm">
                {budgetItems.length === 0 && <p className="text-gray-400">Please import a budget to activate the AI Analyst.</p>}
                {rateLimit.timeLeft > 0 && <p className="text-yellow-400">Rate limit reached. Please wait {rateLimit.timeLeft} seconds.</p>}
            </div>
        </div>
    );
}

function BillShockPlanner({ budgetItems, debts, logEvent }) {
    const [bill, setBill] = useState({ name: '', amount: '', payments: 1 });
    const [plan, setPlan] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [excludedActions, setExcludedActions] = useState([]);

    const handleBillChange = (e) => {
        const { name, value } = e.target;
        setBill(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (actionDescription) => {
        setExcludedActions(prev => 
            prev.includes(actionDescription)
                ? prev.filter(item => item !== actionDescription)
                : [...prev, actionDescription]
        );
    };

    const runAnalysis = async () => {
        if (!bill.name || !bill.amount) {
            alert("Please fill in the bill name and amount.");
            return;
        }
        setIsLoading(true);
        setPlan(null);

        const budgetContext = JSON.stringify(budgetItems);
        const debtsContext = JSON.stringify(debts);
        const newBillContext = JSON.stringify(bill);
        const constraints = excludedActions.length > 0 ? `Do not suggest the following actions: ${excludedActions.join(', ')}.` : '';

        const prompt = `
            You are a financial planning expert. A user has an unexpected bill and needs a safe plan to pay it off.
            Your goal is to create a plan that minimizes negative consequences like credit score damage.
            Prioritize delaying payments on bills with 'Low' sensitivity first, then 'Medium'. Avoid touching 'High' sensitivity bills unless absolutely necessary.
            Also suggest temporary reductions in flexible budget categories like 'Groceries' or 'Entertainment'.

            Here is the user's financial data:
            - Monthly Budget: ${budgetContext}
            - Existing Debts/Bills: ${debtsContext}
            - Unexpected Bill: ${newBillContext}
            - User Constraints: ${constraints}

            Please return a JSON object with two keys: "plan" and "recoveryTime".
            - "plan" should be an array of objects, where each object has: "action" (string, e.g., "Delay Payment"), "details" (string, e.g., "for Netflix Subscription"), "amount" (number), and "consequence" (string, e.g., "No consequence" or "Potential $5 late fee").
            - "recoveryTime" should be a string describing how long until the budget is back to normal (e.g., "in 3 weeks").
        `;

        try {
            logEvent(`Ran Bill Shock analysis for: ${bill.name}`);
            const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { 
                contents: chatHistory,
                generationConfig: { responseMimeType: "application/json" }
            };
            const apiKey = ""; 
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

            const result = await response.json();
            const jsonText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (jsonText) {
                const parsedPlan = JSON.parse(jsonText);
                setPlan(parsedPlan);
            } else {
                throw new Error("No valid plan returned from AI.");
            }

        } catch (error) {
            console.error("Error calling Gemini API for Bill Shock:", error);
            setPlan({ error: "Could not generate a plan. The AI may be temporarily unavailable. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (excludedActions.length > 0) {
            runAnalysis();
        }
    }, [excludedActions]);

    return (
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-white">Bill Shock Planner</h2>
            <p className="text-sm text-gray-400 mb-6">Got an unexpected bill? Enter the details below and the AI will create a safe payment plan by adjusting your budget and other bills.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-700 rounded-lg">
                <input type="text" name="name" value={bill.name} onChange={handleBillChange} placeholder="Unexpected Bill Name" className="bg-gray-600 border border-gray-500 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" name="amount" value={bill.amount} onChange={handleBillChange} placeholder="Amount ($)" className="bg-gray-600 border border-gray-500 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={runAnalysis} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50">
                    {isLoading ? 'Analyzing...' : 'Create Plan'}
                </button>
            </div>

            {isLoading && <div className="text-center p-8"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div></div>}

            {plan && (
                <div className="mt-6">
                    {plan.error ? (
                        <p className="text-red-400 text-center">{plan.error}</p>
                    ) : (
                        <>
                            <h3 className="text-lg font-bold text-white mb-2">Your Action Plan:</h3>
                            <p className="mb-4 text-blue-300">Budget will return to normal <span className="font-bold">{plan.recoveryTime}</span>.</p>
                            <div className="space-y-3">
                                {plan.plan.map((item, index) => (
                                    <div key={index} className="bg-gray-700 p-3 rounded-lg flex items-center">
                                        <input 
                                            type="checkbox" 
                                            id={`action-${index}`}
                                            checked={!excludedActions.includes(`${item.action} ${item.details}`)}
                                            onChange={() => handleCheckboxChange(`${item.action} ${item.details}`)}
                                            className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-500 bg-gray-600 mr-4"
                                        />
                                        <label htmlFor={`action-${index}`} className="flex-grow">
                                            <p className="font-semibold">{item.action} {item.details} {item.amount ? `by $${item.amount}`: ''}</p>
                                            <p className="text-xs text-gray-400">Consequence: {item.consequence}</p>
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-4">Uncheck any action you're not comfortable with, and the AI will generate a new plan.</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}


function HistoryView({ events }) {
    const formatDate = (timestamp) => {
        if (!timestamp) return 'Just now';
        return new Date(timestamp.seconds * 1000).toLocaleString();
    };

    return (
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-white">Activity History</h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {events.length > 0 ? (
                    events.map(event => (
                        <div key={event.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center flex-wrap gap-2">
                            <p className="text-gray-300 flex-grow">{event.description}</p>
                            <p className="text-xs text-gray-500 flex-shrink-0">{formatDate(event.timestamp)}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-400 p-8">No activity recorded yet. Start using the app to see your history here.</p>
                )}
            </div>
        </div>
    );
}
