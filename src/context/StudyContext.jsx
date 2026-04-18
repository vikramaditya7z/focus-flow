import React, { createContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../services/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

export const StudyContext = createContext();

export function StudyProvider({ children }) {
  const [sessions, setSessions] = useState([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setSessions([]);
      return;
    }
    const q = query(collection(db, 'users', currentUser.uid, 'sessions'), orderBy('startTime', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      setSessions(data);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const addSession = async (session) => {
    if (!currentUser) return;
    try {
      await setDoc(doc(db, 'users', currentUser.uid, 'sessions', session.id), session);
    } catch(e) { console.error("Error adding session", e) }
  };

  const deleteSession = async (id) => {
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'sessions', id));
    } catch(e) { console.error("Error deleting session", e) }
  };

  return (
    <StudyContext.Provider value={{ sessions, addSession, deleteSession }}>
      {children}
    </StudyContext.Provider>
  );
}
