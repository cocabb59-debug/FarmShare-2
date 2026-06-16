import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
import { auth, db, signInWithGoogle, logOut, handleFirestoreError, OperationType } from "../lib/firebase";
import { Machine, Booking, Review, ChatRoom, ChatMessage, UserProfile, Role, MachineStatus, BookingStatus } from "../types";

interface AppContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  authLoading: boolean;
  isProfileRequired: boolean;
  machines: Machine[];
  myBookingsAsRenter: Booking[];
  myBookingsAsOwner: Booking[];
  reviews: Review[];
  chatRooms: ChatRoom[];
  activeChatMessages: ChatMessage[];
  loadingRooms: boolean;
  loadingMessages: boolean;

  // Actions
  login: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, name: string, phone: string, address: string, role: Role) => Promise<void>;
  logout: () => Promise<void>;
  completeRegistration: (phone: string, address: string, role: Role) => Promise<void>;
  changeRole: (newRole: Role) => Promise<void>;

  // Custom OAuth / Domain error handling state
  authError: string | null;
  authErrorDetails: { code?: string; domain?: string } | null;
  clearAuthError: () => void;

  // Machine Actions
  registerMachine: (machineData: Omit<Machine, "id" | "ownerId" | "ownerName" | "createdAt">) => Promise<void>;
  updateMachine: (machineId: string, updates: Partial<Machine>) => Promise<void>;
  deleteMachine: (machineId: string) => Promise<void>;

  // Booking Actions
  createBooking: (machine: Machine, startDate: string, endDate: string, totalPrice: number) => Promise<void>;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;

  // Review Actions
  addReview: (bookingId: string, machineId: string, rating: number, content: string) => Promise<void>;

  // Chat Actions
  startChat: (ownerId: string, machineId: string, machineTitle: string) => Promise<string>;
  sendMessage: (roomId: string, messageText: string) => Promise<void>;
  listenToMessages: (roomId: string) => (() => void) | null;

  // AI Gemini API Proxy Actions
  askGeminiFAQ: (message: string, history: { role: string; content: string }[]) => Promise<string>;
  generateAIRecommend: (query: string) => Promise<{ recommendedMachineIds: string[]; advice: string }>;
  generateAIDescription: (machinePartial: { title: string; category: string; manufacturer: string; model: string; year: number }) => Promise<string>;
  generateAIPriceSuggestion: (machinePartial: { category: string; manufacturer: string; model: string; year: number }) => Promise<{ hourlyPrice: number; dailyPrice: number; weeklyPrice: number; deposit: number; rationale: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isProfileRequired, setIsProfileRequired] = useState(false);

  const [machines, setMachines] = useState<Machine[]>([]);
  const [myBookingsAsRenter, setMyBookingsAsRenter] = useState<Booking[]>([]);
  const [myBookingsAsOwner, setMyBookingsAsOwner] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeChatMessages, setActiveChatMessages] = useState<ChatMessage[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Custom Auth domain whitelist/OAuth error helpers
  const [authError, setAuthError] = useState<string | null>(null);
  const [authErrorDetails, setAuthErrorDetails] = useState<{ code?: string; domain?: string } | null>(null);

  const clearAuthError = () => {
    setAuthError(null);
    setAuthErrorDetails(null);
  };

  // 1. Monitor Authentication State Change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch user profile from firestore
        const docRef = doc(db, "users", user.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
            setIsProfileRequired(false);
          } else {
            // Document does not exist: User must fill in required registration details
            setIsProfileRequired(true);
          }
        } catch (error) {
          console.error("Error reading user doc:", error);
        }
      } else {
        setUserProfile(null);
        setIsProfileRequired(false);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // 2. Load Profiles in Real-time if authenticated
  useEffect(() => {
    if (!currentUser || isProfileRequired) {
      setUserProfile(null);
      return;
    }
    const docRef = doc(db, "users", currentUser.uid);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      }
    }, (err) => {
      console.warn("User Document snapshot error:", err);
    });
    return unsub;
  }, [currentUser, isProfileRequired]);

  // 3. Real-time Machines loading (Publicly available)
  useEffect(() => {
    const colRef = collection(db, "machines");
    const unsub = onSnapshot(colRef, (snapshot) => {
      const items: Machine[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Machine);
      });
      // Sort machines newer first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMachines(items);
    }, (error) => {
      console.error("Firestore machines onSnapshot error:", error);
    });
    return unsub;
  }, []);

  // 4. Real-time Bookings loading (Strict query boundaries matched to Firestore rules)
  useEffect(() => {
    if (!currentUser || isProfileRequired) {
      setMyBookingsAsRenter([]);
      setMyBookingsAsOwner([]);
      return;
    }

    // Renter Bookings query:
    const renterQuery = query(collection(db, "bookings"), where("renterId", "==", currentUser.uid));
    const unsubRenter = onSnapshot(renterQuery, (snapshot) => {
      const renterItems: Booking[] = [];
      snapshot.forEach((doc) => {
        renterItems.push({ id: doc.id, ...doc.data() } as Booking);
      });
      renterItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMyBookingsAsRenter(renterItems);
    }, (error) => {
      console.error("Booking renter queries failed:", error);
    });

    // Owner Bookings query:
    const ownerQuery = query(collection(db, "bookings"), where("ownerId", "==", currentUser.uid));
    const unsubOwner = onSnapshot(ownerQuery, (snapshot) => {
      const ownerItems: Booking[] = [];
      snapshot.forEach((doc) => {
        ownerItems.push({ id: doc.id, ...doc.data() } as Booking);
      });
      ownerItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMyBookingsAsOwner(ownerItems);
    }, (error) => {
      console.error("Booking owner queries failed:", error);
    });

    return () => {
      unsubRenter();
      unsubOwner();
    };
  }, [currentUser, isProfileRequired]);

  // 5. Real-time Reviews loading
  useEffect(() => {
    const colRef = collection(db, "reviews");
    const unsub = onSnapshot(colRef, (snapshot) => {
      const items: Review[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Review);
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReviews(items);
    }, (err) => {
      console.error("Error loading reviews snapshots:", err);
    });
    return unsub;
  }, []);

  // 6. Real-time ChatRooms metadata loading (For participants matching)
  useEffect(() => {
    if (!currentUser || isProfileRequired) {
      setChatRooms([]);
      return;
    }

    setLoadingRooms(true);
    // Fetch channels where current user is renter
    const renterChatsQ = query(collection(db, "chats"), where("renterId", "==", currentUser.uid));
    // Fetch channels where current user is owner
    const ownerChatsQ = query(collection(db, "chats"), where("ownerId", "==", currentUser.uid));

    let localRenterChats: ChatRoom[] = [];
    let localOwnerChats: ChatRoom[] = [];

    const updateCombined = () => {
      const combined = [...localRenterChats, ...localOwnerChats];
      // De-duplicate rooms by ID
      const uniqueRooms = Array.from(new Map(combined.map((r) => [r.id, r])).values());
      uniqueRooms.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setChatRooms(uniqueRooms);
      setLoadingRooms(false);
    };

    const unsubRenter = onSnapshot(renterChatsQ, (snapshot) => {
      const rRooms: ChatRoom[] = [];
      snapshot.forEach((doc) => {
        rRooms.push({ id: doc.id, ...doc.data() } as ChatRoom);
      });
      localRenterChats = rRooms;
      updateCombined();
    }, (err) => {
      console.error("Failed to load renter chats:", err);
      setLoadingRooms(false);
    });

    const unsubOwner = onSnapshot(ownerChatsQ, (snapshot) => {
      const oRooms: ChatRoom[] = [];
      snapshot.forEach((doc) => {
        oRooms.push({ id: doc.id, ...doc.data() } as ChatRoom);
      });
      localOwnerChats = oRooms;
      updateCombined();
    }, (err) => {
      console.error("Failed to load owner chats:", err);
      setLoadingRooms(false);
    });

    return () => {
      unsubRenter();
      unsubOwner();
    };
  }, [currentUser, isProfileRequired]);

  // Actions
  const login = async () => {
    try {
      setAuthError(null);
      setAuthErrorDetails(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Login trigger error:", err);
      // Analyze firebase auth errors (e.g. auth/unauthorized-domain)
      const errorCode = err.code || err.message || "";
      const currentHost = window.location.hostname;
      
      setAuthError(err.message || String(err));
      setAuthErrorDetails({
        code: errorCode,
        domain: currentHost
      });
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      setAuthError(null);
      setAuthErrorDetails(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error("Email Login Error:", err);
      throw err;
    }
  };

  const registerWithEmail = async (
    email: string,
    password: string,
    name: string,
    phone: string,
    address: string,
    role: Role
  ) => {
    try {
      setAuthError(null);
      setAuthErrorDetails(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update display name
      await updateProfile(user, { displayName: name });
      
      // Save profile immediately
      const profile: UserProfile = {
        id: user.uid,
        name,
        email,
        phone,
        address,
        role,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "users", user.uid), profile);
      setUserProfile(profile);
      setIsProfileRequired(false);
    } catch (err: any) {
      console.error("Email Registration Error:", err);
      throw err;
    }
  };

  const logout = async () => {
    await logOut();
    setUserProfile(null);
    setIsProfileRequired(false);
  };

  const completeRegistration = async (phone: string, address: string, role: Role) => {
    if (!currentUser) return;
    const path = `users/${currentUser.uid}`;
    try {
      const profile: UserProfile = {
        id: currentUser.uid,
        name: currentUser.displayName || "농민회원",
        email: currentUser.email || "",
        phone,
        address,
        role,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "users", currentUser.uid), profile);
      setUserProfile(profile);
      setIsProfileRequired(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const changeRole = async (newRole: Role) => {
    if (!currentUser) throw new Error("로그인이 필요합니다.");
    const path = `users/${currentUser.uid}`;
    try {
      // Build a full profile object to guarantee full schema validation compatibility in firestore.rules
      const existingProfile = userProfile || {
        id: currentUser.uid,
        name: currentUser.displayName || "농민회원",
        email: currentUser.email || "",
        phone: "010-0000-0055",
        address: "지역 미정",
        createdAt: new Date().toISOString(),
      };

      const updated: UserProfile = {
        id: currentUser.uid,
        name: existingProfile.name || currentUser.displayName || "농민회원",
        email: existingProfile.email || currentUser.email || "",
        phone: existingProfile.phone || "010-0000-0055",
        address: existingProfile.address || "지역 미정",
        role: newRole,
        createdAt: existingProfile.createdAt || new Date().toISOString(),
      };

      await setDoc(doc(db, "users", currentUser.uid), updated);
      setUserProfile(updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  // Machine Actions
  const registerMachine = async (machineData: Omit<Machine, "id" | "ownerId" | "ownerName" | "createdAt">) => {
    if (!currentUser || !userProfile) throw new Error("로그인이 필요한 작업입니다.");
    const machineId = "m_" + Date.now();
    const path = `machines/${machineId}`;
    try {
      const newMachine: Machine = {
        ...machineData,
        id: machineId,
        ownerId: currentUser.uid,
        ownerName: userProfile.name,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "machines", machineId), newMachine);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const updateMachine = async (machineId: string, updates: Partial<Machine>) => {
    const path = `machines/${machineId}`;
    try {
      await updateDoc(doc(db, "machines", machineId), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const deleteMachine = async (machineId: string) => {
    const path = `machines/${machineId}`;
    try {
      await deleteDoc(doc(db, "machines", machineId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  // Booking Actions
  const createBooking = async (machine: Machine, startDate: string, endDate: string, totalPrice: number) => {
    if (!currentUser || !userProfile) throw new Error("로그인이 필요합니다.");
    const bookingId = "b_" + Date.now();
    const path = `bookings/${bookingId}`;
    try {
      const newBooking: Booking = {
        id: bookingId,
        machineId: machine.id,
        machineTitle: machine.title,
        machineImageUrl: machine.imageUrls?.[0] || "",
        ownerId: machine.ownerId,
        renterId: currentUser.uid,
        renterName: userProfile.name,
        renterPhone: userProfile.phone,
        renterAddress: userProfile.address,
        startDate,
        endDate,
        totalPrice,
        status: BookingStatus.PENDING,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "bookings", bookingId), newBooking);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    const path = `bookings/${bookingId}`;
    try {
      await updateDoc(doc(db, "bookings", bookingId), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    const path = `bookings/${bookingId}`;
    try {
      await updateDoc(doc(db, "bookings", bookingId), { status: BookingStatus.CANCELLED });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  // Review Actions
  const addReview = async (bookingId: string, machineId: string, rating: number, content: string) => {
    if (!currentUser || !userProfile) throw new Error("로그인이 필요합니다.");
    const reviewId = "rev_" + Date.now();
    const path = `reviews/${reviewId}`;
    try {
      const newReview: Review = {
        id: reviewId,
        bookingId,
        machineId,
        userId: currentUser.uid,
        userName: userProfile.name,
        rating,
        content,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "reviews", reviewId), newReview);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  // Chat Actions
  const startChat = async (ownerId: string, machineId: string, machineTitle: string) => {
    if (!currentUser || !userProfile) throw new Error("로그인이 필요합니다.");
    // Generate a deterministically combined ID to avoid creating multiple rooms for same renter-owner-machine
    const roomId = `room_${currentUser.uid}_${ownerId}_${machineId}`;
    const path = `chats/${roomId}`;
    try {
      const roomSnap = await getDoc(doc(db, "chats", roomId));
      if (!roomSnap.exists()) {
        const newRoom: ChatRoom = {
          id: roomId,
          renterId: currentUser.uid,
          ownerId,
          machineId,
          machineTitle,
          lastMessage: "대화방이 개설되었습니다.",
          updatedAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "chats", roomId), newRoom);
      }
      return roomId;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const sendMessage = async (roomId: string, messageText: string) => {
    if (!currentUser || !userProfile) throw new Error("로그인이 필요합니다.");
    const messageId = "msg_" + Date.now();
    const path = `chats/${roomId}/messages/${messageId}`;
    try {
      const roomRef = doc(db, "chats", roomId);
      const msgRef = doc(db, "chats", roomId, "messages", messageId);

      const msg: ChatMessage = {
        id: messageId,
        senderId: currentUser.uid,
        senderName: userProfile.name,
        message: messageText,
        createdAt: new Date().toISOString(),
      };

      // Write subcollection message
      await setDoc(msgRef, msg);

      // Update room metadata safely
      await updateDoc(roomRef, {
        lastMessage: messageText,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const listenToMessages = (roomId: string) => {
    if (!currentUser) return null;
    setLoadingMessages(true);
    const messagesQuery = query(collection(db, "chats", roomId, "messages"));
    const unsub = onSnapshot(messagesQuery, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      // Sort messages ascending by time
      msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setActiveChatMessages(msgs);
      setLoadingMessages(false);
    }, (error) => {
      console.error("Messages list failed:", error);
      setLoadingMessages(false);
    });
    return unsub;
  };

  // 7. AI Gemini Proxies
  const askGeminiFAQ = async (message: string, history: { role: string; content: string }[]): Promise<string> => {
    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to prompt Gemini Chat");
      return data.reply;
    } catch (err: any) {
      console.error("askGeminiFAQ error:", err);
      return "FAQ 챗봇 오류가 발생했습니다: " + err.message;
    }
  };

  const generateAIRecommend = async (query: string): Promise<{ recommendedMachineIds: string[]; advice: string }> => {
    try {
      const simplifiedList = machines.map((m) => ({
        id: m.id,
        title: m.title,
        category: m.category,
        location: m.location,
        dailyPrice: m.dailyPrice,
        status: m.status,
      }));

      const response = await fetch("/api/gemini/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, availableMachines: simplifiedList }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load recommendation");
      return data;
    } catch (err: any) {
      console.error("generateAIRecommend error:", err);
      return {
        recommendedMachineIds: [],
        advice: "추천 생성 오류: " + err.message,
      };
    }
  };

  const generateAIDescription = async (machinePartial: {
    title: string;
    category: string;
    manufacturer: string;
    model: string;
    year: number;
  }): Promise<string> => {
    try {
      const response = await fetch("/api/gemini/suggest-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(machinePartial),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load description");
      return data.description;
    } catch (err: any) {
      console.error("generateAIDescription error:", err);
      return "설명 생성 실패: " + err.message;
    }
  };

  const generateAIPriceSuggestion = async (machinePartial: {
    category: string;
    manufacturer: string;
    model: string;
    year: number;
  }): Promise<{ hourlyPrice: number; dailyPrice: number; weeklyPrice: number; deposit: number; rationale: string }> => {
    try {
      const response = await fetch("/api/gemini/suggest-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(machinePartial),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to suggest price");
      return data;
    } catch (err: any) {
      console.error("generateAIPriceSuggestion error:", err);
      return {
        hourlyPrice: 10000,
        dailyPrice: 50000,
        weeklyPrice: 200000,
        deposit: 100000,
        rationale: "요정 가격 계산 오류가 발생하여 기본 가격으로 대처합니다: " + err.message,
      };
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        userProfile,
        authLoading,
        isProfileRequired,
        machines,
        myBookingsAsRenter,
        myBookingsAsOwner,
        reviews,
        chatRooms,
        activeChatMessages,
        loadingRooms,
        loadingMessages,
        login,
        loginWithEmail,
        registerWithEmail,
        logout,
        completeRegistration,
        changeRole,
        authError,
        authErrorDetails,
        clearAuthError,
        registerMachine,
        updateMachine,
        deleteMachine,
        createBooking,
        updateBookingStatus,
        cancelBooking,
        addReview,
        startChat,
        sendMessage,
        listenToMessages,
        askGeminiFAQ,
        generateAIRecommend,
        generateAIDescription,
        generateAIPriceSuggestion,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside an AppProvider");
  return context;
};
