import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../contexts/AppContext";
import { Loader2 } from "lucide-react";

const COLORS = {
  background: "#F5F7FA",
  primary: "#2B6CB0",
  secondary: "#38A169",
  text: "#1A202C",
  error: "#E53E3E",
};

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secretKey, setSecretKey] = useState("");

  // NEW ADDITION: Local loading & error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(""); // Local error only

  const { adminLogin } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // NEW ADDITION: Clear previous error
    setError("");
    setIsLoading(true);

    const { success, message } = await adminLogin(email, password, secretKey);

    setIsLoading(false);

    if (success) {
      navigate("/admin/dashboard");
    } else {
      // NEW ADDITION: Show local error only
      setError(message || "Login failed. Please try again.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: COLORS.background }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-full max-w-sm"
      >
        <h2
          className="text-2xl font-semibold text-center"
          style={{ color: COLORS.text }}
        >
          Admin Login
        </h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ borderColor: COLORS.primary, color: COLORS.text }}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ borderColor: COLORS.primary, color: COLORS.text }}
          required
        />

        <input
          type="text"
          placeholder="Secret Key"
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
          className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ borderColor: COLORS.primary, color: COLORS.text }}
          required
        />

        {/* UPDATED: Local error display */}
        {error && (
          <p className="text-sm text-center" style={{ color: COLORS.error }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="p-2 rounded flex items-center justify-center disabled:opacity-50 transition"
          style={{
            backgroundColor: COLORS.primary,
            color: COLORS.background,
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Login"}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
