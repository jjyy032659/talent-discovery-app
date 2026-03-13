/**
 * src/lib/db.ts — DynamoDB client and data access layer
 *
 * WHY DYNAMODB?
 * - Serverless: no connection pool management, handles millions of requests
 * - Pay-per-request pricing: $0.25 per million writes — essentially free for a personal app
 * - Free tier: 25 GB storage + 25 RCU/WCU provisioned (we use PAY_PER_REQUEST, so ~200M free)
 * - Single-digit millisecond latency at any scale
 * - AWS native: same IAM role our EC2 instance uses → no separate credentials
 *
 * WHY SINGLE-TABLE DESIGN?
 * - DynamoDB is optimized for accessing data by primary key (PK + SK).
 * - One table with composite keys can model multiple entity types efficiently.
 * - Reduces cost: one table = simpler IAM policy, fewer API calls.
 *
 * TABLE SCHEMA (single-table design):
 * ┌─────────────────────────┬───────────────────────────────┬────────────┐
 * │ PK (partition key)      │ SK (sort key)                 │ Data       │
 * ├─────────────────────────┼───────────────────────────────┼────────────┤
 * │ USER#<cognito-sub>      │ PROFILE#TALENT                │ TalentProfile│
 * │ USER#<cognito-sub>      │ ASSESSMENT#IKIGAI             │ IkigaiResult│
 * │ USER#<cognito-sub>      │ ASSESSMENT#SCENARIOS          │ ScenarioResults│
 * │ USER#<cognito-sub>      │ ASSESSMENT#ANTI_TALENT        │ AntiTalentResult│
 * │ USER#<cognito-sub>      │ ROADMAP#LATEST                │ Roadmap text│
 * └─────────────────────────┴───────────────────────────────┴────────────┘
 *
 * The PK + SK together form a unique composite key. All a user's data lives
 * under the same PK → one Query call fetches everything. No joins needed.
 *
 * WHY DOCUMENTCLIENT (not raw DynamoDBClient)?
 * - DocumentClient automatically marshals/unmarshals JS types:
 *   { name: "Alice", score: 95 } → { name: {S:"Alice"}, score: {N:"95"} }
 * - Without it, you'd write AttributeValue types manually for every field.
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import type { TalentProfile } from "@/types/talent-profile.types";
import type { IkigaiAnalysisResult } from "@/types/ikigai.types";
import type { AntiTalentResult } from "@/types/anti-talent.types";

// ─── Client Singleton ─────────────────────────────────────────────────────────
// WHY SINGLETON? In Next.js, each Server Action call is a separate invocation
// but within the same Node.js process. Reusing the client avoids re-initializing
// the HTTP connection pool on every request.

let _client: DynamoDBDocumentClient | null = null;

function getDocClient(): DynamoDBDocumentClient {
  if (_client) return _client;

  const raw = new DynamoDBClient({
    // In production (EC2), AWS_REGION is set via environment variable.
    // The EC2 instance role provides credentials automatically via IMDS
    // (Instance Metadata Service) — no ACCESS_KEY_ID/SECRET needed!
    //
    // In local development, use:
    //   aws configure (sets ~/.aws/credentials)
    // OR set AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY + AWS_REGION in .env.local
    region: process.env.AWS_REGION ?? "us-east-1",
  });

  // translateConfig: marshal/unmarshal JS ↔ DynamoDB types automatically
  _client = DynamoDBDocumentClient.from(raw, {
    marshallOptions: {
      // Convert undefined values to null (DynamoDB doesn't store undefined)
      convertClassInstanceToMap: true,
      // Remove keys with undefined values instead of throwing
      removeUndefinedValues: true,
    },
  });

  return _client;
}

// ─── Table Name ──────────────────────────────────────────────────────────────
// Set via environment variable so the same code works in dev/staging/prod.
// In production: injected into Docker container via SSM → env var
function tableName(): string {
  const name = process.env.DYNAMODB_TABLE_NAME;
  if (!name) throw new Error("DYNAMODB_TABLE_NAME environment variable not set");
  return name;
}

// ─── Key Builders ─────────────────────────────────────────────────────────────
// Centralized key construction prevents typos and makes it easy to see
// the full schema by reading these functions.

const pk = (userId: string) => `USER#${userId}`;

const SK = {
  TALENT_PROFILE: "PROFILE#TALENT",
  IKIGAI: "ASSESSMENT#IKIGAI",
  SCENARIOS: "ASSESSMENT#SCENARIOS",
  ANTI_TALENT: "ASSESSMENT#ANTI_TALENT",
  ROADMAP: "ROADMAP#LATEST",
} as const;

// ─── Generic Read/Write ──────────────────────────────────────────────────────

/**
 * Save any item to DynamoDB. PutCommand = upsert (create or replace).
 * We always add updatedAt for debugging in the DynamoDB console.
 */
async function putItem(userId: string, sk: string, data: Record<string, unknown>): Promise<void> {
  const client = getDocClient();
  await client.send(new PutCommand({
    TableName: tableName(),
    Item: {
      PK: pk(userId),
      SK: sk,
      ...data,
      updatedAt: new Date().toISOString(),
    },
  }));
}

/**
 * Fetch a single item by PK + SK. Returns null if not found.
 * GetCommand is the most efficient DynamoDB operation — O(1) by primary key.
 */
async function getItem<T>(userId: string, sk: string): Promise<T | null> {
  const client = getDocClient();
  const result = await client.send(new GetCommand({
    TableName: tableName(),
    Key: { PK: pk(userId), SK: sk },
  }));
  return (result.Item as T) ?? null;
}

/**
 * Fetch ALL items for a user in one Query call.
 * QueryCommand scans only one partition (userId) — very efficient.
 * Returns an empty array if the user has no data yet.
 */
async function queryUserItems(userId: string): Promise<Record<string, unknown>[]> {
  const client = getDocClient();
  const result = await client.send(new QueryCommand({
    TableName: tableName(),
    // KeyConditionExpression filters by partition key first (required for Query)
    KeyConditionExpression: "PK = :pk",
    ExpressionAttributeValues: { ":pk": pk(userId) },
  }));
  return (result.Items ?? []) as Record<string, unknown>[];
}

// ─── Talent Profile ────────────────────────────────────────────────────────────

export async function saveTalentProfile(userId: string, profile: Partial<TalentProfile>): Promise<void> {
  // lastUpdated as ISO string (DynamoDB doesn't have a native Date type)
  await putItem(userId, SK.TALENT_PROFILE, {
    ...profile,
    lastUpdated: new Date().toISOString(),
  });
}

export async function getTalentProfile(userId: string): Promise<Partial<TalentProfile> | null> {
  return getItem<Partial<TalentProfile>>(userId, SK.TALENT_PROFILE);
}

// ─── Ikigai Assessment ────────────────────────────────────────────────────────

export async function saveIkigaiResult(userId: string, result: IkigaiAnalysisResult): Promise<void> {
  await putItem(userId, SK.IKIGAI, result as unknown as Record<string, unknown>);
}

export async function getIkigaiResult(userId: string): Promise<IkigaiAnalysisResult | null> {
  return getItem<IkigaiAnalysisResult>(userId, SK.IKIGAI);
}

// ─── Anti-Talent Assessment ────────────────────────────────────────────────────

export async function saveAntiTalentResult(userId: string, result: AntiTalentResult): Promise<void> {
  await putItem(userId, SK.ANTI_TALENT, result as unknown as Record<string, unknown>);
}

export async function getAntiTalentResult(userId: string): Promise<AntiTalentResult | null> {
  return getItem<AntiTalentResult>(userId, SK.ANTI_TALENT);
}

// ─── Roadmap ─────────────────────────────────────────────────────────────────

export async function saveRoadmap(userId: string, markdownContent: string): Promise<void> {
  await putItem(userId, SK.ROADMAP, { content: markdownContent });
}

export async function getRoadmap(userId: string): Promise<string | null> {
  const item = await getItem<{ content: string }>(userId, SK.ROADMAP);
  return item?.content ?? null;
}

// ─── Load All User Data ────────────────────────────────────────────────────────

export interface AllUserData {
  talentProfile: Partial<TalentProfile> | null;
  ikigai: IkigaiAnalysisResult | null;
  antiTalent: AntiTalentResult | null;
  roadmap: string | null;
}

/**
 * Fetch all a user's data in ONE DynamoDB Query (not 4 separate GetItem calls).
 *
 * WHY: DynamoDB charges per read request. 1 Query < 4 GetItems in both
 * cost and latency. Single-table design makes this possible.
 */
export async function loadAllUserData(userId: string): Promise<AllUserData> {
  const items = await queryUserItems(userId);

  // Build a lookup map: SK → item data
  const bySK = Object.fromEntries(items.map((item) => [item.SK as string, item]));

  return {
    talentProfile: (bySK[SK.TALENT_PROFILE] as unknown as Partial<TalentProfile>) ?? null,
    ikigai: (bySK[SK.IKIGAI] as unknown as IkigaiAnalysisResult) ?? null,
    antiTalent: (bySK[SK.ANTI_TALENT] as unknown as AntiTalentResult) ?? null,
    roadmap: (bySK[SK.ROADMAP] as { content: string } | undefined)?.content ?? null,
  };
}
