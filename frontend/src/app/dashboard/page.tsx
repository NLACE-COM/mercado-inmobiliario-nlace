import { createClient } from "@/utils/supabase/server"
import DashboardMapFilters from "@/components/DashboardMapFilters"

export const dynamic = 'force-dynamic'

interface DashboardProject {
    id: string;
    name: string;
    developer: string | null;
    commune: string | null;
    region: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    avg_price_uf: number | null;
    avg_price_m2_uf: number | null;
    min_price_uf: number | null;
    max_price_uf: number | null;
    total_units: number | null;
    sold_units: number | null;
    available_units: number | null;
    sales_speed_monthly: number | null;
    project_status: string | null;
    property_type: string | null;
    year: number | null;
    period: string | null;
    category: string | null;
    subsidy_type: string | null;
    construction_status: string | null;
    project_typologies?: Array<{
        bedrooms: number | null;
        bathrooms: number | null;
        typology_code: string | null;
    }> | null;
}

async function getDashboardData() {
    const supabase = await createClient()

    // Get data in batches to overcome row limits
    let allProjects: DashboardProject[] = []
    let from = 0
    let pageSize = 1000
    let hasMore = true

    while (hasMore) {
        const { data, error } = await supabase
            .from('projects')
            .select(`
                id, name, developer, commune, region, address,
                latitude, longitude, 
                avg_price_uf, avg_price_m2_uf, min_price_uf, max_price_uf,
                total_units, sold_units, available_units,
                sales_speed_monthly, project_status, property_type,
                year, period, category, subsidy_type, construction_status,
                project_typologies (
                    bedrooms,
                    bathrooms,
                    typology_code
                )
            `)
            .order('sales_speed_monthly', { ascending: false })
            .range(from, from + pageSize - 1)

        if (error) {
            console.error('Error fetching dashboard batch:', error)
            break
        }

        if (data && data.length > 0) {
            allProjects = [...allProjects, ...(data as DashboardProject[])]
            if (data.length < pageSize) {
                hasMore = false
            } else {
                from += pageSize
            }
        } else {
            hasMore = false
        }
    }

    return allProjects
}

export default async function DashboardPage() {
    const projects = await getDashboardData()

    return (
        <div>
            <DashboardMapFilters projects={projects as any[]} />
        </div>
    )
}
