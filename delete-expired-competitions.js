const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminDb = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const today = new Date().toISOString();
  
  // 1. Get expired competitions
  const { data: competitions, error: compErr } = await adminDb
    .from('Competition')
    .select('id')
    .lt('deadline', today);
    
  if (compErr) {
    console.error('Error fetching competitions:', compErr);
    return;
  }
  
  if (!competitions || competitions.length === 0) {
    console.log('No expired competitions found.');
    return;
  }
  
  const compIds = competitions.map(c => c.id);
  console.log(`Found ${compIds.length} expired competitions.`);
  
  // 2. Get teams for these competitions
  const { data: teams, error: teamErr } = await adminDb
    .from('Team')
    .select('id')
    .in('competitionId', compIds);
    
  if (teamErr) {
    console.error('Error fetching teams:', teamErr);
    return;
  }
  
  const teamIds = teams ? teams.map(t => t.id) : [];
  
  // 3. Delete TeamMembers for these teams
  if (teamIds.length > 0) {
    console.log(`Deleting members for ${teamIds.length} teams...`);
    const { error: tmErr } = await adminDb
      .from('TeamMember')
      .delete()
      .in('teamId', teamIds);
      
    if (tmErr) {
      console.error('Error deleting team members:', tmErr);
      return;
    }
    
    // 4. Delete Teams
    console.log(`Deleting ${teamIds.length} teams...`);
    const { error: tErr } = await adminDb
      .from('Team')
      .delete()
      .in('id', teamIds);
      
    if (tErr) {
      console.error('Error deleting teams:', tErr);
      return;
    }
  }
  
  // 5. Delete Competitions
  console.log(`Deleting ${compIds.length} competitions...`);
  const { error: cErr } = await adminDb
    .from('Competition')
    .delete()
    .in('id', compIds);
    
  if (cErr) {
    console.error('Error deleting competitions:', cErr);
    return;
  }
  
  console.log('Successfully deleted expired competitions and associated data.');
}

run();
