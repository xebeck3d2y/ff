import { useState } from "react";
import api from "@/api/api";

const Enable2FA = () => {
  const [qrCode, setQrCode] = useState<string | null>(null);

  const handleEnable2FA = async () => {
    try {
      const response = await api.post("/auth/enable-2fa", {}, { responseType: "blob" });
      const qrCodeUrl = URL.createObjectURL(response);
      setQrCode(qrCodeUrl);
    } catch (err) {
      console.error("Failed to enable 2FA:", err);
    }
  };

  return (
    <div>
      <h1>Enable Two-Factor Authentication</h1>
      <button onClick={handleEnable2FA}>Generate QR Code</button>
      {qrCode && <img src={qrCode} alt="Scan this QR code with your authenticator app" />}
    </div>
  );
};

export default Enable2FA;