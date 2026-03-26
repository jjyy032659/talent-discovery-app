// DynamoDB data access layer.
// Single-table design — all user data lives under one partition key so we
// can fetch everything in one Query instead of multiple GetItem calls.
//
// Table schema:
// ┌────────────────────┬────────────────────────┬────────────────────┐
// │ PK                 │ SK                     │ Data               │
// ├────────────────────┼────────────────────────┼────────────────────┤
// │ USER#<cognito-sub> │ PROFILE#TALENT         │ TalentProfile      │
// │ USER#<cognito-sub> │ ASSESSMENT#IKIGAI      │ IkigaiAnalysisResult│
// │ USER#<cognito-sub> │ ASSESSMENT#SCENARIOS   │ ScenarioResults    │
// │ USER#<cognito-sub> │ ASSESSMENT#ANTI_TALENT │ AntiTalentResult   │
// │ USER#<cognito-sub> │ ROADMAP#LATEST         │ Roadmap markdown   │
// └────────────────────┴────────────────────────┴────────────────────┘

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

// Reuse the same client across Server Action calls within the same process
let _client: DynamoDBDocumentClient | null = null;

function getDocClient(): DynamoDBDocumentClient {
  if (_client) return _client;

  const raw = new DynamoDBClient({
    // In production, the EC2 instance role provides credentials automatically.
    // Locally, set AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY in .env.local
    // or run `aws configure`.
    region: process.env.AWS_REGION ?? "us-east-1",
  });

  // DocumentClient handles JS ↔ DynamoDB type marshalling automatically
  _client = DynamoDBDocumentClient.from(raw, {
    marshallOptions: {
      convertClassInstanceToMap: true,
      removeUndefinedValues: true,
    },
  });

  return _client;
}

function tableName(): string {
  const name = process.env.DYNAMODB_TABLE_NAME;
  if (!name) throw new Error("DYNAMODB_TABLE_NAME environment variable not set");
  return name;
}

const pk = (userId: string) => `USER#${userId}`;

const SK = {
  TALENT_PROFILE: "PROFILE#TALENT",
  IKIGAI: "ASSESSMENT#IKIGAI",
  SCENARIOS: "ASSESSMENT#SCENARIOS",
  ANTI_TALENT: "ASSESSMENT#ANTI_TALENT",
  ROADMAP: "ROADMAP#LATEST",
} as const;

// PutCommand is an upsert — creates or replaces the item
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

async function getItem<T>(userId: string, sk: string): Promise<T | null> {
  const client = getDocClient();
  const result = await client.send(new GetCommand({
    TableName: tableName(),
    Key: { PK: pk(userId), SK: sk },
  }));
  return (result.Item as T) ?? null;
}

async function queryUserItems(userId: string): Promise<Record<string, unknown>[]> {
  const client = getDocClient();
  const result = await client.send(new QueryCommand({
    TableName: tableName(),
    KeyConditionExpression: "PK = :pk",
    ExpressionAttributeValues: { ":pk": pk(userId) },
  }));
  return (result.Items ?? []) as Record<string, unknown>[];
}

// ── Talent Profile ────────────────────────────────────────────────────────────

export async function saveTalentProfile(userId: string, profile: Partial<TalentProfile>): Promise<void> {
  await putItem(userId, SK.TALENT_PROFILE, {
    ...profile,
    lastUpdated: new Date().toISOString(),
  });
}

export async function getTalentProfile(userId: string): Promise<Partial<TalentProfile> | null> {
  return getItem<Partial<TalentProfile>>(userId, SK.TALENT_PROFILE);
}

// ── Ikigai ────────────────────────────────────────────────────────────────────

export async function saveIkigaiResult(userId: string, result: IkigaiAnalysisResult): Promise<void> {
  await putItem(userId, SK.IKIGAI, result as unknown as Record<string, unknown>);
}

export async function getIkigaiResult(userId: string): Promise<IkigaiAnalysisResult | null> {
  return getItem<IkigaiAnalysisResult>(userId, SK.IKIGAI);
}

// ── Anti-Talent ───────────────────────────────────────────────────────────────

export async function saveAntiTalentResult(userId: string, result: AntiTalentResult): Promise<void> {
  await putItem(userId, SK.ANTI_TALENT, result as unknown as Record<string, unknown>);
}

export async function getAntiTalentResult(userId: string): Promise<AntiTalentResult | null> {
  return getItem<AntiTalentResult>(userId, SK.ANTI_TALENT);
}

// ── Roadmap ───────────────────────────────────────────────────────────────────

export async function saveRoadmap(userId: string, markdownContent: string): Promise<void> {
  await putItem(userId, SK.ROADMAP, { content: markdownContent });
}

export async function getRoadmap(userId: string): Promise<string | null> {
  const item = await getItem<{ content: string }>(userId, SK.ROADMAP);
  return item?.content ?? null;
}

// ── Load All User Data ────────────────────────────────────────────────────────

export interface AllUserData {
  talentProfile: Partial<TalentProfile> | null;
  ikigai: IkigaiAnalysisResult | null;
  antiTalent: AntiTalentResult | null;
  roadmap: string | null;
}

// One Query covers all SK variants under a single PK — cheaper and faster
// than firing 4 separate GetItem calls.
export async function loadAllUserData(userId: string): Promise<AllUserData> {
  const items = await queryUserItems(userId);
  const bySK = Object.fromEntries(items.map((item) => [item.SK as string, item]));

  return {
    talentProfile: (bySK[SK.TALENT_PROFILE] as unknown as Partial<TalentProfile>) ?? null,
    ikigai: (bySK[SK.IKIGAI] as unknown as IkigaiAnalysisResult) ?? null,
    antiTalent: (bySK[SK.ANTI_TALENT] as unknown as AntiTalentResult) ?? null,
    roadmap: (bySK[SK.ROADMAP] as { content: string } | undefined)?.content ?? null,
  };
}
