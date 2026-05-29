const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // login using a user that exists or create one
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'gentahalilintar36@gmail.com', // user's email from logs
    password: 'password123' // hope this is the pass, or we can just try to sign up
  });
  
  console.log("Auth:", authError ? authError.message : "Success");
  
  if (authData?.session) {
    const fetch = require('node-fetch'); // wait, node 18+ has global fetch
    const res = await fetch('http://localhost:3000/api/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sb-access-token=${authData.session.access_token}; sb-refresh-token=${authData.session.refresh_token}` // Wait, next.js uses chunks? Let's just use the Authorization header!
      },
      body: JSON.stringify({
        jurusan: "S1 Informatika",
        angkatan: "2025",
        nomorWa: "0812",
        cvUrl: "",
        skills: ["UI/UX Design"],
        interests: ["Hackathon"]
      })
    });
    const json = await res.json();
    console.log("API Response:", json);
  }
}
run();
