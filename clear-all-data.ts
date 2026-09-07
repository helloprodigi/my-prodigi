import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import { prisma } from "./lib/prisma";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase credentials in environment");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  console.log("Deleting all records from Prisma models...");
  
  // Child tables first
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.laporan.deleteMany();
  await prisma.programKerja.deleteMany();
  await prisma.shiftAssignment.deleteMany();
  await prisma.absensiRecord.deleteMany();
  await prisma.absensiAgenda.deleteMany();
  await prisma.myShiftScheduleAssignment.deleteMany();
  await prisma.myShiftSchedule.deleteMany();
  await prisma.draftCompetition.deleteMany();
  await prisma.competition.deleteMany();
  
  console.log("Fetching users from Supabase Auth...");
  const { data: usersData, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Failed to list users", error);
    return;
  }
  
  const users = usersData.users;
  console.log(`Found ${users.length} users in Auth.`);

  for (const u of users) {
    const { data: profile } = await supabase.from('User').select('role').eq('id', u.id).single();
    
    const role = profile?.role || 'talent';
    
    if (role === 'admin' || u.email === 'admin@myprodigi.com') {
      console.log(`Keeping admin user: ${u.email}`);
    } else {
      console.log(`Deleting user: ${u.email}`);
      await prisma.user.delete({ where: { id: u.id } }).catch(() => {}); // Delete from public.User
      await supabase.auth.admin.deleteUser(u.id); // Delete from auth.users
    }
  }

  console.log("All non-admin users and other dynamic data deleted.");
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
});
