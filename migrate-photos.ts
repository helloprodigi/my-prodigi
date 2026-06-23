import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Fetching auth users...");
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Error fetching users:", error);
    return;
  }
  
  console.log(`Found ${users.length} users. Migrating photoUrl...`);
  
  for (const user of users) {
    if (user.user_metadata?.photoUrl) {
      console.log(`Updating ${user.id} with photoUrl: ${user.user_metadata.photoUrl}`);
      const { error: updateError } = await supabase
        .from("User")
        .update({ photoUrl: user.user_metadata.photoUrl })
        .eq("id", user.id);
        
      if (updateError) {
        console.error(`Error updating ${user.id}:`, updateError);
      }
    }
  }
  
  console.log("Migration complete.");
}

main();
