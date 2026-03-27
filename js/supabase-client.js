window.SUPABASE_URL = "https://bollarpnewbhziwldzjn.supabase.co";
window.SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvbGxhcnBuZXdiaHppd2xkempuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNjY4MjYsImV4cCI6MjA2Njk0MjgyNn0.KhmT9U5wKm0irQbidZjZXCSOfzfr1gYYmo_21VL1JPw";

function makeClientUnavailableError() {
  return new Error(
    "Supabase SDK is not loaded. Check internet access to CDN (jsdelivr/unpkg)."
  );
}

function makeClientStub() {
  const reject = async () => ({ data: null, error: makeClientUnavailableError() });
  return {
    auth: {
      signInWithPassword: reject,
      signUp: reject,
      getSession: async () => ({ data: { session: null }, error: makeClientUnavailableError() }),
      refreshSession: async () => ({ data: { session: null }, error: makeClientUnavailableError() }),
      getUser: async () => ({ data: { user: null }, error: makeClientUnavailableError() })
    },
    from: function () {
      const chain = {
        select: () => chain,
        insert: reject,
        update: reject,
        delete: reject,
        upsert: reject,
        eq: () => chain,
        in: () => chain,
        order: reject,
        limit: () => chain,
        maybeSingle: reject,
        single: reject
      };
      return chain;
    }
  };
}

window.client = makeClientStub();
var client = window.client;

if (window.supabase && typeof window.supabase.createClient === "function") {
  window.client = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
  );
  client = window.client;
} else {
  console.error("Supabase SDK unavailable: window.supabase.createClient is missing.");
}
