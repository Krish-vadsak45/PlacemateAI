import { Client } from '@elastic/elasticsearch'

let elasticsearchClient: Client | null = null

/**
 * Get or create Elasticsearch client singleton
 */
export function getElasticsearchClient(): Client {
  if (!elasticsearchClient) {
    const url = process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
    const username = process.env.ELASTICSEARCH_USERNAME
    const password = process.env.ELASTICSEARCH_PASSWORD

    const clientConfig: any = {
      node: url,
    }

    // Add authentication if credentials are provided
    if (username && password) {
      clientConfig.auth = {
        username,
        password,
      }
    }

    // Disable SSL verification for development (remove in production)
    if (process.env.NODE_ENV === 'development') {
      clientConfig.tls = {
        rejectUnauthorized: false,
      }
    }

    elasticsearchClient = new Client(clientConfig)
  }

  return elasticsearchClient
}

/**
 * Check Elasticsearch connection health
 */
export async function checkElasticsearchHealth(): Promise<boolean> {
  try {
    const client = getElasticsearchClient()
    const health = await client.cluster.health()
    return health.status === 'green' || health.status === 'yellow'
  } catch (error) {
    console.error('Elasticsearch health check failed:', error)
    return false
  }
}

/**
 * Create placements index with mappings
 */
export async function createPlacementsIndex(): Promise<void> {
  const client = getElasticsearchClient()
  const indexName = 'placements'

  try {
    // Check if index exists
    const exists = await client.indices.exists({ index: indexName })

    if (exists) {
      console.log(`Index ${indexName} already exists`)
      return
    }

    // Create index with mappings and settings
    await client.indices.create({
      index: indexName,
      body: {
        mappings: {
          properties: {
            userId: { type: 'keyword' },
            companyName: {
              type: 'text',
              fields: {
                keyword: { type: 'keyword' },
                ngram: { type: 'text', analyzer: 'ngram_analyzer' },
              },
            },
            jobRole: {
              type: 'text',
              fields: {
                keyword: { type: 'keyword' },
                ngram: { type: 'text', analyzer: 'ngram_analyzer' },
              },
            },
            package: { type: 'keyword' },
            location: {
              type: 'text',
              fields: {
                keyword: { type: 'keyword' },
              },
            },
            status: { type: 'keyword' },
            applicationDeadline: { type: 'date' },
            assessmentDate: { type: 'date' },
            interviewDate: { type: 'date' },
            eligibility: {
              properties: {
                minimumCGPA: { type: 'float' },
                allowedBranches: { type: 'keyword' },
              },
            },
            emailSubject: { type: 'text' },
            emailBody: { type: 'text' },
            jobRequirements: {
              properties: {
                requiredSkills: { type: 'keyword' },
                preferredSkills: { type: 'keyword' },
                responsibilities: { type: 'text' },
                experienceLevel: { type: 'keyword' },
                educationRequirements: { type: 'text' },
                locationPreference: { type: 'text' },
              },
            },
            matchScore: { type: 'integer' },
            hasAttachments: { type: 'boolean' },
            hasCalendarEvent: { type: 'boolean' },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' },
          },
        },
        settings: {
          analysis: {
            analyzer: {
              ngram_analyzer: {
                type: 'custom',
                tokenizer: 'ngram_tokenizer',
                filter: ['lowercase'],
              },
            },
            tokenizer: {
              ngram_tokenizer: {
                type: 'ngram',
                min_gram: 2,
                max_gram: 3,
                token_chars: ['letter', 'digit'],
              },
            },
          },
        },
      },
    })

    console.log(`Index ${indexName} created successfully`)
  } catch (error) {
    console.error(`Error creating index ${indexName}:`, error)
    throw error
  }
}

/**
 * Delete placements index (use with caution)
 */
export async function deletePlacementsIndex(): Promise<void> {
  const client = getElasticsearchClient()
  const indexName = 'placements'

  try {
    await client.indices.delete({ index: indexName })
    console.log(`Index ${indexName} deleted successfully`)
  } catch (error) {
    console.error(`Error deleting index ${indexName}:`, error)
    throw error
  }
}

/**
 * Index a single placement document
 */
export async function indexPlacement(documentId: string, document: any): Promise<void> {
  const client = getElasticsearchClient()
  
  try {
    await client.index({
      index: 'placements',
      id: documentId,
      body: document,
    })
  } catch (error) {
    console.error(`Error indexing placement ${documentId}:`, error)
    throw error
  }
}

/**
 * Bulk index placements
 */
export async function bulkIndexPlacements(placements: Array<{ id: string; doc: any }>): Promise<void> {
  const client = getElasticsearchClient()

  try {
    const bulkBody = placements.flatMap(({ id, doc }) => [
      { index: { _index: 'placements', _id: id } },
      doc,
    ])

    await client.bulk({ body: bulkBody })
    console.log(`Bulk indexed ${placements.length} placements`)
  } catch (error) {
    console.error('Error bulk indexing placements:', error)
    throw error
  }
}

/**
 * Update a placement document
 */
export async function updatePlacement(documentId: string, partialDoc: any): Promise<void> {
  const client = getElasticsearchClient()

  try {
    await client.update({
      index: 'placements',
      id: documentId,
      body: { doc: partialDoc },
    })
  } catch (error) {
    console.error(`Error updating placement ${documentId}:`, error)
    throw error
  }
}

/**
 * Delete a placement document
 */
export async function deletePlacement(documentId: string): Promise<void> {
  const client = getElasticsearchClient()

  try {
    await client.delete({
      index: 'placements',
      id: documentId,
    })
  } catch (error) {
    console.error(`Error deleting placement ${documentId}:`, error)
    throw error
  }
}
