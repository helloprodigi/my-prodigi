import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" }); // or .env if that's where the vars are

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase configuration");
  process.exit(1);
}

const adminAuthClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const seedUsers = async () => {
  console.log("Seeding test users for roles: admin, talent, asisten_lab...");

  const usersToCreate = [
    { email: "admin@myprodigi.com", password: "password123", role: "admin", name: "Admin Prodigi" },
    { email: "talent@myprodigi.com", password: "password123", role: "talent", name: "Talent Prodigi" },
    { email: "asisten@myprodigi.com", password: "password123", role: "asisten_lab", name: "Asisten Lab Prodigi" },
  ];

  for (const u of usersToCreate) {
    // Check if user already exists in auth.users by trying to create
    // We can also just sign up and see if it fails
    const { data: authData, error: authError } = await adminAuthClient.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true
    });

    if (authError) {
      if (authError.message.includes("already has an account") || authError.status === 422) {
        console.log(`User ${u.email} already exists in auth.users. Fetching to ensure public.User exists...`);
        // We'd have to find them, but for simplicity, we assume they are seeded if they exist.
        // We'll update their role in public.User just in case.
        const { data: listData } = await adminAuthClient.auth.admin.listUsers();
        const existingUser = listData.users.find(usr => usr.email === u.email);
        
        if (existingUser) {
           await adminAuthClient.from("User").upsert({
            id: existingUser.id,
            email: u.email,
            name: u.name,
            role: u.role,
            isOnboarded: true
          }, { onConflict: "email" });
          console.log(`Updated existing user ${u.email} to role: ${u.role}`);
        }
      } else {
        console.error(`Error creating auth user ${u.email}:`, authError);
      }
    } else if (authData?.user) {
      // Successfully created auth user, now create public.User
      const { error: dbError } = await adminAuthClient.from("User").upsert({
        id: authData.user.id,
        email: u.email,
        name: u.name,
        role: u.role,
        isOnboarded: true
      });

      if (dbError) {
        console.error(`Error creating public.User for ${u.email}:`, dbError);
      } else {
        console.log(`Successfully created test user: ${u.email} with role: ${u.role}`);
      }
    }
  }
  console.log("Seeding complete. You can login with these credentials:");
  usersToCreate.forEach(u => {
    console.log(`- Email: ${u.email} | Password: ${u.password} | Role: ${u.role}`);
  });
};

seedUsers();
