/**
 * CLEANUP CRON JOB SETUP GUIDE
 * ============================
 * 
 * This system includes an automatic cleanup job that deletes completed teams
 * after 30 days of retention. This allows teams to be archived before deletion
 * for audit purposes.
 * 
 * STEP 1: Add CLEANUP_SECRET to .env.local
 * ==========================================
 * Add this line to /Users/macbookpro/codes/my-prodigi/.env.local:
 * 
 *   CLEANUP_SECRET=your-secure-random-secret-key-here
 * 
 * Generate a secure secret (e.g., using openssl):
 *   openssl rand -base64 32
 * 
 * Example:
 *   CLEANUP_SECRET=k8vX2qL9pN5mJ3bW6hY8jK2fD7sQ4rT1uV9xZ
 * 
 * 
 * STEP 2: Verify Vercel Configuration
 * =====================================
 * The cleanup job is configured in vercel.json:
 * 
 *   {
 *     "crons": [
 *       {
 *         "path": "/api/cron/cleanup-completed-teams",
 *         "schedule": "0 2 * * 0"  // Runs every Sunday at 2 AM UTC
 *       }
 *     ]
 *   }
 * 
 * This will run automatically on Vercel. No additional setup needed.
 * 
 * 
 * STEP 3: Test Locally (Optional)
 * ================================
 * To test the cleanup job locally:
 * 
 *   1. Start dev server:
 *      npm run dev
 * 
 *   2. In another terminal, run:
 *      CLEANUP_SECRET=your-secret node scripts/test-cleanup-cron.mjs
 * 
 *   3. Or using curl:
 *      curl -X POST http://localhost:3000/api/cron/cleanup-completed-teams \
 *        -H "Authorization: Bearer your-secret" \
 *        -H "Content-Type: application/json"
 * 
 * 
 * STEP 4: Monitor in Production
 * ==============================
 * After deployment to Vercel:
 * 
 *   1. Go to Vercel Dashboard > Project > Crons
 *   2. Look for "cleanup-completed-teams" job
 *   3. View logs after each scheduled run
 *   4. Check response to verify teams were deleted
 * 
 * Logs will show:
 *   - Number of completed teams found
 *   - Number of teams successfully deleted
 *   - Any errors encountered
 * 
 * 
 * RETENTION POLICY
 * ================
 * Current: 30 days
 * 
 * Completed teams are retained for 30 days before deletion. This allows:
 * - Audit trail if someone accidentally marks a team complete
 * - Database forensics if bug causes premature completion
 * - Recovery window if needed
 * 
 * To change retention period:
 * Edit app/api/cron/cleanup-completed-teams/route.ts
 * Change: const RETENTION_DAYS = 30; // to desired days
 * 
 * 
 * DATABASE BEHAVIOR
 * =================
 * When a team is marked COMPLETED:
 * 1. Team status changes to "COMPLETED" in database
 * 2. Team is hidden from dashboard (filtered by .neq("status", "COMPLETED"))
 * 3. After 30 days, cleanup job deletes the team record
 * 4. Cascading deletes remove TeamMember and other related records
 * 
 * The deletion is permanent! Ensure your database backup strategy
 * includes retention before running in production.
 * 
 */
