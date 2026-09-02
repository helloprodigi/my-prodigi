import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { sendPushToUser } from "@/lib/push";

/**
 * Cleanup cron job: Delete completed teams older than 30 days
 * Run this via external cron service (e.g., Vercel Cron, EasyCron)
 * 
 * Example: POST /api/cron/cleanup-completed-teams
 * 
 * For Vercel: Set up in vercel.json with cron expression:
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-completed-teams",
 *     "schedule": "0 2 * * 0"  // Runs every Sunday at 2 AM UTC
 *   }]
 * }
 */

const RETENTION_DAYS = 30; // Delete teams completed more than 30 days ago
const CLEANUP_SECRET = process.env.CLEANUP_SECRET || "default-secret";

export async function POST(req: NextRequest) {
  try {
    // Security check: verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${CLEANUP_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const adminDb = createAdminClient();

    // Calculate cutoff date (30 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
    const cutoffIso = cutoffDate.toISOString();

    // Get count of teams to be deleted (for audit purposes)
    const { count, error: countError } = await adminDb
      .from("Team")
      .select("id", { count: "exact", head: true })
      .eq("status", "COMPLETED")
      .lt("createdAt", cutoffIso);

    if (countError) {
      console.error("Count error:", countError);
      return NextResponse.json(
        { error: "Failed to count teams: " + countError.message },
        { status: 500 }
      );
    }

    console.log(`[Cleanup] Found ${count} completed teams older than ${RETENTION_DAYS} days`);

    // Delete completed teams (Supabase will handle cascading deletes via constraints)
    const { data: deletedTeams, error: deleteError } = await adminDb
      .from("Team")
      .delete()
      .eq("status", "COMPLETED")
      .lt("createdAt", cutoffIso)
      .select("id, name");

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete teams: " + deleteError.message },
        { status: 500 }
      );
    }

    const deletedCount = deletedTeams?.length ?? 0;
    console.log(`[Cleanup] Successfully deleted ${deletedCount} completed teams`);

    if (deletedCount > 0) {
      const { data: admins, error: adminsError } = await adminDb
        .from("User")
        .select("id, name")
        .eq("role", "admin");

      if (!adminsError && admins && admins.length > 0) {
        const now = new Date().toISOString();
        const teamNames = deletedTeams?.map((team) => team.name).join(", ") ?? "-";

        const notifications = admins.map((admin) => ({
          id: crypto.randomUUID(),
          userId: admin.id,
          type: "system_cleanup",
          title: "Cleanup tim completed otomatis",
          description: `${deletedCount} tim completed telah dihapus otomatis setelah ${RETENTION_DAYS} hari. Tim yang dihapus: ${teamNames}.`,
          isRead: false,
          createdAt: now,
        }));

        const { error: notificationError } = await adminDb
          .from("Notification")
          .insert(notifications);

        if (notificationError) {
          console.error("[Cleanup] Failed to create admin notifications:", notificationError.message);
        }

        await Promise.allSettled(
          admins.map((admin) =>
            sendPushToUser(admin.id, {
              title: "Cleanup tim completed otomatis",
              body: `${deletedCount} tim completed telah dihapus otomatis setelah ${RETENTION_DAYS} hari.`,
              url: "/admin/staging",
            }),
          ),
        );
      } else if (adminsError) {
        console.error("[Cleanup] Failed to load admin users:", adminsError.message);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Deleted ${deletedCount} completed teams older than ${RETENTION_DAYS} days`,
        deletedTeamIds: deletedTeams?.map((t) => ({ id: t.id, name: t.name })) ?? [],
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Cleanup] Error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    description: "Cleanup cron job for completed teams",
    retention_days: RETENTION_DAYS,
    note: "POST with Bearer token to run cleanup",
  });
}
