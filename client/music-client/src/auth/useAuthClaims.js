// src/auth/useAuthClaims.js
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function useAuthClaims() {
  const [state, setState] = useState({
    user: null,
    loading: true,
    isAdmin: false,
    token: null,
  });

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser)
        return setState({
          user: null,
          loading: false,
          isAdmin: false,
          token: null,
        });
      const tokenResult = await fbUser.getIdTokenResult(true); // force refresh để lấy claims mới
      setState({
        user: fbUser,
        loading: false,
        isAdmin: !!tokenResult.claims.admin,
        token: tokenResult.token,
      });
    });
  }, []);

  return state;
}
