import { useEffect } from "react";
import { getAuth } from "firebase/auth";

function DebugAdmin() {
  useEffect(() => {
    const check = async () => {
      const fbUser = getAuth().currentUser;
      if (!fbUser) {
        console.log("Chưa login");
        return;
      }
      const tokenResult = await fbUser.getIdTokenResult(true);
      console.log("isAdmin =", !!tokenResult.claims.admin);
    };
    check();
  }, []);

  return null;
}

export default DebugAdmin;
