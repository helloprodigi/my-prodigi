import { createClient } from '@supabase/supabase-js';
import "dotenv/config";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seed() {
  console.log("Seeding test users for roles: admin, talent, asisten_lab...");

  const usersToCreate = [
    { email: "admin@myprodigi.com", password: "password123", role: "admin", name: "Admin Prodigi" },
    { email: "talent@myprodigi.com", password: "password123", role: "talent", name: "Talent Prodigi" },
    { email: "asisten@myprodigi.com", password: "password123", role: "asisten_lab", name: "Asisten Lab Prodigi" },
  ];

  for (const u of usersToCreate) {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true
    });

    if (authError) {
      if (authError.message.includes("already has an account") || authError.status === 422) {
        console.log(`User ${u.email} already exists in auth.users. Updating public.User...`);
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existingUser = listData.users.find(usr => usr.email === u.email);
        
        if (existingUser) {
           await supabase.from("User").upsert({
            id: existingUser.id,
            email: u.email,
            name: u.name,
            role: u.role,
            isOnboarded: true,
            updatedAt: new Date().toISOString()
          }, { onConflict: "email" });
        }
      } else {
        console.error(`Error creating auth user ${u.email}:`, authError);
      }
    } else if (authData?.user) {
      const { error: dbError } = await supabase.from("User").upsert({
        id: authData.user.id,
        email: u.email,
        name: u.name,
        role: u.role,
        isOnboarded: true,
        updatedAt: new Date().toISOString()
      });
      if (dbError) console.error(dbError);
      else console.log(`Created test user: ${u.email}`);
    }
  }

  console.log("Seeding competitions via Supabase...");
  const now = new Date().toISOString();
  const competitions = [
    {
      id: "a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1",
      title: 'ISME 7.0 - Informatic System Memorable Exhibition',
      organizer: 'Universitas Internasional Semen Indonesia',
      deadline: '2024-01-16T23:59:59Z',
      category: 'Belmawa',
      skills: ['Data Science', 'UI/UX Design', 'Business Plan', 'Web Development'],
      updatedAt: now,
      createdAt: now
    },
    {
      id: "b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2",
      title: 'ISME 7.0 - Informatic System Memorable Exhibition',
      organizer: 'Universitas Internasional Semen Indonesia',
      deadline: '2024-01-16T23:59:59Z',
      category: 'Belmawa',
      skills: ['Data Science', 'UI/UX Design', 'Business Plan', 'Web Development'],
      updatedAt: now,
      createdAt: now
    },
    {
      id: "e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5",
      title: 'ISME 7.0 - Informatic System Memorable Exhibition',
      organizer: 'Universitas Internasional Semen Indonesia',
      deadline: '2024-01-16T23:59:59Z',
      category: 'Belmawa',
      skills: ['Data Science', 'UI/UX Design', 'Business Plan', 'Web Development'],
      updatedAt: now,
      createdAt: now
    },
    {
      id: "f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6",
      title: 'ISME 7.0 - Informatic System Memorable Exhibition',
      organizer: 'Universitas Internasional Semen Indonesia',
      deadline: '2024-01-16T23:59:59Z',
      category: 'Belmawa',
      skills: ['Data Science', 'UI/UX Design', 'Business Plan', 'Web Development'],
      updatedAt: now,
      createdAt: now
    },
    {
      id: "c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3",
      title: 'UI/UX Design Competition',
      organizer: 'Tech Startup Indonesia',
      deadline: '2024-03-15T23:59:59Z',
      category: 'Non-Belmawa',
      skills: ['UI/UX Design', 'Research'],
      updatedAt: now,
      createdAt: now
    },
    {
      id: "d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4",
      title: 'Internal Coding Challenge',
      organizer: 'Lab DTC',
      deadline: '2024-04-10T23:59:59Z',
      category: 'Internal',
      skills: ['Web Development', 'Cybersecurity'],
      updatedAt: now,
      createdAt: now
    }
  ];

  await supabase.from("Competition").delete().neq("id", "0");
  const { data, error } = await supabase.from("Competition").insert(competitions).select();
  if (error) console.error(error);
  else console.log(data);
}
seed();
