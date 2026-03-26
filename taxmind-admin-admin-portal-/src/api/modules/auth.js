// Auth API module (new endpoints)
import http, {
  setToken,
  setRefreshToken,
  setAdminEmail,
  setAdminData,
  clearAuth,
} from "../http";

/**
 * Sign in admin
 * @param {{email: string, password: string}} payload
 * @returns {Promise<any>}
 */
export async function signIn(payload) {
  const { email, password } = payload;
  const res = await http.post("/admins/auth/signin", { email, password });

  // Extract tokens from response data
  const responseData = res?.data;
  const accessToken =
    responseData?.data?.accessToken || responseData?.accessToken;
  const refreshToken =
    responseData?.data?.refreshToken || responseData?.refreshToken;
  const userEmail = responseData?.data?.email || responseData?.email || email;
  const userName = responseData?.data?.name || responseData?.name;
  const userRole = responseData?.data?.role || responseData?.role;

  if (accessToken) {
    setToken(accessToken);
    setRefreshToken(refreshToken);
    setAdminEmail(userEmail);
    setAdminData({
      name: userName,
      email: userEmail,
      role: userRole,
    });
  }

  return responseData;
}

/** Sign out current admin (api + local cleanup) */
export async function signOut() {
  try {
    await http.post("/admins/auth/signout");
  } catch (e) {
    // Ignore network/server errors for local logout flow
  } finally {
    clearAuth();
    // Remove other auth-related flags if present
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("role");
  }
}

/** Send email verification OTP */
export function sendEmailVerification(email) {
  return http.post("/admins/auth/email/verify", { email });
}

/** Confirm email verification OTP */
export function confirmEmailOTP({ email, otp }) {
  return http.post("/admins/auth/email/verify/confirm", { email, otp });
}

/** Change password */
export function changePassword({ currentPassword, newPassword }) {
  return http.post("/admins/auth/password/change", {
    currentPassword,
    newPassword,
  });
}

/** Reset password with email+otp */
export function resetPassword({ email, otp, newPassword }) {
  return http.post("/admins/auth/password/reset", { email, otp, newPassword });
}
