'use client';
import React, { useEffect } from "react";
import { collection, doc } from "firebase/firestore";
import { db } from "../firebase";

const GetDoc = async () => {

    let docId = document.getElementById('docId').value;

    const _doc = await doc(db, "Erpcompany", docId);

    // const _map_doc = _doc.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(_doc);

  return;
};

export default GetDoc;
