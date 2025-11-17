import { getGoogleAccessToken } from "@/lib/google/auth";
import { retryWithBackoff, logger } from "@/lib/utils/logger";

const project = process.env.GOOGLE_CLOUD_PROJECT;
const location = process.env.GOOGLE_CLOUD_LOCATION ?? "us-central1";
const model =
  process.env.VEO_MODEL_NAME ?? "publishers/google/models/veo-3.0-generate";

function requireEnv(value: string | undefined, key: string) {
  if (!value) {
    throw new Error(`Missing ${key}`);
  }
  return value;
}

export async function requestVeoGeneration(params: {
  prompt: string;
  inputMediaUrls: string[];
  aspectRatio: string;
  lengthSeconds: number;
}): Promise<{ operationId: string; raw: any }> {
  const projectId = requireEnv(project, "GOOGLE_CLOUD_PROJECT");
  const modelName = model.startsWith("publishers/")
    ? model
    : `publishers/google/models/${model}`;
  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/${modelName}:predict`;
  const token = await getGoogleAccessToken();

  const payload = {
    instances: [
      {
        prompt: params.prompt,
        imageUris: params.inputMediaUrls,
        aspect_ratio: params.aspectRatio,
        output_video_length_seconds: params.lengthSeconds,
      },
    ],
  };

  const response = await retryWithBackoff(
    async () => {
      return await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    },
    {
      maxRetries: 2,
      initialDelay: 2000,
      onRetry: (error, attempt) => {
        logger.warn(`Veo generation retry attempt ${attempt}`, { error: error.message });
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    logger.error("Veo generation failed", new Error(text), {
      status: response.status,
      endpoint,
    });
    throw new Error(`Veo generation failed: ${text}`);
  }

  const json = await response.json();
  const operationId =
    json.predictionId ||
    json.name ||
    json.operationId ||
    json.output?.[0]?.id;
  if (!operationId) {
    logger.error("Unable to extract operationId from Veo response", undefined, { response: json });
    throw new Error("Unable to extract operationId from Veo response");
  }

  logger.info("Veo generation started", { operationId, prompt: params.prompt });
  return { operationId, raw: json };
}

export async function getVeoOperationStatus(operationId: string) {
  const projectId = requireEnv(project, "GOOGLE_CLOUD_PROJECT");
  const token = await getGoogleAccessToken();
  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/${operationId.startsWith("projects/") ? operationId : `projects/${projectId}/locations/${location}/operations/${operationId}`}`;

  const response = await retryWithBackoff(
    async () => {
      return await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    {
      maxRetries: 2,
      initialDelay: 1000,
      onRetry: (error, attempt) => {
        logger.warn(`Veo status check retry attempt ${attempt}`, { error: error.message, operationId });
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    logger.error("Failed to fetch Veo operation status", new Error(text), {
      status: response.status,
      operationId,
    });
    throw new Error(`Failed to fetch operation: ${text}`);
  }
  return response.json();
}
