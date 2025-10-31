'use client';
import React, { useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const GetDocs = async () => {
    const coleccionRef = collection(db, "Erpcompany");

    const erpcompanySnapshot = await getDocs(coleccionRef);

    const erpcompany = erpcompanySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    
    console.log(erpcompany);

  return;
};

export default GetDocs;
