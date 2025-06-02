import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import axios from "@/lib/axios";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lockout, setLockout] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Add state for 2FA code
  const [twoFactorCode, setTwoFactorCode] = useState("");

  // Get new states and function from AuthContext
  const { login, loading, twoFactorRequired, tempUserId, verify2fa } = useAuth();
  const navigate = useNavigate();

  console.log("LoginForm - twoFactorRequired:", twoFactorRequired);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (lockout && lockout > 0) {
      timer = setInterval(() => {
        setLockout((prev) => {
          if (prev && prev > 1) return prev - 1;
          return null;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [lockout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (lockout && lockout > 0) return;

    try {
      const result = await login(email, password);
      console.log("login result", result);

      // If login was fully successful (status 200)
      if (result && result.user && result.token) {
         navigate("/dashboard");
      }
      // If 2FA is required (status 202), the context has already updated twoFactorRequired
      // and the UI will switch automatically due to state change

    } catch (err: any) {
      // The AuthContext handles setting the error state and showing toasts for most cases
      // We might need specific handling here for the 'locked' message or other specific UI needs
      if (err.response?.data?.message === "locked") {
        setLockout(err.response.data.seconds_left || 30);
        setLocalError(null); // Clear error when lockout starts
      } else if (err.status !== 202) {
         // For any other error besides the 2FA required status (which is handled by context)
         setLocalError(err.response?.data?.message || "Email or password incorrect");
      }
      // Note: If the error from login was status 202, twoFactorRequired and tempUserId are already set by context
    }
  };

  // New function to handle 2FA code submission
  const handle2faSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLocalError(null);

      if (!tempUserId) {
          setLocalError("User ID missing for 2FA verification.");
          return;
      }

      try {
          const result = await verify2fa(tempUserId, twoFactorCode);
          console.log("2FA verification result", result);

          if (result && result.user && result.token) {
              navigate("/dashboard");
          }
      } catch (err: any) {
          // verify2fa in AuthContext handles error messages and toasts
          // No need for specific handling here unless you want different UI
      }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-gray-500 mt-2">
          Log in to access your secure files
        </p>
      </div>

      {/* Show lockout countdown if active */}
      {lockout && lockout > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Too many failed attempts. Please wait {lockout} second{lockout > 1 ? "s" : ""} before trying again.
          </AlertDescription>
        </Alert>
      )}

      {/* Show error if not in lockout */}
      {localError && (!lockout || lockout <= 0) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{localError}</AlertDescription>
        </Alert>
      )}

      {/* Conditionally render forms based on 2FA requirement */}
      {!twoFactorRequired ? (
          // Standard Login Form
          <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                      id="email"
                      type="email"
                      placeholder="name@inpt.ma"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading || (lockout && lockout > 0)}
                      className={lockout && lockout > 0 || loading ? "opacity-50 cursor-not-allowed" : ""}
                  />
              </div>
              
              {/* Password Field */}
              <div className="space-y-2">
                  <div className="flex justify-between items-center">
                      <Label htmlFor="password">Password</Label>
                      <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                          Forgot password?
                      </Link>
                  </div>
                  <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading || (lockout && lockout > 0)}
                  />
              </div>

              {/* Login Button */}
              <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || (lockout && lockout > 0)}
              >
                  {loading ? "Logging in..." : "Log in"}
              </Button>
          </form>
      ) : (
          // 2FA Verification Form
          <form onSubmit={handle2faSubmit} className="space-y-4">
               {/* 2FA Code Field */}
               <div className="space-y-2">
                   <Label htmlFor="twoFactorCode">Code 2FA</Label>
                   <Input
                       id="twoFactorCode"
                       type="text"
                       placeholder="######"
                       value={twoFactorCode}
                       onChange={(e) => setTwoFactorCode(e.target.value)}
                       required
                       disabled={loading}
                   />
               </div>
               {/* Verify 2FA Button */}
               <Button 
                   type="submit" 
                   className="w-full" 
                   disabled={loading}
               >
                   {loading ? "Vérification du code..." : "Vérifier le code 2FA"}
               </Button>
          </form>
      )}

      <div className="text-center text-sm">
        <p className="text-gray-500">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600 hover:text-blue-500">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
