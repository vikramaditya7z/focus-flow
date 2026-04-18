import React, { createContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../services/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

export const TestContext = createContext();

export const TestProvider = ({ children }) => {
  const [tests, setTests] = useState([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setTests([]);
      return;
    }
    const q = query(collection(db, 'users', currentUser.uid, 'tests'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      setTests(data);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const addTest = async (test) => {
    if (!currentUser) return;
    try {
      await setDoc(doc(db, 'users', currentUser.uid, 'tests', test.id), test);
    } catch(e) { console.error("Error adding test", e) }
  };

  const deleteTest = async (id) => {
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'tests', id));
    } catch(e) { console.error("Error deleting test", e) }
  };

  return (
    <TestContext.Provider value={{ tests, addTest, deleteTest }}>
      {children}
    </TestContext.Provider>
  );
};
