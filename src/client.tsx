import { createRoot } from "react-dom/client";
import { useCallback, useId, useState } from "react";
import Turnstile, { useTurnstile } from "react-turnstile";

const App = () => {
  const id = useId();
  const [loading, setLoading] = useState(true);
  const handleVerify = useCallback(() => {
    setLoading(false);
  }, []);

  const turnstile = useTurnstile();
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const res = await fetch("/api/turnstile", {
        method: "POST",
        body: new FormData(e.currentTarget),
      });

      const { ok } = await res.json<{ ok: boolean }>();
      if (ok) {
        alert("ok");
      } else {
        turnstile.reset();
        alert("ng");
      }
    },
    [turnstile],
  );

  return (
    <main>
      <section>
        <h1>Cloudflare turnstile + Email Routing</h1>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor={`${id}-description`}>description</label>
            <textarea name="description" id={`${id}-description`} required />
          </div>

          <Turnstile sitekey="YOUR_SITE_KEY" onVerify={handleVerify} />

          <button type="submit" disabled={loading}>
            送信
          </button>
        </form>
      </section>
    </main>
  );
};

createRoot(document.getElementById("app")!).render(<App />);
