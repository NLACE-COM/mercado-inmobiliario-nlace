import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for backfill operation

/**
 * POST /api/admin/backfill-metrics
 * Create initial snapshot of project metrics for historical tracking
 * 
 * This creates a baseline snapshot of current project metrics that can be
 * tracked over time. Should be run weekly via cron job for ongoing tracking.
 */
export async function POST(request: NextRequest) {
    // Require admin authentication
    const auth = await requireAdmin(request)
    if (auth.error) return auth.error

    try {
        const supabase = getSupabaseAdmin()

        console.log('[Backfill Metrics] Starting snapshot...')

        // 1. Fetch all active projects with available units
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('id, name, available_units, sold_units, total_units, sales_speed_monthly, avg_price_uf, avg_price_m2_uf')
            .gt('available_units', 0)

        if (projectsError) {
            console.error('[Backfill Metrics] Error fetching projects:', projectsError)
            return NextResponse.json(
                { error: 'Failed to fetch projects' },
                { status: 500 }
            )
        }

        if (!projects || projects.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No active projects found',
                stats: { processed: 0, created: 0, skipped: 0 }
            })
        }

        const recordedAt = new Date().toISOString()
        let processed = 0
        let created = 0
        let skipped = 0

        // 2. Create metric snapshots
        const metricsToInsert = []

        for (const project of projects) {
            processed++

            // Calculate months to sell out
            const monthsToSellOut = project.sales_speed_monthly && project.sales_speed_monthly > 0
                ? project.available_units / project.sales_speed_monthly
                : null

            metricsToInsert.push({
                project_id: project.id,
                recorded_at: recordedAt,
                stock: project.available_units || 0,
                sold_accumulated: project.sold_units || 0,
                sales_monthly: project.sales_speed_monthly || null,
                price_avg_uf: project.avg_price_uf || null,
                price_avg_m2: project.avg_price_m2_uf || null,
                months_to_sell_out: monthsToSellOut
            })
        }

        // 3. Bulk insert with conflict handling (don't duplicate if already exists for this date)
        if (metricsToInsert.length > 0) {
            // Insert in batches of 100 to avoid payload limits
            const batchSize = 100
            for (let i = 0; i < metricsToInsert.length; i += batchSize) {
                const batch = metricsToInsert.slice(i, i + batchSize)

                const { data, error: insertError } = await supabase
                    .from('project_metrics_history')
                    .upsert(batch, {
                        onConflict: 'project_id,recorded_at',
                        ignoreDuplicates: true
                    })
                    .select()

                if (insertError) {
                    console.error('[Backfill Metrics] Error inserting batch:', insertError)
                    // Continue with next batch even if one fails
                } else {
                    created += data?.length || 0
                }
            }
        }

        skipped = processed - created

        console.log('[Backfill Metrics] Complete:', { processed, created, skipped })

        return NextResponse.json({
            success: true,
            message: `Metrics snapshot complete. Processed ${processed} projects, created ${created} metric records, skipped ${skipped} (already exist).`,
            stats: {
                processed,
                created,
                skipped,
                recorded_at: recordedAt
            }
        })

    } catch (error: any) {
        console.error('[Backfill Metrics] Error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/admin/backfill-metrics
 * Get status of metrics history
 */
export async function GET(request: NextRequest) {
    // Require admin authentication
    const auth = await requireAdmin(request)
    if (auth.error) return auth.error

    try {
        const supabase = getSupabaseAdmin()

        // Get count and date range of metrics
        const { count, error: countError } = await supabase
            .from('project_metrics_history')
            .select('*', { count: 'exact', head: true })

        if (countError) {
            console.error('[Backfill Metrics] Error getting count:', countError)
        }

        // Get latest snapshot date
        const { data: latest, error: latestError } = await supabase
            .from('project_metrics_history')
            .select('recorded_at')
            .order('recorded_at', { ascending: false })
            .limit(1)
            .single()

        if (latestError && latestError.code !== 'PGRST116') {
            console.error('[Backfill Metrics] Error getting latest:', latestError)
        }

        // Get oldest snapshot date
        const { data: oldest, error: oldestError } = await supabase
            .from('project_metrics_history')
            .select('recorded_at')
            .order('recorded_at', { ascending: true })
            .limit(1)
            .single()

        if (oldestError && oldestError.code !== 'PGRST116') {
            console.error('[Backfill Metrics] Error getting oldest:', oldestError)
        }

        return NextResponse.json({
            total_records: count || 0,
            latest_snapshot: latest?.recorded_at || null,
            oldest_snapshot: oldest?.recorded_at || null,
            recommendation: count === 0
                ? 'Run POST /api/admin/backfill-metrics to create initial snapshot'
                : 'Set up weekly cron job to run POST /api/admin/backfill-metrics'
        })

    } catch (error: any) {
        console.error('[Backfill Metrics] Error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
