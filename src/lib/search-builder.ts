import { getElasticsearchClient } from './elasticsearch'

export interface SearchFilters {
  q?: string
  status?: string[]
  company?: string[]
  location?: string[]
  tags?: string[]
  cgpaMin?: number
  cgpaMax?: number
  matchScoreMin?: number
  matchScoreMax?: number
  deadlineFrom?: string
  deadlineTo?: string
  hasAttachments?: boolean
  hasCalendarEvent?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface SearchResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  placements: any[]
  total: number
  page: number
  limit: number
  aggregations?: {
    status: { [key: string]: number }
    company: { [key: string]: number }
    location: { [key: string]: number }
    skills: { [key: string]: number }
  }
}

/**
 * Build Elasticsearch query from search filters
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildSearchQuery(filters: SearchFilters, userId: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const must: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: any[] = []

  // Always filter by userId
  filter.push({ term: { userId } })

  // Text search query
  if (filters.q) {
    must.push({
      multi_match: {
        query: filters.q,
        fields: [
          'companyName^3',
          'jobRole^2',
          'location^1.5',
          'emailSubject',
          'emailBody',
          'jobRequirements.responsibilities',
          'jobRequirements.requiredSkills',
          'jobRequirements.preferredSkills',
        ],
        type: 'best_fields',
        fuzziness: 'AUTO',
        operator: 'or',
      },
    })
  }

  // Status filter
  if (filters.status && filters.status.length > 0) {
    filter.push({ terms: { status: filters.status } })
  }

  // Company filter
  if (filters.company && filters.company.length > 0) {
    filter.push({ terms: { 'companyName.keyword': filters.company } })
  }

  // Location filter
  if (filters.location && filters.location.length > 0) {
    filter.push({ terms: { 'location.keyword': filters.location } })
  }

  // Tags filter
  if (filters.tags && filters.tags.length > 0) {
    filter.push({ terms: { 'tags.keyword': filters.tags } })
  }

  // CGPA range filter
  if (filters.cgpaMin !== undefined || filters.cgpaMax !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rangeQuery: any = {}
    if (filters.cgpaMin !== undefined) rangeQuery.gte = filters.cgpaMin
    if (filters.cgpaMax !== undefined) rangeQuery.lte = filters.cgpaMax
    filter.push({ range: { 'eligibility.minimumCGPA': rangeQuery } })
  }

  // Match score range filter
  if (filters.matchScoreMin !== undefined || filters.matchScoreMax !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rangeQuery: any = {}
    if (filters.matchScoreMin !== undefined) rangeQuery.gte = filters.matchScoreMin
    if (filters.matchScoreMax !== undefined) rangeQuery.lte = filters.matchScoreMax
    filter.push({ range: { matchScore: rangeQuery } })
  }

  // Deadline date range filter
  if (filters.deadlineFrom || filters.deadlineTo) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rangeQuery: any = {}
    if (filters.deadlineFrom) rangeQuery.gte = filters.deadlineFrom
    if (filters.deadlineTo) rangeQuery.lte = filters.deadlineTo
    filter.push({ range: { applicationDeadline: rangeQuery } })
  }

  // Boolean filters
  if (filters.hasAttachments !== undefined) {
    filter.push({ term: { hasAttachments: filters.hasAttachments } })
  }

  if (filters.hasCalendarEvent !== undefined) {
    filter.push({ term: { hasCalendarEvent: filters.hasCalendarEvent } })
  }

  // Build the query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {
    bool: {
      must: must.length > 0 ? must : [{ match_all: {} }],
      filter,
    },
  }

  return query
}

/**
 * Build sort configuration
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildSortConfig(sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc'): any[] {
  const order = sortOrder === 'asc' ? 'asc' : 'desc'

  switch (sortBy) {
    case 'deadline':
      return [{ applicationDeadline: { order, missing: '_last' } }]
    case 'matchScore':
      return [{ matchScore: { order, missing: '_last' } }]
    case 'company':
      return [{ 'companyName.keyword': { order } }]
    case 'createdAt':
      return [{ createdAt: { order } }]
    default:
      return [{ updatedAt: { order } }]
  }
}

/**
 * Build aggregations for faceted search
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildAggregations(): any {
  return {
    status: {
      terms: { field: 'status', size: 20 },
    },
    company: {
      terms: { field: 'companyName.keyword', size: 20 },
    },
    location: {
      terms: { field: 'location.keyword', size: 20 },
    },
    skills: {
      terms: { field: 'jobRequirements.requiredSkills', size: 20 },
    },
  }
}

/**
 * Execute search query
 */
export async function searchPlacements(
  filters: SearchFilters,
  userId: string
): Promise<SearchResult> {
  const client = getElasticsearchClient()
  const page = filters.page || 1
  const limit = filters.limit || 20
  const from = (page - 1) * limit

  const query = buildSearchQuery(filters, userId)
  const sort = buildSortConfig(filters.sortBy, filters.sortOrder)
  const aggregations = buildAggregations()

  try {
    const response = await client.search({
      index: 'placements',
      query,
      sort,
      from,
      size: limit,
      aggregations,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const placements = response.hits.hits.map((hit: any) => ({
      _id: hit._id,
      ...hit._source,
    }))

    const total = typeof response.hits.total === 'object' 
      ? response.hits.total.value 
      : response.hits.total || 0

    // Process aggregations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processedAggregations: any = {}
    if (response.aggregations) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const agg = response.aggregations as any
      if (agg.status?.buckets) {
        processedAggregations.status = agg.status.buckets.reduce(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (acc: any, bucket: any) => {
            acc[bucket.key] = bucket.doc_count
            return acc
          },
          {}
        )
      }
      if (agg.company?.buckets) {
        processedAggregations.company = agg.company.buckets.reduce(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (acc: any, bucket: any) => {
            acc[bucket.key] = bucket.doc_count
            return acc
          },
          {}
        )
      }
      if (agg.location?.buckets) {
        processedAggregations.location = agg.location.buckets.reduce(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (acc: any, bucket: any) => {
            acc[bucket.key] = bucket.doc_count
            return acc
          },
          {}
        )
      }
      if (agg.skills?.buckets) {
        processedAggregations.skills = agg.skills.buckets.reduce(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (acc: any, bucket: any) => {
            acc[bucket.key] = bucket.doc_count
            return acc
          },
          {}
        )
      }
    }

    return {
      placements,
      total,
      page,
      limit,
      aggregations: processedAggregations,
    }
  } catch (error) {
    console.error('Error executing search:', error)
    throw error
  }
}

/**
 * Autocomplete suggestions
 */
export async function getAutocompleteSuggestions(
  query: string,
  field: string,
  userId: string
): Promise<string[]> {
  const client = getElasticsearchClient()

  const fieldMapping: { [key: string]: string } = {
    companyName: 'companyName.ngram',
    jobRole: 'jobRole.ngram',
    location: 'location.keyword',
  }

  const esField = fieldMapping[field] || 'companyName.ngram'

  try {
    const response = await client.search({
      index: 'placements',
      query: {
        bool: {
          must: [
            { term: { userId } },
            {
              match: {
                [esField]: {
                  query,
                  fuzziness: 'AUTO',
                },
              },
            },
          ],
        },
      },
      size: 10,
      _source: [field],
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const suggestions = response.hits.hits.map((hit: any) => hit._source[field])
    
    // Remove duplicates
    return [...new Set(suggestions)]
  } catch (error) {
    console.error('Error getting autocomplete suggestions:', error)
    return []
  }
}
