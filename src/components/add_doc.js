'use client';
import React, { useEffect } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

const AddDoc = () => {
    const coleccionRef = collection(db, "Erpcompany");

    let address = document.getElementById('address').value;
    let company_name = document.getElementById('company_name').value;
    let email = document.getElementById('email').value;
    let nit = document.getElementById('nit').value;

    addDoc(coleccionRef, {
      address: address,
      company_name: company_name,
      email: email,
      nit: nit
    });

    console.log("Documento agregado correctamente");

  return;
};

export default AddDoc;
